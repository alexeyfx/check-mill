import type { LayoutMetrics } from "./layout";

export interface SlideType {
  readonly realIndex: number;
  virtualIndex: number;
  pageIndex: number;
  viewportOffset: number;
}

export function Slide(
  realIndex: number,
  virtualIndex: number,
  pageIndex: number,
  viewportOffset = 0
): SlideType {
  return {
    realIndex,
    virtualIndex,
    pageIndex,
    viewportOffset,
  };
}

export type SlidesType = Readonly<SlideType[]>;

export function Slides(metrics: LayoutMetrics): SlidesType {
  const slides = new Array(metrics.totalSlides);
  for (let i = 0; i < slides.length; i += 1) {
    slides[i] = Slide(i, i, 0);
  }

  return slides;
}
