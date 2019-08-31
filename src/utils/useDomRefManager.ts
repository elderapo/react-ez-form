import { MutableRefObject, useRef, useCallback } from "react";
import { Deferred } from "ts-deferred";
import { debounce } from "lodash";

export type NullableHTMLNode = HTMLElement | null;

export type IUseDOMNodeManagerOptions = {
  onRefChange: (name: string, newValue: NullableHTMLNode) => void | (() => void);
};

export type IUseDOMNodeManagerHookResult = {
  createRef: (name: string) => MutableRefObject<NullableHTMLNode>;
  getNode: (name: string) => NullableHTMLNode;
};

export const useDOMNodeManager = (
  options: IUseDOMNodeManagerOptions
): IUseDOMNodeManagerHookResult => {
  const domNodeRefs = useRef<Record<string, NullableHTMLNode>>({});
  const changeDefersRefs = useRef<Record<string, Deferred<void>>>({});

  const createRef = (name: string): MutableRefObject<NullableHTMLNode> => {
    let values: NullableHTMLNode[] = [];
    let previousValue: NullableHTMLNode = null;

    const process = (newValue: NullableHTMLNode): void => {
      if (!previousValue) {
        previousValue = getNode(name);
      }

      values.push(newValue);

      finish();
    };

    const finish = debounce(() => {
      const newValue = values[values.length - 1];

      if (values.length === 2 && values[0] && !values[1]) {
        return;
      }

      if (newValue === previousValue) {
        values = [];
        return;
      }

      if (changeDefersRefs.current[name]) {
        changeDefersRefs.current[name].resolve();
        delete changeDefersRefs.current[name];
      }

      if (!domNodeRefs.current[name] && !newValue) {
        return;
      }

      domNodeRefs.current[name] = newValue;

      const cleanCallback = options.onRefChange(name, newValue);

      //   if (typeof cleanCallback === "function") {
      //     const defer = new Deferred<void>();
      //     changeDefersRefs.current[name] = defer;
      //     void defer.promise.then(cleanCallback);
      //   }

      //   values = [];
    }, 0);

    return {
      set current(newValue: NullableHTMLNode) {
        process(newValue);
      },

      get current() {
        return getNode(name);
      }
    };
  };

  const getNode = useCallback(
    (name: string): NullableHTMLNode => {
      return domNodeRefs.current[name] || null;
    },
    [domNodeRefs]
  );

  return { createRef, getNode };
};
