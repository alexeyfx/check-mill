import { assert } from "../core";

/**
 * Unified parameters for both simulation updates and frame rendering.
 */
export type LoopParams = {
  /**
   * The current total simulation time (ms).
   */

  t: number;
  /**
   * The fixed time step duration (ms).
   */

  dt: number;
  /**
   * Interpolation factor (0.0 to 1.0).
   * Represents the progress between the previous and current physics state.
   */
  alpha: number;
};

export interface RenderLoopType {
  /**
   * Starts the game loop.
   */
  start(): void;

  /**
   * Stops the game loop.
   */
  stop(): void;

  /**
   * Checks if the loop is currently running.
   */
  isActive(): boolean;
}

/**
 * Creates a robust Game Loop that decouples simulation speed from frame rate.
 * * It uses the "Fix Your Timestep" pattern to ensure deterministic physics updates
 * while maintaining smooth rendering via interpolation.
 *
 * @param ownerWindow - The window object used for requestAnimationFrame.
 * @param update - Function to perform fixed-step logic (physics, AI, game rules).
 * @param render - Function to perform variable-step rendering (drawing, DOM updates).
 * @param fps - The target updates-per-second for the simulation (default: 60).
 * @param isIdle - Asked at the end of every frame whether there is anything
 *   left to do. When it answers true the loop parks itself instead of asking
 *   for another frame, and only `start` brings it back.
 * @returns A RenderLoop instance.
 *
 * @see [Game Loop Pattern](https://gameprogrammingpatterns.com/game-loop.html)
 * @see [Fix Your Timestep](https://gafferongames.com/post/fix_your_timestep/)
 */
export function RenderLoop(
  ownerWindow: Window,
  update: (params: LoopParams) => void,
  render: (params: LoopParams) => void,
  fps: number = 60,
  isIdle?: () => boolean,
): RenderLoopType {
  assert(fps > 0, `Invalid FPS value: ${fps}.`);

  /**
   * The fixed duration of one simulation step in milliseconds.
   */
  const fixedTimeStep = 1000 / fps;

  /**
   * The maximum number of update steps allowed per frame.
   * This prevents the "Spiral of Death" where the simulation tries to catch up
   * indefinitely if the rendering falls behind.
   */
  const maxUpdatesPerFrame = 5;

  /**
   * The absolute maximum time (in ms) to simulate for a single frame.
   * If the browser hangs or the tab is backgrounded for a long time, we cap
   * the delta to this value (1 second) to avoid locking the CPU.
   */
  const maxFrameTime = 1000;

  /**
   * Accumulates the elapsed time since the last frame.
   * This "bucket" of time is consumed by the update loop in fixed chunks.
   */
  let accumulator = 0;

  /**
   * Tracks the total time elapsed in the simulation world.
   */
  let simulationTime = 0;

  /**
   * Tracks the timestamp of the last animation frame to calculate delta time.
   */
  let lastTimeStamp: number | null = null;

  /**
   * Stores the requestAnimationFrame ID so it can be canceled.
   */
  let animationId: number | null = null;

  /**
   * Reusable parameter object to prevent GC pressure.
   */
  const params: LoopParams = { t: 0, dt: fixedTimeStep, alpha: 0 };

  /**
   * Starts the loop by requesting the first animation frame.
   */
  function start(): void {
    if (animationId !== null) return;

    lastTimeStamp = null;
    accumulator = 0;
    animationId = ownerWindow.requestAnimationFrame(tick);
  }

  /**
   * Stops the loop by canceling the ongoing animation frame.
   */
  function stop(): void {
    if (animationId !== null) {
      ownerWindow.cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  /**
   * The main heart of the loop.
   * 1. Calculates time elapsed.
   * 2. Runs as many fixed update steps as needed to catch up ("eats" the accumulator).
   * 3. Renders the state with interpolation ("alpha") for the remaining time.
   *
   * @param timeStamp - The current timestamp provided by requestAnimationFrame.
   */
  function tick(timeStamp: DOMHighResTimeStamp): void {
    if (lastTimeStamp === null) {
      lastTimeStamp = timeStamp;
    }

    let frameTime = timeStamp - lastTimeStamp;
    lastTimeStamp = timeStamp;

    if (frameTime > maxFrameTime) {
      frameTime = maxFrameTime;
    }

    accumulator += frameTime;
    params.alpha = 0;

    let updatesCount = 0;
    while (accumulator >= fixedTimeStep) {
      if (updatesCount >= maxUpdatesPerFrame) {
        accumulator = 0;
        break;
      }

      params.t = simulationTime;

      update(params);

      simulationTime += fixedTimeStep;
      accumulator -= fixedTimeStep;
      updatesCount++;
    }

    if (updatesCount === 0) {
      params.t = simulationTime;
      update(params);
    }

    const alpha = accumulator / fixedTimeStep;

    params.t = simulationTime;
    params.alpha = alpha;

    render(params);

    if (isIdle?.()) {
      animationId = null;
      return;
    }

    animationId =  ownerWindow.requestAnimationFrame(tick);
  }

  return {
    start,
    stop,
    isActive: () => animationId !== null,
  };
}
