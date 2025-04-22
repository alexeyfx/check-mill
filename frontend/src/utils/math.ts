export function revert(n: number): number {
  return -1 * n;
}

export function isNumber(value: any): value is number {
  return typeof value === "number" && !isNaN(value);
}
