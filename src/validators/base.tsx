import { SyncOrAsync } from "../utils";
import { InputType } from "../ez-form/use-form/InputType";
import { InputValueType } from "../ez-form";

export type NumericValidtorFN = (value: number) => SyncOrAsync<void>;
export type BooleanValidtorFN = (value: boolean) => SyncOrAsync<void>;
export type StringValidtorFN = (value: string) => SyncOrAsync<void>;

export type ValidatorFN<INPUT_TYPE extends InputType> = (
  val: InputValueType[INPUT_TYPE]
) => SyncOrAsync<void>;

// export type ValidatorFN<VALUE extends number | string | boolean> = VALUE extends number
//   ? NumericValidtorFN
//   : VALUE extends boolean
//   ? BooleanValidtorFN
//   : StringValidtorFN
