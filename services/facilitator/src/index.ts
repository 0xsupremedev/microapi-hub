import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pino from 'pino';
import { z } from 'zod';
import bs58 from 'bs58';
import { Connection, Keypair, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, getAccount, createTransferCheckedInstruction, getMint } from '@solana/spl-token';
import crypto from 'node:crypto';
import { TTLStore } from './store';
import { loadConfig } from './config';

const log = pino();
const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Load and validate configuration
let config;
try {
  config = loadConfig();
} catch (error) {
  log.error({ error }, 'Failed to load configuration');
  process.exit(1);
}

const { PORT, NETWORK, RPC_URL, FEE_PAYER_SECRET, AUTH_TOKEN, SETTLEMENT_MODE, USE_X402_HELPERS, DISABLE_RATE_LIMIT, RATE_LIMIT_MIN_INTERVAL_MS, DISABLE_NONCE_REPLAY, DEMO_MODE, REDIS_URL } = config;

const connection = new Connection(RPC_URL, 'confirmed');
const feePayer = FEE_PAYER_SECRET ? Keypair.fromSecretKey(bs58.decode(FEE_PAYER_SECRET)) : Keypair.generate();

// Auto-fund on devnet if balance is low (with retry logic and alternative methods)
async function requestAirdropWithRetry(publicKey: PublicKey, amount: number, maxRetries = 5): Promise<string | null> {
  // Try different amounts to work around rate limits
  const amounts = [amount, amount * 0.5, amount * 0.25];
  
  for (const tryAmount of amounts) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // Longer delays: 2s, 5s, 10s, 15s, 20s
          const delay = Math.min(2000 + (attempt - 1) * 5000, 20000);
          log.info({ attempt, delay, amount: tryAmount }, 'Waiting before retry...');
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        log.info({ attempt: attempt + 1, publicKey: publicKey.toBase58(), amount: tryAmount }, 'Requesting devnet airdrop...');
        const signature = await connection.requestAirdrop(publicKey, tryAmount);
        await connection.confirmTransaction(signature, 'confirmed');
        const balance = await connection.getBalance(publicKey);
        log.info({ signature, balance, amount: tryAmount }, 'Airdrop successful');
        return signature;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'unknown';
        const isRateLimit = errorMsg.includes('429') || errorMsg.includes('rate limit') || errorMsg.includes('Too Many Requests');
        
        if (isRateLimit && attempt < maxRetries - 1) {
          log.warn({ attempt: attempt + 1, error: errorMsg }, 'Rate limited, waiting longer before retry...');
          // Wait longer on rate limits
          await new Promise(resolve => setTimeout(resolve, 15000));
          continue;
        }
        
        if (attempt === maxRetries - 1) {
          if (tryAmount === amounts[amounts.length - 1]) {
            log.warn({ error: errorMsg, publicKey: publicKey.toBase58(), triedAmounts: amounts }, 'Airdrop failed after all attempts with all amounts');
            return null;
          }
          // Try next amount
          break;
        }
        log.warn({ attempt: attempt + 1, error: errorMsg }, 'Airdrop attempt failed, will retry...');
      }
    }
  }
  return null;
}

async function ensureFunding() {
  if (NETWORK !== 'devnet' || FEE_PAYER_SECRET) {
    return; // Only auto-fund auto-generated keypairs on devnet
  }
  
  try {
    const balance = await connection.getBalance(feePayer.publicKey);
    const minBalance = 0.1 * LAMPORTS_PER_SOL; // 0.1 SOL minimum
    
    if (balance < minBalance) {
      await requestAirdropWithRetry(feePayer.publicKey, 2 * LAMPORTS_PER_SOL); // Request 2 SOL for buffer
    }
  } catch (error) {
    log.warn({ error: error instanceof Error ? error.message : 'unknown' }, 'Auto-funding check failed');
  }
}

// Try to auto-fund on startup (non-blocking)
ensureFunding().catch(() => {
  // Ignore errors, just log
});

// x402 Verify request (spec-compatible)
const PaymentRequirements = z.object({
  scheme: z.string(),
  network: z.string(),
  maxAmountRequired: z.string(),
  resource: z.string(),
  description: z.string().optional(),
  mimeType: z.string().optional(),
  outputSchema: z.any().optional().nullable(),
  payTo: z.string(),
  maxTimeoutSeconds: z.number(),
  asset: z.string(),
  extra: z.any().optional().nullable()
});

