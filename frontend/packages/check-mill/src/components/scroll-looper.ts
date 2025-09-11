import { type AppRef } from "./app-ref";
import { type ScrollMotionType, move } from "./scroll-motion";

type LoopBounds = { min: number; max: number };

/**
 * Checks if the scroll motion has reached the looping bounds and, if so,
 * instantly translates the motion to the other side to create a seamless
 * infinite loop effect.
 *
 * @param appRef The complete, current application state for this frame.
 * @returns `true` if the content was looped, otherwise `false`.
 */
export function loopScroll(appRef: AppRef): boolean {
  const { layout, motion } = appRef;

  const jointSafety = 0.1;
  const maxBound = jointSafety;
  const minBound =
    layout.viewportRect.height - layout.slideSpacing - layout.contentArea.height + jointSafety;

  const bounds = { min: minBound, max: maxBound };
  const needsToLoop = shouldLoop(motion, bounds);

  if (needsToLoop) {
    const loopDistance = layout.contentArea.height - layout.slideSpacing;
    const distanceToMove = -1 * motion.direction * loopDistance;

    move(motion, distanceToMove);
  }

  return needsToLoop;
}

function reachedMax(offset: number, bounds: LoopBounds): boolean {
  return offset >= bounds.max;
}

function reachedMin(offset: number, bounds: LoopBounds): boolean {
  return offset <= bounds.min;
}

function shouldLoop(motion: ScrollMotionType, bounds: LoopBounds): boolean {
  switch (motion.direction) {
    case -1:
      return reachedMin(motion.offset, bounds);
    case 1:
      return reachedMax(motion.offset, bounds);
    default:
      return false;
  }
}
