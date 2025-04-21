import { DisposableStore, fromEvent } from "../primitives";
import { assert } from "../utils";
import type { WindowType } from "../utils";
import type { Component } from "./component";

export interface AnimationsType extends Component {
	start(): void;
	stop(): void;
	update(): void;
	render(alpha: number): void;
}

export function Animations(
	ownerDocument: Document,
	ownerWindow: WindowType,
	update: () => void,
	render: (alpha: number) => void,
	fps: number = 60
): AnimationsType {
	assert(fps > 0, `Invalid FPS value: ${fps}.`);

	let lastTimeStamp: number | null = null;

	let accumulatedTime = 0;

	let animationId: number;

	const fixedTimeStep = 1000 / fps;

	const maxUpdatesPerFrame = 5;

	const disposable = DisposableStore();

	function init(): Promise<void> {
		const [visibilityChange, disposeVisibilityChange] = fromEvent(
			ownerDocument,
			"visibilitychange"
		);

		visibilityChange.register(onVisibilityChange);

		disposable.pushStatic(disposeVisibilityChange);

		return Promise.resolve();
	}

	function onVisibilityChange(_event: Event): void {
		if (document.hidden) {
			stop();
		}
	}

	function animate(timeStamp: DOMHighResTimeStamp): void {
		if (!animationId) return;

		if (!lastTimeStamp) {
			lastTimeStamp = timeStamp;
			update();
		}

		const timeElapsed = timeStamp - lastTimeStamp;
		lastTimeStamp = timeStamp;
		accumulatedTime += timeElapsed;

		let updatesCount = 0;
		while (
			accumulatedTime >= fixedTimeStep &&
			maxUpdatesPerFrame > updatesCount
		) {
			update();
			accumulatedTime -= fixedTimeStep;
			updatesCount += 1;
		}

		const alpha = accumulatedTime / fixedTimeStep;
		render(alpha);

		if (animationId) {
			animationId = ownerWindow.requestAnimationFrame(animate);
		}
	}

	function start(): void {
		if (animationId) {
			return;
		}

		animationId = ownerWindow.requestAnimationFrame(animate);
	}

	function stop(): void {
		ownerWindow.cancelAnimationFrame(animationId);

		lastTimeStamp = null;
		accumulatedTime = 0;
		animationId = 0;
	}

	function destroy(): Promise<void> {
		disposable.flushAll();
		stop();

		return Promise.resolve();
	}

	return {
		init,
		destroy,
		start,
		stop,
		update,
		render,
	};
}
