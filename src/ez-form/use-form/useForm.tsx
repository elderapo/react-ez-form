import { createRef, RefObject, useMemo, useEffect } from "react";
import { noop, SyncOrAsync, usePrevious } from "../../utils";
import { ValidatorFN } from "../../validators";
import { InputType } from "./InputType";
import { RemoveListenerFN, addEventListener } from "../../utils/addEventListener";

// export type InputValueType<INPUT_TYPE extends InputType> = INPUT_TYPE extends InputType.Number
//   ? number
//   : INPUT_TYPE extends InputType.Checkbox
//   ? boolean
//   : number;

export type InputValueType = {
  [InputType.Number]: number;
  [InputType.Text]: string;
  [InputType.Checkbox]: boolean;

  [InputType.Default]: string;
};

export interface IInputOptions<INPUT_NAME extends string, INPUT_TYPE extends InputType> {
  name: INPUT_NAME;
  type: INPUT_TYPE;
  format?: (input: InputValueType[INPUT_TYPE]) => InputValueType[INPUT_TYPE];
  validators?: ValidatorFN<INPUT_TYPE>[];
  defaultValue?: InputValueType[INPUT_TYPE];
}

export interface IInputState<INPUT_NAME extends string, INPUT_TYPE extends InputType> {
  error: React.ReactNode | null;
  name: INPUT_NAME;
  type: INPUT_TYPE;

  value?: InputValueType[INPUT_TYPE];
}

export interface IInputData<INPUT_NAME extends string, INPUT_TYPE extends InputType>
  extends IInputState<INPUT_NAME, INPUT_TYPE> {
  ref: RefObject<HTMLInputElement>;
}

export interface IUseFormHookOptions<INPUT_NAME extends string, INPUT_TYPE extends InputType> {
  inputs: IInputOptions<INPUT_NAME, INPUT_TYPE>[];
  onSubmit?: () => SyncOrAsync<void>;
  mapOnSubmitErrorToInput?: (err: Error) => INPUT_NAME | null;
  validateInputOnBlur?: boolean;
}

export interface IUseFormHookResult<
  INPUT_NAME extends string,
  INPUT_TYPE extends InputType,
  INPUTS = { [INPUT_NAME_KEY in INPUT_NAME]: IInputData<INPUT_NAME_KEY, INPUT_TYPE> }
> {
  handleSubmit: () => void;
  inputs: INPUTS;

  error: React.ReactNode | null;
  errors: React.ReactNode[];
}

const defaultOptions = Object.freeze({
  onSubmit: noop,
  validateInputOnBlur: true
});

export const useForm = <
  INPUT_NAME extends string,
  INPUT_TYPE extends InputType,
  U = { [K in INPUT_NAME]: IInputData<K, any> }
>(
  _options: IUseFormHookOptions<INPUT_NAME, INPUT_TYPE>
): IUseFormHookResult<INPUT_NAME, INPUT_TYPE, U> => {
  const options = Object.assign({}, defaultOptions, _options);

  const currentInputNames = options.inputs.map(item => item.name);
  const previousInputNames = usePrevious(currentInputNames);

  const inputNameToDOMRefMap = useMemo(() => new Map<string, RefObject<HTMLInputElement>>(), []);
  const domRefToInputState = useMemo(
    () => new WeakMap<HTMLInputElement, IInputState<INPUT_NAME, INPUT_TYPE>>(),
    []
  );

  const getInputElementRef = (name: INPUT_NAME): RefObject<HTMLInputElement> => {
    if (!inputNameToDOMRefMap.has(name)) {
      inputNameToDOMRefMap.set(name, createRef<HTMLInputElement>());
    }

    return inputNameToDOMRefMap.get(name)!;
  };

  const getInputState = (el: HTMLInputElement): IInputState<INPUT_NAME, INPUT_TYPE> | null => {
    if (!domRefToInputState.has(el)) {
      return null;
    }

    return domRefToInputState.get(el)!;
  };

  const getInputOptions = (name: INPUT_NAME): IInputOptions<INPUT_NAME, INPUT_TYPE> => {
    const thisInputOptions = options.inputs.find(item => item.name === name);

    if (!thisInputOptions) {
      throw new Error("Shouldn't happen?");
    }

    return thisInputOptions;
  };

  const createState = (name: INPUT_NAME): IInputState<INPUT_NAME, INPUT_TYPE> => {
    const thisInputOptions = getInputOptions(name);

    return {
      error: null,
      name,
      type: thisInputOptions.type,
      value: thisInputOptions.defaultValue
    };
  };

  useEffect(() => {
    // Not omptimal but should work...

    for (const currentInputName of currentInputNames) {
      const ref = inputNameToDOMRefMap.get(currentInputName);

      if (!ref || !ref.current) {
        continue;
      }

      const previousState = domRefToInputState.get(ref.current);

      const thisInputOptions = getInputOptions(currentInputName);

      domRefToInputState.set(ref.current, {
        error: previousState ? previousState.error : null,
        name: currentInputName,
        type: thisInputOptions.type,
        value: previousState ? previousState.value : thisInputOptions.defaultValue
      });
    }

    if (!previousInputNames) {
      return;
    }
    // Free state of removed inputs...

    for (let oldInputName of previousInputNames) {
      if (!currentInputNames.includes(oldInputName)) {
        inputNameToDOMRefMap.delete(oldInputName);
      }
    }
  });

  useEffect(() => {
    const removeListenerFNs: RemoveListenerFN[] = [];

    inputNameToDOMRefMap.forEach(item => {
      const ref = item.current;

      if (!ref) {
        return;
      }

      const state = getInputState(ref);

      if (!state) {
        throw new Error("Shouldnt happen");
      }

      if (typeof state.value !== "undefined") {
        ref.value = String(state.value);
      }

      // @TODO: here add handler onChange for checkboxes?

      removeListenerFNs.push(
        addEventListener(ref, "input", (e: Event): void => {
          if (e.target instanceof HTMLInputElement) {
            console.log(e.target.value);
          }
        })
      );

      removeListenerFNs.push(
        addEventListener(ref, "blur", (e: Event): void => {
          if (e.target instanceof HTMLInputElement) {
            console.log("VALIDATION?");
          }
        })
      );
    });

    return () => removeListenerFNs.forEach(remove => remove());
  });

  // @TODO: push error from onSubmit to this array?
  const errors = options.inputs
    .map(({ name }) => getInputElementRef(name))
    .filter(ref => ref.current)
    .map(ref => domRefToInputState.get(ref.current!))
    .filter(state => !!state)
    .map(state => state!.error);

  return {
    handleSubmit: () => {
      //
    },
    inputs: options.inputs.reduce(
      (previous, current) => {
        const inputElementRef = getInputElementRef(current.name);
        let inputState = inputElementRef.current ? getInputState(inputElementRef.current) : null;

        if (!inputState) {
          inputState = createState(current.name);
        }

        const inputData: IInputData<INPUT_NAME, INPUT_TYPE> = {
          ref: inputElementRef,
          ...inputState
        };

        return {
          ...previous,
          [current.name]: inputData
        };
      },
      {} as U
    ),
    error: errors[0] || null,
    errors: errors
  };
};
