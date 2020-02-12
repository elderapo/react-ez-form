import { useMemo, useState } from "react";
import { InputType, InputValue, useNamedRef } from "../shared";
import { addEventListener, RemoveListenerFN } from "../utils";
import { fixInputValue, getInputValue, setInputValue } from "./helperFunctions";
import { UseFormInputsOptions, UseFormOptions, UseFormUniversalInputOptions } from "./options";
import {
  UseFormInputResult,
  UseFormInputsResult,
  UseFormResult,
  UseFormState,
  UseFormStateErrors
} from "./result";

export const useForm = <INPUTS_OPTIONS extends UseFormInputsOptions>(
  options: UseFormOptions<INPUTS_OPTIONS>
): UseFormResult<INPUTS_OPTIONS> => {
  const inputsOptions = useMemo<INPUTS_OPTIONS>(() => options.configure(), []);

  const [{ errors, runningValidatorsCount }, setState] = useState<UseFormState<INPUTS_OPTIONS>>({
    errors: {} as UseFormStateErrors<INPUTS_OPTIONS>,

    runningValidatorsCount: 0
  });

  const getInputOptions = (inputName: string): UseFormUniversalInputOptions => {
    const thisInputOptions = inputsOptions[inputName];

    if (!thisInputOptions) {
      throw new Error(`Tried to get options of inknown input(${inputName})!`);
    }

    return thisInputOptions;
  };

  const { getRefHandler, getNodeByName } = useNamedRef({
    onRef: (domNode, name) => {
      if (!(domNode instanceof HTMLInputElement)) {
        return;
      }

      const inputOptions = getInputOptions(name);
      if (!domNode.value && !domNode.checked) {
        setInputValue(domNode, formatInputValue(name, inputOptions.default));
      }

      if (domNode.type !== inputOptions.type) {
        // If there is no "type" prop in html input is treated as text
        domNode.type = inputOptions.type;
      }

      const removeListenerFNs: RemoveListenerFN[] = [];

      removeListenerFNs.push(
        addEventListener(domNode, "input", e => eventListenerHandler(name, e))
      );

      removeListenerFNs.push(addEventListener(domNode, "blur", e => eventListenerHandler(name, e)));

      return () => removeListenerFNs.forEach(remove => remove());
    }
  });

  const formatInputValue = <INPUT_VALUE extends InputValue<InputType>>(
    inputName: string,
    value: INPUT_VALUE
  ): INPUT_VALUE => {
    const { format, type } = getInputOptions(inputName);

    const fixedValue = fixInputValue(value, type);

    if (!format) {
      return fixedValue as INPUT_VALUE;
    }

    return format(fixedValue as never) as INPUT_VALUE;
  };

  const eventListenerHandler = (inputName: string, event: Event): void => {
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }

    const rawValue = getInputValue(event.target);
    const formattedValue = formatInputValue(inputName, rawValue);

    if (event.type === "input") {
      setInputValue(event.target, formattedValue);

      return;
    }

    if (event.type === "blur") {
      validateInput(inputName);

      return;
    }

    console.warn(`Received unknown event(${event.type})!`);
  };

  const renderError = (err: Error) => {
    // @TODO: use global config to translate/render error
    return err.message;
  };

  const validateInput = async (name: string): Promise<boolean> => {
    const inputOptions = getInputOptions(name);
    const node = getNodeByName(name);

    if (!node) {
      console.error(`Couldn't find dom node for input(${name})????`);
      return false;
    }

    if (!(node instanceof HTMLInputElement)) {
      console.error(`Found dom node is not an input???`);
      return false;
    }

    try {
      setState(state => ({
        ...state,
        runningValidatorsCount: state.runningValidatorsCount + 1
      }));

      for (const validator of inputOptions.validators || []) {
        await validator(getInputValue(node));
      }

      clearInputError(name);

      return true;
    } catch (ex) {
      handleInputError(name, ex);
      return false;
    } finally {
      setState(state => ({
        ...state,
        runningValidatorsCount: state.runningValidatorsCount - 1
      }));
    }
  };

  const validateInputs = async (): Promise<boolean> => {
    for (const name of Object.keys(inputsOptions)) {
      const success = await validateInput(name);

      if (!success) {
        return false;
      }
    }

    return true;
  };

  const handleInputError = (inputName: string, error: Error): void => {
    setState(state => ({
      ...state,
      errors: {
        ...state.errors,
        [inputName]: renderError(error)
      }
    }));
  };

  const clearInputError = (inputName: string) => {
    if (!errors[inputName]) {
      return;
    }

    setState(state => ({
      ...state,
      errors: {
        ...state.errors,
        [inputName]: null
      }
    }));
  };

  return {
    onSubmit: async e => {
      e.preventDefault();

      try {
        const success = await validateInputs();

        if (!success) {
          return;
        }

        await options.onSubmit();
      } catch (ex) {
        if (options.mapOnSubmitErrorToInput) {
          const erroredInputName = options.mapOnSubmitErrorToInput(ex);

          if (!erroredInputName) {
            console.warn("Couldn't map error to input!");
          }

          handleInputError(erroredInputName as string, ex);

          return;
        }

        throw ex;
      }
    },

    inputs: Object.keys(inputsOptions).reduce(
      (previous, current) => {
        const currentObj: UseFormInputResult<InputValue<InputType>> = {
          ref: getRefHandler(current),
          error: errors[current] || null
        };

        return {
          ...previous,
          [current]: currentObj
        };
      },
      {} as UseFormInputsResult<INPUTS_OPTIONS>
    ),

    isValidating: runningValidatorsCount > 0,

    error: Object.values(errors)[0] || null,
    errors: errors
  };
};
