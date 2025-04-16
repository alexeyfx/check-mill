import { call, flush } from "../utils";
import { Disposable } from "./events";

export interface DisposableStoreType {
  pushStatic(...funcs: Disposable[]): DisposableStoreType;
  pushTemporal(...funcs: Disposable[]): DisposableStoreType;
  flushStatic(): DisposableStoreType;
  flushTemporal(): DisposableStoreType;
  flushAll(): DisposableStoreType;
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
   * DisposableStore instance (self-reference for fluent chaining).
   */
  let self: DisposableStoreType;

  /**
   * Adds one or more static disposables to the store.
   */
  function pushStatic(...funcs: Disposable[]): DisposableStoreType {
    staticDisposables.push(...funcs);
    return self;
  }

  /**
   * Adds one or more temporal disposables to the store.
   */
  function pushTemporal(...funcs: Disposable[]): DisposableStoreType {
    temporalDisposables.push(...funcs);
    return self;
  }

  /**
   * Flushes (calls and clears) all static disposables.
   */
  function flushStatic(): DisposableStoreType {
    flush(staticDisposables, call);
    return self;
  }

  /**
   * Flushes (calls and clears) all temporal disposables.
   */
  function flushTemporal(): DisposableStoreType {
    flush(temporalDisposables, call);
    return self;
  }

  /**
   * Flushes both static and temporal disposables.
   */
  function flushAll(): DisposableStoreType {
    flushStatic();
    flushTemporal();
    return self;
  }

  self = {
    pushStatic,
    pushTemporal,
    flushStatic,
    flushTemporal,
    flushAll,
  };

  return self;
}
