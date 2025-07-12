import type { LayoutMetrics } from "./layout";

export interface SlideType {
  realIndex: number;
  virtualIndex: number;
  pageIndex: number;
}

export function Slide(realIndex: number, virtualIndex: number, pageIndex: number): SlideType {
  return {
    realIndex,
    virtualIndex,
    pageIndex,
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
