import type { LayoutMetrics } from "./layout";
import type { ScrollMotionType } from "./scroll-motion";

export interface ScrollLooperType {
  loop(): void;
}

export function ScrollLooper(motion: ScrollMotionType, metrics: LayoutMetrics): ScrollLooperType {
  const jointSafety = 0.1;

  let min: number =
    metrics.slideHeight + metrics.containerGap - metrics.contentHeight + jointSafety;

  let max: number = jointSafety;

  function loop(): void {
    const direction = motion.direction.get();

    if (shouldLoop(direction)) {
      const distance = -1 * direction * metrics.contentHeight + direction * metrics.containerGap;
      motion.move(distance);
    }
  }

  function shouldLoop(direction: number): boolean {
    const offset = motion.offset.get();

    switch (direction) {
      case -1:
        return reachedMin(offset);
      case 1:
        return reachedMax(offset);
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
