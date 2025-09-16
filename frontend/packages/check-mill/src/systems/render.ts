import {
  type AppRef,
  type AppProcessorFunction,
  type SlidesRendererType,
  type TranslateType,
  type VisibilityTrackerType,
  Phases,
  VisibilityChange,
  SlidesRenderer,
  Translate,
  appProcessorThrottled,
  createVisibilityTracker,
  writeVariables,
} from "../components";
import { type Disposable, DisposableStoreId, createDisposableStore } from "../core";
import { type AppSystem } from "./system";

export const RenderSystem: AppSystem = (appRef: AppRef) => {
  let renderer: SlidesRendererType;
  let translate: TranslateType;
  let slidesVisibilityTracker: VisibilityTrackerType;

  const init = (): Disposable => {
    translate = Translate(appRef.axis);

    slidesVisibilityTracker = createVisibilityTracker(
      appRef.owner.root,
      appRef.slides.map((s) => s.nativeElement)
    );

    renderer = SlidesRenderer(
      appRef.owner.document,
      appRef.owner.container,
      appRef.axis,
      appRef.layout
    );
    renderer.appendSlides(appRef.slides);

    writeVariables(appRef.owner.root, appRef.layout);

    const disposables = createDisposableStore();
    disposables.push(DisposableStoreId.Static, slidesVisibilityTracker.init());

    return () => disposables.flushAll();
  };

  const lerp: AppProcessorFunction = (app, timeParams) => {
    const motion = app.motion;
    const interpolated =
      motion.current * timeParams.alpha + motion.previous * (1.0 - timeParams.alpha);
    motion.offset = interpolated;

    return app;
  };

  const syncVisibility: AppProcessorFunction = (app: AppRef, _timeParams) => {
    const records = slidesVisibilityTracker.takeRecords();

    for (const record of records) {
      switch (record.change) {
        case VisibilityChange.Exited:
          renderer.fadeOut(app.slides[record.index], app.motion);
          break;
        case VisibilityChange.Entered:
          renderer.fadeIn(app.slides[record.index], app.motion);
          break;
      }
    }

    return app;
  };

  const syncOffset: AppProcessorFunction = (app, _timeParams) => {
    renderer.syncOffset(app.slides);
    return app;
  };

  const applyTranslation: AppProcessorFunction = (app, _timeParams) => {
    translate.to(app.owner.container, app.motion.offset);
    return app;
  };

  return {
    init,
    logic: {
      [Phases.Render]: [
        lerp,
        syncOffset,
        applyTranslation,
        appProcessorThrottled(syncVisibility, 160),
      ],
    },
  };
};
