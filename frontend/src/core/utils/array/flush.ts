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
