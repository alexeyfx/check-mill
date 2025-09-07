import {
  type AppRef,
  type AppProcessorFunction,
  type SlidesInViewType,
  type SlidesRendererType,
  Phases,
  ScrollLooper,
  SlidesLooper,
  SlidesRenderer,
  Translate,
  SlidesInView,
} from "../components";
import { noop } from "../utils";
import { type AppSystem } from "./system";

export const RenderSystem: AppSystem = (appRef: AppRef) => {
  const scrollLooper = ScrollLooper(appRef.motion, appRef.layout.metrics());

  const translate = Translate(appRef.axis).to.bind(appRef.owner.container);

  const slidesLooper = SlidesLooper(
    appRef.viewport,
    appRef.layout.metrics(),
    appRef.motion,
    appRef.slides
  );

  const slidesInView = SlidesInView(appRef.owner.root, appRef.slides);

  const renderer = SlidesRenderer(
    appRef.owner.document,
    appRef.owner.container,
    appRef.axis,
    appRef.layout.metrics()
  );

  return {
    init: () => noop,
    logic: {
      [Phases.Render]: [lerp],
    },
  };
};

const lerp: AppProcessorFunction = (appRef, timeParams) => {
  const motion = appRef.motion;
  const interpolated =
    motion.current * timeParams.alpha + motion.previous * (1.0 - timeParams.alpha);
  motion.offset = interpolated;

  return appRef;
};

const createSlideVisibilitySync = (
  slidesInView: SlidesInViewType,
  renderer: SlidesRendererType
): AppProcessorFunction => {
  return (appRef, _timeParams) => {
    const records = slidesInView.takeRecords();

    for (const record of records) {
      switch (record) {
        case -1:
          renderer.fadeOut(appRef.slides[record], appRef.motion);
          break;

        case 1:
          renderer.fadeIn(appRef.slides[record], appRef.motion);
          break;
      }
    }

    return appRef;
  };
};
