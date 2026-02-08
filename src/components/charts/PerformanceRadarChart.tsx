'use client';

import { useMemo } from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';
import { StreamingBenchmarkResult } from '@/lib/benchmark-types';
import { prepareRadarData, getRadarProviderKeys, CHART_COLORS, normalizeProviderName } from './chart-utils';
import { CustomRadarTooltip } from './chart-tooltips';

interface PerformanceRadarChartProps {
  results: StreamingBenchmarkResult[];
  height?: number;
}

export function PerformanceRadarChart({ results, height = 500 }: PerformanceRadarChartProps) {
  const radarData = useMemo(() => prepareRadarData(results), [results]);
  const providerKeys = useMemo(() => getRadarProviderKeys(radarData), [radarData]);

  if (!radarData || radarData.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-[#888]"
        style={{ height }}
      >
        <p className="text-sm">No data available for radar chart</p>
      </div>
    );
  }

  // Provider color mapping
  const getProviderColor = (provider: string): string => {
    if (provider === 'goldrush') return CHART_COLORS.goldPrimary;
    const colors = [
      CHART_COLORS.grayMedium,
      CHART_COLORS.grayDark,
      CHART_COLORS.graySubtle,
      CHART_COLORS.grayLight,
    ];
    const index = providerKeys.indexOf(provider) - 1; // -1 because goldrush is index 0
    return colors[index % colors.length];
  };

  // Provider opacity mapping
  const getProviderOpacity = (provider: string): number => {
    return provider === 'goldrush' ? 0.35 : 0.12;
  };

  // Provider stroke width
  const getStrokeWidth = (provider: string): number => {
    return provider === 'goldrush' ? 3 : 1.5;
  };

  // Custom legend formatter
  const legendFormatter = (value: string) => {
    const isGoldRush = value === 'goldrush';
    const displayName = value === 'goldrush' ? 'GoldRush' : value.charAt(0).toUpperCase() + value.slice(1);

    return (
      <span
        style={{
          color: isGoldRush ? CHART_COLORS.goldPrimary : CHART_COLORS.grayLight,
          fontWeight: isGoldRush ? 600 : 400,
          fontSize: '14px'
        }}
      >
        {displayName}
      </span>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={radarData}>
        {/* Dark grid with subtle lines */}
        <PolarGrid
          stroke={CHART_COLORS.gridMedium}
          strokeWidth={1}
          gridType="polygon"
        />

        {/* Axis labels in white with gold accent */}
        <PolarAngleAxis
          dataKey="metric"
          tick={{
            fill: '#ffffff',
            fontSize: 13,
            fontWeight: 600
          }}
          stroke={CHART_COLORS.goldPrimary}
          strokeWidth={2}
        />

        {/* Radial grid values */}
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{
            fill: CHART_COLORS.grayMedium,
            fontSize: 11
          }}
          stroke={CHART_COLORS.gridLight}
        />

        {/* Render competitor radars first (behind GoldRush) */}
        {providerKeys
          .filter(key => key !== 'goldrush')
          .map((provider, index) => (
            <Radar
              key={provider}
              name={provider}
              dataKey={provider}
              stroke={getProviderColor(provider)}
              fill={getProviderColor(provider)}
              fillOpacity={getProviderOpacity(provider)}
              strokeWidth={getStrokeWidth(provider)}
              animationBegin={index * 100}
              animationDuration={1000}
              animationEasing="ease-out"
            />
          ))}

        {/* GoldRush radar on top with prominence */}
        <Radar
          name="goldrush"
          dataKey="goldrush"
          stroke={CHART_COLORS.goldPrimary}
          fill={CHART_COLORS.goldPrimary}
          fillOpacity={0.35}
          strokeWidth={3}
          dot={{
            r: 6,
            fill: CHART_COLORS.goldPrimary,
            stroke: '#000',
            strokeWidth: 2
          }}
          activeDot={{
            r: 8,
            fill: CHART_COLORS.goldLight,
            stroke: CHART_COLORS.goldPrimary,
            strokeWidth: 3,
            style: {
              filter: 'drop-shadow(0 0 8px rgba(230, 162, 60, 0.6))'
            }
          }}
          animationBegin={0}
          animationDuration={1200}
          animationEasing="ease-out"
        />

        <Legend
          wrapperStyle={{
            paddingTop: '20px',
            fontSize: '14px',
            fontWeight: 600
          }}
          iconType="circle"
          formatter={legendFormatter}
        />

        <Tooltip
          content={<CustomRadarTooltip />}
          cursor={{ stroke: CHART_COLORS.goldPrimary, strokeWidth: 2 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
