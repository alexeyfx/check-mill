/** A container holding a typed value `T`. */
export interface Resource<T> {
  value: T;
}

/** A function that produces a `Resource<T>` when invoked. */
export interface ResourceFactory<T> {
  (): Resource<T>;
}
