import { type AxisType } from "./axis";
import { CheckboxFactory } from "./dom-factories";
import { type LayoutProperties } from "./layout";
import { type MotionType } from "./scroll-motion";
import { type SlidesCollectionType, type SlideType } from "./slides";
import { Translate } from "./translate";

export interface SlidesRendererType {
  appendSlides(slides: SlidesCollectionType): void;
  fadeIn(slide: SlideType, motion: MotionType): void;
  fadeOut(slide: SlideType, motion: MotionType): void;
  syncOffset(slides: SlidesCollectionType): void;
}

export function SlidesRenderer(
  ownerDocument: Document,
  root: HTMLElement,
  axis: AxisType,
  layout: Readonly<LayoutProperties>
): SlidesRendererType {
  /**
   * Translation helper for applying transform along the configured axis.
   */
  const translate = Translate(axis);

  /**
   * Prebuilt, reusable row fragments of checkboxes (one fragment per grid row).
   * We clone these when appending to a slide to avoid rebuilding individual nodes.
   */
  const checkboxRowFragments: DocumentFragment[] = [];

  /**
   * The maximum translation range per slide based on layout metrics.
   * Used to scale each slide’s `viewportOffset` into pixels.
   */
  const slideTranslateRange = layout.contentArea.height - layout.slideSpacing;

  precomputeCheckboxRowFragments();

  /**
   * Append the native elements for all slides to the root container.
   */
  function appendSlides(slides: SlidesCollectionType): void {
    root.replaceChildren(...slides.map((slide) => slide.nativeElement));
  }

  /**
   * Precompute a row-aligned set of checkbox fragments covering the grid.
   * Each fragment contains one row of checkboxes positioned on the grid.
   */
  function precomputeCheckboxRowFragments(): void {
    const cellSize = layout.checkboxSize + layout.gridSpacing;
    const checkboxFactory = new CheckboxFactory(ownerDocument);

    for (let x = 0, y = 0, row = 0; row < layout.grid.rows; x = 0, y += cellSize, row += 1) {
      const fragment = ownerDocument.createDocumentFragment();

      for (let col = 0; col < layout.grid.columns; col += 1, x += cellSize) {
        fragment.append(checkboxFactory.create(x, y));
      }

      checkboxRowFragments.push(fragment);
    }
  }

  /**
   * Animate a slide's entrance by appending one row fragment per frame.
   * If an animation is already running for this slide, it is cancelled and
   * the container is cleared before starting the new sequence.
   */
  function fadeIn(slide: SlideType): void {
    const { nativeElement } = slide;
    const fragments = checkboxRowFragments.length;
    const container = nativeElement.firstElementChild as HTMLElement;

    const clones: Node[] = [];
    for (let i = 0; i < fragments; i++) {
      clones.push(checkboxRowFragments[i].cloneNode(true));
    }

    container.append(...clones);
  }

  /**
   * Stop any in-flight animation for the slide and clear its container.
   * Uses a single-frame task to perform the DOM cleanup via the sequencer
   * (keeps all DOM mutations serialized through the same pipeline).
   */
  function fadeOut(slide: SlideType, _motion: MotionType): void {
    const { nativeElement } = slide;
    const container = nativeElement.firstElementChild as HTMLElement;

    container.replaceChildren();
  }

  /**
   * Apply translation to each slide based on its viewport offset.
   * The offset is scaled by the precomputed `slideTranslateRange`.
   */
  function syncOffset(slides: SlidesCollectionType): void {
    const range = slideTranslateRange;
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      translate.to(slide.nativeElement, slide.viewportOffset * range);
    }
  }

  return { appendSlides, fadeIn, fadeOut, syncOffset };
}
