// Worker pool for background tasks
export interface Task<T> {
  execute(): Promise<T>;
}

export class WorkerPool {
  private workers: Promise<any>[] = [];
  private maxWorkers: number;
  private tasks: Task<any>[] = [];

  constructor(maxWorkers: number = 4) {
    this.maxWorkers = maxWorkers;
  }

  async execute<T>(task: Task<T>): Promise<T> {
    if (this.workers.length < this.maxWorkers) {
      const promise = task.execute().finally(() => {
        this.workers = this.workers.filter(w => w !== promise);
      });
      this.workers.push(promise);
      return promise;
    }

    this.tasks.push(task);
    await Promise.race(this.workers);
    return this.execute(task);
  }

  async waitAll(): Promise<void> {
    await Promise.all(this.workers);
  }

  getWorkerCount(): number {
    return this.workers.length;
  }
}
