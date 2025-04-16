import type { Component, EventReader } from "../core copy";
import { TypedEvent, fromEvent } from "../core copy";
import { DisposableStore } from "./disposable";

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
    const [focusIn, disposeFocusIn] = fromEvent(root, "focusin");

    focusIn.register(onFocusIn);

    disposable.pushStatic(wheeled.clear, disposeFocusIn);

    return Promise.resolve();
  }

  function onFocusIn() {
    const [focusOut, disposeFocusOut] = fromEvent(root, "focusout");
    const [wheel, disposeWheel] = fromEvent(root, "wheel");

    focusOut.register(onFocusOut);
    wheel.register(onWheel);

    disposable.pushTemporal(disposeFocusOut, disposeWheel);
  }

  function onFocusOut() {
    disposable.flushTemporal();
  }

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
