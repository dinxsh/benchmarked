'use client';

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

function Card({
  children, accentColor, gridArea,
}: {
  children: React.ReactNode; accentColor: string; gridArea: string;
}) {
  return (
    <div style={{
      gridArea,
      background: C.bgCard,
      border: `1px solid ${C.border}`,
      borderTop: `2px solid ${accentColor}`,
      borderRadius: 2,
      padding: '20px',
    }}>
      {children}
    </div>
  );
}

export function BenchmarkKanban({ providers }: { providers: GRProvider[] }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gridTemplateAreas: `
        "latency   latency   uptime"
        "throughput spread   spread"
        "cost      score     radar"
        "dimension dimension dimension"
      `,
      gap: 16,
    }}>
      {/* Row 1: wide latency ← → narrow uptime */}
      <Card gridArea="latency"    accentColor={C.green}>
        <GRLatencyChart providers={providers} />
      </Card>
      <Card gridArea="uptime"     accentColor={C.amber}>
        <GRUptimeList providers={providers} />
      </Card>

      {/* Row 2: narrow throughput ← → wide latency spread */}
      <Card gridArea="throughput" accentColor={C.blue}>
        <GRThroughputChart providers={providers} />
      </Card>
      <Card gridArea="spread"     accentColor={C.amber}>
        <GRLatencySpread providers={providers} />
      </Card>

      {/* Row 3: three equal cards */}
      <Card gridArea="cost"       accentColor={C.purple}>
        <GRCostScatter providers={providers} />
      </Card>
      <Card gridArea="score"      accentColor={C.purple}>
        <GRScoreBreakdown providers={providers} />
      </Card>
      <Card gridArea="radar"      accentColor={C.blue}>
        <GRRadarChart providers={providers} />
      </Card>

      {/* Row 4: full-width dimension table */}
      <Card gridArea="dimension"  accentColor={C.gold}>
        <GRDimensionTable providers={providers} />
      </Card>
    </div>
  );
}
