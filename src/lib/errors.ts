/**
 * Error handling utilities for Bass Ball
 * 
 * Provides a hierarchy of error classes for different error scenarios,
 * with support for error codes, metadata, and proper error chaining.
 */

/** Base game error with error code and metadata support */
export class GameError extends Error {
  public readonly code: string;
  public readonly metadata?: Record<string, unknown>;
  public readonly timestamp: number;

  constructor(
    message: string,
    code: string = 'GAME_ERROR',
    metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'GameError';
    this.code = code;
    this.metadata = metadata;
    this.timestamp = Date.now();
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /** Serialize error for logging */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      metadata: this.metadata,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

/** Validation error for invalid input or state */
export class ValidationError extends GameError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', metadata);
    this.name = 'ValidationError';
  }
}

/** Resource not found error */
export class NotFoundError extends GameError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'NOT_FOUND', metadata);
    this.name = 'NotFoundError';
  }
}

/** Authentication/authorization error */
export class UnauthorizedError extends GameError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'UNAUTHORIZED', metadata);
    this.name = 'UnauthorizedError';
  }
}

/** Resource conflict error (e.g., duplicate entry) */
export class ConflictError extends GameError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'CONFLICT', metadata);
    this.name = 'ConflictError';
  }
}

/** Network/API communication error */
export class NetworkError extends GameError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', metadata);
    this.name = 'NetworkError';
  }
}

/** Timeout error */
export class TimeoutError extends GameError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'TIMEOUT', metadata);
    this.name = 'TimeoutError';
  }
}

/** Rate limit exceeded error */
export class RateLimitError extends GameError {
  constructor(
    message: string = 'Rate limit exceeded',
    public readonly retryAfter?: number,
    metadata?: Record<string, unknown>
  ) {
    super(message, 'RATE_LIMIT', { ...metadata, retryAfter });
    this.name = 'RateLimitError';
  }
}
