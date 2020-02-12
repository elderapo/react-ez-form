import { useEffect } from "react";
import { IUseDOMRefHookResult, useDOMRef } from "./useDOMRef";
import { TypedEventEmitter, RemoveEventListener } from "@elderapo/typed-event-emitter";

class SubscribableWeakMap<K extends object, V> extends WeakMap<K, V> {
  private ee = new TypedEventEmitter<{
    change: { key: K; value: V | null };
  }>();

  public set(key: K, value: V): this {
    this.ee.emit("change", {
      key,
      value
    });
    return super.set(key, value);
  }

  public delete(key: K): boolean {
    this.ee.emit("change", {
      key,
      value: null
    });
    return super.delete(key);
  }

  public onChange(handler: (payload: { key: K; value: V | null }) => void): RemoveEventListener {
    return this.ee.on("change", handler);
  }
}

export const setDOMRefFNToRef = new SubscribableWeakMap<
  React.Dispatch<React.SetStateAction<HTMLElement | null | any>>,
  HTMLElement | null
>();

export const useDOMRefShared = <HTML_ELEMENT extends HTMLElement>(): IUseDOMRefHookResult<
  HTML_ELEMENT
> => {
  const { domRef, setDomRef } = useDOMRef<HTML_ELEMENT>();

  useEffect(() => {
    setDOMRefFNToRef.set(setDomRef, domRef);

    return () => {
      setDOMRefFNToRef.delete(setDomRef);
    };
  }, [domRef, setDomRef]);

  return { domRef, setDomRef };
};
