import { AxisType } from "./axis";
import { LayoutMetrics } from "./layout";
import { LocationType } from "./location";
import { Translate } from "./translate";
import { ViewportType } from "./viewport";

export interface SlidesLooperType {
  loop(): void;
}

export function SlidesLooper(
  location: LocationType,
  metrics: LayoutMetrics,
  axis: AxisType,
  viewport: ViewportType,
): SlidesLooperType {
  const jointSafety = 0.1;

  const viewportRect = viewport.measure();

  const tSlides = Math.ceil(viewportRect.height / metrics.slideHeight);

  const min = 
    -1 *
    (metrics.contentHeight
    - tSlides * metrics.slideHeight
    - (tSlides - 1) * metrics.gridGap
    + jointSafety)

  const max = jointSafety;

  function loop(): void {
    const offset = location.offset.get();
    const direction = location.direction.get();

    console.log(offset, min, max, axis.sign);

    if (offset > max || offset < min) {
      console.log('translate');
    } else {
      console.log('keep current translate');
    }

    return;
  }

  function reachedMin(offset: number): boolean {
    return offset < min;
  }

  function reachedMax(offset: number): boolean {
    return offset > max;
  }

  return { loop };
}
