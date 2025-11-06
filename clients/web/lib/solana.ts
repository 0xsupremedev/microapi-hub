import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

/**
 * Convert atomic units (lamports) to human-readable SOL
 */
export function lamportsToSol(lamports: number | string | bigint): string {
  const lamportsBigInt = typeof lamports === 'string' ? BigInt(lamports) : BigInt(Number(lamports));
  const sol = Number(lamportsBigInt) / LAMPORTS_PER_SOL;
  
  // Format with appropriate decimals
  if (sol < 0.001) {
    return sol.toFixed(6);
  } else if (sol < 1) {
    return sol.toFixed(4);
  } else {
    return sol.toFixed(2);
  }
}

/**
 * Convert atomic units to human-readable USDC (6 decimals)
 */
export function atomicToUsdc(atomic: number | string | bigint, decimals: number = 6): string {
  const atomicBigInt = typeof atomic === 'string' ? BigInt(atomic) : BigInt(Number(atomic));
  const divisor = BigInt(10 ** decimals);
  const usdc = Number(atomicBigInt) / Number(divisor);
  
  if (usdc < 0.01) {
    return usdc.toFixed(decimals);
  } else {
    return usdc.toFixed(2);
  }
}

/**
 * Format payment amount based on asset type
 */
export function formatPaymentAmount(
  atomic: string,
  asset: string,
  assetName?: string
): { amount: string; symbol: string; display: string } {
  const assetLower = asset.toLowerCase();
  const name = assetName?.toLowerCase() || '';
  
  // Check if it's native SOL (system program)
  if (assetLower === 'sol' || assetLower === 'solana' || assetLower === 'native' || asset === PublicKey.default.toBase58()) {
    const sol = lamportsToSol(atomic);
    return {
      amount: sol,
      symbol: 'SOL',
      display: `${sol} SOL`
    };
  }
  
  // Check if it's USDC (common mint addresses)
  const usdcMints = [
    'epjfwdd5aufqssqem2qn1xzybapc8g4wegkzwaytdt1v', // Devnet USDC
    'usdc', 'usdc.e'
  ];
  
  if (usdcMints.includes(assetLower) || name.includes('usdc')) {
    const usdc = atomicToUsdc(atomic, 6);
    return {
      amount: usdc,
      symbol: 'USDC',
      display: `$${usdc} USDC`
    };
  }
  
  // Default: show atomic units
  return {
    amount: atomic,
    symbol: 'atomic',
    display: `${atomic} (atomic units)`
  };
}

/**
 * Format Solana address for display
 */
export function formatAddress(address: string | PublicKey, length: number = 4): string {
  const addr = typeof address === 'string' ? address : address.toBase58();
  if (addr.length <= length * 2) return addr;
  return `${addr.slice(0, length)}...${addr.slice(-length)}`;
}

/**
 * Validate Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

