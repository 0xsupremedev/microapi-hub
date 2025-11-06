import { NavBar } from '../../components/NavBar';
import { Footer } from '../../components/Footer';
import { Card } from '../../components/ui/Card';
import { CopyButton } from '../../components/ui/CopyButton';
import { getTransactionDetails, getSolscanUrl } from '../../lib/transactions';
import { formatDistanceToNow } from 'date-fns';

function Form() {
  return (
    <form className="space-y-3" action="/receipt" method="get">
      <input 
        className="w-full px-3 py-2 rounded bg-surface-200/60 border border-white/10 text-white placeholder-neutral-500" 
        name="tx" 
        placeholder="Enter transaction signature (base58)" 
      />
      <button
        type="submit"
        className="px-4 py-2 rounded-lg bg-brand hover:bg-brand/90 text-white font-medium transition-colors"
      >
        Lookup Transaction
      </button>
    </form>
  );
}

export default async function ReceiptPage({ searchParams }: { searchParams: { tx?: string } }) {
  const tx = searchParams.tx;
  let txDetails = null;

  if (tx) {
    // Try to fetch transaction details (default to devnet for now)
    txDetails = await getTransactionDetails(tx, 'devnet');
  }

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <main className="mx-auto max-w-3xl px-4 py-10 space-y-6">
        <h1 className="text-2xl font-semibold">Transaction Receipt</h1>
        <Form />
        
        {tx && (
          <Card className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-sm text-neutral-400 mb-1">Transaction Signature</div>
                <div className="font-mono text-sm break-all text-white">{tx}</div>
              </div>
              <CopyButton text={tx} />
            </div>

            {txDetails ? (
              <>
                <div className="pt-4 border-t border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Status</span>
                    <span className={`px-3 py-1 rounded text-sm font-medium ${
                      txDetails.success 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                        : 'bg-red-500/20 text-red-400 border border-red-500/50'
                    }`}>
                      {txDetails.success ? 'Confirmed' : 'Failed'}
                    </span>
                  </div>

                  {txDetails.blockTime && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Time</span>
                      <span className="text-white">
                        {formatDistanceToNow(new Date(txDetails.blockTime), { addSuffix: true })}
                      </span>
                    </div>
                  )}

                  {txDetails.slot && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Slot</span>
                      <span className="text-white font-mono">{txDetails.slot.toLocaleString()}</span>
                    </div>
                  )}

                  {txDetails.fee !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Fee</span>
                      <span className="text-white">{(txDetails.fee / 1e9).toFixed(9)} SOL</span>
                    </div>
                  )}

                  {txDetails.error && (
                    <div className="pt-2 border-t border-white/10">
                      <div className="text-sm text-neutral-400 mb-1">Error</div>
                      <div className="text-red-400 font-mono text-xs">
                        {JSON.stringify(txDetails.error, null, 2)}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-white/10">
                  <a
                    href={getSolscanUrl(tx, txDetails.network)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand/20 hover:bg-brand/30 text-brand border border-brand/50 transition-colors"
                  >
                    View on Solscan
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6m4-3h6v6m-11 5L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </a>
                </div>
              </>
            ) : tx ? (
              <div className="pt-4 border-t border-white/10">
                <div className="text-yellow-400 text-sm">
                  Transaction not found or still confirming. Please try again in a few seconds.
                </div>
              </div>
            ) : null}
          </Card>
        )}

        {!tx && (
          <Card className="p-6 text-center">
            <p className="text-neutral-400">Enter a transaction signature above to view receipt details.</p>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}
