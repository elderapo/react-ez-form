import { InputType, InputValue } from "../shared";

export const parseInputValue = <INPUT_TYPE extends InputType>(
  inputValue: any,
  type: INPUT_TYPE
) => {
  if (type === InputType.Checkbox) {
    return Boolean(inputValue);
  }

  if (type === InputType.Number) {
    return Number(inputValue);
  }

  return String(inputValue);
};

export const getInputValueKey = <INPUT_TYPE extends InputType>(
  type: INPUT_TYPE
): "checked" | "value" => {
  return type === InputType.Checkbox ? "checked" : "value";
};

export const getInputValue = <INPUT_VALUE extends InputValue<InputType>>(
  domNode: HTMLInputElement
): INPUT_VALUE | null => {
  const valueKey = getInputValueKey(domNode.type as InputType);

  return (domNode[valueKey] as INPUT_VALUE) || null;
};

export const setInputValue = <INPUT_VALUE extends InputValue<InputType>>(
  domNode: HTMLInputElement,
  value: INPUT_VALUE
): void => {
  const valueKey = getInputValueKey(domNode.type as InputType);

  (domNode as any)[valueKey] = value;
};
