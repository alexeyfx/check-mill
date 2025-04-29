import type { LayoutConfig } from "./types";

/**
 * A fluent builder for constructing or mutating LayoutConfig objects.
 */
export class LayoutConfigBuilder {
  /**
   * Internal mutable working state.
   */
  private readonly config: LayoutConfig;

  constructor(config: LayoutConfig) {
    this.config = Object.assign({}, config);
  }

  /**
   * Applies a partial update to the current config.
   * Enables chaining for fluent-style usage.
   *
   * @param part - Partial layout configuration to apply.
   * @returns The builder instance.
   */
  public set(part: Partial<LayoutConfig>): LayoutConfigBuilder {
    Object.assign(this.config, part);
    return this;
  }

  /**
   * Finalizes the configuration by returning an immutable version of the config.
   *
   * @returns A read-only signed LayoutConfig object.
   */
  public build(): Readonly<LayoutConfig> {
    return Object.assign({}, this.config);
  }
}
