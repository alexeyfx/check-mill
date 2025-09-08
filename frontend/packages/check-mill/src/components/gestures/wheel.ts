import {
  DisposableStoreId,
  TypedEvent,
  createDisposableStore,
  event,
  prevent,
  revert,
} from "../../core";
import { type AxisType } from "../axis";
import { type Component } from "../component";
import { type GestureEvent, Gesture, GestureState, GestureType, gestureEvent } from "./gesture";

export interface WheelType extends Component, Gesture {}

export function Wheel(root: HTMLElement, axis: AxisType): WheelType {
  /**
   * Disposable store for managing cleanup functions.
   */
  const disposables = createDisposableStore();

  /**
   * Returns a reader for the wheel event stream.
   */
  const wheeled = new TypedEvent<GestureEvent>();

  /**
   * @internal
   * Component lifecycle method.
   */
  function init(): void {
    disposables.push(DisposableStoreId.Static, wheeled.clear, event(root, "wheel", onWheel));
  }

  /**
   * @internal
   * Component lifecycle method.
   */
  function destroy(): void {
    disposables.flushAll();
  }

  /**
   * Handles wheel event.
   */
  function onWheel(event: WheelEvent) {
    const delta = readPoint(event);
    const gEvent = gestureEvent(GestureType.Wheel, revert(delta), GestureState.Update);
    wheeled.emit(gEvent);

    prevent(event, true);
  }

  /**
   * Extracts the primary coordinate value (X or Y) from a wheel event.
   */
  function readPoint(event: WheelEvent): number {
    const property: keyof WheelEvent = `delta${axis.isVertical ? "Y" : "X"}`;
    return event[property];
  }

  return {
    init,
    destroy,
    register: wheeled.register,
  };
}
