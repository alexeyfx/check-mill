/**
 * Calls the provided function immediately.
 *
 * @param func - A zero-argument function to invoke.
 */
export function call(func: () => void): void {
  func();
}

/**
 * Creates a throttled version of the given function that, when invoked repeatedly,
 * will only call the original function at most once per every `wait` milliseconds.
 *
 * @typeParam T - The type of the function to be throttled.
 *
 * @param func - The function to throttle.
 * @param wait - The number of milliseconds to wait before allowing another call.
 *
 * @returns A throttled version of the original function.
 */
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastCall >= limit) {
      lastCall = now;
      func(...args);
    }
  };
}

export function noop(): void {}
