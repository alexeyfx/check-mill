import { type AppProcessorFunction, type AppRef, AppDirtyFlags, Phases, App } from "./components";
import {
  type PhasePredicate,
  type TimeParams,
  DisposableStoreId,
  Processor,
  RenderLoop,
  createDisposableStore,
  event,
} from "./core";
import { ScrollSystem, RenderSystem, UpdateSystem } from "./systems";

export type CheckMillType = void;

export function CheckMill(root: HTMLElement, container: HTMLElement): Promise<CheckMillType> {
  const appRef = App(root, container);
  const disposables = createDisposableStore();

  const ioPhase = Processor.phase<AppRef, TimeParams>(Phases.IO).runIf(isInteracted);
  const updatePhase = Processor.phase<AppRef, TimeParams>(Phases.Update);
  const renderPhase = Processor.phase<AppRef, TimeParams>(Phases.Render);
  const cleanUpPhase = Processor.phase<AppRef, TimeParams>(Phases.Cleanup);

  cleanUpPhase.add(resetInteractionState);

  // prettier-ignore
  const systems = [
    ScrollSystem(appRef),
    UpdateSystem(appRef),
    RenderSystem(appRef),
  ];

  for (const system of systems) {
    ioPhase.pipe(system.logic[Phases.IO] ?? []);
    updatePhase.pipe(system.logic[Phases.Update] ?? []);
    renderPhase.pipe(system.logic[Phases.Render] ?? []);
    cleanUpPhase.pipe(system.logic[Phases.Cleanup] ?? []);
  }

  disposables.push(DisposableStoreId.Static, ...systems.map((system) => system.init()));

  // prettier-ignore
  const readExecutor = Processor
    .merge([ioPhase, updatePhase].map(p => p.runner()))
    .executor();

  // prettier-ignore
  const writeExecutor = Processor
    .merge([renderPhase, cleanUpPhase].map(p => p.runner()))
    .executor();

  // prettier-ignore
  const renderLoop = RenderLoop(
    appRef.owner.window,
    (t) => readExecutor(appRef, t),
    (t) => writeExecutor(appRef, t),
    60 /* fps */
  );

  const onVisibilityChange = (_event: Event): void => {
    if (appRef.owner.document.hidden) {
      renderLoop.stop();
    } else {
      renderLoop.start();
    }
  };

  renderLoop.start();

  disposables.push(
    DisposableStoreId.Static,
    event(appRef.owner.document, "visibilitychange", onVisibilityChange)
  );

  return Promise.resolve();
}

const isInteracted: PhasePredicate<AppRef> = (appRef: AppRef): boolean => {
  return appRef.dirtyFlags.is(AppDirtyFlags.Interacted);
};

const resetInteractionState: AppProcessorFunction = (appRef: AppRef): AppRef => {
  appRef.dirtyFlags.unset(AppDirtyFlags.Interacted);
  return appRef;
};
