import type { LayoutMetrics } from "./layout";
import type { ViewportType } from "./viewport";
import type { SlidesType } from "./slides";
import { ScrollMotionType } from "./scroll-motion";
import { between } from "../utils";

export type VisibilityChange = -1 | 0 | 1;

export interface SlidesInViewType {
  detectVisibilityChange(): VisibilityChange[];
}

/**
 * Creates a tracker that determines whether slides are currently visible within the viewport.
 *
 * @param slides - Array of slide objects containing layout and index information.
 * @param motion - The scroll motion state object containing current offset.
 * @param metrics - Layout-related values such as slide height and spacing.
 * @param viewport - Object providing the current viewport dimensions.
 * @returns {SlideInViewType}
 */
export function SlidesInView(
  slides: SlidesType,
  motion: ScrollMotionType,
  metrics: LayoutMetrics,
  viewport: ViewportType
): SlidesInViewType {
  /**
   * Additional buffer to ensure safe detection of near-viewport boundaries.
   */
  const jointSafety = 0.1;

  /**
   * Calculated top edge threshold for a slide to be considered in view.
   */
  const topEdge = 0 - metrics.slideHeight - metrics.containerGap + jointSafety;

  /**
   * Calculated bottom edge threshold based on current viewport height.
   */
  const bottomEdge = viewport.measure().height + metrics.containerGap - jointSafety;

  const absolutePositions = new Array(metrics.totalSlides)
    .fill(0)
    .map((_, i) => i * (metrics.slideHeight + metrics.containerGap));

  const viewportOffsets = [-1 * metrics.contentHeight, 0, metrics.contentHeight];

  /**
   * Array storing in-view status (1 = in view, 0 = out of view) for each slide by index.
   */
  const positions = new Array(metrics.totalSlides).fill(-1);

  /**
   * Checks which slides are currently in the viewport based on current scroll position.
   *
   * @returns An array of 0s and 1s indicating which slides are in view.
   */
  function detectVisibilityChange(): VisibilityChange[] {
    const { offset } = motion;

    let changes = new Array(slides.length);

    for (const { realIndex, viewportOffset } of slides) {
      const position = offset + absolutePositions[realIndex] + viewportOffsets[viewportOffset + 1];
      const intersects = inView(position);

      changes[realIndex] = positions[realIndex] !== intersects ? intersects : 0;
      positions[realIndex] = intersects;
    }

    return changes;
  }

  /**
   * Determines if a given position is within the visible bounds of the viewport.
   *
   * @param position - Position of a slide.
   * @returns True if the position is in view; otherwise, false.
   */
  function inView(position: number): number {
    return between(position, topEdge, bottomEdge) ? 1 : -1;
  }

  return { detectVisibilityChange };
}
