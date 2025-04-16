import { World, query, unwrap } from "./core";
import { Viewport } from "./components";

import type { Resources, Components } from "./types";

export async function main() {
  const world = new World();

  const resources: Resources = {
    rootId: world.initResource(() => unwrap(query(document, "#root"))),
    containerId: world.initResource(() =>
      unwrap(query(document, ".container"))
    ),
  };

  const components = {} as Components;

  components.ViewportId = world.addComponent(new Viewport(world, resources));

  const abortSignal = await world.run();

  console.log("Running...");

  return abortSignal;
}
