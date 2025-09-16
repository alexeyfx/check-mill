export interface MotionType {
  current: number;
  previous: number;
  offset: number;
  target: number;
  velocity: number;
  direction: number;
}

/**
 * A motion state container.
 *
 * Manages multiple 1D vectors used in scroll calculations,
 * such as current position, target position, velocity, and more.
 *
 * @returns {MotionType} A MotionType instance .
 */
export function Motion(): MotionType {
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
 * Apply a uniform delta to Motion.
 *
 * @param motion - Motion to advance.
 * @param delta - Amount to increment each value by.
 */
export function move(motion: MotionType, delta: number): void {
  motion.current += delta;
  motion.previous += delta;
  motion.offset += delta;
  motion.target += delta;
}

export function initial(motion: MotionType): void {
  const ref = Motion();
  
  for (const field in ref) {
    const typedF = field as keyof MotionType;
    motion[typedF] = ref[typedF];
  }
}
