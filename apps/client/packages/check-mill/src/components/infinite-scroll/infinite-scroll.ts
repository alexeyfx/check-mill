import { Disposable, DisposableStore, event, revert, TypedEvent } from "../../core";
import { Component } from "../component";
import { DOMScrollViewport } from "./dom-scroll-viewport";

export type InfiniteScrollEvent = {
  readonly delta: number;
  readonly virtualScrollTop: number;
};

export class InfiniteScroll implements Component {
  public readonly onScroll = new TypedEvent<InfiniteScrollEvent>();

  private static readonly MIN_RUNWAY_HEIGHT = 100_000;
  private static readonly DRIFT_RECOVERY_THRESHOLD_PERCENT = 0.2;

  private runwayHeight = 0;
  private neutralCenterOffset = 0;
  private accumulatedVirtualScrollTop = 0;
  private lastObservedScrollTop = 0;
  private isRecenteringInProgress = false;

  private readonly viewport: DOMScrollViewport;
  private readonly disposables = new DisposableStore();

  constructor(root: HTMLElement) {
    this.viewport = new DOMScrollViewport(root);
  }

  public init(): Disposable {
    this.viewport.mount();
    this.recalculateTrackDimensions();

    const interactiveScrollingSurface = this.viewport.getViewportElement();

    this.disposables.push(
      this.onScroll.clear,
      () => this.viewport.unmount(),
      event(interactiveScrollingSurface, "scroll", (e) => this.onSurfaceScroll(e)),
    );

    this.viewport.setScrollTop(this.neutralCenterOffset);

    return () => this.disposables.flushAll();
  }

  private onSurfaceScroll(_event: Event): void {
    const currentScrollTop = this.viewport.getScrollTop();

    if (this.isRecenteringInProgress) {
      this.isRecenteringInProgress = false;
      this.lastObservedScrollTop = currentScrollTop;
      return;
    }

    const delta = currentScrollTop - this.lastObservedScrollTop;
    if (delta === 0) return;

    this.lastObservedScrollTop = currentScrollTop;
    this.accumulatedVirtualScrollTop += delta;

    this.onScroll.emit({
      delta: revert(delta),
      virtualScrollTop: this.accumulatedVirtualScrollTop,
    });

    const currentDriftDistance = Math.abs(currentScrollTop - this.neutralCenterOffset);
    const maxHalfRunwayDistance = this.runwayHeight / 2;
    const allowedDriftBoundary =
      maxHalfRunwayDistance * InfiniteScroll.DRIFT_RECOVERY_THRESHOLD_PERCENT;

    if (currentDriftDistance > allowedDriftBoundary) {
      this.recenterSurface();
    }
  }

  private recenterSurface(): void {
    this.isRecenteringInProgress = true;
    this.viewport.setScrollTop(this.neutralCenterOffset);
    this.lastObservedScrollTop = this.neutralCenterOffset;
  }

  private recalculateTrackDimensions(): void {
    const baseContentHeight = this.runwayHeight * 10;

    this.runwayHeight = Math.max(InfiniteScroll.MIN_RUNWAY_HEIGHT, baseContentHeight);
    this.neutralCenterOffset = this.runwayHeight / 2;

    this.viewport.updateRunwayHeight(this.runwayHeight);

    this.accumulatedVirtualScrollTop = 0;
    this.lastObservedScrollTop = this.neutralCenterOffset;
    this.isRecenteringInProgress = false;
  }
}
