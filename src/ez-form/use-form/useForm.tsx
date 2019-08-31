import {
  createRef,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useLayoutEffect,
  Ref,
  MutableRefObject,
  useRef
} from "react";
import {
  addEventListener,
  noop,
  RemoveListenerFN,
  SyncOrAsync,
  useStatefulRef,
  useDOMNodeManager
} from "../../utils";
import { ValidatorFN } from "../../validators";
import { EzFormTypedInputRefObject, InputType, InputValue } from "../shared";
import { EzFormUnexpectedError } from "./errors";
import { fixInputValue } from "../use-input-value";

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
    ref: EzFormTypedInputRefObject<INPUT_VALUE>;
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
        return format(fixInputValue(value, type) as never) as INPUT_VALUE;
      }

      return value;
    },
    [getInputOptions]
  );

  // const domNodeRefs = useRef(
  //   inputNames.reduce(
  //     (previous, current) => {
  //       return {
  //         ...previous,
  //         [current]: undefined
  //       };
  //     },
  //     {} as Record<string, HTMLInputElement | undefined>
  //   )
  // );

  const { getNode, createRef } = useDOMNodeManager({
    onRefChange: (inputName, newNode) => {
      console.log("onRefChange", inputName, newNode);
      const domNode = getInputDOMNode(inputName);

      if (!domNode) {
        return;
      }

      const inputOptions = getInputOptions(inputName);
      updateInputDOMNodeValue(domNode, inputOptions.defaultValue);

      if (domNode.type !== inputOptions.type) {
        domNode.type = inputOptions.type;
      }

      const removeListenerFNs: RemoveListenerFN[] = [];

      removeListenerFNs.push(
        addEventListener(domNode, "input", e => eventListenerHandler(inputName, e))
      );

      removeListenerFNs.push(
        addEventListener(domNode, "blur", e => eventListenerHandler(inputName, e))
      );

      return () => removeListenerFNs.forEach(remove => remove());
    }
  });

  const getInputDOMNode = (name: string): HTMLInputElement => {
    return getNode(name) as HTMLInputElement;
  };

  const getInputDOMNodeValue = useCallback((node: HTMLInputElement):
    | InputValue<InputType>
    | undefined => {
    if (node.type === InputType.Checkbox) {
      return Boolean(node.value);
    }

    return String(node.value);
  }, []);

  const updateInputDOMNodeValue = useCallback(
    (node: HTMLInputElement, newValue: InputValue<InputType> | undefined): void => {
      if (typeof newValue === "undefined") {
        return;
      }

      if (typeof newValue === "boolean") {
        if (node.checked !== newValue) {
          node.checked = newValue;
        }
      } else {
        if (node.value !== newValue) {
          node.value = String(newValue);
        }
      }
    },
    []
  );

  const eventListenerHandler = useCallback(
    (inputName: string, event: Event): void => {
      if (!(event.target instanceof HTMLInputElement)) {
        return;
      }

      const targetType = event.target.type === "checkbox" ? "checked" : "value";
      const unformattedValue = event.target[targetType];
      const formattedValue = formatInputValue(inputName, unformattedValue);

      if (event.type === "input") {
        updateInputDOMNodeValue(event.target, formattedValue);
        // setState(state => ({ ...state }));

        return;
      }

      if (event.type === "blur") {
        console.log("VALIDATE?!");

        // // commit
        // updateSingleInputState(inputName, {
        //   value: formattedValue
        // });

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
            ref: createRef(current),
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
