/**
 * Rust-like Option type in TypeScript.
 *
 * `Option<T>` can be either:
 *   - { kind: 'Some'; value: T }
 *   - { kind: 'None' }
 */
export type Option<T> = { kind: "Some"; value: T } | { kind: "None" };

/** Convenience constructor for the "Some" variant. */
export function Some<T>(value: T): Option<T> {
  return { kind: "Some", value };
}

/** Convenience constructor for the "None" variant. */
export function None<T>(): Option<T> {
  return { kind: "None" };
}

/** Helper to check if Option is "Some". */
export function isSome<T>(
  option: Option<T>
): option is { kind: "Some"; value: T } {
  return option.kind === "Some";
}

/** Helper to check if Option is "None". */
export function isNone<T>(option: Option<T>): option is { kind: "None" } {
  return option.kind === "None";
}

/**
 * Extracts the value if "Some", or returns `defaultValue` if "None".
 */
export function unwrapOr<T>(option: Option<T>, defaultValue: T): T {
  return isSome(option) ? option.value : defaultValue;
}

/**
 * Returns the contained `Some` value or calls `defaultFn` if `None`.
 * This is the lazy equivalent of `unwrapOr` in Rust, where the default
 * value computation is only invoked if the `Option` is `None`.
 *
 * @param option - The `Option` to unwrap.
 * @param defaultFn - A function that returns a fallback value if `option` is `None`.
 * @returns The unwrapped value if `Some`, otherwise the value from `defaultFn`.
 */
export function unwrapOrElse<T>(option: Option<T>, defaultFn: () => T): T {
  return isSome(option) ? option.value : defaultFn();
}
