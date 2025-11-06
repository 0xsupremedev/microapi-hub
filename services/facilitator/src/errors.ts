/**
 * Facilitator-specific error handling
 */
import { PaymentError, VerificationError, SettlementError, ErrorCodes } from '../../../shared/types/errors';

export class FacilitatorError extends PaymentError {
  constructor(message: string, code: string, details?: Record<string, unknown>) {
    super(message, code, 500, details);
    this.name = 'FacilitatorError';
  }
}

/**
 * Create verification error response
 */
export function createVerificationError(
  reason: string,
  details?: Record<string, unknown>
): VerificationError {
  return new VerificationError(
    `Payment verification failed: ${reason}`,
    reason as ErrorCode || ErrorCodes.PAYMENT_VERIFICATION_FAILED,
    details
  );
}

/**
 * Create settlement error response
 */
export function createSettlementError(
  reason: string,
  details?: Record<string, unknown>
): SettlementError {
  return new SettlementError(
    `Payment settlement failed: ${reason}`,
    reason as ErrorCode || ErrorCodes.PAYMENT_SETTLEMENT_FAILED,
    details
  );
}

