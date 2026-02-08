import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useCallback } from 'react';

/**
 * Hook for prefetching data to warm up React Query cache
 * Call these functions on link hover or route transition
 */
export function usePrefetch() {
  const queryClient = useQueryClient();

  const prefetchLeaderboard = useCallback(
    async (params?: { chain?: string; sort?: string }) => {
      // Prefetch using React Query
      await queryClient.prefetchQuery({
        queryKey: ['leaderboard', params],
        queryFn: () => api.getLeaderboard(params),
        staleTime: 5 * 60 * 1000, // 5 minutes
      });

      // Also prefetch at HTTP level for browser cache
      await api.prefetchLeaderboard(params);
    },
    [queryClient]
  );

  const prefetchProvider = useCallback(
    async (slug: string) => {
      await queryClient.prefetchQuery({
        queryKey: ['provider', slug],
        queryFn: () => api.getProvider(slug),
        staleTime: 2 * 60 * 1000, // 2 minutes
      });
    },
    [queryClient]
  );

  const prefetchMetrics = useCallback(
    async (
      provider: string,
      params?: { metric?: string; timeframe?: string }
    ) => {
      await queryClient.prefetchQuery({
        queryKey: ['metrics', provider, params],
        queryFn: () => api.getMetrics(provider, params),
        staleTime: 5 * 60 * 1000,
      });
    },
    [queryClient]
  );

  const prefetchCompare = useCallback(
    async (providerA: string, providerB: string) => {
      await queryClient.prefetchQuery({
        queryKey: ['compare', providerA, providerB],
        queryFn: () => api.compare(providerA, providerB),
        staleTime: 5 * 60 * 1000,
      });
    },
    [queryClient]
  );

  // Prefetch all dashboard data at once
  const prefetchDashboard = useCallback(async () => {
    await Promise.all([
      prefetchLeaderboard(),
      // Add other critical dashboard queries here
    ]);
  }, [prefetchLeaderboard]);

  return {
    prefetchLeaderboard,
    prefetchProvider,
    prefetchMetrics,
    prefetchCompare,
    prefetchDashboard,
  };
}
