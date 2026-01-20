// Circular buffer implementation
export class CircularBuffer<T> {
  private buffer: (T | undefined)[];
  private head: number = 0;
  private size: number = 0;

  constructor(capacity: number) {
    this.buffer = new Array(capacity);
  }

  push(value: T): void {
    this.buffer[this.head] = value;
    this.head = (this.head + 1) % this.buffer.length;
    if (this.size < this.buffer.length) {
      this.size++;
    }
  }

  get(index: number): T | undefined {
    if (index >= this.size) return undefined;
    return this.buffer[(this.head - this.size + index + this.buffer.length) % this.buffer.length];
  }

  getAll(): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.size; i++) {
      result.push(this.get(i) as T);
    }
    return result;
  }

  clear(): void {
    this.buffer = new Array(this.buffer.length);
    this.head = 0;
    this.size = 0;
  }

  getSize(): number {
    return this.size;
  }

  getCapacity(): number {
    return this.buffer.length;
  }
}
