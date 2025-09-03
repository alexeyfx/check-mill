import { px } from "../utils";
import { type LayoutMetrics } from "./layout";

const enum CSSVariables {
  CHECKBOX_SIZE = "--checkbox-size",
  GRID_GAP = "--grid-gap",
  SLIDE_WIDTH = "--slide-width",
  SLIDE_HEIGHT = "--slide-height",
  SLIDE_PADDING = "--slide-padding",
  SLIDE_POINTER_EVENTS = "--slide-pointer-events",
  CONTAINER_GAP = "--container-gap",
  CONTAINER_PADDING = "--container-padding",
}

export function writeVariables(root: HTMLElement, metrics: LayoutMetrics): void {
  const { style } = root;
  const {
    checkboxSize,
    gridGap,
    containerGap,
    containerPadding,
    slidePadding,
    slideHeight,
    slideWidth,
  } = metrics;

  root.removeAttribute("style");

  style.setProperty(CSSVariables.CHECKBOX_SIZE, px(checkboxSize));
  style.setProperty(CSSVariables.GRID_GAP, px(gridGap));
  style.setProperty(CSSVariables.SLIDE_PADDING, px(slidePadding));
  style.setProperty(CSSVariables.SLIDE_WIDTH, px(slideWidth));
  style.setProperty(CSSVariables.SLIDE_HEIGHT, px(slideHeight));
  style.setProperty(CSSVariables.CONTAINER_GAP, px(containerGap));
  style.setProperty(CSSVariables.CONTAINER_PADDING, px(containerPadding));
}

export function disableSlidePointerEvents(root: HTMLElement): void {
  root.style.setProperty(CSSVariables.SLIDE_POINTER_EVENTS, "none");
}

export function enableSlidePointerEvents(root: HTMLElement): void {
  root.style.removeProperty(CSSVariables.SLIDE_POINTER_EVENTS);
}
