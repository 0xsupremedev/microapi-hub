/**
 * Provider discovery utilities
 * Query on-chain registry for providers with reputation filtering
 */
import { Connection, PublicKey } from '@solana/web3.js';
import { REGISTRY_PROGRAM_ID } from './types/registry';
import type { ApiListing } from './types/registry';

export interface ProviderWithReputation extends ApiListing {
  reputation?: {
    settlementCount: number;
    successRate: number;
    score: number;
  };
}

export interface DiscoveryFilters {
  category?: number;
  minReputation?: number;
  maxPrice?: number;
  activeOnly?: boolean;
}

/**
 * Discover providers from on-chain registry
 * Falls back to discovery endpoint if on-chain query fails
 */
export async function discoverProviders(
  connection: Connection,
  filters?: DiscoveryFilters
): Promise<ProviderWithReputation[]> {
  try {
    // Try to fetch from discovery endpoint first (fallback)
    const discoveryUrl = process.env.NEXT_PUBLIC_PROVIDER_DISCOVERY_URL ?? 'http://localhost:8080/.well-known/x402';
    
    try {
      const response = await fetch(discoveryUrl, { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        const items = data.accepts || [];
        
        // Convert discovery items to ProviderWithReputation format
        const providers: ProviderWithReputation[] = await Promise.all(
          items.map(async (item: any) => {
            const requirements = item.requirements || {};
            const providerPubkey = new PublicKey(requirements.payTo || '11111111111111111111111111111111');
            
            // Fetch reputation if available
            const reputation = await getProviderReputation(connection, providerPubkey).catch(() => null);
            
            return {
              provider: providerPubkey,
              endpointUrl: item.route || requirements.resource || '',
              description: requirements.description || 'API Endpoint',
              priceUsdCents: Math.floor(Number(requirements.maxAmountRequired || 0) / 1000000), // Convert from atomic units
              tokenMint: new PublicKey(requirements.asset || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), // Default USDC
              category: (requirements.extra as any)?.category ?? 255,
              logoUrl: (requirements.extra as any)?.logoUrl || '',
              active: true,
              bump: 0,
              reputation: reputation ? {
                settlementCount: reputation.settlementCount,
                successRate: reputation.successRate,
                score: reputation.score
              } : undefined
            };
          })
        );
        
        // Apply filters
        let filtered = providers;
        if (filters?.activeOnly) {
          filtered = filtered.filter(p => p.active);
        }
        if (filters?.minReputation !== undefined) {
          filtered = filtered.filter(p => (p.reputation?.score ?? 0) >= filters.minReputation!);
        }
        if (filters?.maxPrice !== undefined) {
          filtered = filtered.filter(p => p.priceUsdCents <= filters.maxPrice!);
        }
        if (filters?.category !== undefined) {
          filtered = filtered.filter(p => p.category === filters.category);
        }
        
        return filtered;
      }
    } catch (fetchError) {
      console.warn('Failed to fetch from discovery endpoint:', fetchError);
    }
    
    // TODO: Implement actual on-chain query using Anchor program
    // This would query all ApiListing accounts from the registry program
    // For now, return empty array if discovery endpoint also fails
    
    return [];
  } catch (error) {
    console.error('Failed to discover providers:', error);
    return [];
  }
}

/**
 * Get provider reputation
 */
export async function getProviderReputation(
  connection: Connection,
  provider: PublicKey
): Promise<{
  settlementCount: number;
  successRate: number;
  score: number;
} | null> {
  try {
    // Derive reputation PDA
    const [reputationPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('reputation'), provider.toBuffer()],
      REGISTRY_PROGRAM_ID
    );

    const accountInfo = await connection.getAccountInfo(reputationPDA);
    
    if (!accountInfo) {
      return null;
    }

    // Parse reputation data
    const data = accountInfo.data;
    const settlementCount = Number(data.readBigUInt64LE(32));
    const successfulSettlements = Number(data.readBigUInt64LE(40));
    const successRate = data[48];

    // Calculate score (0-100)
    const successWeight = 0.7;
    const volumeWeight = 0.3;
    const volumeScore = Math.min(100, (settlementCount / 100) * 100);
    const score = Math.floor(successRate * successWeight + volumeScore * volumeWeight);

    return {
      settlementCount,
      successRate,
      score
    };
  } catch (error) {
    console.error('Failed to get provider reputation:', error);
    return null;
  }
}

