'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Zap, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TradingPair, LivePairUpdate } from '@/lib/dex-types';
import { PairDetailDrawer } from './PairDetailDrawer';

interface MomentumPair {
  pair: TradingPair;
  liveUpdate?: LivePairUpdate;
  momentum: number;
  priceMomentum: number;
  gemScore: number;
}

interface GainerPair {
  pair: TradingPair;
  liveUpdate: LivePairUpdate;
  priceChange: number;
  gemScore: number;
}

interface SpikePair {
  pair: TradingPair;
  liveUpdate?: LivePairUpdate;
  currentVolume: number;
  averageVolume: number;
  spikeMultiplier: number;
  gemScore: number;
}

type TabType = 'momentum' | 'gainers' | 'losers' | 'spikes' | 'new';

export function GemDiscoveryDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('momentum');
  const [timeWindow, setTimeWindow] = useState<'1h' | '24h'>('1h');
  const [drawerPair, setDrawerPair] = useState<string | null>(null);

  // Momentum query
  const { data: momentumData } = useQuery({
    queryKey: ['gems', 'momentum', timeWindow],
    queryFn: async () => {
      const window = timeWindow === '1h' ? 3600000 : 86400000;
      const res = await fetch(`/api/dex/gems/momentum?limit=20&window=${window}`);
      return res.json();
    },
    refetchInterval: 10000,
    enabled: activeTab === 'momentum'
  });

  // Gainers query
  const { data: gainersData } = useQuery({
    queryKey: ['gems', 'gainers', timeWindow],
    queryFn: async () => {
      const res = await fetch(`/api/dex/gems/gainers?limit=20&timeframe=${timeWindow}&direction=gainers`);
      return res.json();
    },
    refetchInterval: 10000,
    enabled: activeTab === 'gainers'
  });

  // Losers query
  const { data: losersData } = useQuery({
    queryKey: ['gems', 'losers', timeWindow],
    queryFn: async () => {
      const res = await fetch(`/api/dex/gems/gainers?limit=20&timeframe=${timeWindow}&direction=losers`);
      return res.json();
    },
    refetchInterval: 10000,
    enabled: activeTab === 'losers'
  });

  // Spikes query
  const { data: spikesData } = useQuery({
    queryKey: ['gems', 'spikes'],
    queryFn: async () => {
      const res = await fetch('/api/dex/gems/spikes');
      return res.json();
    },
    refetchInterval: 10000,
    enabled: activeTab === 'spikes'
  });

  // New pairs query
  const { data: newPairsData } = useQuery({
    queryKey: ['newPairs'],
    queryFn: async () => {
      const res = await fetch('/api/dex/pairs/new?limit=20');
      return res.json();
    },
    refetchInterval: 5000,
    enabled: activeTab === 'new'
  });

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-accent';
    if (score >= 50) return 'text-foreground';
    return 'text-muted-foreground';
  };

  return (
    <div className="border-2 border-foreground h-full flex flex-col">
      {/* Header */}
      <div className="border-b-2 border-foreground px-3 py-1.5 bg-muted/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5" />
          <h2 className="text-[10px] font-mono font-bold uppercase tracking-wider">
            GEM_DISCOVERY
          </h2>
        </div>
        <select
          value={timeWindow}
          onChange={(e) => setTimeWindow(e.target.value as '1h' | '24h')}
          className="h-6 px-2 border-2 border-foreground font-mono text-[10px] uppercase bg-background"
        >
          <option value="1h">1H</option>
          <option value="24h">24H</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="border-b border-foreground flex shrink-0">
        {[
          { id: 'momentum' as TabType, label: 'MOMENTUM', icon: Zap },
          { id: 'gainers' as TabType, label: 'GAINERS', icon: TrendingUp },
          { id: 'losers' as TabType, label: 'LOSERS', icon: TrendingDown },
          { id: 'spikes' as TabType, label: 'SPIKES', icon: Sparkles },
          { id: 'new' as TabType, label: 'NEW', icon: Sparkles }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 border-r border-foreground font-mono text-[10px] uppercase transition-colors ${
              activeTab === id
                ? 'bg-foreground text-background'
                : 'hover:bg-muted/30'
            }`}
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'momentum' && (
          <MomentumTable data={momentumData?.pairs || []} formatNumber={formatNumber} getScoreColor={getScoreColor} onPairSelect={setDrawerPair} />
        )}
        {activeTab === 'gainers' && (
          <GainersTable data={gainersData?.pairs || []} formatNumber={formatNumber} getScoreColor={getScoreColor} onPairSelect={setDrawerPair} />
        )}
        {activeTab === 'losers' && (
          <LosersTable data={losersData?.pairs || []} formatNumber={formatNumber} getScoreColor={getScoreColor} onPairSelect={setDrawerPair} />
        )}
        {activeTab === 'spikes' && (
          <SpikesTable data={spikesData?.spikes || []} formatNumber={formatNumber} getScoreColor={getScoreColor} onPairSelect={setDrawerPair} />
        )}
        {activeTab === 'new' && (
          <NewPairsTable data={newPairsData?.pairs || []} formatTime={formatTime} onPairSelect={setDrawerPair} />
        )}
      </div>

      <PairDetailDrawer
        pairAddress={drawerPair}
        onClose={() => setDrawerPair(null)}
      />
    </div>
  );
}

// Momentum Table Component
function MomentumTable({ data, formatNumber, getScoreColor, onPairSelect }: {
  data: MomentumPair[];
  formatNumber: (n: number) => string;
  getScoreColor: (n: number) => string;
  onPairSelect?: (addr: string) => void;
}) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-[10px] font-mono text-muted-foreground uppercase">
        NO MOMENTUM DATA AVAILABLE
      </div>
    );
  }

  return (
    <table className="w-full border-collapse font-mono text-[11px]">
      <thead>
        <tr className="border-b border-foreground bg-muted/30 sticky top-0">
          <th className="text-left py-1 px-2 text-[10px] font-bold uppercase tracking-wider">RNK</th>
          <th className="text-left py-1 px-2 text-[10px] font-bold uppercase tracking-wider">PAIR</th>
          <th className="text-right py-1 px-2 text-[10px] font-bold uppercase tracking-wider">PRICE</th>
          <th className="text-right py-1 px-2 text-[10px] font-bold uppercase tracking-wider">VOL MOM</th>
          <th className="text-right py-1 px-2 text-[10px] font-bold uppercase tracking-wider">PRICE MOM</th>
          <th className="text-right py-1 px-2 text-[10px] font-bold uppercase tracking-wider">SCORE</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, idx) => (
          <tr
            key={item.pair.pairAddress}
            className={`border-b border-muted ${
              idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'
            } hover:bg-muted/30 transition-colors cursor-pointer`}
            onClick={() => onPairSelect?.(item.pair.pairAddress)}
          >
            <td className="py-1.5 px-2 font-bold text-muted-foreground">
              #{idx + 1}
            </td>
            <td className="py-1.5 px-2">
              <div className="font-semibold">{item.pair.token0.symbol}/{item.pair.token1.symbol}</div>
              <div className="text-[9px] text-muted-foreground uppercase">{item.pair.dexName}</div>
            </td>
            <td className="py-1.5 px-2 text-right font-semibold tabular-nums">
              ${item.liveUpdate?.priceUSD.toFixed(6) || '0.000000'}
            </td>
            <td className="py-1.5 px-2 text-right font-bold tabular-nums text-accent">
              +{item.momentum.toFixed(1)}%
            </td>
            <td className={`py-1.5 px-2 text-right font-bold tabular-nums ${
              item.priceMomentum > 0 ? 'text-accent' : 'text-destructive'
            }`}>
              {item.priceMomentum > 0 ? '+' : ''}
              {item.priceMomentum.toFixed(1)}%
            </td>
            <td className={`py-1.5 px-2 text-right font-bold tabular-nums ${getScoreColor(item.gemScore)}`}>
              {item.gemScore}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Gainers/Losers Table Component
function GainersTable({ data, formatNumber, getScoreColor, onPairSelect }: {
  data: GainerPair[];
  formatNumber: (n: number) => string;
  getScoreColor: (n: number) => string;
  onPairSelect?: (addr: string) => void;
}) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-[10px] font-mono text-muted-foreground uppercase">
        NO DATA AVAILABLE
      </div>
    );
  }

  return (
    <table className="w-full border-collapse font-mono text-[11px]">
      <thead>
        <tr className="border-b border-foreground bg-muted/30 sticky top-0">
          <th className="text-left py-1 px-2 text-[10px] font-bold uppercase tracking-wider">RNK</th>
          <th className="text-left py-1 px-2 text-[10px] font-bold uppercase tracking-wider">PAIR</th>
          <th className="text-right py-1 px-2 text-[10px] font-bold uppercase tracking-wider">PRICE</th>
          <th className="text-right py-1 px-2 text-[10px] font-bold uppercase tracking-wider">CHANGE</th>
          <th className="text-right py-1 px-2 text-[10px] font-bold uppercase tracking-wider">VOLUME</th>
          <th className="text-right py-1 px-2 text-[10px] font-bold uppercase tracking-wider">SCORE</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, idx) => (
          <tr
            key={item.pair.pairAddress}
            className={`border-b border-muted ${
              idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'
            } hover:bg-muted/30 transition-colors cursor-pointer`}
            onClick={() => onPairSelect?.(item.pair.pairAddress)}
          >
            <td className="py-1.5 px-2 font-bold text-muted-foreground">
              #{idx + 1}
            </td>
            <td className="py-1.5 px-2">
              <div className="font-semibold">{item.pair.token0.symbol}/{item.pair.token1.symbol}</div>
              <div className="text-[9px] text-muted-foreground uppercase">{item.pair.dexName}</div>
            </td>
            <td className="py-1.5 px-2 text-right font-semibold tabular-nums">
              ${item.liveUpdate.priceUSD.toFixed(6)}
            </td>
            <td className={`py-1.5 px-2 text-right font-bold tabular-nums ${
              item.priceChange > 0 ? 'text-accent' : 'text-destructive'
            }`}>
              {item.priceChange > 0 ? '+' : ''}
              {item.priceChange.toFixed(2)}%
            </td>
            <td className="py-1.5 px-2 text-right tabular-nums">
              ${formatNumber(item.liveUpdate.volume24hUSD)}
            </td>
            <td className={`py-1.5 px-2 text-right font-bold tabular-nums ${getScoreColor(item.gemScore)}`}>
              {item.gemScore}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function LosersTable({ data, formatNumber, getScoreColor, onPairSelect }: {
  data: GainerPair[];
  formatNumber: (n: number) => string;
  getScoreColor: (n: number) => string;
  onPairSelect?: (addr: string) => void;
}) {
  return <GainersTable data={data} formatNumber={formatNumber} getScoreColor={getScoreColor} onPairSelect={onPairSelect} />;
}

// Spikes Table Component
function SpikesTable({ data, formatNumber, getScoreColor, onPairSelect }: {
  data: SpikePair[];
  formatNumber: (n: number) => string;
  getScoreColor: (n: number) => string;
  onPairSelect?: (addr: string) => void;
}) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-[10px] font-mono text-muted-foreground uppercase">
        NO VOLUME SPIKES DETECTED
      </div>
    );
  }

  return (
    <table className="w-full border-collapse font-mono text-[11px]">
      <thead>
        <tr className="border-b border-foreground bg-muted/30 sticky top-0">
          <th className="text-left py-1 px-2 text-[10px] font-bold uppercase tracking-wider">RNK</th>
          <th className="text-left py-1 px-2 text-[10px] font-bold uppercase tracking-wider">PAIR</th>
          <th className="text-right py-1 px-2 text-[10px] font-bold uppercase tracking-wider">CURRENT VOL</th>
          <th className="text-right py-1 px-2 text-[10px] font-bold uppercase tracking-wider">AVG VOL</th>
          <th className="text-right py-1 px-2 text-[10px] font-bold uppercase tracking-wider">SPIKE</th>
          <th className="text-right py-1 px-2 text-[10px] font-bold uppercase tracking-wider">SCORE</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, idx) => (
          <tr
            key={item.pair.pairAddress}
            className={`border-b border-muted ${
              idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'
            } hover:bg-muted/30 transition-colors cursor-pointer`}
            onClick={() => onPairSelect?.(item.pair.pairAddress)}
          >
            <td className="py-1.5 px-2 font-bold text-muted-foreground">
              #{idx + 1}
            </td>
            <td className="py-1.5 px-2">
              <div className="font-semibold">{item.pair.token0.symbol}/{item.pair.token1.symbol}</div>
              <div className="text-[9px] text-muted-foreground uppercase">{item.pair.dexName}</div>
            </td>
            <td className="py-1.5 px-2 text-right font-semibold tabular-nums">
              ${formatNumber(item.currentVolume)}
            </td>
            <td className="py-1.5 px-2 text-right tabular-nums text-muted-foreground">
              ${formatNumber(item.averageVolume)}
            </td>
            <td className="py-1.5 px-2 text-right font-bold tabular-nums text-accent">
              {item.spikeMultiplier.toFixed(1)}x
            </td>
            <td className={`py-1.5 px-2 text-right font-bold tabular-nums ${getScoreColor(item.gemScore)}`}>
              {item.gemScore}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// New Pairs Table Component
function NewPairsTable({ data, formatTime, onPairSelect }: {
  data: TradingPair[];
  formatTime: (t: number) => string;
  onPairSelect?: (addr: string) => void;
}) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-[10px] font-mono text-muted-foreground uppercase">
        NO NEW PAIRS DETECTED
      </div>
    );
  }

  return (
    <table className="w-full border-collapse font-mono text-[11px]">
      <thead>
        <tr className="border-b border-foreground bg-muted/30 sticky top-0">
          <th className="text-left py-1 px-2 text-[10px] font-bold uppercase tracking-wider">PAIR</th>
          <th className="text-left py-1 px-2 text-[10px] font-bold uppercase tracking-wider">DEX</th>
          <th className="text-right py-1 px-2 text-[10px] font-bold uppercase tracking-wider">CREATED</th>
          <th className="text-right py-1 px-2 text-[10px] font-bold uppercase tracking-wider">BLOCK</th>
        </tr>
      </thead>
      <tbody>
        {data.map((pair, idx) => (
          <tr
            key={pair.pairAddress}
            className={`border-b border-muted ${
              idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'
            } hover:bg-muted/30 transition-colors cursor-pointer`}
            onClick={() => onPairSelect?.(pair.pairAddress)}
          >
            <td className="py-1.5 px-2">
              <div className="font-semibold">{pair.token0.symbol}/{pair.token1.symbol}</div>
              <div className="text-[9px] text-muted-foreground">{pair.pairAddress.slice(0, 10)}...</div>
            </td>
            <td className="py-1.5 px-2 uppercase text-[10px]">
              {pair.dexName}
            </td>
            <td className="py-1.5 px-2 text-right tabular-nums">
              <Badge variant="outline" className="text-[9px] font-mono border-foreground">
                {formatTime(pair.createdAt)}
              </Badge>
            </td>
            <td className="py-1.5 px-2 text-right tabular-nums text-muted-foreground">
              {pair.createdBlock}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
