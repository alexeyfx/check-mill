import type { EventReader } from "../primitives";
import { DisposableStore, fromEvent, TypedEvent } from "../primitives";
import { prevent, revert } from "../utils";
import type { Component } from "./component";
import type { AccelerationType } from "./acceleration";
import type { AnimationsType } from "./animations";
import type { AxisType } from "./axis";
import type { LocationType } from "./location";

export interface WheelType extends Component {
	wheeled: EventReader<WheelEvent>;
}

export function Wheel(
	root: HTMLElement,
	acceleration: AccelerationType,
	animations: AnimationsType,
	axis: AxisType,
	location: LocationType
): WheelType {
	/**
	 * Disposable store for managing cleanup functions.
	 */
	const disposable = DisposableStore();

	/**
	 * Returns a reader for the wheel event stream.
	 */
	const wheeled = new TypedEvent<WheelEvent>();

	/**
	 * @internal
	 * Component lifecycle method.
	 */
	function init(): Promise<void> {
		const [wheel, disposeWheel] = fromEvent(root, "wheel");

		wheel.register(onWheel);

		disposable.pushStatic(wheeled.clear, disposeWheel);

		return Promise.resolve();
	}

	/**
	 * Handles wheel event.
	 */
	function onWheel(event: WheelEvent) {
		const delta = readPoint(event);

		acceleration.useFriction(0.3).useDuration(0.75);
		animations.start();
		location.target.add(revert(delta));
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
		wheeled,
	};
}
