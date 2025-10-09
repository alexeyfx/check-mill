import {
  type Disposable,
  DisposableStoreId,
  TypedEvent,
  createDisposableStore,
  event,
  prevent,
} from "../../core";
import { type AxisType } from "../axis";
import { type Component } from "../component";
import {
  type Gesture,
  type GestureEvent,
  GestureState,
  GestureType,
  gestureEvent,
} from "./gesture";

/**
 * If the user pauses their drag for more than this duration (in ms), the
 * "flick" calculation resets. This prevents a slow drag from being
 * misinterpreted as a high-velocity flick at the end.
 */
const LOG_INTERVAL = 170;

/**
 * The minimum distance (in px) the pointer must move before a "drag" is
 * officially considered to have started. This helps distinguish a drag
 * from an accidental click.
 */
const DRAG_THRESHOLD = 5;

export interface DragType extends Component, Gesture {}

/**
 * Creates a Drag gesture component that handles pointer-based dragging logic.
 * It tracks pointer events, manages browser default actions, calculates velocity
 * for flicks, and emits a clean stream of gesture events.
 *
 * @param root The HTML element to which the drag listeners will be attached.
 * @param axis The axis ('x' or 'y') along which to measure drag movement.
 * @returns An object conforming to the DragType interface.
 */
export function Drag(root: HTMLElement, axis: AxisType): DragType {
  /** First recorded pointer event in the drag interaction. */
  let startEvent: PointerEvent;

  /** Most recent pointer event. */
  let lastEvent: PointerEvent;

  /** Prevents click events after drag, to avoid accidental activation. */
  let preventClick: boolean = false;

  /** The document that owns the root element, used for global event listeners. */
  const ownerDocument = root.ownerDocument;

  /** Disposable store for managing cleanup functions. */
  const disposables = createDisposableStore();

  /** Returns a reader for the drag event stream. */
  const dragged = new TypedEvent<GestureEvent>();

  /**
   * @internal
   * Component lifecycle method.
   */
  function init(): Disposable {
    disposables.push(
      DisposableStoreId.Static,
      dragged.clear,
      event(root, "pointerdown", onPointerDown),
      event(root, "click", onMouseClick, { capture: true })
    );

    return () => disposables.flushAll();
  }

  /**
   * Handles pointer down event.
   */
  function onPointerDown(event: PointerEvent): void {
    prevent(event, true);

    lastEvent = event;
    startEvent = event;
    preventClick = false;
    const gEvent = gestureEvent(GestureType.Drag, GestureState.Initialize, 0 /* delta */);

    ownerDocument.body.classList.add("is-dragging");
    (event.target as HTMLElement).setPointerCapture(event.pointerId);

    dragged.emit(gEvent);
    addDragEvents();
  }

  /**
   * Handles pointer move event.
   */
  function onPointerMove(event: PointerEvent): void {
    prevent(event, true);

    const diff = diffCoord(event);
    const expired = diffTime(event) > LOG_INTERVAL;
    const gEvent = gestureEvent(GestureType.Drag, GestureState.Update, axis.direction(diff));

    if (diff > DRAG_THRESHOLD) {
      preventClick = true;
    }

    lastEvent = event;
    if (expired) {
      startEvent = event;
    }

    dragged.emit(gEvent);
  }

  /**
   * Handles pointer up event.
   */
  function onPointerUp(event: PointerEvent): void {
    const acceleration = computeAcceleration(event);
    const gEvent = gestureEvent(GestureType.Drag, GestureState.Finalize, 10 * acceleration);

    ownerDocument.body.classList.remove("is-dragging");
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);

    dragged.emit(gEvent);
    disposables.flush(DisposableStoreId.Temporal);
  }

  /**
   * Prevents click events immediately after a drag interaction.
   * This avoids accidental activation of buttons or links.
   */
  function onMouseClick(event: MouseEvent): void {
    if (preventClick) {
      prevent(event, true);
    }
  }

  /**
   * Adds temporary, document-level listeners for an active drag.
   */
  function addDragEvents(): void {
    disposables.push(
      DisposableStoreId.Temporal,
      event(root, "pointermove", onPointerMove, { passive: false }),
      event(root, "pointerup", onPointerUp),
      event(root, "pointerout", onPointerUp),
      event(root, "pointerleave", onPointerUp),
      event(root, "pointercancel", onPointerUp)
    );
  }

  /**
   * Calculates the final velocity (acceleration) for a flick gesture.
   */
  function computeAcceleration(event: PointerEvent): number {
    if (!startEvent || !lastEvent) {
      return 0;
    }

    const diffDrag = readPoint(lastEvent) - readPoint(startEvent);
    const diffTime = readTime(event) - readTime(startEvent);
    const expired = readTime(event) - readTime(startEvent) > LOG_INTERVAL;
    const acceleration = diffDrag / diffTime;
    const isFlick = diffTime && !expired && Math.abs(acceleration) > 0.01;

    return isFlick ? acceleration : 0;
  }

  /**
   * Calculates difference between current pointer and the last recorded position.
   */
  function diffCoord(event: PointerEvent): number {
    return readPoint(event) - readPoint(lastEvent);
  }

  /**
   * Calculates time delta from the original pointer down to now.
   */
  function diffTime(event: PointerEvent): number {
    return readTime(event) - readTime(startEvent);
  }

  /**
   * Extracts the primary coordinate value (X or Y) from a pointer event.
   */
  function readPoint(event: PointerEvent): number {
    const property: keyof Touch = `client${axis.isVertical ? "Y" : "X"}`;
    return event[property];
  }

  /**
   * Extracts the event timestamp.
   */
  function readTime(event: Event): number {
    return event.timeStamp;
  }

  return {
    init,
    register: dragged.register,
  };
}
