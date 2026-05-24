/**
 * A unique identifier for a phase, used for ordering.
 */
export type PhaseIdentifier = number;

/**
 * The basic unit of work
 *
 * @template T The type of the shared data object.
 * @template P The type of the optional extra argument.
 */
export type ProcessorFunction<P = unknown> = (params: P) => void;

/**
 * A simple object representing a phase of execution.
 */
export interface Phase<P> {
  readonly phase: PhaseIdentifier;
  readonly functions: ReadonlyArray<ProcessorFunction<P>>;
}

/**
 * Creates a Phase configuration object.
 *
 * @param phase The identifier for this phase.
 * @param functions An array of functions to be executed for this phase.
 * @returns An immutable Phase configuration object.
 */
export function createPhase<P = unknown>(
  phase: PhaseIdentifier,
  functions: ProcessorFunction<P>[],
): Phase<P> {
  return {
    phase,
    functions: Object.freeze([...functions]),
  };
}

/**
 * Chains multiple ProcessorFunctions into a single one.
 *
 * @param funcs The array of functions to chain.
 * @returns A single, combined ProcessorFunction.
 */
export function chainProcessors<P = unknown>(
  funcs: readonly ProcessorFunction<P>[],
): ProcessorFunction<P> {
  return (params: P): void => funcs.forEach((func) => func(params));
}

/**
 * A helper function that wraps a *single* ProcessorFunction with a condition.
 *
 * @param predicate A standard boolean function to check the condition.
 * @param fnToRun The ProcessorFunction to run if the predicate is true.
 * @returns A new ProcessorFunction that includes the conditional logic.
 */
export function runIf<P = unknown>(
  predicate: (params: P) => boolean,
  fnToRun: ProcessorFunction<P>,
): ProcessorFunction<P> {
  return (params: P): void => (predicate(params) ? fnToRun(params) : void 0);
}

/**
 * Creates an executable ProcessorFunction for a *single phase*.
 *
 * This function now just chains all functions in the phase.
 *
 * @param phase The Phase configuration object.
 * @returns A ProcessorFunction that executes the logic for this single phase.
 */
export function createPhaseRunner<P = unknown>(phase: Phase<P>): ProcessorFunction<P> {
  return chainProcessors(phase.functions);
}

/**
 * Creates a master ProcessorFunction from multiple phases.
 *
 * @param phases An array of Phase configuration objects.
 * @returns A single, master ProcessorFunction that runs all phases in order.
 */
export function createMergedRunner<P = unknown>(phases: Phase<P>[]): ProcessorFunction<P> {
  const phaseRunners = [...phases].sort((a, b) => a.phase - b.phase).map(createPhaseRunner);
  return chainProcessors(phaseRunners);
}
