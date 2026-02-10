/**
 * Storage GoldRush Adapter
 * Fetches contract metadata from GoldRush (Covalent) API
 */

import { ContractMetadata } from '../storage-types';

/**
 * GoldRush API response for contract metadata
 */
interface GoldRushContractResponse {
  data: {
    address: string;
    contract_name?: string;
    contract_ticker_symbol?: string;
    logo_url?: string;
    contract_metadata?: {
      abi?: any[];
      is_verified?: boolean;
    };
  };
  error: boolean;
  error_message?: string;
  error_code?: number;
}

/**
 * Etherscan API response for contract source
 */
interface EtherscanContractResponse {
  status: string;
  message: string;
  result: Array<{
    SourceCode: string;
    ABI: string;
    ContractName: string;
    CompilerVersion: string;
    OptimizationUsed: string;
    Runs: string;
    ConstructorArguments: string;
    EVMVersion: string;
    Library: string;
    LicenseType: string;
    Proxy: string;
    Implementation: string;
    SwarmSource: string;
  }>;
}

/**
 * Storage GoldRush Adapter
 */
export class StorageGoldRushAdapter {
  private readonly apiKey: string;
  private readonly baseUrl: string = 'https://api.covalenthq.com/v1';
  private readonly timeout: number = 10000; // 10 seconds
  private readonly etherscanApiKey?: string;
  private readonly etherscanBaseUrl: string = 'https://api.etherscan.io/api';

  constructor() {
    this.apiKey = process.env.GOLDRUSH_API_KEY || '';
    this.etherscanApiKey = process.env.ETHERSCAN_API_KEY;

    if (!this.apiKey) {
      console.warn('[StorageGoldRushAdapter] GOLDRUSH_API_KEY not set. Metadata fetching may be limited.');
    }
  }

  /**
   * Fetch contract metadata from GoldRush
   */
  async getContractMetadata(address: string, chainId: number = 1): Promise<ContractMetadata> {
    const startTime = performance.now();

    try {
      // Try Etherscan first for better ABI/verification data
      if (this.etherscanApiKey && chainId === 1) {
        try {
          const etherscanMetadata = await this.fetchFromEtherscan(address);
          const latency = Math.round(performance.now() - startTime);
          console.log(`[StorageGoldRushAdapter] Fetched metadata from Etherscan in ${latency}ms`);
          return etherscanMetadata;
        } catch (error) {
          console.warn('[StorageGoldRushAdapter] Etherscan fetch failed, falling back to GoldRush:', error);
        }
      }

      // Fallback to GoldRush
      if (this.apiKey) {
        const goldrushMetadata = await this.fetchFromGoldRush(address, chainId);
        const latency = Math.round(performance.now() - startTime);
        console.log(`[StorageGoldRushAdapter] Fetched metadata from GoldRush in ${latency}ms`);
        return goldrushMetadata;
      }

      // No API keys available, return basic metadata
      const latency = Math.round(performance.now() - startTime);
      console.warn('[StorageGoldRushAdapter] No API keys configured, returning basic metadata');
      return {
        address,
        chainId,
        isVerified: false,
        fetchedAt: Date.now()
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[StorageGoldRushAdapter] Failed to fetch contract metadata:', errorMessage);

      // Return basic metadata on error
      return {
        address,
        chainId,
        isVerified: false,
        fetchedAt: Date.now()
      };
    }
  }

  /**
   * Fetch contract metadata from Etherscan
   */
  private async fetchFromEtherscan(address: string): Promise<ContractMetadata> {
    if (!this.etherscanApiKey) {
      throw new Error('Etherscan API key not configured');
    }

    const url = `${this.etherscanBaseUrl}?module=contract&action=getsourcecode&address=${address}&apikey=${this.etherscanApiKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: EtherscanContractResponse = await response.json();

      if (data.status !== '1' || !data.result || data.result.length === 0) {
        throw new Error(data.message || 'No contract data found');
      }

      const contractData = data.result[0];
      const isVerified = contractData.ABI !== 'Contract source code not verified';

      let abi: any[] | undefined;
      if (isVerified && contractData.ABI) {
        try {
          abi = JSON.parse(contractData.ABI);
        } catch (error) {
          console.warn('[StorageGoldRushAdapter] Failed to parse ABI from Etherscan:', error);
        }
      }

      return {
        address,
        name: contractData.ContractName || undefined,
        symbol: undefined, // Etherscan doesn't provide symbol in this endpoint
        isVerified,
        abi,
        chainId: 1, // Ethereum mainnet
        fetchedAt: Date.now()
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Fetch contract metadata from GoldRush
   */
  private async fetchFromGoldRush(address: string, chainId: number): Promise<ContractMetadata> {
    const chainName = this.getChainName(chainId);
    const url = `${this.baseUrl}/${chainName}/tokens/${address}/token_holders_v2/?key=${this.apiKey}&page-size=1`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: any = await response.json();

      if (data.error) {
        throw new Error(data.error_message || 'GoldRush API error');
      }

      // Extract metadata from response
      const contractData = data.data?.items?.[0] || {};

      return {
        address,
        name: contractData.contract_name || undefined,
        symbol: contractData.contract_ticker_symbol || undefined,
        isVerified: false, // GoldRush doesn't provide verification status in this endpoint
        chainId,
        fetchedAt: Date.now()
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Get chain name for GoldRush API
   */
  private getChainName(chainId: number): string {
    const chainMap: Record<number, string> = {
      1: 'eth-mainnet',
      5: 'eth-goerli',
      11155111: 'eth-sepolia',
      137: 'matic-mainnet',
      80001: 'matic-mumbai',
      56: 'bsc-mainnet',
      97: 'bsc-testnet',
      43114: 'avalanche-mainnet',
      43113: 'avalanche-fuji',
      42161: 'arbitrum-mainnet',
      421613: 'arbitrum-goerli',
      10: 'optimism-mainnet',
      420: 'optimism-goerli',
      8453: 'base-mainnet',
      84531: 'base-goerli'
    };

    return chainMap[chainId] || 'eth-mainnet';
  }

  /**
   * Fetch contract ABI only (lightweight)
   */
  async getContractABI(address: string, chainId: number = 1): Promise<any[] | null> {
    try {
      // Try Etherscan first
      if (this.etherscanApiKey && chainId === 1) {
        const metadata = await this.fetchFromEtherscan(address);
        return metadata.abi || null;
      }

      return null;
    } catch (error) {
      console.error('[StorageGoldRushAdapter] Failed to fetch ABI:', error);
      return null;
    }
  }

  /**
   * Check if contract is verified
   */
  async isContractVerified(address: string, chainId: number = 1): Promise<boolean> {
    try {
      const metadata = await this.getContractMetadata(address, chainId);
      return metadata.isVerified;
    } catch (error) {
      console.error('[StorageGoldRushAdapter] Failed to check verification status:', error);
      return false;
    }
  }

  /**
   * Get adapter statistics
   */
  getStats() {
    return {
      apiKeyConfigured: !!this.apiKey,
      etherscanKeyConfigured: !!this.etherscanApiKey,
      baseUrl: this.baseUrl,
      timeout: this.timeout
    };
  }
}

// Export singleton instance
export const storageGoldRush = new StorageGoldRushAdapter();
