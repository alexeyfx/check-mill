import { DisposableStore, EventReader, TypedEvent } from "../primitives";
import { clamp } from "../utils";
import { Component } from "./component";

export interface IdleType extends Component {
  activated: EventReader<void>;
  deactivated: EventReader<void>;
  tick: VoidFunction;
}

export function Idle(timeout: number): IdleType {
  const _timeout = clamp(timeout, 0, 5000);

  let timeoutId = 0;

  /**
   * Returns a reader for the activated event stream.
   */
  const activated = new TypedEvent<void>();

  /**
   * Returns a reader for the deactivated event stream.
   */
  const deactivated = new TypedEvent<void>();

  /**
   * Disposable store for managing cleanup functions.
   */
  const disposable = DisposableStore();

  /**
   * @internal
   * Component lifecycle method.
   */
  function init(): Promise<void> {
    disposable.pushStatic(activated.clear, deactivated.clear);
    return Promise.resolve();
  }

  /**
   * @internal
   * Component lifecycle method.
   */
  function destroy(): Promise<void> {
    disposable.flushAll();
    return Promise.resolve();
  }

  function tick(): void {
    if (!hasActiveTimeout()) {
      activated.emit();
    }

    renewTimeout();
  }

  function hasActiveTimeout(): boolean {
    return Boolean(timeoutId);
  }

  function renewTimeout(): void {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(deactivated.emit, _timeout);
  }

  return { init, destroy, activated, deactivated, tick };
}
