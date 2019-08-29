import { InputType, InputValue } from "../use-form/InputType";
import { ValidatorFN } from "../../validators";
import { RefObject, createRef, useState, useCallback, useEffect } from "react";
import { SyncOrAsync, noop, usePrevious, RemoveListenerFN, addEventListener } from "../../utils";

export type InputConfig<
  INPUT_TYPE extends InputType,
  INPUT_VALUE extends InputValue<INPUT_TYPE> = InputValue<INPUT_TYPE>
> = {
  type: INPUT_TYPE;
  defaultValue?: INPUT_VALUE;
  format?: (input: INPUT_VALUE) => INPUT_VALUE;
  validators?: ValidatorFN<INPUT_TYPE>[];
};

export type InputConfigAny =
  | InputConfig<InputType.Number>
  | InputConfig<InputType.Checkbox>
  | InputConfig<InputType.Text>;

export type InputConfigs = Record<string, InputConfigAny>;

export type InputInternalState<INPUT_NAME, INPUT_TYPE extends InputType> = {
  name: INPUT_NAME;
  ref: RefObject<HTMLInputElement>;
  value?: InputValue<INPUT_TYPE>;
  error?: React.ReactNode;
};

export type InputInternalStates<OPTIONS extends InputConfigs> = {
  [NAME in keyof OPTIONS]: InputInternalState<NAME, OPTIONS[keyof OPTIONS]["type"]>;
};

interface InputResultWriteable<INPUT_TYPE extends InputValue<InputType>> {
  ref: RefObject<HTMLInputElement>;
  value?: Readonly<INPUT_TYPE>;
  error?: React.ReactNode;
}

export interface InputResult<INPUT_TYPE extends InputValue<InputType>>
  extends Readonly<InputResultWriteable<INPUT_TYPE>> {}

export type InputResults<OPTIONS extends InputConfigs> = {
  [P in keyof OPTIONS]: InputResult<InputValue<OPTIONS[P]["type"]>>;
};

export interface IUseFormHookOptions<INPUT_CONFIGS extends InputConfigs> {
  inputs: INPUT_CONFIGS;
  onSubmit?: () => SyncOrAsync<void>;
  mapOnSubmitErrorToInput?: (err: Error) => keyof INPUT_CONFIGS | null;
  validateInputOnBlur?: boolean;
}

export interface IUseFormHookResult<INPUT_CONFIGS extends InputConfigs> {
  handleSubmit: () => void;
  inputs: InputResults<INPUT_CONFIGS>;

  error: React.ReactNode | null;
  errors: React.ReactNode[];
}

const defaultOptions = Object.freeze({
  onSubmit: noop,
  validateInputOnBlur: true
});

export const useForm = <INPUT_CONFIGS extends InputConfigs>(
  _options: IUseFormHookOptions<INPUT_CONFIGS>
): IUseFormHookResult<INPUT_CONFIGS> => {
  const inputInternalStates: InputInternalStates<INPUT_CONFIGS> = null as any;

  const options = Object.assign({}, defaultOptions, _options);

  const currentInputNames = Object.keys(options.inputs);
  const previousInputNames = usePrevious(currentInputNames);

  const getInputOptions = useCallback(
    (name: string): InputConfigAny => {
      const thisInputOptions = options.inputs[name];
      console.log(options.inputs, name);

      if (!thisInputOptions) {
        throw new Error("Shouldn't happen?");
      }

      return thisInputOptions;
    },
    [options]
  );

  const createState = <NAME extends string, INPUT_TYPE extends InputType>(
    name: NAME,
    type: InputType
  ): InputInternalState<NAME, INPUT_TYPE> => {
    const thisInputOptions = getInputOptions(name);

    return {
      name,
      error: null,
      ref: createRef<HTMLInputElement>(),
      value: thisInputOptions.defaultValue as InputValue<INPUT_TYPE>
      //   value:
      //     typeof thisInputOptions.defaultValue !== "undefined"
      //       ? thisInputOptions.format
      //         ? thisInputOptions.format(thisInputOptions.defaultValue)
      //         : thisInputOptions.defaultValue
      //       : thisInputOptions.defaultValue
    };
  };

  const [state, setState] = useState<InputInternalStates<INPUT_CONFIGS>>(() => {
    return Object.keys(options.inputs).reduce(
      (previousValue, currentValue) => {
        const options = getInputOptions(currentValue);

        return {
          ...previousValue,
          [currentValue]: createState(currentValue, options.type)
        };
      },
      {} as InputInternalStates<INPUT_CONFIGS>
    );
  });

  const updateSingleInputState = useCallback(
    (name: string, newInputState: InputInternalState<string, InputType>): void => {
      const newState = { ...state } as any;

      newState[name] = newInputState;

      setState(newState);
    },
    [state]
  );

  useEffect(() => {
    for (let inputName of Object.keys(state)) {
      const inputState = state[inputName];
      const inputOptons = getInputOptions(inputName);

      const ref = inputState.ref;

      if (ref && ref.current && typeof inputState.value !== "undefined") {
        if (inputOptons.type === InputType.Checkbox) {
          ref.current.checked = inputState.value as boolean;
        } else {
          ref.current.value = String(inputState.value);
        }
      }
    }
  }, [state]);

  const eventListenerHandler = useCallback(
    (previousState: InputInternalState<string, InputType>, event: Event): void => {
      if (!(event.target instanceof HTMLInputElement)) {
        return;
      }

      const thisInputOptions = getInputOptions(previousState.name);
      const valueWithFixedType = fixInputValueType(event.target.value, thisInputOptions.type);

      if (event.type === "input") {
        const newValue = thisInputOptions.format
          ? (thisInputOptions as any).format(valueWithFixedType)
          : valueWithFixedType;

        updateSingleInputState(previousState.name, {
          ...previousState,
          value: newValue
        });

        return;
      }

      if (event.type === "change") {
        const newValue = event.target.checked as InputValue<InputType>;

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

    for (let inputName of Object.keys(state)) {
      const inputState = state[inputName];
      const inputOptons = getInputOptions(inputName);

      const ref = inputState.ref;

      if (!ref.current) {
        continue;
      }

      // Sync state with dom
      if (ref.current.type !== inputOptons.type) {
        ref.current.type = inputOptons.type;
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

  const errors = Object.keys(state)
    .map(inputName => state[inputName].error)
    .filter(err => err);

  return {
    handleSubmit: () => {
      //
    },
    inputs: Object.keys(state)
      .map(name => state[name])
      .reduce(
        (previous, current) => {
          return {
            ...previous,
            [current.name]: {
              ref: current.ref,
              value: current.value,
              error: current.error
            }
          };
        },
        {} as InputResults<INPUT_CONFIGS>
      ),
    error: errors[0] || null,
    errors: errors
  };
};

const fixInputValueType = <INPUT_TYPE extends InputType>(
  value: string,
  type: INPUT_TYPE
): InputValue<INPUT_TYPE> => {
  if (type === InputType.Checkbox) {
    return Boolean(value) as any;
  }

  if (type === InputType.Number) {
    return Number(value) as any;
  }

  return String(value) as any;
};
