import { describe, it, expect } from 'vitest';

function isValidNonce(n: string): boolean {
  return typeof n === 'string' && /^0x[0-9a-fA-F]{64}$/.test(n);
}

describe('nonce format', () => {
  it('accepts 0x-prefixed 32-byte hex', () => {
    expect(isValidNonce('0x' + 'a'.repeat(64))).toBe(true);
  });

  it('rejects missing 0x', () => {
    expect(isValidNonce('a'.repeat(64))).toBe(false);
  });

  it('rejects wrong length', () => {
    expect(isValidNonce('0x' + 'a'.repeat(62))).toBe(false);
  });
});


