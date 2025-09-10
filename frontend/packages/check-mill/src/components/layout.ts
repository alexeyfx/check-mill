/**
 * Defines the padding for a container or slide.
 */
export type Padding = {
  vertical: number;
  horizontal: number;
};

/**
 * Defines all sizing and spacing parameters for the main layout.
 * All dimension values are in pixels unless otherwise specified.
 */
export type LayoutConfig = {
  /**
   * The size (width and height) of a single checkbox within a slide.
   */
  checkboxSize: number;

  /**
   * The spacing between checkboxes within a slide's grid.
   */
  gridSpacing: number;

  /**
   * The initial DOMRect of the main viewport element.
   */
  viewportRect: DOMRect;

  /**
   * A multiplier that determines how many off-screen "ghost" slides to render
   * for a seamless infinite loop effect. E.g., a value of 2 means render
   * two full viewports of slides on each side.
   */
  loopBufferSizeRatio: number;

  /**
   * The internal padding within the main container element.
   */
  containerPadding: Padding;

  /**
   * The spacing between individual slides.
   */
  slideSpacing: number;

  /**
   * The maximum allowed width of a single slide.
   */
  slideMaxWidth: number;

  /**
   * The maximum height of a slide, expressed as a ratio (0.0 to 1.0)
   * of the viewport's height.
   */
  slideMaxHeightAsViewportRatio: number;

  /**
   * The absolute minimum height of a slide.
   */
  slideMinHeightInPx: number;

  /**
   * The internal padding within a single slide element.
   */
  slidePadding: Padding;
};

/**
 * Contains the results of all layout calculations based on a LayoutConfig.
 * This object holds the definitive, computed dimensions and counts used for rendering.
 */
export type ComputedLayout = {
  /**
   * The final, calculated dimensions of a single slide.
   */
  slide: {
    width: number;
    height: number;
  };

  /**
   * The calculated grid structure within each slide.
   */
  grid: {
    rows: number;
    columns: number;
    cellsPerSlide: number;
  };

  /**
   * The calculated number of slides required for the infinite loop.
   */
  slideCount: {
    inView: number;
    buffer: number;
    total: number;
  };

  /**
   * The final, calculated dimensions of the total scrollable content area.
   */
  contentArea: {
    width: number;
    height: number;
  };
};

/**
 * A merged type containing both the input configuration and the computed output.
 */
export type LayoutProperties = LayoutConfig & ComputedLayout;

/**
 * Creates the initial, complete layout properties object from a configuration.
 * @param initialConfig The initial layout configuration.
 * @returns A frozen, read-only object with all layout properties.
 */
export function createLayout(initialConfig: LayoutConfig): Readonly<LayoutProperties> {
  const metrics = computeLayout(initialConfig);
  return Object.freeze({ ...initialConfig, ...metrics });
}

/**
 * Takes the current layout properties and a set of updates, and returns a
 * new, re-computed layout properties object.
 * @param currentProps The complete, current layout properties object.
 * @param updates A partial object of LayoutConfig properties to change.
 * @returns A new, frozen, read-only object with all updated layout properties.
 */
export function updateLayout(
  currentProps: LayoutProperties,
  updates: Partial<LayoutConfig>
): Readonly<LayoutProperties> {
  const newConfig: LayoutConfig = {
    ...currentProps,
    ...updates,
  };
  const newMetrics = computeLayout(newConfig);
  return Object.freeze({ ...newConfig, ...newMetrics });
}

/**
 * A pure function that calculates layout metrics based on a configuration.
 * This is a direct translation of the logic from your Layout class.
 * @param config The input configuration object.
 * @returns The computed layout metrics.
 */
export function computeLayout(config: LayoutConfig): ComputedLayout {
  const maxPossibleHeight = config.viewportRect.height * config.slideMaxHeightAsViewportRatio;

  const clampedSlideHeight = Math.max(config.slideMinHeightInPx, maxPossibleHeight);

  const availableHeightForGrid = clampedSlideHeight - config.slidePadding.vertical * 2;

  const gridRows = Math.floor(
    (availableHeightForGrid + config.gridSpacing) / (config.checkboxSize + config.gridSpacing)
  );

  const availableWidthForSlide = config.viewportRect.width - config.containerPadding.horizontal;

  const slideContentWidth =
    Math.min(config.slideMaxWidth, availableWidthForSlide) - config.slidePadding.horizontal * 2;

  const gridColumns = Math.floor(
    (slideContentWidth + config.gridSpacing) / (config.checkboxSize + config.gridSpacing)
  );

  const cellsPerSlide = gridRows * gridColumns;

  const finalSlideHeight =
    gridRows * config.checkboxSize +
    (gridRows - 1) * config.gridSpacing +
    config.slidePadding.vertical * 2;

  const finalSlideWidth =
    gridColumns * config.checkboxSize +
    (gridColumns - 1) * config.gridSpacing +
    config.slidePadding.horizontal * 2;

  const slidesInViewCount = Math.floor(config.viewportRect.height / finalSlideHeight);

  const bufferCount = Math.ceil(slidesInViewCount * config.loopBufferSizeRatio);

  const totalSlidesCount = slidesInViewCount + bufferCount * 2;

  const contentWidth = finalSlideWidth;

  const contentHeight =
    totalSlidesCount * finalSlideHeight +
    (totalSlidesCount - 1) * config.slideSpacing +
    config.containerPadding.vertical * 2;

  return {
    slide: {
      width: finalSlideWidth,
      height: finalSlideHeight,
    },
    grid: {
      rows: gridRows,
      columns: gridColumns,
      cellsPerSlide: cellsPerSlide,
    },
    slideCount: {
      inView: slidesInViewCount,
      buffer: bufferCount,
      total: totalSlidesCount,
    },
    contentArea: {
      width: contentWidth,
      height: contentHeight,
    },
  };
}
