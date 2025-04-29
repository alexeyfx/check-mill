import type { LayoutConfig } from "./types";

export class LayoutConfigBuilder {
  /**
   * Internal mutable working state.
   */
  private readonly config: Partial<LayoutConfig>;

  constructor(config: Omit<LayoutConfig, "generation">) {
    this.config = Object.assign({}, config);
  }

  /**
   * Updates selected properties of the layout config.
   */
  public set(part: Partial<LayoutConfig>): LayoutConfigBuilder {
    Object.assign(this.config, part);
    return this;
  }

  public build(): Readonly<LayoutConfig> {
    this.sign();
    return Object.assign({}, this.config as LayoutConfig);
  }

  /**
   * Signs the current working state with a unique generation symbol.
   */
  private sign(): void {
    this.config.generation = Symbol("layout-config");
  }
}
