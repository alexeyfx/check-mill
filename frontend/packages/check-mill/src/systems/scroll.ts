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
import { type Disposable, DisposableStoreId, createDisposableStore } from "../core";
import { type AppSystem } from "./system";

export const ScrollSystem: AppSystem = (appRef: AppRef) => {
  const init = (): Disposable => {
    const drag = Drag(appRef.owner.root, appRef.axis);
    drag.register((event) => handleDragScroll(appRef, event));

    const wheel = Wheel(appRef.owner.root, appRef.axis);
    wheel.register((event) => handleWheelScroll(appRef, event));

    const disposables = createDisposableStore();
    disposables.push(DisposableStoreId.Static, drag.init(), wheel.init());

    return () => disposables.flushAll();
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
    motion.velocity = event.delta;
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
