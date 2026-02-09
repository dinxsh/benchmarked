/**
 * DEX Pair CSV Loader
 * Utility for loading trading pairs from CSV files
 */

import { parse } from 'csv-parse/sync';
import { TradingPair, TokenInfo } from './dex-types';
import * as fs from 'fs';

export class DexPairLoader {
  /**
   * Load pairs from CSV content string
   */
  async loadPairsFromCSV(csvContent: string): Promise<TradingPair[]> {
    try {
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      const pairs: TradingPair[] = [];

      for (const row of records) {
        try {
          const pair = this.csvRowToPair(row);
          pairs.push(pair);
        } catch (error) {
          console.error('Error parsing CSV row:', row, error);
          // Continue processing other rows
        }
      }

      return pairs;
    } catch (error) {
      throw new Error(`Failed to parse CSV: ${error}`);
    }
  }

  /**
   * Load pairs from file system (server-side)
   */
  async loadFromFile(filePath: string): Promise<TradingPair[]> {
    try {
      const csvContent = fs.readFileSync(filePath, 'utf-8');
      return this.loadPairsFromCSV(csvContent);
    } catch (error) {
      throw new Error(`Failed to load CSV file: ${error}`);
    }
  }

  /**
   * Transform CSV row to TradingPair interface
   * Supports flexible column naming
   */
  private csvRowToPair(row: any): TradingPair {
    // Extract pair address (try multiple column name variations)
    const pairAddress = this.extractField(row, [
      'pairAddress',
      'pair_address',
      'pair',
      'address',
    ]);

    // Extract pool address (may be same as pair address)
    const poolAddress = this.extractField(
      row,
      ['poolAddress', 'pool_address', 'pool'],
      pairAddress
    );

    // Extract token0 info
    const token0: TokenInfo = {
      address: this.extractField(row, [
        'token0Address',
        'token0_address',
        'token0',
      ]),
      symbol: this.extractField(row, [
        'token0Symbol',
        'token0_symbol',
        'token0Sym',
      ]),
      name: this.extractField(
        row,
        ['token0Name', 'token0_name'],
        this.extractField(row, ['token0Symbol', 'token0_symbol', 'token0Sym'])
      ),
      decimals: this.extractNumberField(
        row,
        ['token0Decimals', 'token0_decimals'],
        18
      ),
    };

    // Extract token1 info
    const token1: TokenInfo = {
      address: this.extractField(row, [
        'token1Address',
        'token1_address',
        'token1',
      ]),
      symbol: this.extractField(row, [
        'token1Symbol',
        'token1_symbol',
        'token1Sym',
      ]),
      name: this.extractField(
        row,
        ['token1Name', 'token1_name'],
        this.extractField(row, ['token1Symbol', 'token1_symbol', 'token1Sym'])
      ),
      decimals: this.extractNumberField(
        row,
        ['token1Decimals', 'token1_decimals'],
        18
      ),
    };

    // Extract DEX name
    const dexName = this.extractField(
      row,
      ['dexName', 'dex_name', 'dex', 'protocol'],
      'unknown'
    );

    // Extract timestamps (optional, use current time if not provided)
    const createdAt = this.extractNumberField(
      row,
      ['createdAt', 'created_at', 'timestamp'],
      Date.now()
    );

    const createdBlock = this.extractNumberField(
      row,
      ['createdBlock', 'created_block', 'blockNumber', 'block_number'],
      0
    );

    return {
      pairAddress,
      poolAddress,
      token0,
      token1,
      dexName,
      createdAt,
      createdBlock,
    };
  }

  /**
   * Extract field from row with multiple possible column names
   */
  private extractField(
    row: any,
    possibleNames: string[],
    defaultValue?: string
  ): string {
    for (const name of possibleNames) {
      if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
        return String(row[name]).trim();
      }
    }

    if (defaultValue !== undefined) {
      return defaultValue;
    }

    throw new Error(
      `Missing required field. Tried: ${possibleNames.join(', ')}`
    );
  }

  /**
   * Extract numeric field from row
   */
  private extractNumberField(
    row: any,
    possibleNames: string[],
    defaultValue?: number
  ): number {
    for (const name of possibleNames) {
      if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
        const num = Number(row[name]);
        if (!isNaN(num)) {
          return num;
        }
      }
    }

    if (defaultValue !== undefined) {
      return defaultValue;
    }

    throw new Error(
      `Missing required numeric field. Tried: ${possibleNames.join(', ')}`
    );
  }

  /**
   * Validate a trading pair
   */
  validatePair(pair: TradingPair): boolean {
    try {
      // Check required fields
      if (!pair.pairAddress || !pair.poolAddress) {
        return false;
      }

      // Check token0
      if (
        !pair.token0.address ||
        !pair.token0.symbol ||
        pair.token0.decimals < 0
      ) {
        return false;
      }

      // Check token1
      if (
        !pair.token1.address ||
        !pair.token1.symbol ||
        pair.token1.decimals < 0
      ) {
        return false;
      }

      // Check addresses are valid (basic check)
      if (
        !pair.pairAddress.startsWith('0x') ||
        !pair.token0.address.startsWith('0x') ||
        !pair.token1.address.startsWith('0x')
      ) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate a sample CSV template
   */
  generateCSVTemplate(): string {
    return `pairAddress,poolAddress,token0Address,token0Symbol,token0Name,token0Decimals,token1Address,token1Symbol,token1Name,token1Decimals,dexName,createdAt,createdBlock
0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640,0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640,0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2,WETH,Wrapped Ether,18,0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48,USDC,USD Coin,6,uniswap-v3,1234567890000,12345678`;
  }
}
