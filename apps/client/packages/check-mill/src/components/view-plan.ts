import { computeLayout, type LayoutConfig, type LayoutContext } from "./layout";

/**
 * Geometry every consumer used to re-derive for itself.
 */
export interface DerivedGeometry {
  /** Distance between the tops of two adjacent slides. */
  readonly stride: number;

  /** Vertical distance a recycled slide teleports. */
  readonly runwayRange: number;

  /** Left edge of every slide, centred in the viewport. */
  readonly slideOriginX: number;

  /** Slide templates the renderer keeps hydrated. */
  readonly poolSize: number;
}

/**
 * The complete, frozen description of a view at one viewport size.
 *
 * A superset of `LayoutContext`, so anything that only needs `config` or
 * `computed` accepts a plan unchanged.
 */
export interface ViewPlan extends LayoutContext {
  readonly derived: DerivedGeometry;
}

export function deriveViewPlan(config: LayoutConfig): ViewPlan {
  const frozenConfig = Object.freeze({ ...config });
  const computed = computeLayout(frozenConfig);

  return Object.freeze({
    config: frozenConfig,
    computed: Object.freeze(computed),
    derived: Object.freeze({
      stride: computed.slide.height + frozenConfig.slideSpacing,
      runwayRange: computed.contentArea.height - 2 * frozenConfig.slideSpacing,
      slideOriginX: (frozenConfig.viewportSize.width - computed.slide.width) / 2,
      poolSize: computed.slideCount.visible + 2,
    }),
  });
}

export function patchViewPlan(plan: ViewPlan, updates: Partial<LayoutConfig>): ViewPlan {
  return deriveViewPlan({ ...plan.config, ...updates });
}

/**
 * Whether moving between two plans invalidates the slide registry.
 *
 * The registry, the visibility state's fixed-size arrays and the renderer's
 * template pool are all sized against the grid and the slide count. Everything
 * else a resize touches — slide width, height, horizontal centring — is written
 * through CSS variables and costs one style update.
 */
export function planRequiresRebuild(previous: ViewPlan, next: ViewPlan): boolean {
  return (
    previous.computed.grid.rows !== next.computed.grid.rows ||
    previous.computed.grid.columns !== next.computed.grid.columns ||
    previous.computed.slideCount.total !== next.computed.slideCount.total
  );
}

export function sameViewport(plan: ViewPlan, width: number, height: number): boolean {
  return plan.config.viewportSize.width === width && plan.config.viewportSize.height === height;
}
