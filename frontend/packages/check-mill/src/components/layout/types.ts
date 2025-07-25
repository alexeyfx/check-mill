// prettier-ignore
export type LayoutConfig = {
  checkboxSize:          number;
  gridGap:               number;
  slidePadding:          [number, number];
  containerGap:          number;
  containerPadding:      [number, number];
  ghostSlidesMult:       number;
  viewportRect:          DOMRect;
  slideMaxWidth:         number;
  slideMaxHeightPercent: number;
  slideMinClampedHeight: number;
  totalCells:          number;
};

type CommonLayoutProperties = Pick<
  LayoutConfig,
  "slidePadding" | "containerGap" | "containerPadding" | "gridGap" | "checkboxSize" | "totalCells"
>;

// prettier-ignore
export type LayoutMetrics = {
  checkboxSize:       number;
  rows:               number;
  columns:            number;
  cellsPerPage:       number;
  slideWidth:         number;
  slideHeight:        number;
  materializedSlides: number;
  ghostSlides:        number;
  totalSlides:        number;
  contentWidth:       number;
  contentHeight:      number;
} & CommonLayoutProperties;
