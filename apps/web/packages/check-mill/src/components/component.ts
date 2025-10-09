import { type Disposable } from "../core";

/**
 * Component interface.
 */
export interface Component {
  /**
   * Called after all components/resources are registered.
   */
  init(): Disposable;
}
