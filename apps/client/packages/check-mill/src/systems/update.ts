import type { AppRef, AppSystemInstance, MotionType } from "../components";
import { Phases, TrackRecycler } from "../components";
import { VisibilityTracker } from "../components";
import type { LoopParams } from "../core";

const FRICTION = 0.92;

export function UpdateSystem(appRef: AppRef): AppSystemInstance {
  const { state } = appRef;

  const trackRecycler = new TrackRecycler();
  const visibilityTracker = new VisibilityTracker(state.motion.slides);

  return {
    init: () => () => visibilityTracker.reset(),
    logic: {
      [Phases.Update]: [
        (params) => processInertia(state.motion.track, params),
        () => trackRecycler.update(state.motion.track, state.layout.current, state.motion.slides),
        () =>
          visibilityTracker.executeIntersectionPass(
            state.motion.track,
            state.layout.current.computed,
          ),
      ],
    },
  };
}

function processInertia(motion: MotionType, params: LoopParams): void {
  motion.velocity *= Math.pow(FRICTION, params.dt / 16.67);

  if (Math.abs(motion.velocity) < 1) {
    motion.velocity = 0;
  }

  const displacement = motion.velocity * (params.dt / 1000);

  motion.previous = motion.current;
  motion.current += displacement;
}
