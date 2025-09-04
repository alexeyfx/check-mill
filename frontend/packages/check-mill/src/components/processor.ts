/**
 * The basic unit of work: a function that receives a data object and returns it.
 * @template T The type of the shared data object.
 */
export type ProcessorFunction<T> = (data: T) => T;

/**
 * A unique identifier for a phase, used for ordering.
 * Enums with numeric values are ideal for this.
 */
type PhaseIdentifier = number;

/**
 * A function that receives the game state and returns true if a phase should run.
 * @template T The type of the shared data object.
 */
type PhasePredicate<T> = (data: T) => boolean;

/**
 * A PhaseRunner represents a single, configured phase with its functions.
 * It's an immutable object created by a PhaseBuilder.
 * @template T The type of the shared data object.
 */
class PhaseRunner<T> {
  public readonly phase: PhaseIdentifier;

  private readonly predicate: PhasePredicate<T>;

  private readonly functions: ReadonlyArray<ProcessorFunction<T>>;

  constructor(
    phase: PhaseIdentifier,
    functions: ProcessorFunction<T>[],
    predicate: PhasePredicate<T> | null
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
  public executor(): ProcessorFunction<T> {
    const phaseExecutor = (initialData: T): T =>
      this.functions.reduce((currentData, fn) => fn(currentData), initialData);

    const conditionalExecutor = (initialData: T): T =>
      this.predicate(initialData) ? phaseExecutor(initialData) : initialData;

    return conditionalExecutor;
  }
}

/**
 * A MergedRunner represents a collection of PhaseRunners, ordered for execution.
 * @template T The type of the shared data object.
 */
class MergedRunner<T> {
  private readonly runners: ReadonlyArray<PhaseRunner<T>>;

  constructor(runners: PhaseRunner<T>[]) {
    const sortedRunners = [...runners].sort();
    this.runners = Object.freeze(sortedRunners);
  }

  /**
   * Generates and returns a single executor function that runs all merged phases in order.
   * @returns A ProcessorFunction that encapsulates the logic for all merged phases.
   */
  public executor(): ProcessorFunction<T> {
    const executors = this.runners.map((runner) => runner.executor());
    return (initialData: T): T =>
      executors.reduce((currentData, phaseExecutor) => phaseExecutor(currentData), initialData);
  }
}

/**
 * The PhaseBuilder is a temporary object used to configure a single phase.
 * It uses a fluent (chainable) interface.
 * @template T The type of the shared data object.
 */
export class PhaseBuilder<T> {
  private readonly phase: PhaseIdentifier;
  private functions: ProcessorFunction<T>[] = [];
  private predicate: PhasePredicate<T> | null = null;

  constructor(phase: PhaseIdentifier) {
    this.phase = phase;
  }

  /**
   * Sets a condition for the entire phase to run. If the predicate function
   * returns false, none of the functions in this phase will be executed.
   * @param predicate A function that returns true if the phase should run.
   */
  public runIf(predicate: (data: T) => boolean): this {
    this.predicate = predicate;
    return this;
  }

  /**
   * Adds a single function to the phase's pipeline.
   */
  public add(fn: ProcessorFunction<T>): this {
    this.functions.push(fn);
    return this;
  }

  /**
   * Adds an array of functions to the phase's pipeline.
   */
  public pipe(fns: ProcessorFunction<T>[]): this {
    this.functions.push(...fns);
    return this;
  }

  /**
   * Finalizes the configuration and returns an immutable PhaseRunner.
   */
  public runner(): PhaseRunner<T> {
    return new PhaseRunner<T>(this.phase, this.functions, this.predicate);
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
  public static phase<T>(phase: PhaseIdentifier): PhaseBuilder<T> {
    return new PhaseBuilder<T>(phase);
  }

  /**
   * Merges multiple PhaseRunners into a single, ordered MergedRunner.
   * @param runners An array of PhaseRunners to combine.
   * @returns A MergedRunner that can create a single executor for all phases.
   */
  public static merge<T>(runners: PhaseRunner<T>[]): MergedRunner<T> {
    return new MergedRunner<T>(runners);
  }
}

export function runIf<T>(
  predicate: (data: T) => boolean,
  fnToRun: ProcessorFunction<T>
): ProcessorFunction<T> {
  return (data: T) => (predicate(data) ? fnToRun(data) : data);
}
