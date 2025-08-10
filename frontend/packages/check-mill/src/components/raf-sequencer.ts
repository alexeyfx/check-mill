import { assert, type WindowType } from "../utils";

export interface RafSequencerType {
  enqueue(tasks: VoidFunction[]): number;
  cancel(id: number): void;
}

/**
 * Creates a lightweight, requestAnimationFrame-driven task sequencer.
 * Each animation frame, at most one task is executed across all groups.
 *
 * @param {WindowType} ownerWindow - The window object associated with the document.
 * @param {number} [fps=60] - The desired frames per second for the game loop (defaults to 60).
 * @returns A `RafSequencerType` with lifecycle and queue controls.
 */
export function RafSequencer(ownerWindow: WindowType, fps: number = 60): RafSequencerType {
  assert(fps > 0, `Invalid FPS value: ${fps}.`);

  /**
   * FIFO list of task groups.
   * Each group is an array of `VoidFunction`s executed in LIFO order.
   */
  const queue: VoidFunction[][] = [];

  /**
   * Count of tasks still pending across all groups.
   * Helps decide whether to continue scheduling frames.
   */
  let pendingTasksCount = 0;

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
   * Enqueue a new group of tasks. The group is reversed so tasks are executed LIFO.
   * If the loop is idle, it will be started.
   *
   * @param tasks - One or more functions to run, one per frame.
   * @returns The index of the newly enqueued task group.
   */
  function enqueue(tasks: VoidFunction[]): number {
    const groupIndex = queue.push([...tasks].reverse()) - 1;
    pendingTasksCount += tasks.length;

    animationId ||= ownerWindow.requestAnimationFrame(tick);

    return groupIndex;
  }

  /**
   * The rAF callback. It gates task execution by `fixedTimeStep` and,
   * when due, drains exactly one task across all groups.
   */
  function tick(timeStamp: DOMHighResTimeStamp): void {
    lastTimeStamp ||= timeStamp;

    const elapsed = timeStamp - lastTimeStamp;
    if (elapsed >= fixedTimeStep) {
      lastTimeStamp = timeStamp;
      drainOneTask();
    }

    if (pendingTasksCount > 0) {
      animationId = ownerWindow.requestAnimationFrame(tick);
    } else {
      animationId = 0;
    }
  }

  /**
   * Called by the render loop each frame. Executes at most one task:
   * - Finds the first non-empty group.
   * - If none found, the loop is stopped to avoid unnecessary frames.
   * - Otherwise, pops and runs the next task from that group (LIFO).
   */
  function drainOneTask(): void {
    const nextGroup = queue.find((group) => group.length > 0);
    if (!nextGroup) {
      return;
    }

    const task = nextGroup.pop();
    task?.();

    pendingTasksCount -= 1;
  }

  /**
   * Cancel all remaining tasks in a given group id.
   * No-op if the id is invalid or already empty.
   *
   * @param id - Group id previously returned by `enqueue`.
   */
  function cancel(id: number): void {
    const group = queue[id];
    if (group) {
      pendingTasksCount -= group.length;
      group.length = 0;
    }
  }

  return { enqueue, cancel };
}
