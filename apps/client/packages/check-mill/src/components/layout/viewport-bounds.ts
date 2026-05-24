import { LayoutConfig } from "./layout-calculator";

export class ViewportBounds {
  constructor(private readonly config: LayoutConfig) {}

  public getAvailableGridHeight(): number {
    const { viewportSize, slideMaxHeightRatio, slideMinHeight, slidePadding } = this.config;

    const maxAllowedHeight = viewportSize.height * slideMaxHeightRatio;
    const workingSlideHeight = Math.max(slideMinHeight, maxAllowedHeight);

    return Math.max(0, workingSlideHeight - slidePadding.vertical * 2);
  }

  public getAvailableGridWidth(): number {
    const { viewportSize, containerPadding, slideMaxWidth, slidePadding } = this.config;

    const maxBoundedWidth = viewportSize.width - containerPadding.horizontal;
    const workingSlideWidth = Math.min(slideMaxWidth, maxBoundedWidth);

    return Math.max(0, workingSlideWidth - slidePadding.horizontal * 2);
  }

  public calculateLengthWithGaps(count: number, elementSize: number, gapSize: number): number {
    if (count <= 0) return 0;
    return count * elementSize + Math.max(0, count - 1) * gapSize;
  }
}
