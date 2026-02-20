'use client';

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { SolanaProvider } from './SolanaLeaderboardTable';

interface Props {
  providers: SolanaProvider[];
}

interface ScatterPoint {
  x: number;
  y: number;
  z: number;
  name: string;
  cost: number;
  free: boolean;
}

interface TooltipPayload {
  payload: ScatterPoint;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="border border-border/60 bg-card/95 backdrop-blur-sm rounded-md px-3 py-2 text-xs font-sans shadow-lg space-y-1">
      <p className="font-medium text-foreground mb-0.5">{d.name}</p>
      <p><span className="text-muted-foreground">Cost: </span><span className={d.free ? 'text-chart-5' : 'text-foreground font-mono tabular-nums'}>{d.free ? 'Free' : `$${d.cost}/M`}</span></p>
      <p><span className="text-muted-foreground">Score: </span><span className="text-chart-1 font-mono tabular-nums">{d.y.toFixed(1)}</span></p>
      <p><span className="text-muted-foreground">Throughput: </span><span className="font-mono tabular-nums">{d.z} rps</span></p>
    </div>
  );
}

interface DotProps {
  cx?: number;
  cy?: number;
  r?: number;
  payload?: ScatterPoint;
}

function CustomDot({ cx = 0, cy = 0, r = 8, payload }: DotProps) {
  const isFree = payload?.free;
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={isFree ? 'var(--color-chart-5)' : 'var(--color-chart-1)'}
        fillOpacity={0.75}
        stroke={isFree ? 'var(--color-chart-5)' : 'var(--color-chart-1)'}
        strokeWidth={1}
      />
      <text
        x={cx}
        y={cy - r - 3}
        textAnchor="middle"
        fontSize={8}
        fontFamily="var(--font-sans)"
        fill="var(--color-muted-foreground)"
      >
        {payload?.name}
      </text>
    </g>
  );
}

export function SolanaCostEfficiencyChart({ providers }: Props) {
  const maxCost = Math.max(...providers.map(p => p.pricing.cost_per_million));
  const avgScore = providers.reduce((s, p) => s + p.score, 0) / providers.length;

  const points: ScatterPoint[] = providers.map(p => ({
    x:    p.pricing.cost_per_million === 0 ? 0.1 : p.pricing.cost_per_million,
    y:    p.score,
    z:    p.metrics.throughput_rps,
    name: p.name,
    cost: p.pricing.cost_per_million,
    free: p.pricing.cost_per_million === 0,
  }));

  const paid = points.filter(p => !p.free);
  const free = points.filter(p => p.free);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ScatterChart margin={{ top: 20, right: 16, left: 0, bottom: 8 }}>
        <XAxis
          type="number"
          dataKey="x"
          domain={[0, maxCost > 0 ? maxCost * 1.1 : 1]}
          name="Cost/M"
          tick={{ fontSize: 9, fontFamily: 'var(--font-sans)', fill: 'var(--color-muted-foreground)' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={v => v <= 0.15 ? 'Free' : `$${v}`}
          label={{ value: 'Cost / M req (USD)', position: 'insideBottom', offset: -4, fontSize: 9, fontFamily: 'var(--font-sans)', fill: 'var(--color-muted-foreground)' }}
        />
        <YAxis
          type="number"
          dataKey="y"
          domain={[50, 100]}
          name="Score"
          tick={{ fontSize: 9, fontFamily: 'var(--font-sans)', fill: 'var(--color-muted-foreground)' }}
          tickLine={false}
          axisLine={false}
          width={36}
        />
        <ZAxis type="number" dataKey="z" range={[40, 200]} />
        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'var(--color-border)' }} />
        <ReferenceLine
          y={avgScore}
          stroke="var(--color-muted-foreground)"
          strokeDasharray="4 4"
          strokeOpacity={0.5}
          label={{ value: 'avg', position: 'insideTopRight', fontSize: 8, fontFamily: 'var(--font-sans)', fill: 'var(--color-muted-foreground)' }}
        />
        <Scatter data={paid} shape={<CustomDot />}>
          {paid.map((_, i) => <Cell key={i} />)}
        </Scatter>
        <Scatter data={free} shape={<CustomDot />}>
          {free.map((_, i) => <Cell key={i} />)}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}
