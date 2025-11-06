import { NavBar } from '../../../components/NavBar';
import { Footer } from '../../../components/Footer';
import { Card } from '../../../components/ui/Card';
import { PaymentButton } from '../../../components/payment/PaymentButton';
import { formatPaymentAmount, formatAddress } from '../../../lib/solana';

async function fetchDiscovery() {
  const url = process.env.NEXT_PUBLIC_PROVIDER_DISCOVERY_URL ?? 'http://localhost:8080/.well-known/x402';
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function ResourceDetail({ params }: { params: { slug: string } }) {
  const discovery = await fetchDiscovery();
  const items: Array<{ route: string; requirements: any }> = discovery?.accepts ?? [];
  const decoded = decodeURIComponent(params.slug);
  const item = items.find((i) => i.route === decoded) || items[0];
  
  if (!item) {
    return (
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <main className="mx-auto max-w-4xl px-4 py-10">
          <div className="text-center">
            <h1 className="text-2xl font-semibold mb-4">Resource Not Found</h1>
            <p className="text-neutral-400">The requested resource could not be found.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const paymentInfo = formatPaymentAmount(
    item.requirements?.maxAmountRequired || '0',
    item.requirements?.asset || '',
    item.requirements?.extra?.name
  );

  const routeParts = item.route.split(' ');
  const method = routeParts.length > 1 ? routeParts[0] : 'GET';
  const path = routeParts.length > 1 ? routeParts[1] : routeParts[0];
  const baseUrl = process.env.NEXT_PUBLIC_PROVIDER_DISCOVERY_URL?.replace('/.well-known/x402', '') || 'http://localhost:8080';
  const resourceUrl = `${baseUrl}${path}`;

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <main className="mx-auto max-w-4xl px-4 py-10 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs px-2 py-1 rounded bg-brand/20 text-brand font-mono">{method}</span>
            <span className="text-sm text-neutral-400 font-mono">{path}</span>
          </div>
          <h1 className="text-3xl font-bold">{item.requirements?.description ?? 'Resource'}</h1>
        </div>

        <div className="bg-brand/10 border border-brand/20 rounded-xl p-6">
          <div className="text-center mb-6">
            <div className="text-sm text-neutral-400 mb-2">Price</div>
            <div className="text-4xl font-bold text-brand">{paymentInfo.display}</div>
          </div>
          <div className="flex justify-center">
            <PaymentButton
              paymentRequirements={item.requirements}
              resourceUrl={resourceUrl}
              variant="primary"
              className="px-8 py-3 text-lg"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4 text-white">Payment Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-neutral-400 mb-1">Network</div>
                <div className="text-white">{item.requirements?.network}</div>
              </div>
              <div>
                <div className="text-neutral-400 mb-1">Asset</div>
                <div className="text-white">{item.requirements?.extra?.name || 'Native SOL'}</div>
              </div>
              <div>
                <div className="text-neutral-400 mb-1">Amount</div>
                <div className="text-white font-mono">{item.requirements?.maxAmountRequired} (atomic)</div>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-semibold mb-4 text-white">Resource Info</h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-neutral-400 mb-1">Pay To</div>
                <div className="text-white font-mono text-xs break-all">{formatAddress(item.requirements?.payTo || '', 6)}</div>
              </div>
              <div>
                <div className="text-neutral-400 mb-1">MIME Type</div>
                <div className="text-white">{item.requirements?.mimeType || 'application/json'}</div>
              </div>
              <div>
                <div className="text-neutral-400 mb-1">Timeout</div>
                <div className="text-white">{item.requirements?.maxTimeoutSeconds || 60}s</div>
              </div>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}


