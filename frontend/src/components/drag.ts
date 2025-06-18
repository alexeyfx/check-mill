import { DisposableStore, event } from "../primitives";
import { prevent } from "../utils";
import type { AxisType } from "./axis";
import type { Component } from "./component";
import type { ScrollMotionType } from "./scroll-motion";
import { RenderLoopType } from "./render-loop";

/**
 * If the user stops dragging for this duration while keeping the pointer down,
 * the base coordinate and time will be updated.
 */
const LOG_INTERVAL = 170;

export interface DragType extends Component {
  interacting(): boolean;
}

/**
 * Drag component handles pointer-based dragging logic.
 * It tracks pointer events to support dragging along a single axis.
 */
export function Drag(
  root: HTMLElement,
  axis: AxisType,
  motion: ScrollMotionType,
  renderLoop: RenderLoopType
): DragType {
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
   * True while the pointer is actively pressed down during interaction.
   */
  let isInteracting: boolean = false;

  /**
   * Disposable store for managing cleanup functions.
   */
  const disposable = DisposableStore();

  /**
   * @internal
   * Component lifecycle method.
   */
  function init(): Promise<void> {
    disposable.pushStatic(
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
   * Returns true if any pointer event active;
   */
  function interacting(): boolean {
    return isInteracting;
  }

  /**
   * Handles pointer down event.
   */
  function onPointerDown(event: PointerEvent): void {
    lastEvent = event;
    startEvent = event;
    preventClick = event.buttons === 0;
    isInteracting = true;

    motion.velocity.set(0);
    addDragEvents();
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

    motion.current.add(axis.direction(diff));
    renderLoop.start();
    prevent(event, true);
  }

  /**
   * Handles pointer up event.
   */
  function onPointerUp(event: PointerEvent): void {
    const acceleration = computeAcceleration(event);

    isInteracting = false;

    motion.velocity.set(10 * acceleration);
    renderLoop.start();
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
    interacting,
  };
}
