import { UintXBitSet, noop } from "../core";
import { AppSystem } from "./system";

export const NetworkSystem: AppSystem = (_appRef) => {
  const state = UintXBitSet.empty(16, 65_535);

  return {
    init: () => noop,
    logic: {},
  };
};
