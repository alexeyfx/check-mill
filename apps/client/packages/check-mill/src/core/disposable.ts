import { type Disposable } from "./types";

/**
 * Linear store for managing resource cleanups.
 * Appends items directly onto a single array stack for sequential destruction.
 */
export class DisposableStore {
  /**
   * The underlying array tracking sequential teardown tasks.
   */
  private readonly items: Disposable[] = [];

  /**
   * Appends one or more disposables to the execution stack.
   * @param funcs The disposable function(s) or teardown callbacks to track.
   */
  public push(...funcs: Disposable[]): void {
    const len = funcs.length;
    if (len === 0) return;

    for (let i = 0; i < len; i++) {
      this.items.push(funcs[i]);
    }
  }

  /**
   * Executes and clears all accumulated disposables in the exact order they were registered.
   */
  public flushAll(): void {
    if (this.items.length === 0) return;

    const executionQueue = [...this.items];
    this.items.length = 0;

    for (const dispose of executionQueue) {
      dispose();
    }
  }
}
