import type { AppSystemInstance, SystemContext, SlidesRendererType } from "../components";
import type { HydrationSink } from "../components";
import {
  AppDirtyFlags,
  Phases,
  cleanupFrame,
  createSlidesRenderer,
  getRetainedEntities,
  isDirty,
  reconcileHydration,
} from "../components";
import type { Disposable, LoopParams } from "../core";
import { DisposableStore, runIf } from "../core";

const BATCH_SIZE = 2;

/** Anything that can move a slide relative to the viewport. */
const GEOMETRY_CHANGED = AppDirtyFlags.Motion | AppDirtyFlags.Layout;

/** Anything that can change what a mounted slide should be showing. */
const REPAINT_NEEDED = AppDirtyFlags.Board | AppDirtyFlags.Hydration;

/** Projects the board onto the pooled slide templates. */
export type RenderContext = SystemContext<
  "document" | "rootElement",
  "layout" | "motion" | "selectionBoard" | "frame"
>;

export function RenderSystem(appRef: RenderContext): AppSystemInstance {
  const { host, state } = appRef;

  let renderer: SlidesRendererType;
  let sink: HydrationSink;

  /** Cleared whenever a reconcile pass leaves work outstanding. */
  let settled = false;

  /** Track position at the last reconcile, for sizing the next one. */
  let reconciledAt = 0;

  function init(): Disposable {
    const disposables = new DisposableStore();

    renderer = createSlidesRenderer(
      host.document,
      host.rootElement,
      state.layout.current,
      state.motion.slides,
    );

    sink = {
      mountedPages: renderer.mountedPages,
      hydrate: (slide) => renderer.hydrate(slide, state.selectionBoard),
      dehydrate: (slide) => renderer.dehydrate(slide),
    };

    settled = false;
    reconciledAt = state.motion.track.position;

    disposables.push(renderer.init());

    return () => disposables.flushAll();
  }

  /**
   * Mounts and releases slide templates, a bounded number per frame.
   *
   * Latched rather than purely flag-driven: the budget means one pass rarely
   * finishes the work, so this keeps running until a pass finds nothing left to
   * do. `reconcileHydration` returning zero is that signal — with a non-zero
   * budget it can only mean every slide already shows the page it should.
   */
  function syncVisibility(_params: LoopParams): void {
    if (settled && !isDirty(state.frame, AppDirtyFlags.Hydration)) return;

    const position = state.motion.track.position;
    const crossed = Math.abs(position - reconciledAt) / state.layout.current.derived.stride;

    reconciledAt = position;

    // Two operations for every slide that went past — one release and one
    // mount — with a floor so a nearly-settled view still creeps forward.
    // Measuring the distance actually travelled since the last pass is what
    // makes this scale with scroll speed; an earlier version scaled it by
    // `motion.velocity`, which nothing ever assigned, so it was always the floor.
    const budget = Math.max(BATCH_SIZE, Math.ceil(crossed) * 2);

    settled = reconcileHydration(sink, state.motion.slides, state.motion.visibility, budget) === 0;
  }

  /**
   * Writes the track position out to every slide.
   *
   * One `style.transform` per slide in the registry, so at 60fps this is the
   * single most expensive thing in the frame — and pointless unless the track
   * actually moved.
   */
  function syncPosition(_params: LoopParams): void {
    if (!isDirty(state.frame, GEOMETRY_CHANGED)) return;

    renderer.syncPosition(state.motion.slides, state.motion.track);
  }

  function updateSlides(_params: LoopParams): void {
    for (const slide of getRetainedEntities(state.motion.visibility)) {
      renderer.updateState(slide, state.selectionBoard);
    }
  }

  return {
    init,
    isBusy: () => !settled,
    logic: {
      [Phases.Render]: [
        syncPosition,
        syncVisibility,
        runIf(() => isDirty(state.frame, REPAINT_NEEDED), updateSlides),
      ],
      [Phases.Cleanup]: [() => cleanupFrame(state.frame)],
    },
  };
}
