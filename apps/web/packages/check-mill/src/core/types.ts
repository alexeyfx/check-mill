/** A function that, when invoked, disposes from a resource. */
export type Disposable = VoidFunction;

export const enum DisposableStoreId {
  Static,
  Temporal,
  Reconfigurable,
}
