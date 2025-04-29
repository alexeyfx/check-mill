import type { LayoutConfig } from "./types";

export function isLayoutConfigsEqual(a: LayoutConfig, b: LayoutConfig): boolean {
  return a.generation === b.generation;
}
