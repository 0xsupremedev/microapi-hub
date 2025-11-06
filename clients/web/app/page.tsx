import { NavBar } from '../components/NavBar';
import { Footer } from '../components/Footer';
import Link from 'next/link';
import { Button } from '../components/ui/Button';
import { ResourceCard } from '../components/payment/ResourceCard';
import { formatPaymentAmount } from '../lib/solana';

async function fetchDiscovery() {
  const url = process.env.NEXT_PUBLIC_PROVIDER_DISCOVERY_URL ?? 'http://localhost:8080/.well-known/x402';
  try {
    const res = await fetch(url, { cache: 'no-store', next: { revalidate: 10 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function Home() {
  const discovery = await fetchDiscovery();
  const items: Array<{ route: string; requirements: any }> = discovery?.accepts ?? [];
  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 py-12 space-y-16">
        {/* HERO */}
        <section className="text-center space-y-8">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-brand to-white/80">
            MicroAPI Payments for the Programmable Web
          </h1>
          <p className="text-lg text-neutral-200 max-w-3xl mx-auto leading-relaxed">
            Monetize APIs, endpoints, or content with one-click, on-chain payments. Built on the
            open <span className="font-semibold">x402</span> standard for programmable paywalls, trustless settlement, and
            verifiable receipts across Solana and more.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="#resources" className="px-5 py-3 rounded-lg bg-brand hover:bg-brand/90 text-white font-medium transition-colors">
              Explore Resources
            </Link>
            <Link href="/transactions" className="px-5 py-3 rounded-lg bg-transparent border border-brand/50 hover:bg-brand/10 text-brand font-medium transition-colors">
              View Transactions
            </Link>
          </div>
        </section>

        {/* FEATURE CARDS SECTION */}
        <section className="my-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-900 rounded-xl shadow p-6 flex flex-col items-center text-center border border-brand/20 hover:shadow-lg transition">
              <h3 className="text-xl font-bold mb-3 text-brand">Universal API Monetization</h3>
              <p className="text-neutral-300">Require payment for any endpoint in one line of code — fully programmable, no lock-in, extensible to any HTTP resource.</p>
            </div>
            <div className="bg-slate-900 rounded-xl shadow p-6 flex flex-col items-center text-center border border-brand/20 hover:shadow-lg transition">
              <h3 className="text-xl font-bold mb-3 text-brand">Crypto Payments Built-in</h3>
              <p className="text-neutral-300">Accept USDC, stablecoins, or native assets instantly — trustless, fast, and gasless for providers. Solana and EVM support out of the box.</p>
            </div>
            <div className="bg-slate-900 rounded-xl shadow p-6 flex flex-col items-center text-center border border-brand/20 hover:shadow-lg transition">
              <h3 className="text-xl font-bold mb-3 text-brand">AI & Agent Ready</h3>
              <p className="text-neutral-300">x402’s open spec and agent-friendly headers make it perfect for composable automation, AI agents, and programmable finance.</p>
            </div>
            <div className="bg-slate-900 rounded-xl shadow p-6 flex flex-col items-center text-center border border-brand/20 hover:shadow-lg transition">
              <h3 className="text-xl font-bold mb-3 text-brand">Permissionless & Trustless</h3>
              <p className="text-neutral-300">There’s no middleman — anyone can verify payments or build a facilitator/server. Open APIs make integration with any stack easy.</p>
            </div>
            <div className="bg-slate-900 rounded-xl shadow p-6 flex flex-col items-center text-center border border-brand/20 hover:shadow-lg transition">
              <h3 className="text-xl font-bold mb-3 text-brand">Developer First</h3>
              <p className="text-neutral-300">Designed for DX: great docs, one-line integration, multi-language SDKs and full-stack generated code samples.</p>
            </div>
            <div className="bg-slate-900 rounded-xl shadow p-6 flex flex-col items-center text-center border border-brand/20 hover:shadow-lg transition">
              <h3 className="text-xl font-bold mb-3 text-brand">Blazing Fast & Low Cost</h3>
              <p className="text-neutral-300">Subsecond settlement, $0.001 minimum fees, and <span className="font-mono">402</span> flow makes metered APIs affordable for everyone — not just enterprises.</p>
            </div>
          </div>
        </section>

        <section id="resources" className="space-y-6">
          <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Resources</h2>
            <Link 
              href="/transactions"
              className="text-sm text-brand hover:text-brand/80 transition-colors"
            >
              View Transaction History →
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {items.length === 0 && (
              <div className="col-span-2 text-sm text-neutral-400 p-6 bg-slate-900/50 rounded-lg border border-white/10 text-center">
                No resources available. Ensure the provider API is running and refresh the page.
              </div>
            )}
            {items.map((it) => (
              <ResourceCard
                key={it.route}
                route={it.route}
                requirements={it.requirements}
                baseUrl={process.env.NEXT_PUBLIC_PROVIDER_DISCOVERY_URL?.replace('/.well-known/x402', '') || 'http://localhost:8080'}
              />
            ))}
          </div>
        </section>

        <section id="how" className="space-y-4">
          <h2 className="text-2xl font-semibold">How it works</h2>
          <ol className="list-decimal pl-5 space-y-2 text-neutral-300">
            <li>Client calls a protected endpoint.</li>
            <li>Provider returns 402 with PaymentRequirements.</li>
            <li>Client sends X-PAYMENT header with authorization.</li>
            <li>Provider verifies and settles via facilitator.</li>
            <li>Provider returns 200 with X-PAYMENT-RESPONSE.</li>
          </ol>
        </section>

        <section id="try" className="space-y-4">
          <h2 className="text-2xl font-semibold">Try pay-per-call</h2>
          <p className="text-neutral-400 text-sm">Use the agent demo or click the button to simulate a paid request from the server.</p>
          <div>
            <form action="/api/try" method="get">
              <Button type="submit">Run demo call</Button>
            </form>
          </div>
          <code className="block p-4 rounded bg-black border border-white/10 text-sm overflow-x-auto mt-4">
{`PAYER_PUBKEY=<devnet_pubkey> PROVIDER_URL=http://localhost:8080/api/data npm --workspace clients/agent-demo run dev`}
          </code>
        </section>
      </main>
      <Footer />
    </div>
  );
}


