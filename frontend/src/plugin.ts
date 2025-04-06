/**
 * A minimal async-friendly plugin interface.
 */
export abstract class Plugin<World = any> {
  /**
   * Called when the plugin is first registered or loaded.
   * Implement this to perform setup tasks such as:
   * - Allocating resources
   * - Fetching external data
   * - Wiring up initial dependencies
   *
   * @param world - application context.
   */
  public build(_world: World): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Called after `build` completes for all plugins.
   * Typically used to:
   * - Start a main loop or begin listening for events
   * - Enable primary behaviors once all plugins are ready
   *
   * @param world - application context.
   */
  public start(_world: World): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Called when the plugin (or application) is shutting down.
   * Implement this to:
   * - Close open connections
   * - Remove event listeners
   * - Free allocated resources
   *
   * @param world - application context.
   */
  cleanup(_world: World): Promise<void> {
    return Promise.resolve();
  }
}
