import { Vector1D } from "../primitives";
import type { Vector1DType } from "../primitives";

export interface ScrollMotionType {
  readonly current: Vector1DType;
  readonly previous: Vector1DType;
  readonly offset: Vector1DType;
  readonly target: Vector1DType;
  readonly velocity: Vector1DType;
  readonly direction: Vector1DType;
  move(delta: number): void;
  forEach(mapFn: (vector: Vector1DType) => void): void;
}

/**
 * A scroll motion state container.
 *
 * Manages multiple 1D vectors used in scroll calculations,
 * such as current position, target position, velocity, and more.
 *
 * @param initial - The starting scroll position (defaults to 0).
 * @returns {ScrollMotionType} A ScrollMotionType instance .
 */
export function ScrollMotion(initial: number = 0): ScrollMotionType {
  /**
   * The current position of the scroll.
   */
  const current = Vector1D(initial);

  /**
   * The position during the previous update/frame.
   */
  const previous = Vector1D(current.get());

  /**
   * The offset from the target caused by user interaction.
   */
  const offset = Vector1D(current.get());

  /**
   * The desired target position.
   */
  const target = Vector1D(current.get());

  /**
   * The current scroll velocity.
   */
  const velocity = Vector1D(0);

  /**
   * The current scroll direction.
   */
  const direction = Vector1D(0);

  const vectors = [current, previous, offset, target];

  /**
   * Apply a uniform delta to all key scroll vectors.
   *
   * @param delta - Amount to increment each vector by.
   */
  function move(delta: number): void {
    for (const vector of vectors) {
      vector.add(delta);
    }
  }

  /**
   * Apply a function to each internal scroll vector.
   *
   * @param mapFn - Callback to invoke with each vector.
   */
  function forEach(mapFn: (vector: Vector1DType) => void): void {
    for (const vector of vectors) {
      mapFn(vector);
    }
  }

  return {
    current,
    previous,
    offset,
    target,
    velocity,
    direction,
    move,
    forEach,
  };
}
