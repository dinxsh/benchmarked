'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { SolanaProvider } from './SolanaLeaderboardTable';

interface Props {
  providers: SolanaProvider[];
}

function getBarColor(delta: number): string {
  if (delta === 0) return 'var(--color-chart-5)';
  if (delta < 50) return 'var(--color-chart-2)';
  if (delta < 200) return 'var(--color-chart-3)';
  return 'var(--color-destructive)';
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="border border-border/60 bg-card/95 backdrop-blur-sm rounded-md px-3 py-2 text-xs font-sans shadow-lg space-y-1">
      <p className="font-medium text-foreground">{label}</p>
      <p className="text-muted-foreground">
        Slot: <span className="font-mono tabular-nums text-foreground">{d.slotHeight.toLocaleString()}</span>
      </p>
      {d.delta === 0 ? (
        <p className="text-chart-5">Leader — most recent slot</p>
      ) : (
        <p className="text-muted-foreground/70">
          Behind: <span className="font-mono tabular-nums">{d.delta}</span> slots
          {' '}(~<span className="font-mono tabular-nums">{(d.delta * 0.4).toFixed(1)}s</span>)
        </p>
      )}
    </div>
  );
};

export function SolanaSlotSyncChart({ providers }: Props) {
  const withSlots = providers.filter(p => p.metrics.slot_height > 0);

  if (withSlots.length === 0) {
    return (
      <div className="flex items-center justify-center h-[240px]">
        <p className="text-muted-foreground/60 text-xs font-sans text-center">
          Slot data unavailable<br />
          <span className="text-[10px]">Live API keys required</span>
        </p>
      </div>
    );
  }

  const maxSlot = Math.max(...withSlots.map(p => p.metrics.slot_height));
  const data = [...withSlots]
    .sort((a, b) => a.metrics.slot_height - b.metrics.slot_height) // worst (most behind) first at top
    .map(p => ({
      name: p.name,
      delta: maxSlot - p.metrics.slot_height,
      slotHeight: p.metrics.slot_height,
    }));

  const maxDelta = Math.max(...data.map(d => d.delta), 1);

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 24, left: 0, bottom: 4 }}
        barCategoryGap="28%"
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.4} horizontal={false} />
        <XAxis
          type="number"
          domain={[0, maxDelta * 1.2 || 10]}
          tickFormatter={v => v === 0 ? 'Best' : `-${v}`}
          tick={{ fontSize: 10, fontFamily: 'var(--font-sans)', fill: 'var(--color-muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          label={{
            value: 'slots behind leader',
            position: 'insideBottom',
            offset: -2,
            style: { fontSize: 9, fontFamily: 'var(--font-sans)', fill: 'var(--color-muted-foreground)', opacity: 0.6 },
          }}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 10, fontFamily: 'var(--font-sans)', fill: 'var(--color-muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          width={72}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-muted)', fillOpacity: 0.2 }} />
        <Bar dataKey="delta" name="Slots Behind" radius={[0, 2, 2, 0]}>
          {data.map((entry, i) => (
            <Cell key={`cell-${i}`} fill={getBarColor(entry.delta)} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
