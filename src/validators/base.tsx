import { SyncOrAsync } from "../utils";
import { InputType } from "../ez-form/use-form/InputType";

export type NumericValidtorFN = (value: number) => SyncOrAsync<void>;
export type BooleanValidtorFN = (value: boolean) => SyncOrAsync<void>;
export type StringValidtorFN = (value: string) => SyncOrAsync<void>;

export type ValidatorType<INPUT_TYPE extends InputType> = INPUT_TYPE extends InputType.Number
  ? number
  : INPUT_TYPE extends InputType.Checkbox
  ? boolean
  : number;

export type ValidatorFN<INPUT_TYPE extends InputType> = (
  val: ValidatorType<INPUT_TYPE>
) => SyncOrAsync<void>;

// export type ValidatorFN<VALUE extends number | string | boolean> = VALUE extends number
//   ? NumericValidtorFN
//   : VALUE extends boolean
//   ? BooleanValidtorFN
//   : StringValidtorFN
