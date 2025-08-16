import type { EventReader } from "../primitives";
import { DisposableStore, TypedEvent } from "../primitives";
import type { Component } from "./component";

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
   * ResizeObserver instance attached to the root element.
   */
  let resizeObserver: ResizeObserver;

  /**
   * Disposable store for managing cleanup functions.
   */
  const disposable = DisposableStore();

  /**
   * Returns a reader for the resize event stream.
   */
  const resized = new TypedEvent<DOMRect>();

  function init(): Promise<void> {
    resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(root);

    disposable.pushStatic(resized.clear, () => resizeObserver.disconnect());

    return Promise.resolve();
  }

  function measure(): DOMRect {
    return memoRect;
  }

  function onResize(): void {
    memoRect = root.getBoundingClientRect();
    resized.emit(memoRect);
  }

  function destroy(): Promise<void> {
    disposable.flushAll();
    return Promise.resolve();
  }

  return {
    init,
    destroy,
    measure,
    resized,
  };
}
