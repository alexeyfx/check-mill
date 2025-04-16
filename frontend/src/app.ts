import { Drag, Wheel } from "./components";
import { assert } from "./utils";

export async function main() {
  const root = document.querySelector("#root") as HTMLElement;
  assert(root, "");

  const drag = Drag(root);
  const wheel = Wheel(root);

  await wheel.init();

  await drag.init();
}
