// Observer pattern implementation
export type Observer<T> = (value: T) => void;

export class Observable<T> {
  private observers: Set<Observer<T>> = new Set();
  private value: T;

  constructor(initialValue: T) {
    this.value = initialValue;
  }

  subscribe(observer: Observer<T>): () => void {
    this.observers.add(observer);
    observer(this.value);
    
    return () => this.observers.delete(observer);
  }

  next(value: T): void {
    this.value = value;
    this.observers.forEach(observer => observer(value));
  }

  getValue(): T {
    return this.value;
  }

  complete(): void {
    this.observers.clear();
  }
}
