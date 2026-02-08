'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { StreamingBenchmarkResult } from '@/lib/benchmark-types';
import { prepareTimelineData, formatTimelineTimestamp, CHART_COLORS } from './chart-utils';
import { ReliabilityTooltip } from './chart-tooltips';

interface ReliabilityTimelineChartProps {
  results: StreamingBenchmarkResult[];
  height?: number;
}

export function ReliabilityTimelineChart({ results, height = 350 }: ReliabilityTimelineChartProps) {
  const timelineData = useMemo(() => prepareTimelineData(results), [results]);

  if (!timelineData || timelineData.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-[#888]"
        style={{ height }}
      >
        <p className="text-sm">No timeline data available</p>
      </div>
    );
  }

  // Get provider keys from data (excluding timestamp and goldrush)
  const providerKeys = useMemo(() => {
    if (timelineData.length === 0) return [];
    const keys = Object.keys(timelineData[0]).filter(key => key !== 'timestamp' && key !== 'goldrush');
    return keys;
  }, [timelineData]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={timelineData}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <defs>
          {/* Gold gradient for GoldRush */}
          <linearGradient id="goldAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.goldPrimary} stopOpacity={0.8} />
            <stop offset="95%" stopColor={CHART_COLORS.goldPrimary} stopOpacity={0.1} />
          </linearGradient>

          {/* Gray gradient for competitors */}
          <linearGradient id="grayAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.grayMedium} stopOpacity={0.4} />
            <stop offset="95%" stopColor={CHART_COLORS.grayMedium} stopOpacity={0.05} />
          </linearGradient>
        </defs>

        <CartesianGrid
          stroke={CHART_COLORS.gridDark}
          strokeDasharray="3 3"
          vertical={false}
        />

        <XAxis
          dataKey="timestamp"
          tick={{ fill: CHART_COLORS.grayMedium, fontSize: 11 }}
          stroke={CHART_COLORS.gridLight}
          tickFormatter={formatTimelineTimestamp}
          interval="preserveStartEnd"
          minTickGap={50}
        />

        <YAxis
          tick={{ fill: CHART_COLORS.grayLight, fontSize: 11 }}
          stroke={CHART_COLORS.gridLight}
          domain={[0, 100]}
          label={{
            value: 'Uptime %',
            angle: -90,
            position: 'insideLeft',
            fill: CHART_COLORS.goldPrimary,
            fontSize: 13,
            fontWeight: 600
          }}
        />

        {/* Competitor areas in muted colors */}
        {providerKeys.map((provider, index) => (
          <Area
            key={provider}
            type="monotone"
            dataKey={provider}
            stroke={CHART_COLORS.grayMedium}
            strokeWidth={1.5}
            fill="url(#grayAreaGradient)"
            dot={{ r: 0 }}
            animationBegin={index * 100}
            animationDuration={1000}
            animationEasing="ease-out"
          />
        ))}

        {/* GoldRush area on top with glow */}
        <Area
          type="monotone"
          dataKey="goldrush"
          stroke={CHART_COLORS.goldPrimary}
          strokeWidth={3}
          fill="url(#goldAreaGradient)"
          dot={{ r: 0 }}
          activeDot={{
            r: 6,
            fill: CHART_COLORS.goldLight,
            stroke: CHART_COLORS.goldPrimary,
            strokeWidth: 2,
            style: { filter: 'drop-shadow(0 0 6px rgba(230, 162, 60, 0.6))' }
          }}
          animationBegin={0}
          animationDuration={1200}
          animationEasing="ease-out"
        />

        <Tooltip content={<ReliabilityTooltip />} />

        <Legend
          verticalAlign="top"
          height={36}
          iconType="line"
          formatter={(value) => (
            <span
              style={{
                color: value === 'goldrush' ? CHART_COLORS.goldPrimary : CHART_COLORS.grayLight,
                fontWeight: value === 'goldrush' ? 600 : 400,
                fontSize: '12px',
                textTransform: 'capitalize'
              }}
            >
              {value === 'goldrush' ? 'GoldRush' : value}
            </span>
          )}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
