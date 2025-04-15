import type { EventReader, EventWriter } from "./events";
import { TypedEvent } from "./events";
import { SparseSet } from "./sparseset";
import { State } from "./state";
import type { Option, Id } from "./utils";
import { None, Some } from "./utils";
import type { Component } from "./component";
import { ResourceFactory } from "./resource";

export class World {
  /**
   * Internal bitmask-based state manager.
   */
  private readonly state = new State();

  /**
   * A map of event tokens to their corresponding typed events.
   */
  private readonly events = new SparseSet<TypedEvent<any>>();

  /**
   * A map of resource tokens to their corresponding data.
   */
  private readonly resources = new SparseSet<any>();

  /**
   * A collection of components.
   */
  private readonly components = new SparseSet<Component>();

  /**
   * Registers a static resource if not already present.
   */
  public initResource<T>(factory: ResourceFactory<T>): Id<T> {
    return this.resources.add(factory()) as Id<T>;
  }

  /**
   * Updates a static resource if exists.
   */
  public updateResource<T>(id: Id<T>, data: T): boolean {
    return this.resources.update(id, data);
  }

  /**
   * Returns a static resource if exists.
   */
  public readResource<T>(id: Id<T>): Option<T> {
    const resource = this.resources.get(id);

    return resource ? Some(resource) : None();
  }

  /**
   * Registers a component.
   */
  public addComponent<C extends Component>(component: C): Id<C> {
    return this.components.add(component) as Id<C>;
  }

  /**
   *
   */
  public readComponent<C extends Component>(id: Id<C>): Option<C> {
    const component = this.components.get(id);

    return component ? (Some(component) as Option<C>) : None();
  }

  /**
   * Creates a typed event if not already present.
   */
  public addEvent<T>(): Id<T> {
    return this.events.add(new TypedEvent<T>()) as Id<T>;
  }

  /**
   * Removes a typed event if exists
   */
  public removeEvent<T>(id: Id<T>): Option<TypedEvent<T>> {
    const event = this.events.remove(id);

    return event ? Some(event) : None();
  }

  /**
   * Returns an EventReader for a previously registered event, or None if not found.
   */
  public eventReader<T>(id: Id<T>): Option<EventReader<T>> {
    const event = this.events.get(id);

    return event ? Some(event) : None();
  }

  /**
   * Returns an EventWriter for a previously registered event, or None if not found.
   */
  public eventWriter<T>(id: Id<T>): Option<EventWriter<T>> {
    const event = this.events.get(id);

    return event ? Some(event) : None();
  }

  /**
   * Starts world's component execution
   */
  public async run(): Promise<() => Promise<void>> {
    const components = this.components.toArray();

    await Promise.all(components.map((c) => c.init()));

    await Promise.all(components.map((c) => c.setup()));

    await Promise.all(components.map((c) => c.start()));

    return async (): Promise<void> => {
      await Promise.all(components.map((c) => c.cleanup()));
    };
  }
}
