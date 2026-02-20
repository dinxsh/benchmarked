'use client';

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Label,
} from 'recharts';
import type { SolanaProvider } from './SolanaLeaderboardTable';

interface Props {
  providers: SolanaProvider[];
}

const TYPE_COLORS: Record<string, string> = {
  'json-rpc': 'var(--color-accent)',
  'rest-api': 'var(--color-chart-3)',
  'data-api': 'var(--color-destructive)',
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="border border-border/60 bg-card/95 backdrop-blur-sm rounded-md px-3 py-2 text-xs font-sans shadow-lg space-y-0.5">
      <p className="font-medium text-foreground mb-1">{d.name}</p>
      <p className="text-muted-foreground">P50: <span className="font-mono tabular-nums text-accent">{d.x}ms</span></p>
      <p className="text-muted-foreground">Throughput: <span className="font-mono tabular-nums text-primary">{d.y} rps</span></p>
      <p className="text-muted-foreground/70 text-[10px] capitalize">{d.type.replace('-', ' ')}</p>
    </div>
  );
};

export function SolanaScatterChart({ providers }: Props) {
  // Group by type so each gets its own color
  const typeGroups: Record<string, typeof providers> = {};
  providers.forEach(p => {
    const t = p.provider_type;
    if (!typeGroups[t]) typeGroups[t] = [];
    typeGroups[t].push(p);
  });

  const avgLatency = Math.round(
    providers.reduce((s, p) => s + p.metrics.latency_p50, 0) / providers.length
  );
  const avgThroughput = Math.round(
    providers.reduce((s, p) => s + p.metrics.throughput_rps, 0) / providers.length
  );

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    return (
      <g>
        <circle cx={cx} cy={cy} r={5} fill={TYPE_COLORS[payload.type] ?? '#888'} fillOpacity={0.85} />
        <text
          x={cx + 7}
          y={cy + 3}
          fontSize={8}
          fontFamily="var(--font-sans)"
          fill="var(--color-muted-foreground)"
        >
          {payload.name}
        </text>
      </g>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ScatterChart margin={{ top: 12, right: 40, left: -10, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.4} />
        <XAxis
          type="number"
          dataKey="x"
          name="Latency"
          unit="ms"
          tick={{ fontSize: 10, fontFamily: 'var(--font-sans)', fill: 'var(--color-muted-foreground)' }}
          axisLine={false}
          tickLine={false}
        >
          <Label
            value="P50 Latency (ms) →"
            position="insideBottom"
            offset={-12}
            style={{ fontSize: 9, fontFamily: 'var(--font-sans)', fill: 'var(--color-muted-foreground)' }}
          />
        </XAxis>
        <YAxis
          type="number"
          dataKey="y"
          name="Throughput"
          unit=" rps"
          tick={{ fontSize: 10, fontFamily: 'var(--font-sans)', fill: 'var(--color-muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          width={55}
        >
          <Label
            value="Throughput →"
            angle={-90}
            position="insideLeft"
            offset={18}
            style={{ fontSize: 9, fontFamily: 'var(--font-sans)', fill: 'var(--color-muted-foreground)' }}
          />
        </YAxis>
        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'var(--color-border)' }} />
        <ReferenceLine
          x={avgLatency}
          stroke="var(--color-muted-foreground)"
          strokeDasharray="4 4"
          strokeOpacity={0.4}
        />
        <ReferenceLine
          y={avgThroughput}
          stroke="var(--color-muted-foreground)"
          strokeDasharray="4 4"
          strokeOpacity={0.4}
        />
        {Object.entries(typeGroups).map(([type, group]) => (
          <Scatter
            key={type}
            name={type.replace('-', ' ')}
            data={group.map(p => ({
              x: p.metrics.latency_p50,
              y: p.metrics.throughput_rps,
              name: p.name,
              type: p.provider_type,
            }))}
            fill={TYPE_COLORS[type] ?? '#888'}
            shape={<CustomDot />}
          />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
}
