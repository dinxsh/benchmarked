'use client';

import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
  LabelList,
} from 'recharts';
import type { SolanaProvider } from './SolanaLeaderboardTable';

interface Props {
  providers: SolanaProvider[];
}

// Hyperliquid palette
const C_P50  = '#60a5fa';                   // electric blue
const C_P95  = 'rgba(217,119,6,0.70)';      // amber muted
const C_P99  = 'rgba(224,82,82,0.55)';      // red faded

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const p50Val   = payload.find((p: any) => p.dataKey === 'p50')?.value ?? 0;
  const p95Delta = payload.find((p: any) => p.dataKey === 'p95_delta')?.value ?? 0;
  const p99Delta = payload.find((p: any) => p.dataKey === 'p99_delta')?.value ?? 0;
  const p95Val   = p50Val + p95Delta;
  const p99Val   = p95Val + p99Delta;

  return (
    <div className="border border-border/60 bg-card/95 backdrop-blur-sm rounded-lg px-3.5 py-3 text-xs shadow-lg min-w-[156px]">
      <p className="text-xs font-semibold text-foreground mb-2.5 pb-2 border-b border-border/40">{label}</p>
      <div className="space-y-1.5">
        {[
          { label: 'P50', value: p50Val, color: C_P50 },
          { label: 'P95', value: p95Val, color: '#d97706' },
          { label: 'P99', value: p99Val, color: '#e05252' },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between gap-5">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2 w-2 rounded-sm shrink-0" style={{ backgroundColor: row.color }} />
              {row.label}
            </span>
            <span className="font-mono tabular-nums font-medium" style={{ color: row.color }}>
              {row.value}ms
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const LegendRenderer = ({ payload }: any) => {
  const labels: Record<string, string> = {
    p50:       'P50 median',
    p95_delta: '+P95 range',
    p99_delta: '+P99 tail',
  };
  const colors: Record<string, string> = {
    p50:       C_P50,
    p95_delta: '#d97706',
    p99_delta: '#e05252',
  };
  if (!payload) return null;
  return (
    <div className="flex items-center gap-5 justify-center pt-3">
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-1.5">
          <span
            className="h-2 w-3 rounded-sm inline-block"
            style={{ backgroundColor: colors[entry.dataKey] ?? entry.color }}
          />
          <span className="text-xs font-sans text-muted-foreground/70">
            {labels[entry.dataKey] ?? entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export function SolanaLatencyChart({ providers }: Props) {
  const sorted  = [...providers].sort((a, b) => a.metrics.latency_p50 - b.metrics.latency_p50);
  const bestP50 = sorted[0]?.metrics.latency_p50 ?? 0;

  const data = sorted.map((p, i) => ({
    name:        p.name,
    p50:         p.metrics.latency_p50,
    p95_delta:   Math.max(0, p.metrics.latency_p95 - p.metrics.latency_p50),
    p99_delta:   Math.max(0, p.metrics.latency_p99 - p.metrics.latency_p95),
    deltaVsBest: i === 0 ? 0 : p.metrics.latency_p50 - bestP50,
  }));

  const chartHeight = Math.max(240, sorted.length * 40 + 40);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <ComposedChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 72, left: 4, bottom: 0 }}
        barCategoryGap="30%"
      >
        <CartesianGrid
          strokeDasharray="2 6"
          stroke="var(--color-border)"
          horizontal={false}
          strokeOpacity={0.30}
        />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: 'var(--color-muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          unit="ms"
          tickCount={6}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11, fontFamily: 'var(--font-sans)', fill: 'var(--color-muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          width={90}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: 'var(--color-muted)', fillOpacity: 0.12 }}
        />

        <ReferenceLine
          x={100}
          stroke={C_P50}
          strokeOpacity={0.18}
          strokeDasharray="4 4"
          label={{ value: '100ms', fill: C_P50, fontSize: 9, opacity: 0.40, position: 'insideTopRight' }}
        />
        <ReferenceLine
          x={300}
          stroke="#d97706"
          strokeOpacity={0.18}
          strokeDasharray="4 4"
          label={{ value: '300ms', fill: '#d97706', fontSize: 9, opacity: 0.40, position: 'insideTopRight' }}
        />

        {/* P50 solid bar — electric blue */}
        <Bar
          dataKey="p50"
          name="P50"
          fill={C_P50}
          stackId="latency"
          radius={[3, 0, 0, 3]}
          maxBarSize={16}
        />

        {/* P95 extension — amber muted */}
        <Bar
          dataKey="p95_delta"
          name="P95 range"
          fill={C_P95}
          stackId="latency"
          maxBarSize={16}
        />

        {/* P99 tail — red faded, with delta annotation */}
        <Bar
          dataKey="p99_delta"
          name="P99 tail"
          fill={C_P99}
          stackId="latency"
          radius={[0, 3, 3, 0]}
          maxBarSize={16}
        >
          <LabelList
            dataKey="deltaVsBest"
            position="right"
            content={(props: any) => {
              const { x, y, width, height, value } = props;
              const cx = (x as number) + (width as number) + 6;
              const cy = (y as number) + (height as number) / 2;
              if (value === 0) {
                return (
                  <text
                    x={cx} y={cy}
                    fill={C_P50} fontSize={11}
                    fontFamily="var(--font-mono)"
                    dominantBaseline="central" opacity={0.80}
                  >
                    #1
                  </text>
                );
              }
              return (
                <text
                  x={cx} y={cy}
                  fill="var(--color-muted-foreground)" fontSize={11}
                  fontFamily="var(--font-mono)"
                  dominantBaseline="central" opacity={0.55}
                >
                  +{value}ms
                </text>
              );
            }}
          />
        </Bar>

        <Legend content={<LegendRenderer />} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
