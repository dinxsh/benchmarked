'use client';

import { useState, useEffect } from 'react';
import { TokensTable } from '@/components/dex/TokensTable';
import { TokenPairsPanel } from '@/components/dex/TokenPairsPanel';
import { Badge } from '@/components/ui/badge';
import { Activity } from 'lucide-react';

export default function DexDashboardPage() {
  const [selectedToken, setSelectedToken] = useState<string | null>(null);

  // Initialize streaming on mount
  useEffect(() => {
    fetch('/api/dex/stream/init', { method: 'POST' })
      .then(res => res.json())
      .then(data => console.log('✅ Stream initialized:', data))
      .catch(err => console.error('❌ Stream init failed:', err));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Brutalist Terminal-style Header */}
      <div className="border-b-2 border-foreground px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xs font-mono font-bold uppercase tracking-wider">
            MEGAETH DEX • TOKEN EXPLORER
          </h1>
          <Badge variant="outline" className="gap-1 border-2 border-foreground h-6 px-2">
            <div className="h-1.5 w-1.5 bg-accent animate-pulse" />
            <span className="text-[10px] font-mono uppercase">LIVE</span>
          </Badge>
        </div>
      </div>

      {/* Split-screen Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-60px)]">
        {/* Left Column - Tokens Table (7/12) */}
        <div className="lg:col-span-7 border-r-2 border-foreground overflow-hidden flex flex-col">
          <div className="border-b-2 border-foreground px-3 py-1.5 bg-muted/50">
            <h2 className="text-[10px] font-mono font-bold uppercase tracking-wider">
              TOP_TOKENS_BY_VOLUME
            </h2>
          </div>
          <div className="flex-1 overflow-auto">
            <TokensTable onTokenSelect={setSelectedToken} />
          </div>
        </div>

        {/* Right Column - Token Pairs & Chart (5/12) */}
        <div className="lg:col-span-5 overflow-hidden">
          {selectedToken ? (
            <TokenPairsPanel tokenAddress={selectedToken} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-muted-foreground/30 m-4">
              <Activity className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                SELECT TOKEN TO VIEW PAIRS + CHARTS
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer - Powered by GoldRush */}
      <div className="border-t-2 border-foreground px-4 py-2 bg-muted/30">
        <div className="flex items-center justify-center gap-2">
          <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">
            POWERED BY
          </p>
          <a
            href="https://goldrush.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-mono font-bold text-foreground hover:text-accent transition-colors uppercase tracking-wider"
          >
            GOLDRUSH
          </a>
          <span className="text-[9px] font-mono text-muted-foreground">•</span>
          <p className="text-[9px] font-mono text-muted-foreground uppercase">
            MEGAETH STREAMING API
          </p>
        </div>
      </div>
    </div>
  );
}
