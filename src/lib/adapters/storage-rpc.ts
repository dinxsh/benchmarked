/**
 * Storage RPC Adapter
 * Handles eth_getStorageAt calls to Ethereum RPC endpoints
 */

import { StorageSlot, BatchStorageRequest, RPCProvider } from '../storage-types';

/**
 * RPC JSON-RPC 2.0 request structure
 */
interface JSONRPCRequest {
  jsonrpc: string;
  method: string;
  params: any[];
  id: number | string;
}

/**
 * RPC JSON-RPC 2.0 response structure
 */
interface JSONRPCResponse {
  jsonrpc: string;
  id: number | string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

/**
 * Storage RPC Adapter for eth_getStorageAt
 */
export class StorageRPCAdapter {
  private providers: RPCProvider[];
  private currentProviderIndex: number = 0;
  private readonly DEFAULT_TIMEOUT = 10000; // 10 seconds
  private readonly MAX_BATCH_SIZE = 256;
  private readonly MAX_RETRIES = 2;

  constructor() {
    this.providers = this.initializeProviders();
  }

  /**
   * Initialize RPC providers from environment variables
   */
  private initializeProviders(): RPCProvider[] {
    const providers: RPCProvider[] = [];

    // Alchemy (primary)
    if (process.env.ALCHEMY_ENDPOINT) {
      providers.push({
        name: 'Alchemy',
        endpoint: process.env.ALCHEMY_ENDPOINT,
        chainId: 1, // Ethereum mainnet
        maxBatchSize: 256,
        timeout: this.DEFAULT_TIMEOUT
      });
    }

    // Infura (fallback)
    if (process.env.INFURA_ENDPOINT) {
      providers.push({
        name: 'Infura',
        endpoint: process.env.INFURA_ENDPOINT,
        chainId: 1,
        maxBatchSize: 256,
        timeout: this.DEFAULT_TIMEOUT
      });
    }

    // QuickNode (additional fallback)
    if (process.env.QUICKNODE_ENDPOINT) {
      providers.push({
        name: 'QuickNode',
        endpoint: process.env.QUICKNODE_ENDPOINT,
        chainId: 1,
        maxBatchSize: 256,
        timeout: this.DEFAULT_TIMEOUT
      });
    }

    if (providers.length === 0) {
      console.warn('[StorageRPCAdapter] No RPC endpoints configured. Set ALCHEMY_ENDPOINT or INFURA_ENDPOINT in env.');
    }

    return providers;
  }

  /**
   * Get current active provider
   */
  private getCurrentProvider(): RPCProvider | null {
    if (this.providers.length === 0) {
      return null;
    }
    return this.providers[this.currentProviderIndex % this.providers.length];
  }

  /**
   * Rotate to next provider (for failover)
   */
  private rotateProvider(): void {
    this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providers.length;
    const provider = this.getCurrentProvider();
    console.log(`[StorageRPCAdapter] Rotating to provider: ${provider?.name}`);
  }

  /**
   * Convert slot number to hex string
   */
  private slotToHex(slot: number): string {
    return '0x' + slot.toString(16).padStart(64, '0');
  }

  /**
   * Fetch a single storage slot
   */
  async getStorageSlot(
    address: string,
    slot: number,
    blockTag: string | number = 'latest'
  ): Promise<string> {
    const slotHex = this.slotToHex(slot);
    const blockTagStr = typeof blockTag === 'number' ? '0x' + blockTag.toString(16) : blockTag;

    const request: JSONRPCRequest = {
      jsonrpc: '2.0',
      method: 'eth_getStorageAt',
      params: [address, slotHex, blockTagStr],
      id: 1
    };

    const response = await this.makeRPCCall<string>(request);
    return response;
  }

