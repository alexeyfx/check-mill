import type { AppSystemInstance, SystemContext } from "../components";
import {
  AppDirtyFlags,
  Phases,
  advanceTrack,
  executeIntersectionPass,
  isDirty,
  markDirty,
} from "../components";
import { noop, falsy } from "../core";

/** Anything that can move a slide relative to the viewport. */
const GEOMETRY_CHANGED = AppDirtyFlags.Motion | AppDirtyFlags.Layout;

/** Advances the simulation: track recycling and visibility. */
export type UpdateContext = SystemContext<never, "layout" | "motion" | "frame">;

export function UpdateSystem(appRef: UpdateContext): AppSystemInstance {
  const { state } = appRef;

  function recycleTrack(): void {
    const previous = state.motion.recycler;

    state.motion.recycler = advanceTrack(
      previous,
      state.motion.track,
      state.layout.current,
      state.motion.slides,
    );

    if (state.motion.recycler !== previous) {
      markDirty(state.frame, AppDirtyFlags.Hydration);
    }
  }

  function markVisibility(): void {
    const changed = executeIntersectionPass(
      state.motion.visibility,
      state.motion.track,
      state.layout.current,
    );

    if (changed) {
      markDirty(state.frame, AppDirtyFlags.Hydration);
    }
  }

  function advanceGeometry(): void {
    if (!isDirty(state.frame, GEOMETRY_CHANGED)) return;

    recycleTrack();
    markVisibility();
  }

  return {
    init: () => noop,
    isBusy: falsy,
    logic: {
      [Phases.Update]: [advanceGeometry],
    },
  };
}
