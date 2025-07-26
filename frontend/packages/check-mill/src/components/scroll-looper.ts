import type { LayoutMetrics } from "./layout";
import type { ScrollMotionType } from "./scroll-motion";
import { move } from "./scroll-motion";

export interface ScrollLooperType {
  loop(): boolean;
}

export function ScrollLooper(motion: ScrollMotionType, metrics: LayoutMetrics): ScrollLooperType {
  const jointSafety = 0.1;

  let min: number =
    metrics.slideHeight + metrics.containerGap - metrics.contentHeight + jointSafety;

  let max: number = jointSafety;

  function loop(): boolean {
    const { direction } = motion;
    const moved = shouldLoop(direction);

    if (moved) {
      const distance = -1 * direction * metrics.contentHeight + direction * metrics.containerGap;
      move(motion, distance);
    }

    return moved;
  }

  function shouldLoop(direction: number): boolean {
    switch (direction) {
      case -1:
        return reachedMin(motion.offset);
      case 1:
        return reachedMax(motion.offset);
    }

    return false;
  }

  function reachedMax(offset: number): boolean {
    return offset >= max;
  }

  function reachedMin(offset: number): boolean {
    return offset <= min;
  }

  return {
    loop,
  };
}
