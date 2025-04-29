export type LayoutConfig = {
  cellPadding: number;
  checkboxSize: number;
  layoutPadding: [number, number];
  viewportRect: DOMRect;
  maxWidth: number;
  maxHeightPercent: number;
  minClampedHeight: number;
  generation: symbol;
};

export type LayoutMetrics = {
  cellPadding: number;
  checkboxSize: number;
  layoutPadding: [number, number];
  rows: number;
  columns: number;
  totalCells: number;
  slideWidth: number;
  slideHeight: number;
  materializedSlides: number;
  ghostSlides: number;
  totalSlides: number;
};
