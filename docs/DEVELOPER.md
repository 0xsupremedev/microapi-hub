# MicroAPI Hub Developer Guide

## Overview

This guide helps developers integrate x402 payments into their APIs and applications using MicroAPI Hub.

---

## Quick Start

### 1. Add Payment Protection to Your API

```typescript
import express from 'express';
import fetch from 'node-fetch';

const app = express();
const FACILITATOR_URL = process.env.FACILITATOR_URL || 'http://localhost:8787';

// Protected endpoint
app.get('/api/premium-data', async (req, res) => {
  const paymentHeader = req.header('x-payment');
  
  if (!paymentHeader) {
    // Return 402 with payment requirements
    return res.status(402).json({
      x402Version: 1,
      error: 'X-PAYMENT header is required',
      accepts: [{
        scheme: 'exact',
        network: 'solana-devnet',
        maxAmountRequired: '1000000', // 1 USDC (6 decimals)
        resource: 'GET /api/premium-data',
        description: 'Premium market data',
        mimeType: 'application/json',
        payTo: 'YOUR_SOLANA_PUBKEY',
        maxTimeoutSeconds: 60,
        asset: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC devnet
      }]
    });
  }
  
  // Verify payment with facilitator
  const verifyRes = await fetch(`${FACILITATOR_URL}/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      x402Version: 1,
      paymentHeader,
      paymentRequirements: {
        scheme: 'exact',
        network: 'solana-devnet',
        maxAmountRequired: '1000000',
        resource: 'GET /api/premium-data',
        payTo: 'YOUR_SOLANA_PUBKEY',
        maxTimeoutSeconds: 60,
        asset: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      }
    })
  });
  
  const verifyJson = await verifyRes.json();
  if (!verifyJson.isValid) {
    return res.status(402).json({
      x402Version: 1,
      error: verifyJson.invalidReason,
      accepts: [/* payment requirements */]
    });
  }
  
  // Settle payment
  const settleRes = await fetch(`${FACILITATOR_URL}/settle`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      x402Version: 1,
      paymentHeader,
      paymentRequirements: { /* same as above */ }
    })
  });
  
  const settlement = await settleRes.json();
  if (!settlement.success) {
    return res.status(402).json({
      x402Version: 1,
      error: 'payment_settlement_failed',
      details: settlement.error
    });
  }
  
  // Payment successful - return resource
  res.setHeader('x-payment-response', 
    Buffer.from(JSON.stringify(settlement)).toString('base64')
  );
  
  res.json({
    data: {
      premiumMarketData: '...',
      timestamp: new Date().toISOString()
    }
  });
});
```

---

## Integration Patterns

### Pattern 1: Middleware-Based Protection

```typescript
function createX402Middleware(facilitatorUrl: string, requirements: PaymentRequirements) {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const paymentHeader = req.header('x-payment');
    
    if (!paymentHeader) {
      return res.status(402).json({
        x402Version: 1,
        error: 'X-PAYMENT header is required',
        accepts: [requirements]
      });
    }
    
    // Verify and settle
    const verified = await verifyAndSettle(facilitatorUrl, paymentHeader, requirements);
    if (!verified) {
      return res.status(402).json({
        x402Version: 1,
        error: 'payment_verification_failed',
        accepts: [requirements]
      });
    }
    
    next();
  };
}

// Usage
app.get('/api/data', 
  createX402Middleware(FACILITATOR_URL, {
    scheme: 'exact',
    network: 'solana-devnet',
    maxAmountRequired: '1000000',
    resource: 'GET /api/data',
    payTo: 'YOUR_PUBKEY',
    maxTimeoutSeconds: 60,
    asset: 'USDC_MINT',
  }),
  (req, res) => {
    res.json({ data: 'premium content' });
  }
);
```

---

### Pattern 2: Client SDK

```typescript
import { X402Client } from '@microapi/x402-client';

const client = new X402Client({
  facilitatorUrl: 'http://localhost:8787',
  wallet: wallet, // Solana wallet adapter
  network: 'devnet'
});

