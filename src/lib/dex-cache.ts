/**
 * DEX Data Cache Layer
 * In-memory cache optimized for high-frequency DEX data with TTL and circular buffers
 */

import { TradingPair, LivePairUpdate, OHLCVData } from './dex-types';

class DexCache {
  // Storage maps
  private pairs: Map<string, TradingPair>;           // All pairs
  private livePairUpdates: Map<string, LivePairUpdate>; // Current prices/volumes
  private ohlcvHistory: Map<string, OHLCVData[]>;    // Candle history per pair
  private newPairsQueue: TradingPair[];              // Recent new pairs (FIFO)
  private priceHistory: Map<string, { timestamp: number; price: number }[]>;
  private volumeHistory: Map<string, { timestamp: number; volume: number }[]>;

  // Configuration
  private readonly MAX_NEW_PAIRS = 100;              // Keep last 100 new pairs
  private readonly MAX_OHLCV_POINTS = 500;           // ~8 hours of 1-min candles
  private readonly PAIR_TTL = 24 * 60 * 60 * 1000;   // 24h TTL
  private readonly MAX_HISTORY_POINTS = 720;         // 12 hours of history

  constructor() {
    this.pairs = new Map();
    this.livePairUpdates = new Map();
    this.ohlcvHistory = new Map();
    this.newPairsQueue = [];
    this.priceHistory = new Map();
    this.volumeHistory = new Map();

    // Start periodic cleanup
    setInterval(() => this.cleanup(), 60 * 60 * 1000); // Cleanup every hour
  }

  /**
   * Add a newly detected trading pair
   */
  addNewPair(pair: TradingPair): void {
    // Add to pairs map
    this.pairs.set(pair.pairAddress, pair);

    // Add to new pairs queue (FIFO)
    this.newPairsQueue.unshift(pair);
    if (this.newPairsQueue.length > this.MAX_NEW_PAIRS) {
      this.newPairsQueue.pop();
    }

    // Initialize empty OHLCV history
    if (!this.ohlcvHistory.has(pair.pairAddress)) {
      this.ohlcvHistory.set(pair.pairAddress, []);
    }
  }

  /**
   * Update live data for a trading pair
   */
  updateLivePair(pairAddress: string, update: LivePairUpdate): void {
    this.livePairUpdates.set(pairAddress, update);

    // Track price history for momentum calculation
    let priceHist = this.priceHistory.get(pairAddress);
    if (!priceHist) {
      priceHist = [];
      this.priceHistory.set(pairAddress, priceHist);
    }
    priceHist.push({ timestamp: Date.now(), price: update.priceUSD });
    if (priceHist.length > this.MAX_HISTORY_POINTS) {
      priceHist.shift();
    }

    // Track volume history for momentum calculation
    let volumeHist = this.volumeHistory.get(pairAddress);
    if (!volumeHist) {
      volumeHist = [];
      this.volumeHistory.set(pairAddress, volumeHist);
    }
    volumeHist.push({ timestamp: Date.now(), volume: update.volume24hUSD });
    if (volumeHist.length > this.MAX_HISTORY_POINTS) {
      volumeHist.shift();
    }
  }

