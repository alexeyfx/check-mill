import { assert } from "../error";

export function query<E extends Element = Element>(
  parent: Element | Document,
  selector: string,
  panic?: boolean,
): E | null {
  const element = parent.querySelector(selector);

  if (panic) {
    assert(element, `No elemenet matches provided selector: '${selector}'`);
  }

  return parent.querySelector(selector);
}
