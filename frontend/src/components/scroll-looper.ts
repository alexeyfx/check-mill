import type { LocationType } from "./location";
import type { LayoutMetrics } from "./layout";

export interface ScrollLooperType {
  loop(direction: number): void;
}

export function ScrollLooper(location: LocationType, metrics: LayoutMetrics): ScrollLooperType {
  const jointSafety = 0.1;

  let min: number = metrics.slideHeight + metrics.contentGap - metrics.contentHeight + jointSafety;

  let max: number = jointSafety;

  function loop(direction: number): void {
    if (!shouldLoop(direction)) {
      return;
    }

    const distance = -1 * direction * metrics.contentHeight;
    location.forEach((vector) => vector.add(distance));
  }

  function shouldLoop(direction: number): boolean {
    const offset = location.offset.get();

    switch (direction) {
      case -1:
        return reachedMin(offset);
      case 1:
        return reachedMax(offset);
    }

    return false;
  }

  function reachedMax(offset: number): boolean {
    return offset > max;
  }

  function reachedMin(offset: number): boolean {
    return offset < min;
  }

  return {
    loop,
  };
}
