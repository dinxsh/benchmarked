'use client';

import { useState } from 'react';
import { Activity, RefreshCw, Settings, Download } from 'lucide-react';
import { NewPairsTable } from '@/components/dex/NewPairsTable';
import { TopPairsGrid } from '@/components/dex/TopPairsGrid';
import { StreamingPerformanceCard } from '@/components/dex/StreamingPerformanceCard';
import { CSVUploader } from '@/components/dex/CSVUploader';
import { OHLCVChart } from '@/components/dex/OHLCVChart';
import { GemDiscoveryDashboard } from '@/components/dex/GemDiscoveryDashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';

export default function DexDashboardPage() {
  const [selectedPair, setSelectedPair] = useState<string | null>(null);

  // Fetch streaming status
  const { data: streamStatus } = useQuery({
    queryKey: ['streamStatus'],
    queryFn: async () => {
      const res = await fetch('/api/dex/stream/init');
      return res.json();
    },
    refetchInterval: 10000
  });

  const cacheStats = streamStatus?.cacheStats || {};

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal Terminal-style Header */}
      <div className="border-b-2 border-foreground px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xs font-mono font-bold uppercase tracking-wider">
            MEGAETH DEX • LIVE
          </h1>
          <Badge variant="outline" className="gap-1 border-2 border-foreground h-6 px-2">
            <div className="h-1.5 w-1.5 bg-accent animate-pulse" />
            <span className="text-[10px] font-mono uppercase">STREAMING</span>
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7 border-2 border-foreground">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 border-2 border-foreground">
            <Settings className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 border-2 border-foreground">
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* CSV Upload - Compact */}
      <div className="border-b border-foreground px-4 py-2">
        <CSVUploader />
      </div>

      {/* Split-screen Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-180px)]">
        {/* Left Column - Dense Tables (6/12) */}
        <div className="lg:col-span-6 border-r border-foreground flex flex-col">
          {/* New Pairs Section */}
          <div className="border-b border-foreground flex-1 overflow-hidden flex flex-col">
            <div className="border-b border-foreground px-3 py-1.5 bg-muted/50">
              <h2 className="text-[10px] font-mono font-bold uppercase tracking-wider">
                NEW_PAIRS
              </h2>
            </div>
            <div className="flex-1 overflow-auto">
              <NewPairsTable maxPairs={50} refreshInterval={5000} />
            </div>
          </div>

          {/* Top Pairs Section */}
          <div className="border-b border-foreground flex-1 overflow-hidden flex flex-col">
            <div className="border-b border-foreground px-3 py-1.5 bg-muted/50">
              <h2 className="text-[10px] font-mono font-bold uppercase tracking-wider">
                TOP_PAIRS
              </h2>
            </div>
            <div className="flex-1 overflow-auto">
              <TopPairsGrid onPairSelect={setSelectedPair} />
            </div>
          </div>
        </div>

        {/* Right Column - Charts & Gems (6/12) */}
        <div className="lg:col-span-6 flex flex-col">
          {/* OHLCV Chart */}
          <div className="border-b border-foreground flex-1 overflow-hidden flex flex-col">
            <div className="border-b border-foreground px-3 py-1.5 bg-muted/50">
              <h2 className="text-[10px] font-mono font-bold uppercase tracking-wider">
                OHLCV_CHART
              </h2>
            </div>
            <div className="flex-1 overflow-auto p-2">
              {selectedPair ? (
                <OHLCVChart pairAddress={selectedPair} interval="1m" points={100} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-muted-foreground/30">
                  <Activity className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-[10px] font-mono text-muted-foreground uppercase">
                    SELECT PAIR TO VIEW CHART
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Gem Discovery Dashboard */}
          <div className="border-b border-foreground flex-1 overflow-hidden">
            <GemDiscoveryDashboard />
          </div>

          {/* Streaming Performance Metrics */}
          <div className="border-b border-foreground">
            <div className="border-b border-foreground px-3 py-1.5 bg-muted/50">
              <h2 className="text-[10px] font-mono font-bold uppercase tracking-wider">
                STREAM_METRICS
              </h2>
            </div>
            <div className="p-2">
              <StreamingPerformanceCard />
            </div>
          </div>

          {/* Live Stats Grid */}
          <div className="flex-1">
            <div className="border-b border-foreground px-3 py-1.5 bg-muted/50">
              <h2 className="text-[10px] font-mono font-bold uppercase tracking-wider">
                LIVE_STATS
              </h2>
            </div>
            <div className="grid grid-cols-2">
              {/* Active Pairs */}
              <div className="border-r border-b border-foreground p-3">
                <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                  ACTIVE_PAIRS
                </p>
                <p className="text-xl font-mono font-bold tabular-nums">{cacheStats.totalPairs || 0}</p>
              </div>

              {/* Avg Latency */}
              <div className="border-b border-foreground p-3">
                <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                  AVG_LATENCY
                </p>
                <p className="text-xl font-mono font-bold tabular-nums text-accent">35MS</p>
              </div>

              {/* OHLCV Points */}
              <div className="border-r border-foreground p-3">
                <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                  OHLCV_PTS
                </p>
                <p className="text-xl font-mono font-bold tabular-nums">{cacheStats.totalOHLCVPoints || 0}</p>
              </div>

              {/* Live Updates */}
              <div className="p-3">
                <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                  LIVE_UPDATES
                </p>
                <p className="text-xl font-mono font-bold tabular-nums">{cacheStats.liveUpdates || 0}</p>
              </div>
            </div>
          </div>
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
        <div className="text-center mt-0.5">
          <a
            href="https://goldrush.dev/docs/streaming"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[8px] font-mono text-muted-foreground hover:text-foreground transition-colors uppercase"
          >
            VIEW DOCUMENTATION →
          </a>
        </div>
      </div>
    </div>
  );
}
