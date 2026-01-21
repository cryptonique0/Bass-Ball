import type { Address } from 'viem';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Error codes for consistent error handling
 */
export enum ErrorCode {
  // Wallet errors
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  WALLET_WRONG_CHAIN = 'WALLET_WRONG_CHAIN',
  WALLET_INSUFFICIENT_BALANCE = 'WALLET_INSUFFICIENT_BALANCE',

  // Transaction errors
  TX_FAILED = 'TX_FAILED',
  TX_REVERTED = 'TX_REVERTED',
  TX_GAS_ESTIMATION_FAILED = 'TX_GAS_ESTIMATION_FAILED',
  TX_TIMEOUT = 'TX_TIMEOUT',
  TX_PENDING = 'TX_PENDING',

  // Contract errors
  CONTRACT_NOT_FOUND = 'CONTRACT_NOT_FOUND',
  CONTRACT_CALL_FAILED = 'CONTRACT_CALL_FAILED',
  CONTRACT_INSUFFICIENT_ALLOWANCE = 'CONTRACT_INSUFFICIENT_ALLOWANCE',

  // Signature errors
  SIGNATURE_INVALID = 'SIGNATURE_INVALID',
  SIGNATURE_REJECTED = 'SIGNATURE_REJECTED',
  SIGNATURE_EXPIRED = 'SIGNATURE_EXPIRED',

  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  RPC_ERROR = 'RPC_ERROR',
  PROVIDER_UNAVAILABLE = 'PROVIDER_UNAVAILABLE',

  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  INVALID_AMOUNT = 'INVALID_AMOUNT',

  // System errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  TIMEOUT = 'TIMEOUT',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
}

/**
 * Base custom error class
 */
export class CustomError extends Error {
  public readonly code: ErrorCode;
  public readonly severity: ErrorSeverity;
  public readonly context: Record<string, any>;
  public readonly timestamp: number;
  public readonly userMessage: string;
  public readonly cause?: Error;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.INTERNAL_ERROR,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: Record<string, any>,
    cause?: Error,
    userMessage?: string
  ) {
    super(message);
    this.name = 'CustomError';
    this.code = code;
    this.severity = severity;
    this.context = context || {};
    this.timestamp = Date.now();
    this.cause = cause;
    this.userMessage = userMessage || message;

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, CustomError.prototype);
  }

  /**
   * Convert error to serializable object
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      severity: this.severity,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }

  /**
   * Add context data
   */
  addContext(key: string, value: any): this {
    this.context[key] = value;
    return this;
  }

  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    const retryableCodes = [
      ErrorCode.NETWORK_ERROR,
      ErrorCode.RPC_ERROR,
      ErrorCode.TX_TIMEOUT,
      ErrorCode.TX_PENDING,
      ErrorCode.PROVIDER_UNAVAILABLE,
    ];
    return retryableCodes.includes(this.code);
  }
}

/**
 * Wallet-specific errors
 */
export class WalletError extends CustomError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.WALLET_NOT_CONNECTED,
    context?: Record<string, any>,
    userMessage?: string
  ) {
    super(message, code, ErrorSeverity.HIGH, context, undefined, userMessage);
    this.name = 'WalletError';
    Object.setPrototypeOf(this, WalletError.prototype);
  }
}

/**
 * Transaction-specific errors
 */
export class TransactionError extends CustomError {
  public readonly txHash?: string;
  public readonly gasUsed?: bigint;
  public readonly reason?: string;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.TX_FAILED,
    context?: Record<string, any>,
    txHash?: string,
    reason?: string,
    userMessage?: string
  ) {
    super(message, code, ErrorSeverity.HIGH, context, undefined, userMessage);
    this.name = 'TransactionError';
    this.txHash = txHash;
    this.reason = reason;
    Object.setPrototypeOf(this, TransactionError.prototype);
  }
}

/**
 * Contract interaction errors
 */
export class ContractError extends CustomError {
  public readonly contractAddress?: Address;
  public readonly functionName?: string;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.CONTRACT_CALL_FAILED,
    context?: Record<string, any>,
    contractAddress?: Address,
    functionName?: string,
    userMessage?: string
  ) {
    super(message, code, ErrorSeverity.MEDIUM, context, undefined, userMessage);
    this.name = 'ContractError';
    this.contractAddress = contractAddress;
    this.functionName = functionName;
    Object.setPrototypeOf(this, ContractError.prototype);
  }
}

