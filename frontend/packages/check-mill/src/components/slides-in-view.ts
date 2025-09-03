import { DisposableStore } from "../primitives";
import { type Component } from "./component";
import { type SlidesCollectionType } from "./slides";

export interface SlidesInViewType extends Component {
  takeRecords(): number[];
}

/**
 * Creates a tracker that determines whether slides are currently visible within the viewport.
 *
 * @param slides - Array of slide objects containing layout and index information.
 * @returns {SlideInViewType}
 */
export function SlidesInView(root: HTMLElement, slides: SlidesCollectionType): SlidesInViewType {
  const lastRecords = new Uint8Array(slides.length).fill(1);

  const currentRecords = new Uint8Array(slides.length).fill(1);

  /**
   * Disposable store for managing cleanup functions.
   */
  const disposable = DisposableStore();

  /**
   * @internal
   * Component lifecycle method.
   */
  function init(): Promise<void> {
    const observer = new IntersectionObserver(handleIntersection, {
      root,
      rootMargin: "0px",
      threshold: 0,
    });

    for (const { nativeElement, realIndex } of slides) {
      nativeElement.setAttribute("data-v-id", realIndex.toString());
      observer.observe(nativeElement);
    }

    disposable.pushStatic(observer.disconnect);

    return Promise.resolve();
  }

  /**
   * @internal
   * Component lifecycle method.
   */
  function destroy(): Promise<void> {
    disposable.flushAll();

    return Promise.resolve();
  }

  function takeRecords(): number[] {
    const diff = new Array(lastRecords.length);

    for (let i = 0; i < lastRecords.length; i += 1) {
      diff[i] = currentRecords[i] - lastRecords[i];
    }

    lastRecords.set(currentRecords);

    return diff;
  }

  function handleIntersection(entries: IntersectionObserverEntry[]): void {
    for (const { target, isIntersecting } of entries) {
      currentRecords[+target.getAttribute("data-v-id")!] = +isIntersecting + 1;
    }
  }

  return { init, destroy, takeRecords };
}
