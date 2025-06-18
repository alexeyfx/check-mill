import type { AxisType } from "./axis";

export type TranslateType = {
  to: (target: number) => void;
  clear: () => void;
};

/**
 * Creates a translation controller for a given axis and container element.
 *
 * This abstraction handles performance-optimized DOM transform changes
 * using `translate3d` to move the container element along a specified axis.
 *
 * @param axis - Object representing the axis of movement (horizontal or vertical).
 * @param container - The HTML element to apply the translation to.
 * @returns An object with `to` and `clear` methods for managing element translation.
 */
export function Translate(axis: AxisType, container: HTMLElement): TranslateType {
  /**
   * Cache the previously applied target to avoid redundant DOM updates.
   */
  let previousTarget: number | null = null;

  /**
   * The appropriate translate function based on axis orientation.
   */
  const translate = axis.isVertical ? y : x;

  const containerStyle = container.style;

  /**
   * Returns a horizontal translate3d transform string.
   *
   * @param n - The translation distance in pixels.
   * @returns A CSS transform string for horizontal movement.
   */
  function x(n: number): string {
    return `translate3d(${n}px,0px,0px)`;
  }

  /**
   * Returns a vertical translate3d transform string.
   *
   * @param n - The translation distance in pixels.
   * @returns A CSS transform string for vertical movement.
   */
  function y(n: number): string {
    return `translate3d(0px,${n}px,0px)`;
  }

  /**
   * Applies a new translation if the target has changed from the last known position.
   *
   * @param target - The new translation distance.
   */
  function to(target: number): void {
    const roundedTarget = Math.round(target * 100) / 100;

    if (roundedTarget === previousTarget) {
      return;
    }

    containerStyle.transform = translate(roundedTarget);
    previousTarget = roundedTarget;
  }

  /**
   * Clears the translation style from the container.
   */
  function clear(): void {
    containerStyle.transform = "";

    if (!Boolean(container.getAttribute("style"))) {
      container.removeAttribute("style");
    }
  }

  return {
    to,
    clear,
  };
}
