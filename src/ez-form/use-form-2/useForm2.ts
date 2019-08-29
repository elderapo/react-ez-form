import { InputType } from "../use-form/InputType";

export type InputValue<INPUT_TYPE extends InputType> = {
  [InputType.Number]: number;
  [InputType.Checkbox]: boolean;
  [InputType.Text]: string;
}[INPUT_TYPE];

export type InputConfig<
  INPUT_TYPE extends InputType,
  INPUT_VALUE extends InputValue<INPUT_TYPE> = InputValue<INPUT_TYPE>
> = {
  type: INPUT_TYPE;
  defaultValue?: INPUT_VALUE;
  format?: (input: INPUT_VALUE) => INPUT_VALUE;
};

export type InputConfigAny =
  | InputConfig<InputType.Number>
  | InputConfig<InputType.Checkbox>
  | InputConfig<InputType.Text>;

export type InputConfigs = Record<string, InputConfigAny>;

export interface InputResult<T extends InputValue<InputType>> {
  getValue: () => T;
  setValue: (newValue: T) => void;
}

export type InputResults<OPTIONS extends InputConfigs> = {
  [P in keyof OPTIONS]: InputResult<InputValue<OPTIONS[P]["type"]>>;
};

export const useForm2 = <OPTIONS extends InputConfigs>(options: OPTIONS): InputResults<OPTIONS> => {
  return null as any;
};
