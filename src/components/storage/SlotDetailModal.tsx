/**
 * Slot Detail Modal Component
 * Detailed view of a storage slot with all interpretations
 */

'use client';

import { StorageSlot } from '@/lib/storage-types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface SlotDetailModalProps {
  slot: StorageSlot | null;
  open: boolean;
  onClose: () => void;
}

/**
 * Copy text to clipboard
 */
function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => {
    toast.success(`${label} copied to clipboard`);
  }).catch(() => {
    toast.error('Failed to copy to clipboard');
  });
}

/**
 * Copy Button Component
 */
function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copyToClipboard(value, label);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={handleCopy}
      className="h-7 px-2"
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </Button>
  );
}

/**
 * Interpretation Row Component
 */
function InterpretationRow({
  label,
  value,
  available = true
}: {
  label: string;
  value: string | boolean | undefined;
  available?: boolean;
}) {
  if (!available || value === undefined) {
    return (
      <div className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded">
        <span className="text-sm font-mono text-muted-foreground">{label}</span>
        <span className="text-xs font-mono text-muted-foreground italic">N/A</span>
      </div>
    );
  }

  const displayValue = typeof value === 'boolean' ? String(value) : value;

  return (
    <div className="flex items-center justify-between py-2 px-3 bg-muted/10 rounded hover:bg-muted/20 transition-colors">
      <div className="flex-1 min-w-0 mr-2">
        <div className="text-xs font-mono text-muted-foreground mb-1">{label}</div>
        <div className="text-sm font-mono break-all">{displayValue}</div>
      </div>
      <CopyButton value={displayValue} label={label} />
    </div>
  );
}

export function SlotDetailModal({ slot, open, onClose }: SlotDetailModalProps) {
  if (!slot) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto font-mono">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 font-mono">
            <span>Storage Slot {slot.slot}</span>
            <Badge variant="outline" className="font-mono text-xs">
              {slot.slotHex}
            </Badge>
            <Badge
              variant={slot.isEmpty ? 'secondary' : 'default'}
              className="font-mono text-xs"
            >
              {slot.dataType}
            </Badge>
          </DialogTitle>
          <DialogDescription className="font-mono text-xs">
            {slot.isEmpty
              ? 'This slot is empty (all zeros)'
              : 'Multiple interpretations of the raw storage value'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Raw Value */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold font-mono">Raw Value (32 bytes)</h3>
            <div className="flex items-center gap-2 p-3 bg-muted/20 rounded border">
              <code className="text-xs break-all flex-1">{slot.rawValue}</code>
              <CopyButton value={slot.rawValue} label="Raw value" />
            </div>
          </div>

          {/* Primary Decoded Value */}
          {!slot.isEmpty && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold font-mono">
                Decoded as {slot.dataType}
              </h3>
              <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded border border-amber-500/30">
                <code className="text-sm break-all flex-1 font-bold">
                  {slot.decodedValue}
                </code>
                <CopyButton value={slot.decodedValue} label="Decoded value" />
              </div>
            </div>
          )}

          {/* All Interpretations */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold font-mono">All Interpretations</h3>
            <div className="space-y-2">
              <InterpretationRow
                label="As Address"
                value={slot.interpretations.address}
                available={!!slot.interpretations.address}
              />
              <InterpretationRow
                label="As Uint256"
                value={slot.interpretations.uint256}
                available={!!slot.interpretations.uint256}
              />
              <InterpretationRow
                label="As Int256"
                value={slot.interpretations.int256}
                available={!!slot.interpretations.int256}
              />
              <InterpretationRow
                label="As Bytes32"
                value={slot.interpretations.bytes32}
                available={!!slot.interpretations.bytes32}
              />
              <InterpretationRow
                label="As Boolean"
                value={slot.interpretations.bool}
                available={slot.interpretations.bool !== undefined}
              />
              <InterpretationRow
                label="As String"
                value={slot.interpretations.string}
                available={!!slot.interpretations.string}
              />
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-2 text-xs text-muted-foreground border-t pt-4">
            <div className="flex justify-between">
              <span>Slot Number (Decimal):</span>
              <span className="font-mono">{slot.slot}</span>
            </div>
            <div className="flex justify-between">
              <span>Slot Number (Hex):</span>
              <span className="font-mono">{slot.slotHex}</span>
            </div>
            <div className="flex justify-between">
              <span>Data Type:</span>
              <span className="font-mono">{slot.dataType}</span>
            </div>
            <div className="flex justify-between">
              <span>Is Empty:</span>
              <span className="font-mono">{slot.isEmpty ? 'Yes' : 'No'}</span>
            </div>
            {slot.lastUpdated && (
              <div className="flex justify-between">
                <span>Last Updated:</span>
                <span className="font-mono">
                  {new Date(slot.lastUpdated).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => copyToClipboard(JSON.stringify(slot, null, 2), 'Slot data')}
          >
            Copy as JSON
          </Button>
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
