import { DisposableStore, fromEvent, TypedEvent } from "../primitives";
import { prevent } from "../utils";
import type { Component } from "./component";

export interface DragType extends Component {}

/**
 * Drag component handles pointer-based dragging logic.
 */
export function Drag(root: HTMLElement): DragType {
  /**
   * Last known base position before dragging started.
   * Used as the reference point for calculating movement deltas.
   */
  let basePosition: number = 0;

  /**
   * Last recorded pointer event during a drag interaction.
   * Used to calculate offset during pointer movement.
   */
  let baseEvent: PointerEvent;

  /**
   * An `EventReader` for the `dragged` pointer event stream.
   */
  const dragged = new TypedEvent<PointerEvent>();

  /**
   * Disposable store for managing cleanup functions.
   */
  const disposable = DisposableStore();

  function init(): Promise<void> {
    const [onDown, disposeDown] = fromEvent(root, "pointerdown");

    onDown.register(onPointerDown);

    disposable.pushStatic(dragged.clear, disposeDown);

    return Promise.resolve();
  }

  /**
   * Handles pointer down event.
   */
  function onPointerDown(event: PointerEvent): void {
    const [onUp, disposeUp] = fromEvent(root, "pointerup");
    const [onMove, disposeMove] = fromEvent(root, "pointermove");
    const [onCancel, disposeCancel] = fromEvent(root, "pointercancel");

    onUp.register(onPointerUp);
    onMove.register(onPointerMove);
    onCancel.register(onPointerCancel);

    disposable.pushTemporal(disposeUp, disposeMove, disposeCancel);
    save(event);
  }

  /**
   * Handles pointer move event.
   */
  function onPointerMove(event: PointerEvent): void {
    const diff = diffCoord(event);

    save(event);
    prevent(event);

    return;
  }

  /**
   * Handles pointer up event.
   */
  function onPointerUp(_event: PointerEvent): void {
    disposable.flushTemporal();
  }

  /**
   * Handles pointer cancel event.
   */
  function onPointerCancel(_event: PointerEvent): void {
    disposable.flushTemporal();
  }

  /**
   * Stores the current pointer event and position from the Move component.
   */
  function save(event: PointerEvent): void {
    baseEvent = event;
  }

  /**
   * Calculates the vertical delta between the current and base pointer event.
   */
  function diffCoord(e: PointerEvent): number {
    return e.pageY - baseEvent!.pageY;
  }

  function destroy(): Promise<void> {
    disposable.flushAll();
    return Promise.resolve();
  }

  return {
    init,
    destroy,
  };
}
