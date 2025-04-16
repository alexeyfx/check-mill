import type { Disposable, EventReader, Id } from "../core";
import { World, Component, unwrap, flush, call } from "../core";
import { Resources } from "../types";

/**
 * Viewport component observes size changes of the root element
 */
export class Viewport extends Component {
  /**
   * Latest bounding client rect of the root element.
   */
  private rect!: DOMRect;

  /**
   * ID of the internal resize event.
   */
  private resizedId!: Id<ResizeObserverEntry[]>;

  /**
   * Lifespan-bound disposables for long-lived resources.
   */
  private disposables: Disposable[] = [];

  /**
   * ResizeObserver instance attached to the root element.
   */
  private resizeObserver: ResizeObserver | null = null;

  constructor(
    private readonly world: World,
    private readonly resources: Resources
  ) {
    super();
  }

  /**
   * Returns the latest known size of the viewport (root element's bounding rect).
   */
  public get size(): DOMRect {
    return this.rect;
  }

  /**
   * Returns a reader for the resize event stream.
   */
  public get resized(): EventReader<ResizeObserverEntry[]> {
    return unwrap(this.world.eventReader(this.resizedId));
  }

  public init(): Promise<void> {
    this.resizedId = this.world.addEvent();

    return Promise.resolve();
  }

  public setup(): Promise<void> {
    const { rootId } = this.resources;
    const root = unwrap(this.world.readResource(rootId));
    const writer = unwrap(this.world.eventWriter(this.resizedId));

    const handler = (entries: ResizeObserverEntry[]) => {
      this.rect = root.getBoundingClientRect();
      writer.emit(entries);
    };

    this.resizeObserver = new ResizeObserver(handler);
    this.resizeObserver?.observe(root);

    const resizeObserverDispose = () => {
      this.resizeObserver?.disconnect();
      this.resizeObserver = null;
    };

    const resizedDispose = () =>
      unwrap(this.world.removeEvent(this.resizedId)).clear();

    this.disposables.push(resizedDispose, resizeObserverDispose);

    return Promise.resolve();
  }

  public cleanup(): Promise<void> {
    flush(this.disposables, call);

    return Promise.resolve();
  }
}
