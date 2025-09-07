/**
 * The basic unit of work: a function that receives a data object and returns it.
 * @template T The type of the shared data object.
 * @template P The type of the optional extra argument.
 */
export type ProcessorFunction<T, P = unknown> = (data: T, params: P) => T;

/**
 * A unique identifier for a phase, used for ordering.
 * Enums with numeric values are ideal for this.
 */
export type PhaseIdentifier = number;

/**
 * A function that receives the game state and returns true if a phase should run.
 * @template T The type of the shared data object.
 */
export type PhasePredicate<T, P = unknown> = (data: T, params: P) => boolean;

/**
 * A PhaseRunner represents a single, configured phase with its functions.
 * It's an immutable object created by a PhaseBuilder.
 * @template T The type of the shared data object.
 */
export class PhaseRunner<T, P = unknown> {
  public readonly phase: PhaseIdentifier;

  private readonly predicate: PhasePredicate<T, P>;

  private readonly functions: ReadonlyArray<ProcessorFunction<T, P>>;

  constructor(
    phase: PhaseIdentifier,
    functions: ProcessorFunction<T, P>[],
    predicate: PhasePredicate<T, P> | null
  ) {
    this.phase = phase;
    this.functions = Object.freeze([...functions]);
    this.predicate = predicate ?? ((_data: T) => true);
  }

  /**
   * Generates and returns the executor function for this specific phase.
   * The executor will run all of this phase's functions in sequence.
   * @returns A ProcessorFunction that encapsulates the logic for this phase.
   */
  public executor(): ProcessorFunction<T, P> {
    const phaseExecutor = (initialData: T, params: P): T =>
      this.functions.reduce((currentData, fn) => fn(currentData, params), initialData);

    const conditionalExecutor = (initialData: T, params: P): T =>
      this.predicate(initialData, params) ? phaseExecutor(initialData, params) : initialData;

    return conditionalExecutor;
  }
}

/**
 * A MergedRunner represents a collection of PhaseRunners, ordered for execution.
 * @template T The type of the shared data object.
 */
export class MergedRunner<T, P> {
  private readonly runners: ReadonlyArray<PhaseRunner<T, P>>;

  constructor(runners: PhaseRunner<T, P>[]) {
    const sortedRunners = [...runners].sort((a, b) => a.phase - b.phase);
    this.runners = Object.freeze(sortedRunners);
  }

  /**
   * Generates and returns a single executor function that runs all merged phases in order.
   * @returns A ProcessorFunction that encapsulates the logic for all merged phases.
   */
  public executor(): ProcessorFunction<T, P> {
    const executors = this.runners.map((runner) => runner.executor());
    return (initialData: T, params: P): T =>
      executors.reduce(
        (currentData, phaseExecutor) => phaseExecutor(currentData, params),
        initialData
      );
  }
}

/**
 * The PhaseBuilder is a temporary object used to configure a single phase.
 * It uses a fluent (chainable) interface.
 * @template T The type of the shared data object.
 */
export class PhaseBuilder<T, P = unknown> {
  private readonly phase: PhaseIdentifier;
  private functions: ProcessorFunction<T, P>[] = [];
  private predicate: PhasePredicate<T, P> | null = null;

  constructor(phase: PhaseIdentifier) {
    this.phase = phase;
  }

  /**
   * Sets a condition for the entire phase to run. If the predicate function
   * returns false, none of the functions in this phase will be executed.
   * @param predicate A function that returns true if the phase should run.
   */
  public runIf(predicate: PhasePredicate<T, P>): this {
    this.predicate = predicate;
    return this;
  }

  /**
   * Adds a single function to the phase's pipeline.
   */
  public add(fn: ProcessorFunction<T, P>): this {
    this.functions.push(fn);
    return this;
  }

  /**
   * Adds an array of functions to the phase's pipeline.
   */
  public pipe(fns: ProcessorFunction<T, P>[]): this {
    this.functions.push(...fns);
    return this;
  }

  /**
   * Finalizes the configuration and returns an immutable PhaseRunner.
   */
  public runner(): PhaseRunner<T, P> {
    return new PhaseRunner<T, P>(this.phase, this.functions, this.predicate);
  }
}

/**
 * The main static Processor class.
 * Acts as the entry point (factory) for creating builders and merging runners.
 * It holds no state itself.
 */
export class Processor {
  /**
   * Starts the configuration for a new phase.
   * @param phase The identifier for this phase.
   * @returns A chainable PhaseBuilder instance.
   */
  public static phase<T, P>(phase: PhaseIdentifier): PhaseBuilder<T, P> {
    return new PhaseBuilder<T, P>(phase);
  }

  /**
   * Merges multiple PhaseRunners into a single, ordered MergedRunner.
   * @param runners An array of PhaseRunners to combine.
   * @returns A MergedRunner that can create a single executor for all phases.
   */
  public static merge<T, P>(runners: PhaseRunner<T, P>[]): MergedRunner<T, P> {
    return new MergedRunner<T, P>(runners);
  }
}

export function runIf<T, P = unknown>(
  predicate: (data: T, params: P) => boolean,
  fnToRun: ProcessorFunction<T, P>
): ProcessorFunction<T, P> {
  return (data: T, params: P) => (predicate(data, params) ? fnToRun(data, params) : data);
}
