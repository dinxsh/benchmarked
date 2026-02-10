/**
 * Data Pre-loader for CSV Files
 * Automatically loads token metadata and pairs data on server startup
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'csv-parse/sync';
import { dexCache } from './dex-cache';
import { TradingPair, TokenInfo } from './dex-types';

export class DataLoader {
  private static instance: DataLoader;
  private loaded = false;

  static getInstance(): DataLoader {
    if (!DataLoader.instance) {
      DataLoader.instance = new DataLoader();
    }
    return DataLoader.instance;
  }

  async loadInitialData(): Promise<void> {
    if (this.loaded) {
      console.log('[DataLoader] Data already loaded, skipping...');
      return;
    }

    try {
      console.log('[DataLoader] Starting CSV data load...');

      // Load token metadata
      const tokenMetadata = this.loadTokenMetadata();
      console.log(`[DataLoader] Loaded ${tokenMetadata.size} tokens from metadata`);

      // Load pairs data
      const pairsData = this.loadPairsData(tokenMetadata);
      console.log(`[DataLoader] Loaded ${pairsData.length} pairs from CSV`);

      // Add to cache
      pairsData.forEach(pair => {
        dexCache.addNewPair(pair.pair);

        // Initialize live data with CSV values
        dexCache.updateLivePair(pair.pair.pairAddress, {
          pair: pair.pair,
          price: 0, // Will be updated by streaming
          priceUSD: 0,
          volume24h: pair.volumeUSD,
          volume24hUSD: pair.volumeUSD,
          priceChange24h: 0,
          liquidity: 0,
          liquidityUSD: 0,
          txCount24h: pair.swapCount,
          lastUpdate: Date.now()
        });
      });

      this.loaded = true;
      console.log(`✅ Loaded ${pairsData.length} pairs from CSV files`);
    } catch (error) {
      console.error('❌ Failed to load initial data:', error);
      throw error;
    }
  }

  private loadTokenMetadata(): Map<string, TokenInfo> {
    const csvPath = join(process.cwd(), 'data', 'token_metadata.csv');
    const content = readFileSync(csvPath, 'utf-8');
    const records = parse(content, { columns: true, skip_empty_lines: true });

    const tokenMap = new Map<string, TokenInfo>();

    records.forEach((row: any) => {
      const address = row.token_address.toLowerCase();
      tokenMap.set(address, {
        address,
        symbol: row.symbol,
        name: row.name,
        decimals: 18 // Default, will be updated if available
      });
    });

    return tokenMap;
  }

  private loadPairsData(tokenMetadata: Map<string, TokenInfo>): Array<{
    pair: TradingPair;
    volumeUSD: number;
    swapCount: number;
  }> {
    const csvPath = join(process.cwd(), 'data', 'questdb-query-1770619722259.csv');
    const content = readFileSync(csvPath, 'utf-8');
    const records = parse(content, { columns: true, skip_empty_lines: true });

    const pairs: Array<{ pair: TradingPair; volumeUSD: number; swapCount: number }> = [];

    records.forEach((row: any, index: number) => {
      const pairAddress = row.pair_address.toLowerCase();
      const baseTokenAddress = row.base_token_address.toLowerCase();
      const quoteTokenAddress = row.quote_token_address.toLowerCase();

      const token0 = tokenMetadata.get(baseTokenAddress) || {
        address: baseTokenAddress,
        symbol: 'UNKNOWN',
        name: 'Unknown Token',
        decimals: 18
      };

      const token1 = tokenMetadata.get(quoteTokenAddress) || {
        address: quoteTokenAddress,
        symbol: 'UNKNOWN',
        name: 'Unknown Token',
        decimals: 18
      };

      pairs.push({
        pair: {
          pairAddress,
          poolAddress: pairAddress,
          token0,
          token1,
          dexName: 'MegaETH DEX', // Default DEX name
          createdAt: Date.now() - (index * 60000), // Stagger creation times
          createdBlock: 0
        },
        volumeUSD: parseFloat(row.total_volume_usd),
        swapCount: parseInt(row.swap_count)
      });
    });

    return pairs;
  }

  isLoaded(): boolean {
    return this.loaded;
  }
}
