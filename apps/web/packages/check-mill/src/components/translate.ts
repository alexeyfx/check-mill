import { type AxisType } from "./axis";

export type TranslateType = {
  to: (element: HTMLElement, target: number) => void;
  clear: (element: HTMLElement) => void;
};

/**
 * Creates a translation controller for a given axis.
 *
 * This abstraction handles performance-optimized DOM transform changes
 * using `translate3d` to move the element along a specified axis.
 *
 * @param axis - Object representing the axis of movement (horizontal or vertical).
 * @returns An object with `to` and `clear` methods for managing element translation.
 */
export function Translate(axis: AxisType): TranslateType {
  /**
   * The appropriate translate function based on axis orientation.
   */
  const translate = axis.isVertical ? y : x;

  /**
   * Returns a horizontal translate3d transform string.
   *
   * @param n - The translation distance in pixels.
   * @returns A CSS transform string for horizontal movement.
   */
  function x(n: number): string {
    return `translate3d(${n}px, 0px, 0px)`;
  }

  /**
   * Returns a vertical translate3d transform string.
   *
   * @param n - The translation distance in pixels.
   * @returns A CSS transform string for vertical movement.
   */
  function y(n: number): string {
    return `translate3d(0px, ${n}px, 0px)`;
  }

  /**
   * Applies a new translation if the target has changed from the last known position.
   *
   * @param target - The new translation distance.
   */
  function to(element: HTMLElement, target: number): void {
    const roundedTarget = Math.round(target * 100) / 100;
    element.style.transform = translate(roundedTarget);
  }

  /**
   * Clears the translation style from the container.
   */
  function clear(element: HTMLElement): void {
    element.style.transform = "";

    if (!Boolean(element.getAttribute("style"))) {
      element.removeAttribute("style");
    }
  }

  return {
    to,
    clear,
  };
}
