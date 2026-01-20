// Middleware pattern implementation
export type Middleware<T = any> = (context: T, next: () => Promise<void>) => Promise<void>;

export class MiddlewareChain<T = any> {
  private middlewares: Middleware<T>[] = [];

  use(middleware: Middleware<T>): this {
    this.middlewares.push(middleware);
    return this;
  }

  async execute(context: T): Promise<void> {
    let index = -1;

    const dispatch = async (): Promise<void> => {
      if (++index >= this.middlewares.length) return;
      await this.middlewares[index](context, dispatch);
    };

    await dispatch();
  }
}

// Example middleware factory
export function createLoggingMiddleware<T>(logger: any): Middleware<T> {
  return async (context, next) => {
    logger.info('Middleware start', context);
    try {
      await next();
      logger.info('Middleware success');
    } catch (error) {
      logger.error('Middleware error', error);
      throw error;
    }
  };
}
