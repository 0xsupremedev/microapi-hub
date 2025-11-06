export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { NavBar } from '../../components/NavBar';
import { Footer } from '../../components/Footer';
import { Card } from '../../components/ui/Card';
import Link from 'next/link';
import fs from 'node:fs/promises';
import path from 'node:path';

const IGNORE_FILES = [
  // Add any files you want to explicitly exclude by name below (Arabic/news/learn, etc)
  'ar_docs_intro_quick-start_deploying-programs.html',
  'تعلّم', 'المطورين', 'الحلول', 'الشبكة', 'المجتمع', 'الوثائقAPIكتاب الطبخGet Support',
];

// Language/directory heuristic: basic filtering for only EN and developer API docs
function isEnglishDoc(name: string): boolean {
  // Filter by basic filename: ignore files with Arabic, non-alpha first word, or non-english script
  return /^[a-zA-Z0-9_-]+\.html$/.test(name) && !IGNORE_FILES.includes(name);
}

async function loadDocsList(): Promise<string[]> {
  try {
    const root = path.join(process.cwd(), '..', '..', 'solana_com');
    const entries = await fs.readdir(root);
    return entries.filter((f) => f.endsWith('.html')).filter(isEnglishDoc);
  } catch {
    return [];
  }
}

async function loadDoc(name: string): Promise<string> {
  try {
    const filePath = path.join(process.cwd(), '..', '..', 'solana_com', name);
    const content = await fs.readFile(filePath, 'utf8');
    return content;
  } catch {
    return '<p>Documentation assets are not available in this deployment.</p>';
  }
}

export default async function DocsPage({ searchParams }: { searchParams: { file?: string; ref?: string } }) {
  const list = await loadDocsList();
  const file = searchParams.file && list.includes(searchParams.file) ? searchParams.file : list[0];
  const html = file ? await loadDoc(file) : '<p>No docs found.</p>';
  const showReference = searchParams.ref === 'solana';
  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 py-8 w-full">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/docs" className={!showReference ? 'px-3 py-1 rounded bg-brand text-white' : 'px-3 py-1 rounded bg-slate-800 text-neutral-300'}>
            Project Docs
          </Link>
          <Link href="/docs?ref=solana" className={showReference ? 'px-3 py-1 rounded bg-brand text-white' : 'px-3 py-1 rounded bg-slate-800 text-neutral-300'}>
            Solana Reference
          </Link>
        </div>
        {!showReference ? (
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-2">Getting Started</h2>
              <p className="text-neutral-400 mb-4">Overview of x402 and MicroAPI Hub.</p>
              <a className="text-brand" href="/docs/getting-started">Read →</a>
            </Card>
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-2">Installation</h2>
              <p className="text-neutral-400 mb-4">Prerequisites and setup commands.</p>
              <a className="text-brand" href="/docs/installation">Read →</a>
            </Card>
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-2">Configuration</h2>
              <p className="text-neutral-400 mb-4">Environment variables and RPC settings.</p>
              <a className="text-brand" href="/docs/configuration">Read →</a>
            </Card>
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-2">Solana Setup</h2>
              <p className="text-neutral-400 mb-4">Wallets, airdrop, RPC URLs, explorers.</p>
              <a className="text-brand" href="/docs/solana-setup">Read →</a>
            </Card>
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-2">Provider Guide</h2>
              <p className="text-neutral-400 mb-4">Discovery, 402 responses, pricing.</p>
              <a className="text-brand" href="/docs/provider-guide">Read →</a>
            </Card>
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-2">Client Guide</h2>
              <p className="text-neutral-400 mb-4">cURL and TypeScript examples.</p>
              <a className="text-brand" href="/docs/client-guide">Read →</a>
            </Card>
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-2">API Reference</h2>
              <p className="text-neutral-400 mb-4">Live discovery from provider.</p>
              <a className="text-brand" href="/docs/api-reference">Read →</a>
            </Card>
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-2">Troubleshooting</h2>
              <p className="text-neutral-400 mb-4">Common issues and fixes.</p>
              <a className="text-brand" href="/docs/troubleshooting">Read →</a>
            </Card>
          </div>
        ) : (
          <div className="grid md:grid-cols-[240px,1fr] gap-6">
            <aside className="text-sm space-y-2">
              <div className="font-semibold mb-2">Solana Reference</div>
              <ul className="space-y-2">
                {list.length === 0 && <li className="text-neutral-400">No English API docs found.</li>}
                {list.map((name) => (
                  <li key={name}>
                    <a className="text-neutral-300 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 rounded" href={`?ref=solana&file=${encodeURIComponent(name)}`}>{name.replace(/_/g,' ')}</a>
                  </li>
                ))}
              </ul>
            </aside>
            <Card className="prose prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: html }} />
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}


