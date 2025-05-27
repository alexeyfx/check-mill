import { DisposableStore, event } from "../primitives";
import { assert } from "../utils";
import type { WindowType } from "../utils";
import type { Component } from "./component";

export interface RenderLoopType extends Component {
  start(): void;
  stop(): void;
}

export function RenderLoop(
  ownerDocument: Document,
  ownerWindow: WindowType,
  update: () => void,
  render: (alpha: number) => void,
  fps: number = 60
): RenderLoopType {
  assert(fps > 0, `Invalid FPS value: ${fps}.`);

  let animationId: number = 0;

  let lastTimeStamp: number | null = null;

  let accumulatedTime = 0;

  const maxUpdatesPerFrame = 5;

  const fixedTimeStep = 1000 / fps;

  const disposable = DisposableStore();

  function init(): Promise<void> {
    disposable.pushStatic(event(ownerDocument, "visibilitychange", onVisibilityChange));

    return Promise.resolve();
  }

  function destroy(): Promise<void> {
    disposable.flushAll();
    stop();

    return Promise.resolve();
  }

  function start(): void {
    animationId |= ownerWindow.requestAnimationFrame(tick);
  }

  function stop(): void {
    ownerWindow.cancelAnimationFrame(animationId);

    lastTimeStamp = null;
    accumulatedTime = 0;
    animationId = 0;
  }

  function tick(timeStamp: DOMHighResTimeStamp): void {
    if (!lastTimeStamp) {
      lastTimeStamp = timeStamp;
      update();
    }

    const timeElapsed = timeStamp - lastTimeStamp;
    lastTimeStamp = timeStamp;
    accumulatedTime += timeElapsed;

    let updatesCount = 0;
    while (accumulatedTime >= fixedTimeStep && updatesCount < maxUpdatesPerFrame) {
      update();

      updatesCount += 1;
      accumulatedTime -= fixedTimeStep;
    }

    const alpha = accumulatedTime / fixedTimeStep;
    render(alpha);

    if (animationId) {
      animationId = ownerWindow.requestAnimationFrame(tick);
    }
  }

  function onVisibilityChange(_event: Event): void {
    if (document.hidden) {
      stop();
    }
  }

  return {
    init,
    destroy,
    start,
    stop,
  };
}
