import { type LayoutMetrics } from "./layout";
import { type ScrollMotionType, move } from "./scroll-motion";

export interface ScrollLooperType {
  loop(): boolean;
}

export function ScrollLooper(motion: ScrollMotionType, metrics: LayoutMetrics): ScrollLooperType {
  const jointSafety = 0.1;

  let max = jointSafety;

  let min = metrics.slideHeight + metrics.containerGap - metrics.contentHeight + jointSafety;

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
    let reachedBound = false;

    switch (direction) {
      case -1:
        reachedBound = reachedMin(motion.offset);
        break;

      case 1:
        reachedBound = reachedMax(motion.offset);
        break;
    }

    return reachedBound;
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
