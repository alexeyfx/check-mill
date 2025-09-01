/** A function called with a dispatched event of type `E`. */
export type Listener<E> = (event: E) => void;

/** A function that, when invoked, disposes from a resource. */
export type Disposable = VoidFunction;

/**
 * Provides read-only access to an event stream.
 *
 * @typeParam E - The event data type.
 */
export interface EventReader<E> {
  /**
   * Adds a listener that is called every time the event is emitted.
   *
   * @param listener - The callback invoked when an event occurs.
   * @returns A `Disposable` that removes the added listener when called.
   */
  register(listener: Listener<E>): Disposable;

  /**
   * Adds a one-time listener that is automatically removed after
   * the next emission.
   *
   * @param listener - The callback invoked exactly once when an event occurs.
   */
  once(listener: Listener<E>): Disposable;

  /**
   * Removes a previously added persistent listener.
   *
   * @param listener - The listener callback to remove.
   */
  unregister(listener: Listener<E>): void;
}

/**
 * Provides write-only access to an event stream.
 *
 * @typeParam E - The event data type.
 */
export interface EventWriter<E> {
  /**
   * Emits an event to all registered listeners.
   *
   * @param event - The event payload to dispatch.
   */
  emit(event: E): void;
}

/**
 * A strongly-typed, single-event emitter class that manages event listeners and dispatches events to them.
 */
export class TypedEvent<E> implements EventReader<E>, EventWriter<E> {
  /**
   * Stores all active, persistent listeners.
   * These listeners will be called every time an event is emitted.
   */
  private listeners: Listener<E>[] = [];

  /**
   * Stores all one-time listeners.
   * These listeners will be called only on the next event emission, then removed.
   */
  private listenersOncer: Listener<E>[] = [];

  /**
   * Adds a persistent listener, which will be invoked on every emission.
   *
   * @param listener - The listener callback to invoke when an event is emitted.
   * @returns A disposable function that, when called, removes the added listener.
   */
  public register = (listener: Listener<E>): Disposable => {
    this.listeners.push(listener);

    return () => this.unregister(listener);
  };

  /**
   * Adds a one-time listener, which is removed immediately after the next emission.
   *
   * @param listener - The listener callback to invoke once when an event is emitted.
   */
  public once = (listener: Listener<E>): Disposable => {
    const handler = (event: E) => {
      this.unregister(handler);
      listener(event);
    };

    return this.register(handler);
  };

  /**
   * Removes a previously added persistent listener.
   *
   * @param listener - The listener callback to remove.
   */
  public unregister = (listener: Listener<E>): void => {
    const length = this.listeners.length;

    if (length === 0) {
      return;
    }

    const callbackIndex = this.listeners.indexOf(listener);
    if (callbackIndex === -1) {
      return;
    }

    if (callbackIndex === length - 1) {
      this.listeners.pop();
      return;
    }

    this.listeners[callbackIndex] = this.listeners[length - 1];
    this.listeners.pop();
  };

  /**
   * Emits an event to all registered listeners, and calls any one-time listeners.
   *
   * @param event - The event object/data to pass to each listener.
   */
  public emit = (event: E): void => {
    for (const listener of this.listeners) {
      listener(event);
    }

    while (this.listenersOncer.length) {
      this.listenersOncer.pop()?.(event);
    }
  };

  /**
   * Clears every persistent and one-time listener, preventing them from being called.
   */
  public clear = (): void => {
    this.listeners = [];
  };
}

/**
 * Maps a concrete {@link EventTarget} subtype to its corresponding DOM event map.
 */
export type EventMapFromTarget<T> = T extends Window
  ? WindowEventMap
  : T extends Document
  ? DocumentEventMap
  : T extends HTMLElement
  ? HTMLElementEventMap
  : Record<string, Event>;

/**
 * Strongly‑typed wrapper around `addEventListener`.
 *
 * @typeParam T – The concrete event target (e.g. `Window`, `HTMLElement`).
 * @typeParam K – A valid key of {@link EventMapFromTarget | EventMapFromTarget<T>}.
 *
 * @returns A **`Disposable`** function; call it to detach the listener.
 */
export function event<T extends EventTarget, K extends keyof EventMapFromTarget<T>>(
  target: T,
  type: K,
  listener: Listener<EventMapFromTarget<T>[K]>,
  options?: AddEventListenerOptions
): Disposable {
  const typedListener = listener as unknown as EventListener;
  target.addEventListener(type as string, typedListener, options);

  return () => target.removeEventListener(type as string, typedListener, options);
}
