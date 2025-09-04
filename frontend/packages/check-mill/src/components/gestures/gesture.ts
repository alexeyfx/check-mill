export const enum GestureState {
  Initialize,
  Update,
  Finalize,
}

export const enum GestureType {
  Drag,
  Wheel,
}

export interface GestureEvent {
  type: GestureType;
  delta: number;
  state: GestureState;
}

export interface Gesture {
  register(handler: (event: GestureEvent) => void): void;
}

export function gestureEvent(type: GestureType, delta: number, state: GestureState): GestureEvent {
  return { type, delta, state };
}