  /**
   * Add an OHLCV candle to a pair's history
   */
  addOHLCVCandle(pairAddress: string, candle: OHLCVData): void {
    let history = this.ohlcvHistory.get(pairAddress);

    if (!history) {
      history = [];
      this.ohlcvHistory.set(pairAddress, history);
    }

    // Add candle and maintain max size (circular buffer)
    history.push(candle);
    if (history.length > this.MAX_OHLCV_POINTS) {
      history.shift();
    }

    // Sort by timestamp (newest last)
    history.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get recent new pairs
   */
  getRecentNewPairs(limit: number = 20): TradingPair[] {
    return this.newPairsQueue.slice(0, limit);
  }

  /**
   * Get top pairs by volume
   */
  getTopPairsByVolume(limit: number = 20): LivePairUpdate[] {
    const pairs = Array.from(this.livePairUpdates.values());
    pairs.sort((a, b) => b.volume24hUSD - a.volume24hUSD);
    return pairs.slice(0, limit);
  }

  /**
   * Get top pairs by liquidity
   */
  getTopPairsByLiquidity(limit: number = 20): LivePairUpdate[] {
    const pairs = Array.from(this.livePairUpdates.values());
    pairs.sort((a, b) => b.liquidityUSD - a.liquidityUSD);
    return pairs.slice(0, limit);
  }

  /**
   * Get OHLCV history for a pair
   */
  getOHLCVHistory(pairAddress: string, points?: number): OHLCVData[] {
    const history = this.ohlcvHistory.get(pairAddress) || [];
    if (points && points < history.length) {
      return history.slice(-points);
    }
    return history;
  }

  /**
   * Get a specific trading pair
   */
  getPair(pairAddress: string): TradingPair | undefined {
    return this.pairs.get(pairAddress);
  }

  /**
   * Get a live pair update
   */
  getLivePairUpdate(pairAddress: string): LivePairUpdate | undefined {
    return this.livePairUpdates.get(pairAddress);
  }

  /**
   * Get all tracked pairs
   */
  getAllPairs(): TradingPair[] {
    return Array.from(this.pairs.values());
  }

  /**
   * Get all live pair updates
   */
  getAllLivePairUpdates(): LivePairUpdate[] {
    return Array.from(this.livePairUpdates.values());
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      totalPairs: this.pairs.size,
      liveUpdates: this.livePairUpdates.size,
      newPairsQueued: this.newPairsQueue.length,
      pairsWithOHLCV: this.ohlcvHistory.size,
      totalOHLCVPoints: Array.from(this.ohlcvHistory.values()).reduce(
        (sum, history) => sum + history.length,
        0
      ),
    };
  }

  /**
   * Cleanup expired data
   */
  cleanup(): void {
    const now = Date.now();
    const expiredPairs: string[] = [];

    // Find expired pairs
    Array.from(this.pairs.entries()).forEach(([address, pair]) => {
      if (now - pair.createdAt > this.PAIR_TTL) {
        expiredPairs.push(address);
      }
    });

    // Remove expired pairs
    expiredPairs.forEach((address) => {
      this.pairs.delete(address);
      this.livePairUpdates.delete(address);
      this.ohlcvHistory.delete(address);
    });

    console.log(`[DexCache] Cleaned up ${expiredPairs.length} expired pairs`);
  }

  /**
   * Clear all data (useful for testing)
   */
  clear(): void {
    this.pairs.clear();
    this.livePairUpdates.clear();
    this.ohlcvHistory.clear();
    this.newPairsQueue = [];
    this.priceHistory.clear();
    this.volumeHistory.clear();
  }

  /**
   * Calculate volume momentum (% change over time period)
   */
  getVolumeMomentum(pairAddress: string, timeWindowMs: number = 3600000): number {
    const history = this.volumeHistory.get(pairAddress) || [];
    if (history.length < 2) return 0;

    const now = Date.now();
    const recent = history.filter(h => h.timestamp > now - timeWindowMs);
    if (recent.length < 2) return 0;

    const oldestVolume = recent[0].volume;
    const latestVolume = recent[recent.length - 1].volume;

    if (oldestVolume === 0) return 0;
    return ((latestVolume - oldestVolume) / oldestVolume) * 100;
  }

  /**
   * Calculate price momentum (% change over time period)
   */
  getPriceMomentum(pairAddress: string, timeWindowMs: number = 3600000): number {
    const history = this.priceHistory.get(pairAddress) || [];
    if (history.length < 2) return 0;

    const now = Date.now();
    const recent = history.filter(h => h.timestamp > now - timeWindowMs);
    if (recent.length < 2) return 0;

    const oldestPrice = recent[0].price;
    const latestPrice = recent[recent.length - 1].price;

    if (oldestPrice === 0) return 0;
    return ((latestPrice - oldestPrice) / oldestPrice) * 100;
  }

  /**
   * Get pairs with highest volume momentum
   */
  getTopMomentumPairs(limit: number = 20, timeWindowMs: number = 3600000): Array<{
    pair: TradingPair;
    liveUpdate?: LivePairUpdate;
    momentum: number;
    priceMomentum: number;
  }> {
    const pairs = Array.from(this.pairs.values())
      .map(pair => ({
        pair,
        liveUpdate: this.livePairUpdates.get(pair.pairAddress),
        momentum: this.getVolumeMomentum(pair.pairAddress, timeWindowMs),
        priceMomentum: this.getPriceMomentum(pair.pairAddress, timeWindowMs)
      }))
      .filter(p => p.momentum > 0)
      .sort((a, b) => b.momentum - a.momentum)
      .slice(0, limit);

    return pairs;
  }

