import { CheckboxFactory } from "./dom-factories";
import type { LayoutMetrics } from "./layout";
import type { SlideType, SlidesType } from "./slides";

export interface RendererType {
  appendSlides(slides: SlidesType): void;
  fadeIn(slide: SlideType): void;
  fadeOut(slide: SlideType): void;
}

export function Renderer(
  document: Document,
  root: HTMLElement,
  metrics: LayoutMetrics
): RendererType {
  const fragment = document.createDocumentFragment();

  const checkboxFactory = new CheckboxFactory(document);

  prerenderGrid();

  function appendSlides(slides: SlidesType): void {
    for (const { nativeElement } of slides) {
      root.appendChild(nativeElement);
    }
  }

  function prerenderGrid(): void {
    const { columns, rows, checkboxSize, gridGap } = metrics;

    const cellSize = checkboxSize + gridGap;

    for (let x = 0, y = 0, row = 0; row < rows; x = 0, y += cellSize, row += 1) {
      for (let col = 0; col < columns; col += 1, x += cellSize) {
        fragment.appendChild(checkboxFactory.create(x, y));
      }
    }
  }

  function fadeIn(slide: SlideType): void {
    slide.nativeElement.replaceChildren(fragment.cloneNode(true));
  }

  function fadeOut(slide: SlideType): void {
    slide.nativeElement.replaceChildren();
  }

  return { appendSlides, fadeIn, fadeOut };
}
