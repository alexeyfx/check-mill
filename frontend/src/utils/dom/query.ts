import { None, Option, Some } from "../option";

export function query<E extends Element = Element>(
  parent: Element | Document,
  selector: string
): Option<E> {
  const element = parent.querySelector(selector);

  return Boolean(element) ? Some(element as E) : None();
}
