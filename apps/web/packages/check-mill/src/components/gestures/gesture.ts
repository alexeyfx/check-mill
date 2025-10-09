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
  state: GestureState;
  delta: number;
}

export interface Gesture {
  register(handler: (event: GestureEvent) => void): void;
}

export function gestureEvent(type: GestureType, state: GestureState, delta: number): GestureEvent {
  return { type, delta, state };
}
