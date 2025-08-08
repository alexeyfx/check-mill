type AnimationTimeoutId = { id: number };

export const caf = cancelAnimationFrame;

export const raf = requestAnimationFrame;

export const cancelAnimationTimeout = (frame: AnimationTimeoutId) => caf(frame.id);

/**
 * Recursively calls requestAnimationFrame until a specified delay has been met or exceeded.
 * When the delay time has been reached the function you're timing out will be called.
 *
 * Credit: Joe Lambert (https://gist.github.com/joelambert/1002116#file-requesttimeout-js)
 */
export function requestAnimationTimeout(delay: number, callback: VoidFunction): AnimationTimeoutId {
  let endTime = 0;

  Promise.resolve().then(() => {
    endTime = delay + performance.now();
  });

  const timeout = (timeStamp: DOMHighResTimeStamp) => {
    const exceeded = timeStamp >= endTime;
    exceeded ? callback() : (frame.id = raf(timeout));
  };

  const frame: AnimationTimeoutId = {
    id: raf(timeout),
  };

  return frame;
}

export function runAnimationsSequence(
  delay: number,
  funcs: VoidFunction[],
  immediately = false
): VoidFunction {
  const ids: AnimationTimeoutId[] = [];

  let i = immediately ? 0 : 1;
  for (const func of funcs) {
    ids.push(requestAnimationTimeout(i * delay, func));
    i += 1;
  }

  return () => ids.forEach(cancelAnimationTimeout);
}
