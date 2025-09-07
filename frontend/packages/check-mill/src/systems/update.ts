import { type AppRef, Phases, ProcessorFunction } from "../components";
import { noop } from "../utils";
import { type System } from "./system";

export const UpdateSystem: System<AppRef> = () => {
  return {
    init: () => noop,
    logic: {
      [Phases.Update]: [processUpdate],
    },
  };
};

const processUpdate: ProcessorFunction<AppRef> = (appRef) => {
  const motion = appRef.motion;

  const integrated = applyFriction(motion.velocity, 0.75, 0);
  const displacement = motion.current + integrated - motion.previous;

  motion.velocity = integrated;
  motion.previous = motion.current;
  motion.current += integrated;
  motion.direction = Math.sign(displacement);

  return appRef;
};

const applyFriction = (velocity: number, friction: number, dt: number): number => {
  const decay = 1 - Math.pow(1 - friction, dt / 1000);
  const next = velocity * (1 - decay);

  return next;
};
