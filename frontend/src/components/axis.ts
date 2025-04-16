export type AxisOptionType = "x" | "y";

export interface AxisType {
  isVertical: boolean;
  sign: number;
  direction(n: number): number;
}

export function Axis(axis: AxisOptionType): AxisType {
  const isVertical = axis === "y";

  const sign = !isVertical ? -1 : 1;

  function direction(n: number): number {
    return n * sign;
  }

  return { isVertical, sign, direction };
}
