import {
  type Disposable,
  type EventReader,
  DisposableStoreId,
  TypedEvent,
  createDisposableStore,
} from "../core";
import { type Component } from "./component";

export interface ViewportType extends Component {
  resized: EventReader<DOMRect>;
  measure(): DOMRect;
}

/**
 * Viewport component observes size changes of the root element
 */
export function Viewport(root: HTMLElement): ViewportType {
  /**
   * Latest bounding client rect of the root element.
   */
  let memoRect: DOMRect = root.getBoundingClientRect();

  /**
   * Returns a reader for the resize event stream.
   */
  const resized = new TypedEvent<DOMRect>();

  /**
   * @internal
   * Component lifecycle method.
   */
  function init(): Disposable {
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(root);

    const disposables = createDisposableStore();
    disposables.push(DisposableStoreId.Static, resized.clear, () => resizeObserver.disconnect());

    return () => disposables.flushAll();
  }

  function measure(): DOMRect {
    return memoRect;
  }

  function onResize(): void {
    memoRect = root.getBoundingClientRect();
    resized.emit(memoRect);
  }

  return {
    init,
    measure,
    resized,
  };
}
