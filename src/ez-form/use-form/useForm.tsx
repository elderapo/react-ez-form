import { RefObject, useCallback, useMemo, useEffect, useRef } from "react";
import {
  addEventListener,
  noop,
  RemoveListenerFN,
  SyncOrAsync,
  useDOMNodeManager,
  useDOMRef,
  IUseDOMRefHookResult,
  useDOMRefShared
} from "../../utils";
import { ValidatorFN } from "../../validators";
import { EzFormTypedInputRefFN, InputType, InputValue } from "../shared";
import { parseInputValue, getInputValue, setInputValue } from "../use-input-value";
import { EzFormUnexpectedError } from "./errors";

export type InputConfig<
  INPUT_TYPE extends InputType,
  INPUT_VALUE extends InputValue<INPUT_TYPE> = InputValue<INPUT_TYPE>
> = {
  type: INPUT_TYPE;
  defaultValue?: INPUT_VALUE;
  format?: (input: INPUT_VALUE) => INPUT_VALUE;
  validators?: ValidatorFN<INPUT_TYPE>[];
};

export type InputConfigAny<T extends InputType = InputType> = T extends InputType
  ? InputConfig<T>
  : never;

export type InputConfigs = Record<string, InputConfigAny>;

export type InputInternalState<INPUT_NAME, INPUT_TYPE extends InputType> = {
  // name: INPUT_NAME;
  ref: RefObject<HTMLInputElement>;
  // value?: InputValue<INPUT_TYPE>;
  error?: React.ReactNode;
};

export type InputInternalStates<OPTIONS extends InputConfigs> = {
  [NAME in keyof OPTIONS]: InputInternalState<NAME, OPTIONS[keyof OPTIONS]["type"]>;
};

export interface IUseFormHookOptions<INPUT_CONFIGS extends InputConfigs> {
  inputs: INPUT_CONFIGS;
  onSubmit?: () => SyncOrAsync<void>;
  mapOnSubmitErrorToInput?: (err: Error) => keyof INPUT_CONFIGS | null;
}

export interface InputResult<INPUT_VALUE extends InputValue<InputType>>
  extends Readonly<{
    ref: EzFormTypedInputRefFN<INPUT_VALUE>;
    // value?: Readonly<INPUT_TYPE>;
    error?: React.ReactNode;
  }> {}

export type InputResults<OPTIONS extends InputConfigs> = {
  [P in keyof OPTIONS]: InputResult<InputValue<OPTIONS[P]["type"]>>;
};

export interface IUseFormHookResult<INPUT_CONFIGS extends InputConfigs> {
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  inputs: InputResults<INPUT_CONFIGS>;

  error: React.ReactNode | null;
  errors: React.ReactNode[];
}

const defaultOptions = Object.freeze({
  onSubmit: noop
});

export const useForm = <INPUT_CONFIGS extends InputConfigs>(
  _options: IUseFormHookOptions<INPUT_CONFIGS>
): IUseFormHookResult<INPUT_CONFIGS> => {
  const options = useMemo(() => {
    return Object.assign({}, defaultOptions, _options);
  }, []);

  const inputNames = useMemo<string[]>(() => Object.keys(options.inputs), [
    Object.keys(options.inputs)
      .sort()
      .join("::")
  ]);

  const getInputOptions = useCallback(
    (inputName: string): InputConfigAny => {
      const thisInputOptions = options.inputs[inputName];

      if (!thisInputOptions) {
        throw new EzFormUnexpectedError(`Tried to get options of inknown input(${inputName})?`);
      }

      return thisInputOptions;
    },
    [options]
  );

  const formatInputValue = useCallback(
    <INPUT_VALUE extends InputValue<InputType>>(
      inputName: string,
      value: INPUT_VALUE
    ): INPUT_VALUE => {
      const { format, type } = getInputOptions(inputName);

      if (format) {
        return format(parseInputValue(value, type) as never) as INPUT_VALUE;
      }

      return value;
    },
    [getInputOptions]
  );

  const domRefsMap = inputNames.reduce(
    (previous, current) => {
      return {
        ...previous,
        [current]: useDOMRefShared<HTMLInputElement>()
      };
    },
    {} as Record<string, IUseDOMRefHookResult<HTMLInputElement>>
  );

  // Thanks to this in case of input temporary input removal previous value of input will be used instead of defaultValue.
  const cachedValues = useRef<Map<string, InputValue<InputType> | null>>(new Map());

  inputNames.forEach(inputName => {
    useEffect(() => {
      const domRef = domRefsMap[inputName].domRef;

      if (!domRef) {
        return;
      }

      const inputOptions = getInputOptions(inputName);
      setInputValue(
        domRef,
        formatInputValue(
          inputName,
          cachedValues.current.has(inputName)
            ? cachedValues.current.get(inputName)
            : inputOptions.defaultValue
        )
      );

      if (domRef.type !== inputOptions.type) {
        domRef.type = inputOptions.type;
      }

      const removeListenerFNs: RemoveListenerFN[] = [];

      removeListenerFNs.push(
        addEventListener(domRef, "input", e => eventListenerHandler(inputName, e))
      );

      removeListenerFNs.push(
        addEventListener(domRef, "change", e => eventListenerHandler(inputName, e))
      );

      removeListenerFNs.push(
        addEventListener(domRef, "blur", e => eventListenerHandler(inputName, e))
      );

      return () => {
        cachedValues.current.set(inputName, getInputValue(domRef));
        removeListenerFNs.forEach(remove => remove());
      };
    }, [domRefsMap[inputName].domRef, formatInputValue]);
  });

  const eventListenerHandler = useCallback(
    (inputName: string, event: Event): void => {
      if (!(event.target instanceof HTMLInputElement)) {
        return;
      }

      const unformattedValue = getInputValue(event.target);
      const formattedValue = formatInputValue(inputName, unformattedValue);

      if (event.type === "input" || event.type === "change") {
        console.log("Intercepting input...");
        setInputValue(event.target, formattedValue);

        return;
      }

      if (event.type === "blur") {
        console.log("Validation...");

        return;
      }
    },
    [formatInputValue]
  );

  const errors: React.ReactNode[] = []; // inputNames.map(inputName => state[inputName].error).filter(err => err);

  return {
    handleSubmit: event => {
      event.preventDefault();
    },
    inputs: inputNames.reduce(
      (previous, current) => {
        return {
          ...previous,
          [current]: {
            ref: domRefsMap[current].setDomRef,
            error: null // tmp
          }
        };
      },
      {} as InputResults<INPUT_CONFIGS>
    ),
    error: errors[0] || null,
    errors: errors
  };
};
