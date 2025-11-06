import React from 'react';

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

export default async function ApiDocs() {
  const discovery = await fetchDiscovery();
  const items: Array<{ route: string; requirements: any }> = discovery?.accepts ?? [];
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">API Documentation</h1>
      {items.length === 0 ? (
        <div className="text-neutral-400 border-l-4 border-brand/50 pl-4 py-4 rounded bg-slate-900 mb-8">
          No endpoints exposed by provider. Start the backend service and refresh.
        </div>
      ) : (
        <div className="space-y-10">
          {items.map((it) => (
            <div key={it.route} className="border rounded bg-slate-900 border-brand/10 p-6 flex flex-col gap-2 hover:border-brand/50 transition">
              <div>
                <span className="text-brand font-mono text-xs px-2 py-1 rounded bg-brand/20">{it.requirements.method ?? 'GET'}</span>
                <span className="font-semibold ml-2">{it.route}</span>
              </div>
              <div className="text-sm text-neutral-300">{it.requirements?.description ?? 'No description'}</div>
              <div className="flex flex-wrap gap-4 items-center mt-2 text-sm">
                <span className="bg-white/10 px-2 py-1 rounded">Network: {it.requirements?.network ?? '-'}</span>
                <span className="bg-white/10 px-2 py-1 rounded">Asset: {it.requirements?.asset ?? '-'}</span>
                <span className="bg-white/10 px-2 py-1 rounded">Price: {it.requirements?.maxAmountRequired ?? '-'} atomic</span>
              </div>
              <div className="mt-2">
                <pre className="bg-black/70 border border-white/10 rounded p-3 text-xs overflow-x-auto">{`curl \
  -H "X-PAYMENT: <base64-encoded-payload>" \
  ${it.route.startsWith('http') ? it.route : `http://localhost:8080${it.route}`} \
  # Add --request POST and -d '{...}' as needed
`}</pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
