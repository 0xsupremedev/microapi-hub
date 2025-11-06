import { Connection, clusterApiUrl, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';

export interface TransactionDetails {
  signature: string;
  slot?: number;
  blockTime?: number;
  fee?: number;
  success: boolean;
  error?: any;
  network: string;
}

/**
 * Fetch Solana transaction details
 */
export async function getTransactionDetails(
  signature: string,
  network: string = 'devnet'
): Promise<TransactionDetails | null> {
  try {
    const rpcUrl = network.includes('devnet') 
      ? clusterApiUrl('devnet')
      : network.includes('mainnet')
      ? clusterApiUrl('mainnet-beta')
      : clusterApiUrl('devnet');

    const connection = new Connection(rpcUrl, 'confirmed');
    
    const tx = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0
    });

    if (!tx) {
      return null;
    }

    return {
      signature,
      slot: tx.slot,
      blockTime: tx.blockTime ? tx.blockTime * 1000 : undefined,
      fee: tx.meta?.fee,
      success: tx.meta?.err === null,
      error: tx.meta?.err,
      network
    };
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return null;
  }
}

/**
 * Get Solscan URL for transaction
 */
export function getSolscanUrl(signature: string, network: string = 'devnet'): string {
  const cluster = network.includes('devnet') ? 'devnet' : 'mainnet-beta';
  return `https://solscan.io/tx/${signature}?cluster=${cluster}`;
}

