// Singleton pattern utility
export function createSingleton<T>(factory: () => T): () => T {
  let instance: T | null = null;

  return () => {
    if (!instance) {
      instance = factory();
    }
    return instance;
  };
}

// Lazy initialization utility
export class Lazy<T> {
  private value: T | null = null;
  private factory: () => T;

  constructor(factory: () => T) {
    this.factory = factory;
  }

  getValue(): T {
    if (this.value === null) {
      this.value = this.factory();
    }
    return this.value;
  }

  isInitialized(): boolean {
    return this.value !== null;
  }

  reset(): void {
    this.value = null;
  }
}
