/**
 * Storage Grid Component
 * 16x16 hex grid visualization of storage slots
 */

'use client';

import { useState } from 'react';
import { StorageSlot } from '@/lib/storage-types';
import { StorageCell } from './StorageCell';
import { SlotDetailModal } from './SlotDetailModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface StorageGridProps {
  slots: StorageSlot[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

/**
 * Loading skeleton for grid
 */
function GridSkeleton() {
  return (
    <div className="storage-grid grid grid-cols-8 md:grid-cols-12 lg:grid-cols-16 gap-2">
      {Array.from({ length: 256 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}

/**
 * Empty state when no slots
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-6xl mb-4 opacity-20 font-mono">[ ]</div>
      <h3 className="text-lg font-mono font-semibold mb-2">No Storage Data</h3>
      <p className="text-sm text-muted-foreground font-mono">
        Enter a contract address to view its storage slots
      </p>
    </div>
  );
}

/**
 * Get statistics from slots
 */
function getSlotStats(slots: StorageSlot[]) {
  const totalSlots = slots.length;
  const emptySlots = slots.filter(s => s.isEmpty).length;
  const nonEmptySlots = totalSlots - emptySlots;

  // Count by type
  const typeCount = slots.reduce((acc, slot) => {
    acc[slot.dataType] = (acc[slot.dataType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalSlots,
    emptySlots,
    nonEmptySlots,
    typeCount
  };
}

export function StorageGrid({
  slots,
  isLoading = false,
  onLoadMore,
  hasMore = false
}: StorageGridProps) {
  const [selectedSlot, setSelectedSlot] = useState<StorageSlot | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Handle cell click
  const handleCellClick = (slot: StorageSlot) => {
    setSelectedSlot(slot);
    setModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setModalOpen(false);
    // Delay clearing selected slot to allow modal exit animation
    setTimeout(() => setSelectedSlot(null), 200);
  };

  // Loading state
  if (isLoading) {
    return <GridSkeleton />;
  }

  // Empty state
  if (slots.length === 0) {
    return <EmptyState />;
  }

  // Get statistics
  const stats = getSlotStats(slots);

  return (
    <div className="space-y-6">
      {/* Statistics Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="outline" className="font-mono">
            Total: {stats.totalSlots}
          </Badge>
          <Badge variant="default" className="font-mono bg-green-500/20 text-green-700 border-green-500">
            Active: {stats.nonEmptySlots}
          </Badge>
          <Badge variant="secondary" className="font-mono">
            Empty: {stats.emptySlots}
          </Badge>
        </div>

        <div className="text-xs font-mono text-muted-foreground">
          Slots {slots[0]?.slot ?? 0} - {slots[slots.length - 1]?.slot ?? 0}
        </div>
      </div>

      {/* Grid */}
      <div
        className="storage-grid grid gap-2"
        style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))'
        }}
      >
        {slots.map((slot) => (
          <StorageCell
            key={slot.slot}
            slot={slot}
            onClick={handleCellClick}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && onLoadMore && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={onLoadMore}
            variant="outline"
            className="font-mono"
          >
            Load More Slots
          </Button>
        </div>
      )}

      {/* Type Legend */}
      <div className="flex flex-wrap gap-2 pt-4 border-t">
        <span className="text-xs font-mono text-muted-foreground mr-2">Legend:</span>
        <Badge className="bg-amber-500/20 text-amber-700 border-amber-500 font-mono text-xs">
          Address
        </Badge>
        <Badge className="bg-green-500/20 text-green-700 border-green-500 font-mono text-xs">
          Uint256
        </Badge>
        <Badge className="bg-blue-500/20 text-blue-700 border-blue-500 font-mono text-xs">
          Int256
        </Badge>
        <Badge className="bg-purple-500/20 text-purple-700 border-purple-500 font-mono text-xs">
          Bool
        </Badge>
        <Badge className="bg-pink-500/20 text-pink-700 border-pink-500 font-mono text-xs">
          String
        </Badge>
        <Badge className="bg-cyan-500/20 text-cyan-700 border-cyan-500 font-mono text-xs">
          Bytes32
        </Badge>
        <Badge variant="secondary" className="font-mono text-xs">
          Empty
        </Badge>
      </div>

      {/* Detail Modal */}
      <SlotDetailModal
        slot={selectedSlot}
        open={modalOpen}
        onClose={handleModalClose}
      />
    </div>
  );
}
