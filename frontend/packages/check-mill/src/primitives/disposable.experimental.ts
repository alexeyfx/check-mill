import { noop } from "../utils";

/**
 * A function that performs a cleanup action.
 */
export type Disposable = () => void;

/**
 * A unique identifier for a disposable store category.
 * Can be a string, number, or symbol.
 */
export type StoreId = string | number | symbol;

/**
 * The public interface for the dynamic disposable store.
 */
export interface DisposableStore {
  /**
   * Adds one or more disposables to a specified store.
   * If the store does not exist, it will be created automatically.
   * @param storeId The identifier for the store (e.g., 'listeners', 'timers').
   * @param funcs The disposable function(s) to add.
   * @returns A function that removes the added disposable(s) from their store.
   */
  push(storeId: StoreId, ...funcs: Disposable[]): () => void;

  /**
   * Executes and clears all disposables from a specific store.
   * If the store doesn't exist, this is a no-op.
   * @param storeId The identifier for the store to flush.
   */
  flush(storeId: StoreId): void;

  /**
   * Executes and clears all disposables from all stores.
   */
  flushAll(): void;
}

/**
 * Creates a new disposable store for managing resource cleanup.
 * This version allows for creating dynamic categories (stores) for disposables.
 */
export function createDisposableStore(): DisposableStore {
  /**
   * A map holding all the dynamic disposable stores.
   * The key is the store's ID, and the value is the array of disposables.
   */
  const stores = new Map<StoreId, (Disposable | null)[]>();

  /**
   * A robust utility to execute and clear an array of disposables.
   * It handles null placeholders and ensures all disposables are called,
   * even if some throw errors.
   */
  const robustFlush = (disposables: (Disposable | null)[]): void => {
    const itemsToFlush = [...disposables];
    disposables.length = 0;

    for (const dispose of itemsToFlush) {
      dispose && dispose();
    }
  };

  /**
   * Retrieves a store by its ID, creating it if it doesn't exist.
   */
  const getOrCreateStore = (storeId: StoreId): (Disposable | null)[] => {
    if (!stores.has(storeId)) {
      stores.set(storeId, []);
    }

    return stores.get(storeId)!;
  };

  /**
   * Helper to create a function that removes a contiguous block of items from an array
   * by replacing them with `null`.
   */
  const createRemover = (
    arr: (Disposable | null)[],
    startIndex: number,
    count: number
  ): VoidFunction => {
    let removed = false;

    return () => {
      if (removed || count === 0) {
        return;
      }

      for (let i = 0; i < count; i++) {
        arr[startIndex + i] = null;
      }

      removed = true;
    };
  };

  const push = (storeId: StoreId, ...funcs: Disposable[]): VoidFunction => {
    if (funcs.length === 0) {
      return noop;
    }

    const store = getOrCreateStore(storeId);
    const startIndex = store.length;
    store.push(...funcs);

    return createRemover(store, startIndex, funcs.length);
  };

  const flush = (storeId: StoreId): void => {
    if (stores.has(storeId)) {
      robustFlush(stores.get(storeId)!);
    }
  };

  const flushAll = (): void => {
    for (const store of stores.values()) {
      robustFlush(store);
    }
  };

  return {
    push,
    flush,
    flushAll,
  };
}
