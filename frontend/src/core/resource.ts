/** "Globally unique" data of some kind `T`. */
export interface Resource<T> {
  value: T;
}

/** A function that produces a `Resource<T>` when invoked. */
export interface ResourceFactory<T> {
  (): Resource<T>;
}
