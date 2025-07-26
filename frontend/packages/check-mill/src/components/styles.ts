import { px } from "../utils";
import type { Component } from "./component";
import { LayoutMetrics } from "./layout";

const enum CSSVariables {
  CHECKBOX_SIZE = "--checkbox-size",
  GRID_GAP = "--grid-gap",
  SLIDE_WIDTH = "--slide-width",
  SLIDE_HEIGHT = "--slide-height",
  SLIDE_PADDING = "--slide-padding",
  CONTAINER_GAP = "--container-gap",
  CONTAINER_PADDING = "--container-padding",
}

export interface StylesType extends Component {}

export function Styles(root: HTMLElement, metrics: LayoutMetrics): StylesType {
  /**
   * @internal
   * Component lifecycle method.
   */
  function init(): Promise<void> {
    writeVariables();
    return Promise.resolve();
  }

  /**
   * @internal
   * Component lifecycle method.
   */
  function destroy(): Promise<void> {
    return Promise.resolve();
  }

  function writeVariables(): void {
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

  return { init, destroy };
}
