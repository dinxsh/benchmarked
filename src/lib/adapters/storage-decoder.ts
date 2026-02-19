/**
 * Storage Decoder
 * Decodes raw storage slot hex values into human-readable formats
 */

import { StorageSlot, StorageDataType, StorageLayout, DecoderConfig } from '../storage-types';

/**
 * Storage Decoder
 */
export class StorageDecoder {
  private config: DecoderConfig;

  constructor(config?: Partial<DecoderConfig>) {
    this.config = {
      useHeuristics: true,
      strictMode: false,
      ...config
    };
  }

  /**
   * Decode a storage slot value
   */
  decodeSlot(
    slot: number,
    rawValue: string,
    dataType?: StorageDataType,
    storageLayout?: StorageLayout
  ): StorageSlot {
    // Normalize hex value (remove 0x prefix, pad to 64 chars)
    const normalizedValue = this.normalizeHex(rawValue);

    // Check if empty
    const isEmpty = this.isEmptySlot(normalizedValue);

    // Detect data type if not provided
    const detectedType = dataType || this.guessDataType(normalizedValue, slot, storageLayout);

    // Generate all interpretations
    const interpretations = this.generateInterpretations(normalizedValue);

    // Get primary decoded value based on type
    const decodedValue = this.decodeValue(normalizedValue, detectedType);

    return {
      slot,
      slotHex: '0x' + slot.toString(16).padStart(2, '0'),
      rawValue: '0x' + normalizedValue,
      dataType: detectedType,
      decodedValue,
      interpretations,
      isEmpty,
      lastUpdated: Date.now()
    };
  }

  /**
   * Decode multiple slots
   */
  decodeSlots(
    slotsMap: Map<number, string>,
    storageLayout?: StorageLayout
  ): StorageSlot[] {
    const slots: StorageSlot[] = [];

    slotsMap.forEach((rawValue, slotNumber) => {
      const slot = this.decodeSlot(slotNumber, rawValue, undefined, storageLayout);
      slots.push(slot);
    });

    // Sort by slot number
    slots.sort((a, b) => a.slot - b.slot);

    return slots;
  }

  /**
   * Normalize hex value to 64 characters
   */
  private normalizeHex(hex: string): string {
    // Remove 0x prefix
    let normalized = hex.startsWith('0x') ? hex.slice(2) : hex;

    // Pad to 64 characters (32 bytes)
    normalized = normalized.padStart(64, '0');

    // Take only first 64 chars if too long
    normalized = normalized.slice(0, 64);

    return normalized.toLowerCase();
  }

  /**
   * Check if slot is empty (all zeros)
   */
  private isEmptySlot(normalizedHex: string): boolean {
    return /^0+$/.test(normalizedHex);
  }

  /**
   * Guess data type using heuristics
   */
  private guessDataType(
    normalizedHex: string,
    slot: number,
    storageLayout?: StorageLayout
  ): StorageDataType {
    // Check storage layout first if available
    if (storageLayout && this.config.useHeuristics) {
      const layoutType = this.getTypeFromLayout(slot, storageLayout);
      if (layoutType) {
        return layoutType;
      }
    }

    // Check if empty
    if (this.isEmptySlot(normalizedHex)) {
      return StorageDataType.EMPTY;
    }

    // Check if it's an address (first 24 chars are zero, last 40 are non-zero)
    const first24 = normalizedHex.slice(0, 24);
    const last40 = normalizedHex.slice(24);

    if (/^0+$/.test(first24) && /[1-9a-f]/.test(last40)) {
      // Likely an address
      return StorageDataType.ADDRESS;
    }

    // Check if it's a boolean (last byte is 0 or 1, rest is zeros)
    const first63 = normalizedHex.slice(0, 62);
    const lastByte = normalizedHex.slice(62);

    if (/^0+$/.test(first63) && (lastByte === '00' || lastByte === '01')) {
      return StorageDataType.BOOL;
    }

    // Check if it might be a string (has ASCII characters)
    if (this.looksLikeString(normalizedHex)) {
      return StorageDataType.STRING;
    }

    // Check if it's a small number (first 48 chars are zero)
    const first48 = normalizedHex.slice(0, 48);
    if (/^0+$/.test(first48)) {
      return StorageDataType.UINT256;
    }

    // Default to bytes32 for arbitrary data
    return StorageDataType.BYTES32;
  }

  /**
   * Get type from storage layout
   */
  private getTypeFromLayout(slot: number, layout: StorageLayout): StorageDataType | null {
    const variable = layout.storage.find(v => parseInt(v.slot, 10) === slot);

    if (!variable) {
      return null;
    }

    const typeInfo = layout.types[variable.type];
    if (!typeInfo) {
      return null;
    }

    const label = typeInfo.label.toLowerCase();

    if (label.includes('address')) return StorageDataType.ADDRESS;
    if (label.includes('bool')) return StorageDataType.BOOL;
    if (label.includes('uint')) return StorageDataType.UINT256;
    if (label.includes('int')) return StorageDataType.INT256;
    if (label.includes('string')) return StorageDataType.STRING;
    if (label.includes('bytes32')) return StorageDataType.BYTES32;
    if (label.includes('bytes')) return StorageDataType.BYTES;

    return null;
  }

