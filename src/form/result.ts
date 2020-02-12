import * as React from "react";
import { InputType, InputValue } from "../shared";
import { UseFormInputsOptions } from "./options";

export type UseFormInputResult<INPUT_VALUE extends InputValue<InputType>> = Readonly<{
  ref: React.LegacyRef<HTMLInputElement>;

  error?: React.ReactNode;
}>;

export type UseFormInputsResult<INPUTS_OPTIONS extends UseFormInputsOptions> = {
  [P in keyof INPUTS_OPTIONS]: UseFormInputResult<InputValue<INPUTS_OPTIONS[P]["type"]>>;
};

export type UseFormStateInputError = React.ReactNode;

export type UseFormStateErrors<INPUTS_OPTIONS extends UseFormInputsOptions> = Record<
  keyof INPUTS_OPTIONS,
  UseFormStateInputError | undefined
>;

export type UseFormState<INPUTS_OPTIONS extends UseFormInputsOptions> = {
  errors: UseFormStateErrors<INPUTS_OPTIONS>;

  runningValidatorsCount: number;
};

export type UseFormResult<INPUTS_OPTIONS extends UseFormInputsOptions> = {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;

  inputs: UseFormInputsResult<INPUTS_OPTIONS>;

  isValidating: boolean;

  error?: UseFormStateInputError | null;
  errors: UseFormStateErrors<INPUTS_OPTIONS>;
};
