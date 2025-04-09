/**
 * A Token uniquely identifies a resource or service.
 *
 * @typeParam T - An optional type parameter specifying the type of resource or service
 * that this Token refers to, helping TypeScript provide stronger type safety
 * when retrieving or injecting the resource.
 */

export class Token<_T = unknown> {
  /** A truly unique symbol (cannot collide) */
  public readonly tokenSym: symbol;

  /** A descriptive name for debugging/logging */
  public readonly description: string;

  constructor(description: string) {
    this.description = description;
    this.tokenSym = Symbol(description);
  }
}