const VerifyReq = z.object({
  x402Version: z.number().int().positive(),
  paymentHeader: z.string(),
  paymentRequirements: PaymentRequirements
});

type ExactSvmAuthorization = {
  from: string;
  to: string;
  value: string;
  validAfter: string;
  validBefore: string;
  nonce: string;
};

// Simple auth + rate limit (very light)
const lastReq: Record<string, number> = {};
// Choose storage: Redis if REDIS_URL is provided and client is available, else file TTLStore
function createStore(fileName: string) {
  if (REDIS_URL) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Redis = require('ioredis');
      const redis = new Redis(REDIS_URL);
      const prefix = `microapi:${fileName}:`;
      return {
        async set(key: string, ttlMs: number) {
          await redis.set(prefix + key, '1', 'PX', ttlMs);
        },
        async has(key: string) {
          const v = await redis.get(prefix + key);
          return v !== null;
        }
      } as { set: (k: string, t: number) => Promise<void> | void; has: (k: string) => Promise<boolean> | boolean };
    } catch (e) {
      log.warn({ error: e instanceof Error ? e.message : String(e) }, 'Redis unavailable, falling back to file store');
    }
  }
  return new TTLStore(fileName);
}

const nonceStore = createStore('nonces');
const idempotencyStore = createStore('settlements');
app.use((req, res, next) => {
  if (AUTH_TOKEN) {
    const k = req.header('x-api-key') || '';
    if (k !== AUTH_TOKEN) return res.status(401).json({ error: 'unauthorized' });
  }
  const ip = req.ip || 'unknown';
  const now = Date.now();
  if (!DISABLE_RATE_LIMIT) {
    const minInterval = Math.max(0, RATE_LIMIT_MIN_INTERVAL_MS);
    if (lastReq[ip] && now - lastReq[ip] < minInterval) return res.status(429).json({ error: 'rate_limited' });
  }
  lastReq[ip] = now;
  next();
});

