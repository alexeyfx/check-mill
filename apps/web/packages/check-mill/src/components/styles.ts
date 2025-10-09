import { px } from "../core";
import { LayoutProperties } from "./layout";

const enum CSSVariables {
  CHECKBOX_SIZE = "--checkbox-size",
  GRID_GAP = "--grid-gap",
  SLIDE_WIDTH = "--slide-width",
  SLIDE_HEIGHT = "--slide-height",
  SLIDE_PADDING = "--slide-padding",
  CONTAINER_GAP = "--container-gap",
  CONTAINER_PADDING = "--container-padding",
}

export function writeVariables(root: HTMLElement, layout: Readonly<LayoutProperties>): void {
  const { style } = root;

  root.removeAttribute("style");

  style.setProperty(CSSVariables.CHECKBOX_SIZE, px(layout.checkboxSize));
  style.setProperty(CSSVariables.GRID_GAP, px(layout.gridSpacing));
  style.setProperty(
    CSSVariables.SLIDE_PADDING,
    px([layout.slidePadding.vertical, layout.slidePadding.horizontal])
  );
  style.setProperty(CSSVariables.SLIDE_WIDTH, px(layout.slide.width));
  style.setProperty(CSSVariables.SLIDE_HEIGHT, px(layout.slide.height));
  style.setProperty(CSSVariables.CONTAINER_GAP, px(layout.slideSpacing));
  style.setProperty(
    CSSVariables.CONTAINER_PADDING,
    px([layout.containerPadding.vertical, layout.containerPadding.horizontal])
  );
}
