import { InputValue, InputType } from "../shared";
import { InputValidator } from "./validators";

export type UseFormInputOptions<
  INPUT_TYPE extends InputType,
  INPUT_VALUE extends InputValue<INPUT_TYPE> = InputValue<INPUT_TYPE>
> = {
  type: INPUT_TYPE;
  default: INPUT_VALUE;

  format?: (input: INPUT_VALUE) => INPUT_VALUE;
  validators?: InputValidator[];
};

export type UseFormUniversalInputOptions<
  INPUT_TYPE extends InputType = InputType
> = INPUT_TYPE extends InputType ? UseFormInputOptions<INPUT_TYPE> : never;

export type UseFormInputsOptions = Record<string, UseFormUniversalInputOptions>;

export type UseFormOptions<INPUTS_OPTIONS extends UseFormInputsOptions> = {
  configure: () => INPUTS_OPTIONS;

  onSubmit: () => void | Promise<void>;
  mapOnSubmitErrorToInput?: (err: Error) => keyof INPUTS_OPTIONS | null;
};
