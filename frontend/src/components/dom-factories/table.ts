/**
 * TableFactory is responsible for building table.
 */
export class TableFactory {
  private template!: HTMLTableElement;

  private readonly document: Document;

  constructor(ownerDocument: Document) {
    this.document = ownerDocument;
    this.prefabricate();
  }

  public wrap(rows: IterableIterator<HTMLTableRowElement>): HTMLTableElement {
    const table = this.template.cloneNode() as HTMLTableElement;

    for (const row of rows) {
      table.insertRow().replaceWith(row);
    }

    return table;
  }

  private prefabricate(): void {
    const table = this.document.createElement("table");
    const body = this.document.createElement("tbody");

    table.classList.add("_int_table");
    table.appendChild(body);
    this.template = table;
  }
}
