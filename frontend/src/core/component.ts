/**
 * Async-friendly component interface.
 */
export abstract class Component {
  /**
   * Register events/resources this component owns.
   * Called right after addComponent.
   */
  public init(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Called after all components/resources are registered.
   * Useful for wiring between components.
   */
  public setup(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Start listening to events, animation frames, etc.
   */
  public start(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Final: Cleanup
   */
  public cleanup(): Promise<void> {
    return Promise.resolve();
  }
}
