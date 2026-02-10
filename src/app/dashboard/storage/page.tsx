/**
 * EVM Storage Visualizer - Main Page
 * Interactive storage slot explorer for Ethereum contracts
 */

'use client';

import { useState } from 'react';
import { ContractInput } from '@/components/storage/ContractInput';
import { StorageGrid } from '@/components/storage/StorageGrid';
import { ContractSidebar } from '@/components/storage/ContractSidebar';
import { useContractStorage, useContractMetadata } from '@/hooks/use-storage';
import { PageContainer } from '@/components/ui/page-container';
import { Heading } from '@/components/ui/heading';

export default function StoragePage() {
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number>(1);

  // Fetch storage data
  const {
    data: storageData,
    isLoading: storageLoading,
    isError: storageError,
    error: storageErrorObj
  } = useContractStorage(contractAddress, chainId, 0, 255, 'latest', !!contractAddress);

  // Fetch metadata separately
  const {
    data: metadataData,
    isLoading: metadataLoading
  } = useContractMetadata(contractAddress, chainId, !!contractAddress);

  // Handle contract load
  const handleLoadContract = (address: string, chain: number) => {
    setContractAddress(address);
    setChainId(chain);
  };

  const isLoading = storageLoading || metadataLoading;

  return (
    <PageContainer scrollable>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <Heading
            title="EVM Storage Explorer"
            description="Visualize and explore Ethereum contract storage slots"
          />
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Input & Contract Info (4 columns) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Contract Input */}
            <ContractInput
              onLoadContract={handleLoadContract}
              isLoading={isLoading}
            />

            {/* Contract Sidebar (only show when contract is loaded) */}
            {contractAddress && (
              <ContractSidebar
                storage={storageData || null}
                metadata={metadataData}
              />
            )}
          </div>

          {/* Right Main Area - Storage Grid (8 columns) */}
          <div className="lg:col-span-8">
            {storageError ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="text-6xl mb-4 opacity-20">⚠</div>
                <h3 className="text-lg font-mono font-semibold mb-2 text-red-500">
                  Error Loading Storage
                </h3>
                <p className="text-sm text-muted-foreground font-mono max-w-md">
                  {storageErrorObj?.message || 'Failed to load contract storage'}
                </p>
              </div>
            ) : (
              <StorageGrid
                slots={storageData?.slots || []}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>

        {/* Footer Info */}
        {storageData && (
          <div className="mt-8 pt-6 border-t">
            <div className="text-xs font-mono text-muted-foreground space-y-1">
              <p>
                <strong className="text-foreground">Storage Visualization:</strong>{' '}
                Showing {storageData.totalSlotsFetched} slots ({storageData.slotRange.start}-{storageData.slotRange.end})
                {' '}from {storageData.chainId === 1 ? 'Ethereum Mainnet' : `Chain ${storageData.chainId}`}
              </p>
              <p>
                <strong className="text-foreground">Data Freshness:</strong>{' '}
                Fetched at {new Date(storageData.fetchedAt).toLocaleString()}
                {storageData.blockNumber && ` (Block #${storageData.blockNumber.toLocaleString()})`}
              </p>
              <p>
                <strong className="text-foreground">Note:</strong>{' '}
                Storage values are automatically decoded using heuristics.
                Click any cell for multiple interpretations.
              </p>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
