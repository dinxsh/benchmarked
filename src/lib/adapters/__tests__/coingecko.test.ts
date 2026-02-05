import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CoinGeckoAdapter } from '../coingecko';
import { TokenPriceBenchmarkMode } from '../../benchmark-types';

global.fetch = vi.fn();

describe('CoinGeckoAdapter', () => {
    let adapter: CoinGeckoAdapter;

    beforeEach(() => {
        adapter = new CoinGeckoAdapter();
        vi.clearAllMocks();
    });

    describe('getTokenPrice', () => {
        it('should fetch token price successfully', async () => {
            const mockResponse = {
                '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': {
                    usd: 2142.54,
                    usd_market_cap: 1000000000,
                    usd_24h_vol: 500000000,
                    usd_24h_change: 1.5
                }
            };

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const result = await adapter.getTokenPrice({
                tokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                network: 'eth-mainnet',
                mode: TokenPriceBenchmarkMode.FULL_DATA
            });

            expect(result.price).toBe(2142.54);
            expect(result.priceUSD).toBe('2142.54');
            expect(result.additionalData?.marketCap).toBeDefined();
            expect(result.additionalData?.volume24h).toBeDefined();
        });

        it('should map networks to platforms correctly', async () => {
            const mockResponse = {
                '0xtoken': {
                    usd: 1.00
                }
            };

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            await adapter.getTokenPrice({
                tokenAddress: '0xtoken',
                network: 'polygon-mainnet',
                mode: TokenPriceBenchmarkMode.PRICE_ONLY
            });

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/simple/token_price/polygon-pos'),
                expect.any(Object)
            );
        });

        it('should work without API key', async () => {
            delete process.env.COINGECKO_API_KEY;

            const mockResponse = {
                '0xtoken': {
                    usd: 100.00
                }
            };

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const result = await adapter.getTokenPrice({
                tokenAddress: '0xtoken',
                network: 'eth-mainnet',
                mode: TokenPriceBenchmarkMode.PRICE_ONLY
            });

            expect(result.price).toBe(100.00);
        });

        it('should include API key when available', async () => {
            process.env.COINGECKO_API_KEY = 'test-cg-key';

            const mockResponse = {
                '0xtoken': {
                    usd: 100.00
                }
            };

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            await adapter.getTokenPrice({
                tokenAddress: '0xtoken',
                network: 'eth-mainnet',
                mode: TokenPriceBenchmarkMode.PRICE_ONLY
            });

            expect(global.fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'x-cg-pro-api-key': 'test-cg-key'
                    })
                })
            );

            delete process.env.COINGECKO_API_KEY;
        });

        it('should handle missing token data', async () => {
            const mockResponse = {};

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            await expect(adapter.getTokenPrice({
                tokenAddress: '0xInvalidToken',
                network: 'eth-mainnet',
                mode: TokenPriceBenchmarkMode.PRICE_ONLY
            })).rejects.toThrow('No price data');
        });

        it('should handle HTTP errors', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: false,
                status: 429
            });

            await expect(adapter.getTokenPrice({
                tokenAddress: '0xtoken',
                network: 'eth-mainnet',
                mode: TokenPriceBenchmarkMode.PRICE_ONLY
            })).rejects.toThrow('HTTP 429');
        });

        it('should handle case-insensitive token address lookup', async () => {
            const mockResponse = {
                '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': {
                    usd: 2142.54
                }
            };

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const result = await adapter.getTokenPrice({
                tokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // Mixed case
                network: 'eth-mainnet',
                mode: TokenPriceBenchmarkMode.PRICE_ONLY
            });

            expect(result.price).toBe(2142.54);
        });
    });
});
