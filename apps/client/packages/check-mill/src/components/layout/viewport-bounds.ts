import type { LayoutConfig } from "./layout-calculator";

/**
 * Vertical room a slide's grid may occupy, before padding.
 */
export function availableGridHeight(config: LayoutConfig): number {
  const { viewportSize, slideMaxHeightRatio, slideMinHeight, slidePadding } = config;

  const maxAllowedHeight = viewportSize.height * slideMaxHeightRatio;
  const workingSlideHeight = Math.max(slideMinHeight, maxAllowedHeight);

  return Math.max(0, workingSlideHeight - slidePadding.vertical * 2);
}

/**
 * Horizontal room a slide's grid may occupy, before padding.
 */
export function availableGridWidth(config: LayoutConfig): number {
  const { viewportSize, containerPadding, slideMaxWidth, slidePadding } = config;

  const maxBoundedWidth = viewportSize.width - containerPadding.horizontal;
  const workingSlideWidth = Math.min(slideMaxWidth, maxBoundedWidth);

  return Math.max(0, workingSlideWidth - slidePadding.horizontal * 2);
}

/**
 * Total length of `count` elements laid end to end with a gap between each.
 */
export function lengthWithGaps(count: number, elementSize: number, gapSize: number): number {
  if (count <= 0) return 0;

  return count * elementSize + Math.max(0, count - 1) * gapSize;
}
