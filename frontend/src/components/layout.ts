import { clamp } from "../utils";

export type LayoutConfig = {
  /** Space between cells */
  cellGap: number;

  /** Width and height of a single cell (square) */
  cellSize: number;

  /** Padding: uniform or [horizontal, vertical] */
  layoutPadding: number | [number, number];

  /** Available rendering area */
  viewportRect: DOMRect;

  /** Max height allowed as percentage of viewport height */
  maxHeightPercent: number;

  /** Minimum height that the layout can shrink to */
  minClampedHeight: number;
};

export type LayoutMetrics = {
  /** Number of rows that fit within the available (clamped) height */
  rows: number;

  /** Number of columns that fit within the available width */
  columns: number;

  /** Total number of visible cells (rows × columns) */
  total: number;

  /** Computed total width of the layout including padding and gaps */
  width: number;

  /** Computed total height of the layout including padding and gaps */
  height: number;
};

/**
 * Public interface for layout engine.
 */
export interface LayoutType {
  metrics: () => LayoutMetrics;
  recompute: (newConfig: LayoutConfig) => void;
}

/**
 * Layout engine that computes how many cells can fit in a viewport,
 * and calculates total dimensions needed for rendering.
 */
export function Layout(config: LayoutConfig): LayoutType {
  /**
   * Current layout configuration
   */
  let layoutConfig: LayoutConfig;

  /**
   * Computed height after applying clamping logic (min and max limits)
   */
  let clampedHeight: number;

  /**
   * Number of columns that can fit horizontally in the viewport
   */
  let columns: number;

  /**
   * Number of rows that can fit vertically within the clamped height
   */
  let rows: number;

  /**
   * Final computed width of the entire layout (including padding and gaps)
   */
  let width: number;

  /**
   * Final computed height of the entire layout
   */
  let height: number;

  recompute(config);

  /**
   * Clamps the allowed layout height based on percentage of viewport height
   * and minimum clamp threshold.
   */
  function clampHeight(): number {
    const { viewportRect, maxHeightPercent, minClampedHeight } = layoutConfig;
    const unclamped = viewportRect.height * maxHeightPercent;
    return clamp(unclamped, minClampedHeight, viewportRect.height);
  }

  /**
   * Determines how many columns of cells can fit horizontally within the viewport.
   * Accounts for cell size, gap between them, and horizontal padding.
   */
  function calculateColumns(): number {
    const { cellSize, cellGap, viewportRect } = layoutConfig;
    const horizontalPadding = readHorizontalPadding();
    const availableWidth = viewportRect.width - 2 * horizontalPadding;

    let count = 1;
    while (count * cellSize + (count - 1) * cellGap <= availableWidth) {
      count += 1;
    }

    return count;
  }

  /**
   * Determines how many rows of cells can fit vertically within the clamped height.
   * Accounts for cell size, gap, and vertical padding.
   */
  function calculateRows(): number {
    const { cellSize, cellGap } = layoutConfig;
    const verticalPadding = readVerticalPadding();
    const availableHeight = clampedHeight - 2 * verticalPadding;

    let count = 1;
    while (count * cellSize + (count - 1) * cellGap <= availableHeight) {
      count += 1;
    }

    return count;
  }

  /**
   * Calculates the total width required to render the current number of columns.
   * Adds cell sizes, gaps, and horizontal padding.
   */
  function calculateWidth(): number {
    const { cellSize, cellGap } = layoutConfig;
    const horizontalPadding = readHorizontalPadding();

    return columns * cellSize + (columns - 1) * cellGap + 2 * horizontalPadding;
  }

  /**
   * Calculates the total height required to render the current number of rows.
   * Adds cell sizes, gaps, and vertical padding.
   */
  function calculateHeight(): number {
    const { cellSize, cellGap } = layoutConfig;
    const verticalPadding = readVerticalPadding();

    return rows * cellSize + (rows - 1) * cellGap + 2 * verticalPadding;
  }

  /**
   * Extracts the vertical padding value from layoutPadding.
   */
  function readVerticalPadding(): number {
    const { layoutPadding } = layoutConfig;
    return Array.isArray(layoutPadding) ? layoutPadding[1] : layoutPadding;
  }

  /**
   * Extracts the horizontal padding value from layoutPadding.
   */
  function readHorizontalPadding(): number {
    const { layoutPadding } = layoutConfig;
    return Array.isArray(layoutPadding) ? layoutPadding[0] : layoutPadding;
  }

  /**
   * Recomputes layout metrics based on a new config.
   */
  function recompute(newConfig: LayoutConfig): void {
    layoutConfig = newConfig;
    clampedHeight = clampHeight();
    columns = calculateColumns();
    rows = calculateRows();
    width = calculateWidth();
    height = calculateHeight();
  }

  /**
   * Returns current layout metrics.
   */
  function metrics(): LayoutMetrics {
    const total = rows * columns;

    return {
      rows,
      columns,
      total,
      width,
      height,
    };
  }

  return {
    metrics,
    recompute,
  };
}
