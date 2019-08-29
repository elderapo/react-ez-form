export enum InputType {
  Text = "text",
  Number = "number",
  Checkbox = "checkbox",

  Default = Text
}

export type InputValue<INPUT_TYPE extends InputType> = {
  [InputType.Number]: number;
  [InputType.Checkbox]: boolean;
  [InputType.Text]: string;
}[INPUT_TYPE];
