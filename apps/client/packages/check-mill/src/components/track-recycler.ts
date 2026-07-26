import { wrap } from "../core";
import { type MotionType, moveTo } from "./scroll-motion";
import { type SlidesCollectionType } from "./slides";
import type { ViewPlan } from "./view-plan";

export const enum TrackShiftDirection {
  Neutral,
  ShiftedUp,
  ShiftedDown,
}

/**
 * Where the endless track currently sits: how many times it has looped, and
 * which half of the runway it occupies.
 */
export interface TrackState {
  readonly loopCycleCount: number;
  readonly shiftDirection: TrackShiftDirection;
}

export interface SlidePlacement {
  readonly realIndex: number;
  readonly viewportOffset: number;
  readonly virtualIndex: number;
  readonly pageIndex: number;
}

export interface TrackClamp {
  readonly position: number;
  readonly cycleDelta: number;
}

export function createTrackState(loopCycleCount = 0): TrackState {
  return { loopCycleCount, shiftDirection: TrackShiftDirection.Neutral };
}

/**
 * Folds a track position back onto the runway.
 */
export function clampTrackPosition(
  position: number,
  layout: ViewPlan,
): TrackClamp {
  const topLimit = 0;
  const bottomLimit = -layout.computed.contentArea.height + layout.config.slideSpacing;

  const wrapped = wrap(position, topLimit, bottomLimit);

  if (Math.abs(position - wrapped) < 0.1) {
    return { position, cycleDelta: 0 };
  }

  const cycleDelta = position < bottomLimit ? 1 : position > topLimit ? -1 : 0;

  return { position: wrapped, cycleDelta };
}

/**
 * Which end of the runway the buffer band has to be moved to.
 */
export function resolveShiftDirection(
  position: number,
  layout: ViewPlan,
): TrackShiftDirection {
  const midPointTrigger = layout.computed.contentArea.height / 2;

  return Math.abs(position) > midPointTrigger
    ? TrackShiftDirection.ShiftedDown
    : TrackShiftDirection.ShiftedUp;
}

/**
 * The full placement table for a registry of `count` slides.
 */
export function computePlacements(
  track: Readonly<TrackState>,
  layout: ViewPlan,
  count: number,
): SlidePlacement[] {
  const { visible, total } = layout.computed.slideCount;
  const { totalPages } = layout.computed.pagination;

  const globalIterationOffset = track.loopCycleCount * total;
  const placements: SlidePlacement[] = new Array(count);

  for (let realIndex = 0; realIndex < count; realIndex++) {
    let viewportOffset = 0;
    let virtualIndex = realIndex + globalIterationOffset;

    if (track.shiftDirection === TrackShiftDirection.ShiftedDown && realIndex < visible) {
      viewportOffset = 1;
      virtualIndex += total;
    } else if (
      track.shiftDirection === TrackShiftDirection.ShiftedUp &&
      realIndex >= total - visible
    ) {
      viewportOffset = -1;
      virtualIndex -= total;
    }

    placements[realIndex] = {
      realIndex,
      viewportOffset,
      virtualIndex,
      pageIndex: wrap(virtualIndex, 0, totalPages),
    };
  }

  return placements;
}

export function applyPlacements(
  slides: SlidesCollectionType,
  placements: readonly SlidePlacement[],
): void {
  const count = slides.length;

  for (let i = 0; i < count; i++) {
    const slide = slides[i];
    const placement = placements[i];

    slide.viewportOffset = placement.viewportOffset;
    slide.virtualIndex = placement.virtualIndex;
    slide.pageIndex = placement.pageIndex;
  }
}

/**
 * Advances the track by one frame, returning the next track state.
 */
export function advanceTrack(
  track: Readonly<TrackState>,
  motion: MotionType,
  layout: ViewPlan,
  slides: SlidesCollectionType,
): TrackState {
  const clamp = clampTrackPosition(motion.position, layout);

  if (clamp.cycleDelta !== 0) {
    moveTo(motion, clamp.position);
  }

  const shiftDirection = resolveShiftDirection(motion.position, layout);

  if (shiftDirection === track.shiftDirection && clamp.cycleDelta === 0) {
    return track;
  }

  const next: TrackState = {
    loopCycleCount: track.loopCycleCount + clamp.cycleDelta,
    shiftDirection,
  };

  applyPlacements(slides, computePlacements(next, layout, slides.length));

  return next;
}
