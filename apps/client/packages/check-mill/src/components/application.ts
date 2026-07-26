import type {
  BitwiseFlags,
  Disposable,
  ProcessorFunction,
  LoopParams,
  RenderLoopType,
} from "../core";
import { assert, createFlagManager, noop, BitSet } from "../core";
import { SlideFactory } from "./dom-factories";
import { deriveViewPlan, type ViewPlan } from "./view-plan";
import type { Transport, WindowSnapshot } from "./transport";
import type { MotionType } from "./scroll-motion";
import { createMotion } from "./scroll-motion";
import type { Slide, SlidesCollectionType } from "./slides";
import { createSlides } from "./slides";
import { createTrackState, type TrackState } from "./track-recycler";
import { Viewport } from "./viewport";
import { createVisibilityState, type VisibilityState } from "./visibility-tracker";
import { writeVariables } from "./styles";

// prettier-ignore
export const enum AppDirtyFlags {
  None      = 0,
  /** The track moved: slides need repositioning and re-intersecting. */
  Motion    = 1 << 0,
  /** Selection bits changed: mounted slides need to re-read the board. */
  Board     = 1 << 1,
  /** The view plan was replaced: all derived geometry is stale. */
  Layout    = 1 << 2,
  /** The retained set or a page assignment changed: hydration must reconcile. */
  Hydration = 1 << 3,
}

export const enum Phases {
  IO,
  Update,
  Render,
  Cleanup,
}

export interface AppHostContext {
  readonly window: Window;
  readonly document: Document;
  readonly rootElement: HTMLElement;
  readonly transport: Transport;
}

export interface LayoutDomain {
  current: ViewPlan;
  readonly viewport: Viewport;
}

export interface MotionDomain {
  readonly track: MotionType;
  slides: SlidesCollectionType;
  visibility: VisibilityState<Slide>;
  recycler: TrackState;
}

export interface FrameSyncBuffer {
  readonly inbound: {
    readonly patches: [index: number, state: number][];
    readonly windowSnapshots: WindowSnapshot[];
    readonly stream: {
      isDone: boolean;
      expectedChunks: number;
      readonly chunks: Uint8Array[];
    };
  };
}

export interface FrameSignal {
  readonly flags: BitwiseFlags;
  wake: VoidFunction;
}

export function createFrameSignal(): FrameSignal {
  return {
    flags: createFlagManager(AppDirtyFlags.None),
    wake: noop
  };
}

export interface SimulationState {
  readonly layout: LayoutDomain;
  readonly motion: MotionDomain;
  readonly selectionBoard: BitSet;
  readonly syncBuffer: FrameSyncBuffer;
  readonly frame: FrameSignal;
}

export interface EngineRuntime {
  loop: RenderLoopType | null;
}

export interface AppRef {
  readonly host: AppHostContext;
  readonly state: SimulationState;
  readonly engine: EngineRuntime;
}

export type AppProcessorFunction = ProcessorFunction<LoopParams>;

export type PhasePipeline = {
  [Phases.IO]: AppProcessorFunction[];
  [Phases.Update]: AppProcessorFunction[];
  [Phases.Render]: AppProcessorFunction[];
  [Phases.Cleanup]: AppProcessorFunction[];
};

export interface AppSystemInstance {
  init(): Disposable;
  readonly logic: Partial<PhasePipeline>;
  isBusy(): boolean;
}

/**
 * The slice of the application a system is allowed to reach.
 */
export type SystemContext<
  HostKeys extends keyof AppHostContext = never,
  StateKeys extends keyof SimulationState = never,
> = {
  readonly host: Pick<AppHostContext, HostKeys>;
  readonly state: Pick<SimulationState, StateKeys>;
};

export function createPhasePipeline(): PhasePipeline {
  return {
    [Phases.IO]: [],
    [Phases.Update]: [],
    [Phases.Render]: [],
    [Phases.Cleanup]: [],
  };
}

