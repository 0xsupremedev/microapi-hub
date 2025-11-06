'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

interface CopyButtonProps {
  text: string;
  className?: string;
  variant?: 'icon' | 'text';
}

export function CopyButton({ text, className = '', variant = 'icon' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  if (variant === 'text') {
    return (
      <button
        onClick={handleCopy}
        className={`text-sm text-brand hover:text-brand/80 transition-colors ${className}`}
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    );
  }

  return (
    <button
      onClick={handleCopy}
      className={`p-1.5 rounded hover:bg-white/10 transition-colors ${className}`}
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-green-400">
          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : (
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-neutral-400">
          <path d="M16 1H4a2 2 0 00-2 2v14h2V3h12V1zm3 4H8a2 2 0 00-2 2v14a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  );
}

