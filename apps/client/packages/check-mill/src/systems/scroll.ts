import type { AppRef, AppSystemInstance, InfiniteScrollEvent } from "../components";
import { InfiniteScroll, move, Phases } from "../components";
import type { Disposable } from "../core";
import { DisposableStore } from "../core";

export function ScrollSystem(appRef: AppRef): AppSystemInstance {
  const { state } = appRef;

  function init(): Disposable {
    const scroller = new InfiniteScroll(appRef.host.rootElement);
    const disposables = new DisposableStore();

    disposables.push(scroller.init(), scroller.onScroll.register(scheduleScrollEvent));

    return () => disposables.flushAll();
  }

  function scheduleScrollEvent(event: InfiniteScrollEvent): void {
    move(state.motion.track, event.delta);
  }

  return {
    init,
    logic: {
      [Phases.IO]: [],
    },
  };
}
