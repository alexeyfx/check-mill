/**
 * SlideFactory is responsible for producing slide container elements.
 * Each slide is a lightweight div with a "slide" class, designed to wrap other content.
 */
export class SlideFactory {
  /**
   * Cached template element for efficient cloning.
   */
  private template!: HTMLElement;

  private readonly document: Document;

  constructor(ownerDocument: Document) {
    this.document = ownerDocument;
    this.prefabricate();
  }

  /**
   * Returns a single cloned slide element.
   */
  public create(): HTMLElement {
    return this.template.cloneNode(true) as HTMLElement;
  }

  /**
   * Returns an iterator that yields cloned slide elements one by one.
   *
   * @param length The number of slide elements to generate.
   * @returns A generator that yields HTMLElement slides
   */
  public *batch(length: number): IterableIterator<HTMLElement> {
    for (let i = 0; i < length; i++) {
      yield this.create();
    }
  }

  /**
   * Creates the base slide template with default styling.
   * This template is reused and cloned to create slides efficiently.
   */
  private prefabricate(): void {
    const div = this.document.createElement("div");
    div.classList.add("_int_slide");

    this.template = div;
  }
}
