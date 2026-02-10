/**
 * EVM Storage Cache Layer
 * In-memory cache for contract storage data with TTL
 */

import { ContractStorage, ContractMetadata, StorageCacheEntry } from './storage-types';

class StorageCache {
  // Storage maps with TTL
  private contractStorage: Map<string, StorageCacheEntry<ContractStorage>>;
  private contractMetadata: Map<string, StorageCacheEntry<ContractMetadata>>;

  // Configuration - TTL in milliseconds
  private readonly STORAGE_TTL = 5 * 60 * 1000;      // 5 minutes for storage slots
  private readonly METADATA_TTL = 30 * 60 * 1000;    // 30 minutes for metadata
  private readonly CLEANUP_INTERVAL = 60 * 60 * 1000; // Cleanup every hour

  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.contractStorage = new Map();
    this.contractMetadata = new Map();

    // Start periodic cleanup
    this.startCleanup();
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanup(): void {
    // Only run cleanup in server environment
    if (typeof window === 'undefined') {
      this.cleanupTimer = setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL);
    }
  }

  /**
   * Stop cleanup timer (useful for testing)
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Generate cache key for contract storage
   */
  private getStorageKey(address: string, chainId: number, startSlot: number, endSlot: number): string {
    return `${address.toLowerCase()}_${chainId}_${startSlot}_${endSlot}`;
  }

  /**
   * Generate cache key for contract metadata
   */
  private getMetadataKey(address: string, chainId: number): string {
    return `${address.toLowerCase()}_${chainId}`;
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: StorageCacheEntry<any>): boolean {
    return Date.now() > entry.expiresAt;
  }

  /**
   * Get contract storage from cache
   */
  getContractStorage(
    address: string,
    chainId: number,
    startSlot: number = 0,
    endSlot: number = 255
  ): ContractStorage | null {
    const key = this.getStorageKey(address, chainId, startSlot, endSlot);
    const entry = this.contractStorage.get(key);

    if (!entry) {
      return null;
    }

    if (this.isExpired(entry)) {
      this.contractStorage.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set contract storage in cache
   */
  setContractStorage(
    address: string,
    chainId: number,
    storage: ContractStorage,
    ttl: number = this.STORAGE_TTL
  ): void {
    const key = this.getStorageKey(
      address,
      chainId,
      storage.slotRange.start,
      storage.slotRange.end
    );

    const entry: StorageCacheEntry<ContractStorage> = {
      data: storage,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl
    };

    this.contractStorage.set(key, entry);
  }

  /**
   * Get contract metadata from cache
   */
  getContractMetadata(address: string, chainId: number): ContractMetadata | null {
    const key = this.getMetadataKey(address, chainId);
    const entry = this.contractMetadata.get(key);

    if (!entry) {
      return null;
    }

    if (this.isExpired(entry)) {
      this.contractMetadata.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set contract metadata in cache
   */
  setContractMetadata(
    address: string,
    chainId: number,
    metadata: ContractMetadata,
    ttl: number = this.METADATA_TTL
  ): void {
    const key = this.getMetadataKey(address, chainId);

    const entry: StorageCacheEntry<ContractMetadata> = {
      data: metadata,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl
    };

    this.contractMetadata.set(key, entry);
  }

  /**
   * Invalidate contract storage cache
   */
  invalidateContractStorage(
    address: string,
    chainId: number,
    startSlot?: number,
    endSlot?: number
  ): void {
    if (startSlot !== undefined && endSlot !== undefined) {
      // Invalidate specific range
      const key = this.getStorageKey(address, chainId, startSlot, endSlot);
      this.contractStorage.delete(key);
    } else {
      // Invalidate all storage for this contract
      const prefix = `${address.toLowerCase()}_${chainId}_`;
      for (const key of this.contractStorage.keys()) {
        if (key.startsWith(prefix)) {
          this.contractStorage.delete(key);
        }
      }
    }
  }

  /**
   * Invalidate contract metadata cache
   */
  invalidateContractMetadata(address: string, chainId: number): void {
    const key = this.getMetadataKey(address, chainId);
    this.contractMetadata.delete(key);
  }

  /**
   * Invalidate all cache for a contract (storage + metadata)
   */
  invalidateContract(address: string, chainId: number): void {
    this.invalidateContractStorage(address, chainId);
    this.invalidateContractMetadata(address, chainId);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      storageEntries: this.contractStorage.size,
      metadataEntries: this.contractMetadata.size,
      totalEntries: this.contractStorage.size + this.contractMetadata.size,
      storageTTL: this.STORAGE_TTL,
      metadataTTL: this.METADATA_TTL
    };
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): void {
    const now = Date.now();
    let expiredStorage = 0;
    let expiredMetadata = 0;

    // Cleanup expired storage entries
    for (const [key, entry] of this.contractStorage.entries()) {
      if (now > entry.expiresAt) {
        this.contractStorage.delete(key);
        expiredStorage++;
      }
    }

    // Cleanup expired metadata entries
    for (const [key, entry] of this.contractMetadata.entries()) {
      if (now > entry.expiresAt) {
        this.contractMetadata.delete(key);
        expiredMetadata++;
      }
    }

    if (expiredStorage > 0 || expiredMetadata > 0) {
      console.log(
        `[StorageCache] Cleaned up ${expiredStorage} storage entries and ${expiredMetadata} metadata entries`
      );
    }
  }

  /**
   * Clear all cache entries (useful for testing)
   */
  clear(): void {
    this.contractStorage.clear();
    this.contractMetadata.clear();
  }

  /**
   * Get all cached contract addresses
   */
  getCachedAddresses(): Array<{ address: string; chainId: number }> {
    const addresses = new Set<string>();
    const result: Array<{ address: string; chainId: number }> = [];

    // Extract from storage keys
    for (const key of this.contractStorage.keys()) {
      const [address, chainIdStr] = key.split('_');
      const uniqueKey = `${address}_${chainIdStr}`;
      if (!addresses.has(uniqueKey)) {
        addresses.add(uniqueKey);
        result.push({
          address,
          chainId: parseInt(chainIdStr, 10)
        });
      }
    }

    // Extract from metadata keys
    for (const key of this.contractMetadata.keys()) {
      const [address, chainIdStr] = key.split('_');
      const uniqueKey = `${address}_${chainIdStr}`;
      if (!addresses.has(uniqueKey)) {
        addresses.add(uniqueKey);
        result.push({
          address,
          chainId: parseInt(chainIdStr, 10)
        });
      }
    }

    return result;
  }

  /**
   * Check if contract is cached (either storage or metadata)
   */
  hasContract(address: string, chainId: number): boolean {
    const metadataKey = this.getMetadataKey(address, chainId);
    if (this.contractMetadata.has(metadataKey)) {
      const entry = this.contractMetadata.get(metadataKey);
      if (entry && !this.isExpired(entry)) {
        return true;
      }
    }

    const storagePrefix = `${address.toLowerCase()}_${chainId}_`;
    for (const key of this.contractStorage.keys()) {
      if (key.startsWith(storagePrefix)) {
        const entry = this.contractStorage.get(key);
        if (entry && !this.isExpired(entry)) {
          return true;
        }
      }
    }

    return false;
  }
}

// Export singleton instance
export const storageCache = new StorageCache();
