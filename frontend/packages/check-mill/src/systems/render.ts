import {
  type AppRef,
  type AppProcessorFunction,
  Phases,
  ScrollLooper,
  SlidesLooper,
  SlidesRenderer,
  Translate,
  SlidesInView,
  writeVariables,
  appProcessorThrottled,
} from "../components";
import { noop } from "../core";
import { type AppSystem } from "./system";

export const RenderSystem: AppSystem = (appRef: AppRef) => {
  // prettier-ignore
  const scrollLooper = ScrollLooper(
    appRef.motion,
    appRef.layout.metrics()
  );

  // prettier-ignore
  const slidesLooper = SlidesLooper(
    appRef.viewport,
    appRef.layout.metrics(),
    appRef.motion,
    appRef.slides
  );

  // prettier-ignore
  const slidesInView = SlidesInView(
    appRef.owner.root,
    appRef.slides
  );
  slidesInView.init();

  // prettier-ignore
  const renderer = SlidesRenderer(
    appRef.owner.document,
    appRef.owner.container,
    appRef.axis,
    appRef.layout.metrics()
  );

  writeVariables(appRef.owner.root, appRef.layout.metrics());
  renderer.appendSlides(appRef.slides);

  const translate = Translate(appRef.axis);

  const lerp: AppProcessorFunction = (app, timeParams) => {
    const motion = app.motion;
    const interpolated =
      motion.current * timeParams.alpha + motion.previous * (1.0 - timeParams.alpha);
    motion.offset = interpolated;

    return app;
  };

  const loop: AppProcessorFunction = (app, _timeParams) => {
    scrollLooper.loop();
    if (slidesLooper.loop()) {
      renderer.syncOffset(app.slides);
    }
    return app;
  };

  const syncVisibility: AppProcessorFunction = (app: AppRef, _timeParams) => {
    const records = slidesInView.takeRecords();

    for (let i = 0; i < records.length; i++) {
      switch (records[i]) {
        case -1:
          renderer.fadeOut(app.slides[i], app.motion);
          break;

        case 1:
          renderer.fadeIn(app.slides[i], app.motion);
          break;
      }
    }

    return app;
  };

  const applyTranslation: AppProcessorFunction = (app, _timeParams) => {
    translate.to(app.owner.container, app.motion.offset);
    return app;
  };

  return {
    init: () => noop,
    logic: {
      [Phases.Render]: [lerp, loop, appProcessorThrottled(syncVisibility, 300), applyTranslation],
    },
  };
};
