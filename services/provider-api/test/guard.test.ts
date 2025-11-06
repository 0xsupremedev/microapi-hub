import { describe, it, expect } from 'vitest';

// Minimal shape checks for requirements response

function buildRequirements() {
  return {
    x402Version: 1,
    accepts: [
      {
        scheme: 'exact',
        network: 'solana-devnet',
        maxAmountRequired: '1',
        resource: 'GET /api/data',
        description: 'Sample',
        mimeType: 'application/json',
        outputSchema: null,
        payTo: 'To11111111111111111111111111111111111111111',
        maxTimeoutSeconds: 60,
        asset: 'Mint111111111111111111111111111111111111111'
      }
    ]
  };
}

describe('provider requirements', () => {
  it('has expected fields', () => {
    const r = buildRequirements();
    expect(r.x402Version).toBe(1);
    expect(Array.isArray(r.accepts)).toBe(true);
    const a = r.accepts[0];
    expect(a.scheme).toBe('exact');
    expect(a.network).toBe('solana-devnet');
  });
});


