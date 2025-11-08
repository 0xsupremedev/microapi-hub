/**
 * Registry contract types
 * Local copy for Next.js build compatibility
 */
import { PublicKey } from '@solana/web3.js';

export interface ApiListing {
  provider: PublicKey;
  endpointUrl: string;
  description: string;
  priceUsdCents: number;
  tokenMint: PublicKey;
  category: number;
  logoUrl: string;
  active: boolean;
  bump: number;
}

/**
 * Registry program ID (devnet placeholder)
 */
export const REGISTRY_PROGRAM_ID = new PublicKey('11111111111111111111111111111111');

