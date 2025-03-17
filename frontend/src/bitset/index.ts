export class Uint16BitSet {
  private readonly view: DataView;

  private readonly bytes: Uint16Array;

  constructor(base64String: string) {
    const binaryString = atob(base64String);

    this.bytes = new Uint16Array(binaryString.length);
    this.view = new DataView(
      this.bytes.buffer,
      this.bytes.byteOffset,
      this.bytes.byteLength
    );

    for (let i = 0; i < binaryString.length; i++) {
      this.bytes[i] = binaryString.charCodeAt(i);
    }
  }

  public static empty() {
    const bytes = new Uint16Array(65_535);
    return new Uint16BitSet(Uint16BitSet.makeBase64String(bytes));
  }

  public static filled() {
    const bytes = new Uint16Array(65_535).fill(255);
    return new Uint16BitSet(Uint16BitSet.makeBase64String(bytes));
  }

  private static makeBase64String(bytes: Uint16Array) {
    let binary = "";
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    return btoa(binary);
  }

  public has(index: number): boolean {
    return (this.bytes[index >>> 4] & (1 << index)) !== 0;
  }

  public flip(index: number): void {
    this.bytes[index >>> 4] ^= 1 << index;
  }

  public setByte(offset: number, value: number): void {
    this.view.setUint16(offset, value);
  }

  public getByte(offset: number): number {
    return this.view.getUint16(offset);
  }

  public *slice(index: number, size: number) {
    let current = index;

    while (current < index + size) {
      yield this.bytes[current >>> 4] & (1 << current);
      current += 1;
    }
  }
}
