/**
 * Shared error types for x402 protocol services
 * Following x402 specification error response format
 */

export class PaymentError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 402,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

export class VerificationError extends PaymentError {
  constructor(message: string, code: string, details?: Record<string, unknown>) {
    super(message, code, 402, details);
    this.name = 'VerificationError';
  }
}

export class SettlementError extends PaymentError {
  constructor(message: string, code: string, details?: Record<string, unknown>) {
    super(message, code, 500, details);
    this.name = 'SettlementError';
  }
}

export class ValidationError extends PaymentError {
  constructor(message: string, code: string = 'validation_error', details?: Record<string, unknown>) {
    super(message, code, 400, details);
    this.name = 'ValidationError';
  }
}

export class ConfigurationError extends Error {
  constructor(message: string, public readonly missingVars?: string[]) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

/**
 * Error codes following x402 specification
 */
export const ErrorCodes = {
  // Payment required (402)
  PAYMENT_REQUIRED: 'payment_required',
  PAYMENT_INVALID: 'payment_invalid',
  PAYMENT_VERIFICATION_FAILED: 'payment_verification_failed',
  PAYMENT_SETTLEMENT_FAILED: 'payment_settlement_failed',
  
  // Verification errors
  INVALID_X402_VERSION: 'invalid_x402_version',
  INVALID_SCHEME: 'invalid_scheme',
  INVALID_NETWORK: 'invalid_network',
  INVALID_PAYLOAD: 'invalid_payload',
  INVALID_ADDRESS_FORMAT: 'invalid_address_format',
  INVALID_NONCE_FORMAT: 'invalid_nonce_format',
  NONCE_REPLAY: 'nonce_replay',
  INVALID_TIME_WINDOW: 'invalid_time_window',
  INVALID_SIGNATURE: 'invalid_signature',
  INVALID_TRANSACTION: 'invalid_transaction',
  INVALID_AMOUNT: 'invalid_amount',
  INVALID_RECIPIENT: 'invalid_recipient',
  
  // Settlement errors
  INSUFFICIENT_FUNDS: 'insufficient_funds',
  INVALID_BLOCKHASH: 'invalid_blockhash',
  SIGNATURE_ERROR: 'signature_error',
  TRANSACTION_FAILED: 'transaction_failed',
  
  // Validation errors
  BAD_REQUEST: 'bad_request',
  MISSING_PAYMENT_HEADER: 'missing_payment_header',
  MISSING_PAYMENT_REQUIREMENTS: 'missing_payment_requirements',
  
  // Server errors
  INTERNAL_ERROR: 'internal_error',
  FACILITATOR_ERROR: 'facilitator_error',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * Create x402-compliant error response
 */
export function createX402ErrorResponse(
  error: PaymentError | Error,
  accepts?: Array<Record<string, unknown>>
): {
  x402Version: number;
  error: string;
  accepts?: Array<Record<string, unknown>>;
  details?: Record<string, unknown>;
} {
  const code = error instanceof PaymentError ? error.code : ErrorCodes.INTERNAL_ERROR;
  const message = error.message || 'An error occurred';
  
  return {
    x402Version: 1,
    error: code,
    ...(accepts && accepts.length > 0 ? { accepts } : {}),
    ...(error instanceof PaymentError && error.details ? { details: error.details } : {}),
  };
}

