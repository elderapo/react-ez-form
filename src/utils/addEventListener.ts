export type RemoveListenerFN = () => void;

export const addEventListener = <ITEM extends HTMLElement, EVENT extends keyof HTMLElementEventMap>(
  el: HTMLElement,
  event: EVENT,
  handler: (e: Event) => void
): RemoveListenerFN => {
  el.addEventListener(event, handler);

  return () => {
    el.removeEventListener(event, handler);
  };
};
