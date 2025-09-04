import { Phases } from "../components/app";
import { type ProcessorFunction } from "../components/processor";
import { Disposable } from "../primitives";

/**
 * Defines the structure of a system's per-frame logic.
 * A system can provide functions for one or more phases.
 */
type SystemLogic<T> = {
  [phase in Phases]?: ProcessorFunction<T>[];
};

/**
 * Defines the interface for a complete System.
 * It handles its own setup and teardown.
 */
export type System<T> = (appRef: T) => {
  // One-time setup that returns a teardown function.
  init: () => Disposable;
  // Provides the per-frame processing functions.
  logic: SystemLogic<T>;
};
