'use client';

import { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import { StreamingBenchmarkResult } from '@/lib/benchmark-types';
import { prepareValueData, CHART_COLORS } from './chart-utils';
import { ValueScoreTooltip } from './chart-tooltips';

interface ValueScoreChartProps {
  results: StreamingBenchmarkResult[];
  height?: number;
}

export function ValueScoreChart({ results, height = 450 }: ValueScoreChartProps) {
  const valueData = useMemo(() => prepareValueData(results), [results]);

  if (!valueData || valueData.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-[#888]"
        style={{ height }}
      >
        <p className="text-sm">No value data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart
        data={valueData}
        margin={{ top: 20, right: 60, bottom: 40, left: 20 }}
      >
        {/* Gold gradient definition */}
        <defs>
          <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.goldLight} stopOpacity={0.9} />
            <stop offset="50%" stopColor={CHART_COLORS.goldPrimary} stopOpacity={0.8} />
            <stop offset="100%" stopColor={CHART_COLORS.goldDark} stopOpacity={0.7} />
          </linearGradient>
        </defs>

        {/* Dark grid with horizontal lines only */}
        <CartesianGrid
          stroke={CHART_COLORS.gridMedium}
          strokeDasharray="3 3"
          vertical={false}
          horizontal={true}
        />

        {/* Provider names on X-axis */}
        <XAxis
          dataKey="provider"
          tick={{ fill: CHART_COLORS.grayLight, fontSize: 12, fontWeight: 500 }}
          stroke={CHART_COLORS.gridLight}
          angle={-15}
          textAnchor="end"
          height={60}
        />

        {/* Left Y-axis: Performance Score */}
        <YAxis
          yAxisId="performance"
          tick={{ fill: CHART_COLORS.goldPrimary, fontSize: 11, fontWeight: 600 }}
          stroke={CHART_COLORS.goldPrimary}
          label={{
            value: 'Performance Score',
            angle: -90,
            position: 'insideLeft',
            fill: CHART_COLORS.goldPrimary,
            fontWeight: 600
          }}
        />

        {/* Right Y-axis: Cost */}
        <YAxis
          yAxisId="cost"
          orientation="right"
          tick={{ fill: CHART_COLORS.grayLight, fontSize: 11 }}
          stroke={CHART_COLORS.grayMedium}
          label={{
            value: 'Cost per Million ($)',
            angle: 90,
            position: 'insideRight',
            fill: CHART_COLORS.grayLight
          }}
        />

        {/* Performance bars with gradient */}
        <Bar
          yAxisId="performance"
          dataKey="performanceScore"
          radius={[8, 8, 0, 0]}
          barSize={40}
          animationBegin={0}
          animationDuration={1000}
          animationEasing="ease-out"
        >
          {valueData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.isGoldRush ? 'url(#goldGradient)' : CHART_COLORS.grayDark}
              stroke={entry.isGoldRush ? CHART_COLORS.goldLight : 'transparent'}
              strokeWidth={entry.isGoldRush ? 2 : 0}
            />
          ))}
        </Bar>

        {/* Cost line with markers */}
        <Line
          yAxisId="cost"
          type="monotone"
          dataKey="costPerMillion"
          stroke={CHART_COLORS.grayLight}
          strokeWidth={2}
          dot={{
            r: 5,
            fill: '#1f2937',
            stroke: CHART_COLORS.grayLight,
            strokeWidth: 2
          }}
          activeDot={{
            r: 7,
            fill: CHART_COLORS.goldPrimary,
            stroke: CHART_COLORS.goldLight,
            strokeWidth: 3
          }}
          animationBegin={200}
          animationDuration={800}
          animationEasing="ease-out"
        />

        <Tooltip content={<ValueScoreTooltip />} />

        <Legend
          wrapperStyle={{ paddingTop: '20px' }}
          formatter={(value) => {
            const labels: Record<string, string> = {
              performanceScore: 'Performance Score',
              costPerMillion: 'Cost per Million'
            };
            return (
              <span
                style={{
                  color: value === 'performanceScore' ? CHART_COLORS.goldPrimary : CHART_COLORS.grayLight,
                  fontWeight: 600,
                  fontSize: '12px'
                }}
              >
                {labels[value as string]}
              </span>
            );
          }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
