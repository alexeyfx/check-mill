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
};

type CommonLayoutProperties = Pick<
  LayoutConfig,
  "slidePadding" | "containerGap" | "containerPadding" | "gridGap" | "checkboxSize"
>;

// prettier-ignore
export type LayoutMetrics = {
  checkboxSize:       number;
  rows:               number;
  columns:            number;
  totalCells:         number;
  slideWidth:         number;
  slideHeight:        number;
  materializedSlides: number;
  ghostSlides:        number;
  totalSlides:        number;
  contentWidth:       number;
  contentHeight:      number;
} & CommonLayoutProperties;
