/**
 * Real-time pairs hook with optimized polling and local state management
 * Simulates WebSocket-like behavior with aggressive polling and optimistic updates
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useCallback, useRef } from 'react';
import { LivePairUpdate } from '@/lib/dex-types';

interface RealtimePairsOptions {
  enabled?: boolean;
  pollingInterval?: number; // Default 1000ms for near real-time
  onPriceUpdate?: (update: LivePairUpdate) => void;
}

export function useRealtimePairs(options: RealtimePairsOptions = {}) {
  const {
    enabled = true,
    pollingInterval = 1000, // 1 second for real-time feel
    onPriceUpdate
  } = options;

  const [pairs, setPairs] = useState<LivePairUpdate[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  const queryClient = useQueryClient();
  const previousPricesRef = useRef<Map<string, number>>(new Map());

  // Store callback in ref to avoid re-running effect when it changes
  const onPriceUpdateRef = useRef(onPriceUpdate);
  useEffect(() => {
    onPriceUpdateRef.current = onPriceUpdate;
  }, [onPriceUpdate]);

  // Main query with aggressive polling
  const { data, isLoading, error, isError } = useQuery({
    queryKey: ['topPairs', 'realtime'],
    queryFn: async () => {
      const res = await fetch('/api/dex/pairs/top?limit=20');
      if (!res.ok) throw new Error('Failed to fetch pairs');
      const json = await res.json();
      return json;
    },
    refetchInterval: pollingInterval,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    enabled
  });

  // Update local state and detect price changes
  useEffect(() => {
    if (data?.pairs) {
      const now = Date.now();
      setLastUpdateTime(now);
      setIsConnected(true);

      // Detect price changes and trigger callbacks
      data.pairs.forEach((pair: LivePairUpdate) => {
        const previousPrice = previousPricesRef.current.get(pair.pair.pairAddress);
        const currentPrice = pair.priceUSD;

        if (previousPrice !== undefined && previousPrice !== currentPrice) {
          onPriceUpdateRef.current?.(pair);
        }

        previousPricesRef.current.set(pair.pair.pairAddress, currentPrice);
      });

      setPairs(data.pairs);
    }
  }, [data]); // Removed onPriceUpdate from dependencies

  // Monitor connection status
  useEffect(() => {
    if (isError) {
      setIsConnected(false);
    }
  }, [isError]);

  // Calculate latency (time since last update)
  const getLatency = useCallback(() => {
    if (!lastUpdateTime) return 0;
    return Date.now() - lastUpdateTime;
  }, [lastUpdateTime]);

  // Subscribe to specific pairs (for future WebSocket implementation)
  const subscribeToPairs = useCallback((pairAddresses: string[]) => {
    // Placeholder for WebSocket implementation
    console.log('[RealtimePairs] Subscribe to pairs:', pairAddresses);
  }, []);

  // Subscribe to all top pairs
  const subscribeToAllTop = useCallback(() => {
    // Placeholder for WebSocket implementation
    console.log('[RealtimePairs] Subscribe to all top pairs');
  }, []);

  // Force refresh
  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['topPairs', 'realtime'] });
  }, [queryClient]);

  return {
    pairs,
    isLoading,
    isConnected,
    error: error as Error | null,
    lastUpdateTime,
    latency: getLatency(),
    subscribeToPairs,
    subscribeToAllTop,
    refresh
  };
}
