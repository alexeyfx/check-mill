import { px } from "../core";
import type { ViewPlan } from "./view-plan";

const enum CSSVariables {
  CHECKBOX_SIZE = "--checkbox-size",
  GRID_GAP = "--grid-gap",
  SLIDE_WIDTH = "--slide-width",
  SLIDE_HEIGHT = "--slide-height",
  SLIDE_PADDING = "--slide-padding",
  SLIDE_ORIGIN_X = "--slide-origin-x",
  CONTAINER_GAP = "--container-gap",
  CONTAINER_PADDING = "--container-padding",
}

/**
 * Publishes the plan's geometry as custom properties.
 */
export function writeVariables(root: HTMLElement, layout: ViewPlan): void {
  const { style } = root;

  root.removeAttribute("style");

  style.setProperty(CSSVariables.CHECKBOX_SIZE, px(layout.config.checkboxSize));
  style.setProperty(CSSVariables.GRID_GAP, px(layout.config.gridSpacing));
  style.setProperty(
    CSSVariables.SLIDE_PADDING,
    px([layout.config.slidePadding.vertical, layout.config.slidePadding.horizontal]),
  );
  style.setProperty(CSSVariables.SLIDE_WIDTH, px(layout.computed.slide.width));
  style.setProperty(CSSVariables.SLIDE_HEIGHT, px(layout.computed.slide.height));
  style.setProperty(CSSVariables.SLIDE_ORIGIN_X, px(layout.derived.slideOriginX));
  style.setProperty(CSSVariables.CONTAINER_GAP, px(layout.config.slideSpacing));
  style.setProperty(
    CSSVariables.CONTAINER_PADDING,
    px([layout.config.containerPadding.vertical, layout.config.containerPadding.horizontal]),
  );
}
