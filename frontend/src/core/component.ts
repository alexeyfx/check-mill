/**
 * A minimal async-friendly component interface.
 */
export abstract class Component<World = any> {
  /**
   * Called when the component is first registered or loaded.
   *
   * @param world - application context.
   */
  public build(_world: World): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Called when the component (or application) is shutting down.
   * Implement this to:
   * - Close open connections
   * - Remove event listeners
   * - Free allocated resources
   *
   * @param world - application context.
   */
  public cleanup(_world: World): Promise<void> {
    return Promise.resolve();
  }
}
