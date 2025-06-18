import {
  Axis,
  Drag,
  Wheel,
  Translate,
  Location,
  Layout,
  LayoutConfigBuilder,
  Presenter,
  ScrollLooper,
  SlidesLooper,
  Viewport,
  ScrollMotion,
  RenderLoop,
} from "./components";
import { query } from "./utils";

export async function main() {
  /** Application root element */
  const root = query(document, "#root", true) as HTMLElement;

  /** Application scroll-body element */
  const container = query(document, ".container", true) as HTMLElement;

  /** Scroll direction component */
  const axis = Axis("y");

  /** Scroll motion component */
  const motion = ScrollMotion();

  const translate = Translate(axis, container);

  const layoutBuilder = new LayoutConfigBuilder({
    gridGap: 8,
    checkboxSize: 24,
    slidePadding: [12, 12],
    containerGap: 12,
    containerPadding: [12, 12],
    viewportRect: root.getBoundingClientRect(),
    slideMinClampedHeight: 300,
    slideMaxHeightPercent: 70,
    slideMaxWidth: 1024,
    ghostSlidesMult: 3,
  });

  const viewport = Viewport(root);

  const layout = new Layout(layoutBuilder.build());

  const scrollLooper = ScrollLooper(motion, layout.metrics());

  const renderLoop = RenderLoop(document, window, update, render);

  const drag = Drag(root, axis, motion, renderLoop);

  const wheel = Wheel(root, axis, motion, renderLoop);

  const presenter = new Presenter(document, container, layout.metrics());
  presenter.initializePlaceholders();

  const slidesLooper = SlidesLooper(axis, viewport, layout.metrics(), motion, presenter.slides());

  await Promise.all([drag, wheel].map((m) => m.init()));

  presenter.populateSlide(2);

  console.log("Running...");

  function update(_t: number, dt: number): void {
    const { velocity, previous, current, direction } = motion;
    const integrated = applyFriction(velocity.get(), 0.75, dt);
    const displacement = current.get() + integrated - previous.get();

    velocity.set(integrated);
    previous.set(current);
    current.add(integrated);
    direction.set(Math.sign(displacement));

    return;
  }

  function render(alpha: number): void {
    const { current, previous, velocity, offset } = motion;
    const isSettled = Math.abs(velocity.get()) < 0.01;
    const interpolated = current.get() * alpha + previous.get() * (1.0 - alpha);

    if (isSettled || drag.interacting()) {
      renderLoop.stop();
    }

    offset.set(interpolated);
    scrollLooper.loop();
    slidesLooper.loop();
    translate.to(interpolated);
  }

  function applyFriction(velocity: number, friction: number, dt: number): number {
    const decay = 1 - Math.pow(1 - friction, dt / 1000);
    const next = velocity * (1 - decay);
    return next;
  }
}
