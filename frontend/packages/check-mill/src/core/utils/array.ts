/**
 * Applies an action to each item in the list and clears the list in-place.
 *
 * @param items - The array of items to flush.
 * @param action - The function to apply to each item before clearing.
 */
export function flush<T>(items: T[], action: (item: T) => void): void {
  for (const item of items) {
    action(item);
  }

  items.length = 0;
}

/**
 * Push the provided value to an array if the value is not an array.
 *
 * @param value - A value to push.
 *
 * @return An array containing the value, or the value itself if it is already an array.
 */
export function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}
