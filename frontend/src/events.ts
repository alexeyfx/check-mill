export type Listener<E> = (event: E) => void;

export type Disposable = VoidFunction;

/**
 * A strongly-typed, single-event emitter class that manages event listeners and dispatches events to them.
 */
export class TypedEvent<E> {
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
  public addListener = (listener: Listener<E>): Disposable => {
    this.listeners.push(listener);

    return () => this.removeListener(listener);
  };

  /**
   * Adds a one-time listener, which is removed immediately after the next emission.
   *
   * @param listener - The listener callback to invoke once when an event is emitted.
   */
  public addOnceListener = (listener: Listener<E>): void => {
    this.listenersOncer.push(listener);
  };

  /**
   * Removes a previously added persistent listener.
   *
   * @param listener - The listener callback to remove.
   */
  public removeListener = (listener: Listener<E>): void => {
    const callbackIndex = this.listeners.indexOf(listener);
    if (callbackIndex > -1) {
      this.listeners.splice(callbackIndex, 1);
    }
  };

  /**
   * Emits an event to all registered listeners, and calls any one-time listeners.
   *
   * @param event - The event object/data to pass to each listener.
   */
  public emit = (event: E) => {
    for (const listener of this.listeners) {
      listener(event);
    }

    while (this.listenersOncer.length) {
      this.listenersOncer.pop()?.(event);
    }
  };

  /**
   * Pipes all emitted events to another `TypedEvent` instance.
   * Essentially forwards every event from this emitter to the target emitter.
   *
   * @param te - Another `TypedEvent` instance to pipe this emitter's events into.
   * @returns A disposable function that, when called, stops the piping of events.
   */
  public pipe = (te: TypedEvent<E>): Disposable => {
    return this.addListener((event) => te.emit(event));
  };
}

/**
 * For known targets, we can map them to their respective EventMap.
 */
type EventMapFromTarget<T> = T extends Window
  ? WindowEventMap
  : T extends Document
  ? DocumentEventMap
  : T extends HTMLElement
  ? HTMLElementEventMap
  : // Fallback if we don't have a known map:
    Record<string, Event>;

/**
 * A function similar to RxJS `fromEvent` that wraps a DOM/native event in a `TypedEvent`.
 *
 * @param target    - The event source.
 * @param eventName - The name of the event (e.g., "click", "keyup").
 *
 * @returns An array containing:
 *    1) `typedEvent`: The `TypedEvent` that emits each time the native event fires.
 *    2) `dispose`: A function to stop emitting by removing the underlying native listener.
 */
export function fromEvent<
  T extends EventTarget,
  K extends keyof EventMapFromTarget<T>,
  E extends EventMapFromTarget<T>[K]
>(
  target: T,
  type: K,
  options?: EventListenerOptions
): [TypedEvent<E>, Disposable] {
  const typedEvent = new TypedEvent<E>();

  const handler = (event: Event) => typedEvent.emit(event as E);

  target.addEventListener(type as string, handler, options);

  const dispose = () =>
    target.removeEventListener(type as string, handler, options);

  return [typedEvent, dispose];
}
