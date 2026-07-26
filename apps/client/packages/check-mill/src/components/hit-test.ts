import type { MotionType } from "./scroll-motion";
import type { SlidesCollectionType } from "./slides";
import { slideTrackOffset } from "./track-geometry";
import type { ViewPlan } from "./view-plan";

export interface SpatialHit {
  readonly pageIndex: number;
  readonly checkboxIndex: number;
  readonly index: number;
}

export function hitTest(
  point: [number, number],
  stage: DOMRect,
  plan: ViewPlan,
  slides: SlidesCollectionType,
  motion: Readonly<MotionType>,
): SpatialHit | null {
  const { config, computed, derived } = plan;
  const [x, y] = point;

  const cellSize = config.checkboxSize + config.gridSpacing;

  const gridX = x - stage.left - derived.slideOriginX - config.slidePadding.horizontal;
  if (gridX < 0) return null;

  const column = Math.floor(gridX / cellSize);
  if (column >= computed.grid.columns) return null;
  if (gridX - column * cellSize > config.checkboxSize) return null;

  const stageY = y - stage.top;
  const count = slides.length;

  for (let i = 0; i < count; i++) {
    const slide = slides[i];

    const slideTop = slideTrackOffset(slide, plan) + motion.position;

    const gridY = stageY - slideTop - config.slidePadding.vertical;
    if (gridY < 0) continue;

    const row = Math.floor(gridY / cellSize);
    if (row >= computed.grid.rows) continue;
    if (gridY - row * cellSize > config.checkboxSize) return null;

    const checkboxIndex = row * computed.grid.columns + column;

    return {
      pageIndex: slide.pageIndex,
      checkboxIndex,
      index: slide.pageIndex * computed.pagination.itemsPerSlide + checkboxIndex,
    };
  }

  return null;
}
