/**
 * Registry contract types
 * These match the Solana Anchor program structure
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

export interface CreateListingParams {
  endpointUrl: string;
  description: string;
  priceUsdCents: number;
  tokenMint: PublicKey;
  category: number;
  logoUrl: string;
}

export interface UpdateListingParams extends CreateListingParams {}

export enum ApiCategory {
  DATA_FEED = 0,
  AI_MODEL = 1,
  COMPUTE = 2,
  STORAGE = 3,
  AUTHENTICATION = 4,
  OTHER = 255,
}

/**
 * Registry program ID (devnet)
 */
export const REGISTRY_PROGRAM_ID = new PublicKey('Reg1stry111111111111111111111111111111111111');

/**
 * Derive listing PDA
 */
export async function deriveListingPDA(
  provider: PublicKey,
  endpointUrl: string,
  programId: PublicKey = REGISTRY_PROGRAM_ID
): Promise<[PublicKey, number]> {
  const { PublicKey: PubKey } = await import('@solana/web3.js');
  const anchor = await import('@coral-xyz/anchor');
  
  const endpointHash = anchor.utils.sha256(endpointUrl);
  const [pda, bump] = PubKey.findProgramAddressSync(
    [provider.toBuffer(), Buffer.from(endpointHash)],
    programId
  );
  
  return [pda, bump];
}

