import { DisposableStore, event } from "../primitives";
import { prevent, revert } from "../utils";
import type { Component } from "./component";
import type { AxisType } from "./axis";
import type { LocationType } from "./location";
import { RenderLoopType } from "./render-loop";

export interface WheelType extends Component {}

export function Wheel(
  root: HTMLElement,
  axis: AxisType,
  location: LocationType,
  renderLoop: RenderLoopType
): WheelType {
  /**
   * Disposable store for managing cleanup functions.
   */
  const disposable = DisposableStore();

  /**
   * @internal
   * Component lifecycle method.
   */
  function init(): Promise<void> {
    disposable.pushStatic(event(root, "wheel", onWheel));

    return Promise.resolve();
  }

  /**
   * Handles wheel event.
   */
  function onWheel(event: WheelEvent) {
    const { previous, current, velocity } = location;
    const delta = readPoint(event);

    previous.set(current);
    current.add(revert(delta));
    velocity.set(0);

    renderLoop.start();

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
  };
}
