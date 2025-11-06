/**
 * Shared type definitions for x402 payment protocol
 * These types match the x402 specification and are used across services
 */

export interface PaymentRequirements {
  scheme: string;
  network: string;
  maxAmountRequired: string;
  resource: string;
  description?: string;
  mimeType?: string;
  outputSchema?: Record<string, unknown> | null;
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string;
  extra?: Record<string, unknown> | null;
}

export interface ExactSvmAuthorization {
  from: string;
  to: string;
  value: string;
  validAfter: string;
  validBefore: string;
  nonce: string;
}

export interface ExactSvmPayload {
  signature: string;
  authorization: ExactSvmAuthorization;
}

export interface PaymentPayload {
  x402Version: number;
  scheme: string;
  network: string;
  payload: ExactSvmPayload;
}

export interface PaymentRequirementsResponse {
  x402Version: number;
  error?: string;
  accepts: PaymentRequirements[];
}

export interface VerifyRequest {
  x402Version: number;
  paymentHeader: string;
  paymentRequirements: PaymentRequirements;
}

export interface VerifyResponse {
  isValid: boolean;
  invalidReason?: string | null;
}

export interface SettleRequest {
  x402Version: number;
  paymentHeader: string;
  paymentRequirements: PaymentRequirements;
}

export interface SettleResponse {
  success: boolean;
  error?: string | null;
  txHash?: string | null;
  networkId?: string | null;
  payer?: string | null;
}

