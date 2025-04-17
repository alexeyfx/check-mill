import { DisposableStore, fromEvent } from "../primitives";
import { prevent } from "../utils";
import { AxisType } from "./axis";
import type { Component } from "./component";

/**
 * If the user stops dragging for this duration while keeping the pointer down,
 * the base coordinate and time will be updated.
 */
const LOG_INTERVAL = 170;

export interface DragType extends Component {}

/**
 * Drag component handles pointer-based dragging logic.
 * It tracks pointer events to support dragging along a single axis.
 */
export function Drag(root: HTMLElement, axis: AxisType): DragType {
  /**
   * First recorded pointer event in the drag interaction.
   * Used as the origin to calculate movement deltas.
   */
  let startEvent: PointerEvent;

  /**
   * Most recent pointer event.
   * Used to calculate deltas during ongoing drag interaction.
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
   * @internal
   * Component lifecycle method.
   */
  function init(): Promise<void> {
    const [onDown, disposeDown] = fromEvent(root, "pointerdown");
    const [_onClick, disposeClick] = fromEvent(root, "click");

    onDown.register(onPointerDown);
    _onClick.register(onClick);

    disposable.pushStatic(disposeDown, disposeClick);

    return Promise.resolve();
  }

  /**
   * Handles pointer down event.
   */
  function onPointerDown(event: PointerEvent): void {
    startEvent = event;
    lastEvent = event;
    preventClick = !Boolean(event.buttons);

    const [onUp, disposeUp] = fromEvent(root, "pointerup");
    const [onMove, disposeMove] = fromEvent(root, "pointermove", {
      passive: false,
    });
    const [onCancel, disposeCancel] = fromEvent(root, "pointercancel");

    onUp.register(onPointerUp);
    onMove.register(onPointerMove);
    onCancel.register(onPointerUp);

    disposable.pushTemporal(disposeUp, disposeMove, disposeCancel);
  }

  /**
   * Handles pointer move event.
   */
  function onPointerMove(event: PointerEvent): void {
    const diff = diffCoord(event);
    const expired = diffTime(event) > LOG_INTERVAL;

    lastEvent = event;
    if (expired) {
      startEvent = event;
    }

    prevent(event, true);
  }

  /**
   * Handles pointer up event.
   */
  function onPointerUp(_event: PointerEvent): void {
    disposable.flushTemporal();
  }

  /**
   * Prevents click events immediately after a drag interaction.
   * This avoids accidental activation of buttons or links.
   */
  function onClick(event: MouseEvent): void {
    if (preventClick) {
      prevent(event, true);
      preventClick = false;
    }
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

  /**
   * @internal
   * Component lifecycle method.
   */
  function destroy(): Promise<void> {
    disposable.flushAll();
    return Promise.resolve();
  }

  return {
    init,
    destroy,
  };
}
