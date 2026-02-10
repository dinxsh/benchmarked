/**
 * Storage Cell Component
 * Individual storage slot cell with hover effects and click handling
 */

'use client';

import { StorageSlot, StorageDataType } from '@/lib/storage-types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface StorageCellProps {
  slot: StorageSlot;
  onClick: (slot: StorageSlot) => void;
}

/**
 * Get color classes based on data type
 */
function getTypeColorClasses(dataType: StorageDataType): string {
  switch (dataType) {
    case StorageDataType.ADDRESS:
      return 'bg-amber-500/20 border-amber-500 hover:bg-amber-500/30';
    case StorageDataType.UINT256:
      return 'bg-green-500/20 border-green-500 hover:bg-green-500/30';
    case StorageDataType.INT256:
      return 'bg-blue-500/20 border-blue-500 hover:bg-blue-500/30';
    case StorageDataType.BOOL:
      return 'bg-purple-500/20 border-purple-500 hover:bg-purple-500/30';
    case StorageDataType.STRING:
      return 'bg-pink-500/20 border-pink-500 hover:bg-pink-500/30';
    case StorageDataType.BYTES32:
    case StorageDataType.BYTES:
      return 'bg-cyan-500/20 border-cyan-500 hover:bg-cyan-500/30';
    case StorageDataType.EMPTY:
      return 'bg-muted/30 border-muted-foreground/20 hover:bg-muted/50';
    case StorageDataType.UNKNOWN:
    default:
      return 'bg-gray-500/20 border-gray-500 hover:bg-gray-500/30';
  }
}

/**
 * Get badge text for data type
 */
function getTypeBadge(dataType: StorageDataType): string {
  switch (dataType) {
    case StorageDataType.ADDRESS:
      return 'ADDR';
    case StorageDataType.UINT256:
      return 'UINT';
    case StorageDataType.INT256:
      return 'INT';
    case StorageDataType.BOOL:
      return 'BOOL';
    case StorageDataType.STRING:
      return 'STR';
    case StorageDataType.BYTES32:
      return 'B32';
    case StorageDataType.BYTES:
      return 'BYT';
    case StorageDataType.EMPTY:
      return 'EMPT';
    case StorageDataType.UNKNOWN:
    default:
      return 'UNK';
  }
}

/**
 * Truncate hex value for display
 */
function truncateHex(hex: string, length: number = 8): string {
  if (hex.length <= length + 2) return hex; // +2 for '0x'
  return hex.slice(0, length + 2) + '...';
}

export function StorageCell({ slot, onClick }: StorageCellProps) {
  const colorClasses = getTypeColorClasses(slot.dataType);
  const typeBadge = getTypeBadge(slot.dataType);

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onClick(slot)}
            className={`
              storage-cell
              relative
              flex flex-col items-start justify-between
              p-2
              border-2
              rounded-md
              transition-all duration-200
              hover:scale-105
              hover:shadow-lg
              active:scale-95
              cursor-pointer
              min-h-[80px]
              ${colorClasses}
            `}
            data-type={slot.dataType}
          >
            {/* Slot Number */}
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-[10px] font-mono font-bold text-foreground/80">
                {slot.slot}
              </span>
              <span className="text-[8px] font-mono font-bold px-1 py-0.5 rounded bg-foreground/10">
                {typeBadge}
              </span>
            </div>

            {/* Hex Value Preview */}
            <div className="w-full">
              <p className="text-[9px] font-mono text-foreground/70 break-all leading-tight">
                {truncateHex(slot.rawValue, 12)}
              </p>
            </div>

            {/* Decoded Value Preview (if not empty) */}
            {!slot.isEmpty && slot.decodedValue && slot.decodedValue !== '(empty)' && (
              <div className="w-full mt-1 pt-1 border-t border-foreground/10">
                <p className="text-[8px] font-mono text-foreground/60 truncate">
                  {slot.decodedValue.length > 15
                    ? slot.decodedValue.slice(0, 15) + '...'
                    : slot.decodedValue
                  }
                </p>
              </div>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-md font-mono text-xs"
        >
          <div className="space-y-2">
            <div>
              <span className="text-muted-foreground">Slot:</span>{' '}
              <span className="font-bold">{slot.slot}</span>{' '}
              <span className="text-muted-foreground">({slot.slotHex})</span>
            </div>
            <div>
              <span className="text-muted-foreground">Type:</span>{' '}
              <span className="font-bold">{slot.dataType}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Raw:</span>{' '}
              <span className="break-all">{truncateHex(slot.rawValue, 20)}</span>
            </div>
            {!slot.isEmpty && slot.decodedValue && (
              <div>
                <span className="text-muted-foreground">Decoded:</span>{' '}
                <span className="font-bold">
                  {slot.decodedValue.length > 50
                    ? slot.decodedValue.slice(0, 50) + '...'
                    : slot.decodedValue
                  }
                </span>
              </div>
            )}
            <div className="text-[10px] text-muted-foreground pt-1 border-t">
              Click for full details
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
