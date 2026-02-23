'use client';

import { Zap, Shield, DollarSign, BarChart2 } from 'lucide-react';
import type { GRProvider } from '@/lib/benchmark/data';
import { GR_COLORS, GR_FONTS } from '@/lib/benchmark/data';
import { GRLatencyChart } from './charts/GRLatencyChart';
import { GRThroughputChart } from './charts/GRThroughputChart';
import { GRUptimeList } from './charts/GRUptimeList';
import { GRLatencySpread } from './charts/GRLatencySpread';
import { GRCostScatter } from './charts/GRCostScatter';
import { GRScoreBreakdown } from './charts/GRScoreBreakdown';
import { GRRadarChart } from './charts/GRRadarChart';
import { GRDimensionTable } from './charts/GRDimensionTable';

const C = GR_COLORS;

function ChartCard({
  children, accentColor,
}: {
  children: React.ReactNode; accentColor?: string;
}) {
  return (
    <div style={{
      background: C.bgCard, border: `1px solid ${C.border}`,
      borderTop: `2px solid ${accentColor ?? C.border}`,
      borderRadius: 2, padding: '20px',
    }}>
      {children}
    </div>
  );
}

function KanbanSection({
  icon, label, accentColor, children,
}: {
  icon: React.ReactNode; label: string; accentColor: string; children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        paddingBottom: 8, borderBottom: `1px solid ${C.border}`,
      }}>
        <span style={{ color: accentColor, display: 'flex', alignItems: 'center' }}>{icon}</span>
        <span style={{
          fontSize: 11, fontWeight: 800, letterSpacing: '0.09em',
          textTransform: 'uppercase', color: accentColor,
          fontFamily: GR_FONTS.mono,
        }}>
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

export function BenchmarkKanban({ providers }: { providers: GRProvider[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
      {/* ⚡ Performance */}
      <KanbanSection icon={<Zap size={12} />} label="Performance" accentColor={C.green}>
        <ChartCard accentColor={C.green}>
          <GRLatencyChart providers={providers} />
        </ChartCard>
        <ChartCard accentColor={C.blue}>
          <GRThroughputChart providers={providers} />
        </ChartCard>
      </KanbanSection>

      {/* 🛡 Reliability */}
      <KanbanSection icon={<Shield size={12} />} label="Reliability" accentColor={C.amber}>
        <ChartCard accentColor={C.amber}>
          <GRUptimeList providers={providers} />
        </ChartCard>
        <ChartCard accentColor={C.amber}>
          <GRLatencySpread providers={providers} />
        </ChartCard>
      </KanbanSection>

      {/* $ Value */}
      <KanbanSection icon={<DollarSign size={12} />} label="Value" accentColor={C.purple}>
        <ChartCard accentColor={C.purple}>
          <GRCostScatter providers={providers} />
        </ChartCard>
        <ChartCard accentColor={C.purple}>
          <GRScoreBreakdown providers={providers} />
        </ChartCard>
      </KanbanSection>

      {/* ◎ Overview */}
      <KanbanSection icon={<BarChart2 size={12} />} label="Overview" accentColor={C.blue}>
        <ChartCard accentColor={C.blue}>
          <GRRadarChart providers={providers} />
        </ChartCard>
        <ChartCard accentColor={C.blue}>
          <GRDimensionTable providers={providers} />
        </ChartCard>
      </KanbanSection>
    </div>
  );
}
