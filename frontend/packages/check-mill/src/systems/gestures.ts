import {
  type AppRef,
  Drag,
  GestureState,
  Wheel,
  Phases,
  AppDirtyFlags,
  ProcessorFunction,
  disableSlidePointerEvents,
  enableSlidePointerEvents,
} from "../components";
import { Disposable } from "../primitives";
import { call, flush } from "../utils";
import { type System } from "./system";

export const GesturesSystem: System<AppRef> = (appRef: AppRef) => {
  const drag = Drag(appRef.host.root, appRef.axis);
  const wheel = Wheel(appRef.host.root, appRef.axis);

  const cleanup = () => flush([drag.destroy, wheel.destroy], call);

  const init = (): Disposable => {
    drag.init();
    wheel.init();

    return cleanup;
  };

  return {
    init,
    logic: {
      [Phases.IO]: [processDragScroll, processWheelScroll],
    },
  };
};

const processWheelScroll: ProcessorFunction<AppRef> = (appRef: AppRef): AppRef => {
  const events = appRef.wheelEvents;
  const motion = appRef.motion;

  for (const event of events) {
    motion.previous = motion.current;
    motion.current += event.delta;
    motion.velocity = 0;
  }

  events.length = 0;
  return appRef;
};

const processDragScroll: ProcessorFunction<AppRef> = (appRef: AppRef): AppRef => {
  const events = appRef.dragEvents;
  const motion = appRef.motion;

  for (const event of events) {
    switch (event.state) {
      case GestureState.Initialize:
        motion.velocity = 0;
        appRef.dirtyFlags &= AppDirtyFlags.GestureRunning;
        disableSlidePointerEvents(appRef.host.root);
        break;

      case GestureState.Update:
        motion.current += event.delta;
        break;

      case GestureState.Finalize:
        motion.velocity = event.delta;
        appRef.dirtyFlags |= AppDirtyFlags.GestureRunning;
        enableSlidePointerEvents(appRef.host.root);
        break;
    }
  }

  events.length = 0;
  return appRef;
};
