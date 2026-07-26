import type { AppSystemInstance, SystemContext, InfiniteScrollEvent } from "../components";
import { AppDirtyFlags, InfiniteScroll, markDirty, move, Phases } from "../components";
import type { Disposable } from "../core";
import { DisposableStore, falsy } from "../core";

/** Owns the scroll surface and translates its deltas into track motion. */
export type ScrollContext = SystemContext<"rootElement", "motion" | "frame">;

export function ScrollSystem(appRef: ScrollContext): AppSystemInstance {
  const { state } = appRef;

  function init(): Disposable {
    const scroller = new InfiniteScroll(appRef.host.rootElement);
    const disposables = new DisposableStore();

    disposables.push(scroller.init(), scroller.onScroll.register(scheduleScrollEvent));

    return () => disposables.flushAll();
  }

  function scheduleScrollEvent(event: InfiniteScrollEvent): void {
    move(state.motion.track, event.delta);
    markDirty(state.frame, AppDirtyFlags.Motion);
  }

  return {
    init,
    isBusy: falsy,
    logic: {
      [Phases.IO]: [],
    },
  };
}
