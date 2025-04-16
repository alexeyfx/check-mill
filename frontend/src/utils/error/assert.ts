import { panic } from "./panic";

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
