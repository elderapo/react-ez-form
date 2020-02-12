import { useState } from "react";

export interface IUseDOMRefHookResult<HTML_ELEMENT extends HTMLElement> {
  domRef: HTML_ELEMENT | null;
  setDomRef: React.Dispatch<React.SetStateAction<HTML_ELEMENT | null>>;
}

export const useDOMRef = <HTML_ELEMENT extends HTMLElement>(): IUseDOMRefHookResult<
  HTML_ELEMENT
> => {
  const [domRef, setDomRef] = useState<HTML_ELEMENT | null>(null);

  return { domRef, setDomRef };
};