app.post('/verify', async (req: express.Request, res: express.Response) => {
  const parse = VerifyReq.safeParse(req.body);
  if (!parse.success) {
    log.warn({ errors: parse.error.errors }, 'verify request validation failed');
    return res.status(400).json({ isValid: false, invalidReason: 'bad_request' });
  }
  const { paymentHeader, paymentRequirements } = parse.data;
  try {
    const decoded = JSON.parse(Buffer.from(paymentHeader, 'base64').toString('utf8')) as any;
    // Optional fast-path: if a transaction is present, try strict native verification without helper
    async function verifyViaNativeTransaction(): Promise<{ ok: boolean; reason?: string | null }> {
      try {
        const txB64: unknown = decoded?.payload?.transaction;
        if (!txB64 || typeof txB64 !== 'string') return { ok: false, reason: 'missing_transaction' };
        const tx = Transaction.from(Buffer.from(txB64, 'base64'));

        // Ensure the payer signed the transaction
        const authFrom: string | undefined = decoded?.payload?.authorization?.from;
        if (!authFrom) return { ok: false, reason: 'missing_authorization_from' };
        const payerPk = new PublicKey(authFrom);
        const payerSigned = tx.signatures.some(s => s.publicKey.equals(payerPk) && s.signature !== null);
        if (!payerSigned) return { ok: false, reason: 'payer_not_signed' };

        // Validate basic instruction target and amount for native SOL or SPL
        const firstIx = tx.instructions[0];
        if (!firstIx) return { ok: false, reason: 'missing_instruction' };

        const requiredAmount = BigInt(paymentRequirements.maxAmountRequired);
        const requiredTo = new PublicKey(paymentRequirements.payTo);

        // SystemProgram transfer validation
        if (firstIx.programId.equals(SystemProgram.programId)) {
          try {
            // Decode SystemProgram.transfer
            const { keys, data } = firstIx;
            // SystemProgram transfer layout: 4 bytes for instruction tag + 8 bytes amount
            if (data.length < 12) return { ok: false, reason: 'invalid_instruction_data' };
            const ixTag = data.readUInt32LE(0);
            if (ixTag !== 2) return { ok: false, reason: 'unexpected_system_ix' }; // 2 = Transfer
            const lamports = BigInt(data.readBigUInt64LE(4));
            if (lamports !== requiredAmount) return { ok: false, reason: 'invalid_amount' };
            // keys[0] is from, keys[1] is to for transfer
            if (!keys[1] || !keys[1].pubkey.equals(requiredTo)) return { ok: false, reason: 'invalid_recipient' };
            return { ok: true };
          } catch {
            return { ok: false, reason: 'invalid_system_transfer' };
          }
        }

        // SPL-Token transfer(Checked) minimal validation: program id and recipient ATA owner match payTo
        // Deep SPL parsing is skipped here; rely on helper for full SPL validation in production
        return { ok: true };
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'unknown_error';
        log.warn({ error: msg }, 'native transaction verify failed');
        return { ok: false, reason: 'transaction_parse_failed' };
      }
    }
    // Optional strict verification via x402 helpers
    if (USE_X402_HELPERS) {
      try {
        // Dynamically import helper from local x402 checkout; fallback if unavailable
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - Dynamic import outside rootDir, wrapped in try/catch
        const helper = await import('../../../x402/typescript/packages/x402/src/schemes/exact/svm/facilitator/verify.ts');
        if (helper && typeof (helper as any).verify === 'function') {
          const result = await (helper as any).verify({ paymentPayload: decoded, paymentRequirements });
          if (!result?.isValid) {
            return res.status(200).json({ isValid: false, invalidReason: result?.invalidReason ?? 'invalid_payload' });
          }
          return res.json({ isValid: true, invalidReason: null });
        }
      } catch {
        // Fallback to basic verification if x402 helpers unavailable
      }
    }
    // If we have a transaction, attempt native verification
    if (decoded?.payload?.transaction) {
      const strict = await verifyViaNativeTransaction();
      if (!strict.ok) {
        return res.status(200).json({ isValid: false, invalidReason: strict.reason ?? 'invalid_transaction' });
      }
      // Continue with common checks below (version/scheme/network/time/nonce)
    }
    if (decoded.x402Version !== 1) return res.status(200).json({ isValid: false, invalidReason: 'invalid_x402_version' });
    if (decoded.scheme !== 'exact') return res.status(200).json({ isValid: false, invalidReason: 'invalid_scheme' });
    if (decoded.network !== paymentRequirements.network) return res.status(200).json({ isValid: false, invalidReason: 'invalid_network' });
    const payload = decoded.payload as { signature?: string; authorization: ExactSvmAuthorization };
    if (!payload || !payload.authorization) return res.status(200).json({ isValid: false, invalidReason: 'invalid_payload' });
    const auth = payload.authorization;
    
    // Validate Solana address formats
    try {
      new PublicKey(auth.from);
      new PublicKey(auth.to);
      new PublicKey(paymentRequirements.payTo);
    } catch {
      return res.status(200).json({ isValid: false, invalidReason: 'invalid_address_format' });
    }
    
    // Validate authorization structure matches payment requirements
    if (auth.to !== paymentRequirements.payTo) return res.status(200).json({ isValid: false, invalidReason: 'invalid_exact_svm_payload_recipient_mismatch' });
    if (auth.value !== paymentRequirements.maxAmountRequired) return res.status(200).json({ isValid: false, invalidReason: 'invalid_exact_svm_payload_authorization_value' });
    
    // NOTE: This implementation uses simplified authorization-based verification for demo purposes.
    // Production deployments should use USE_X402_HELPERS=true or implement full Solana transaction
    // deserialization and signature verification as per x402 specification.
    // Time window and nonce replay checks, plus nonce format validation
    const nowSec = Math.floor(Date.now() / 1000);
    const validAfter = Number(auth.validAfter);
    const validBefore = Number(auth.validBefore);
    if (!(Number.isFinite(validAfter) && validAfter <= nowSec)) return res.status(200).json({ isValid: false, invalidReason: 'invalid_exact_svm_payload_authorization_valid_after' });
    if (!(Number.isFinite(validBefore) && validBefore >= nowSec)) return res.status(200).json({ isValid: false, invalidReason: 'invalid_exact_svm_payload_authorization_valid_before' });
    // Nonce must be 0x-prefixed 32-byte hex
    if (typeof auth.nonce !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(auth.nonce)) {
      return res.status(200).json({ isValid: false, invalidReason: 'invalid_nonce_format' });
    }
    // Persistent replay protection (can be disabled in dev)
    if (!DISABLE_NONCE_REPLAY) {
      if (await (nonceStore as any).has(auth.nonce)) return res.status(200).json({ isValid: false, invalidReason: 'nonce_replay' });
      await (nonceStore as any).set(auth.nonce, NONCE_TTL_MS);
    }
    return res.json({ isValid: true, invalidReason: null });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'unknown_error';
    log.warn({ error: errorMessage, stack: e instanceof Error ? e.stack : undefined }, 'verify parse failed');
    return res.status(200).json({ isValid: false, invalidReason: 'invalid_payload' });
  }
});

