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
  'json-rpc': 'hsl(var(--accent))',
  'rest-api': 'hsl(38 70% 55%)',
  'data-api': 'hsl(var(--destructive))',
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-background border border-border p-2 text-[10px] font-mono shadow space-y-0.5">
      <p className="font-medium text-foreground">{d.name}</p>
      <p className="text-muted-foreground">P50: <span className="text-accent">{d.x}ms</span></p>
      <p className="text-muted-foreground">Throughput: <span className="text-primary">{d.y} rps</span></p>
      <p className="text-muted-foreground capitalize">{d.type.replace('-', ' ')}</p>
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
          fontFamily="monospace"
          fill="hsl(var(--muted-foreground))"
        >
          {payload.name}
        </text>
      </g>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ScatterChart margin={{ top: 12, right: 40, left: -10, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
        <XAxis
          type="number"
          dataKey="x"
          name="Latency"
          unit="ms"
          tick={{ fontSize: 10, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
        >
          <Label
            value="P50 Latency (ms) →"
            position="insideBottom"
            offset={-12}
            style={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }}
          />
        </XAxis>
        <YAxis
          type="number"
          dataKey="y"
          name="Throughput"
          unit=" rps"
          tick={{ fontSize: 10, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
          width={55}
        >
          <Label
            value="Throughput →"
            angle={-90}
            position="insideLeft"
            offset={18}
            style={{ fontSize: 9, fontFamily: 'monospace', fill: 'hsl(var(--muted-foreground))' }}
          />
        </YAxis>
        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'hsl(var(--border))' }} />
        <ReferenceLine
          x={avgLatency}
          stroke="hsl(var(--muted-foreground))"
          strokeDasharray="4 4"
          strokeOpacity={0.4}
        />
        <ReferenceLine
          y={avgThroughput}
          stroke="hsl(var(--muted-foreground))"
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
