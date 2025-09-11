import type { AppRef } from "./app-ref";
import { move } from "./scroll-motion";

export function createTeleport() {
  /** Globar ring-buffer offset */
  let virtualBase = 0;

  return (appRef: AppRef) => {
    const { layout, motion } = appRef;

    // --- bounds & distances (same math you already have) ---
    const jointSafety = 0.1;
    const maxBound = jointSafety;
    const minBound =
      layout.viewportRect.height - layout.slideSpacing - layout.contentArea.height + jointSafety;

    const loopDistance = layout.contentArea.height - layout.slideSpacing;

    // --- check if we must loop (inline shouldLoop) ---
    const offset = motion.offset;
    const direction = motion.direction; // -1 | 0 | 1

    const needsToLoop =
      (direction === -1 && offset <= minBound) || (direction === 1 && offset >= maxBound);

    if (!needsToLoop) return false;

    // --- perform the teleport (same as your loopScroll) ---
    const distanceToMove = direction === 1 ? -loopDistance : loopDistance;
    move(motion, distanceToMove);

    // --- bump the virtual base instead of touching slides ---
    // How much to shift indices per teleport:
    // Use the same value you previously applied in applyShift(...)
    // If your earlier ShiftLeft used (+bufferLength - 1), keep that.
    const SHIFT_BY = layout.slideCount.buffer; // or (buffer - 1) if that matches your layout math

    // Sign depends on your coordinate system.
    // Map it so that list appearance is continuous after the teleport:
    // - When moving "forward" (dir === 1) and we teleport by -loopDistance,
    //   items that were at the top wrap to the bottom → increase virtualBase.
    // - When moving "backward" (dir === -1) and we teleport by +loopDistance,
    //   items at the bottom wrap to the top → decrease virtualBase.
    virtualBase += direction === 1 ? +SHIFT_BY : -SHIFT_BY;

    return true;
  };
}