  /**
   * Detect volume spikes (volume > 2x average)
   */
  detectVolumeSpikes(): Array<{
    pair: TradingPair;
    liveUpdate?: LivePairUpdate;
    currentVolume: number;
    averageVolume: number;
    spikeMultiplier: number;
  }> {
    const spikes: any[] = [];

    this.volumeHistory.forEach((history, pairAddress) => {
      if (history.length < 10) return;

      const recent = history.slice(-10);
      const average = recent.slice(0, 9).reduce((sum, h) => sum + h.volume, 0) / 9;
      const current = recent[9].volume;

      if (average === 0) return;
      const multiplier = current / average;

      if (multiplier > 2.0) {
        const pair = this.pairs.get(pairAddress);
        if (pair) {
          spikes.push({
            pair,
            liveUpdate: this.livePairUpdates.get(pairAddress),
            currentVolume: current,
            averageVolume: average,
            spikeMultiplier: multiplier
          });
        }
      }
    });

    return spikes.sort((a, b) => b.spikeMultiplier - a.spikeMultiplier);
  }

  /**
   * Get top price gainers/losers
   */
  getTopGainers(limit: number = 20, timeframe: '1h' | '24h' = '24h'): Array<{
    pair: TradingPair;
    liveUpdate: LivePairUpdate;
    priceChange: number;
  }> {
    const timeWindowMs = timeframe === '1h' ? 3600000 : 86400000;

    const allPairs = Array.from(this.pairs.values())
      .map(pair => {
        const liveUpdate = this.livePairUpdates.get(pair.pairAddress);
        if (!liveUpdate) return null;

        const priceChange = timeframe === '24h'
          ? liveUpdate.priceChange24h
          : this.getPriceMomentum(pair.pairAddress, timeWindowMs);

        return { pair, liveUpdate, priceChange };
      })
      .filter((p): p is { pair: TradingPair; liveUpdate: LivePairUpdate; priceChange: number } =>
        p !== null && p.priceChange > 0
      )
      .sort((a, b) => b.priceChange - a.priceChange)
      .slice(0, limit);

    return allPairs;
  }

  /**
   * Get top price losers
   */
  getTopLosers(limit: number = 20, timeframe: '1h' | '24h' = '24h'): Array<{
    pair: TradingPair;
    liveUpdate: LivePairUpdate;
    priceChange: number;
  }> {
    const timeWindowMs = timeframe === '1h' ? 3600000 : 86400000;

    const allPairs = Array.from(this.pairs.values())
      .map(pair => {
        const liveUpdate = this.livePairUpdates.get(pair.pairAddress);
        if (!liveUpdate) return null;

        const priceChange = timeframe === '24h'
          ? liveUpdate.priceChange24h
          : this.getPriceMomentum(pair.pairAddress, timeWindowMs);

        return { pair, liveUpdate, priceChange };
      })
      .filter((p): p is { pair: TradingPair; liveUpdate: LivePairUpdate; priceChange: number } =>
        p !== null && p.priceChange < 0
      )
      .sort((a, b) => a.priceChange - b.priceChange)
      .slice(0, limit);

    return allPairs;
  }

  /**
   * Calculate composite gem score (0-100)
   */
  calculateGemScore(pairAddress: string): number {
    const pair = this.pairs.get(pairAddress);
    const liveUpdate = this.livePairUpdates.get(pairAddress);

    if (!pair || !liveUpdate) return 0;

    // Factors (weighted)
    const volumeMomentum = this.getVolumeMomentum(pairAddress, 3600000); // 1h window
    const priceChange = Math.abs(liveUpdate.priceChange24h);

    // Calculate liquidity growth (simplified - using current vs 1h ago)
    const volumeHist = this.volumeHistory.get(pairAddress) || [];
    const liquidityGrowth = volumeHist.length > 10 ?
      ((volumeHist[volumeHist.length - 1].volume - volumeHist[0].volume) / volumeHist[0].volume) * 100 : 0;

    // Normalize to 0-100
    const momentumScore = Math.min((volumeMomentum / 500) * 100, 100); // 500% = max
    const priceScore = Math.min((priceChange / 200) * 100, 100); // 200% = max
    const liquidityScore = Math.min((Math.abs(liquidityGrowth) / 300) * 100, 100); // 300% = max

    // Weighted average
    const score =
      momentumScore * 0.40 +
      priceScore * 0.35 +
      liquidityScore * 0.25;

    return Math.round(score);
  }
}

// Export singleton instance
export const dexCache = new DexCache();
