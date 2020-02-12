export enum InputType {
  Text = "text",
  Number = "number",
  Checkbox = "checkbox",

  Default = Text
}

export type InputTypes = {
  [InputType.Number]: number;
  [InputType.Checkbox]: boolean;
  [InputType.Text]: string;
};

export type InputValue<IT extends InputType> = InputTypes[IT];
