import { type Disposable } from "../core";
import { type Component } from "./component";
import { type ComputedLayout } from "./layout";
import { type MotionType } from "./scroll-motion";

export const enum IntersectionState {
  Outside = 1,
  Inside = 2,
}

export const enum FrustumMutation {
  Culled = -1,
  NoChange = 0,
  Unculled = 1,
}

export interface SpatialEntity {
  readonly realIndex: number;
  readonly virtualIndex: number;
  readonly viewportOffset: number;
}

export interface SpatialDeltaManifest<T extends SpatialEntity> {
  readonly entity: T;
  readonly mutation: FrustumMutation.Unculled | FrustumMutation.Culled;
}

export class VisibilityTracker<T extends SpatialEntity> implements Component {
  private readonly count: number;
  private readonly history: Uint8Array;
  private readonly current: Uint8Array;

  private frameManifest: SpatialDeltaManifest<T>[] = [];

  constructor(private readonly registry: readonly T[]) {
    this.count = this.registry.length;
    this.history = new Uint8Array(this.count).fill(IntersectionState.Outside);
    this.current = new Uint8Array(this.count).fill(IntersectionState.Outside);
  }

  public init(): Disposable {
    return () => this.reset();
  }

  public reset(): void {
    this.history.fill(IntersectionState.Outside);
    this.current.fill(IntersectionState.Outside);
    this.frameManifest = [];
  }

  public executeIntersectionPass(
    motion: Readonly<MotionType>,
    layout: Readonly<ComputedLayout>,
  ): void {
    const totalCount = this.count;
    const stride = layout.slide.height;
    const slideHeight = layout.slide.height;

    const minLimit = -motion.current;
    const maxLimit = minLimit + layout.contentArea.height;

    for (let i = 0; i < totalCount; i++) {
      const ent = this.registry[i];
      const entMin = ent.virtualIndex * stride;
      const entMax = entMin + slideHeight;

      this.current[i] =
        entMin < maxLimit && entMax > minLimit
          ? IntersectionState.Inside
          : IntersectionState.Outside;
    }

    this.computeDeltaManifest();
  }

  public takeRecords(): SpatialDeltaManifest<T>[] {
    const records = this.frameManifest;
    this.frameManifest = [];
    return records;
  }

  public getRetainedEntities(): T[] {
    const totalCount = this.count;
    const retained: T[] = [];

    for (let i = 0; i < totalCount; i++) {
      if (this.current[i] === IntersectionState.Inside) {
        retained.push(this.registry[i]);
      }
    }
    return retained;
  }

  private computeDeltaManifest(): void {
    const totalCount = this.count;

    for (let i = 0; i < totalCount; i++) {
      const delta = this.current[i] - this.history[i];
      if (delta === 0) continue;

      this.frameManifest.push({
        entity: this.registry[i],
        mutation: delta as FrustumMutation.Unculled | FrustumMutation.Culled,
      });
    }

    this.history.set(this.current);
  }
}
