'use client';

import { useState, useEffect } from 'react';
import { NavBar } from '../../components/NavBar';
import { Footer } from '../../components/Footer';
import { Card } from '../../components/ui/Card';
import { CopyButton } from '../../components/ui/CopyButton';
import { getSolscanUrl, getTransactionDetails, TransactionDetails } from '../../lib/transactions';
import { formatDistanceToNow } from 'date-fns';
import { formatPaymentAmount } from '../../lib/solana';
import Link from 'next/link';

interface StoredTransaction {
  signature: string;
  timestamp: number;
  resource: string;
  amount: string;
  asset: string;
  network: string;
  status: 'pending' | 'confirmed' | 'failed';
}

const STORAGE_KEY = 'microapi_transactions';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<StoredTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [txDetails, setTxDetails] = useState<Record<string, TransactionDetails>>({});

  useEffect(() => {
    // Load transactions from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as StoredTransaction[];
        setTransactions(parsed.sort((a, b) => b.timestamp - a.timestamp));
        
        // Fetch details for pending transactions
        parsed.forEach(async (tx) => {
          if (tx.status === 'pending') {
            const details = await getTransactionDetails(tx.signature, tx.network);
            if (details) {
              setTxDetails(prev => ({ ...prev, [tx.signature]: details }));
              // Update status if confirmed
              if (details.success) {
                updateTransactionStatus(tx.signature, 'confirmed');
              }
            }
          }
        });
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTransactionStatus = (signature: string, status: 'confirmed' | 'failed') => {
    const updated = transactions.map(tx => 
      tx.signature === signature ? { ...tx, status } : tx
    );
    setTransactions(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const clearTransactions = () => {
    if (confirm('Clear all transaction history?')) {
      localStorage.removeItem(STORAGE_KEY);
      setTransactions([]);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <main className="mx-auto max-w-4xl px-4 py-10">
          <div className="text-center text-neutral-400">Loading transactions...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <main className="mx-auto max-w-4xl px-4 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Transaction History</h1>
          {transactions.length > 0 && (
            <button
              onClick={clearTransactions}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm transition-colors"
            >
              Clear History
            </button>
          )}
        </div>

        {transactions.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-neutral-400 mb-4">No transactions yet.</p>
            <p className="text-sm text-neutral-500">
              Your payment transactions will appear here after you make payments.
            </p>
            <Link href="/" className="inline-block mt-4 text-brand hover:text-brand/80">
              Browse Resources →
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => {
              const details = txDetails[tx.signature];
              const paymentInfo = formatPaymentAmount(tx.amount, tx.asset);
              
              return (
                <Card key={tx.signature} className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            tx.status === 'confirmed'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                              : tx.status === 'failed'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                          }`}>
                            {tx.status}
                          </span>
                          <span className="text-sm text-neutral-400">
                            {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                        <div className="text-lg font-medium text-white mb-1">{paymentInfo.display}</div>
                        <div className="text-sm text-neutral-400">{tx.resource}</div>
                      </div>
                      <CopyButton text={tx.signature} />
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-neutral-400 font-mono text-xs break-all">{tx.signature.slice(0, 20)}...</span>
                      <a
                        href={getSolscanUrl(tx.signature, tx.network)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand hover:text-brand/80 transition-colors"
                      >
                        View →
                      </a>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

