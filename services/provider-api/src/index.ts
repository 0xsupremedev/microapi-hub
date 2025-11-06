import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pino from 'pino';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import fetch from 'node-fetch';
import { loadConfig } from './config';

const log = pino();
const app = express();
app.use(cors());
app.use(express.json());

// Load and validate configuration
let config;
try {
  config = loadConfig();
} catch (error) {
  log.error({ error: error instanceof Error ? error.message : 'unknown' }, 'Failed to load configuration');
  process.exit(1);
}

const { PORT, PAY_TO_PUBKEY, USDC_MINT, FACILITATOR_URL } = config;

// Simple route map config (amounts in atomic token units)
type GuardConfig = {
  amountAtomic: string;
  description: string;
};

const guardMap: Record<string, GuardConfig> = {
  'GET /api/data': {
    amountAtomic: '1',
    description: 'Sample data API (pay-per-call)'
  }
};

// Build x402 PaymentRequirementsResponse
function buildPaymentRequirementsResponse(method: string, path: string, cfg: GuardConfig) {
  const resource = `${method} ${path}`;
  return {
    x402Version: 1,
    error: 'X-PAYMENT header is required',
    accepts: [
      {
        scheme: 'exact',
        network: 'solana-devnet',
        maxAmountRequired: cfg.amountAtomic,
        resource,
        description: cfg.description,
        mimeType: 'application/json',
        outputSchema: null,
        payTo: PAY_TO_PUBKEY,
        maxTimeoutSeconds: 60,
        asset: USDC_MINT,
        extra: { name: 'USDC', version: '2' }
      }
    ]
  };
}

// Minimal x402 guard middleware
async function x402Guard(req: express.Request, res: express.Response, next: express.NextFunction) {
  const key = `${req.method} ${req.path}`;
  const cfg = guardMap[key];
  if (!cfg) return next();

  const paymentHeader = req.header('x-payment') || req.header('X-PAYMENT');
  if (!paymentHeader) {
    const payload = buildPaymentRequirementsResponse(req.method, req.path, cfg);
    return res.status(402).json(payload);
  }

  try {
    // Select our single accepted requirement
    const requirements = buildPaymentRequirementsResponse(req.method, req.path, cfg).accepts[0];

    const verifyRes = await fetch(`${FACILITATOR_URL}/verify`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        x402Version: 1,
        paymentHeader,
        paymentRequirements: requirements
      })
    });
    if (!verifyRes.ok) {
      const body = await verifyRes.text();
      log.warn({ status: verifyRes.status, body, resource: key }, 'payment verification failed');
      return res.status(402).json({ error: 'payment_verification_failed', details: body });
    }
    const verifyJson = (await verifyRes.json()) as { isValid: boolean; invalidReason?: string | null };
    if (!verifyJson.isValid) {
      log.warn({ invalidReason: verifyJson.invalidReason, resource: key }, 'payment validation failed');
      return res.status(402).json({ error: 'payment_invalid', reason: verifyJson.invalidReason ?? 'unknown' });
    }

    const settleRes = await fetch(`${FACILITATOR_URL}/settle`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        x402Version: 1,
        paymentHeader,
        paymentRequirements: requirements
      })
    });
    if (!settleRes.ok) {
      const body = await settleRes.text();
      log.error({ status: settleRes.status, body, resource: key }, 'payment settlement failed');
      return res.status(402).json({ error: 'payment_settlement_failed', details: body });
    }
    const settlement = await settleRes.json() as { success: boolean; error?: string | null; txHash?: string | null; networkId?: string | null; payer?: string | null };
    if (!settlement.success) {
      log.error({ settlement, resource: key }, 'payment settlement unsuccessful');
      return res.status(402).json({ error: 'payment_settlement_failed', details: settlement.error ?? 'unknown' });
    }
    res.setHeader('x-payment-response', Buffer.from(JSON.stringify(settlement)).toString('base64'));
    return next();
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'unknown_error';
    log.error({ 
      error: errorMessage, 
      stack: e instanceof Error ? e.stack : undefined,
      resource: `${req.method} ${req.path}`
    }, 'x402 guard error');
    return res.status(500).json({ error: 'internal_error' });
  }
}

app.use(x402Guard);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('/.well-known/x402', (_req, res) => {
  const accepts = Object.entries(guardMap).map(([route, cfg]) => ({
    route,
    requirements: {
      scheme: 'exact',
      network: 'solana-devnet',
      maxAmountRequired: cfg.amountAtomic,
      resource: route,
      description: cfg.description,
      mimeType: 'application/json',
      outputSchema: null,
      payTo: PAY_TO_PUBKEY,
      maxTimeoutSeconds: 60,
      asset: USDC_MINT,
      extra: { name: 'USDC', version: '2' }
    }
  }));
  res.json({ x402Version: 1, accepts });
});

app.get('/api/data', (_req, res) => {
  res.json({
    data: {
      message: 'Hello from MicroAPI Hub provider',
      ts: new Date().toISOString()
    }
  });
});

app.listen(PORT, () => {
  log.info({ PORT }, 'provider-api listening');
});


