import { createRef, RefObject, useMemo, useEffect, useState, useCallback } from "react";
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

const fixInputValueType = <INPUT_TYPE extends InputType>(
  value: string,
  type: INPUT_TYPE
): InputValueType[INPUT_TYPE] => {
  if (type === InputType.Checkbox) {
    return Boolean(value) as any;
  }

  if (type === InputType.Number) {
    return Number(value) as any;
  }

  return String(value) as any;
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

// type InputsState<INPUT_NAME extends string, INPUT_TYPE extends InputType> = {
//   [key in INPUT_NAME]: IInputState<INPUT_NAME, INPUT_TYPE>;
// };

type InputsState<INPUT_NAME extends string, INPUT_TYPE extends InputType> = IInputState<
  INPUT_NAME,
  INPUT_TYPE
>[];

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
      value:
        typeof thisInputOptions.defaultValue !== "undefined"
          ? thisInputOptions.format
            ? thisInputOptions.format(thisInputOptions.defaultValue)
            : thisInputOptions.defaultValue
          : thisInputOptions.defaultValue
    };
  };

  const [state, setState] = useState<InputsState<INPUT_NAME, INPUT_TYPE>>(() => {
    return options.inputs.map(option => {
      const inputState: IInputState<INPUT_NAME, INPUT_TYPE> = createState(option.name);

      return inputState;
    });
  });

  const updateSingleInputState = useCallback(
    (name: INPUT_NAME, newInputState: IInputState<INPUT_NAME, INPUT_TYPE>): void => {
      const newState = [...state];
      const index = newState.findIndex(item => item.name === name);

      newState[index] = newInputState;

      setState(newState);
    },
    [state]
  );

  const inputNameToDOMRefMap = useMemo(
    () => new Map<INPUT_NAME, RefObject<HTMLInputElement>>(),
    []
  );

  const getInputElementRef = useCallback(
    (name: INPUT_NAME): RefObject<HTMLInputElement> => {
      if (!inputNameToDOMRefMap.has(name)) {
        inputNameToDOMRefMap.set(name, createRef<HTMLInputElement>());
      }

      return inputNameToDOMRefMap.get(name)!;
    },
    [inputNameToDOMRefMap]
  );

  useEffect(() => {
    // @TODO: remove removed inputs and create states for new ones...
  });

  useEffect(() => {
    for (let inputState of state) {
      const ref = getInputElementRef(inputState.name);

      if (ref.current && typeof inputState.value !== "undefined") {
        if (inputState.type === InputType.Checkbox) {
          ref.current.checked = inputState.value as boolean;
        } else {
          ref.current.value = String(inputState.value);
        }
      }
    }
  }, state);

  const eventListenerHandler = useCallback(
    (previousState: IInputState<INPUT_NAME, INPUT_TYPE>, event: Event): void => {
      if (!(event.target instanceof HTMLInputElement)) {
        return;
      }

      const thisInputOptions = getInputOptions(previousState.name);
      const valueWithFixedType = fixInputValueType(event.target.value, previousState.type);

      if (event.type === "input") {
        const newValue = thisInputOptions.format
          ? thisInputOptions.format(valueWithFixedType)
          : valueWithFixedType;

        updateSingleInputState(previousState.name, {
          ...previousState,
          value: newValue
        });

        return;
      }

      if (event.type === "change") {
        const newValue = event.target.checked as InputValueType[INPUT_TYPE];

        updateSingleInputState(previousState.name, {
          ...previousState,
          value: newValue
        });
        return;
      }

      if (event.type === "blur") {
        console.log("VALIDATE?!");
        return;
      }
    },
    [state]
  );

  useEffect(() => {
    const removeListenerFNs: RemoveListenerFN[] = [];

    for (let inputState of state) {
      const ref = getInputElementRef(inputState.name);

      if (!ref.current) {
        continue;
      }

      // Sync state with dom
      if (ref.current.type !== inputState.type) {
        ref.current.type = inputState.type;
      }

      // Add listeners
      if (ref.current.type === InputType.Text || ref.current.type === InputType.Number) {
        removeListenerFNs.push(
          addEventListener(ref.current, "input", e => eventListenerHandler(inputState, e))
        );
      } else if (ref.current.type === InputType.Checkbox) {
        removeListenerFNs.push(
          addEventListener(ref.current, "change", e => eventListenerHandler(inputState, e))
        );
      }

      removeListenerFNs.push(
        addEventListener(ref.current, "blur", e => eventListenerHandler(inputState, e))
      );
    }

    return () => removeListenerFNs.forEach(remove => remove());
  }, [state]);

  const errors = state.map(item => item.error).filter(err => err);

  console.log("returning new result");

  return {
    handleSubmit: () => {
      //
    },
    inputs: state.reduce(
      (previous, current) => {
        const inputElementRef = getInputElementRef(current.name) as any;

        return {
          ...previous,
          [current.name]: {
            ref: inputElementRef,
            ...current
          }
        };
      },
      {} as U
    ),
    error: errors[0] || null,
    errors: errors
  };
};
