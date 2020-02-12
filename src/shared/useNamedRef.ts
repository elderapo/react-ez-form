import { useRef } from "react";

export type UseNamedRefOptions = {
  onRef: (domNode: HTMLElement, name: string) => (() => void) | void;
};

export type UseNamedRefResult = {
  getRefHandler: (name: string) => (el: HTMLElement | null) => void;
  getNodeByName: (name: string) => HTMLElement | null;
};

export const useNamedRef = (options: UseNamedRefOptions): UseNamedRefResult => {
  const disposeCallbacks = useRef<Record<string, () => void>>({});
  const domNodes = useRef<Record<string, HTMLElement>>({});

  const getRefHandler = (name: string) => {
    return (domNode: HTMLElement | null) => {
      if (domNode) {
        const runDomCleanup = options.onRef(domNode, name);
        domNodes.current[name] = domNode;

        if (runDomCleanup) {
          disposeCallbacks.current[name] = runDomCleanup;
        }

        return;
      }

      delete domNodes.current[name];

      if (!disposeCallbacks.current[name]) {
        return;
      }

      disposeCallbacks.current[name]();

      delete disposeCallbacks.current[name];
    };
  };

  const getNodeByName = (name: string): HTMLElement | null => {
    return domNodes.current[name] || null;
  };

  return { getRefHandler, getNodeByName };
};
