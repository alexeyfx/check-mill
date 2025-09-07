import {
  type AppProcessorFunction,
  type AppRef,
  type PhasePredicate,
  type TimeParams,
  AppDirtyFlags,
  Phases,
  App,
  Processor,
  RenderLoop,
} from "./components";
import { GesturesSystem, UpdateSystem } from "./systems";

export type CheckMillType = void;

export function CheckMill(root: HTMLElement, container: HTMLElement): Promise<CheckMillType> {
  const appRef = App(root, container);

  const ioPhase = Processor.phase<AppRef, TimeParams>(Phases.IO).runIf(isInteracted);
  const updatePhase = Processor.phase<AppRef, TimeParams>(Phases.Update);
  const renderPhase = Processor.phase<AppRef, TimeParams>(Phases.Render);
  const cleanUpPhase = Processor.phase<AppRef, TimeParams>(Phases.Cleanup);

  cleanUpPhase.add(resetInteractionState);

  // prettier-ignore
  const systems = [
    UpdateSystem(appRef),
    GesturesSystem(appRef),
  ];

  for (const system of systems) {
    ioPhase.pipe(system.logic[Phases.IO] ?? []);
    updatePhase.pipe(system.logic[Phases.Update] ?? []);
    renderPhase.pipe(system.logic[Phases.Render] ?? []);
    cleanUpPhase.pipe(system.logic[Phases.Cleanup] ?? []);
  }

  const destroyers = systems.map((system) => system.init());

  // prettier-ignore
  const updateExecutor = Processor
    .merge([ioPhase, updatePhase].map(p => p.runner()))
    .executor()
    .bind(null, appRef);

  // prettier-ignore
  const renderExecutor = Processor
    .merge([renderPhase, cleanUpPhase].map(p => p.runner()))
    .executor()
    .bind(null, appRef);

  const renderLoop = RenderLoop(
    appRef.owner.document,
    appRef.owner.window,
    updateExecutor,
    renderExecutor,
    60 /* fps */
  );

  renderLoop.init().then(() => renderLoop.start());
  return Promise.resolve();
}

const isInteracted: PhasePredicate<AppRef> = (appRef: AppRef): boolean => {
  return appRef.dirtyFlags.is(AppDirtyFlags.Interacted);
};

const resetInteractionState: AppProcessorFunction = (appRef: AppRef): AppRef => {
  appRef.dirtyFlags.unset(AppDirtyFlags.Interacted);
  return appRef;
};
