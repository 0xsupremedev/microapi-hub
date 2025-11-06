import './globals.css';
import type { ReactNode } from 'react';
import { WalletProvider } from '../components/wallet/WalletProvider';
import { Toaster } from '../components/ui/Toaster';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="theme-color" content="#0f0f17" />
        {/* Set initial theme ASAP to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var stored = localStorage.getItem('theme');
                var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                var theme = stored || (prefersDark ? 'dark' : 'light');
                document.documentElement.classList.remove('dark','light');
                if (theme === 'dark') document.documentElement.classList.add('dark');
                else document.documentElement.classList.add('light');
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <WalletProvider>
          {children}
          <Toaster />
        </WalletProvider>
      </body>
    </html>
  );
}


