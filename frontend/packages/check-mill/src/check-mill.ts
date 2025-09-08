import { type AppProcessorFunction, type AppRef, AppDirtyFlags, Phases, App } from "./components";
import {
  type PhasePredicate,
  type RenderLoopType,
  type TimeParams,
  Processor,
  RenderLoop,
  DisposableStore,
  event,
} from "./core";
import { ScrollSystem, RenderSystem, UpdateSystem } from "./systems";

export type CheckMillType = void;

export function CheckMill(root: HTMLElement, container: HTMLElement): Promise<CheckMillType> {
  const appRef = App(root, container);
  const disposable = DisposableStore();

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

  disposable.pushStatic(...systems.map((system) => system.init()));

  // prettier-ignore
  const readExecutor = Processor
    .merge([ioPhase, updatePhase].map(p => p.runner()))
    .executor()
    .bind(null, appRef);

  // prettier-ignore
  const writeExecutor = Processor
    .merge([renderPhase, cleanUpPhase].map(p => p.runner()))
    .executor()
    .bind(null, appRef);

  // prettier-ignore
  const renderLoop = RenderLoop(
    appRef.owner.window,
    readExecutor,
    writeExecutor,
    60 /* fps */
  );

  renderLoop.start();

  disposable.pushStatic(
    event(
      appRef.owner.document,
      "visibilitychange",
      onVisibilityChange.bind(null, appRef, renderLoop)
    )
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

const onVisibilityChange = (appRef: AppRef, renderLoop: RenderLoopType, _event: Event): void => {
  if (appRef.owner.document.hidden) {
    renderLoop.stop();
  }
};
