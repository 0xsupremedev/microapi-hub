'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useEffect } from 'react';

export function WalletButton() {
  const { publicKey, wallet, disconnect, connecting } = useWallet();
  const { setVisible } = useWalletModal();

  const handleConnect = () => {
    setVisible(true);
  };

  const handleDisconnect = () => {
    disconnect();
  };

  if (publicKey) {
    return (
      <div className="flex items-center gap-3">
        <div className="hidden md:block text-sm text-neutral-300">
          {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
        </div>
        <button
          onClick={handleDisconnect}
          className="px-4 py-2 rounded-lg bg-brand/20 hover:bg-brand/30 text-brand border border-brand/50 transition-colors text-sm font-medium"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={connecting}
      className="px-4 py-2 rounded-lg bg-brand hover:bg-brand/90 text-white transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {connecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}

