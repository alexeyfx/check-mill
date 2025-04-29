import type { LayoutMetrics } from "./layout";
import { CheckboxFactory, TableRowsFactory, TableFactory, SlideFactory } from "./dom-factories";
import { px } from "../utils";

const enum CSSVariables {
  CELL_PADDING = "--cell-padding",
  CHECKBOX_SIZE = "--checkbox-size",
  SLIDE_WIDTH = "--slide-width",
  SLIDE_HEIGHT = "--slide-height",
  SLIDE_PADDING = "--slide-padding",
  CONTENT_GAP = "--content-gap",
}

export class Presenter {
  private readonly slides: HTMLElement[] = [];

  private readonly checkboxFactory: CheckboxFactory;

  private readonly tableRowsFactory: TableRowsFactory<HTMLInputElement>;

  private readonly tableFactory: TableFactory;

  private readonly slideFactory: SlideFactory;

  private layoutMetrics: LayoutMetrics;

  private readonly root: HTMLElement;

  private readonly document: Document;

  constructor(ownerDocument: Document, root: HTMLElement, metrics: LayoutMetrics) {
    this.root = root;
    this.document = ownerDocument;
    this.layoutMetrics = metrics;

    this.checkboxFactory = new CheckboxFactory(this.document);
    this.tableRowsFactory = new TableRowsFactory(this.document);
    this.tableFactory = new TableFactory(this.document);
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
    const { columns, rows } = this.layoutMetrics;
    const target = this.slides[index];

    const create = () => this.checkboxFactory.batch(columns);
    const rowEls = this.tableRowsFactory.batch(rows, create);
    const tableEl = this.tableFactory.wrap(rowEls);

    target.replaceChildren(tableEl);
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
    const { checkboxSize, cellPadding, contentGap, slidePadding, slideHeight, slideWidth } =
      this.layoutMetrics;

    this.root.setAttribute("style", "");

    style.setProperty(CSSVariables.CELL_PADDING, px(cellPadding));
    style.setProperty(CSSVariables.CHECKBOX_SIZE, px(checkboxSize));
    style.setProperty(CSSVariables.SLIDE_PADDING, px(slidePadding));
    style.setProperty(CSSVariables.SLIDE_WIDTH, px(slideWidth));
    style.setProperty(CSSVariables.SLIDE_HEIGHT, px(slideHeight));
    style.setProperty(CSSVariables.CONTENT_GAP, px(contentGap));
  }
}
