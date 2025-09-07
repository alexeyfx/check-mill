import { toArray } from "./array";
import type { OneOrMany } from "./types";

export function px(values: OneOrMany<number>): string {
  return toArray(values).reduce((acc, cur) => acc + ` ${cur}px`, "");
}
