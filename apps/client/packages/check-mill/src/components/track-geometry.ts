import type { ViewPlan } from "./view-plan";

export interface TrackPlacement {
  readonly realIndex: number;
  readonly viewportOffset: number;
}

/**
 * Offset of a slide from the top of the runway, in track space.
 */
export function slideTrackOffset(slide: Readonly<TrackPlacement>, plan: ViewPlan): number {
  const { stride, runwayRange } = plan.derived;

  return (
    slide.realIndex * stride + plan.config.slideSpacing + slide.viewportOffset * runwayRange
  );
}
