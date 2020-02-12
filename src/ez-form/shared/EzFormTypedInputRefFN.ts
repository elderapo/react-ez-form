import { InputValue, InputType } from "../use-form";

// export type EzFormTypedInputRefObject<INPUT_TYPE extends InputValue<InputType>> = {
//   readonly current: HTMLInputElement | null;
//   readonly input__type?: INPUT_TYPE;
// };

export type EzFormTypedInputRefFN<INPUT_TYPE extends InputValue<InputType>> = React.Dispatch<
  React.SetStateAction<HTMLInputElement | null>
> & {
  readonly input__type?: INPUT_TYPE;
};
