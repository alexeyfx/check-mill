import { DisposableStore, event } from "../primitives";
import { assert } from "../utils";
import type { WindowType } from "../utils";
import type { Component } from "./component";

/**
 * Represents the interface for a Render Loop that can be started and stopped.
 * Extends the `Component` interface.
 */
export interface RenderLoopType extends Component {
  start(): void;
  stop(): void;
}

/**
 * Creates a Render Loop system that controls the flow of game updates and rendering.
 * The game loop runs updates at a fixed timestep and performs rendering with a variable alpha based on the timestep.
 *
 * @param {Document} ownerDocument - The document object associated with the window.
 * @param {WindowType} ownerWindow - The window object associated with the document.
 * @param {(t: number, dt: number) => void} update - A function that performs the game update logic.
 * @param {(alpha: number) => void} render - A function that renders the game state.
 * @param {number} [fps=60] - The desired frames per second for the game loop (defaults to 60).
 * @returns {RenderLoopType} A RenderLoop instance with start and stop methods to control the loop.
 *
 * @see [Game Loop Pattern](https://gameprogrammingpatterns.com/game-loop.html)
 * @see [Fix Your Timestep](https://gafferongames.com/post/fix_your_timestep/)
 */
export function RenderLoop(
  ownerDocument: Document,
  ownerWindow: WindowType,
  update: (t: number, dt: number) => void,
  render: (alpha: number) => void,
  fps: number = 60
): RenderLoopType {
  assert(fps > 0, `Invalid FPS value: ${fps}.`);

  /**
   * Accumulator to track the time that hasn't been processed yet
   */
  let accumulator = 0;

  /**
   * Stores the animation frame ID for canceling the animation
   */
  let animationId: number = 0;

  /**
   * Tracks the timestamp of the last frame, used to calculate the elapsed time
   */
  let lastTimeStamp: number | null = null;

  /**
   * Tracks the simulated game time
   */
  let simulationTime: number = 0;

  /**
   * Maximum number of updates per frame to avoid runaway processing
   */
  const maxUpdatesPerFrame = 5;

  /**
   * Fixed time step for each game update (in milliseconds)
   */
  const fixedTimeStep = 1000 / fps;

  /**
   * Disposable store for managing cleanup functions.
   */
  const disposable = DisposableStore();

  /**
   * @internal
   * Component lifecycle method.
   */
  function init(): Promise<void> {
    disposable.pushStatic(event(ownerDocument, "visibilitychange", onVisibilityChange));

    return Promise.resolve();
  }

  /**
   * @internal
   * Component lifecycle method.
   */
  function destroy(): Promise<void> {
    disposable.flushAll();
    stop();

    return Promise.resolve();
  }

  /**
   * Starts the game loop by requesting the first animation frame.
   */
  function start(): void {
    animationId ||= ownerWindow.requestAnimationFrame(tick);
  }

  /**
   * Stops the game loop by canceling the ongoing animation frame.
   */
  function stop(): void {
    lastTimeStamp = null;
    accumulator = 0;
    animationId = 0;
  }

  /**
   * The main game loop that runs at a fixed timestep. It performs the update and render logic
   * based on the accumulated time.
   *
   * @param {DOMHighResTimeStamp} timeStamp - The current timestamp of the animation frame.
   */
  function tick(timeStamp: DOMHighResTimeStamp): void {
    if (!lastTimeStamp) {
      lastTimeStamp = timeStamp;
      update(simulationTime, fixedTimeStep);
    }

    const timeElapsed = timeStamp - lastTimeStamp;
    lastTimeStamp = timeStamp;
    accumulator += timeElapsed;

    let updatesCount = 0;
    while (accumulator >= fixedTimeStep && updatesCount < maxUpdatesPerFrame) {
      update(simulationTime, fixedTimeStep);

      updatesCount += 1;
      simulationTime += fixedTimeStep;
      accumulator -= fixedTimeStep;
    }

    const alpha = accumulator / fixedTimeStep;
    render(alpha);

    if (animationId) {
      animationId = ownerWindow.requestAnimationFrame(tick);
    }
  }

  /**
   * Handles visibility changes of the window.
   * Stops the game loop when the window is hidden.
   *
   * @param {Event} _event - The visibility change event.
   */
  function onVisibilityChange(_event: Event): void {
    if (ownerDocument.hidden) {
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
