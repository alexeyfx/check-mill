import type { AxisType } from "./axis";
import { CheckboxFactory } from "./dom-factories";
import type { LayoutMetrics } from "./layout";
import type { ScrollMotionType } from "./scroll-motion";
import type { SlideType, SlidesCollectionType } from "./slides";
import { Translate } from "./translate";

export interface SlidesRendererType {
  appendSlides(slides: SlidesCollectionType): void;
  fadeIn(slide: SlideType): void;
  fadeOut(slide: SlideType): void;
  syncOffset(motion: ScrollMotionType, slides: SlidesCollectionType): void;
}

const FADE_IN_CLASS_NAME = "_int_slide__container--visible";

export function SlidesRenderer(
  document: Document,
  root: HTMLElement,
  axis: AxisType,
  metrics: LayoutMetrics
): SlidesRendererType {
  const translate = Translate(axis);

  const checkboxes: HTMLElement[] = [];

  const checkboxFactory = new CheckboxFactory(document);

  const translateOffset = metrics.contentHeight - metrics.containerGap;

  prerenderCheckboxes();

  function appendSlides(slides: SlidesCollectionType): void {
    for (const { nativeElement } of slides) {
      root.appendChild(nativeElement);
    }
  }

  function prerenderCheckboxes(): void {
    const { columns, rows, checkboxSize, gridGap } = metrics;
    const cellSize = checkboxSize + gridGap;

    for (let x = 0, y = 0, row = 0; row < rows; x = 0, y += cellSize, row += 1) {
      for (let col = 0; col < columns; col += 1, x += cellSize) {
        checkboxes.push(checkboxFactory.create(x, y));
      }
    }
  }

  function fadeIn(slide: SlideType): void {
    const { columns, rows } = metrics;
    const { nativeElement } = slide;

    const container = nativeElement.children[0] as HTMLElement;

    for (let i = 0; i < rows; i += 1) {
      const offset = i * columns;
      requestAnimationFrame(() =>
        checkboxes
          .slice(offset, offset + columns)
          .forEach((checkbox) => container.append(checkbox.cloneNode()))
      );
    }

    requestAnimationFrame(() => container.classList.add(FADE_IN_CLASS_NAME));
  }

  function fadeOut(slide: SlideType): void {
    const container = slide.nativeElement.children[0] as HTMLElement;

    requestAnimationFrame(() => {
      container.classList.remove(FADE_IN_CLASS_NAME);
    });

    container.addEventListener(
      "transitionend",
      () => requestAnimationFrame(() => container.replaceChildren()),
      { once: true }
    );
  }

  function syncOffset(motion: ScrollMotionType, slides: SlidesCollectionType): void {
    const { offset } = motion;

    for (const { nativeElement, viewportOffset } of slides) {
      translate.to(nativeElement, offset + viewportOffset * translateOffset);
    }
  }

  return { appendSlides, fadeIn, fadeOut, syncOffset };
}
