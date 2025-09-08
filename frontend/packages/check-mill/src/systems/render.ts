import {
  type AppRef,
  type AppProcessorFunction,
  type ScrollLooperType,
  type SlidesInViewType,
  type SlidesLooperType,
  type SlidesRendererType,
  Phases,
  ScrollLooper,
  SlidesLooper,
  SlidesRenderer,
  Translate,
  SlidesInView,
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

  // prettier-ignore
  const renderer = SlidesRenderer(
    appRef.owner.document,
    appRef.owner.container,
    appRef.axis,
    appRef.layout.metrics()
  );

  const translate = Translate(appRef.axis).to.bind(null, appRef.owner.container);

  return {
    init: () => noop,
    logic: {
      [Phases.Render]: [
        lerp,
        loop.bind(null, slidesLooper, scrollLooper, renderer),
        syncVisibility.bind(null, slidesInView, renderer),
        (appRef: AppRef) => {
          translate(appRef.motion.offset);
          return appRef;
        },
      ],
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

const syncVisibility = (
  slidesInView: SlidesInViewType,
  renderer: SlidesRendererType,
  appRef: AppRef
) => {
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

const loop = (
  slidesLooper: SlidesLooperType,
  scrollLooper: ScrollLooperType,
  renderer: SlidesRendererType,
  appRef: AppRef
): AppRef => {
  scrollLooper.loop();
  slidesLooper.loop() && renderer.syncOffset(appRef.slides);

  return appRef;
};
