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
  ReferenceLine,
} from 'recharts';
import type { SolanaProvider } from './SolanaLeaderboardTable';

interface Props {
  providers: SolanaProvider[];
}

function getBarColor(rate: number): string {
  if (rate < 1) return 'var(--color-chart-5)';
  if (rate < 5) return 'var(--color-chart-3)';
  return 'var(--color-destructive)';
}

function getQualityLabel(rate: number): string {
  if (rate < 1) return 'Excellent';
  if (rate < 5) return 'Acceptable';
  return 'Poor';
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const rate = payload[0].value as number;
  const color = getBarColor(rate);
  return (
    <div className="border border-border/60 bg-card/95 backdrop-blur-sm rounded-md px-3 py-2 text-xs font-sans shadow-lg space-y-1">
      <p className="font-medium text-foreground">{label}</p>
      <p style={{ color }}>
        <span className="font-mono tabular-nums">{rate.toFixed(2)}%</span> error rate
      </p>
      <p className="text-muted-foreground/70 text-[10px]">{getQualityLabel(rate)}</p>
    </div>
  );
};

export function SolanaErrorRateChart({ providers }: Props) {
  const sorted = [...providers].sort((a, b) => a.metrics.error_rate - b.metrics.error_rate);
  const data = sorted.map(p => ({
    name: p.name,
    rate: p.metrics.error_rate,
    isUs: p.is_us,
  }));

  const maxRate = Math.max(...data.map(d => d.rate), 1);
  const avgRate = data.reduce((s, d) => s + d.rate, 0) / data.length;

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
          domain={[0, maxRate * 1.2]}
          tickFormatter={v => `${v}%`}
          tick={{ fontSize: 10, fontFamily: 'var(--font-sans)', fill: 'var(--color-muted-foreground)' }}
          axisLine={false}
          tickLine={false}
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
        <ReferenceLine
          x={avgRate}
          stroke="var(--color-muted-foreground)"
          strokeDasharray="4 4"
          strokeOpacity={0.4}
        />
        <Bar dataKey="rate" name="Error Rate" radius={[0, 2, 2, 0]}>
          {data.map((entry, i) => (
            <Cell key={`cell-${i}`} fill={getBarColor(entry.rate)} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