// Make paid request
const response = await client.request('http://api.example.com/data', {
  amount: '1000000',
  asset: 'USDC'
});

console.log(response.data);
console.log(response.settlement.txHash);
```

---

## Client Integration

### Browser (JavaScript)

```javascript
async function makePaidRequest(resourceUrl, walletPublicKey) {
  // Step 1: Get payment requirements
  const response = await fetch(resourceUrl);
  if (response.status !== 402) {
    throw new Error('Expected 402 Payment Required');
  }
  
  const { accepts } = await response.json();
  const requirements = accepts[0];
  
  // Step 2: Create payment authorization
  const nowSec = Math.floor(Date.now() / 1000);
  const nonce = `0x${Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')}`;
  
  const paymentPayload = {
    x402Version: 1,
    scheme: requirements.scheme,
    network: requirements.network,
    payload: {
      signature: 'demo-signature',
      authorization: {
        from: walletPublicKey.toBase58(),
        to: requirements.payTo,
        value: requirements.maxAmountRequired,
        validAfter: String(nowSec - 5),
        validBefore: String(nowSec + requirements.maxTimeoutSeconds),
        nonce
      }
    }
  };
  
  const paymentHeader = btoa(JSON.stringify(paymentPayload));
  
  // Step 3: Make paid request
  const paidResponse = await fetch(resourceUrl, {
    headers: { 'X-PAYMENT': paymentHeader }
  });
  
  return paidResponse.json();
}
```

---

## Best Practices

### 1. Nonce Generation

Always use cryptographically secure random nonces:

```typescript
import crypto from 'crypto';

const nonceBytes = crypto.randomBytes(32);
const nonce = `0x${nonceBytes.toString('hex')}`;
```

### 2. Time Windows

Set appropriate time windows:
- `validAfter`: Current time minus 5 seconds (clock skew tolerance)
- `validBefore`: Current time plus timeout (typically 60-300 seconds)

### 3. Error Handling

Handle all error cases:
- 402 responses (payment required)
- Verification failures
- Settlement failures
- Network errors

### 4. Transaction Verification

Verify transactions on-chain before providing access:
```typescript
const connection = new Connection(RPC_URL);
const tx = await connection.getTransaction(txHash);
if (tx && !tx.meta?.err) {
  // Payment confirmed
}
```

---

## Testing

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';

describe('Payment Flow', () => {
  it('should return 402 without payment header', async () => {
    const res = await fetch('http://localhost:8080/api/data');
    expect(res.status).toBe(402);
  });
  
  it('should accept valid payment', async () => {
    const paymentHeader = createPaymentHeader(walletPublicKey, requirements);
    const res = await fetch('http://localhost:8080/api/data', {
      headers: { 'X-PAYMENT': paymentHeader }
    });
    expect(res.status).toBe(200);
  });
});
```

---

## Deployment

### Environment Variables

**Facilitator:**
- `PORT`: Server port (default: 8787)
- `NETWORK`: Solana network (devnet, mainnet-beta)
- `RPC_URL`: Solana RPC endpoint
- `FEE_PAYER_SECRET`: Base58-encoded keypair (optional, auto-generated on devnet)

**Provider API:**
- `PORT`: Server port (default: 8080)
- `PAY_TO_PUBKEY`: Your Solana public key
- `USDC_MINT`: USDC mint address
- `FACILITATOR_URL`: Facilitator service URL

---

## Registry Integration

Register your API on-chain:

```typescript
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { REGISTRY_PROGRAM_ID } from './registry';

const program = new Program(idl, REGISTRY_PROGRAM_ID, provider);

await program.methods
  .createListing(
    endpointUrl,
    description,
    priceUsdCents,
    tokenMint,
    category,
    logoUrl
  )
  .accounts({
    provider: wallet.publicKey,
    listing: listingPda,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

---

## Resources

- **x402 Specification**: https://github.com/coinbase/x402
- **Solana Docs**: https://docs.solana.com
- **Examples**: `/examples`
- **API Docs**: `/api`

---

## Support

- **GitHub Issues**: [Repository URL]/issues
- **Discord**: [Discord URL]
- **Email**: [Support Email]

