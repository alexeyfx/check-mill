import type { AxisType } from "./axis";

export type TranslateType = {
  to: (target: number) => void;
  clear: () => void;
};

export function Translate(axis: AxisType, container: HTMLElement): TranslateType {
  let previousTarget: number | null = null;

  const translate = axis.isVertical ? y : x;

  const containerStyle = container.style;

  function x(n: number): string {
    return `translate3d(${n}px,0px,0px)`;
  }

  function y(n: number): string {
    return `translate3d(0px,${n}px,0px)`;
  }

  function to(target: number): void {
    const roundedTarget = Math.round(target * 100) / 100;

    if (roundedTarget === previousTarget) {
      return;
    }

    containerStyle.transform = translate(roundedTarget);
    previousTarget = roundedTarget;
  }

  function clear(): void {
    containerStyle.transform = "";

    if (!Boolean(container.getAttribute("style"))) {
      container.removeAttribute("style");
    }
  }

  return {
    to,
    clear,
  };
}
