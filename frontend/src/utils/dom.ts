import { assert } from "./error";

/**
 * Call the `preventDefault()` of the provided event.
 *
 * @param e - An Event object.
 * @param stopPropagation - Optional. Whether to stop the event propagation or not.
 */
export function prevent(e: Event, stopPropagation?: boolean): void {
  e.preventDefault();

  if (stopPropagation) {
    e.stopPropagation();
    e.stopImmediatePropagation();
  }
}

export function query<E extends Element = Element>(
  parent: Element | Document,
  selector: string,
  panic?: boolean
): E | null {
  const element = parent.querySelector(selector);

  if (panic) {
    assert(element, `No elemenet matches provided selector: '${selector}'`);
  }

  return parent.querySelector(selector);
}
