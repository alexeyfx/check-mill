import type {
  BitwiseFlags,
  Disposable,
  ProcessorFunction,
  LoopParams,
  RenderLoopType,
} from "../core";
import { assert, createFlagManager, BitSet } from "../core";
import { SlideFactory } from "./dom-factories";
import type { LayoutContext } from "./layout";
import { LayoutCalculator } from "./layout";
import type { Transport, WindowSnapshot } from "./transport";
import type { MotionType } from "./scroll-motion";
import { createMotion } from "./scroll-motion";
import type { Slide, SlidesCollectionType } from "./slides";
import { createSlides } from "./slides";
import { Viewport } from "./viewport";
import { VisibilityTracker } from "./visibility-tracker";
import { writeVariables } from "./styles";

// prettier-ignore
export const enum AppDirtyFlags {
  None             = 0,
  FrameNeedsRedraw = 1 << 1,
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
  readonly current: LayoutContext;
  readonly viewport: Viewport;
}

export interface MotionDomain {
  readonly track: MotionType;
  readonly slides: SlidesCollectionType;
  readonly visibility: VisibilityTracker<Slide>;
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
    resize: DOMRect | null;
  };

  readonly outbound: {
    cursorPosition: number;
    readonly pendingToggles: number[];
    readonly pendingBatchToggles: number[];
  };
}

export interface SimulationState {
  readonly layout: LayoutDomain;
  readonly motion: MotionDomain;
  readonly selectionBoard: BitSet;
  readonly syncBuffer: FrameSyncBuffer;
  dirtyFlags: BitwiseFlags;
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
}

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
      resize: null,
    },
    outbound: {
      cursorPosition: -1,
      pendingToggles: [],
      pendingBatchToggles: [],
    },
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
  const layoutCalculator = new LayoutCalculator();

  const layoutContext = layoutCalculator.create({
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
    totalItemCount: 65_535 * 16,
  });

  writeVariables(root, layoutContext);

  const slidesCollection = createSlides(
    new SlideFactory(document),
    layoutContext.computed.slideCount.total,
  );

  return {
    host: {
      window,
      document,
      rootElement: root,
      transport,
    },
    state: {
      layout: {
        current: layoutContext,
        viewport: new Viewport(root),
      },
      motion: {
        track: createMotion(),
        slides: slidesCollection,
        visibility: new VisibilityTracker(slidesCollection),
      },
      selectionBoard: BitSet.fromBitCount(1_048_576),
      syncBuffer: createSyncBuffer(),
      dirtyFlags: createFlagManager(AppDirtyFlags.None),
    },
    engine: {
      loop: null,
    },
  };
}

export function markForCheck(flags: BitwiseFlags): void {
  flags.set(AppDirtyFlags.FrameNeedsRedraw);
}

export function needsCheck(flags: BitwiseFlags): boolean {
  return flags.is(AppDirtyFlags.FrameNeedsRedraw);
}

export function cleanupFrame(flags: BitwiseFlags): void {
  flags.unset(AppDirtyFlags.FrameNeedsRedraw);
}
