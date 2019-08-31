import { useCallback, useEffect, useState } from "react";
import { addEventListener } from "../../utils";
import { EzFormTypedInputRefObject } from "../shared";
import { InputType, InputValue } from "../use-form";
import { getInputValue } from "./helperFunctions";

export const useInputValue = <INPUT_VALUE extends InputValue<InputType>>(
  ref: EzFormTypedInputRefObject<INPUT_VALUE>
): INPUT_VALUE | undefined => {
  const [value, setValue] = useState<INPUT_VALUE | undefined>(undefined);

  const smartUpdateValue = useCallback(
    (newValue: INPUT_VALUE | undefined): void => {
      if (value === newValue) {
        return;
      }

      setValue(newValue);
    },
    [value]
  );

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const update = (): void => smartUpdateValue(getInputValue(ref));

    update();

    return addEventListener(ref.current, "input", update);
  }, [ref.current, smartUpdateValue]);

  return value;
};
