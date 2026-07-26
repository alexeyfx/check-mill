import type { Slide, SlidesCollectionType } from "./slides";
import { isRetained, type VisibilityState } from "./visibility-tracker";

/** Sentinel in `mountedPages` for a slide with no template attached. */
export const NOT_HYDRATED = -1;

/**
 * Whatever actually mounts pages onto slides, viewed as a diffable surface.
 */
export interface HydrationSink {
  readonly mountedPages: Int32Array;
  hydrate(slide: Slide): void;
  dehydrate(slide: Slide): void;
}

/**
 * Moves the DOM one bounded step towards what the visibility pass wants.
 *
 * A diff of current state rather than a replay of queued events, which makes it
 * self-correcting in two ways that a queue is not. A slide is hydrated whenever
 * the page it shows differs from the page it should show, no matter what
 * sequence of scrolls and recycles led there — so a record can never go stale
 * between being produced and being applied. And when the template pool is
 * momentarily empty the mount simply does not happen, leaving the mismatch in
 * place to be retried next frame, where a dropped queue entry would have been
 * lost for good.
 *
 * Releases run before mounts: a slide leaving the viewport returns its template
 * to the pool for the slides entering below it. Draining a queue in arrival
 * order could strand a hydrate behind a dehydrate it needed.
 *
 * @returns how much of the budget was spent.
 */
export function reconcileHydration(
  sink: HydrationSink,
  slides: SlidesCollectionType,
  visibility: VisibilityState<Slide>,
  budget: number,
): number {
  const { mountedPages } = sink;
  const count = slides.length;

  let spent = 0;

  for (let i = 0; i < count && spent < budget; i++) {
    if (!isRetained(visibility, i) && mountedPages[i] !== NOT_HYDRATED) {
      sink.dehydrate(slides[i]);
      spent++;
    }
  }

  for (let i = 0; i < count && spent < budget; i++) {
    if (isRetained(visibility, i) && mountedPages[i] !== slides[i].pageIndex) {
      sink.hydrate(slides[i]);
      spent++;
    }
  }

  return spent;
}

/**
 * Whether the DOM matches the visibility pass exactly, with nothing left to do.
 */
export function isHydrationSettled(
  sink: HydrationSink,
  slides: SlidesCollectionType,
  visibility: VisibilityState<Slide>,
): boolean {
  const { mountedPages } = sink;

  for (let i = 0; i < slides.length; i++) {
    const wanted = isRetained(visibility, i) ? slides[i].pageIndex : NOT_HYDRATED;

    if (mountedPages[i] !== wanted) return false;
  }

  return true;
}
