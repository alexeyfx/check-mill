import type { AppSystemInstance, SystemContext } from "../components";
import { AppDirtyFlags, Phases, hitTest, markDirty } from "../components";
import type { Disposable, LoopParams } from "../core";
import { DisposableStore, event, throttle } from "../core";

/** Reads pointer coordinates against the layout, flips bits, sends them on. */
export type ToggleContext = SystemContext<
  "rootElement" | "transport",
  "layout" | "motion" | "selectionBoard" | "frame"
>;

export function ToggleSystem(appRef: ToggleContext): AppSystemInstance {
  const { state } = appRef;

  const toggleQueue: number[] = [];
  const disposables = new DisposableStore();

  function init(): Disposable {
    disposables.push(
      event(appRef.host.rootElement, "click", handleToggle),
      () => (toggleQueue.length = 0),
    );

    return () => disposables.flushAll();
  }

  /**
   * Ships the pending toggles to the server.
   */
  function processToggles(_params: LoopParams): void {
    if (toggleQueue.length === 0) return;

    const merged = mergeToggles(toggleQueue);
    toggleQueue.length = 0;

    if (merged.length === 0) return;

    const transport = appRef.host.transport;
    merged.length > 1 ? transport.sendToggleMany(merged) : transport.sendToggle(merged[0]);
  }

  /**
   * Applies the toggle locally the moment it happens.
   */
  function handleToggle(event: MouseEvent): void {
    const hit = hitTest(
      [event.clientX, event.clientY],
      state.layout.viewport.measure(),
      state.layout.current,
      state.motion.slides,
      state.motion.track,
    );

    if (!hit) return;

    state.selectionBoard.flip(hit.index);
    markDirty(state.frame, AppDirtyFlags.Board);

    toggleQueue.push(hit.index);
  }

  function mergeToggles(toggles: number[]): number[] {
    const active = new Set<number>();

    for (const toggle of toggles) {
      if (active.has(toggle)) {
        active.delete(toggle);
      } else {
        active.add(toggle);
      }
    }

    return [...active];
  }

  return {
    init,
    isBusy: () => toggleQueue.length > 0,
    logic: {
      [Phases.IO]: [throttle(processToggles, 300)],
    },
  };
}
