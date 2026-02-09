/**
 * DEX Dashboard Type Definitions
 * Type interfaces for trading pairs, OHLCV data, and streaming metrics
 */

import { StreamingMetrics } from './benchmark-types';

/**
 * Token information within a trading pair
 */
export interface TokenInfo {
  address: string;
  symbol: string;                 // e.g., "WETH"
  name: string;                   // e.g., "Wrapped Ether"
  decimals: number;               // Token decimals
}

/**
 * Core trading pair interface
 */
export interface TradingPair {
  pairAddress: string;           // Unique pair identifier
  poolAddress: string;            // Liquidity pool address
  token0: TokenInfo;              // First token in pair
  token1: TokenInfo;              // Second token in pair
  dexName: string;                // DEX protocol (uniswap-v3, etc.)
  createdAt: number;              // Unix timestamp
  createdBlock: number;           // Block number of creation
}

/**
 * OHLCV candle data
 */
export interface OHLCVData {
  pairAddress: string;
  timestamp: number;
  open: number;                   // Opening price
  high: number;                   // Highest price in period
  low: number;                    // Lowest price in period
  close: number;                  // Closing price
  volume: number;                 // Trading volume
  volumeUSD: number;              // Volume in USD
  txCount: number;                // Number of transactions
}

/**
 * Live pair update with all current metrics
 */
export interface LivePairUpdate {
  pair: TradingPair;
  price: number;                  // Current price (token1/token0)
  priceUSD: number;               // USD price
  volume24h: number;              // 24h volume
  volume24hUSD: number;           // 24h volume in USD
  priceChange24h: number;         // 24h price change %
  liquidity: number;              // Total liquidity in pool
  liquidityUSD: number;           // Liquidity in USD
  txCount24h: number;             // 24h transaction count
  lastUpdate: number;             // Last update timestamp
}

/**
 * Extend StreamingMetrics for DEX-specific tracking
 */
export interface DexStreamMetrics extends StreamingMetrics {
  pairs_detected: number;         // New pairs found
  candles_received: number;       // OHLCV updates received
  price_updates_per_sec: number;  // Real-time update rate
  last_pair_timestamp: number;    // Latest pair detection time
  last_candle_timestamp: number;  // Latest OHLCV update time
}

/**
 * WebSocket message types for DEX streaming
 */
export interface NewPairMessage {
  type: 'new_pair';
  data: {
    pairAddress: string;
    poolAddress: string;
    token0: {
      address: string;
      symbol: string;
      name: string;
      decimals: number;
    };
    token1: {
      address: string;
      symbol: string;
      name: string;
      decimals: number;
    };
    dexName: string;
    blockNumber: number;
    timestamp: number;
  };
  metadata: {
    latency: number;  // ms from block creation to delivery
    provider: string;
  };
}

export interface OHLCVMessage {
  type: 'ohlcv_update';
  data: {
    pairAddress: string;
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    volumeUSD: number;
    txCount: number;
  };
  metadata: {
    latency: number;
    provider: string;
  };
}

export interface PriceFeedMessage {
  type: 'price_update';
  data: {
    pairAddress: string;
    price: number;
    priceUSD: number;
    volume24h: number;
    volume24hUSD: number;
    priceChange24h: number;
    liquidity: number;
    liquidityUSD: number;
    txCount24h: number;
    timestamp: number;
  };
  metadata: {
    latency: number;
    provider: string;
  };
}

export type DexStreamMessage = NewPairMessage | OHLCVMessage | PriceFeedMessage;
