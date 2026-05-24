import { assert } from "../../core";
import { DivisibleGridSolver } from "./grid-solver";
import { GridSolverStrategy } from "./grid-solver";
import { ViewportBounds } from "./viewport-bounds";

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
  readonly buffer: number;
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

export class LayoutCalculator {
  private readonly gridSolver: GridSolverStrategy;

  constructor(gridSolver?: GridSolverStrategy) {
    this.gridSolver = gridSolver ?? new DivisibleGridSolver();
  }

  public create(initialConfig: LayoutConfig): LayoutContext {
    const computed = this.compute(initialConfig);
    return Object.freeze({
      config: Object.freeze({ ...initialConfig }),
      computed: Object.freeze(computed),
    });
  }

  public patch(currentContext: LayoutContext, updates: Partial<LayoutConfig>): LayoutContext {
    const freshConfig = Object.freeze({
      ...currentContext.config,
      ...updates,
    });
    return Object.freeze({
      config: freshConfig,
      computed: Object.freeze(this.compute(freshConfig)),
    });
  }

  private compute(config: LayoutConfig): ComputedLayout {
    const bounds = new ViewportBounds(config);

    const checkboxFootprint = config.checkboxSize + config.gridSpacing;
    assert(
      checkboxFootprint > 0,
      "Invalid Configuration: Checkbox dimensions combined with spacing gaps must be greater than 0",
    );

    const structuralMaxRows = Math.floor(
      (bounds.getAvailableGridHeight() + config.gridSpacing) / checkboxFootprint,
    );
    const structuralMaxCols = Math.floor(
      (bounds.getAvailableGridWidth() + config.gridSpacing) / checkboxFootprint,
    );

    const optimizedGrid = this.gridSolver.solve({
      maxRows: structuralMaxRows,
      maxCols: structuralMaxCols,
      minDim: config.minGridDimension,
      maxDim: config.maxGridDimension,
      totalItemCount: config.totalItemCount,
    });

    const totalVerticalPadding = config.slidePadding.vertical * 2;
    const totalHorizontalPadding = config.slidePadding.horizontal * 2;

    const finalSlideHeight =
      bounds.calculateLengthWithGaps(optimizedGrid.rows, config.checkboxSize, config.gridSpacing) +
      totalVerticalPadding;
    const finalSlideWidth =
      bounds.calculateLengthWithGaps(
        optimizedGrid.columns,
        config.checkboxSize,
        config.gridSpacing,
      ) + totalHorizontalPadding;

    const nonZeroClampedSlideHeight = Math.max(1, finalSlideHeight);
    const visibleCount = Math.ceil(config.viewportSize.height / nonZeroClampedSlideHeight);
    const bufferCount = Math.ceil(visibleCount * config.loopBufferSizeRatio);
    const totalCount = visibleCount + bufferCount;

    const totalContentRunwayHeight =
      bounds.calculateLengthWithGaps(totalCount, finalSlideHeight, config.slideSpacing) +
      config.containerPadding.vertical * 2;
    const cellsPerSlideTotal = optimizedGrid.rows * optimizedGrid.columns;

    return {
      slide: { width: finalSlideWidth, height: finalSlideHeight },
      grid: optimizedGrid,
      slideCount: {
        visible: visibleCount,
        buffer: bufferCount,
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
}
