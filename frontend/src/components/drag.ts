import { DisposableStore, fromEvent } from "../primitives";
import { prevent } from "../utils";
import type { AccelerationType } from './acceleration';
import type { AnimationsType } from "./animations";
import type { AxisType } from "./axis";
import type { Component } from "./component";
import type { LocationType } from "./location";


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
export function Drag(root: HTMLElement, location: LocationType, animations: AnimationsType, axis: AxisType, acceleration: AccelerationType): DragType {
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
    const [onDown, disposeDown] = fromEvent(root, "pointerdown");
    const [onClick, disposeClick] = fromEvent(root, "click");

    onDown.register(onPointerDown);
    onClick.register(onMouseClick);

    disposable.pushStatic(disposeDown, disposeClick);

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
    preventClick = !Boolean(event.buttons);
    isInteracting = true;

    location.target.set(location.current);
    acceleration.useFriction(0).useDuration(0);
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

    acceleration.useFriction(0.3).useDuration(0.75);
    animations.start();
    location.target.add(axis.direction(diff));
    prevent(event, true);
  }

  /**
   * Handles pointer up event.
   */
  function onPointerUp(event: PointerEvent): void {
    isInteracting = false;

    const velocity = computeVelocity(event);
    const destination = computeDestination(velocity);
    const speed = Math.abs(velocity);

    acceleration.useFriction(0.3).useDuration(speed);
    location.target.set(destination);
    animations.start();

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
    const [onUp, disposeUp] = fromEvent(root, "pointerup");
    const [onMove, disposeMove] = fromEvent(root, "pointermove", {
      passive: false,
    });
    const [onCancel, disposeCancel] = fromEvent(root, "pointercancel");
    const [onOut, disposeOut] = fromEvent(root, "pointerout");
    const [onLeave, disposeLeave] = fromEvent(root, "pointerleave");

    onUp.register(onPointerUp);
    onMove.register(onPointerMove);
    onCancel.register(onPointerUp);
    onOut.register(onPointerUp);
    onLeave.register(onPointerUp);

    disposable.pushTemporal(
      disposeUp,
      disposeMove,
      disposeCancel,
      disposeOut,
      disposeLeave,
    );
  }

  function computeVelocity(event: PointerEvent): number {
    if (!startEvent || !lastEvent) {
      return 0;
    }

    const diffDrag = readPoint(lastEvent) - readPoint(startEvent);
    const diffTime = readTime(event) - readTime(startEvent);
    const velocity = diffDrag / diffTime;
    
    return velocity;
  }

  function computeDestination(velocity: number): number {
    return location.current.get() + velocity * 100;
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
    interacting,
  };
}
