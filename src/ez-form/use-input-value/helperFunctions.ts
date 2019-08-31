import { InputType, InputValue, EzFormTypedInputRefObject } from "../shared";

export const fixInputValue = <INPUT_TYPE extends InputType>(inputValue: any, type: INPUT_TYPE) => {
  if (type === InputType.Checkbox) {
    return Boolean(inputValue);
  }

  if (type === InputType.Number) {
    return Number(inputValue);
  }

  return String(inputValue);
};

export const getInputValue = <INPUT_VALUE extends InputValue<InputType>>(
  ref: EzFormTypedInputRefObject<INPUT_VALUE>
): INPUT_VALUE | undefined => {
  if (!ref.current) {
    return undefined;
  }

  return fixInputValue(ref.current[ref.current.type === "checkbox" ? "checked" : "value"], ref
    .current.type as InputType) as INPUT_VALUE;
};
