import type { AppRef, AppSystemInstance, SimulationState, Transport } from "./components";
import {
  adoptViewPlan,
  AppDirtyFlags,
  collectSystemLogic,
  createAppRef,
  createTransport,
  isIdle,
  markDirty,
  patchViewPlan,
  Phases,
  planRequiresRebuild,
  rebuildForViewPlan,
  sameViewport,
} from "./components";
import {
  assert,
  base64ToUint8Array,
  createMergedRunner,
  createPhase,
  debounce,
  DisposableStore,
  event,
  noop,
  RenderLoop,
  type Disposable,
  type RenderLoopType,
} from "./core";
import { RenderSystem, ScrollSystem, SyncSystem, ToggleSystem, UpdateSystem } from "./systems";

/** Simulation steps per second. */
const TARGET_FPS = 60;

/** Quiet period before a viewport resize is acted on. */
const RESIZE_DEBOUNCE_MS = 150;

export interface CheckMillConfig {
  /** The root HTML element for viewport calculations. */
  readonly root: HTMLElement;

  /** The backend socket target endpoint. Required if using the default transport implementation. */
  readonly endpointUrl?: string;

  /**
   * Optional custom transport override.
   * If omitted, a standard Phoenix gateway transport instance will be built using endpointUrl.
   */
  readonly transport?: Transport;
}

export interface CheckMillType {
  /** Tears down the loop, the systems, the socket and every listener. Idempotent. */
  readonly destroy: Disposable;
}

export function CheckMill(config: CheckMillConfig): Promise<CheckMillType> {
  const disposables = new DisposableStore();
  const appRef = createAppRef(config.root, resolveTransport(config));

  disposables.push(
    appRef.host.transport.init(),
    bindTransportToSyncBuffer(appRef.host.transport, appRef.state),
  );

  let runtime = startRuntime(appRef);
  let destroyed = false;

  const applyResize = (rect: DOMRect): void => {
    if (destroyed) return;
    if (rect.width === 0 || rect.height === 0) return;

    const previous = appRef.state.layout.current;
    if (sameViewport(previous, rect.width, rect.height)) return;

    const next = patchViewPlan(previous, {
      viewportSize: { width: rect.width, height: rect.height },
    });

    if (!planRequiresRebuild(previous, next)) {
      adoptViewPlan(appRef, next);
      return;
    }

    runtime();
    rebuildForViewPlan(appRef, next);
    runtime = startRuntime(appRef);
  };

  disposables.push(
    bindVisibilityToLoop(appRef),
    appRef.state.layout.viewport.init(),
    appRef.state.layout.viewport.resized.register(debounce(applyResize, RESIZE_DEBOUNCE_MS)),
  );

  const destroy = (): void => {
    destroyed = true;
    runtime();
    disposables.flushAll();
  };

  return Promise.resolve({ destroy });
}

function resolveTransport({ transport, endpointUrl }: CheckMillConfig): Transport {
  if (transport) return transport;

  assert(
    endpointUrl,
    "[CheckMill] Initialization failed: Either 'transport' or 'endpointUrl' must be provided.",
  );

  return createTransport(endpointUrl);
}

/**
 * Brings up the systems and the render loop over the current slide registry.
 *
 * Everything here is rebuilt on resize, so nothing outside this function may
 * hold onto a system, the pipeline or the loop.
 */
function startRuntime(appRef: AppRef): Disposable {
  const disposables = new DisposableStore();

  let loop: RenderLoopType | null = null;

  disposables.push(() => {
    loop?.stop();
    appRef.engine.loop = null;
    appRef.state.frame.wake = noop;
  });

  const systems: AppSystemInstance[] = [
    ToggleSystem(appRef),
    ScrollSystem(appRef),
    SyncSystem(appRef),
    UpdateSystem(appRef),
    RenderSystem(appRef),
  ];

  for (const system of systems) {
    disposables.push(system.init());
  }

  const pipeline = collectSystemLogic(systems);

  const readPass = createMergedRunner([
    createPhase(Phases.IO, pipeline[Phases.IO]),
    createPhase(Phases.Update, pipeline[Phases.Update]),
  ]);

  const writePass = createMergedRunner([
    createPhase(Phases.Render, pipeline[Phases.Render]),
    createPhase(Phases.Cleanup, pipeline[Phases.Cleanup]),
  ]);

  const nothingLeftToDo = (): boolean =>
    isIdle(appRef.state.frame) && !systems.some((system) => system.isBusy());

  loop = RenderLoop(appRef.host.window, readPass, writePass, TARGET_FPS, nothingLeftToDo);

  appRef.engine.loop = loop;
  appRef.state.frame.wake = loop.start;

  markDirty(
    appRef.state.frame,
    AppDirtyFlags.Motion | AppDirtyFlags.Board | AppDirtyFlags.Layout | AppDirtyFlags.Hydration,
  );

  loop.start();

  return () => disposables.flushAll();
}

/**
 * Parks the loop while the tab is in the background, and asks for a frame on
 * the way back.
 */
function bindVisibilityToLoop(appRef: AppRef): Disposable {
  return event(appRef.host.document, "visibilitychange", () => {
    if (appRef.host.document.hidden) {
      appRef.engine.loop?.stop();
      return;
    }

    markDirty(appRef.state.frame, AppDirtyFlags.Board | AppDirtyFlags.Hydration);
  });
}

/**
 * Funnels inbound server messages into the sync buffer.
 */
function bindTransportToSyncBuffer(
  transport: Transport,
  state: Pick<SimulationState, "syncBuffer" | "frame">,
): Disposable {
  const { inbound } = state.syncBuffer;
  const disposables = new DisposableStore();

  const wake = (): void => state.frame.wake();

  disposables.push(
    transport.patchBatch.register(({ patches }) => {
      inbound.patches.push(...patches);
      wake();
    }),

    transport.windowSnapshot.register((snapshot) => {
      inbound.windowSnapshots.push(snapshot);
      wake();
    }),

    transport.snapshotBegin.register(({ chunks }) => {
      inbound.stream.expectedChunks = chunks;
      inbound.stream.chunks.length = 0;
      inbound.stream.isDone = false;
      wake();
    }),

    transport.snapshotChunk.register(({ b64 }) => {
      inbound.stream.chunks.push(base64ToUint8Array(b64));
      wake();
    }),

    transport.snapshotDone.register(() => {
      inbound.stream.isDone = true;
      wake();
    }),
  );

  return () => disposables.flushAll();
}
