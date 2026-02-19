import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useLeaderboard(params?: { chain?: string; sort?: string }) {
  return useQuery({
    queryKey: ['leaderboard', params],
    queryFn: () => api.getLeaderboard(params),
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}

export function useProvider(slug: string) {
  return useQuery({
    queryKey: ['provider', slug],
    queryFn: () => api.getProvider(slug),
    enabled: !!slug,
    staleTime: 2 * 60 * 1000 // 2 minutes
  });
}

export function useMetrics(
  provider: string,
  params?: {
    metric?: string;
    timeframe?: string;
  }
) {
  return useQuery({
    queryKey: ['metrics', provider, params],
    queryFn: () => api.getMetrics(provider, params),
    enabled: !!provider,
    staleTime: 5 * 60 * 1000
  });
}

export function useCompare(providerA: string, providerB: string) {
  return useQuery({
    queryKey: ['compare', providerA, providerB],
    queryFn: () => api.compare(providerA, providerB),
    enabled: !!providerA && !!providerB,
    staleTime: 5 * 60 * 1000
  });
}

export function useSolanaBenchmarks(params?: { run?: boolean }) {
  return useQuery({
    queryKey: ['solana-benchmarks', params],
    queryFn: () =>
      fetch(`/api/benchmarks/solana${params?.run ? '?run=true' : ''}`)
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        }),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}
