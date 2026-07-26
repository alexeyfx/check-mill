import { type SlideFactory } from "./dom-factories";

export interface Slide {
  readonly nativeElement: HTMLElement;
  readonly realIndex: number;
  virtualIndex: number;
  pageIndex: number;
  viewportOffset: number;
}

export type SlidesCollectionType = Readonly<Slide[]>;

export function createSlide(
  nativeElement: HTMLElement,
  realIndex: number,
  virtualIndex: number,
  pageIndex: number,
  viewportOffset = 0,
): Slide {
  return {
    nativeElement,
    realIndex,
    virtualIndex,
    pageIndex,
    viewportOffset,
  };
}

export function createSlides(slideFactory: SlideFactory, count: number): SlidesCollectionType {
  const slides = new Array(count);

  let index = 0;
  for (const nativeElement of slideFactory.batch(count)) {
    slides[index] = createSlide(nativeElement, index, index, 0);
    index += 1;
  }

  return slides;
}