  /**
   * Fetch multiple storage slots in batch
   */
  async getBatchStorageSlots(request: BatchStorageRequest): Promise<Map<number, string>> {
    const { address, slots, blockTag, chainId } = request;
    const blockTagStr = typeof blockTag === 'number' ? '0x' + blockTag.toString(16) : blockTag;

    // Split into batches if necessary
    const batchSize = Math.min(this.MAX_BATCH_SIZE, slots.length);
    const batches: number[][] = [];

    for (let i = 0; i < slots.length; i += batchSize) {
      batches.push(slots.slice(i, i + batchSize));
    }

    const results = new Map<number, string>();

    // Process each batch
    for (const batch of batches) {
      const batchRequests: JSONRPCRequest[] = batch.map((slot, index) => ({
        jsonrpc: '2.0',
        method: 'eth_getStorageAt',
        params: [address, this.slotToHex(slot), blockTagStr],
        id: index
      }));

      try {
        const batchResults = await this.makeBatchRPCCall(batchRequests);

        // Map results back to slot numbers
        batch.forEach((slot, index) => {
          const value = batchResults.get(index);
          if (value !== undefined) {
            results.set(slot, value);
          }
        });
      } catch (error) {
        console.error(`[StorageRPCAdapter] Batch request failed:`, error);
        // Try individual requests as fallback
        for (const slot of batch) {
          try {
            const value = await this.getStorageSlot(address, slot, blockTag);
            results.set(slot, value);
          } catch (slotError) {
            console.error(`[StorageRPCAdapter] Failed to fetch slot ${slot}:`, slotError);
            // Set empty value for failed slots
            results.set(slot, '0x' + '0'.repeat(64));
          }
        }
      }
    }

    return results;
  }

  /**
   * Make a single RPC call with retry logic
   */
  private async makeRPCCall<T>(request: JSONRPCRequest, retryCount: number = 0): Promise<T> {
    const provider = this.getCurrentProvider();

    if (!provider) {
      throw new Error('No RPC provider available. Configure ALCHEMY_ENDPOINT or INFURA_ENDPOINT.');
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), provider.timeout);

      const response = await fetch(provider.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: JSONRPCResponse = await response.json();

      if (data.error) {
        throw new Error(`RPC Error ${data.error.code}: ${data.error.message}`);
      }

      if (data.result === undefined) {
        throw new Error('No result in RPC response');
      }

      return data.result as T;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[StorageRPCAdapter] RPC call failed with ${provider.name}:`, errorMessage);

      // Retry with next provider
      if (retryCount < this.MAX_RETRIES) {
        this.rotateProvider();
        console.log(`[StorageRPCAdapter] Retrying with next provider (attempt ${retryCount + 1}/${this.MAX_RETRIES})`);
        return this.makeRPCCall<T>(request, retryCount + 1);
      }

      throw new Error(`RPC call failed after ${this.MAX_RETRIES} retries: ${errorMessage}`);
    }
  }

  /**
   * Make a batch RPC call
   */
  private async makeBatchRPCCall(requests: JSONRPCRequest[]): Promise<Map<number | string, any>> {
    const provider = this.getCurrentProvider();

    if (!provider) {
      throw new Error('No RPC provider available');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), provider.timeout);

    try {
      const response = await fetch(provider.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requests),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: JSONRPCResponse[] = await response.json();
      const results = new Map<number | string, any>();

      data.forEach((item) => {
        if (item.error) {
          console.warn(`[StorageRPCAdapter] Batch item ${item.id} failed:`, item.error.message);
        } else if (item.result !== undefined) {
          results.set(item.id, item.result);
        }
      });

      return results;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Get current block number
   */
  async getBlockNumber(): Promise<number> {
    const request: JSONRPCRequest = {
      jsonrpc: '2.0',
      method: 'eth_blockNumber',
      params: [],
      id: 1
    };

    const result = await this.makeRPCCall<string>(request);
    return parseInt(result, 16);
  }

  /**
   * Check if address is a contract
   */
  async isContract(address: string): Promise<boolean> {
    const request: JSONRPCRequest = {
      jsonrpc: '2.0',
      method: 'eth_getCode',
      params: [address, 'latest'],
      id: 1
    };

    try {
      const code = await this.makeRPCCall<string>(request);
      // Contract has code beyond '0x'
      return !!(code && code !== '0x' && code.length > 2);
    } catch (error) {
      console.error('[StorageRPCAdapter] Failed to check if address is contract:', error);
      return false;
    }
  }

  /**
   * Get provider statistics
   */
  getProviderStats() {
    return {
      totalProviders: this.providers.length,
      currentProvider: this.getCurrentProvider()?.name,
      providers: this.providers.map(p => ({
        name: p.name,
        endpoint: p.endpoint.substring(0, 50) + '...',
        maxBatchSize: p.maxBatchSize
      }))
    };
  }
}

// Export singleton instance
export const storageRPC = new StorageRPCAdapter();
