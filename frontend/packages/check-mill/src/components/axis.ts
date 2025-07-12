export type AxisOptionType = "x" | "y";

export interface AxisType {
  readonly isVertical: boolean;
  readonly scroll: AxisOptionType;
  readonly sign: number;
  direction(n: number): number;
}

export function Axis(axis: AxisOptionType): AxisType {
  /**
   * True if the axis is vertical, false if horizontal.
   */
  const isVertical = axis === "y";

  /**
   * The axis string: "x" or "y", used for scroll property references.
   */
  const scroll = axis;

  /**
   * Direction sign multiplier:
   * - Horizontal scroll (x-axis) is negative: -1
   * - Vertical scroll (y-axis) is positive: 1
   */
  const sign = isVertical ? 1 : -1;

  /**
   * Applies axis-specific direction adjustment to a number.
   */
  function direction(n: number): number {
    return n * sign;
  }

  return { isVertical, scroll, sign, direction };
}
