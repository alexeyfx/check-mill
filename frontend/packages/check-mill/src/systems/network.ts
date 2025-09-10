import { noop } from "../core";
import { AppSystem } from "./system";

export const NetworkSystem: AppSystem = (_appRef) => {
  return {
    init: () => noop,
    logic: {},
  };
};
