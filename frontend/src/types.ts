import type { Id } from "./core";
import type { Viewport } from "./components";

export type Resources = {
  rootId: Id<HTMLElement>;
  containerId: Id<HTMLElement>;
};

export type Components = {
  ViewportId: Id<Viewport>;
};
