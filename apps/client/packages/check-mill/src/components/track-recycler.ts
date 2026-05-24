import { wrap } from "../core";
import { type LayoutContext } from "./layout";
import { type MotionType, moveTo } from "./scroll-motion";
import { type SlidesCollectionType } from "./slides";

export const enum TrackShiftDirection {
  Neutral,
  ShiftedUp,
  ShiftedDown,
}

export interface ImmutableTrackState {
  readonly loopCycleCount: number;
  readonly shiftDirection: TrackShiftDirection;
}

export interface SlideLayoutMetrics {
  readonly realIndex: number;
  readonly viewportOffset: number;
  readonly virtualIndex: number;
  readonly pageIndex: number;
}

export class TrackRecycler {
  private loopCycleCount = 0;
  private shiftDirection = TrackShiftDirection.Neutral;

  public getState(): ImmutableTrackState {
    return {
      loopCycleCount: this.loopCycleCount,
      shiftDirection: this.shiftDirection,
    };
  }

  public update(
    motion: MotionType,
    layout: Readonly<LayoutContext>,
    slides: SlidesCollectionType,
  ): void {
    const didTrackWrap = this.enforceTrackClamping(motion, layout);
    this.reindexVirtualLayout(motion, layout, slides, didTrackWrap);
  }

  private enforceTrackClamping(motion: MotionType, layout: Readonly<LayoutContext>): boolean {
    const { contentArea } = layout.computed;
    const { slideSpacing } = layout.config;

    const topLimit = 0;
    const bottomLimit = -1 * contentArea.height + slideSpacing;
    const currentPosition = motion.current;

    const wrappedPosition = wrap(currentPosition, topLimit, bottomLimit);

    if (Math.abs(currentPosition - wrappedPosition) < 0.1) {
      return false;
    }

    if (currentPosition < bottomLimit) {
      this.loopCycleCount++;
    } else if (currentPosition > topLimit) {
      this.loopCycleCount--;
    }

    moveTo(motion, wrappedPosition);
    return true;
  }

  private reindexVirtualLayout(
    motion: MotionType,
    layout: Readonly<LayoutContext>,
    slides: SlidesCollectionType,
    forceRefresh: boolean,
  ): void {
    const targetDirection = this.calculateTargetShiftDirection(motion, layout);
    if (targetDirection === this.shiftDirection && !forceRefresh) {
      return;
    }

    this.shiftDirection = targetDirection;

    const calculatedLayoutPass = this.calculateLayoutPass(layout, slides);
    this.applyCalculatedMetrics(slides, calculatedLayoutPass);
  }

  private calculateTargetShiftDirection(
    motion: MotionType,
    layout: Readonly<LayoutContext>,
  ): TrackShiftDirection {
    const midPointTrigger = layout.computed.contentArea.height / 2;
    return Math.abs(motion.current) > midPointTrigger
      ? TrackShiftDirection.ShiftedDown
      : TrackShiftDirection.ShiftedUp;
  }

  private calculateLayoutPass(
    layout: Readonly<LayoutContext>,
    slides: SlidesCollectionType,
  ): SlideLayoutMetrics[] {
    const { visible, total } = layout.computed.slideCount;
    const { totalPages } = layout.computed.pagination;
    const globalIterationOffset = this.loopCycleCount * total;

    const count = slides.length;
    const metricsPassList: SlideLayoutMetrics[] = new Array(count);

    for (let i = 0; i < count; i++) {
      const slide = slides[i];
      let viewportOffset = 0;
      let virtualIndex = slide.realIndex + globalIterationOffset;

      if (this.shiftDirection === TrackShiftDirection.ShiftedDown && slide.realIndex < visible) {
        viewportOffset = 1;
        virtualIndex += total;
      } else if (
        this.shiftDirection === TrackShiftDirection.ShiftedUp &&
        slide.realIndex >= total - visible
      ) {
        viewportOffset = -1;
        virtualIndex -= total;
      }

      metricsPassList[i] = {
        realIndex: slide.realIndex,
        viewportOffset,
        virtualIndex,
        pageIndex: wrap(virtualIndex, 0, totalPages - 1),
      };
    }

    return metricsPassList;
  }

  private applyCalculatedMetrics(
    slides: SlidesCollectionType,
    metricsPassList: SlideLayoutMetrics[],
  ): void {
    const count = slides.length;
    for (let i = 0; i < count; i++) {
      const slide = slides[i];
      const metrics = metricsPassList[i];

      slide.viewportOffset = metrics.viewportOffset;
      slide.virtualIndex = metrics.virtualIndex;
      slide.pageIndex = metrics.pageIndex;
    }
  }
}
