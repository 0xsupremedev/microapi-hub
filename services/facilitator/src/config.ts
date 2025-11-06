import { z } from 'zod';
import { clusterApiUrl } from '@solana/web3.js';

const envSchema = z.object({
  PORT: z.string().default('8787').transform(Number),
  NETWORK: z.enum(['devnet', 'testnet', 'mainnet-beta']).default('devnet'),
  RPC_URL: z.string().url().optional(),
  FEE_PAYER_SECRET: z.string().default(''),
  AUTH_TOKEN: z.string().default(''),
  SETTLEMENT_MODE: z.enum(['native', 'spl']).default('native'),
  USE_X402_HELPERS: z.string().transform(val => val.toLowerCase() === 'true').default('false'),
  DISABLE_RATE_LIMIT: z.string().transform(val => val.toLowerCase() === 'true' || val === '1').default('false'),
  RATE_LIMIT_MIN_INTERVAL_MS: z.string().default('250').transform(Number),
  DISABLE_NONCE_REPLAY: z.string().transform(val => val.toLowerCase() === 'true' || val === '1').default('false'),
  DEMO_MODE: z.string().transform(val => val.toLowerCase() === 'true' || val === '1').default('true'),
  REDIS_URL: z.string().default(''),
});

type EnvInput = z.input<typeof envSchema>;
type EnvOutput = z.output<typeof envSchema>;

function getRpcUrl(network: string, customUrl?: string): string {
  if (customUrl) return customUrl;
  return clusterApiUrl(network as 'devnet' | 'testnet' | 'mainnet-beta');
}

export function loadConfig(): EnvOutput & { RPC_URL: string } {
  const rawEnv: EnvInput = {
    PORT: process.env.PORT,
    NETWORK: process.env.NETWORK,
    RPC_URL: process.env.RPC_URL,
    FEE_PAYER_SECRET: process.env.FEE_PAYER_SECRET,
    AUTH_TOKEN: process.env.AUTH_TOKEN,
    SETTLEMENT_MODE: process.env.SETTLEMENT_MODE,
    USE_X402_HELPERS: process.env.USE_X402_HELPERS,
    DISABLE_RATE_LIMIT: process.env.DISABLE_RATE_LIMIT,
    RATE_LIMIT_MIN_INTERVAL_MS: process.env.RATE_LIMIT_MIN_INTERVAL_MS,
    DISABLE_NONCE_REPLAY: process.env.DISABLE_NONCE_REPLAY,
    DEMO_MODE: process.env.DEMO_MODE,
    REDIS_URL: process.env.REDIS_URL,
  };

  const parsed = envSchema.parse(rawEnv);
  
  return {
    ...parsed,
    RPC_URL: getRpcUrl(parsed.NETWORK, parsed.RPC_URL),
  };
}

