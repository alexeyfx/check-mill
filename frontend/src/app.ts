import {
  Acceleration,
  Animations,
  Axis,
  Drag,
  Wheel,
  Translate,
  Location,
  Layout,
  LayoutConfigBuilder,
  Presenter,
  ScrollLooper,
} from "./components";
import { measure, query } from "./utils";

export async function main() {
  /** Application root element */
  const root = query(document, "#root", true) as HTMLElement;

  /** Application scroll-body element */
  const container = query(document, ".container", true) as HTMLElement;

  /** Scroll direction component */
  const axis = Axis("y");

  const location = Location(0);

  const acceleration = Acceleration(location, 0, 0.68);

  const translate = Translate(axis, container);

  const layoutBuilder = new LayoutConfigBuilder({
    gridGap: 8,
    checkboxSize: 24,
    slidePadding: [12, 12],
    contentGap: 12,
    viewportRect: root.getBoundingClientRect(),
    slideMinClampedHeight: 300,
    slideMaxHeightPercent: 70,
    slideMaxWidth: 1024,
    ghostSlidesMult: 3,
  });

  const layout = new Layout(layoutBuilder.build());

  const scrollLooper = new ScrollLooper(location, layout.metrics());

  const animations = Animations(
    document,
    window,
    () => acceleration.seek(),
    (alpha) => {
      const hasSettledAndIdle = acceleration.settled() && !drag.interacting();
      if (hasSettledAndIdle) {
        animations.stop();
      }

      const interpolatedLocation =
        location.current.get() * alpha + location.previous.get() * (1 - alpha);

      location.offset.set(interpolatedLocation);
      scrollLooper.loop(acceleration.direction());

      translate.to(location.offset.get());
    }
  );

  const drag = Drag(root, location, animations, axis, acceleration);

  const wheel = Wheel(root, acceleration, animations, axis, location);

  await Promise.all([drag, wheel, animations].map((m) => m.init()));

  const presenter = new Presenter(document, container, layout.metrics());

  presenter.initializePlaceholders();

  measure("populateSlide(1): ", () => presenter.populateSlide(1));
  measure("populateSlide(2): ", () => presenter.populateSlide(2));

  setTimeout(() => {
    measure("populateSlide(0): ", () => presenter.populateSlide(0));
  }, 100);

  console.log("Running...");
}
