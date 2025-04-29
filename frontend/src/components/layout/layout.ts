import { clamp } from "../../utils";
import type { LayoutConfig, LayoutMetrics } from "./types";
import { isLayoutConfigsEqual } from "./utils";

export interface LayoutType {
  metrics(): Readonly<LayoutMetrics>;
  update(newConfig: Readonly<LayoutConfig>): void;
}

export class Layout implements LayoutType {
  /**
   * Current layout configuration
   */
  private layoutConfig: Readonly<LayoutConfig>;

  /**
   * Computed height after applying clamping logic (min and max limits)
   */
  private clampedHeight!: number;

  /**
   * Number of columns that can fit horizontally in the viewport
   */
  private columns!: number;

  /**
   * Number of rows that can fit vertically within the clamped height
   */
  private rows!: number;

  /**
   * Final computed width of the entire layout (including padding and gaps)
   */
  private slideWidth!: number;

  /**
   * Final computed height of the entire layout
   */
  private slideHeight!: number;

  /**
   * Total count of “real”, content-bearing slides that are currently
   * materialized in the DOM and can appear in the viewport.
   */
  private materializedSlides!: number;

  /**
   * Count of “ghost” slides — lightweight stubs or placeholders that
   * remain in the DOM even when they hold no user content.
   */
  private ghostSlides!: number;

  /**
   * Cached metrics — rebuilt lazily when `layoutConfig` changes.
   */
  private cachedMetrics: LayoutMetrics | null = null;

  public constructor(config: Readonly<LayoutConfig>) {
    this.layoutConfig = config;
    this.recomputeAll();
  }

  /**
   * Recomputes layout metrics based on a new config.
   */
  public update(newLayoutConfig: LayoutConfig): void {
    if (isLayoutConfigsEqual(newLayoutConfig, this.layoutConfig)) {
      return;
    }

    this.layoutConfig = newLayoutConfig;
    this.recomputeAll();
  }

  /**
   * Returns current layout metrics.
   */
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
      layoutConfig: { checkboxSize, cellPadding, layoutPadding },
    } = this;

    const totalCells = rows * columns;
    const totalSlides = materializedSlides + ghostSlides;

    this.cachedMetrics = {
      checkboxSize,
      cellPadding,
      layoutPadding,
      rows,
      columns,
      totalCells,
      slideHeight,
      slideWidth,
      materializedSlides,
      ghostSlides,
      totalSlides,
    };

    return this.cachedMetrics;
  }

  /**
   * Recompute *all* derived geometry from `layoutConfig`.
   */
  private recomputeAll(): void {
    this.clampedHeight = this.clampHeight();
    this.rows = this.calculateRows();
    this.columns = this.calculateColumns();
    this.slideWidth = this.calculateWidth();
    this.slideHeight = this.calculateHeight();
    this.materializedSlides = this.calculateMaterializedSlides();
    this.ghostSlides = this.calculateGhostSlides();
    this.cachedMetrics = null;
  }

  /**
   * Clamps the allowed layout height based on percentage of viewport height
   */
  private clampHeight(): number {
    const { viewportRect, maxHeightPercent, minClampedHeight } = this.layoutConfig;
    const unclamped = viewportRect.height * (maxHeightPercent / 100);

    return clamp(unclamped, minClampedHeight, viewportRect.height);
  }

  /**
   * Determines how many columns of cells can fit horizontally within the viewport.
   */
  private calculateColumns(): number {
    const { checkboxSize, cellPadding, viewportRect, maxWidth } = this.layoutConfig;
    const availableWidth = Math.min(
      viewportRect.width - 2 * this.readHorizontalPadding(),
      maxWidth - 2 * this.readHorizontalPadding()
    );

    let count = 0;
    while ((count + 1) * (checkboxSize + 2 * cellPadding) <= availableWidth) {
      count += 1;
    }

    return count;
  }

  /**
   * Determines how many rows of cells can fit vertically within the clamped height.
   */
  private calculateRows(): number {
    const { checkboxSize, cellPadding } = this.layoutConfig;
    const availableHeight = this.clampedHeight - 2 * this.readVerticalPadding();

    let count = 1;
    while ((count + 1) * (checkboxSize + 2 * cellPadding) <= availableHeight) {
      count += 1;
    }

    return count;
  }

  /**
   * Calculates the total width required to render the current number of columns.
   */
  private calculateWidth(): number {
    const { checkboxSize, cellPadding } = this.layoutConfig;
    const horizontalPadding = this.readHorizontalPadding();

    return this.columns * (checkboxSize + 2 * cellPadding) + 2 * horizontalPadding;
  }

  /**
   * Calculates the total height required to render the current number of rows.
   */
  private calculateHeight(): number {
    const { checkboxSize, cellPadding } = this.layoutConfig;
    const verticalPadding = this.readVerticalPadding();

    return this.rows * (checkboxSize + 2 * cellPadding) + 2 * verticalPadding;
  }

  /**
   * Calculates how many slides can fit into the current viewport height.
   */
  private calculateMaterializedSlides(): number {
    const { viewportRect } = this.layoutConfig;
    let materialized = Math.ceil(viewportRect.height / this.clampedHeight);

    if (!(materialized & 1)) {
      materialized += 1;
    }

    return Math.max(materialized, 3);
  }

  /**
   * Calculates how many "ghost" slides are kept preloaded (2x viewport buffer).
   */
  private calculateGhostSlides(): number {
    return 3 * this.materializedSlides;
  }

  /**
   * Extracts the vertical padding value from layoutPadding.
   */
  private readVerticalPadding(): number {
    return this.layoutConfig.layoutPadding[1];
  }

  /**
   * Extracts the horizontal padding value from layoutPadding.
   */
  private readHorizontalPadding(): number {
    return this.layoutConfig.layoutPadding[0];
  }
}
