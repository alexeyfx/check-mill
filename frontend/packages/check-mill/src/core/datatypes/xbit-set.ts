/**
 * A union type representing any of the unsigned integer typed arrays:
 * Uint8Array, Uint16Array, or Uint32Array.
 */
type UintXArray = Uint8Array | Uint16Array | Uint32Array;

/**
 * A union type representing the constructors for the possible unsigned
 * integer typed arrays: Uint8Array, Uint16Array, or Uint32Array.
 */
type UintXArrayConstructor =
  | Uint8ArrayConstructor
  | Uint16ArrayConstructor
  | Uint32ArrayConstructor;

/**
 * A union type defining the allowable bit widths.
 * Restricts the widths to 8, 16, or 32 bits.
 */
type XBits = 8 | 16 | 32;

/**
 * A mapping object that relates a bit width (8, 16, or 32) to its corresponding
 * typed array constructor.
 */
const bitsToArrayConstructorMap: Record<XBits, UintXArrayConstructor> = {
  8: Uint8Array,
  16: Uint16Array,
  32: Uint32Array,
};

/**
 * Universal bit set class which supports an underlying array of
 * Uint8Array, Uint16Array, or Uint32Array.
 */
export class UintXBitSet {
  /** DataView for low-level access to the underlying buffer. */
  private readonly view: DataView;

  /** Underlying typed array storing the bits. */
  private readonly bytes: UintXArray;

  /** Shift value equals log₂(width); used for efficient index computation. */
  private readonly shift: number;

  /** Number of bits stored in each element (8, 16, or 32). */
  private readonly width: XBits;

  /**
   * Constructs a UintXBitSet instance from a base64-encoded string.
   * The encoding is based on the underlying typed array's raw bytes.
   *
   * @param base64String - The base64-encoded string representing the bit set.
   * @param width - The bit width for each element (8, 16, or 32). Default is 8.
   */
  constructor(base64String: string, width: XBits = 8) {
    this.shift = Math.log2(width);
    this.width = width;

    const binaryString = atob(base64String);
    const byteLength = binaryString.length;
    const rawBytes = new Uint8Array(byteLength);

    for (let i = 0; i < byteLength; i++) {
      rawBytes[i] = binaryString.charCodeAt(i);
    }

    const ArrayCtor = uintXArrayConstructor(width);
    const length = rawBytes.byteLength / (width >> 3);

    this.bytes = new ArrayCtor(rawBytes.buffer, rawBytes.byteOffset, length);

    this.view = new DataView(this.bytes.buffer, this.bytes.byteOffset, this.bytes.byteLength);
  }

  /**
   * Gets the total number of bits that the bitset can hold.
   */
  public get totalBits(): number {
    return this.bytes.length * this.width;
  }

  /**
   * Creates an empty UintBitSet (all bits cleared) using the specified bit width.
   *
   * @param bitsPerElement - The bit width for each element (8, 16, or 32)
   * @param length - Number of elements in the underlying array.
   *
   * @returns A new UintBitSet instance with all bits unset.
   */
  public static empty(width: XBits, length: number): UintXBitSet {
    const array = uintXArray(width, length);

    return new UintXBitSet(base64String(array), width);
  }

  /**
   * Creates a filled UintBitSet (all bits set) using the specified bit width.
   *
   * @param width - The byte width for each element (8, 16, or 32).
   * @param length - Number of elements in the underlying array.
   *
   * @returns A new UintBitSet instance with all bits set.
   */
  public static filled(width: XBits, length: number): UintXBitSet {
    const array = uintXArray(width, length);

    switch (width) {
      case 8:
        array.fill(0xff);
        break;
      case 16:
        array.fill(0xffff);
        break;
      case 32:
        array.fill(0xffffffff);
        break;
    }

    return new UintXBitSet(base64String(array), width);
  }

  /**
   * Checks if the bit at the specified overall index is set.
   *
   * @param index - The overall bit index to check.
   *
   * @returns True if the bit is set; false otherwise.
   */
  public has(index: number): boolean {
    const elementIndex = index >>> this.shift;
    const bitPosition = index & ((1 << this.shift) - 1);
    const mask = 1 << bitPosition;

    return (this.bytes[elementIndex] & mask) !== 0;
  }

