import { type SlideFactory } from "./dom-factories";

export interface SlideType {
  readonly nativeElement: HTMLElement;
  readonly realIndex: number;
  virtualIndex: number;
  pageIndex: number;
  viewportOffset: number;
}

export type SlidesCollectionType = Readonly<SlideType[]>;

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

export function Slides(slideFactory: SlideFactory, count: number): SlidesCollectionType {
  const slides = new Array(count);

  let index = 0;
  for (const nativeElement of slideFactory.batch(count)) {
    slides[index] = Slide(nativeElement, index, index, 0);
    index += 1;
  }

  return slides;
}
