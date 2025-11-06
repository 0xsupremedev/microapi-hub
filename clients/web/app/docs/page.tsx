import { NavBar } from '../../components/NavBar';
import { Footer } from '../../components/Footer';
import { Card } from '../../components/ui/Card';
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
  const root = path.join(process.cwd(), '..', '..', 'solana_com');
  const entries = await fs.readdir(root);
  return entries.filter((f) => f.endsWith('.html')).filter(isEnglishDoc);
}

async function loadDoc(name: string): Promise<string> {
  const filePath = path.join(process.cwd(), '..', '..', 'solana_com', name);
  const content = await fs.readFile(filePath, 'utf8');
  return content;
}

export default async function DocsPage({ searchParams }: { searchParams: { file?: string } }) {
  const list = await loadDocsList();
  const file = searchParams.file && list.includes(searchParams.file) ? searchParams.file : list[0];
  const html = file ? await loadDoc(file) : '<p>No docs found.</p>';
  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 py-8 w-full">
        <div className="grid md:grid-cols-[240px,1fr] gap-6">
          <aside className="text-sm space-y-2">
            <div className="font-semibold mb-2">Docs</div>
            <ul className="space-y-2">
              {list.length === 0 && <li className="text-neutral-400">No English API docs found.</li>}
              {list.map((name) => (
                <li key={name}>
                  <a className="text-neutral-300 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 rounded" href={`?file=${encodeURIComponent(name)}`}>{name.replace(/_/g,' ')}</a>
                </li>
              ))}
            </ul>
          </aside>
          <Card className="prose prose-invert max-w-none">
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}


