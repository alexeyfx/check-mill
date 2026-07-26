/**
 * Where the track sits, in track space.
 *
 * A mutable box rather than a bare number: every system reads the position
 * through the state tree and the scroll path writes it in place on the hot path.
 */
export interface MotionType {
  position: number;
}

export function createMotion(): MotionType {
  return { position: 0.0 };
}

export function move(motion: MotionType, delta: number): void {
  motion.position += delta;
}

export function moveTo(motion: MotionType, position: number): void {
  motion.position = position;
}
