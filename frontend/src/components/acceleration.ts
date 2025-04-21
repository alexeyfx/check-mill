
import type { LocationType } from "./location";

export interface AccelerationType {
  settled: () => boolean;
  direction: () => number;
  duration: () => number;
  velocity: () => number;
  seek: () => AccelerationType;
  useFriction: (n: number) => AccelerationType;
  useDuration: (n: number) => AccelerationType;
  useBaseFriction: () => AccelerationType;
  useBaseDuration: () => AccelerationType;
}

export function Acceleration(
  location: LocationType,
  baseDuration: number,
  baseFriction: number,
): AccelerationType {
  let scrollVelocity = 0;

  let scrollDirection = 0;

  let scrollDuration = baseDuration;

  let scrollFriction = baseFriction;
  
  let rawLocation = location.current.get();

  let rawLocationPrevious = 0;

  function settled(): boolean {
    const diff = location.target.get() - location.offset.get();
    return Math.abs(diff) < 0.001;
  }

  function duration(): number {
    return scrollDuration;
  }

  function direction(): number {
    return scrollDirection;
  }

  function velocity(): number {
    return scrollVelocity;
  }

  function seek(): AccelerationType {
    const displacement = location.target.get() - location.current.get();
    const isInstant = !scrollDuration;
    let scrollDistance = 0;

    if (isInstant) {
      scrollVelocity = 0;
      scrollDistance = displacement;

      location.previous.set(location.target);
      location.current.set(location.target);
    } else {
      scrollVelocity += displacement / scrollDuration;
      scrollVelocity *= scrollFriction;
      rawLocation += scrollVelocity;
      scrollDistance = rawLocation - rawLocationPrevious;

      location.previous.set(location.current);
      location.current.add(scrollVelocity);
    }

    scrollDirection = Math.sign(scrollDistance);
    rawLocationPrevious = rawLocation;

    return self;
  }

  function useBaseDuration(): AccelerationType {
    return useDuration(baseDuration);
  }

  function useBaseFriction(): AccelerationType {
    return useFriction(baseFriction);
  }

  function useDuration(n: number): AccelerationType {
    scrollDuration = n;
    return self;
  }

  function useFriction(n: number): AccelerationType {
    scrollFriction = n;
    return self;
  }

  const self: AccelerationType = {
    direction,
    duration,
    velocity,
    seek,
    settled,
    useBaseFriction,
    useBaseDuration,
    useFriction,
    useDuration
  };
  
  return self;
}
