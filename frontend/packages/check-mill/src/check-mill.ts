import {
  type AppProcessorFunction,
  type AppRef,
  type ViewportType,
  AppDirtyFlags,
  Phases,
  App,
  Viewport,
} from "./components";
import {
  type PhasePredicate,
  type RenderLoopType,
  type TimeParams,
  DisposableStoreId,
  Processor,
  RenderLoop,
  createDisposableStore,
  event,
} from "./core";
import { NetworkSystem, RenderSystem, ScrollSystem, UpdateSystem } from "./systems";

export type CheckMillType = void;

export function CheckMill(root: HTMLElement, container: HTMLElement): Promise<CheckMillType> {
  const _application = new Application(root, container);
  return Promise.resolve();
}

/**
 * Manages the entire lifecycle of the application, including initial setup,
 * per-frame execution, and dynamic reconfiguration on resize.
 */
class Application {
  private appRef: AppRef;
  private disposables = createDisposableStore();
  private renderLoop: RenderLoopType;
  private viewport: ViewportType;

  private readExecutor: AppProcessorFunction | null = null;
  private writeExecutor: AppProcessorFunction | null = null;

  constructor(root: HTMLElement, container: HTMLElement) {
    this.appRef = App(root, container);
    this.viewport = Viewport(root);
    this.viewport.init();

    this.setupStaticListeners();
    this.reconfigure();

    this.renderLoop = RenderLoop(
      this.appRef.owner.window,
      (t) => this.readExecutor!(this.appRef, t),
      (t) => this.writeExecutor!(this.appRef, t),
      60 /* fps */
    );
  }

  /**
   * Public method to tear down the entire application.
   */
  public destroy(): void {
    this.renderLoop.stop();
    this.disposables.flushAll();
  }

  /**
   * Tears down and rebuilds all layout-dependent systems and the processor pipeline.
   */
  private reconfigure(): void {
    this.disposables.flush(DisposableStoreId.Reconfigurable);

    const ioPhase = Processor.phase<AppRef, TimeParams>(Phases.IO).runIf(isInteracted);
    const updatePhase = Processor.phase<AppRef, TimeParams>(Phases.Update);
    const renderPhase = Processor.phase<AppRef, TimeParams>(Phases.Render);
    const cleanUpPhase = Processor.phase<AppRef, TimeParams>(Phases.Cleanup);

    cleanUpPhase.add(resetInteractionState);

    // prettier-ignore
    const systems = [
      NetworkSystem(this.appRef),
      ScrollSystem(this.appRef),
      UpdateSystem(this.appRef),
      RenderSystem(this.appRef),
    ];

    for (const system of systems) {
      ioPhase.pipe(system.logic[Phases.IO] ?? []);
      updatePhase.pipe(system.logic[Phases.Update] ?? []);
      renderPhase.pipe(system.logic[Phases.Render] ?? []);
      cleanUpPhase.pipe(system.logic[Phases.Cleanup] ?? []);

      this.disposables.push(DisposableStoreId.Reconfigurable, system.init());
    }

    // prettier-ignore
    this.readExecutor = Processor
      .merge([ioPhase, updatePhase].map(p => p.runner()))
      .executor();

    // prettier-ignore
    this.writeExecutor = Processor
      .merge([renderPhase, cleanUpPhase].map(p => p.runner()))
      .executor();
  }

  /**
   * Sets up long-lived event listeners like ResizeObserver.
   */
  private setupStaticListeners(): void {
    const onVisibilityChange = (_event: Event): void => {
      if (this.appRef.owner.document.hidden) {
        this.renderLoop.stop();
      } else {
        this.renderLoop.start();
      }
    };

    this.viewport.resized.register(() => this.reconfigure());

    this.disposables.push(
      DisposableStoreId.Static,
      this.viewport.destroy,
      event(this.appRef.owner.document, "visibilitychange", onVisibilityChange)
    );
  }
}

const isInteracted: PhasePredicate<AppRef> = (appRef: AppRef): boolean => {
  return appRef.dirtyFlags.is(AppDirtyFlags.Interacted);
};

const resetInteractionState: AppProcessorFunction = (appRef: AppRef): AppRef => {
  appRef.dirtyFlags.unset(AppDirtyFlags.Interacted);
  return appRef;
};
