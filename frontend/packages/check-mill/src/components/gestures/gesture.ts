export const enum GestureState {
  Initialize,
  Update,
  Finalize,
}

export interface GestureEvent {
  delta: number;
  state: GestureState;
}

export interface Gesture {
  register(handler: (event: GestureEvent) => void): void;
}

export function gestureEvent(delta: number, state: GestureState): GestureEvent {
  return { delta, state };
}