  /**
   * Check if hex value looks like a string
   */
  private looksLikeString(normalizedHex: string): boolean {
    // Decode as ASCII and check if it has readable characters
    try {
      let str = '';
      for (let i = 0; i < normalizedHex.length; i += 2) {
        const charCode = parseInt(normalizedHex.slice(i, i + 2), 16);
        if (charCode === 0) break; // Null terminator
        if (charCode >= 32 && charCode <= 126) {
          str += String.fromCharCode(charCode);
        } else if (charCode !== 0) {
          return false; // Non-printable character
        }
      }
      // Must have at least 3 printable chars to be considered a string
      return str.length >= 3;
    } catch {
      return false;
    }
  }

  /**
   * Generate all possible interpretations
   */
  private generateInterpretations(normalizedHex: string): StorageSlot['interpretations'] {
    return {
      address: this.decodeAsAddress(normalizedHex),
      uint256: this.decodeAsUint256(normalizedHex),
      int256: this.decodeAsInt256(normalizedHex),
      bytes32: this.decodeAsBytes32(normalizedHex),
      bool: this.decodeAsBool(normalizedHex),
      string: this.decodeAsString(normalizedHex)
    };
  }

  /**
   * Decode value based on specified type
   */
  private decodeValue(normalizedHex: string, dataType: StorageDataType): string {
    switch (dataType) {
      case StorageDataType.ADDRESS:
        return this.decodeAsAddress(normalizedHex) || 'Invalid address';

      case StorageDataType.UINT256:
        return this.decodeAsUint256(normalizedHex) || '0';

      case StorageDataType.INT256:
        return this.decodeAsInt256(normalizedHex) || '0';

      case StorageDataType.BOOL:
        const boolValue = this.decodeAsBool(normalizedHex);
        return boolValue !== undefined ? String(boolValue) : 'false';

      case StorageDataType.STRING:
        return this.decodeAsString(normalizedHex) || '';

      case StorageDataType.BYTES32:
        return this.decodeAsBytes32(normalizedHex) || '0x0';

      case StorageDataType.BYTES:
        return this.decodeAsBytes32(normalizedHex) || '0x0';

      case StorageDataType.EMPTY:
        return '(empty)';

      case StorageDataType.UNKNOWN:
      default:
        return '0x' + normalizedHex;
    }
  }

  /**
   * Decode as Ethereum address
   */
  private decodeAsAddress(normalizedHex: string): string | undefined {
    // Take last 20 bytes (40 chars)
    const addressHex = normalizedHex.slice(-40);

    // Check if it's a valid address (not all zeros)
    if (/^0+$/.test(addressHex)) {
      return undefined;
    }

    return '0x' + addressHex;
  }

  /**
   * Decode as unsigned 256-bit integer
   */
  private decodeAsUint256(normalizedHex: string): string | undefined {
    try {
      const bigIntValue = BigInt('0x' + normalizedHex);
      return bigIntValue.toString();
    } catch {
      return undefined;
    }
  }

  /**
   * Decode as signed 256-bit integer (two's complement)
   */
  private decodeAsInt256(normalizedHex: string): string | undefined {
    try {
      const bigIntValue = BigInt('0x' + normalizedHex);

      // Check if negative (MSB is 1)
      const maxInt256 = BigInt('0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF');

      if (bigIntValue > maxInt256) {
        // Negative number - compute two's complement
        const maxUint256 = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF');
        const negativeValue = bigIntValue - maxUint256 - BigInt(1);
        return negativeValue.toString();
      }

      return bigIntValue.toString();
    } catch {
      return undefined;
    }
  }

  /**
   * Decode as bytes32
   */
  private decodeAsBytes32(normalizedHex: string): string | undefined {
    return '0x' + normalizedHex;
  }

  /**
   * Decode as boolean
   */
  private decodeAsBool(normalizedHex: string): boolean | undefined {
    const lastByte = normalizedHex.slice(-2);

    if (lastByte === '00') return false;
    if (lastByte === '01') return true;

    // Not a valid boolean
    return undefined;
  }

  /**
   * Decode as string
   */
  private decodeAsString(normalizedHex: string): string | undefined {
    try {
      let result = '';
      let foundContent = false;

      for (let i = 0; i < normalizedHex.length; i += 2) {
        const charCode = parseInt(normalizedHex.slice(i, i + 2), 16);

        if (charCode === 0) {
          // Null terminator
          if (foundContent) break;
          continue;
        }

        // Only include printable ASCII characters
        if (charCode >= 32 && charCode <= 126) {
          result += String.fromCharCode(charCode);
          foundContent = true;
        } else {
          // Non-printable character found, not a string
          return undefined;
        }
      }

      return foundContent && result.length >= 3 ? result : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Parse storage layout from contract ABI
   */
  parseStorageLayout(abi: any[]): StorageLayout | null {
    // Note: Standard contract ABIs don't include storage layout
    // This would need to come from the compiler output (metadata)
    // For now, return null
    return null;
  }

  /**
   * Format value for display
   */
  formatValue(value: string, dataType: StorageDataType, maxLength: number = 50): string {
    if (value.length <= maxLength) {
      return value;
    }

    // Truncate long values
    if (dataType === StorageDataType.BYTES32 || dataType === StorageDataType.BYTES) {
      return value.slice(0, 10) + '...' + value.slice(-8);
    }

    return value.slice(0, maxLength - 3) + '...';
  }
}

// Export singleton instance
export const storageDecoder = new StorageDecoder();

// Export class for custom instances
export { StorageDecoder as StorageDecoderClass };
