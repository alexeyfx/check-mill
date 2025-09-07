/**
 * Measures and logs the execution time of a synchronous function.
 *
 * @param message - A label to include in the console output.
 * @param func - The synchronous function to measure.
 */
export function measure(message: string, func: VoidFunction): void {
  const start = performance.now();

  func();

  const end = performance.now();
  console.log(`${message}: ${(end - start).toFixed(2)}ms`);
}
