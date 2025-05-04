import type { LocationType } from "./location";
import type { LayoutMetrics } from "./layout";

export class ScrollLooper {
  private readonly location: LocationType;

  private readonly metrics: LayoutMetrics;

  private readonly min: number;

  private readonly max: number;

  constructor(location: LocationType, metrics: LayoutMetrics) {
    this.location = location;
    this.metrics = metrics;

    const jointSafety = 0.1;
    const { contentHeight, slideHeight, contentGap } = metrics;
    this.min = slideHeight + contentGap - contentHeight + jointSafety;
    this.max = 0 + jointSafety;
  }

  public loop(direction: number): void {
    if (!this.shouldLoop(direction)) {
      return;
    }

    const distance = -1 * direction * this.metrics.contentHeight;
    this.location.forEach((vector) => vector.add(distance));
  }

  private shouldLoop(direction: number): boolean {
    const offset = this.location.offset.get();

    switch (direction) {
      case -1:
        return this.reachedMin(offset);
      case 1:
        return this.reachedMax(offset);
    }

    return false;
  }

  private reachedMax(offset: number): boolean {
    return offset > this.max;
  }

  private reachedMin(offset: number): boolean {
    return offset < this.min;
  }
}
