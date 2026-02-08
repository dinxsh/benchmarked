import { StreamingBenchmarkResult } from '@/lib/benchmark-types';

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface RadarDataPoint {
  metric: string;
  goldrush: number;
  alchemy?: number;
  zerion?: number;
  infura?: number;
  quicknode?: number;
  ankr?: number;
}

export interface LatencyPoint {
  provider: string;
  latency: number;
  percentile: 'P50' | 'P95' | 'P99';
  color: string;
  isGoldRush: boolean;
}

export interface ValueDataPoint {
  provider: string;
  performanceScore: number;
  costPerMillion: number;
  isGoldRush: boolean;
  valueRatio: number;
}

export interface TimelineDataPoint {
  timestamp: number;
  goldrush: number;
  alchemy?: number;
  zerion?: number;
  infura?: number;
  quicknode?: number;
  ankr?: number;
}

export interface CapabilityDataPoint {
  provider: string;
  transactions: number;
  logs: number;
  traces: number;
  nft: number;
  balances: number;
  custom: number;
  totalCoverage: number;
}

// ==========================================
// COLOR CONSTANTS
// ==========================================

export const CHART_COLORS = {
  // GoldRush (Primary)
  goldPrimary: '#E6A23C',
  goldLight: '#FFD700',
  goldDark: '#B8860B',
  goldAccent: '#DAA520',
  goldSubtle: '#F4C430',
  goldPale: '#FFE135',

  // Competitors (Grays)
  grayLight: '#9ca3af',
  grayMedium: '#6b7280',
  grayDark: '#4b5563',
  graySubtle: '#374151',

  // Backgrounds
  bgDarkest: '#050505',
  bgDark: '#0A0A0A',
  bgCard: 'rgba(0, 0, 0, 0.6)',
  bgCardHover: 'rgba(0, 0, 0, 0.8)',

  // Borders & Grids
  gridDark: '#1a1a1a',
  gridMedium: '#2a2a2a',
  gridLight: '#3a3a3a',
  borderGold: 'rgba(230, 162, 60, 0.3)',
  borderWhite: 'rgba(255, 255, 255, 0.1)'
};

