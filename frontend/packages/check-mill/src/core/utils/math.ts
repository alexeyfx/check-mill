export function revert(n: number): number {
  return -1 * n;
}

export function isNumber(value: any): value is number {
  return typeof value === "number" && !isNaN(value);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(n, max));
}

export function between(n: number, min: number, max: number): boolean {
  return n >= min && n <= max;
}
