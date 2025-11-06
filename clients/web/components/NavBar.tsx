"use client";
import { useState } from 'react';
import { Button } from './ui/Button';
import Link from 'next/link';
import { WalletButton } from './wallet/WalletButton';
import { ThemeToggle } from './ui/ThemeToggle';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/transactions', label: 'Transactions' },
  { href: '/receipt', label: 'Receipt' },
  { href: '/docs', label: 'Docs' },
  { href: '/api', label: 'API Docs' },
];

export function NavBar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 backdrop-blur border-b border-white/10 bg-surface-200/40">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        {/* Brand / logo */}
        <Link className="font-semibold tracking-wide text-white text-lg" href="/">MicroAPI Hub</Link>
        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-4 text-sm text-neutral-300">
          {navLinks.map((l) => (
            <Link href={l.href} key={l.label} className={`hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 rounded px-2 py-1 ${l.label === 'Transactions' ? 'font-semibold text-brand bg-brand/10' : ''}`}>{l.label}</Link>
          ))}
          <div className="ml-2">
            <ThemeToggle />
          </div>
          <div className="ml-2">
            <WalletButton />
          </div>
        </nav>
        {/* Hamburger menu for mobile */}
        <button aria-label="Open menu" className="md:hidden text-white p-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40" onClick={() => setDrawerOpen(true)}>
          <svg width="26" height="26" fill="none" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
        {/* Mobile drawer */}
        {drawerOpen && (
          <div className="fixed md:hidden inset-0 z-50 bg-black/60 flex">
            <nav className="bg-slate-950 w-64 min-h-full p-6 flex flex-col gap-4 animate-slide-in">
              <button aria-label="Close menu" className="self-end text-white p-2" onClick={() => setDrawerOpen(false)}>
                <svg width="26" height="26" fill="none" viewBox="0 0 24 24"><path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
              <Link href="/" className="font-semibold text-xl text-brand mb-4" onClick={() => setDrawerOpen(false)}>MicroAPI Hub</Link>
              {navLinks.map((l) => (
                <Link href={l.href} key={l.label} onClick={() => setDrawerOpen(false)} className={`block px-2 py-2 rounded hover:bg-brand/10 ${l.label === 'API Docs' ? 'font-semibold text-brand' : 'text-white'}`}>{l.label}</Link>
              ))}
              <div className="mt-4 flex items-center gap-2">
                <ThemeToggle />
                <WalletButton />
              </div>
            </nav>
            <div className="flex-grow" onClick={() => setDrawerOpen(false)} />
          </div>
        )}
      </div>
    </header>
  );
}


