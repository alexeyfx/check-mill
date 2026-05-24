import { assert } from "../../core";

export class DOMScrollViewport {
  private runwayElement: HTMLDivElement | null = null;

  private viewportElement: HTMLDivElement | null = null;

  constructor(public readonly root: HTMLElement) {}

  public mount(): void {
    const ownerDocument = this.root.ownerDocument;

    this.viewportElement = ownerDocument.createElement("div");
    this.viewportElement.classList.add("_int_scroller");

    this.runwayElement = ownerDocument.createElement("div");
    this.runwayElement.classList.add("_int_runway");

    this.viewportElement.appendChild(this.runwayElement);
    this.root.appendChild(this.viewportElement);
  }

  public unmount(): void {
    if (this.viewportElement && this.viewportElement.parentNode) {
      this.viewportElement.parentNode.removeChild(this.viewportElement);
    }
    this.viewportElement = null;
    this.runwayElement = null;
  }

  public getViewportElement(): HTMLElement {
    assert(this.viewportElement, "Viewport DOM elements must be mounted before access.");
    return this.viewportElement;
  }

  public updateRunwayHeight(height: number): void {
    if (!this.runwayElement) return;
    this.runwayElement.style.height = `${height}px`;
  }

  public setScrollTop(position: number): void {
    if (!this.viewportElement) return;
    this.viewportElement.scrollTop = position;
  }

  public getScrollTop(): number {
    return this.viewportElement ? this.viewportElement.scrollTop : 0;
  }
}
