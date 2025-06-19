import type { LayoutMetrics } from "./layout";
import { CheckboxFactory, SlideFactory } from "./dom-factories";
import { px } from "../utils";

const enum CSSVariables {
  CHECKBOX_SIZE = "--checkbox-size",
  GRID_GAP = "--grid-gap",
  SLIDE_WIDTH = "--slide-width",
  SLIDE_HEIGHT = "--slide-height",
  SLIDE_PADDING = "--slide-padding",
  CONTAINER_GAP = "--container-gap",
  CONTAINER_PADDING = "--container-padding",
}

export class Presenter {
  private readonly root: HTMLElement;

  private readonly document: Document;

  private readonly fragment: DocumentFragment;

  private readonly slideFactory: SlideFactory;

  private readonly checkboxFactory: CheckboxFactory;

  private readonly _slides: HTMLElement[] = [];

  private layoutMetrics: LayoutMetrics;

  constructor(ownerDocument: Document, root: HTMLElement, metrics: LayoutMetrics) {
    this.root = root;
    this.document = ownerDocument;
    this.fragment = ownerDocument.createDocumentFragment();
    this.layoutMetrics = metrics;

    this.slideFactory = new SlideFactory(this.document);
    this.checkboxFactory = new CheckboxFactory(this.document);

    this.writeVariables();
  }

  /**
   * Initializes empty (ghost) slides in the DOM.
   */
  public initializePlaceholders(): void {
    const { totalSlides } = this.layoutMetrics;

    this.destroyAllSlides();

    for (const slide of this.slideFactory.batch(totalSlides)) {
      this._slides.push(slide);
      this.root.appendChild(slide);
    }
  }

  /**
   * Populates a slide with pre-generated checkbox content.
   */
  public populateSlide(index: number): void {
    const target = this._slides[index];
    const fragment = this.fragment;

    if (!this.fragment.hasChildNodes()) {
      this.populateFragmentCache();
    }

    target.children[0].replaceChildren(fragment.cloneNode(true));
  }

  /**
   * Synchronizes a slide with the expected filled/empty state.
   */
  public syncSlide(index: number): void {
    const {} = this.layoutMetrics;
    const target = this._slides[index];

    if (!target) {
      return;
    }
  }

  /**
   * Empties a slide, reverting it back to a placeholder.
   */
  public emptySlide(index: number): void {
    const target = this._slides[index];
    target.children[0]?.replaceChildren();
  }

  /**
   * Destroys all slides, cleaning up DOM and memory.
   */
  public destroyAllSlides(): void {
    this.root.replaceChildren();
    this._slides.length = 0;
  }

  /**
   * Lazily populates the internal fragment with checkbox elements,
   * arranged in a grid based on the layout metrics.
   */
  private populateFragmentCache(): void {
    const { columns, checkboxSize, gridGap, totalCells } = this.layoutMetrics;

    const cellSize = checkboxSize + gridGap;
    const fragment = this.fragment;

    let x = 0;
    let y = 0;
    let column = 0;

    const advance = () => {
      column++;
      const wrap = (column - columns) >> 31;
      const nextX = x + cellSize;
      const nextY = y + (cellSize & ~wrap);
      x = nextX & wrap;
      y = nextY;
      column = column & wrap;
    };

    for (let i = 0; i < totalCells; i += 1) {
      fragment.appendChild(this.checkboxFactory.create(x, y));
      advance();
    }
  }

  /**
   * Writes layout variables into CSS custom properties.
   */
  private writeVariables(): void {
    const { style } = this.root;
    const {
      checkboxSize,
      gridGap,
      containerGap,
      containerPadding,
      slidePadding,
      slideHeight,
      slideWidth,
    } = this.layoutMetrics;

    this.root.setAttribute("style", "");

    style.setProperty(CSSVariables.CHECKBOX_SIZE, px(checkboxSize));
    style.setProperty(CSSVariables.GRID_GAP, px(gridGap));
    style.setProperty(CSSVariables.SLIDE_PADDING, px(slidePadding));
    style.setProperty(CSSVariables.SLIDE_WIDTH, px(slideWidth));
    style.setProperty(CSSVariables.SLIDE_HEIGHT, px(slideHeight));
    style.setProperty(CSSVariables.CONTAINER_GAP, px(containerGap));
    style.setProperty(CSSVariables.CONTAINER_PADDING, px(containerPadding));
  }
}
