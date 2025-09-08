/**
 * Async-friendly component interface.
 */
export interface Component {
  /**
   * Called after all components/resources are registered.
   * Useful for wiring components and perform event subscriptions.
   */
  init(): void;

  /**
   * Called on component destroy.
   * Useful for cleaunp operations.
   */
  destroy(): void;
}
