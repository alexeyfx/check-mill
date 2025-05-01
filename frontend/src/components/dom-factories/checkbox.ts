/**
 * CheckboxFactory efficiently creates checkbox elements
 * using a prefabricated DOM template for performance.
 */
export class CheckboxFactory {
  /**
   * Cached checkbox element template.
   * Created once and cloned for each instance to reduce DOM creation overhead.
   */
  private template!: HTMLInputElement;

  private readonly document: Document;

  constructor(ownerDocument: Document) {
    this.document = ownerDocument;
    this.prefabricate();
  }

  /**
   * Creates a single checkbox by cloning the cached template.
   * @param top - top position (in px).
   * @param left - left position (in px).
   * @param checked - Optional boolean to set the checkbox state.
   * @returns A cloned and optionally checked HTMLInputElement.
   */
  public create(top: number, left: number, checked: boolean = false): HTMLInputElement {
    const checkbox = this.template.cloneNode(true) as HTMLInputElement;
    checkbox.checked = checked;
    checkbox.style.top = `${top}px`;
    checkbox.style.left = `${left}px`;

    return checkbox;
  }

  /**
   * Builds the initial checkbox template.
   * This element is cloned for all subsequent checkbox creation.
   */
  private prefabricate(): void {
    const checkbox = this.document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.classList.add("_int_checkbox");
    checkbox.style.position = "absolute";
    this.template = checkbox;
  }
}
