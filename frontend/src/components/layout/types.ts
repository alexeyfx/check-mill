// prettier-ignore
export type LayoutConfig = {
  cellPadding:      number;
  checkboxSize:     number;
  contentGap:       number;
  slidePadding:     [number, number];
  ghostSlidesMult:  number;
  viewportRect:     DOMRect;
  maxWidth:         number;
  maxHeightPercent: number;
  minClampedHeight: number;
};

type CommonLayoutProperties = Pick<
  LayoutConfig,
  "slidePadding" | "contentGap" | "cellPadding" | "checkboxSize"
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
