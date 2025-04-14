export default class PriorityQueue<T> {
    private _heap: T[];
    private _comparator: (a: T, b: T) => i32;
  
    constructor(
      comparator: (a: T, b: T) => i32 = (a, b) =>
        a > b ? 1 : a < b ? -1 : 0
    ) {
      this._heap = [];
      this._comparator = comparator;
    }
  
    size(): i32 {
      return this._heap.length;
    }
  
    isEmpty(): bool {
      return this.size() === 0;
    }
  
    peek(): T | null{
      return this.size() > 0 ? this._heap[0] : null;
    }
  
    push(...values: T[]): i32 {
      for (let i = 0; i < values.length; i++) {
        const value = values[i];
        this._heap.push(value);
        this._siftUp();
      }
      return this.size();
    }
  
    pop(): T | null{
      if (this.isEmpty()) return null;
      const top = this._heap[0];
      const last = this._heap.pop();
      if (this.size() > 0 && last !== null) {
        this._heap[0] = last;
        this._siftDown();
      }
      return top;
    }
  
    private _greater(i: i32, j: i32): bool {
      return this._comparator(this._heap[i], this._heap[j]) < 0;
    }
  
    private _swap(i: i32, j: i32): void {
      const temp = this._heap[i];
      this._heap[i] = this._heap[j];
      this._heap[j] = temp;
    }
  
    private _siftUp(): void {
      let node = this.size() - 1;
      while (node > 0) {
        const parent = (node - 1) / 2;
        const parentIndex = parent as i32;
        if (this._greater(node, parentIndex)) {
          this._swap(node, parentIndex);
          node = parentIndex;
        } else break;
      }
    }
  
    private _siftDown(): void {
      let node = 0;
      const length = this.size();
      while (true) {
        let left = 2 * node + 1;
        let right = 2 * node + 2;
        let smallest = node;
  
        if (left < length && this._greater(left, smallest)) {
          smallest = left;
        }
        if (right < length && this._greater(right, smallest)) {
          smallest = right;
        }
        if (smallest !== node) {
          this._swap(node, smallest);
          node = smallest;
        } else break;
      }
    }
  }
  