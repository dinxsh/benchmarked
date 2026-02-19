/**
 * React Query hooks for EVM Storage Visualizer
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { ContractStorage, ContractMetadata, StorageAPIResponse, MetadataAPIResponse } from '@/lib/storage-types';
import { toast } from 'sonner';

/**
 * Fetch contract storage from API
 */
async function fetchContractStorage(
  address: string,
  chainId: number = 1,
  start: number = 0,
  end: number = 255,
  blockTag: string = 'latest'
): Promise<ContractStorage> {
  const params = new URLSearchParams({
    chainId: chainId.toString(),
    start: start.toString(),
    end: end.toString(),
    blockTag
  });

  const response = await fetch(`/api/storage/${address}?${params}`);

  if (!response.ok) {
    const error: StorageAPIResponse = await response.json();
    throw new Error(error.error || 'Failed to fetch contract storage');
  }

  const data: StorageAPIResponse = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error || 'Invalid response from API');
  }

  return data.data;
}

/**
 * Fetch contract metadata from API
 */
async function fetchContractMetadata(
  address: string,
  chainId: number = 1
): Promise<ContractMetadata> {
  const params = new URLSearchParams({
    chainId: chainId.toString()
  });

  const response = await fetch(`/api/storage/${address}/metadata?${params}`);

  if (!response.ok) {
    const error: MetadataAPIResponse = await response.json();
    throw new Error(error.error || 'Failed to fetch contract metadata');
  }

  const data: MetadataAPIResponse = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error || 'Invalid response from API');
  }

  return data.data;
}

/**
 * Hook to fetch contract storage
 *
 * @param address - Contract address
 * @param chainId - Chain ID (default: 1 for Ethereum mainnet)
 * @param start - Start slot number (default: 0)
 * @param end - End slot number (default: 255)
 * @param blockTag - Block number or 'latest' (default: 'latest')
 * @param enabled - Whether to enable the query (default: true if address is valid)
 */
export function useContractStorage(
  address: string | null | undefined,
  chainId: number = 1,
  start: number = 0,
  end: number = 255,
  blockTag: string = 'latest',
  enabled: boolean = true
): UseQueryResult<ContractStorage, Error> {
  const addressValid = address && /^0x[a-fA-F0-9]{40}$/.test(address);

  return useQuery({
    queryKey: ['storage', address, chainId, start, end, blockTag],
    queryFn: () => fetchContractStorage(address!, chainId, start, end, blockTag),
    enabled: enabled && !!addressValid,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  });
}

/**
 * Hook to fetch contract metadata only
 *
 * @param address - Contract address
 * @param chainId - Chain ID (default: 1 for Ethereum mainnet)
 * @param enabled - Whether to enable the query (default: true if address is valid)
 */
export function useContractMetadata(
  address: string | null | undefined,
  chainId: number = 1,
  enabled: boolean = true
): UseQueryResult<ContractMetadata, Error> {
  const addressValid = address && /^0x[a-fA-F0-9]{40}$/.test(address);

  return useQuery({
    queryKey: ['storage-metadata', address, chainId],
    queryFn: () => fetchContractMetadata(address!, chainId),
    enabled: enabled && !!addressValid,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 60 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  });
}

/**
 * Hook to fetch storage for multiple ranges (pagination)
 *
 * @param address - Contract address
 * @param chainId - Chain ID (default: 1)
 * @param ranges - Array of [start, end] slot ranges
 * @param enabled - Whether to enable the queries
 */
export function useContractStorageRanges(
  address: string | null | undefined,
  chainId: number = 1,
  ranges: Array<[number, number]> = [[0, 255]],
  enabled: boolean = true
) {
  const queries = ranges.map(([start, end]) =>
    useContractStorage(address, chainId, start, end, 'latest', enabled)
  );

  return {
    queries,
    isLoading: queries.some(q => q.isLoading),
    isError: queries.some(q => q.isError),
    data: queries.map(q => q.data).filter(Boolean) as ContractStorage[],
    errors: queries.map(q => q.error).filter(Boolean) as Error[]
  };
}

/**
 * Export contract storage as JSON
 */
export function exportStorageAsJSON(storage: ContractStorage, filename?: string): void {
  const json = JSON.stringify(storage, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `storage-${storage.address}-${storage.chainId}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);

  toast.success('Storage exported', {
    description: `Downloaded ${filename || link.download}`
  });
}

/**
 * Export contract storage as CSV
 */
export function exportStorageAsCSV(storage: ContractStorage, filename?: string): void {
  // CSV header
  let csv = 'Slot,Slot (Hex),Raw Value,Data Type,Decoded Value,Is Empty\n';

  // CSV rows
  storage.slots.forEach(slot => {
    const row = [
      slot.slot,
      slot.slotHex,
      slot.rawValue,
      slot.dataType,
      `"${slot.decodedValue.replace(/"/g, '""')}"`, // Escape quotes
      slot.isEmpty
    ].join(',');
    csv += row + '\n';
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `storage-${storage.address}-${storage.chainId}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);

  toast.success('Storage exported', {
    description: `Downloaded ${filename || link.download}`
  });
}
