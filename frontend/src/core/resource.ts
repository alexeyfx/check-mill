import { Id } from "./utils";
import { World } from "./world";

/** A function that produces a `Resource<T>` when invoked. */
export interface ResourceFactory<T> {
  (): T;
}

/** */
export class ResourceRef<T> {
  constructor(private readonly id: Id<T>) {}

  public read(world: World): void {
    world.readResource(this.id);
  }

  public write(world: World, data: T): void {
    world.updateResource(this.id, data);
  }
}
