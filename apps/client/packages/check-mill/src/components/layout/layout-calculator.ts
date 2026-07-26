import { assert } from "../../core";
import { solveDivisibleGrid, type GridSolver } from "./grid-solver";
import { availableGridHeight, availableGridWidth, lengthWithGaps } from "./viewport-bounds";

export interface Size {
  readonly width: number;
  readonly height: number;
}

export interface Padding {
  readonly vertical: number;
  readonly horizontal: number;
}

export interface LayoutConfig {
  readonly checkboxSize: number;
  readonly gridSpacing: number;
  readonly slideSpacing: number;
  readonly viewportSize: Size;
  readonly containerPadding: Padding;
  readonly slidePadding: Padding;
  readonly slideMaxWidth: number;
  readonly slideMinHeight: number;
  readonly slideMaxHeightRatio: number;
  readonly totalItemCount: number;
  readonly minGridDimension: number;
  readonly maxGridDimension: number;
  readonly loopBufferSizeRatio: number;
}

export interface GridDimensions {
  readonly rows: number;
  readonly columns: number;
}

export interface SlideCountMetrics {
  readonly visible: number;
  readonly total: number;
}

export interface PaginationMetrics {
  readonly itemsPerSlide: number;
  readonly totalItems: number;
  readonly totalPages: number;
}

export interface ComputedLayout {
  readonly slide: Size;
  readonly grid: GridDimensions;
  readonly slideCount: SlideCountMetrics;
  readonly contentArea: Size;
  readonly pagination: PaginationMetrics;
}

export interface LayoutContext {
  readonly config: Readonly<LayoutConfig>;
  readonly computed: Readonly<ComputedLayout>;
}

export function computeLayout(
  config: LayoutConfig,
  solve: GridSolver = solveDivisibleGrid,
): ComputedLayout {
  const checkboxFootprint = config.checkboxSize + config.gridSpacing;
  assert(
    checkboxFootprint > 0,
    "Invalid Configuration: Checkbox dimensions combined with spacing gaps must be greater than 0",
  );

  const structuralMaxRows = Math.floor(
    (availableGridHeight(config) + config.gridSpacing) / checkboxFootprint,
  );
  const structuralMaxCols = Math.floor(
    (availableGridWidth(config) + config.gridSpacing) / checkboxFootprint,
  );

  const optimizedGrid = solve({
    maxRows: structuralMaxRows,
    maxCols: structuralMaxCols,
    minDim: config.minGridDimension,
    maxDim: config.maxGridDimension,
    totalItemCount: config.totalItemCount,
  });

  const finalSlideHeight =
    lengthWithGaps(optimizedGrid.rows, config.checkboxSize, config.gridSpacing) +
    config.slidePadding.vertical * 2;
  const finalSlideWidth =
    lengthWithGaps(optimizedGrid.columns, config.checkboxSize, config.gridSpacing) +
    config.slidePadding.horizontal * 2;

  const nonZeroClampedSlideHeight = Math.max(1, finalSlideHeight);
  const visibleCount = Math.ceil(config.viewportSize.height / nonZeroClampedSlideHeight);
  const bufferCount = Math.ceil(visibleCount * config.loopBufferSizeRatio);
  const totalCount = visibleCount + bufferCount;

  const totalContentRunwayHeight =
    lengthWithGaps(totalCount, finalSlideHeight, config.slideSpacing) +
    config.containerPadding.vertical * 2;
  const cellsPerSlideTotal = optimizedGrid.rows * optimizedGrid.columns;

  return {
    slide: { width: finalSlideWidth, height: finalSlideHeight },
    grid: optimizedGrid,
    slideCount: {
      visible: visibleCount,
      total: totalCount,
    },
    contentArea: {
      width: finalSlideWidth,
      height: totalContentRunwayHeight,
    },
    pagination: {
      itemsPerSlide: cellsPerSlideTotal,
      totalItems: config.totalItemCount,
      totalPages: config.totalItemCount / cellsPerSlideTotal,
    },
  };
}
