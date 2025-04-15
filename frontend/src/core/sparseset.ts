type DenseElement<T> = {
  index: number;
  data: T;
};

export class SparseSet<T> {
  private size = 0;

  private sparse: number[] = [];

  private dense: DenseElement<T>[] = [];

  public has(index: number): boolean {
    if (index >= this.sparse.length) {
      return false;
    }

    const denseIdx = this.sparse[index];
    const currentIdx = this.dense[denseIdx].index;

    return denseIdx < this.size && index === currentIdx;
  }

  public get(index: number): T | undefined {
    if (!this.has(index)) {
      return undefined;
    }

    return this.dense[this.sparse[index]].data;
  }

  public add(item: T): number {
    const denseIdx = this.size;
    this.size += 1;

    if (denseIdx < this.dense.length) {
      const element = this.dense[denseIdx];
      element.data = item;

      return element.index;
    }

    const sparseIdx = this.sparse.length;

    this.dense.push({ index: sparseIdx, data: item });
    this.sparse.push(denseIdx);

    return sparseIdx;
  }

  public update(index: number, item: T): boolean {
    if (!this.has(index)) {
      return false;
    }

    this.dense[this.sparse[index]].data = item;

    return true;
  }

  public remove(index: number): T | undefined {
    if (!this.has(index)) {
      return undefined;
    }

    this.size -= 1;

    const removeDenseIdx = this.sparse[index];
    const removedItem = this.dense[removeDenseIdx];

    if (removeDenseIdx !== this.size) {
      const tailElement = this.dense[this.size];
      this.dense[removeDenseIdx] = tailElement;
      this.sparse[tailElement.index] = removeDenseIdx;
    }

    this.dense.pop();

    return removedItem.data;
  }

  public clear(): T[] {
    this.size = 0;
    this.sparse = [];

    return this.dense.splice(0).map((element) => element.data);
  }

  public toArray(): T[] {
    return this.dense.map((element) => element.data);
  }
}
