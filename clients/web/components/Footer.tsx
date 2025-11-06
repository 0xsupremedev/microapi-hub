export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-surface-200/30">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-neutral-400">
        <div className="flex items-center justify-between">
          <span>© {new Date().getFullYear()} MicroAPI Hub</span>
          <span className="badge">Solana Theme</span>
        </div>
      </div>
    </footer>
  );
}


