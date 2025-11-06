/**
 * Wallet utilities for Solana wallet integration
 */
import { Connection, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { clusterApiUrl } from '@solana/web3.js';

/**
 * Get Solana RPC connection based on network
 */
export function getConnection(network: string = 'devnet'): Connection {
  const rpcUrl = network === 'devnet' 
    ? clusterApiUrl('devnet')
    : network === 'mainnet-beta'
    ? clusterApiUrl('mainnet-beta')
    : clusterApiUrl('testnet');
    
  return new Connection(rpcUrl, 'confirmed');
}

/**
 * Validate Solana address
 */
export function isValidAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Format address for display
 */
export function formatAddress(address: string, length: number = 4): string {
  if (address.length <= length * 2) return address;
  return `${address.slice(0, length)}...${address.slice(-length)}`;
}

/**
 * Get Solscan explorer URL for transaction
 */
export function getSolscanUrl(signature: string, network: string = 'devnet'): string {
  const cluster = network === 'devnet' ? 'devnet' : network === 'mainnet-beta' ? '' : 'testnet';
  const prefix = cluster ? `https://solscan.io/tx/${signature}?cluster=${cluster}` : `https://solscan.io/tx/${signature}`;
  return prefix;
}

/**
 * Get Solscan explorer URL for address
 */
export function getSolscanAddressUrl(address: string, network: string = 'devnet'): string {
  const cluster = network === 'devnet' ? 'devnet' : network === 'mainnet-beta' ? '' : 'testnet';
  const prefix = cluster ? `https://solscan.io/account/${address}?cluster=${cluster}` : `https://solscan.io/account/${address}`;
  return prefix;
}

