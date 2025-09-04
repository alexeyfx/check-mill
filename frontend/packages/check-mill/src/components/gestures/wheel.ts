import { DisposableStore, TypedEvent, event } from "../../primitives";
import { prevent, revert } from "../../utils";

import type { AxisType } from "../axis";
import type { Component } from "../component";
import type { GestureEvent, Gesture } from "./gesture";
import { GestureState, GestureType, gestureEvent } from "./gesture";

export interface WheelType extends Component, Gesture {}

export function Wheel(root: HTMLElement, axis: AxisType): WheelType {
  /**
   * Disposable store for managing cleanup functions.
   */
  const disposable = DisposableStore();

  /**
   * Returns a reader for the wheel event stream.
   */
  const wheeled = new TypedEvent<GestureEvent>();

  /**
   * @internal
   * Component lifecycle method.
   */
  function init(): Promise<void> {
    disposable.pushStatic(wheeled.clear, event(root, "wheel", onWheel));
    return Promise.resolve();
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
    register: wheeled.register,
  };
}
