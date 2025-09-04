import { type System } from "./system";

import {
  AppRef,
  Phases,
  ScrollLooper,
  SlidesLooper,
  SlidesRenderer,
  Translate,
  runIf,
  type ProcessorFunction,
} from "../components";
import { noop } from "../utils";

export const RenderSystem: System<AppRef> = (appRef: AppRef) => {
  const scrollLooper = ScrollLooper(appRef.motion, appRef.layout.metrics());
  const translate = Translate(appRef.axis);
  const renderer = SlidesRenderer(
    document,
    appRef.host.container,
    appRef.axis,
    appRef.layout.metrics()
  );

  const slidesLooper = SlidesLooper(
    appRef.viewport,
    appRef.layout.metrics(),
    appRef.motion,
    appRef.slides
  );

  const translateTo = translate.to.bind(appRef.host.container);

  return {
    init: () => noop,
    logic: {
      [Phases.Render]: [
        lerp,
        scrollLooper.loop,
        translateTo,
        runIf(slidesLooper.loop, renderer.syncOffset.bind({}, appRef.slides)),
      ],
    },
  };
};

const lerp: ProcessorFunction<AppRef> = (appRef) => {
  const motion = appRef.motion;
  const interpolated = motion.current * 0 + motion.previous * (1.0 - 0);
  motion.offset = interpolated;

  return appRef;
};

const syncSlideVisibility = (slidesInView: SlidesInViewType, appRef: AppRef): AppRef => {
  const records = slidesInView.takeRecords();

  for (const record of records) {
    switch (record) {
      case -1:
        renderer.fadeOut(slides[record], motion);
        break;

      case 1:
        renderer.fadeIn(slides[record], motion);
        break;
    }
  }
};
