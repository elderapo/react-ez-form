import { createRef, RefObject, useMemo, useEffect } from "react";
import { noop, SyncOrAsync, usePrevious } from "../../utils";
import { ValidatorType, ValidatorFN } from "../../validators";
import { InputType } from "./InputType";

export interface IInputOptions<
  INPUT_NAME extends string,
  INPUT_TYPE extends InputType = InputType.Default
> {
  name: INPUT_NAME;
  type?: INPUT_TYPE;
  format?: (input: ValidatorType<INPUT_TYPE>) => ValidatorType<INPUT_TYPE>;
  validators: ValidatorFN<INPUT_TYPE>[];
}

export interface IInputState<INPUT_NAME extends string> {
  name: INPUT_NAME;
  error: React.ReactNode | null;
}

export interface IInputData<INPUT_NAME extends string> extends IInputState<INPUT_NAME> {
  ref: RefObject<HTMLInputElement>;
}

export interface IUseFormHookOptions<INPUT_NAME extends string> {
  inputs: IInputOptions<INPUT_NAME>[];
  onSubmit?: () => SyncOrAsync<void>;
  mapOnSubmitErrorToInput?: (err: Error) => INPUT_NAME | null;
  validateInputOnBlur?: boolean;
}

export interface IUseFormHookResult<
  INPUT_NAME extends string,
  INPUTS = { [INPUT_NAME_KEY in INPUT_NAME]: IInputData<INPUT_NAME_KEY> }
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

export const useForm = <T extends string, U = { [K in T]: IInputData<K> }>(
  _options: IUseFormHookOptions<T>
): IUseFormHookResult<T, U> => {
  const options = Object.assign({}, defaultOptions, _options);
  const currentInputNames = options.inputs.map(item => item.name);
  const previousInputNames = usePrevious(currentInputNames);

  const inputNameToDOMRefMap = useMemo(() => new Map<string, RefObject<HTMLInputElement>>(), []);
  const domRefToInputState = useMemo(() => new WeakMap<HTMLInputElement, IInputState<T>>(), []);

  const getInputElementRef = (name: T): RefObject<HTMLInputElement> => {
    if (!inputNameToDOMRefMap.has(name)) {
      inputNameToDOMRefMap.set(name, createRef<HTMLInputElement>());
    }

    return inputNameToDOMRefMap.get(name)!;
  };

  useEffect(() => {
    // Free state of removed inputs...
    // Not omptimal but should work...

    if (!previousInputNames) {
      return;
    }

    for (let oldInputName of previousInputNames) {
      if (!currentInputNames.includes(oldInputName)) {
        inputNameToDOMRefMap.delete(oldInputName);
      }
    }
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
        const thisInputState = inputElementRef.current
          ? domRefToInputState.get(inputElementRef.current)
          : null;

        const currentItem: IInputData<T> = {
          ref: inputElementRef,
          name: current.name,
          error: thisInputState ? thisInputState.error : null
        };

        return {
          ...previous,
          [current.name]: currentItem
        };
      },
      {} as U
    ),
    error: errors[0] || null,
    errors: errors
  };
};
