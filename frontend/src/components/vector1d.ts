import { isNumber } from "../utils";

export interface Vector1DType {
  get(): number;
  set(n: Vector1DType | number): void;
  add(n: Vector1DType | number): void;
  subtract(n: Vector1DType | number): void;
}

/**
 * A mutable scalar wrapper for 1D values.
 */
export function Vector1D(initial: number): Vector1DType {
  /**
   * Internal scalar value being managed.
   */
  let value = initial;

  /**
   * Returns the current scalar value.
   */
  function get(): number {
    return value;
  }

  /**
   * Sets the value to a number or the value of another Vector1D.
   */
  function set(n: Vector1DType | number): void {
    value = normalizeInput(n);
  }

  /**
   * Adds a number or another Vector1D’s value to the current value.
   */
  function add(n: Vector1DType | number): void {
    value += normalizeInput(n);
  }

  /**
   * Subtracts a number or another Vector1D’s value from the current value.
   */
  function subtract(n: Vector1DType | number): void {
    value -= normalizeInput(n);
  }

  /**
   * Normalizes input to a number, whether it's a raw number or another Vector1D.
   */
  function normalizeInput(n: Vector1DType | number): number {
    return isNumber(n) ? n : n.get();
  }

  return {
    get,
    set,
    add,
    subtract,
  };
}
