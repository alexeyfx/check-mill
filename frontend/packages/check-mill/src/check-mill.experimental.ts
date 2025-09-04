import { type AppRef, App, RenderLoop, AppDirtyFlags, Phases, Processor } from "./components";
import { type EventReader, type EventWriter } from "./primitives";
import { GesturesSystem, RenderSystem, UpdateSystem } from "./systems";

export interface CheckMeMillionTimesType {
  events: Record<string, EventReader<unknown>>;
  commands: Record<string, EventWriter<unknown>>;
}

export function CheckMill(root: HTMLElement, container: HTMLElement): void {
  const appRef = App(root, container);

  const ioPhase = Processor.phase<AppRef>(Phases.IO).runIf(({ is }) =>
    is(AppDirtyFlags.Interacted)
  );

  const updatePhase = Processor.phase<AppRef>(Phases.Update);
  const renderPhase = Processor.phase<AppRef>(Phases.Render);
  const cleanUpPhase = Processor.phase<AppRef>(Phases.Cleanup);

  const systems = [GesturesSystem(appRef), UpdateSystem(appRef), RenderSystem(appRef)];

  for (const system of systems) {
    ioPhase.pipe(system.logic[Phases.IO] ?? []);
    updatePhase.pipe(system.logic[Phases.Update] ?? []);
    renderPhase.pipe(system.logic[Phases.Render] ?? []);
    cleanUpPhase.pipe(system.logic[Phases.Cleanup] ?? []);
  }

  const updateExecutor = Processor.merge([ioPhase.runner(), updatePhase.runner()])
    .executor()
    .bind({}, appRef);

  const renderExecutor = Processor.merge([renderPhase.runner()]).executor().bind({}, appRef);

  const renderLoop = RenderLoop(document, window, updateExecutor, renderExecutor, 60 /* fps */);
  renderLoop.start();
}
