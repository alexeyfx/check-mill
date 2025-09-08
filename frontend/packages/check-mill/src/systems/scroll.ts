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
import { type Disposable, DisposableStore } from "../core";
import { type AppSystem } from "./system";

export const ScrollSystem: AppSystem = (appRef: AppRef) => {
  const drag = Drag(appRef.owner.root, appRef.axis);
  const wheel = Wheel(appRef.owner.root, appRef.axis);
  const disposable = DisposableStore();

  disposable.pushStatic(drag.destroy, wheel.destroy);

  const init = (): Disposable => {
    drag.init();
    wheel.init();

    drag.register((event) => handleDragScroll(appRef, event));
    wheel.register((event) => handleWheelScroll(appRef, event));

    return () => disposable.flushAll();
  };

  return {
    init,
    logic: {
      [Phases.IO]: [processDragScroll, processWheelScroll],
    },
  };
};

const handleWheelScroll = (app: AppRef, event: GestureEvent): void => {
  app.wheelEvents.push(event);
  app.dirtyFlags.set(AppDirtyFlags.Interacted);
};

const processWheelScroll: AppProcessorFunction = (app, _timeParams) => {
  const events = app.wheelEvents;
  const motion = app.motion;

  for (const event of events) {
    motion.previous = motion.current;
    motion.current += event.delta;
    motion.velocity = 0;
  }

  events.length = 0;
  return app;
};

const handleDragScroll = (app: AppRef, event: GestureEvent): void => {
  switch (event.state) {
    case GestureState.Initialize:
      disableSlidePointerEvents(app.owner.root);
      break;
    case GestureState.Finalize:
      enableSlidePointerEvents(app.owner.root);
      break;
  }

  app.dragEvents.push(event);
  app.dirtyFlags.set(AppDirtyFlags.Interacted);
};

const processDragScroll: AppProcessorFunction = (app, _timeParams) => {
  const events = app.dragEvents;
  const motion = app.motion;

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
  return app;
};
