'use client';

import { useState } from 'react';
import { Zap, Shield, DollarSign, BarChart2 } from 'lucide-react';
import type { GRProvider } from '@/lib/benchmark/data';
import { GR_COLORS } from '@/lib/benchmark/data';
import { GRLatencyChart } from './charts/GRLatencyChart';
import { GRThroughputChart } from './charts/GRThroughputChart';
import { GRUptimeList } from './charts/GRUptimeList';
import { GRLatencySpread } from './charts/GRLatencySpread';
import { GRCostScatter } from './charts/GRCostScatter';
import { GRScoreBreakdown } from './charts/GRScoreBreakdown';
import { GRRadarChart } from './charts/GRRadarChart';
import { GRDimensionTable } from './charts/GRDimensionTable';

const C = GR_COLORS;

type Tab = 'performance' | 'reliability' | 'value' | 'overview';

const TABS: { key: Tab; label: string; icon: React.ReactNode; accentColor: string }[] = [
  { key: 'performance', label: 'Performance', icon: <Zap size={12} />,        accentColor: C.green  },
  { key: 'reliability', label: 'Reliability', icon: <Shield size={12} />,      accentColor: C.amber  },
  { key: 'value',       label: 'Value',        icon: <DollarSign size={12} />,  accentColor: C.purple },
  { key: 'overview',    label: 'Overview',     icon: <BarChart2 size={12} />,   accentColor: C.blue   },
];

function ChartCard({
  children, accentColor,
}: {
  title?: string; description?: string; children: React.ReactNode; accentColor?: string;
}) {
  return (
    <div style={{
      background: C.bgCard, border: `1px solid ${C.border}`,
      borderTop: `2px solid ${accentColor ?? C.border}`,
      borderRadius: 8, padding: '20px', height: '100%',
    }}>
      {children}
    </div>
  );
}

export function BenchmarkTabs({ providers }: { providers: GRProvider[] }) {
  const [activeTab, setActiveTab] = useState<Tab>('performance');
  const current = TABS.find((t) => t.key === activeTab)!;

  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
      {/* Tab header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: '0 20px',
        display: 'flex', gap: 4, alignItems: 'center' }}>
        {TABS.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '14px 16px', background: 'transparent', cursor: 'pointer',
                border: 'none', borderBottom: active ? `2px solid ${tab.accentColor}` : '2px solid transparent',
                fontSize: 12, fontWeight: active ? 800 : 600,
                color: active ? C.textPrimary : C.textMuted,
                fontFamily: 'JetBrains Mono, monospace',
                marginBottom: -1,
                transition: 'color 150ms, border-color 150ms',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div style={{ padding: '20px' }}>
        {activeTab === 'performance' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <ChartCard accentColor={C.green}>
              <GRLatencyChart providers={providers} />
            </ChartCard>
            <ChartCard accentColor={C.blue}>
              <GRThroughputChart providers={providers} />
            </ChartCard>
          </div>
        )}

        {activeTab === 'reliability' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <ChartCard accentColor={C.amber}>
              <GRUptimeList providers={providers} />
            </ChartCard>
            <ChartCard accentColor={C.amber}>
              <GRLatencySpread providers={providers} />
            </ChartCard>
          </div>
        )}

        {activeTab === 'value' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <ChartCard accentColor={C.purple}>
              <GRCostScatter providers={providers} />
            </ChartCard>
            <ChartCard accentColor={C.purple}>
              <GRScoreBreakdown providers={providers} />
            </ChartCard>
          </div>
        )}

        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <ChartCard accentColor={C.blue}>
              <GRRadarChart providers={providers} />
            </ChartCard>
            <ChartCard accentColor={C.blue}>
              <GRDimensionTable providers={providers} />
            </ChartCard>
          </div>
        )}
      </div>

      {/* Section label */}
      <div style={{ padding: '8px 20px', borderTop: `1px solid ${C.border}`,
        display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: C.textMuted, fontFamily: 'JetBrains Mono, monospace',
          letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Benchmark Analysis
        </span>
        <div style={{ flex: 1, height: 1, background: C.border }} />
        <span style={{ fontSize: 10, color: current.accentColor, fontFamily: 'JetBrains Mono, monospace',
          fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
          display: 'flex', alignItems: 'center', gap: 4 }}>
          {current.icon} {current.label}
        </span>
      </div>
    </div>
  );
}
