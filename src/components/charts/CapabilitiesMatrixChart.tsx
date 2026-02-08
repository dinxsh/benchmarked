'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { StreamingBenchmarkResult } from '@/lib/benchmark-types';
import { prepareCapabilitiesData, CHART_COLORS } from './chart-utils';
import { CapabilitiesTooltip } from './chart-tooltips';

interface CapabilitiesMatrixChartProps {
  results: StreamingBenchmarkResult[];
  height?: number;
}

export function CapabilitiesMatrixChart({ results, height = 400 }: CapabilitiesMatrixChartProps) {
  const capabilitiesData = useMemo(() => prepareCapabilitiesData(results), [results]);

  if (!capabilitiesData || capabilitiesData.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-[#888]"
        style={{ height }}
      >
        <p className="text-sm">No capabilities data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={capabilitiesData}
        layout="vertical"
        margin={{ top: 20, right: 30, bottom: 20, left: 100 }}
      >
        <CartesianGrid
          stroke={CHART_COLORS.gridMedium}
          strokeDasharray="3 3"
          horizontal={false}
        />

        <XAxis
          type="number"
          domain={[0, 100]}
          tick={{ fill: CHART_COLORS.grayMedium, fontSize: 11 }}
          stroke={CHART_COLORS.gridLight}
          label={{
            value: 'Capability Coverage %',
            position: 'insideBottom',
            fill: CHART_COLORS.grayLight,
            offset: -10
          }}
        />

        <YAxis
          type="category"
          dataKey="provider"
          tick={{ fill: CHART_COLORS.grayLight, fontSize: 12, fontWeight: 500 }}
          stroke={CHART_COLORS.gridLight}
          width={90}
        />

        {/* Each capability as a stacked segment */}
        <Bar
          dataKey="transactions"
          stackId="a"
          fill={CHART_COLORS.goldPrimary}
          radius={[0, 0, 0, 0]}
          animationBegin={0}
          animationDuration={800}
          animationEasing="ease-out"
        />
        <Bar
          dataKey="logs"
          stackId="a"
          fill={CHART_COLORS.goldLight}
          animationBegin={100}
          animationDuration={800}
          animationEasing="ease-out"
        />
        <Bar
          dataKey="traces"
          stackId="a"
          fill={CHART_COLORS.goldDark}
          animationBegin={200}
          animationDuration={800}
          animationEasing="ease-out"
        />
        <Bar
          dataKey="nft"
          stackId="a"
          fill={CHART_COLORS.goldAccent}
          animationBegin={300}
          animationDuration={800}
          animationEasing="ease-out"
        />
        <Bar
          dataKey="balances"
          stackId="a"
          fill={CHART_COLORS.goldSubtle}
          animationBegin={400}
          animationDuration={800}
          animationEasing="ease-out"
        />
        <Bar
          dataKey="custom"
          stackId="a"
          fill={CHART_COLORS.goldPale}
          radius={[0, 8, 8, 0]}
          animationBegin={500}
          animationDuration={800}
          animationEasing="ease-out"
        />

        <Tooltip content={<CapabilitiesTooltip />} />

        <Legend
          wrapperStyle={{ paddingTop: '20px' }}
          iconType="square"
          formatter={(value) => {
            const labels: Record<string, string> = {
              transactions: 'Transactions',
              logs: 'Event Logs',
              traces: 'Traces',
              nft: 'NFT Metadata',
              balances: 'Token Balances',
              custom: 'Custom Indexing'
            };
            return (
              <span style={{ fontSize: '12px', color: '#d1d5db' }}>
                {labels[value as string]}
              </span>
            );
          }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
