import { clamp } from "../../utils";
import type { LayoutConfig, LayoutMetrics } from "./types";

export interface LayoutType {
  metrics(): Readonly<LayoutMetrics>;
  update(newConfig: Readonly<LayoutConfig>): void;
}

export class Layout implements LayoutType {
  private clampedHeight = 0;
  private rows = 0;
  private columns = 0;
  private slideWidth = 0;
  private slideHeight = 0;
  private materializedSlides = 0;
  private ghostSlides = 0;
  private totalSlides = 0;
  private contentWidth = 0;
  private contentHeight = 0;

  private layoutConfig: Readonly<LayoutConfig>;
  private cachedMetrics: LayoutMetrics | null = null;

  public constructor(config: Readonly<LayoutConfig>) {
    this.layoutConfig = config;
    this.recomputeAll();
  }

  public update(newConfig: Readonly<LayoutConfig>): void {
    this.layoutConfig = newConfig;
    this.recomputeAll();
  }

  public metrics(): Readonly<LayoutMetrics> {
    if (this.cachedMetrics) {
      return this.cachedMetrics;
    }

    const {
      rows,
      columns,
      slideWidth,
      slideHeight,
      materializedSlides,
      ghostSlides,
      totalSlides,
      contentWidth,
      contentHeight,
    } = this;

    const { checkboxSize, gridGap, slidePadding, containerGap, containerPadding, totalCells } =
      this.layoutConfig;

    this.cachedMetrics = {
      checkboxSize,
      gridGap,
      slidePadding,
      rows,
      columns,
      cellsPerPage: rows * columns,
      slideWidth,
      slideHeight,
      totalSlides,
      ghostSlides,
      materializedSlides,
      containerGap,
      containerPadding,
      contentWidth,
      contentHeight,
      totalCells
    };

    return this.cachedMetrics;
  }

  // prettier-ignore
  private recomputeAll(): void {
    this.clampedHeight      = this.clampHeight();
    this.rows               = this.calculateRows();
    this.columns            = this.calculateColumns();
    this.slideWidth         = this.calculateSlideWidth();
    this.slideHeight        = this.calculateSlideHeight();
    this.materializedSlides = this.calculateMaterializedSlides();
    this.ghostSlides        = this.calculateGhostSlides();
    this.totalSlides        = this.calculateTotalSlides();
    this.contentWidth       = this.calculateContentWidth();
    this.contentHeight      = this.calculateContentHeight();
    this.cachedMetrics      = null;
  }

  private clampHeight(): number {
    const { viewportRect, slideMaxHeightPercent, slideMinClampedHeight } = this.layoutConfig;
    const unclamped = viewportRect.height * (slideMaxHeightPercent / 100);

    return clamp(unclamped, slideMinClampedHeight, viewportRect.height);
  }

  private calculateColumns(): number {
    const { checkboxSize, gridGap, viewportRect, slideMaxWidth, slidePadding, containerPadding } =
      this.layoutConfig;
    const viewportBasedWidth =
      viewportRect.width -
      2 * this.readHorizontalPadding(containerPadding) -
      2 * this.readHorizontalPadding(slidePadding);
    const maxWidthBasedWidth = slideMaxWidth - 2 * this.readHorizontalPadding(slidePadding);
    const availableWidth = Math.min(viewportBasedWidth, maxWidthBasedWidth);

    let count = 1;
    while ((count + 1) * checkboxSize + count * gridGap <= availableWidth) {
      count += 1;
    }

    return count;
  }

  private calculateRows(): number {
    const { checkboxSize, gridGap, slidePadding } = this.layoutConfig;
    const availableHeight = this.clampedHeight - 2 * this.readVerticalPadding(slidePadding);

    let count = 1;
    while ((count + 1) * checkboxSize + count * gridGap <= availableHeight) {
      count += 1;
    }

    return count;
  }

  private calculateSlideWidth(): number {
    const { checkboxSize, gridGap, slidePadding } = this.layoutConfig;
    const padding = 2 * this.readHorizontalPadding(slidePadding);
    const gap = (this.columns - 1) * gridGap;
    const content = this.columns * checkboxSize;

    return padding + gap + content;
  }

  private calculateSlideHeight(): number {
    const { checkboxSize, gridGap, slidePadding } = this.layoutConfig;
    const padding = 2 * this.readVerticalPadding(slidePadding);
    const gap = (this.rows - 1) * gridGap;
    const content = this.rows * checkboxSize;

    return padding + gap + content;
  }

  private calculateMaterializedSlides(): number {
    const { viewportRect } = this.layoutConfig;
    let materialized = Math.ceil(viewportRect.height / this.clampedHeight);

    if (!(materialized & 1)) {
      materialized += 1;
    }

    return Math.max(materialized, 3);
  }

  private calculateGhostSlides(): number {
    const { ghostSlidesMult } = this.layoutConfig;
    return ghostSlidesMult * this.materializedSlides;
  }

  private calculateTotalSlides(): number {
    return this.materializedSlides + this.ghostSlides;
  }

  private calculateContentWidth(): number {
    return this.slideWidth;
  }

  private calculateContentHeight(): number {
    const { containerGap, containerPadding } = this.layoutConfig;
    const gapSpacing = containerGap * (this.totalSlides - 1);
    const paddingSpacing = this.readVerticalPadding(containerPadding) * 2;
    const slidesHeight = this.totalSlides * this.slideHeight;

    return gapSpacing + paddingSpacing + slidesHeight;
  }

  private readVerticalPadding(rule: [number, number]): number {
    return rule[1];
  }

  private readHorizontalPadding(rule: [number, number]): number {
    return rule[0];
  }
}
