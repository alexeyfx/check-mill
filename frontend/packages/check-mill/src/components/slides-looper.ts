import { type AppRef } from "./app-ref";
import { type SlidesCollectionType, type SlideType } from "./slides";

/**
 * Possible looping operations.
 * 'None' is the default state where slides are in their original positions.
 */
export enum LoopOperation {
  None,
  ShiftLeft,
  ShiftRight,
}

/**
 * The state required for the looping logic.
 * This would be part of your main application state object.
 */
export interface LoopingState {
  readonly slides: SlidesCollectionType;
  readonly lastLoopOperation: LoopOperation;
}

/**
 * The output of the pure looping function.
 * The caller is responsible for updating its state with this result.
 */
export interface LoopResult {
  readonly slides: SlidesCollectionType;
  readonly currentLoopOperation: LoopOperation;
}

/**
 * A pure, stateless function that calculates the next state for looping slides.
 * It does not modify any input and has no internal state or side effects.
 *
 * @param state The current state of the application (or relevant parts).
 * @returns A LoopResult containing the new slides array and the current operation.
 */
export function createSlidesLooper() {
  let lastLoopOperation = LoopOperation.None;

  return (appRef: AppRef): void => {
    const { slides, motion, layout } = appRef;

    const leftEdge = motion.offset;
    const rightEdge = leftEdge + layout.contentArea.height;
    const viewportHeight = layout.viewportRect.height;

    let desiredOperation = LoopOperation.None;
    if (leftEdge > 0) {
      desiredOperation = LoopOperation.ShiftRight;
    } else if (rightEdge < viewportHeight) {
      desiredOperation = LoopOperation.ShiftLeft;
    }

    if (desiredOperation !== lastLoopOperation) {
      applyShift(slides, desiredOperation, layout.slideCount.buffer);
    }

    lastLoopOperation = desiredOperation;
  };
}

/**
 * A helper function that returns a NEW array of slides with transformations applied.
 * This ensures the operation is immutable.
 */
function applyShift(
  slides: SlidesCollectionType,
  operation: LoopOperation,
  totalSlides: number
): void {
  const shiftLength = Math.ceil(totalSlides / 3); // Example value

  switch (operation) {
    case LoopOperation.ShiftRight:
      slides.forEach((slide, index) => {
        if (index >= slides.length - shiftLength) {
          slide.virtualIndex -= totalSlides;
          slide.viewportOffset = -1;
          return;
        }

        resetSlide(slide);
      });
      break;

    case LoopOperation.ShiftLeft:
      slides.forEach((slide, index) => {
        if (index < shiftLength) {
          slide.virtualIndex += totalSlides;
          slide.viewportOffset = 1;
          return;
        }

        resetSlide(slide);
      });
      break;

    case LoopOperation.None:
      slides.forEach(resetSlide);
  }
}

/**
 * Returns a new slide object in its default, non-shifted state.
 */
function resetSlide(slide: SlideType): SlideType {
  if (slide.virtualIndex === slide.realIndex && slide.viewportOffset === 0) {
    return slide;
  }
  return {
    ...slide,
    virtualIndex: slide.realIndex,
    viewportOffset: 0,
  };
}
