export function query<E extends Element = Element>(
  parent: Element | Document,
  selector: string
): E | null {
  return parent.querySelector(selector);
}
