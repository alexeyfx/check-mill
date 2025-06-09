import { AxisType } from "./axis";
import { LayoutMetrics } from "./layout";
import { LocationType } from "./location";
import { Translate } from "./translate";
import { ViewportType } from "./viewport";

export interface SlidesLooperType {
  loop(): void;
}

/**
 * Creates a slide looper that enables seamless looping of slides by conditionally
 * shifting the first or last slide when the user scrolls past the content bounds.
 *
 * @param axis - Axis on which the slides move (horizontal or vertical).
 * @param viewport - The viewport through which the slides are visible.
 * @param metrics - Layout metrics including dimensions of content and slides.
 * @param location - Provides current scroll offset.
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
  axis: AxisType,
  viewport: ViewportType,
  metrics: LayoutMetrics,
  location: LocationType,
  slides: HTMLElement[]
): SlidesLooperType {
  const translates = slides.map((slide) => Translate(axis, slide));

  const translateOffset = metrics.contentHeight + metrics.containerGap;

  const viewportHeight = viewport.measure().height;

  const translatesPerShift = Math.ceil(viewportHeight / metrics.slideHeight);

  let lastOperation: VoidFunction = resetShift;

  function loop(): void {
    const leftEdge = location.offset.get();
    const rightedge = leftEdge + metrics.contentHeight;

    let currentOperation: VoidFunction = resetShift;

    if (between(leftEdge, 0, viewportHeight)) {
      currentOperation = shiftRight;
    }

    if (between(rightedge, 0, viewportHeight)) {
      currentOperation = shiftLeft;
    }

    if (currentOperation !== lastOperation) {
      resetShift();
      currentOperation();
    }

    lastOperation = currentOperation;
  }

  function shiftRight(): void {
    for (const t of translates.slice(-1 * translatesPerShift)) {
      t.to(-1 * translateOffset);
    }
  }

  function shiftLeft(): void {
    for (const t of translates.slice(0, translatesPerShift)) {
      t.to(translateOffset);
    }
  }

  function resetShift(): void {
    translates.forEach((t) => t.to(0));
  }

  function between(x: number, min: number, max: number): boolean {
    return x >= min && x <= max;
  }

  return { loop };
}
