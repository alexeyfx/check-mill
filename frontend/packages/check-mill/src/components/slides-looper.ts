import { between } from "../utils";
import { LayoutMetrics } from "./layout";
import { type ScrollMotionType } from "./scroll-motion";
import { type SlidesCollectionType } from "./slides";
import { type ViewportType } from "./viewport";

export interface SlidesLooperType {
  loop(): boolean;
}

/**
 * Creates a slide looper that enables seamless looping of slides by conditionally
 * shifting the first or last slide when the user scrolls past the content bounds.
 *
 * @param viewport - The viewport through which the slides are visible.
 * @param metrics - Layout metrics including dimensions of content and slides.
 * @param motion - Provides current scroll offset.
 * @param slides - An array of slide elements.
 * @returns An object implementing `SlidesLooperType`.
 *
 * ---
 * ### Slide Layout Example:
 * ```
 * |---------------------|
 * |1|-|2|-|3|-|4|-|5|-|6|
 * |---------------------|
 * ```
 * - `leftEdge = offset`
 * - `rightEdge = offset + contentHeight`
 *
 * ### Loop Conditions:
 * - If `leftEdge > 0` → user scrolled before start → shift last slide to front
 * - If `rightEdge < viewport.height` → user scrolled past end → shift first slide to back
 */
export function SlidesLooper(
  viewport: ViewportType,
  metrics: LayoutMetrics,
  motion: ScrollMotionType,
  slides: SlidesCollectionType
): SlidesLooperType {
  const viewportHeight = viewport.measure().height;

  const translatesPerShift = Math.ceil(viewportHeight / metrics.slideHeight);

  const noneOverflowable = metrics.totalSlides - translatesPerShift;

  let lastOperation: VoidFunction = resetShift;

  function loop(): boolean {
    const leftEdge = motion.offset;
    const rightedge = leftEdge + metrics.contentHeight;

    let moved = false;
    let currentOperation: VoidFunction = resetShift;

    if (between(leftEdge, 0, viewportHeight)) {
      currentOperation = shiftRight;
    }

    if (between(rightedge, 0, viewportHeight)) {
      currentOperation = shiftLeft;
    }

    if (currentOperation !== lastOperation) {
      moved = true;

      resetShift();
      currentOperation();
    }

    lastOperation = currentOperation;

    return moved;
  }

  function shiftRight(): void {
    for (const slide of slides.slice(-1 * translatesPerShift)) {
      slide.virtualIndex -= noneOverflowable;
      slide.viewportOffset = -1;
    }
  }

  function shiftLeft(): void {
    for (const slide of slides.slice(0, translatesPerShift)) {
      slide.virtualIndex += noneOverflowable - 1;
      slide.viewportOffset = 1;
    }
  }

  function resetShift(): void {
    for (const slide of slides) {
      slide.virtualIndex = slide.realIndex;
      slide.viewportOffset = 0;
    }
  }

  return { loop };
}
