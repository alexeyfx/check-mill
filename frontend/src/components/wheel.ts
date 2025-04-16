import type { EventReader } from "../primitives";
import { DisposableStore, fromEvent, TypedEvent } from "../primitives";
import type { Component } from "./component";

export interface WheelType extends Component {
  wheeled: EventReader<WheelEvent>;
}

export function Wheel(root: HTMLElement): WheelType {
  /**
   * Disposable store for managing cleanup functions.
   */
  const disposable = DisposableStore();

  /**
   * Returns a reader for the wheel event stream.
   */
  const wheeled = new TypedEvent<WheelEvent>();

  function init(): Promise<void> {
    const [wheel, disposeWheel] = fromEvent(root, "wheel");

    wheel.register(onWheel);

    disposable.pushStatic(wheeled.clear, disposeWheel);

    return Promise.resolve();
  }

  /**
   * Handles wheel event.
   */
  function onWheel(event: WheelEvent) {
    wheeled.emit(event);
  }

  function destroy(): Promise<void> {
    disposable.flushAll();
    return Promise.resolve();
  }

  return {
    init,
    destroy,
    wheeled,
  };
}
