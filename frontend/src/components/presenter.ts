import type { LayoutMetrics } from "./layout";
import { CheckboxFactory, SlideFactory } from "./dom-factories";
import { px } from "../utils";

const enum CSSVariables {
  CHECKBOX_SIZE = "--checkbox-size",
  GRID_GAP = "--grid-gap",
  SLIDE_WIDTH = "--slide-width",
  SLIDE_HEIGHT = "--slide-height",
  SLIDE_PADDING = "--slide-padding",
  CONTENT_GAP = "--content-gap",
}

export class Presenter {
  private readonly slides: HTMLElement[] = [];

  private readonly fragment: DocumentFragment;

  private readonly checkboxFactory: CheckboxFactory;

  private readonly slideFactory: SlideFactory;

  private layoutMetrics: LayoutMetrics;

  private readonly root: HTMLElement;

  private readonly document: Document;

  constructor(ownerDocument: Document, root: HTMLElement, metrics: LayoutMetrics) {
    this.root = root;
    this.document = ownerDocument;
    this.layoutMetrics = metrics;
    this.fragment = ownerDocument.createDocumentFragment();

    this.checkboxFactory = new CheckboxFactory(this.document);
    this.slideFactory = new SlideFactory(this.document);

    this.writeVariables();
  }

  /**
   * Initializes empty (ghost) slides in the DOM.
   */
  public initializePlaceholders(): void {
    const { totalSlides } = this.layoutMetrics;

    this.destroyAllSlides();

    for (const slide of this.slideFactory.batch(totalSlides)) {
      this.slides.push(slide);
      this.root.appendChild(slide);
    }
  }

  /**
   * Populates a placeholder slide with real content.
   */
  public populateSlide(index: number): void {
    const { totalCells } = this.layoutMetrics;
    const target = this.slides[index];
    const fragment = this.fragment;

    if (!this.fragment.hasChildNodes()) {
      const layoutFn = this.bindLayoutFn();

      for (let i = 0; i < totalCells; i += 1) {
        const [top, left] = layoutFn(i);
        const checkbox = this.checkboxFactory.create(top, left);
        fragment.appendChild(checkbox);
      }
    }

    target.replaceChildren(fragment);
  }

  public bindLayoutFn(): (index: number) => [number, number] {
    const { columns, checkboxSize, slidePadding, gridGap } = this.layoutMetrics;

    const [paddingLeft, paddingTop] = slidePadding;
    const cellSize = checkboxSize + gridGap;

    return (index: number): [number, number] => {
      const column = index % columns;
      const row = Math.floor(index / columns);

      const left = paddingLeft + column * cellSize;
      const top = paddingTop + row * cellSize;

      return [top, left];
    };
  }

  /**
   * Synchronizes a slide with the expected filled/empty state.
   */
  public syncSlide(index: number): void {
    const {} = this.layoutMetrics;
    const target = this.slides[index];

    if (!target) {
      return;
    }
  }

  /**
   * Empties a slide, reverting it back to a placeholder.
   */
  public emptySlide(index: number): void {
    const target = this.slides[index];
    target?.replaceChildren();
  }

  /**
   * Destroys all slides, cleaning up DOM and memory.
   */
  public destroyAllSlides(): void {
    this.root.replaceChildren();
    this.slides.length = 0;
  }

  /**
   * Writes layout variables into CSS custom properties.
   */
  private writeVariables(): void {
    const { style } = this.root;
    const { checkboxSize, gridGap, contentGap, slidePadding, slideHeight, slideWidth } =
      this.layoutMetrics;

    this.root.setAttribute("style", "");

    style.setProperty(CSSVariables.CHECKBOX_SIZE, px(checkboxSize));
    style.setProperty(CSSVariables.GRID_GAP, px(gridGap));
    style.setProperty(CSSVariables.SLIDE_PADDING, px(slidePadding));
    style.setProperty(CSSVariables.SLIDE_WIDTH, px(slideWidth));
    style.setProperty(CSSVariables.SLIDE_HEIGHT, px(slideHeight));
    style.setProperty(CSSVariables.CONTENT_GAP, px(contentGap));
  }
}
