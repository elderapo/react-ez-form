import { InputType, InputValue } from "../shared";

export const fixInputValue = <INPUT_TYPE extends InputType>(inputValue: any, type: INPUT_TYPE) => {
  if (type === InputType.Checkbox) {
    return Boolean(inputValue);
  }

  if (type === InputType.Number) {
    return Number(inputValue);
  }

  return String(inputValue);
};

export const getInputValueKey = <INPUT_TYPE extends InputType>(inputType: INPUT_TYPE) => {
  if (inputType === InputType.Checkbox) {
    return "checked";
  }

  return "value";
};

export const setInputValue = <
  INPUT_TYPE extends InputType,
  INPUT_VALUE extends InputValue<INPUT_TYPE>
>(
  domNode: HTMLInputElement,
  value: INPUT_VALUE
): void => {
  const type = domNode.type as InputType;
  const inputValueKey = getInputValueKey(type);

  (domNode as any)[inputValueKey] = fixInputValue(value, type);
};

export const getInputValue = <INPUT_TYPE extends InputType>(
  domNode: HTMLInputElement
): InputValue<INPUT_TYPE> => {
  return domNode[getInputValueKey(domNode.type as InputType)] as InputValue<INPUT_TYPE>;
};
