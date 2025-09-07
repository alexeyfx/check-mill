import { DisposableStore, TypedEvent, event, prevent } from "../../core";
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
 * If the user stops dragging for this duration while keeping the pointer down,
 * the base coordinate and time will be updated.
 */
const LOG_INTERVAL = 170;

export interface DragType extends Component, Gesture {}

/**
 * Drag component handles pointer-based dragging logic.
 * It tracks pointer events to support dragging along a single axis.
 */
export function Drag(root: HTMLElement, axis: AxisType): DragType {
  /**
   * First recorded pointer event in the drag interaction.
   */
  let startEvent: PointerEvent;

  /**
   * Most recent pointer event.
   */
  let lastEvent: PointerEvent;

  /**
   * Prevents click events after drag, to avoid accidental activation.
   */
  let preventClick: boolean = false;

  /**
   * Disposable store for managing cleanup functions.
   */
  const disposable = DisposableStore();

  /**
   * Returns a reader for the drag event stream.
   */
  const dragged = new TypedEvent<GestureEvent>();

  /**
   * @internal
   * Component lifecycle method.
   */
  function init(): Promise<void> {
    disposable.pushStatic(
      dragged.clear,
      event(root, "pointerdown", onPointerDown),
      event(root, "click", onMouseClick)
    );

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

  /**
   * Handles pointer down event.
   */
  function onPointerDown(event: PointerEvent): void {
    const gEvent = gestureEvent(GestureType.Drag, GestureState.Initialize, 0);

    lastEvent = event;
    startEvent = event;
    preventClick = event.buttons === 0;

    dragged.emit(gEvent);
    addDragEvents();
  }

  /**
   * Handles pointer move event.
   */
  function onPointerMove(event: PointerEvent): void {
    const diff = diffCoord(event);
    const expired = diffTime(event) > LOG_INTERVAL;
    const gEvent = gestureEvent(GestureType.Drag, GestureState.Update, axis.direction(diff));

    lastEvent = event;
    if (expired) {
      startEvent = event;
    }

    dragged.emit(gEvent);
    prevent(event, true);
  }

  /**
   * Handles pointer up event.
   */
  function onPointerUp(event: PointerEvent): void {
    const acceleration = computeAcceleration(event);
    const gEvent = gestureEvent(GestureType.Drag, GestureState.Finalize, 10 * acceleration);

    dragged.emit(gEvent);
    disposable.flushTemporal();
  }

  /**
   * Prevents click events immediately after a drag interaction.
   * This avoids accidental activation of buttons or links.
   */
  function onMouseClick(event: MouseEvent): void {
    if (preventClick) {
      prevent(event, true);
      preventClick = false;
    }
  }

  function addDragEvents(): void {
    disposable.pushTemporal(
      event(root, "pointermove", onPointerMove, { passive: false }),
      event(root, "pointerup", onPointerUp),
      event(root, "pointerout", onPointerUp),
      event(root, "pointerleave", onPointerUp),
      event(root, "pointercancel", onPointerUp)
    );
  }

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
    destroy,
    register: dragged.register,
  };
}
