import { useState } from "react";

export const useStatefulRef = <T>(): React.MutableRefObject<T | undefined> => {
  const [refValue, setRefValue] = useState<T | undefined>(undefined);

  return {
    set current(newValue: T | undefined) {
      setRefValue(newValue);
    },

    get current(): T | undefined {
      return refValue;
    }
  };
};
