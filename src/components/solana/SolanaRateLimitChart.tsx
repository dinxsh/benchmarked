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
  LabelList,
} from 'recharts';
import type { SolanaProvider } from './SolanaLeaderboardTable';

interface Props {
  providers: SolanaProvider[];
}

interface ParsedRateLimit {
  value: number;
  label: string;
  isUnlimited: boolean;
}

function parseRateLimit(raw: string): ParsedRateLimit {
  if (!raw || raw.toLowerCase().includes('unlimited')) {
    return { value: Infinity, label: 'Unlimited', isUnlimited: true };
  }
  const match = raw.match(/(\d+(?:\.\d+)?)/);
  const num = match ? parseFloat(match[1]) : 0;
  return { value: num, label: `${num} req/s`, isUnlimited: false };
}

function getBarColor(parsed: ParsedRateLimit): string {
  if (parsed.isUnlimited) return 'var(--color-accent)';
  if (parsed.value >= 500) return 'var(--color-chart-5)';
  if (parsed.value >= 200) return 'var(--color-chart-2)';
  if (parsed.value >= 100) return 'var(--color-chart-3)';
  return 'var(--color-destructive)';
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="border border-border/60 bg-card/95 backdrop-blur-sm rounded-md px-3 py-2 text-xs font-sans shadow-lg space-y-1">
      <p className="font-medium text-foreground">{label}</p>
      <p className="text-muted-foreground">
        Rate limit:{' '}
        <span className="font-mono tabular-nums text-foreground">{d.displayLabel}</span>
      </p>
    </div>
  );
};

export function SolanaRateLimitChart({ providers }: Props) {
  const parsed = providers.map(p => {
    const rl = parseRateLimit(p.pricing.rate_limit);
    return { ...rl, name: p.name, displayLabel: rl.label };
  });

  const maxFinite = Math.max(...parsed.filter(d => !d.isUnlimited).map(d => d.value), 100);
  const cappedMax = maxFinite * 1.25;

  const data = parsed
    .map(d => ({
      name: d.name,
      rateLimit: d.isUnlimited ? cappedMax : d.value,
      displayLabel: d.displayLabel,
      isUnlimited: d.isUnlimited,
      _parsed: d,
    }))
    .sort((a, b) => b.rateLimit - a.rateLimit);

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 80, left: 0, bottom: 4 }}
        barCategoryGap="28%"
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.4} horizontal={false} />
        <XAxis
          type="number"
          domain={[0, cappedMax * 1.05]}
          tickFormatter={v => v >= cappedMax * 0.95 ? '∞' : `${v}`}
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
        <Bar dataKey="rateLimit" name="Rate Limit" radius={[0, 2, 2, 0]}>
          <LabelList
            dataKey="displayLabel"
            position="right"
            style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: 'var(--color-muted-foreground)', opacity: 0.8 }}
          />
          {data.map((entry, i) => (
            <Cell key={`cell-${i}`} fill={getBarColor(entry._parsed)} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
