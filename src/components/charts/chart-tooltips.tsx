import { CHART_COLORS } from './chart-utils';

// ==========================================
// CUSTOM TOOLTIP COMPONENTS
// ==========================================

/**
 * Custom Tooltip for Radar Chart
 */
export const CustomRadarTooltip = ({ active, payload }: any) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-black/95 border border-[#E6A23C]/30 rounded-lg p-4 shadow-2xl backdrop-blur-sm">
      <p className="text-sm font-semibold text-white mb-2">
        {payload[0]?.payload?.metric}
      </p>
      {payload.map((entry: any, index: number) => {
        const isGoldRush = entry.dataKey === 'goldrush';
        return (
          <div key={index} className="flex items-center justify-between gap-4 py-1">
            <span
              className="text-xs font-medium capitalize"
              style={{ color: isGoldRush ? '#E6A23C' : '#9ca3af' }}
            >
              {entry.dataKey === 'goldrush' ? 'GoldRush' : entry.dataKey}
            </span>
            <span
              className="text-sm font-bold font-mono"
              style={{ color: isGoldRush ? '#FFD700' : '#d1d5db' }}
            >
              {entry.value.toFixed(1)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Custom Tooltip for Latency Scatter Chart
 */
export const LatencyScatterTooltip = ({ active, payload }: any) => {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  const isGoldRush = data.isGoldRush;

  return (
    <div className="bg-black/95 border border-[#E6A23C]/30 rounded-lg p-4 shadow-2xl backdrop-blur-sm min-w-[180px]">
      <p
        className="text-sm font-semibold mb-2"
        style={{ color: isGoldRush ? CHART_COLORS.goldPrimary : '#9ca3af' }}
      >
        {data.provider}
      </p>
      <div className="flex items-center justify-between gap-3 py-1 border-t border-white/10 pt-2">
        <span className="text-xs text-[#9ca3af]">
          {data.percentile}
        </span>
        <span
          className="text-base font-bold font-mono"
          style={{ color: isGoldRush ? CHART_COLORS.goldLight : '#d1d5db' }}
        >
          {data.latency.toFixed(0)}<span className="text-xs text-[#888] ml-0.5">ms</span>
        </span>
      </div>
      {isGoldRush && (
        <div className="mt-2 pt-2 border-t border-[#E6A23C]/20">
          <p className="text-[10px] text-[#E6A23C] font-semibold">
            ⚡ Fastest & Most Consistent
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Custom Tooltip for Value Score Chart
 */
export const ValueScoreTooltip = ({ active, payload }: any) => {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  const isGoldRush = data.isGoldRush;

  return (
    <div className="bg-black/95 border border-[#E6A23C]/30 rounded-lg p-4 shadow-2xl backdrop-blur-sm min-w-[200px]">
      <p
        className="text-sm font-semibold mb-3"
        style={{ color: isGoldRush ? CHART_COLORS.goldPrimary : '#9ca3af' }}
      >
        {data.provider}
      </p>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-[#9ca3af]">
            Performance Score
          </span>
          <span
            className="text-sm font-bold font-mono"
            style={{ color: isGoldRush ? CHART_COLORS.goldLight : '#d1d5db' }}
          >
            {data.performanceScore}
            <span className="text-xs text-[#888] ml-0.5">/100</span>
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-[#9ca3af]">
            Cost per Million
          </span>
          <span className="text-sm font-bold font-mono text-[#d1d5db]">
            ${data.costPerMillion.toFixed(2)}
          </span>
        </div>

        <div className="pt-2 mt-2 border-t border-white/10">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-semibold text-white">
              Value Ratio
            </span>
            <span
              className="text-base font-bold font-mono"
              style={{ color: isGoldRush ? CHART_COLORS.goldPrimary : '#9ca3af' }}
            >
              {data.valueRatio.toFixed(1)}
              <span className="text-[10px] text-[#888] ml-1">pts/$</span>
            </span>
          </div>
        </div>
      </div>

      {isGoldRush && (
        <div className="mt-3 pt-3 border-t border-[#E6A23C]/20">
          <p className="text-[10px] text-[#E6A23C] font-semibold">
            💰 Best Value for Money
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Custom Tooltip for Reliability Timeline Chart
 */
export const ReliabilityTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null;

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="bg-black/95 border border-[#E6A23C]/30 rounded-lg p-4 shadow-2xl backdrop-blur-sm min-w-[180px]">
      <p className="text-xs text-[#9ca3af] mb-2 font-mono">
        {formatTime(label)}
      </p>

      <div className="space-y-1">
        {payload.map((entry: any, index: number) => {
          const isGoldRush = entry.dataKey === 'goldrush';
          return (
            <div key={index} className="flex items-center justify-between gap-4 py-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span
                  className="text-xs font-medium capitalize"
                  style={{ color: isGoldRush ? '#E6A23C' : '#9ca3af' }}
                >
                  {entry.dataKey === 'goldrush' ? 'GoldRush' : entry.dataKey}
                </span>
              </div>
              <span
                className="text-sm font-bold font-mono"
                style={{ color: isGoldRush ? CHART_COLORS.goldLight : '#d1d5db' }}
              >
                {entry.value.toFixed(1)}<span className="text-xs text-[#888]">%</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Custom Tooltip for Capabilities Matrix Chart
 */
export const CapabilitiesTooltip = ({ active, payload }: any) => {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  const capabilities = [
    { key: 'transactions', label: 'Transactions', value: data.transactions },
    { key: 'logs', label: 'Event Logs', value: data.logs },
    { key: 'traces', label: 'Traces', value: data.traces },
    { key: 'nft', label: 'NFT Metadata', value: data.nft },
    { key: 'balances', label: 'Token Balances', value: data.balances },
    { key: 'custom', label: 'Custom Indexing', value: data.custom },
  ];

  const totalPercentage = capabilities.reduce((sum, cap) => sum + cap.value, 0);
  const supportedCount = capabilities.filter(cap => cap.value > 0).length;
  const isGoldRush = data.provider === 'GoldRush';

  return (
    <div className="bg-black/95 border border-[#E6A23C]/30 rounded-lg p-4 shadow-2xl backdrop-blur-sm min-w-[220px]">
      <div className="flex items-center justify-between mb-3">
        <p
          className="text-sm font-semibold"
          style={{ color: isGoldRush ? CHART_COLORS.goldPrimary : '#9ca3af' }}
        >
          {data.provider}
        </p>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded"
          style={{
            backgroundColor: isGoldRush ? 'rgba(230, 162, 60, 0.2)' : 'rgba(156, 163, 175, 0.2)',
            color: isGoldRush ? CHART_COLORS.goldLight : '#9ca3af'
          }}
        >
          {supportedCount}/6
        </span>
      </div>

      <div className="space-y-1.5">
        {capabilities.map((cap, index) => (
          <div
            key={index}
            className="flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-1.5 h-1.5 rounded-full ${cap.value > 0 ? 'bg-[#E6A23C]' : 'bg-[#4b5563]'}`}
              />
              <span className={cap.value > 0 ? 'text-white' : 'text-[#6b7280]'}>
                {cap.label}
              </span>
            </div>
            <span className={`font-mono ${cap.value > 0 ? 'text-[#E6A23C]' : 'text-[#4b5563]'}`}>
              {cap.value > 0 ? '✓' : '✗'}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#9ca3af]">
            Coverage
          </span>
          <span
            className="text-sm font-bold font-mono"
            style={{ color: isGoldRush ? CHART_COLORS.goldPrimary : '#9ca3af' }}
          >
            {totalPercentage.toFixed(0)}<span className="text-xs text-[#888]">%</span>
          </span>
        </div>
      </div>

      {isGoldRush && (
        <div className="mt-3 pt-3 border-t border-[#E6A23C]/20">
          <p className="text-[10px] text-[#E6A23C] font-semibold">
            ✨ Full Feature Support
          </p>
        </div>
      )}
    </div>
  );
};
