import Providers from '@/components/layout/providers';
import QueryProvider from '@/components/providers/query-provider';
import { Toaster } from '@/components/ui/sonner';
import { fontVariables } from '@/components/themes/font.config';
import ThemeProvider from '@/components/themes/theme-provider';
import { cn } from '@/lib/utils';
import type { Metadata, Viewport } from 'next';
import NextTopLoader from 'nextjs-toploader';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'benchmarked',
  description: 'Benchmark your fav RPCs'
};

export const viewport: Viewport = {
  themeColor: '#0d0d0d'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' suppressHydrationWarning data-theme='hyperliquid' className='dark'>
      <body
        className={cn(
          'bg-background font-sans antialiased',
          fontVariables
        )}
      >
        <NextTopLoader color='var(--primary)' showSpinner={false} />
        <NuqsAdapter>
          <ThemeProvider
            attribute='class'
            forcedTheme='dark'
            disableTransitionOnChange
            enableColorScheme
          >
            <QueryProvider>
              <Providers activeThemeValue='hyperliquid'>
                <Toaster />
                {children}
              </Providers>
            </QueryProvider>
          </ThemeProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
