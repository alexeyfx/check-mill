import type { AppRef, AppSystemInstance } from "../components";
import { Phases, Dataset } from "../components";
import type { Disposable, LoopParams } from "../core";
import { DisposableStore, event, throttle } from "../core";

export function ToggleSystem(appRef: AppRef): AppSystemInstance {
  const { state } = appRef;

  const toggleQueue: number[] = [];
  const disposables = new DisposableStore();
  const itemsPerSlide = appRef.state.layout.current.computed.pagination.itemsPerSlide;

  function init(): Disposable {
    disposables.push(
      event(appRef.host.rootElement, "click", handleToggle),
      () => (toggleQueue.length = 0),
    );

    return () => disposables.flushAll();
  }

  function processToggles(_params: LoopParams): void {
    if (toggleQueue.length === 0) return;

    const merged = mergeToggles(toggleQueue);

    for (const toggle of merged) {
      state.selectionBoard.flip(toggle);
    }

    // if (merged.length) {
    //   merged.length > 1 ? app.gateway.sendToggleMany(merged) : app.gateway.sendToggle(merged[0]);
    // }

    toggleQueue.length = 0;
  }

  function handleToggle(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    const parent = target.closest(`[data-${Dataset.SLIDE_INDEX}]`) as HTMLElement;

    if (!parent) {
      return;
    }

    const slideIndex = parseInt(parent.dataset[Dataset.SLIDE_INDEX] ?? "");
    const checkboxIndex = parseInt(target.dataset[Dataset.CHECKBOX_INDEX] ?? "");

    if (Number.isInteger(slideIndex) && Number.isInteger(checkboxIndex)) {
      const index = slideIndex * itemsPerSlide + checkboxIndex;
      toggleQueue.push(index);
    }
  }

  function mergeToggles(toggles: number[]): number[] {
    const active = new Set<number>();

    for (const toggle of toggles) {
      if (active.has(toggle)) {
        active.delete(toggle);
      } else {
        active.add(toggle);
      }
    }

    return [...active];
  }

  return {
    init,
    logic: {
      [Phases.IO]: [throttle(processToggles, 300)],
    },
  };
}
