import type { AxisType } from "./axis";
import { CheckboxFactory } from "./dom-factories";
import type { LayoutMetrics } from "./layout";
import type { SlideType, SlidesCollectionType } from "./slides";
import { Translate } from "./translate";

export interface SlidesRendererType {
  appendSlides(slides: SlidesCollectionType): void;
  fadeIn(slide: SlideType): void;
  fadeOut(slide: SlideType): void;
  syncOffset(slides: SlidesCollectionType): void;
}

export function SlidesRenderer(
  document: Document,
  root: HTMLElement,
  axis: AxisType,
  metrics: LayoutMetrics
): SlidesRendererType {
  const fragment = document.createDocumentFragment();

  const checkboxFactory = new CheckboxFactory(document);

  const translate = Translate(axis);

  const translateOffset = metrics.contentHeight - metrics.containerGap;

  prependSlideContent();

  function appendSlides(slides: SlidesCollectionType): void {
    for (const { nativeElement } of slides) {
      root.appendChild(nativeElement);
    }
  }

  function prependSlideContent(): void {
    const { columns, rows, checkboxSize, gridGap } = metrics;

    const cellSize = checkboxSize + gridGap;

    for (let x = 0, y = 0, row = 0; row < rows; x = 0, y += cellSize, row += 1) {
      for (let col = 0; col < columns; col += 1, x += cellSize) {
        fragment.appendChild(checkboxFactory.create(x, y));
      }
    }
  }

  function fadeIn(slide: SlideType): void {
    const container = slide.nativeElement.children[0] as HTMLElement;

    requestAnimationFrame(() => {
      container.replaceChildren(fragment.cloneNode(true));
      container.classList.add("_int_visible");
    });
  }

  function fadeOut(slide: SlideType): void {
    const container = slide.nativeElement.children[0] as HTMLElement;

    container.classList.remove("_int_visible");
    container.addEventListener(
      "transitionend",
      () => requestAnimationFrame(() => container.replaceChildren()),
      { once: true }
    );
  }

  function syncOffset(slides: SlidesCollectionType): void {
    for (const { nativeElement, viewportOffset } of slides) {
      translate.to(nativeElement, viewportOffset * translateOffset);
    }
  }

  return { appendSlides, fadeIn, fadeOut, syncOffset };
}
