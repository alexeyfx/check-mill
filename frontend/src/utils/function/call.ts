/**
 * Calls the provided function immediately.
 *
 * @param fn - A zero-argument function to invoke.
 */
export function call(fn: () => void): void {
  fn();
}
