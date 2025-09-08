import { type AppRef, Phases } from "../components";
import { type ProcessorFunction, type TimeParams } from "../core";
import { Disposable } from "../core";

/**
 * Defines the structure of a system's per-frame logic.
 * A system can provide functions for one or more phases.
 */
type SystemLogic<T, P = unknown> = {
  [phase in Phases]?: ProcessorFunction<T, P>[];
};

/**
 * Defines the interface for a complete System.
 * It handles its own setup and teardown.
 */
export type System<T, P = unknown> = (appRef: T) => {
  // One-time setup that returns a teardown function.
  init: () => Disposable;
  // Provides the per-frame processing functions.
  logic: SystemLogic<T, P>;
};

/**
 * A specialized System type for this specific application's state
 */
export type AppSystem = System<AppRef, TimeParams>;
