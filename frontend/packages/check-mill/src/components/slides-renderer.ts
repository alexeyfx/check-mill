import type { WindowType } from "../utils";
import type { AxisType } from "./axis";
import { CheckboxFactory } from "./dom-factories";
import type { LayoutMetrics } from "./layout";
import { RafSequencer } from "./raf-sequencer";
import { ScrollMotionType } from "./scroll-motion";
import type { SlideType, SlidesCollectionType } from "./slides";
import { Translate } from "./translate";

export interface SlidesRendererType {
  appendSlides(slides: SlidesCollectionType): void;
  fadeIn(slide: SlideType, motion: ScrollMotionType): void;
  fadeOut(slide: SlideType, motion: ScrollMotionType): void;
  syncOffset(slides: SlidesCollectionType): void;
}

export function SlidesRenderer(
  ownerDocument: Document,
  ownerWindow: WindowType,
  root: HTMLElement,
  axis: AxisType,
  metrics: LayoutMetrics
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
   * Factory for creating checkbox DOM nodes at given (x, y) positions.
   */
  const checkboxFactory = new CheckboxFactory(ownerDocument);

  /**
   * The maximum translation range per slide based on layout metrics.
   * Used to scale each slide’s `viewportOffset` into pixels.
   */
  const slideTranslateRange = metrics.contentHeight - metrics.containerGap;

  /**
   * RAF-driven sequencer that runs at most one task per frame.
   * A slightly lower FPS smooths IO/DOM pressure during heavy appends.
   */
  const rafSequencer = RafSequencer(ownerWindow, 60);

  /**
   * Tracks the active task-group id per slide index.
   * When a new animation starts for a slide, the previous group is cancelled.
   *
   * key: slide.realIndex
   * val: group id returned by `rafSequencer.enqueue`
   */
  const activeGroupIdBySlide = new Map<number, number>();

  precomputeCheckboxRowFragments();

  /**
   * Append the native elements for all slides to the root container.
   */
  function appendSlides(slides: SlidesCollectionType): void {
    for (const { nativeElement } of slides) {
      root.appendChild(nativeElement);
    }
  }

  /**
   * Precompute a row-aligned set of checkbox fragments covering the grid.
   * Each fragment contains one row of checkboxes positioned on the grid.
   */
  function precomputeCheckboxRowFragments(): void {
    const { columns, rows, checkboxSize, gridGap } = metrics;
    const cellSize = checkboxSize + gridGap;

    for (let x = 0, y = 0, row = 0; row < rows; x = 0, y += cellSize, row += 1) {
      const fragment = ownerDocument.createDocumentFragment();

      for (let col = 0; col < columns; col += 1, x += cellSize) {
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
  function fadeIn(slide: SlideType, motion: ScrollMotionType): void {
    const { direction } = motion;
    const { realIndex, nativeElement } = slide;

    const tasks: VoidFunction[] = [];
    const container = nativeElement.children[0] as HTMLElement;

    if (activeGroupIdBySlide.has(realIndex)) {
      rafSequencer.cancel(activeGroupIdBySlide.get(realIndex) as number);
    }

    for (const fragment of checkboxRowFragments) {
      tasks.push(() => container.append(fragment.cloneNode(true)));
    }

    if (direction === 1) {
      tasks.reverse();
    }

    const groupId = rafSequencer.enqueue(tasks);
    activeGroupIdBySlide.set(realIndex, groupId);
  }

  /**
   * Stop any in-flight animation for the slide and clear its container.
   * Uses a single-frame task to perform the DOM cleanup via the sequencer
   * (keeps all DOM mutations serialized through the same pipeline).
   */
  function fadeOut(slide: SlideType, _motion: ScrollMotionType): void {
    const { realIndex, nativeElement } = slide;

    const existingGroupId = activeGroupIdBySlide.get(realIndex);
    if (existingGroupId) {
      rafSequencer.cancel(existingGroupId);
    }

    rafSequencer.enqueue([() => nativeElement.children[0].replaceChildren()]);
  }

  /**
   * Apply translation to each slide based on its viewport offset.
   * The offset is scaled by the precomputed `slideTranslateRange`.
   */
  function syncOffset(slides: SlidesCollectionType): void {
    for (const { nativeElement, viewportOffset } of slides) {
      translate.to(nativeElement, viewportOffset * slideTranslateRange);
    }
  }

  return { appendSlides, fadeIn, fadeOut, syncOffset };
}
