export interface ScrollMotionType {
  current: number;
  previous: number;
  offset: number;
  target: number;
  velocity: number;
  direction: number;
}

/**
 * A scroll motion state container.
 *
 * Manages multiple 1D vectors used in scroll calculations,
 * such as current position, target position, velocity, and more.
 *
 * @returns {ScrollMotionType} A ScrollMotionType instance .
 */
export function ScrollMotion(): ScrollMotionType {
  return {
    current: 0.0,
    previous: 0.0,
    offset: 0.0,
    target: 0.0,
    velocity: 0.0,
    direction: 1,
  };
}

/**
 * Apply a uniform delta to ScrollMotion.
 *
 * @param motion - ScrollMotion to advance.
 * @param delta - Amount to increment each vector by.
 */
export function move(motion: ScrollMotionType, delta: number): void {
  motion.current += delta;
  motion.previous += delta;
  motion.offset += delta;
  motion.target += delta;
}
