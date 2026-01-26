/**
 * Circular buffer (ring buffer) implementation
 * 
 * Efficient fixed-size FIFO buffer that overwrites oldest data when full.
 * Useful for sliding windows, history tracking, and performance monitoring.
 */

/**
 * Generic circular buffer with fixed capacity
 * 
 * @example
 * ```ts
 * const buffer = new CircularBuffer<number>(3);
 * buffer.push(1);
 * buffer.push(2);
 * buffer.push(3);
 * buffer.push(4); // Overwrites 1
 * buffer.getAll(); // [2, 3, 4]
 * ```
 */
export class CircularBuffer<T> {
  private buffer: (T | undefined)[];
  private head: number = 0;
  private size: number = 0;
  private readonly capacity: number;

  /**
   * Create a circular buffer with fixed capacity
   * @param capacity - Maximum number of elements
   * @throws {Error} If capacity is less than 1
   */
  constructor(capacity: number) {
    if (capacity < 1) {
      throw new Error('Circular buffer capacity must be at least 1');
    }
    this.capacity = capacity;
    this.buffer = new Array(capacity);
  }

  /**
   * Add an element to the buffer
   * Overwrites oldest element if buffer is full
   */
  push(value: T): void {
    this.buffer[this.head] = value;
    this.head = (this.head + 1) % this.capacity;
    if (this.size < this.capacity) {
      this.size++;
    }
  }

  /**
   * Get element at index (0 = oldest, size-1 = newest)
   * @returns Element or undefined if index out of range
   */
  get(index: number): T | undefined {
    if (index < 0 || index >= this.size) return undefined;
    const actualIndex = (this.head - this.size + index + this.capacity) % this.capacity;
    return this.buffer[actualIndex];
  }

  /**
   * Get the newest element
   */
  getLast(): T | undefined {
    return this.size > 0 ? this.get(this.size - 1) : undefined;
  }

  /**
   * Get the oldest element
   */
  getFirst(): T | undefined {
    return this.size > 0 ? this.get(0) : undefined;
  }

  /**
   * Get all elements as array (oldest to newest)
   */
  getAll(): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.size; i++) {
      const element = this.get(i);
      if (element !== undefined) {
        result.push(element);
      }
    }
    return result;
  }

  /**
   * Clear all elements from buffer
   */
  clear(): void {
    this.buffer = new Array(this.capacity);
    this.head = 0;
    this.size = 0;
  }

  /**
   * Get current number of elements
   */
  getSize(): number {
    return this.size;
  }

  /**
   * Get maximum capacity
   */
  getCapacity(): number {
    return this.capacity;
  }

  /**
   * Check if buffer is empty
   */
  isEmpty(): boolean {
    return this.size === 0;
  }

  /**
   * Check if buffer is full
   */
  isFull(): boolean {
    return this.size === this.capacity;
  }

  /**
   * Iterate over all elements (oldest to newest)
   */
  forEach(callback: (element: T, index: number) => void): void {
    for (let i = 0; i < this.size; i++) {
      const element = this.get(i);
      if (element !== undefined) {
        callback(element, i);
      }
    }
  }

  /**
   * Map buffer to new array
   */
  map<U>(callback: (element: T, index: number) => U): U[] {
    const result: U[] = [];
    this.forEach((element, index) => {
      result.push(callback(element, index));
    });
    return result;
  }

  /**
   * Filter buffer elements
   */
  filter(predicate: (element: T, index: number) => boolean): T[] {
    const result: T[] = [];
    this.forEach((element, index) => {
      if (predicate(element, index)) {
        result.push(element);
      }
    });
    return result;
  }
}