/**
 * Signature/Authentication errors
 */
export class SignatureError extends CustomError {
  public readonly signer?: Address;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.SIGNATURE_INVALID,
    context?: Record<string, any>,
    signer?: Address,
    userMessage?: string
  ) {
    super(message, code, ErrorSeverity.HIGH, context, undefined, userMessage);
    this.name = 'SignatureError';
    this.signer = signer;
    Object.setPrototypeOf(this, SignatureError.prototype);
  }
}

/**
 * Network/RPC errors
 */
export class NetworkError extends CustomError {
  public readonly endpoint?: string;
  public readonly statusCode?: number;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.NETWORK_ERROR,
    context?: Record<string, any>,
    endpoint?: string,
    statusCode?: number,
    userMessage?: string
  ) {
    super(
      message,
      code,
      statusCode === 429 || statusCode === 502 ? ErrorSeverity.MEDIUM : ErrorSeverity.HIGH,
      context,
      undefined,
      userMessage
    );
    this.name = 'NetworkError';
    this.endpoint = endpoint;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Validation errors
 */
export class ValidationError extends CustomError {
  public readonly field?: string;
  public readonly value?: any;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.VALIDATION_ERROR,
    context?: Record<string, any>,
    field?: string,
    value?: any,
    userMessage?: string
  ) {
    super(message, code, ErrorSeverity.LOW, context, undefined, userMessage);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Timeout errors
 */
export class TimeoutError extends CustomError {
  public readonly timeout: number;

  constructor(
    message: string,
    timeout: number,
    context?: Record<string, any>,
    userMessage?: string
  ) {
    super(message, ErrorCode.TIMEOUT, ErrorSeverity.MEDIUM, context, undefined, userMessage);
    this.name = 'TimeoutError';
    this.timeout = timeout;
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Type guard to check if error is CustomError
 */
export const isCustomError = (error: any): error is CustomError => {
  return error instanceof CustomError;
};

/**
 * Error factory for common scenarios
 */
export const errorFactory = {
  walletNotConnected: (userMessage?: string) =>
    new WalletError(
      'Wallet is not connected',
      ErrorCode.WALLET_NOT_CONNECTED,
      {},
      userMessage || 'Please connect your wallet to continue'
    ),

  wrongChain: (expectedChain: string, currentChain?: string) =>
    new WalletError(
      `Wrong chain. Expected ${expectedChain}, got ${currentChain}`,
      ErrorCode.WALLET_WRONG_CHAIN,
      { expectedChain, currentChain },
      `Please switch to ${expectedChain} network`
    ),

  insufficientBalance: (required: string, available: string) =>
    new WalletError(
      `Insufficient balance. Required: ${required}, Available: ${available}`,
      ErrorCode.WALLET_INSUFFICIENT_BALANCE,
      { required, available },
      'Your wallet balance is too low for this transaction'
    ),

  transactionFailed: (txHash: string, reason?: string) =>
    new TransactionError(
      `Transaction failed: ${reason || 'Unknown error'}`,
      ErrorCode.TX_FAILED,
      { txHash, reason },
      txHash,
      reason,
      'The transaction could not be completed. Please try again.'
    ),

  contractCallFailed: (address: Address, functionName: string, reason?: string) =>
    new ContractError(
      `Contract call failed: ${functionName} at ${address}`,
      ErrorCode.CONTRACT_CALL_FAILED,
      { address, functionName, reason },
      address,
      functionName,
      `Contract call "${functionName}" failed. Please try again.`
    ),

  signatureInvalid: (signer: Address, reason?: string) =>
    new SignatureError(
      `Invalid signature from ${signer}: ${reason}`,
      ErrorCode.SIGNATURE_INVALID,
      { signer, reason },
      signer,
      'Signature validation failed. Please try signing again.'
    ),

  networkError: (endpoint: string, statusCode?: number) =>
    new NetworkError(
      `Network error connecting to ${endpoint}`,
      ErrorCode.NETWORK_ERROR,
      { endpoint, statusCode },
      endpoint,
      statusCode,
      'Network connection failed. Please check your connection and try again.'
    ),

  timeout: (operation: string, timeout: number) =>
    new TimeoutError(
      `Operation timeout: ${operation} (${timeout}ms)`,
      timeout,
      { operation },
      `${operation} took too long. Please try again.`
    ),
};
