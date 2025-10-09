/**
 * The public interface for the flag manager.
 */
export interface BitwiseFlags {
  /**
   * Checks if one or more flags are currently set.
   * @param flag The flag(s) to check.
   * @returns True if all specified flags are set.
   */
  is(flag: number): boolean;

  /**
   * Sets one or more flags to ON.
   * @param flag The flag(s) to set.
   */
  set(flag: number): void;

  /**
   * Unsets one or more flags (turns them OFF).
   * @param flag The flag(s) to unset.
   */
  unset(flag: number): void;

  /**
   * Toggles the state of one or more flags.
   * If a flag is ON, it will be turned OFF. If it's OFF, it will be turned ON.
   * @param flag The flag(s) to toggle.
   */
  toggle(flag: number): void;

  /**
   * Returns the current raw integer value of all flags.
   */
  getValue(): number;

  /**
   * Resets all flags to a specific value, defaulting to None (0).
   */
  reset(value?: number): void;
}

/**
 * Creates a manager for handling bitwise flags.
 * @param initialFlags The starting value for the flags. Defaults to 0.
 */
export function createFlagManager(initialFlags = 0): BitwiseFlags {
  let dirtyFlags = initialFlags;

  return {
    is: (flag: number): boolean => (dirtyFlags & flag) === flag,

    set: (flag: number): void => {
      dirtyFlags |= flag;
    },

    unset: (flag: number): void => {
      dirtyFlags &= ~flag;
    },

    toggle: (flag: number): void => {
      dirtyFlags ^= flag;
    },

    getValue: (): number => dirtyFlags,

    reset: (value = 0): void => {
      dirtyFlags = value;
    },
  };
}
