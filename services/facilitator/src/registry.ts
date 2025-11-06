/**
 * Registry client for querying on-chain API listings
 */
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { BN } from '@coral-xyz/anchor';
import type { ApiListing, CreateListingParams } from '../../../shared/types/registry';

// Registry program ID
const REGISTRY_PROGRAM_ID = new PublicKey('Reg1stry111111111111111111111111111111111111');

/**
 * Fetch all active listings from the registry
 * Note: This is a simplified version. In production, you'd use Anchor IDL
 */
export async function fetchActiveListings(
  connection: Connection,
  programId: PublicKey = REGISTRY_PROGRAM_ID
): Promise<ApiListing[]> {
  try {
    // Get all Program Derived Addresses (PDAs) for listings
    // In a real implementation, you'd use Anchor's program interface
    // For now, we'll return empty array and let the provider fall back to static config
    // This would require the Anchor IDL to be generated from the contract
    
    // TODO: Implement proper Anchor program client
    // const program = await getProgram(connection);
    // const listings = await program.account.apiListing.all();
    // return listings.filter(l => l.account.active);
    
    return [];
  } catch (error) {
    console.error('Error fetching registry listings:', error);
    return [];
  }
}

/**
 * Derive listing PDA address
 */
export function deriveListingPDA(
  provider: PublicKey,
  endpointUrl: string,
  programId: PublicKey = REGISTRY_PROGRAM_ID
): [PublicKey, number] {
  const { sha256 } = require('@coral-xyz/anchor').utils;
  const endpointHash = sha256(endpointUrl);
  
  return PublicKey.findProgramAddressSync(
    [provider.toBuffer(), Buffer.from(endpointHash)],
    programId
  );
}

/**
 * Convert registry listing to payment requirements
 */
export function listingToPaymentRequirements(
  listing: ApiListing,
  network: string = 'solana-devnet'
): {
  scheme: string;
  network: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType: string;
  outputSchema: null;
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string;
  extra: Record<string, unknown>;
} {
  // Convert price from USD cents to atomic units (simplified - would need oracle for exact conversion)
  // For demo, we'll use 1 atomic unit per USD cent
  const amountAtomic = String(listing.priceUsdCents);
  
  return {
    scheme: 'exact',
    network,
    maxAmountRequired: amountAtomic,
    resource: listing.endpointUrl,
    description: listing.description,
    mimeType: 'application/json',
    outputSchema: null,
    payTo: listing.provider.toBase58(), // Provider receives payment
    maxTimeoutSeconds: 60,
    asset: listing.tokenMint.toBase58(),
    extra: {
      category: listing.category,
      logoUrl: listing.logoUrl,
      priceUsdCents: listing.priceUsdCents,
    },
  };
}

