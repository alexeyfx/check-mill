import { type Disposable, DisposableStore, TypedEvent } from "../core";

export class Viewport {
  private memoRect: DOMRect;

  private readonly disposables = new DisposableStore();

  private readonly resizeObserver = new ResizeObserver(() => this.handleResize());

  public readonly resized = new TypedEvent<DOMRect>();

  constructor(private readonly root: HTMLElement) {
    this.memoRect = this.root.getBoundingClientRect();
  }

  public init(): Disposable {
    this.resizeObserver.observe(this.root);

    this.disposables.push(
      () => this.resized.clear(),
      () => this.resizeObserver.disconnect(),
    );

    return () => this.disposables.flushAll();
  }

  public measure(): DOMRect {
    return this.memoRect;
  }

  private handleResize(): void {
    this.memoRect = this.root.getBoundingClientRect();
    this.resized.emit(this.memoRect);
  }
}