  /**
   * Sets the single bit at the specified overall index to the "1" value.
   *
   * @param index - The overall bit index to update.
   */
  public set(index: number): void {
    const byteOffset = index >>> this.shift;
    const bitPosition = index & ((1 << this.shift) - 1);
    const mask = 1 << bitPosition;

    this.bytes[byteOffset] |= mask;
  }

  /**
   * Unsets the single bit at the specified overall index to the "0" value.
   *
   * @param index - The overall bit index to update.
   */
  public unset(index: number): void {
    const byteOffset = index >>> this.shift;
    const bitPosition = index & ((1 << this.shift) - 1);
    const mask = 1 << bitPosition;

    this.bytes[byteOffset] &= ~mask;
  }

  /**
   * Flips the bit at the specified overall index.
   *
   * @param index - The overall bit index to flip.
   */
  public flip(index: number): void {
    const elementIndex = index >>> this.shift;
    const bitPosition = index & ((1 << this.shift) - 1);
    const mask = 1 << bitPosition;

    this.bytes[elementIndex] ^= mask;
  }

  /**
   * Sets the underlying array “word” at the specified index to the given value.
   *
   * @param offset - The index in the underlying array.
   * @param value - The 8/16/32-bit value to write.
   */
  public setByte(offset: number, value: number): void {
    const byteOffset = offset * (this.width >> 3);

    switch (this.width) {
      case 8:
        this.view.setUint8(byteOffset, value);
        break;
      case 16:
        this.view.setUint16(byteOffset, value, true);
        break;
      case 32:
        this.view.setUint32(byteOffset, value, true);
        break;
    }
  }

  /**
   * Retrieves the underlying “word” at the specified index.
   *
   * @param index - The index in the underlying array.
   *
   * @returns The 8/16/32-bit number stored at the given index.
   */
  public getByte(index: number): number {
    const byteOffset = index * (this.width >> 3);

    switch (this.width) {
      case 8:
        return this.view.getUint8(byteOffset);
      case 16:
        return this.view.getUint16(byteOffset, true);
      case 32:
        return this.view.getUint32(byteOffset, true);
    }
  }

  /**
   * Returns a paginated iterator over the bits in the set.
   * This allows for efficient iteration over a specific chunk of the bitset without
   * creating a large intermediate array.
   *
   * @param pageOffset - The starting bit index for the page.
   * @param pageLength - The number of bits to include in the page.
   *
   * @returns An iterable iterator that yields a boolean for each bit in the page.
   */
  public *getPageIterator(pageOffset: number, pageLength: number): IterableIterator<boolean> {
    // Calculate the end of the iteration, ensuring it doesn't exceed the total bits.
    const endBit = Math.min(pageOffset + pageLength, this.totalBits);

    // Iterate from the starting offset to the calculated end.
    for (let i = pageOffset; i < endBit; i++) {
      // Yield true if the bit is set, false otherwise.
      yield this.has(i);
    }
  }
}

/**
 * Creates a new instance of an unsigned integer typed array with the specified bit width and length.
 *
 * @param width - The bit width of each element in the typed array (8, 16, or 32).
 * @param length - The number of elements in the resulting typed array.
 *
 * @returns An instance of Uint8Array, Uint16Array, or Uint32Array based on the specified width.
 */
function uintXArray(width: XBits, length: number): UintXArray {
  const ArrayConstructor = uintXArrayConstructor(width);

  return new ArrayConstructor(length);
}

/**
 * Returns the typed array constructor corresponding to the specified bit width.
 *
 * @param width - The bit width (8, 16, or 32).
 *
 * @returns The appropriate typed array constructor (Uint8Array, Uint16Array, or Uint32Array).
 */
function uintXArrayConstructor(width: XBits): UintXArrayConstructor {
  return bitsToArrayConstructorMap[width];
}

/**
 * Converts the supplied typed array into a base64-encoded string.
 *
 * @param array - The typed array (Uint8Array, Uint16Array, or Uint32Array) to encode.
 *
 * @returns Base64 encoded string representing the array.
 */
function base64String(array: UintXArray): string {
  const rawBytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);

  let binary = "";
  for (let i = 0; i < rawBytes.length; i++) {
    binary += String.fromCharCode(rawBytes[i]);
  }

  return btoa(binary);
}