export function mergePipelines(pipelines: PhasePipeline[]): PhasePipeline {
  const merged = createPhasePipeline();

  for (const pipeline of pipelines) {
    merged[Phases.IO].push(...pipeline[Phases.IO]);
    merged[Phases.Update].push(...pipeline[Phases.Update]);
    merged[Phases.Render].push(...pipeline[Phases.Render]);
    merged[Phases.Cleanup].push(...pipeline[Phases.Cleanup]);
  }

  return merged;
}

export function collectSystemLogic(systems: AppSystemInstance[]): PhasePipeline {
  const collectedLogic = createPhasePipeline();

  for (const system of systems) {
    collectedLogic[Phases.IO].push(...(system.logic[Phases.IO] ?? []));
    collectedLogic[Phases.Update].push(...(system.logic[Phases.Update] ?? []));
    collectedLogic[Phases.Render].push(...(system.logic[Phases.Render] ?? []));
    collectedLogic[Phases.Cleanup].push(...(system.logic[Phases.Cleanup] ?? []));
  }

  return collectedLogic;
}

export function createSyncBuffer(): FrameSyncBuffer {
  return {
    inbound: {
      patches: [],
      windowSnapshots: [],
      stream: {
        expectedChunks: 0,
        chunks: [],
        isDone: false,
      },
    },
  };
}

/**
 * Builds the slide registry and everything sized against it.
 *
 * Split out of `createAppRef` because a resize invalidates all of it — the grid
 * dimensions, the slide count and therefore the meaning of `pageIndex` are all
 * derived from the viewport, so the registry is rebuilt rather than patched.
 */
export function createSlideRegistry(
  document: Document,
  plan: ViewPlan,
): Pick<MotionDomain, "slides" | "visibility" | "recycler"> {
  const slides = createSlides(new SlideFactory(document), plan.computed.slideCount.total);

  return {
    slides,
    visibility: createVisibilityState(slides),
    recycler: createTrackState(),
  };
}

/**
 * Direct initialization for the application container context.
 */
export function createAppRef(root: HTMLElement, transport: Transport): AppRef {
  const document = root.ownerDocument;
  const window = document.defaultView;
  assert(window, "Window object not available for provided root element");

  root.classList.add("_int_root");

  const rect = root.getBoundingClientRect();
  const plan = deriveViewPlan({
    checkboxSize: 24,
    gridSpacing: 8,
    viewportSize: { width: rect.width, height: rect.height },
    loopBufferSizeRatio: 3,
    containerPadding: { vertical: 12, horizontal: 12 },
    slideSpacing: 8,
    slideMaxWidth: 1024,
    slideMaxHeightRatio: 0.25,
    slideMinHeight: 100,
    slidePadding: { vertical: 12, horizontal: 12 },
    minGridDimension: 2,
    maxGridDimension: 128,
    totalItemCount: 65_536 * 16,
  });

  writeVariables(root, plan);

  return {
    host: {
      window,
      document,
      rootElement: root,
      transport,
    },
    state: {
      layout: {
        current: plan,
        viewport: new Viewport(root),
      },
      motion: {
        track: createMotion(),
        ...createSlideRegistry(document, plan),
      },
      selectionBoard: BitSet.fromBitCount(plan.config.totalItemCount),
      syncBuffer: createSyncBuffer(),
      frame: createFrameSignal(),
    },
    engine: {
      loop: null,
    },
  };
}

export function markDirty(frame: FrameSignal, changed: AppDirtyFlags): void {
  frame.flags.set(changed);
  frame.wake();
}

export function isDirty(frame: FrameSignal, mask: AppDirtyFlags): boolean {
  return (frame.flags.getValue() & mask) !== 0;
}

export function isIdle(frame: FrameSignal): boolean {
  return frame.flags.getValue() === AppDirtyFlags.None;
}

export function cleanupFrame(frame: FrameSignal): void {
  frame.flags.reset(AppDirtyFlags.None);
}
