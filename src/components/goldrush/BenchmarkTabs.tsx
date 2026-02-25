'use client';

import { motion } from 'motion/react';
import type { GRProvider } from '@/lib/benchmark/data';
import { GR_COLORS } from '@/lib/benchmark/data';
import { GRLatencyChart }    from './charts/GRLatencyChart';
import { GRThroughputChart } from './charts/GRThroughputChart';
import { GRUptimeList }      from './charts/GRUptimeList';
import { GRScoreBreakdown }  from './charts/GRScoreBreakdown';
import { GRRadarChart }      from './charts/GRRadarChart';
import { GRDimensionTable }  from './charts/GRDimensionTable';

const C = GR_COLORS;

function Card({ children, accentColor, gridArea }: { children: React.ReactNode; accentColor: string; gridArea: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{
        gridArea,
        background: C.bgCard,
        border: `1px solid ${C.border}`,
        borderTop: `2px solid ${accentColor}`,
        borderRadius: 2,
        padding: '20px',
      }}
    >
      {children}
    </motion.div>
  );
}

export function BenchmarkKanban({ providers }: { providers: GRProvider[] }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gridTemplateAreas: `
        "latency    latency    uptime"
        "throughput score      radar"
        "dimension  dimension  dimension"
      `,
      gap: 16,
    }}>
      <Card gridArea="latency"    accentColor={C.green}><GRLatencyChart    providers={providers} /></Card>
      <Card gridArea="uptime"     accentColor={C.amber}><GRUptimeList      providers={providers} /></Card>
      <Card gridArea="throughput" accentColor={C.blue}><GRThroughputChart providers={providers} /></Card>
      <Card gridArea="score"      accentColor={C.purple}><GRScoreBreakdown providers={providers} /></Card>
      <Card gridArea="radar"      accentColor={C.blue}><GRRadarChart      providers={providers} /></Card>
      <Card gridArea="dimension"  accentColor={C.gold}><GRDimensionTable  providers={providers} /></Card>
    </div>
  );
}
