import { type AppRef } from "./app-ref";
import { move } from "./scroll-motion";

/**
 * Describes the virtual state of the slide loop.
 */
export enum LoopOperation {
  None,
  ShiftedUp,
  ShiftedDown,
}

/**
 * A pure, stateless function that manages the logic for a virtualized infinite scroller.
 *
 * It checks if the scroll position has crossed the looping "seams". If it has,
 * this function performs two critical actions to create a seamless illusion:
 *
 * 1.  It virtually repositions slides by updating their `virtualIndex` and
 * `viewportOffset` properties. The main `slides` array is NEVER reordered.
 * 2.  It instantly jumps the scroll offset (`motion.offset`) to match the
 * virtual repositioning, making the change invisible to the user.
 *
 * @param appRef The complete, current application state for this frame.
 * @returns `true` if the looping state was changed, otherwise `false`.
 */
export function loop(appRef: AppRef): boolean {
  const { motion, slides, layout } = appRef;
  const { slide, contentArea, slideCount, slideSpacing, viewportRect } = layout;

  const topLoopBound = 0;
  const bottomLoopBound = -contentArea.height + viewportRect.height;
  let desiredOperation = LoopOperation.None;

  if (motion.offset > topLoopBound) {
    desiredOperation = LoopOperation.ShiftedUp;
  } else if (motion.offset < bottomLoopBound) {
    desiredOperation = LoopOperation.ShiftedDown;
  }

  const lastOperation =
    slides[0].viewportOffset === 1
      ? LoopOperation.ShiftedDown
      : slides[slides.length - 1].viewportOffset === -1
      ? LoopOperation.ShiftedUp
      : LoopOperation.None;

  if (desiredOperation === lastOperation) {
    return false;
  }

  applyShift(appRef, desiredOperation);

  const distanceToJump = slideCount.buffer * (slide.height + slideSpacing);
  switch (desiredOperation) {
    case LoopOperation.ShiftedUp:
      move(motion, -distanceToJump);
      break;
    case LoopOperation.ShiftedDown:
      move(motion, distanceToJump);
      break;
  }

  return true;
}

/**
 * An efficient helper that mutates the slides' virtual properties in a single pass.
 */
function applyShift(appRef: AppRef, operation: LoopOperation): void {
  for (const slide of appRef.slides) {
    slide.viewportOffset = 0;
    slide.virtualIndex = slide.realIndex;
  }

  for (let i = 0; i < appRef.slides.length; i++) {
    const slide = appRef.slides[i];

    switch (operation) {
      case LoopOperation.ShiftedUp:
        if (i >= appRef.slides.length - appRef.layout.slideCount.buffer) {
          slide.virtualIndex = slide.realIndex - appRef.layout.slideCount.total;
          slide.viewportOffset = -1;
        } else {
          slide.virtualIndex = slide.realIndex;
          slide.viewportOffset = 0;
        }
        break;

      case LoopOperation.ShiftedDown:
        if (i < appRef.layout.slideCount.buffer) {
          slide.virtualIndex = slide.realIndex + appRef.layout.slideCount.total;
          slide.viewportOffset = 1;
        } else {
          slide.virtualIndex = slide.realIndex;
          slide.viewportOffset = 0;
        }
        break;
    }
  }
}
