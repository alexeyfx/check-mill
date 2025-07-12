/**
 * Measures and logs the execution time of a synchronous callback.
 *
 * @param message - A label to include in the console output.
 * @param callback - The synchronous function to measure.
 */
export function measure(message: string, callback: VoidFunction): void {
  const start = performance.now();

  callback();

  const end = performance.now();
  console.log(`${message}: ${(end - start).toFixed(2)}ms`);
}
