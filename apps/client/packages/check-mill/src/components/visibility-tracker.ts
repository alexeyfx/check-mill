import { type MotionType } from "./scroll-motion";
import { slideTrackOffset } from "./track-geometry";
import type { ViewPlan } from "./view-plan";

export const enum IntersectionState {
  Outside = 0,
  Inside = 1,
}

export interface SpatialEntity {
  readonly realIndex: number;
  readonly virtualIndex: number;
  readonly viewportOffset: number;
}

/**
 * Which slides intersect the viewport, as of the last update.
 *
 * A single flag array, reused across frames — this runs every tick over the
 * whole registry and not allocating is the point. There is deliberately no
 * record of the previous frame: what is actually mounted is tracked by the
 * renderer, and keeping a second copy here is what let the two drift apart.
 */
export interface VisibilityState<T extends SpatialEntity> {
  readonly registry: readonly T[];
  readonly current: Uint8Array;
}

export function createVisibilityState<T extends SpatialEntity>(
  registry: readonly T[],
): VisibilityState<T> {
  return {
    registry,
    current: new Uint8Array(registry.length).fill(IntersectionState.Outside),
  };
}

export function resetVisibility<T extends SpatialEntity>(state: VisibilityState<T>): void {
  state.current.fill(IntersectionState.Outside);
}

/**
 * Marks every slide inside or outside the viewport.
 *
 * The window is the viewport, not the runway — the renderer only pools
 * `visible + 2` templates, so admitting more than that silently drops slides.
 */
export function executeIntersectionPass<T extends SpatialEntity>(
  state: VisibilityState<T>,
  motion: Readonly<MotionType>,
  plan: ViewPlan,
): boolean {
  const { registry, current } = state;

  const count = registry.length;
  const slideHeight = plan.computed.slide.height;

  const minLimit = -motion.position;
  const maxLimit = minLimit + plan.config.viewportSize.height;

  let changed = false;

  for (let i = 0; i < count; i++) {
    const entityMin = slideTrackOffset(registry[i], plan);
    const entityMax = entityMin + slideHeight;

    const next =
      entityMin < maxLimit && entityMax > minLimit
        ? IntersectionState.Inside
        : IntersectionState.Outside;

    // The slot already holds last frame's value, so the comparison is free and
    // saves the reconcile pass from scanning a registry that did not move.
    if (next !== current[i]) {
      changed = true;
      current[i] = next;
    }
  }

  return changed;
}

export function isRetained<T extends SpatialEntity>(
  state: VisibilityState<T>,
  realIndex: number,
): boolean {
  return state.current[realIndex] === IntersectionState.Inside;
}

/**
 * The retained slide nearest the top of the viewport, or null when none are.
 *
 * Both the resize anchor and the server cursor need to name the position the
 * user is looking at, and they have to agree on it.
 */
export function topmostRetained<T extends SpatialEntity>(
  state: VisibilityState<T>,
  motion: Readonly<MotionType>,
  plan: ViewPlan,
): T | null {
  const { registry, current } = state;
  const count = registry.length;

  let anchor: T | null = null;
  let topmost = Number.POSITIVE_INFINITY;

  for (let i = 0; i < count; i++) {
    if (current[i] !== IntersectionState.Inside) continue;

    const screenTop = slideTrackOffset(registry[i], plan) + motion.position;

    if (screenTop < topmost) {
      topmost = screenTop;
      anchor = registry[i];
    }
  }

  return anchor;
}

export function getRetainedEntities<T extends SpatialEntity>(state: VisibilityState<T>): T[] {
  const { registry, current } = state;
  const count = registry.length;

  const retained: T[] = [];

  for (let i = 0; i < count; i++) {
    if (current[i] === IntersectionState.Inside) {
      retained.push(registry[i]);
    }
  }

  return retained;
}
