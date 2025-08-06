import type { GestureEvent } from "./components";
import {
  AppStates,
  Axis,
  Drag,
  Wheel,
  Translate,
  Layout,
  ScrollLooper,
  SlidesLooper,
  Viewport,
  ScrollMotion,
  RenderLoop,
  Slides,
  GestureState,
  SlidesInView,
  SlideFactory,
  SlidesRenderer,
} from "./components";
import { Styles } from "./components/styles";
import { EventReader, EventWriter, State } from "./primitives";
import { throttle } from "./utils";

export interface CheckMeMillionTimesType {
  events: Record<string, EventReader<unknown>>;
  commands: Record<string, EventWriter<unknown>>;
}

export async function CheckMeMillionTimes(
  root: HTMLElement,
  container: HTMLElement
): Promise<CheckMeMillionTimesType> {
  /** Scroll direction component */
  const axis = Axis("y");

  /** Scroll motion component */
  const motion = ScrollMotion();

  /** Translate component */
  const translate = Translate(axis);

  /** Viewport component */
  const viewport = Viewport(root);

  /** Layout component */
  const layout = new Layout({
    gridGap: 8,
    checkboxSize: 24,
    slidePadding: [12, 12],
    containerGap: 12,
    containerPadding: [12, 12],
    viewportRect: viewport.measure(),
    slideMinClampedHeight: 300,
    slideMaxHeightPercent: 70,
    slideMaxWidth: 1024,
    ghostSlidesMult: 3,
    totalCells: 1_048_560,
  });

  /** App's state component */
  const appState = new State();

  /** Slides component */
  const slides = Slides(new SlideFactory(document), layout.metrics());

  /** Drag gesture */
  const drag = Drag(root, axis);

  /** Wheel gesture */
  const wheel = Wheel(root, axis);

  const slidesInView = SlidesInView(root, slides);

  const slidesLooper = SlidesLooper(viewport, layout.metrics(), motion, slides);

  const scrollLooper = ScrollLooper(motion, layout.metrics());

  const renderLoop = RenderLoop(document, window, update, render);

  const styles = Styles(root, layout.metrics());

  const renderer = SlidesRenderer(document, container, axis, layout.metrics());

  const syncSlidesVisibilityThrottled = throttle(syncSlideVisibility, 300);

  await Promise.resolve().then(init).then(afterInit);

  async function init(): Promise<void> {
    const components = [slidesInView, viewport, styles, drag, wheel];
    await Promise.all(components.map((m) => m.init()));
  }

  async function afterInit(): Promise<void> {
    renderer.appendSlides(slides);

    drag.register(handleDragScroll);
    wheel.register(handleWheelScroll);

    renderLoop.start();

    console.log("Running...");
  }

  function update(_t: number, dt: number): void {
    const integrated = applyFriction(motion.velocity, 0.75, dt);
    const displacement = motion.current + integrated - motion.previous;

    motion.velocity = integrated;
    motion.previous = motion.current;
    motion.current += integrated;
    motion.direction = Math.sign(displacement);
  }

  function render(alpha: number): void {
    const isSettled = Math.abs(motion.velocity) < 0.1;
    const interpolated = motion.current * alpha + motion.previous * (1.0 - alpha);

    if (isSettled || appState.is(AppStates.GestureRunning)) {
      renderLoop.stop();
    }

    motion.offset = interpolated;

    scrollLooper.loop();
    slidesLooper.loop() && renderer.syncOffset(slides);

    syncSlidesVisibilityThrottled();

    translate.to(container, motion.offset);
  }

  function applyFriction(velocity: number, friction: number, dt: number): number {
    const decay = 1 - Math.pow(1 - friction, dt / 1000);
    const next = velocity * (1 - decay);

    return next;
  }

  function handleWheelScroll(event: GestureEvent): void {
    motion.previous = motion.current;
    motion.current += event.delta;
    motion.velocity = 0;

    renderLoop.start();
  }

  function handleDragScroll(event: GestureEvent): void {
    const { state, delta } = event;

    switch (state) {
      case GestureState.Initialize:
        motion.velocity = 0;
        appState.set(AppStates.GestureRunning);
        break;

      case GestureState.Update:
        motion.current += delta;
        break;

      case GestureState.Finalize:
        motion.velocity = delta;
        appState.unset(AppStates.GestureRunning);
        break;
    }

    renderLoop.start();
  }

  function syncSlideVisibility(): void {
    let index = 0;

    for (const record of slidesInView.takeRecords()) {
      switch (record) {
        case -1:
          renderer.fadeOut(slides[index]);
          break;
        case 1:
          renderer.fadeIn(slides[index]);
      }

      index += 1;
    }
  }

  return {
    events: {},
    commands: {},
  };
}
