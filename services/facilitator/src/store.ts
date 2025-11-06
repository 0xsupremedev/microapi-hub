import fs from 'node:fs';
import path from 'node:path';

type Entry = { key: string; expiresAt: number };

export class TTLStore {
  private filePath: string;
  private entries = new Map<string, number>();

  constructor(fileName = 'facilitator_store.json') {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    this.filePath = path.join(dataDir, fileName);
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const arr = JSON.parse(raw) as Entry[];
        for (const e of arr) this.entries.set(e.key, e.expiresAt);
      }
    } catch {}
  }

  private persist() {
    try {
      const arr: Entry[] = Array.from(this.entries.entries()).map(([key, expiresAt]) => ({ key, expiresAt }));
      fs.writeFileSync(this.filePath, JSON.stringify(arr), 'utf8');
    } catch {}
  }

  set(key: string, ttlMs: number) {
    const exp = Date.now() + ttlMs;
    this.entries.set(key, exp);
    this.persist();
  }

  has(key: string) {
    const exp = this.entries.get(key);
    if (!exp) return false;
    if (exp <= Date.now()) {
      this.entries.delete(key);
      this.persist();
      return false;
    }
    return true;
  }
}


