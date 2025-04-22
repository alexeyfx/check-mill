/**
 * Throws an error if the provided condition is falsy.
 *
 * @param condition - If falsy, an error is thrown.
 * @param message   - Optional. A message to display.
 */
export function assert(condition: any, message?: string): asserts condition {
  if (!condition) {
    panic(`${message || ""}`);
  }
}

/**
 * Throws an Error with the provided message and
 * has a return type of `never`, meaning it does not return.
 */
export function panic(message: string): never {
  throw new Error(`Panic: ${message}`);
}
