import type { AppRef, AppSystemInstance, Slide, SlidesRendererType } from "../components";
import { Phases, createSlidesRenderer, needsCheck } from "../components";
import { FrustumMutation, SpatialDeltaManifest } from "../components";
import type { Disposable, LoopParams } from "../core";
import { DisposableStore, runIf, throttle } from "../core";

export function RenderSystem(appRef: AppRef): AppSystemInstance {
  const { host, state } = appRef;

  let renderer: SlidesRendererType;

  const BATCH_SIZE = 2;
  const recordQueue: SpatialDeltaManifest<Slide>[] = [];

  function init(): Disposable {
    const disposables = new DisposableStore();

    renderer = createSlidesRenderer(
      host.document,
      host.rootElement,
      state.layout.current,
      state.motion.slides,
    );

    disposables.push(renderer.init());

    return () => disposables.flushAll();
  }

  function syncVisibility(_params: LoopParams): void {
    const records = state.motion.visibility.takeRecords();
    if (records.length > 0) {
      recordQueue.push(...records);
    }

    const velocityMagnitude = Math.abs(state.motion.track.velocity);

    const dynamicBatchSize =
      velocityMagnitude > 20 ? Math.ceil(velocityMagnitude * 0.8) : BATCH_SIZE;

    const limit = Math.min(recordQueue.length, dynamicBatchSize);

    for (let i = 0; i < limit; i++) {
      const record = recordQueue.shift();
      if (!record) continue;

      switch (record.mutation) {
        case FrustumMutation.Culled:
          renderer.dehydrate(record.entity);
          break;

        case FrustumMutation.Unculled:
          renderer.hydrate(record.entity, state.selectionBoard);
          break;
      }
    }
  }

  function syncPosition(_params: LoopParams): void {
    renderer.syncPosition(state.motion.slides, state.motion.track);
  }

  function lerp(params: LoopParams): void {
    const motion = state.motion.track;
    motion.offset = motion.previous + (motion.current - motion.previous) * params.alpha;
  }

  function updateSlides(_params: LoopParams): void {
    for (const slide of state.motion.visibility.getRetainedEntities()) {
      renderer.updateState(slide, state.selectionBoard);
    }
  }

  return {
    init,
    logic: {
      [Phases.Render]: [
        lerp,
        syncPosition,
        throttle(syncVisibility, 16),
        runIf(() => needsCheck(state.dirtyFlags), updateSlides),
      ],
    },
  };
}
