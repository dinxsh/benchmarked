'use client';

import { useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { StreamingBenchmarkResult } from '@/lib/benchmark-types';
import { prepareLatencyScatterData, CHART_COLORS } from './chart-utils';
import { LatencyScatterTooltip } from './chart-tooltips';

interface LatencyScatterChartProps {
  results: StreamingBenchmarkResult[];
  height?: number;
}

export function LatencyScatterChart({ results, height = 400 }: LatencyScatterChartProps) {
  const { p50Data, p95Data, p99Data } = useMemo(() => prepareLatencyScatterData(results), [results]);

  if (!p50Data || p50Data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-[#888]"
        style={{ height }}
      >
        <p className="text-sm">No latency data available</p>
      </div>
    );
  }

  // Custom shape for scatter dots
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    const isGoldRush = payload.isGoldRush;
    const percentile = payload.percentile;

    // Size based on percentile
    const radiusMap = {
      P50: isGoldRush ? 8 : 5,
      P95: isGoldRush ? 6 : 4,
      P99: isGoldRush ? 5 : 3
    };
    const radius = radiusMap[percentile as keyof typeof radiusMap] || 4;

    return (
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill={payload.color}
        stroke={isGoldRush ? CHART_COLORS.goldLight : CHART_COLORS.grayLight}
        strokeWidth={isGoldRush ? 3 : 1}
        style={{
          filter: isGoldRush ? 'drop-shadow(0 0 8px rgba(230, 162, 60, 0.6))' : 'none'
        }}
      />
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 40 }}>
        {/* Dark background grid */}
        <CartesianGrid
          stroke={CHART_COLORS.gridDark}
          strokeDasharray="5 5"
          vertical={false}
        />

        {/* X-axis with provider names */}
        <XAxis
          type="category"
          dataKey="provider"
          allowDuplicatedCategory={false}
          tick={{ fill: CHART_COLORS.grayLight, fontSize: 12, fontWeight: 500 }}
          stroke={CHART_COLORS.gridLight}
          axisLine={{ stroke: CHART_COLORS.gridLight, strokeWidth: 2 }}
        />

        {/* Y-axis for latency */}
        <YAxis
          type="number"
          dataKey="latency"
          tick={{ fill: CHART_COLORS.grayMedium, fontSize: 11 }}
          stroke={CHART_COLORS.gridLight}
          label={{
            value: 'Latency (ms)',
            angle: -90,
            position: 'insideLeft',
            fill: CHART_COLORS.goldPrimary,
            fontSize: 13,
            fontWeight: 600
          }}
        />

        {/* Reference line showing "fast" threshold */}
        <ReferenceLine
          y={100}
          stroke={CHART_COLORS.goldPrimary}
          strokeDasharray="3 3"
          strokeOpacity={0.4}
          label={{
            value: 'Fast Threshold',
            fill: CHART_COLORS.goldPrimary,
            fontSize: 11,
            position: 'right'
          }}
        />

        {/* P50 (median) - larger dots */}
        <Scatter
          name="P50 (median)"
          data={p50Data}
          fill={CHART_COLORS.goldPrimary}
          shape={<CustomDot />}
          animationBegin={0}
          animationDuration={800}
          animationEasing="ease-out"
        />

        {/* P95 - medium dots */}
        <Scatter
          name="P95"
          data={p95Data}
          fill={CHART_COLORS.grayLight}
          shape={<CustomDot />}
          animationBegin={100}
          animationDuration={800}
          animationEasing="ease-out"
        />

        {/* P99 - small dots */}
        <Scatter
          name="P99"
          data={p99Data}
          fill={CHART_COLORS.grayMedium}
          shape={<CustomDot />}
          animationBegin={200}
          animationDuration={800}
          animationEasing="ease-out"
        />

        <Tooltip content={<LatencyScatterTooltip />} />

        <Legend
          wrapperStyle={{ paddingTop: '15px' }}
          iconType="circle"
          formatter={(value) => (
            <span style={{ color: '#9ca3af', fontSize: '12px' }}>
              {value}
            </span>
          )}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
