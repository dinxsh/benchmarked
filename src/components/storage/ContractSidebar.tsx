/**
 * Contract Sidebar Component
 * Displays contract metadata and actions
 */

'use client';

import { ContractStorage, ContractMetadata } from '@/lib/storage-types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, XCircle, Download, ExternalLink } from 'lucide-react';
import { exportStorageAsJSON, exportStorageAsCSV } from '@/hooks/use-storage';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ContractSidebarProps {
  storage: ContractStorage | null;
  metadata?: ContractMetadata;
}

/**
 * Truncate address for display
 */
function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Get Etherscan URL for address
 */
function getEtherscanUrl(address: string, chainId: number): string {
  const baseUrls: Record<number, string> = {
    1: 'https://etherscan.io',
    5: 'https://goerli.etherscan.io',
    11155111: 'https://sepolia.etherscan.io'
  };

  const baseUrl = baseUrls[chainId] || 'https://etherscan.io';
  return `${baseUrl}/address/${address}`;
}

/**
 * Contract Info Card
 */
function ContractInfoCard({ storage, metadata }: ContractSidebarProps) {
  if (!storage) {
    return (
      <Card className="p-4">
        <div className="text-sm font-mono text-muted-foreground text-center py-8">
          Load a contract to view its info
        </div>
      </Card>
    );
  }

  const etherscanUrl = getEtherscanUrl(storage.address, storage.chainId);

  return (
    <Card className="p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold font-mono mb-3">Contract Info</h3>

        {/* Contract Name */}
        {metadata?.name && (
          <div className="mb-3">
            <div className="text-xl font-bold font-mono">
              {metadata.name}
            </div>
            {metadata.symbol && (
              <div className="text-sm text-muted-foreground font-mono">
                {metadata.symbol}
              </div>
            )}
          </div>
        )}

        {/* Address */}
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground font-mono">Address</div>
          <div className="flex items-center gap-2">
            <code className="text-xs font-mono break-all">{storage.address}</code>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => window.open(etherscanUrl, '_blank')}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <Separator className="my-3" />

        {/* Verification Status */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-muted-foreground">Verified</span>
          <Badge
            variant={metadata?.isVerified ? 'default' : 'secondary'}
            className="font-mono text-xs"
          >
            {metadata?.isVerified ? (
              <>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Yes
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 mr-1" />
                No
              </>
            )}
          </Badge>
        </div>

        <Separator className="my-3" />

        {/* Chain */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-muted-foreground">Chain</span>
          <Badge variant="outline" className="font-mono text-xs">
            {storage.chainId === 1 ? 'Ethereum' : `Chain ${storage.chainId}`}
          </Badge>
        </div>

        <Separator className="my-3" />

        {/* Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-muted-foreground">Total Slots</span>
            <span className="text-xs font-mono font-bold">{storage.totalSlotsFetched}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-muted-foreground">Slot Range</span>
            <span className="text-xs font-mono">
              {storage.slotRange.start}-{storage.slotRange.end}
            </span>
          </div>
          {storage.blockNumber && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-muted-foreground">Block</span>
              <span className="text-xs font-mono">{storage.blockNumber.toLocaleString()}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-muted-foreground">Fetched</span>
            <span className="text-xs font-mono">
              {new Date(storage.fetchedAt).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * Actions Card
 */
function ActionsCard({ storage }: ContractSidebarProps) {
  if (!storage) return null;

  return (
    <Card className="p-4 space-y-3">
      <h3 className="text-sm font-semibold font-mono mb-2">Actions</h3>

      {/* Export Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full font-mono text-sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem
            onClick={() => exportStorageAsJSON(storage)}
            className="font-mono text-xs"
          >
            Export as JSON
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => exportStorageAsCSV(storage)}
            className="font-mono text-xs"
          >
            Export as CSV
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Compare Button (Disabled for MVP) */}
      <Button
        variant="outline"
        className="w-full font-mono text-sm"
        disabled
      >
        Compare
        <Badge variant="secondary" className="ml-2 text-[10px]">
          Soon
        </Badge>
      </Button>
    </Card>
  );
}

/**
 * Tips Card
 */
function TipsCard() {
  return (
    <Card className="p-4 bg-amber-500/5 border-amber-500/20">
      <h3 className="text-sm font-semibold font-mono mb-2 text-amber-700">
        Tips
      </h3>
      <ul className="space-y-2 text-xs font-mono text-muted-foreground">
        <li className="flex gap-2">
          <span className="text-amber-500">•</span>
          <span>Hover cells to see decoded values</span>
        </li>
        <li className="flex gap-2">
          <span className="text-amber-500">•</span>
          <span>Click cells for full details</span>
        </li>
        <li className="flex gap-2">
          <span className="text-amber-500">•</span>
          <span>Colors indicate data types</span>
        </li>
        <li className="flex gap-2">
          <span className="text-amber-500">•</span>
          <span>Export data as JSON/CSV</span>
        </li>
      </ul>
    </Card>
  );
}

export function ContractSidebar({ storage, metadata }: ContractSidebarProps) {
  return (
    <div className="space-y-4">
      <ContractInfoCard storage={storage} metadata={metadata} />
      <ActionsCard storage={storage} metadata={metadata} />
      <TipsCard />
    </div>
  );
}
