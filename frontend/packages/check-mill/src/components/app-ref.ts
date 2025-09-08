import {
  type BitwiseFlags,
  type ProcessorFunction,
  type TimeParams,
  createFlagManager,
} from "../core";
import { assert } from "../core";
import { type AxisType, Axis } from "./axis";
import { SlideFactory } from "./dom-factories";
import { type GestureEvent } from "./gestures";
import { Layout } from "./layout";
import { type ScrollMotionType, ScrollMotion } from "./scroll-motion";
import { type SlidesCollectionType, Slides } from "./slides";
import { type ViewportType, Viewport } from "./viewport";

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

export interface AppRef {
  owner: {
    window: Window;
    document: Document;
    root: HTMLElement;
    container: HTMLElement;
  };
  axis: AxisType;
  dirtyFlags: BitwiseFlags;
  layout: Layout;
  motion: ScrollMotionType;
  slides: SlidesCollectionType;
  viewport: ViewportType;
  dragEvents: GestureEvent[];
  wheelEvents: GestureEvent[];
}

export type AppProcessorFunction = ProcessorFunction<AppRef, TimeParams>;

export function App(root: HTMLElement, container: HTMLElement): AppRef {
  const document = root.ownerDocument;
  const window = document.defaultView;
  assert(window, "Window object not available for provided root element");

  const axis = Axis("y");
  const motion = ScrollMotion();
  const viewport = Viewport(root);
  const dirtyFlags = createFlagManager(AppDirtyFlags.None);
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
  const slides = Slides(new SlideFactory(document), layout.metrics());

  return {
    owner: {
      window,
      document,
      root,
      container,
    },
    dirtyFlags,
    axis,
    motion,
    layout,
    slides,
    viewport,
    dragEvents: new Array<GestureEvent>(),
    wheelEvents: new Array<GestureEvent>(),
  };
}
