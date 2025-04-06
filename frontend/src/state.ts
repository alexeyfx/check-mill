import { toArray, type OneOrMany } from "./utils";

export class State {
  private store = 0;

  constructor(initial?: OneOrMany<number>) {
    this.set(initial ?? []);
  }

  public is(flags: OneOrMany<number>): boolean {
    return toArray(flags).every((flag) => this.store & flag);
  }

  public set(flags: OneOrMany<number>): void {
    for (const flag of toArray(flags)) {
      this.store |= flag;
    }
  }

  public unset(flags: OneOrMany<number>): void {
    for (const flag of toArray(flags)) {
      this.store &= ~flag;
    }
  }

  public toggle(flags: OneOrMany<number>): void {
    for (const flag of toArray(flags)) {
      this.store ^= flag;
    }
  }
}
