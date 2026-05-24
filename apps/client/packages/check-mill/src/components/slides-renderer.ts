import { px, BitSet, DisposableStore, Disposable } from "../core";
import { Dataset } from "./constants";
import { CheckboxFactory } from "./dom-factories";
import { type LayoutContext } from "./layout";
import { MotionType } from "./scroll-motion";
import { type SlidesCollectionType, type Slide } from "./slides";
import { TranslationController } from "./translate";
import type { Component } from "./component";

export interface SlidesRendererType extends Component {
  hydrate(slide: Slide, board: BitSet): void;
  dehydrate(slide: Slide): void;
  updateState(slide: Slide, board: BitSet): void;
  syncPosition(slides: SlidesCollectionType, motion: MotionType): void;
}

type SlideTemplate = {
  wrapper: HTMLElement;
  inputs: HTMLInputElement[];
};

export function createSlidesRenderer(
  ownerDocument: Document,
  root: HTMLElement,
  layout: Readonly<LayoutContext>,
  slides: SlidesCollectionType,
): SlidesRendererType {
  const templatePool: SlideTemplate[] = [];
  const freeTemplates: SlideTemplate[] = [];
  const activeTemplates = new Map<HTMLElement, SlideTemplate>();

  const { itemsPerSlide } = layout.computed.pagination;
  const slideTranslateRange = layout.computed.contentArea.height - 2 * layout.config.slideSpacing;
  const stride = layout.computed.slide.height + layout.config.slideSpacing;

  const poolSize = layout.computed.slideCount.visible + 2;

  function init(): Disposable {
    const disposables = new DisposableStore();

    for (let i = 0; i < poolSize; i++) {
      templatePool.push(createSlideTemplate());
    }

    disposables.push(mountContainers(slides), () => (templatePool.length = 0));

    return () => disposables.flushAll();
  }

  function mountContainers(slides: SlidesCollectionType): Disposable {
    const { width: vw } = layout.config.viewportSize;
    const { width: sw } = layout.computed.slide;
    const centerX = px((vw - sw) / 2);

    const stage = ownerDocument.createElement("div");
    stage.classList.add("_int_slides");

    for (const { nativeElement, realIndex } of slides) {
      const style = nativeElement.style;

      style.top = px(realIndex * stride + layout.config.slideSpacing);
      style.left = centerX;

      stage.appendChild(nativeElement);
    }

    root.appendChild(stage);

    return () => root.removeChild(stage);
  }

  function hydrate(slide: Slide, board: BitSet): void {
    const { nativeElement, pageIndex } = slide;
    const container = nativeElement.firstElementChild as HTMLElement;

    let template = activeTemplates.get(container);

    if (!template) {
      template = freeTemplates.pop() || templatePool.pop();

      if (template) {
        if (template.wrapper.parentElement !== container) {
          container.appendChild(template.wrapper);
        }
        template.wrapper.style.display = "contents";
        activeTemplates.set(container, template);
      }
    }

    if (template) {
      nativeElement.setAttribute(`data-${Dataset.SLIDE_INDEX}`, pageIndex.toString());
      syncInputs(template.inputs, pageIndex, board);
    }
  }

  function dehydrate(slide: Slide): void {
    const container = slide.nativeElement.firstElementChild as HTMLElement;
    const template = activeTemplates.get(container);

    if (template) {
      template.wrapper.style.display = "none";
      freeTemplates.push(template);
      activeTemplates.delete(container);
    }

    slide.nativeElement.removeAttribute(`data-${Dataset.SLIDE_INDEX}`);
  }

  function updateState(slide: Slide, board: BitSet): void {
    const container = slide.nativeElement.firstElementChild as HTMLElement;
    const template = activeTemplates.get(container);

    if (template) {
      syncInputs(template.inputs, slide.pageIndex, board);
    }
  }

  function syncInputs(inputs: HTMLInputElement[], pageIndex: number, board: BitSet): void {
    const offset = pageIndex * itemsPerSlide;
    const len = inputs.length;

    for (let i = 0; i < len; i++) {
      const val = board.has(offset + i);

      if (inputs[i].checked !== val) {
        inputs[i].checked = val;
      }
    }
  }

  function syncPosition(slides: SlidesCollectionType, motion: MotionType): void {
    const range = slideTranslateRange;
    const mOffset = motion.offset;
    const count = slides.length;

    for (let i = 0; i < count; i++) {
      const slide = slides[i];
      TranslationController.to(slide.nativeElement, slide.viewportOffset * range + mOffset);
    }
  }

  function createSlideTemplate(): SlideTemplate {
    const wrapper = ownerDocument.createElement("div");
    wrapper.style.display = "contents";

    const inputs: HTMLInputElement[] = [];
    const factory = new CheckboxFactory(ownerDocument);
    const { rows, columns } = layout.computed.grid;
    const cellSize = layout.config.checkboxSize + layout.config.gridSpacing;

    for (let row = 0; row < rows; row++) {
      const rowOffset = row * columns;
      const y = row * cellSize;

      for (let col = 0; col < columns; col++) {
        const x = col * cellSize;
        const element = factory.create(x, y);

        const input = (
          element.tagName === "INPUT" ? element : element.querySelector("input")
        ) as HTMLInputElement;

        input.setAttribute(`data-${Dataset.CHECKBOX_INDEX}`, (rowOffset + col).toString());
        inputs.push(input);
        wrapper.appendChild(element);
      }
    }

    return { wrapper, inputs };
  }

  return { init, hydrate, dehydrate, updateState, syncPosition };
}
