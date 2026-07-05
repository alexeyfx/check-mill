import type { AppRef, AppSystemInstance, FrameSyncBuffer, Transport } from "./components";
import { Phases, createAppRef, collectSystemLogic, createTransport } from "./components";
import {
  DisposableStore,
  RenderLoop,
  event,
  createPhase,
  createMergedRunner,
  debounce,
  base64ToUint8Array,
  type Disposable,
  assert,
} from "./core";
import { RenderSystem, ScrollSystem, SyncSystem, ToggleSystem, UpdateSystem } from "./systems";

export interface CheckMillConfig {
  /**
   * The root HTML element for viewport calculations
   */
  readonly root: HTMLElement;

  /**
   * The backend socket target endpoint. Required if using the default transport implementation.
   */
  readonly endpointUrl?: string;

  /**
   * Optional custom transport override.
   * If omitted, a standard Phoenix gateway transport instance will be built using endpointUrl.
   */
  readonly transport?: Transport;
}

export interface CheckMillType {
  destroy: Disposable;
}

export function CheckMill(config: CheckMillConfig): Promise<CheckMillType> {
  const { root, endpointUrl, transport: customTransport } = config;
  const disposables = new DisposableStore();

  let resolvedTransport: Transport;

  if (customTransport) {
    resolvedTransport = customTransport;
  } else {
    assert(
      endpointUrl,
      "[CheckMill] Initialization failed: Either 'transport' or 'endpointUrl' must be provided.",
    );
    resolvedTransport = createTransport(endpointUrl);
  }

  const appRef = createAppRef(root, resolvedTransport);

  disposables.push(
    appRef.host.transport.init(),
    bindTransportToSyncBuffer(appRef.host.transport, appRef.state.syncBuffer),
  );

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

  setupStaticListeners(appRef, disposables);

  appRef.engine.loop = RenderLoop(appRef.host.window, readPass, writePass, 60 /* fps */);
  appRef.engine.loop.start();

  const destroy = (): void => {
    appRef.engine.loop?.stop();
    disposables.flushAll();
  };

  return Promise.resolve({ destroy });
}

function setupStaticListeners(appRef: AppRef, disposables: DisposableStore): void {
  const queueResizeUpdate = (rect: DOMRect) => {
    appRef.state.syncBuffer.inbound.resize = rect;
  };

  const onVisibilityChange = (): void => {
    if (appRef.host.document.hidden) {
      appRef.engine.loop?.stop();
    } else {
      appRef.engine.loop?.start();
    }
  };

  disposables.push(
    appRef.state.layout.viewport.init(),
    appRef.state.layout.viewport.resized.register(debounce(queueResizeUpdate, 150)),
    event(appRef.host.document, "visibilitychange", onVisibilityChange),
  );
}

function bindTransportToSyncBuffer(transport: Transport, syncBuffer: FrameSyncBuffer): Disposable {
  const { inbound } = syncBuffer;
  const disposables = new DisposableStore();

  const bindings = [
    transport.patchBatch.register(({ patches }) => {
      inbound.patches.push(...patches);
    }),

    transport.windowSnapshot.register((snapshot) => {
      inbound.windowSnapshots.push(snapshot);
    }),

    transport.snapshotBegin.register(({ chunks }) => {
      inbound.stream.expectedChunks = chunks;
      inbound.stream.chunks.length = 0;
      inbound.stream.isDone = false;
    }),

    transport.snapshotChunk.register(({ b64 }) => {
      inbound.stream.chunks.push(base64ToUint8Array(b64));
    }),

    transport.snapshotDone.register(() => {
      inbound.stream.isDone = true;
    }),
  ];

  disposables.push(...bindings);
  return () => disposables.flushAll();
}
