import { Axis, type AxisType } from "./axis";
import { SlideFactory } from "./dom-factories";
import { GestureEvent, GestureType } from "./gestures";
import { Layout, type LayoutMetrics } from "./layout";
import { ScrollMotion, type ScrollMotionType } from "./scroll-motion";
import { Slides, type SlidesCollectionType } from "./slides";
import { Viewport, type ViewportType } from "./viewport";

// prettier-ignore
export const enum AppDirtyFlags {
  None           = 0b00000000,
  GestureRunning = 0b00000001,
  Interacted     = 0b00000010,
}

export const enum Phases {
  IO,
  Update,
  Render,
  Cleanup,
}

export interface AppState {
  axis: AxisType;
  dirtyFlags: number;
  layout: LayoutMetrics;
  motion: ScrollMotionType;
  slides: SlidesCollectionType;
  viewport: ViewportType;
  dragEvents: GestureEvent[];
  wheelEvents: GestureEvent[];
}

export type AppRef = ReturnType<typeof App>;

export function App(root: HTMLElement, container: HTMLElement) {
  /** App's state component */
  let dirtyFlags = AppDirtyFlags.None;

  /** Scroll direction component */
  const axis = Axis("y");

  /** Scroll motion component */
  const motion = ScrollMotion();

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
    ghostSlidesMult: 2,
    totalCells: 1_048_560,
  });

  /** Slides component */
  const slides = Slides(new SlideFactory(document), layout.metrics());

  return {
    host: {
      root,
      container,
    } as const,
    dirtyFlags,
    axis,
    motion,
    layout,
    slides,
    viewport,
    dragEvents: new Array<GestureEvent & { type: GestureType.Drag }>(),
    wheelEvents: new Array<GestureEvent & { type: GestureType.Wheel }>(),
    is: (flag: number) => (dirtyFlags & flag) === flag;
  };
}