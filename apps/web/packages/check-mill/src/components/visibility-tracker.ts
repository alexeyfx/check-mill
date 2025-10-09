import { type Disposable, DisposableStoreId, createDisposableStore } from "../core";
import { type Component } from "./component";

/**
 * Describes the visibility state of an element.
 */
export const enum VisibilityState {
  Hidden = 1,
  Visible = 2,
}

/**
 * Describes the change in an element's visibility since the last frame.
 */
export const enum VisibilityChange {
  Exited = -1,
  NoChange = 0,
  Entered = 1,
}

/**
 * A record describing a change in a single element's visibility.
 */
export type VisibilityRecord = {
  /**
   * The index of the element in the original tracked array.
   */
  index: number;
  /**
   * The type of change that occurred.
   */
  change: VisibilityChange.Entered | VisibilityChange.Exited;
};

/**
 * The public interface for the visibility tracker component.
 */
export interface VisibilityTrackerType extends Component {
  /**
   * Consumes and returns only the visibility changes that have occurred
   * since the last time this function was called.
   */
  takeRecords(): VisibilityRecord[];
}

/**
 * Creates a generic tracker that determines whether a collection of elements
 * is currently visible within a given root container.
 *
 * @param root The scrolling container or viewport element.
 * @param elementsToTrack The array of HTML elements to observe.
 * @returns A VisibilityTrackerType instance.
 */
export function createVisibilityTracker(
  root: HTMLElement,
  elementsToTrack: HTMLElement[]
): VisibilityTrackerType {
  const elementCount = elementsToTrack.length;
  const lastRecords = new Uint8Array(elementCount).fill(VisibilityState.Hidden);
  const currentRecords = new Uint8Array(elementCount).fill(VisibilityState.Hidden);

  function init(): Disposable {
    const observer = new IntersectionObserver(handleIntersection, {
      root,
      threshold: 0,
    });

    for (let i = 0; i < elementCount; i++) {
      const element = elementsToTrack[i];
      element.setAttribute("data-visibility-index", i.toString());
      observer.observe(element);
    }

    const disposables = createDisposableStore();
    disposables.push(DisposableStoreId.Static, () => observer.disconnect());

    return () => disposables.flushAll();
  }

  function takeRecords(): VisibilityRecord[] {
    const changedRecords: VisibilityRecord[] = [];

    for (let i = 0; i < elementCount; i++) {
      const diff = currentRecords[i] - lastRecords[i];

      if (diff === VisibilityChange.Entered || diff === VisibilityChange.Exited) {
        changedRecords.push({
          index: i,
          change: diff,
        });
      }
    }

    lastRecords.set(currentRecords);
    return changedRecords;
  }

  function handleIntersection(entries: IntersectionObserverEntry[]): void {
    for (const { target, isIntersecting } of entries) {
      const index = parseInt(target.getAttribute("data-visibility-index")!, 10);

      if (!isNaN(index)) {
        currentRecords[index] = isIntersecting ? VisibilityState.Visible : VisibilityState.Hidden;
      }
    }
  }

  return { init, takeRecords };
}
