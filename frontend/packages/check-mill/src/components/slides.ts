import type { SlideFactory } from "./dom-factories";
import type { LayoutMetrics } from "./layout";

export interface SlideType {
  readonly nativeElement: HTMLElement;
  readonly realIndex: number;
  virtualIndex: number;
  pageIndex: number;
  viewportOffset: number;
}

export function Slide(
  nativeElement: HTMLElement,
  realIndex: number,
  virtualIndex: number,
  pageIndex: number,
  viewportOffset = 0
): SlideType {
  return {
    nativeElement,
    realIndex,
    virtualIndex,
    pageIndex,
    viewportOffset,
  };
}

export type SlidesType = Readonly<SlideType[]>;

export function Slides(slideFactory: SlideFactory, metrics: LayoutMetrics): SlidesType {
  const slides = new Array(metrics.totalSlides);

  let index = 0;
  for (const slideElement of slideFactory.batch(metrics.totalSlides)) {
    slides[index] = Slide(slideElement, index, index, 0);
    index += 1;
  }

  return slides;
}
