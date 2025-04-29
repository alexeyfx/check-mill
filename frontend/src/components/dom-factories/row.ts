/**
 * TableRowsFactory is responsible for building table rows
 * containing rendered components per cell.
 */
export class TableRowsFactory<T extends HTMLElement> {
  private template!: HTMLTableRowElement;

  private readonly document: Document;

  constructor(ownerDocument: Document) {
    this.document = ownerDocument;
    this.prefabricate();
  }

  /**
   * Creates a single checkbox by cloning the cached template.
   * @param checked - Optional boolean to set the checkbox state.
   * @returns A cloned and optionally checked HTMLInputElement.
   */
  public create(children: IterableIterator<T>): HTMLTableRowElement {
    const row = this.template.cloneNode(true) as HTMLTableRowElement;

    for (const child of children) {
      const cell = row.insertCell();
      cell.classList.add("_int_td");
      cell.appendChild(child);
    }

    return row;
  }

  /**
   * Creates a single row of rendered components.
   * Applies the provided map function to each cell index.
   */
  public *batch(
    length: number,
    mapFn: () => IterableIterator<T>
  ): IterableIterator<HTMLTableRowElement> {
    for (let i = 0; i < length; i += 1) {
      yield this.create(mapFn());
    }
  }

  private prefabricate(): void {
    this.template = this.document.createElement("tr");
  }
}