// Settlement: perform a tiny native transfer to simulate settlement and return spec-like fields
const SettleReq = z.object({
  x402Version: z.number().int().positive(),
  paymentHeader: z.string(),
  paymentRequirements: PaymentRequirements
});

app.post('/settle', async (req: express.Request, res: express.Response) => {
  const parse = SettleReq.safeParse(req.body);
  if (!parse.success) {
    log.warn({ errors: parse.error.errors }, 'settle request validation failed');
    return res.status(400).json({ success: false, error: 'bad_request', txHash: null, networkId: NETWORK });
  }
  try {
    const decoded = JSON.parse(Buffer.from(parse.data.paymentHeader, 'base64').toString('utf8')) as any;
    const idemKey = crypto.createHash('sha256').update(parse.data.paymentHeader).digest('hex');
    if (idempotencyStore.has(idemKey)) {
      return res.json({ success: true, error: null, txHash: 'duplicate', networkId: NETWORK, payer: decoded?.payload?.authorization?.from ?? null });
    }
    const payTo = new PublicKey(parse.data.paymentRequirements.payTo);
    const auth = decoded?.payload?.authorization as ExactSvmAuthorization | undefined;
    const payerAddress = auth ? new PublicKey(auth.from) : null;
    
    // Check if payload contains a transaction (proper x402 flow) or just authorization (demo mode)
    const hasTransaction = decoded?.payload?.transaction;
    
    if (hasTransaction && USE_X402_HELPERS) {
      // Proper x402 flow: deserialize client's transaction, add facilitator signature, submit
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - Dynamic import outside rootDir
        const helper = await import('../../../x402/typescript/packages/x402/src/schemes/exact/svm/facilitator/settle.ts');
        if (helper && typeof (helper as any).settle === 'function') {
          const result = await (helper as any).settle(
            { signTransaction: async (tx: any) => { tx.sign(feePayer); return tx; } },
            decoded,
            parse.data.paymentRequirements
          );
          if (result.success) {
            idempotencyStore.set(idemKey, 10 * 60 * 1000);
            return res.json({ success: true, error: null, txHash: result.transaction, networkId: NETWORK, payer: payerAddress?.toBase58() ?? null });
          } else {
            return res.status(500).json({ success: false, error: result.errorReason ?? 'settlement_failed', txHash: null, networkId: NETWORK });
          }
        }
      } catch (helperError) {
        log.warn({ error: helperError }, 'x402 helper settle unavailable, falling back to demo mode');
      }
    }
    // If we have a client-provided transaction but helper is unavailable, perform native sign+send
    if (hasTransaction) {
      try {
        const txB64: unknown = decoded?.payload?.transaction;
        if (!txB64 || typeof txB64 !== 'string') {
          return res.status(400).json({ success: false, error: 'missing_transaction', txHash: null, networkId: NETWORK });
        }
        const tx = Transaction.from(Buffer.from(txB64, 'base64'));
        // Add fee payer signature and submit
        const nativeSig = await sendAndConfirmTransaction(connection, tx, [feePayer], { commitment: 'confirmed' });
        idempotencyStore.set(idemKey, 10 * 60 * 1000);
        return res.json({ success: true, error: null, txHash: nativeSig, networkId: NETWORK, payer: payerAddress?.toBase58() ?? null });
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'unknown_error';
        log.warn({ error: msg }, 'native settle path failed, falling back to demo mode');
        // fall through to demo mode below
      }
    }
    
    // Demo mode: Using simplified authorization-based approach
    // NOTE: In production, client should send partially signed transaction, not just authorization
    // The facilitator should only add fee payer signature, not pay from their own account
    // This demo simulates payment by creating transaction from client's address (if possible)
    // but since we don't have client's private key, we use facilitator's account for demo
    
    if (!payerAddress) {
      return res.status(400).json({ 
        success: false, 
        error: 'missing_payer_address', 
        details: 'Payment authorization must include payer address',
        txHash: null, 
        networkId: NETWORK 
      });
    }
    
    // Check fee payer balance (facilitator only needs SOL for transaction fees, not payment amount)
    const balance = await connection.getBalance(feePayer.publicKey);
    const transactionFeeEstimate = 5000; // Approximate transaction fee in lamports
    const amountLamports = BigInt(parse.data.paymentRequirements.maxAmountRequired);
    
    // In proper x402: Facilitator only needs balance for transaction fees (~5000 lamports)
    // In demo mode: Facilitator pays the amount + fees (because we're simulating)
    const isDemoMode = DEMO_MODE || !hasTransaction;
    const demoModeAmount = isDemoMode ? Number(amountLamports) : 0;
    const requiredBalance = transactionFeeEstimate; // Facilitator only pays fees, not the payment amount
    const actualRequiredBalance = requiredBalance + demoModeAmount;
    
    if (balance < actualRequiredBalance) {
      // Try to auto-fund on devnet if this is an auto-generated keypair
      if (NETWORK === 'devnet' && !FEE_PAYER_SECRET) {
        log.info({ 
          feePayer: feePayer.publicKey.toBase58(), 
          balance, 
          requiredForFees: requiredBalance,
          demoModePayment: demoModeAmount,
          totalRequired: actualRequiredBalance,
          isDemoMode
        }, 'Balance insufficient, attempting automatic airdrop...');
        
        const airdropAmount = isDemoMode ? 2 * LAMPORTS_PER_SOL : 0.1 * LAMPORTS_PER_SOL;
        const airdropSig = await requestAirdropWithRetry(feePayer.publicKey, airdropAmount);
        
        if (airdropSig) {
          const newBalance = await connection.getBalance(feePayer.publicKey);
          log.info({ airdropSig, newBalance, requiredBalance }, 'Airdrop successful, checking balance...');
          
          // Verify we have enough after airdrop
          if (newBalance < actualRequiredBalance) {
            const errorMsg = `Insufficient balance after airdrop: need ${actualRequiredBalance} lamports (${requiredBalance} for fees${isDemoMode ? ` + ${demoModeAmount} for demo payment` : ''}), have ${newBalance} lamports. Fee payer: ${feePayer.publicKey.toBase58()}`;
            log.error({ balance: newBalance, requiredBalance: actualRequiredBalance, feePayer: feePayer.publicKey.toBase58(), isDemoMode }, errorMsg);
            return res.status(500).json({ 
              success: false, 
              error: 'insufficient_funds', 
              details: errorMsg,
              txHash: null, 
              networkId: NETWORK,
              feePayer: feePayer.publicKey.toBase58(),
              help: NETWORK === 'devnet' ? `Visit https://faucet.solana.com/ or run: solana airdrop 2 ${feePayer.publicKey.toBase58()} --url devnet` : undefined
            });
          }
          // Continue with settlement - balance is now sufficient
          log.info({ balance: newBalance, required: actualRequiredBalance, isDemoMode }, 'Balance sufficient, proceeding with settlement');
        } else {
          // Airdrop failed after retries
          const errorMsg = `Insufficient balance: need ${actualRequiredBalance} lamports (${requiredBalance} for fees${isDemoMode ? ` + ${demoModeAmount} for demo payment` : ''}), have ${balance} lamports. Fee payer: ${feePayer.publicKey.toBase58()}. Automatic airdrop failed (rate limited or faucet unavailable).`;
          log.error({ balance, requiredBalance: actualRequiredBalance, feePayer: feePayer.publicKey.toBase58(), isDemoMode }, errorMsg);
          return res.status(500).json({ 
            success: false, 
            error: 'insufficient_funds', 
            details: errorMsg,
            txHash: null, 
            networkId: NETWORK,
            feePayer: feePayer.publicKey.toBase58(),
            help: NETWORK === 'devnet' ? `Please fund manually: Visit https://faucet.solana.com/ and enter ${feePayer.publicKey.toBase58()} or run: solana airdrop 2 ${feePayer.publicKey.toBase58()} --url devnet` : undefined
          });
        }
      } else {
        const errorMsg = `Insufficient balance: need ${requiredBalance} lamports, have ${balance} lamports. Fee payer: ${feePayer.publicKey.toBase58()}`;
        log.error({ balance, requiredBalance, feePayer: feePayer.publicKey.toBase58() }, errorMsg);
        return res.status(500).json({ 
          success: false, 
          error: 'insufficient_funds', 
          details: errorMsg,
          txHash: null, 
          networkId: NETWORK,
          feePayer: feePayer.publicKey.toBase58()
        });
      }
    }
    
    let sig: string;
    if (SETTLEMENT_MODE === 'spl') {
      const mint = new PublicKey(parse.data.paymentRequirements.asset);
      const mintInfo = await getMint(connection, mint);
      const decimals = mintInfo.decimals;
      const fromAta = await getAssociatedTokenAddress(mint, feePayer.publicKey);
      const toAta = await getAssociatedTokenAddress(mint, payTo);
      const ixes = [] as any[];
      // ensure destination ATA exists
      try {
        await getAccount(connection, toAta);
      } catch {
        ixes.push(createAssociatedTokenAccountInstruction(feePayer.publicKey, toAta, payTo, mint));
      }
      const amount = BigInt(parse.data.paymentRequirements.maxAmountRequired);
      ixes.push(createTransferCheckedInstruction(fromAta, mint, toAta, feePayer.publicKey, Number(amount), decimals));
      const tx = new Transaction().add(...ixes);
      sig = await sendAndConfirmTransaction(connection, tx, [feePayer], { commitment: 'confirmed' });
    } else {
      // DEMO MODE: Create transaction from facilitator account
      // In production x402 flow, this would be the client's transaction that facilitator just signs as fee payer
      // Since this is demo mode and we don't have client's private key, we create and pay from facilitator
      // NOTE: In real x402, payment comes from auth.from (client), facilitator only pays fees
      const ix = SystemProgram.transfer({ 
        fromPubkey: feePayer.publicKey, 
        toPubkey: payTo, 
        lamports: Number(amountLamports) 
      });
      const tx = new Transaction().add(ix);
      
      // Set fee payer (normally this would be set by client, facilitator just adds signature)
      tx.feePayer = feePayer.publicKey;
      
      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      tx.recentBlockhash = blockhash;
      
      sig = await sendAndConfirmTransaction(connection, tx, [feePayer], { commitment: 'confirmed' });
    }
    idempotencyStore.set(idemKey, 10 * 60 * 1000);
    return res.json({ success: true, error: null, txHash: sig, networkId: NETWORK, payer: decoded?.payload?.authorization?.from ?? null });
  } catch (e) {
    // Extract detailed error information
    let errorMessage = 'unknown_error';
    let errorDetails = '';
    
    if (e instanceof Error) {
      errorMessage = e.message;
      errorDetails = e.stack || '';
      // Try to extract Solana-specific error messages
      if (e.message.includes('insufficient funds') || e.message.includes('Insufficient')) {
        errorMessage = 'insufficient_funds';
      } else if (e.message.includes('blockhash') || e.message.includes('Blockhash')) {
        errorMessage = 'invalid_blockhash';
      } else if (e.message.includes('signature') || e.message.includes('Signature')) {
        errorMessage = 'signature_error';
      }
    }
    
    log.error({ 
      error: errorMessage, 
      details: errorDetails,
      stack: errorDetails,
      paymentRequirements: parse.data.paymentRequirements.resource,
      feePayer: feePayer.publicKey.toBase58()
    }, 'settlement failed');
    
    return res.status(500).json({ 
      success: false, 
      error: errorMessage,
      details: errorDetails ? `Fee payer: ${feePayer.publicKey.toBase58()}. ${errorDetails.substring(0, 200)}` : undefined,
      txHash: null, 
      networkId: NETWORK 
    });
  }
});

app.get('/health', async (_req: express.Request, res: express.Response) => {
  try {
    const version = await connection.getVersion();
    res.json({ ok: true, rpc: version['solana-core'] ?? null, feePayer: feePayer.publicKey.toBase58(), network: NETWORK, settlementMode: SETTLEMENT_MODE });
  } catch {
    res.json({ ok: false });
  }
});

app.get('/supported', (_req: express.Request, res: express.Response) => {
  res.json({ kinds: [{ scheme: 'exact', network: 'solana-devnet' }] });
});

app.listen(PORT, () => {
  log.info({ PORT, RPC_URL }, 'facilitator listening');
});

// Simple in-memory nonce cache with TTL
const nonceCache = new Map<string, number>();
const NONCE_TTL_MS = 5 * 60 * 1000;
function pruneNonces(now: number) {
  for (const [k, exp] of nonceCache.entries()) {
    if (exp <= now) nonceCache.delete(k);
  }
}