// Provider-specific colors for consistency
export const PROVIDER_COLORS: Record<string, string> = {
  'goldrush-streaming': CHART_COLORS.goldPrimary,
  'alchemy-ws': CHART_COLORS.grayMedium,
  'zerion': CHART_COLORS.grayDark,
  'infura-ws': CHART_COLORS.graySubtle,
  'quicknode-ws': CHART_COLORS.grayLight,
  'ankr-ws': CHART_COLORS.grayDark,
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Calculate speed score from latency (lower latency = higher score)
 */
export const calculateSpeed = (latency: number): number => {
  return Math.max(0, Math.min(100, 100 - (latency / 5)));
};

/**
 * Calculate stability score from connection drops
 */
export const calculateStability = (drops: number): number => {
  return Math.max(0, 100 - (drops * 10));
};

/**
 * Calculate composite performance score from metrics
 */
export const calculateCompositeScore = (metrics: any): number => {
  const speedScore = calculateSpeed(metrics.connection_latency);
  const throughputScore = Math.min(100, metrics.throughput * 8);
  const reliabilityScore = metrics.uptime_percent;

  return (speedScore + throughputScore + reliabilityScore) / 3;
};

/**
 * Normalize a provider name for display
 */
export const normalizeProviderName = (name: string): string => {
  return name
    .replace(' Streaming', '')
    .replace(' WebSocket', '')
    .replace('GoldRush', 'GoldRush');
};

/**
 * Check if a provider is GoldRush
 */
export const isGoldRush = (providerId: string): boolean => {
  return providerId === 'goldrush-streaming';
};

// ==========================================
// DATA TRANSFORMATION FUNCTIONS
// ==========================================

/**
 * Prepare data for Performance Radar Chart
 * Transforms benchmark results into 6-metric radar data
 */
export const prepareRadarData = (results: StreamingBenchmarkResult[]): RadarDataPoint[] => {
  if (!results || results.length === 0) return [];

  const goldrush = results.find(r => isGoldRush(r.provider.id));
  const competitors = results.filter(r => !isGoldRush(r.provider.id));

  const getProviderValue = (providers: StreamingBenchmarkResult[], index: number, getter: (r: StreamingBenchmarkResult) => number) => {
    return providers[index] ? getter(providers[index]) : undefined;
  };

  return [
    {
      metric: 'Speed',
      goldrush: goldrush ? calculateSpeed(goldrush.metrics.connection_latency) : 0,
      alchemy: getProviderValue(competitors, 0, r => calculateSpeed(r.metrics.connection_latency)),
      zerion: getProviderValue(competitors, 1, r => calculateSpeed(r.metrics.connection_latency)),
      infura: getProviderValue(competitors, 2, r => calculateSpeed(r.metrics.connection_latency)),
      quicknode: getProviderValue(competitors, 3, r => calculateSpeed(r.metrics.connection_latency)),
      ankr: getProviderValue(competitors, 4, r => calculateSpeed(r.metrics.connection_latency)),
    },
    {
      metric: 'Throughput',
      goldrush: goldrush ? Math.min(100, goldrush.metrics.throughput * 8) : 0,
      alchemy: getProviderValue(competitors, 0, r => Math.min(100, r.metrics.throughput * 8)),
      zerion: getProviderValue(competitors, 1, r => Math.min(100, r.metrics.throughput * 8)),
      infura: getProviderValue(competitors, 2, r => Math.min(100, r.metrics.throughput * 8)),
      quicknode: getProviderValue(competitors, 3, r => Math.min(100, r.metrics.throughput * 8)),
      ankr: getProviderValue(competitors, 4, r => Math.min(100, r.metrics.throughput * 8)),
    },
    {
      metric: 'Reliability',
      goldrush: goldrush?.metrics.uptime_percent || 0,
      alchemy: competitors[0]?.metrics.uptime_percent,
      zerion: competitors[1]?.metrics.uptime_percent,
      infura: competitors[2]?.metrics.uptime_percent,
      quicknode: competitors[3]?.metrics.uptime_percent,
      ankr: competitors[4]?.metrics.uptime_percent,
    },
    {
      metric: 'Quality',
      goldrush: goldrush ? 100 - goldrush.metrics.error_rate : 0,
      alchemy: getProviderValue(competitors, 0, r => 100 - r.metrics.error_rate),
      zerion: getProviderValue(competitors, 1, r => 100 - r.metrics.error_rate),
      infura: getProviderValue(competitors, 2, r => 100 - r.metrics.error_rate),
      quicknode: getProviderValue(competitors, 3, r => 100 - r.metrics.error_rate),
      ankr: getProviderValue(competitors, 4, r => 100 - r.metrics.error_rate),
    },
    {
      metric: 'Completeness',
      goldrush: goldrush?.metrics.data_completeness || 0,
      alchemy: competitors[0]?.metrics.data_completeness,
      zerion: competitors[1]?.metrics.data_completeness,
      infura: competitors[2]?.metrics.data_completeness,
      quicknode: competitors[3]?.metrics.data_completeness,
      ankr: competitors[4]?.metrics.data_completeness,
    },
    {
      metric: 'Stability',
      goldrush: goldrush ? calculateStability(goldrush.metrics.connection_drops) : 0,
      alchemy: getProviderValue(competitors, 0, r => calculateStability(r.metrics.connection_drops)),
      zerion: getProviderValue(competitors, 1, r => calculateStability(r.metrics.connection_drops)),
      infura: getProviderValue(competitors, 2, r => calculateStability(r.metrics.connection_drops)),
      quicknode: getProviderValue(competitors, 3, r => calculateStability(r.metrics.connection_drops)),
      ankr: getProviderValue(competitors, 4, r => calculateStability(r.metrics.connection_drops)),
    }
  ];
};

/**
 * Prepare data for Latency Scatter Plot
 * Simulates P50/P95/P99 percentiles from base latency
 */
export const prepareLatencyScatterData = (results: StreamingBenchmarkResult[]) => {
  if (!results || results.length === 0) {
    return { p50Data: [], p95Data: [], p99Data: [] };
  }

  const p50Data: LatencyPoint[] = [];
  const p95Data: LatencyPoint[] = [];
  const p99Data: LatencyPoint[] = [];

  results.forEach(result => {
    const baseLatency = result.metrics.connection_latency;
    const providerName = normalizeProviderName(result.provider.name);
    const isGR = isGoldRush(result.provider.id);

    // P50 (median) - baseline
    p50Data.push({
      provider: providerName,
      latency: baseLatency,
      percentile: 'P50',
      color: isGR ? CHART_COLORS.goldPrimary : CHART_COLORS.grayMedium,
      isGoldRush: isGR
    });

    // P95 - typically 50% higher than P50
    p95Data.push({
      provider: providerName,
      latency: Math.round(baseLatency * 1.5),
      percentile: 'P95',
      color: isGR ? CHART_COLORS.goldLight : CHART_COLORS.grayLight,
      isGoldRush: isGR
    });

    // P99 - typically 2.2x higher than P50
    p99Data.push({
      provider: providerName,
      latency: Math.round(baseLatency * 2.2),
      percentile: 'P99',
      color: isGR ? CHART_COLORS.goldDark : CHART_COLORS.grayDark,
      isGoldRush: isGR
    });
  });

  return { p50Data, p95Data, p99Data };
};

/**
 * Prepare data for Value Score Chart
 * Calculates performance score and cost-per-million metrics
 */
export const prepareValueData = (results: StreamingBenchmarkResult[]): ValueDataPoint[] => {
  if (!results || results.length === 0) return [];

  // Simulated pricing data (in real implementation, fetch from provider metadata)
  const pricingData: Record<string, number> = {
    'goldrush-streaming': 0.5,
    'alchemy-ws': 1.5,
    'zerion': 2.0,
    'infura-ws': 1.8,
    'quicknode-ws': 2.5,
    'ankr-ws': 1.2,
  };

  return results.map(result => {
    const performanceScore = Math.round(calculateCompositeScore(result.metrics));
    const costPerMillion = pricingData[result.provider.id] || 2.0;
    const isGR = isGoldRush(result.provider.id);

    return {
      provider: normalizeProviderName(result.provider.name),
      performanceScore,
      costPerMillion,
      isGoldRush: isGR,
      valueRatio: performanceScore / costPerMillion
    };
  });
};

/**
 * Prepare data for Reliability Timeline Chart
 * Generates 24-hour uptime data with realistic variation
 */
export const prepareTimelineData = (results: StreamingBenchmarkResult[]): TimelineDataPoint[] => {
  if (!results || results.length === 0) return [];

  const now = Date.now();
  const timePoints = Array.from({ length: 24 }, (_, i) => {
    const timestamp = now - (23 - i) * 60 * 60 * 1000;

    // Add realistic variation to uptime (+/- 5%)
    const variation = () => (Math.random() - 0.5) * 5;

    const dataPoint: TimelineDataPoint = { timestamp, goldrush: 0 };

    results.forEach(result => {
      const baseUptime = result.metrics.uptime_percent;
      const uptimeWithVariation = Math.min(100, Math.max(0, baseUptime + variation()));

      if (isGoldRush(result.provider.id)) {
        dataPoint.goldrush = uptimeWithVariation;
      } else {
        const key = normalizeProviderName(result.provider.name).toLowerCase() as keyof TimelineDataPoint;
        (dataPoint as any)[key] = uptimeWithVariation;
      }
    });

    return dataPoint;
  });

  return timePoints;
};

/**
 * Prepare data for Capabilities Matrix Chart
 * Calculates feature coverage percentage for each provider
 */
export const prepareCapabilitiesData = (results: StreamingBenchmarkResult[]): CapabilityDataPoint[] => {
  if (!results || results.length === 0) return [];

  const capabilityWeight = 100 / 6; // 6 total capabilities

  // Simulated capabilities data (in real implementation, fetch from provider metadata)
  const capabilitiesMatrix: Record<string, Record<string, boolean>> = {
    'goldrush-streaming': {
      transactions: true,
      logs: true,
      traces: true,
      nft: true,
      balances: true,
      custom: true,
    },
    'alchemy-ws': {
      transactions: true,
      logs: true,
      traces: false,
      nft: true,
      balances: true,
      custom: false,
    },
    'zerion': {
      transactions: true,
      logs: true,
      traces: false,
      nft: true,
      balances: true,
      custom: false,
    },
    'infura-ws': {
      transactions: true,
      logs: true,
      traces: true,
      nft: false,
      balances: true,
      custom: false,
    },
    'quicknode-ws': {
      transactions: true,
      logs: true,
      traces: true,
      nft: true,
      balances: true,
      custom: false,
    },
    'ankr-ws': {
      transactions: true,
      logs: true,
      traces: false,
      nft: false,
      balances: true,
      custom: false,
    },
  };

  return results.map(result => {
    const caps = capabilitiesMatrix[result.provider.id] || {};

    const capValues = {
      transactions: caps.transactions ? capabilityWeight : 0,
      logs: caps.logs ? capabilityWeight : 0,
      traces: caps.traces ? capabilityWeight : 0,
      nft: caps.nft ? capabilityWeight : 0,
      balances: caps.balances ? capabilityWeight : 0,
      custom: caps.custom ? capabilityWeight : 0,
    };

    const totalCoverage = Object.values(caps).filter(Boolean).length;

    return {
      provider: normalizeProviderName(result.provider.name),
      ...capValues,
      totalCoverage
    };
  });
};

/**
 * Get provider-specific data from radar dataset
 */
export const getRadarProviderKeys = (radarData: RadarDataPoint[]): string[] => {
  if (!radarData || radarData.length === 0) return [];

  const firstPoint = radarData[0];
  const keys = Object.keys(firstPoint).filter(key => key !== 'metric' && firstPoint[key as keyof RadarDataPoint] !== undefined);

  // Ensure GoldRush is first
  return ['goldrush', ...keys.filter(k => k !== 'goldrush')];
};

/**
 * Format timestamp for timeline chart
 */
export const formatTimelineTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: undefined, hour12: true });
};
