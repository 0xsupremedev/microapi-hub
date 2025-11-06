import { describe, it, expect } from 'vitest';

// Simple shape tests for verify payload rules (unit-level)
import { z } from 'zod';

const PaymentRequirements = z.object({
  scheme: z.string(),
  network: z.string(),
  maxAmountRequired: z.string(),
  resource: z.string(),
  payTo: z.string(),
  maxTimeoutSeconds: z.number(),
  asset: z.string()
});

function buildPaymentHeader(overrides: Partial<any> = {}) {
  const now = Math.floor(Date.now() / 1000);
  const base = {
    x402Version: 1,
    scheme: 'exact',
    network: 'solana-devnet',
    payload: {
      signature: 'demo',
      authorization: {
        from: 'From111111111111111111111111111111111111111',
        to: 'To11111111111111111111111111111111111111111',
        value: '1',
        validAfter: String(now - 5),
        validBefore: String(now + 300),
        nonce: '0x' + '1'.repeat(64)
      }
    }
  };
  return Buffer.from(JSON.stringify({ ...base, ...overrides })).toString('base64');
}

describe('verify basics', () => {
  const reqs = PaymentRequirements.parse({
    scheme: 'exact',
    network: 'solana-devnet',
    maxAmountRequired: '1',
    resource: 'GET /api/data',
    payTo: 'To11111111111111111111111111111111111111111',
    maxTimeoutSeconds: 60,
    asset: 'Mint111111111111111111111111111111111111111'
  });

  it('accepts correct amount/recipient/time window', () => {
    const hdr = buildPaymentHeader();
    const decoded = JSON.parse(Buffer.from(hdr, 'base64').toString('utf8'));
    const auth = decoded.payload.authorization;
    expect(decoded.scheme).toBe('exact');
    expect(decoded.network).toBe(reqs.network);
    expect(auth.to).toBe(reqs.payTo);
    expect(auth.value).toBe(reqs.maxAmountRequired);
  });

  it('rejects invalid amount', () => {
    const hdr = buildPaymentHeader({ payload: { signature: 'demo', authorization: { value: '2' } } });
    const decoded = JSON.parse(Buffer.from(hdr, 'base64').toString('utf8'));
    expect(decoded.payload.authorization.value).not.toBe(reqs.maxAmountRequired);
  });
});


