import { type Disposable } from "./types";
import { call, flush } from "./utils";

export interface DisposableStoreType {
  pushStatic(...funcs: Disposable[]): void;
  pushTemporal(...funcs: Disposable[]): void;
  flushStatic(): void;
  flushTemporal(): void;
  flushAll(): void;
}

export function DisposableStore(): DisposableStoreType {
  /**
   * Lifespan-bound disposables for long-lived resources.
   * These persist until component cleanup.
   */
  const staticDisposables: Disposable[] = [];

  /**
   * Temporary disposables that are registered only during interactions
   * like pointer drags or transient stateful behavior.
   */
  const temporalDisposables: Disposable[] = [];

  /**
   * Adds one or more static disposables to the store.
   */
  function pushStatic(...funcs: Disposable[]): void {
    staticDisposables.push(...funcs);
  }

  /**
   * Adds one or more temporal disposables to the store.
   */
  function pushTemporal(...funcs: Disposable[]): void {
    temporalDisposables.push(...funcs);
  }

  /**
   * Flushes (calls and clears) all static disposables.
   */
  function flushStatic(): void {
    flush(staticDisposables, call);
  }

  /**
   * Flushes (calls and clears) all temporal disposables.
   */
  function flushTemporal(): void {
    flush(temporalDisposables, call);
  }

  /**
   * Flushes both static and temporal disposables.
   */
  function flushAll(): void {
    flushStatic();
    flushTemporal();
  }

  return {
    pushStatic,
    pushTemporal,
    flushStatic,
    flushTemporal,
    flushAll,
  };
}
