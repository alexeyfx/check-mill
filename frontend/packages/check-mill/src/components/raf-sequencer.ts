/**
 * Function executed by the sequencer.
 * Return `true` when the task is complete (and should be removed).
 * Return `false` to run again on a future eligible frame.
 */
export type StepFn = () => boolean;

/**
 * Public API for a rAF‑driven **FIFO** sequencer.
 * Executes **at most one task per animation frame**.
 * The **oldest** enqueued task runs first. A task is retried every eligible
 * frame until it returns `true`.
 */
interface RafSequencerType {
  /**
   * Enqueue a new step. The step is placed at the **back** of the queue and
   * will run after older steps complete.
   *
   * @param step - Function that returns `true` when done, otherwise `false` to retry.
   * @returns A handle (slot index) that can be passed to `cancel`.
   */
  enqueue(step: StepFn): number;

  /**
   * Cancel a previously enqueued step.
   * Safe to call multiple times; no‑op for unknown or already cleared slots.
   *
   * @param id - The slot index returned by `enqueue`.
   */
  cancel(id: number): void;
}

/**
 * A lightweight requestAnimationFrame‑driven **FIFO** task sequencer.
 *
 * - Runs **at most one** task per animation frame across the entire queue.
 * - **Global FIFO**: the oldest enqueued task runs first.
 * - A task is re‑run on each eligible frame until it returns `true`.
 * - Uses a fixed‑size circular buffer (power‑of‑two capacity) for speed.
 *
 * @param ownerWindow - Host providing `requestAnimationFrame` / `cancelAnimationFrame`.
 * @param capacity - Circular buffer capacity (must be a power of two).
 *                   Increase if you expect more concurrent steps.
 * @param fps - Target frames‑per‑second for execution (default 60).
 *              Effective cadence is still bounded by the display’s refresh rate.
 */
export function RafSequencer(
  ownerWindow: Window,
  capacity: number = 64,
  fps: number = 60
): RafSequencerType {
  /**
   * Mask for cheap modulo arithmetic (index & MASK).
   */
  const MASK = capacity - 1;

  /**
   * Next write position in the circular buffer (the **back** of the queue).
   */
  let head = 0;

  /**
   * Index of the current **front** (oldest) live task.
   * This slot is always tried first when executing.
   */
  let top = capacity - 1;

  /**
   * Number of live tasks in the buffer.
   * Drives scheduling and fast idle detection.
   */
  let liveCount = 0;

  /**
   * Circular buffer of steps.
   * A slot is `undefined` if free or cleared.
   */
  const buffer = new Array<StepFn | undefined>(capacity).fill(undefined);

  /**
   * Timestamp of the last processed frame.
   * Used to gate execution according to `fixedTimeStep`.
   */
  let lastTimeStamp: number | null = null;

  /**
   * Stores the animation frame ID for canceling the animation
   */
  let animationId: number = 0;

  /**
   * Fixed time step for each game update (in milliseconds)
   */
  const fixedTimeStep = 1000 / fps;

  /**
   * Enqueue a new step at the **back** of the queue.
   * Starts the loop if idle.
   */
  function enqueue(step: StepFn): number {
    head = dec(head);
    buffer[head] = step;
    liveCount += 1;

    advanceTop();
    scheduleIfNeeded();

    return head;
  }

  /**
   * rAF callback. Gates execution by `fixedTimeStep` and,
   * when due, executes exactly one step (the current **front**).
   */
  function tick(timeStamp: DOMHighResTimeStamp): void {
    if (lastTimeStamp === null) {
      lastTimeStamp = timeStamp;
    }

    const elapsed = timeStamp - lastTimeStamp;
    if (elapsed >= fixedTimeStep) {
      lastTimeStamp = timeStamp;
      runTopOnce();
    }

    animationId = 0;

    if (liveCount > 0) {
      scheduleIfNeeded();
    } else {
      lastTimeStamp = null;
    }
  }

  /**
   * Execute the current **front** step once.
   * If it returns `true`, remove it and advance the front.
   * If it returns `false`, it remains at the front and will run again next eligible frame.
   */
  function runTopOnce(): void {
    const step = buffer[top];
    if (!step) return;

    if (step()) {
      cancel(top);
    }
  }

  /**
   * Cancel the step stored at the given slot.
   * No‑op if already empty.
   */
  function cancel(id: number): void {
    const idx = id & MASK;
    if (buffer[idx] === undefined) return;

    buffer[idx] = undefined;
    liveCount -= 1;

    advanceTop();
  }

  /**
   * Advance `top` to the next **front** (oldest) live slot.
   * Resets indices if no steps remain.
   */
  function advanceTop(): void {
    if (liveCount === 0) {
      head = 0;
      top = 0;
      lastTimeStamp = null;
      return;
    }

    let guard = capacity;
    while (buffer[top] === undefined && guard-- > 0) {
      top = dec(top);
    }
  }

  /**
   * Schedule the next animation frame if not already scheduled.
   */
  function scheduleIfNeeded(): void {
    if (animationId === 0 && liveCount > 0) {
      animationId = ownerWindow.requestAnimationFrame(tick);
    }
  }

  /**
   * Wrap‑around decrement for ring indices.
   */
  function dec(i: number): number {
    return (i - 1) & MASK;
  }

  return { enqueue, cancel };
}
