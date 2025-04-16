/**
 * Throws an Error with the provided message and
 * has a return type of `never`, meaning it does not return.
 */
export function panic(message: string): never {
  throw new Error(`Panic: ${message}`);
}
