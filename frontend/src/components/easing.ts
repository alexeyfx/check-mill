/**
 * A type alias representing an easing function.
 */
export interface Easing {
  (t: number): number;
}

/**
 * Creates a cubic-bezier easing function based on given control points.
 *
 * @param p1x - X coordinate of the first control point (between 0 and 1).
 * @param p1y - Y coordinate of the first control point (can be outside 0-1).
 * @param p2x - X coordinate of the second control point (between 0 and 1).
 * @param p2y - Y coordinate of the second control point (can be outside 0-1).
 * @returns An easing function that maps a time input `t` (0 to 1)
 *          to an eased output using the cubic bezier curve.
 */
export function cubicBezier(p1x: number, p1y: number, p2x: number, p2y: number): Easing {
  // Compute polynomial coefficients for the X axis
  const cx = 3 * p1x;
  const bx = 3 * (p2x - p1x) - cx;
  const ax = 1 - cx - bx;

  // Compute polynomial coefficients for the Y axis
  const cy = 3 * p1y;
  const by = 3 * (p2y - p1y) - cy;
  const ay = 1 - cy - by;

  /**
   * Evaluates the X position of the bezier curve at time t.
   */
  function sampleCurveX(t: number) {
    return ((ax * t + bx) * t + cx) * t;
  }

  /**
   * Evaluates the Y position of the bezier curve at time t.
   */
  function sampleCurveY(t: number) {
    return ((ay * t + by) * t + cy) * t;
  }

  /**
   * Solves the bezier curve for a given x value using the Newton-Raphson method.
   * This gives the corresponding t value, which can then be used to get the Y value.
   */
  function solveCurveX(x: number) {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const x2 = sampleCurveX(t) - x;
      if (Math.abs(x2) < 1e-6) return t;
      t -= x2 / (3 * ax * t * t + 2 * bx * t + cx);
    }
    return t;
  }

  return (x: number) => sampleCurveY(solveCurveX(x));
}
