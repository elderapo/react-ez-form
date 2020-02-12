import { InputType, InputValue } from "../shared";

export type InputValidator = <INPUT_TYPE extends InputType>(
  value: InputValue<INPUT_TYPE>
) => void | Promise<void>;
