import type { AppRef } from "./application";
import { AppDirtyFlags, createSlideRegistry, markDirty } from "./application";
import { moveTo } from "./scroll-motion";
import { writeVariables } from "./styles";
import { slideTrackOffset } from "./track-geometry";
import { createTrackState } from "./track-recycler";
import type { ViewPlan } from "./view-plan";
import { topmostRetained } from "./visibility-tracker";

/**
 * Adopts a plan that leaves the slide registry valid.
 *
 * Slide width, height and horizontal origin all reach the DOM through custom
 * properties, so this is the entire update — no elements are touched and the
 * runtime keeps running.
 */
export function adoptViewPlan(appRef: AppRef, plan: ViewPlan): void {
  appRef.state.layout.current = plan;
  writeVariables(appRef.host.rootElement, plan);

  markDirty(
    appRef.state.frame,
    AppDirtyFlags.Layout | AppDirtyFlags.Board | AppDirtyFlags.Hydration,
  );
}

/**
 * Rebuilds the view layer for a plan with a different grid or slide count.
 *
 * Callers must tear the systems down first and start them again afterwards: the
 * renderer, the visibility state and the track are all sized against the
 * registry this replaces.
 */
export function rebuildForViewPlan(appRef: AppRef, plan: ViewPlan): void {
  const { host, state } = appRef;

  const anchorItem = readAnchorItem(appRef);

  adoptViewPlan(appRef, plan);

  const registry = createSlideRegistry(host.document, plan);

  state.motion.slides = registry.slides;
  state.motion.visibility = registry.visibility;
  state.motion.recycler = registry.recycler;

  restoreAnchor(appRef, plan, anchorItem);
}

/**
 * Global item index of the topmost slide currently intersecting the viewport.
 */
function readAnchorItem(appRef: AppRef): number {
  const { state } = appRef;
  const plan = state.layout.current;

  const anchor = topmostRetained(state.motion.visibility, state.motion.track, plan);
  if (!anchor) return 0;

  return anchor.pageIndex * plan.computed.pagination.itemsPerSlide;
}

/**
 * Positions the freshly built track so the anchored item is back at the top.
 */
function restoreAnchor(appRef: AppRef, plan: ViewPlan, anchorItem: number): void {
  const { total } = plan.computed.slideCount;
  const { itemsPerSlide, totalPages } = plan.computed.pagination;

  const page = Math.min(Math.floor(anchorItem / itemsPerSlide), totalPages - 1);
  const loopCycleCount = Math.floor(page / total);
  const realIndex = page - loopCycleCount * total;

  appRef.state.motion.recycler = createTrackState(loopCycleCount);
  moveTo(appRef.state.motion.track, -slideTrackOffset({ realIndex, viewportOffset: 0 }, plan));
}
