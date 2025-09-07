import {
  type AppProcessorFunction,
  type AppRef,
  type GestureEvent,
  AppDirtyFlags,
  GestureState,
  Phases,
  Drag,
  Wheel,
  disableSlidePointerEvents,
  enableSlidePointerEvents,
} from "../components";
import { type Disposable } from "../primitives";
import { call, flush } from "../utils";
import { type AppSystem } from "./system";

export const GesturesSystem: AppSystem = (appRef: AppRef) => {
  const drag = Drag(appRef.owner.root, appRef.axis);
  const wheel = Wheel(appRef.owner.root, appRef.axis);

  const cleanup = () => flush([drag.destroy, wheel.destroy], call);

  const init = (): Disposable => {
    // prettier-ignore
    Promise
      .allSettled([drag, wheel].map(g => g.init()))
      .then(() => {
        drag.register(handleDragScroll.bind(null, appRef));
        wheel.register(handleWheelScroll.bind(null, appRef));
      });

    return cleanup;
  };

  return {
    init,
    logic: {
      [Phases.IO]: [processDragScroll, processWheelScroll],
    },
  };
};

const handleWheelScroll = (appRef: AppRef, event: GestureEvent): void => {
  appRef.wheelEvents.push(event);
  appRef.dirtyFlags.set(AppDirtyFlags.Interacted);
};

const processWheelScroll: AppProcessorFunction = (appRef, _timeParams) => {
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

const handleDragScroll = (appRef: AppRef, event: GestureEvent): void => {
  switch (event.state) {
    case GestureState.Initialize:
      disableSlidePointerEvents(appRef.owner.root);
      break;
    case GestureState.Finalize:
      enableSlidePointerEvents(appRef.owner.root);
      break;
  }

  appRef.dragEvents.push(event);
  appRef.dirtyFlags.set(AppDirtyFlags.Interacted);
};

const processDragScroll: AppProcessorFunction = (appRef, _timeParams) => {
  const events = appRef.dragEvents;
  const motion = appRef.motion;

  for (const event of events) {
    switch (event.state) {
      case GestureState.Initialize:
        motion.velocity = 0;
        break;

      case GestureState.Update:
        motion.current += event.delta;
        break;

      case GestureState.Finalize:
        motion.velocity = event.delta;
        break;
    }
  }

  events.length = 0;
  return appRef;
};
