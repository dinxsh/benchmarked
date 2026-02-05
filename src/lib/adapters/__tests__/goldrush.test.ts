import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GoldRushAdapter } from '../goldrush';
import { TokenPriceBenchmarkMode } from '../../benchmark-types';

// Mock fetch globally
global.fetch = vi.fn();

describe('GoldRushAdapter', () => {
    let adapter: GoldRushAdapter;

    beforeEach(() => {
        adapter = new GoldRushAdapter();
        vi.clearAllMocks();
    });

    describe('getTokenPrice', () => {
        it('should fetch token price successfully', async () => {
            const mockResponse = {
                data: [{
                    prices: [{
                        price: 2147.62,
                        quote_currency: 'USD'
                    }]
                }]
            };

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const result = await adapter.getTokenPrice({
                tokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                network: 'eth-mainnet',
                mode: TokenPriceBenchmarkMode.PRICE_ONLY
            });

            expect(result.price).toBe(2147.62);
            expect(result.priceUSD).toBe('2147.62');
            expect(result.latency).toBeGreaterThan(0);
            expect(result.timestamp).toBeDefined();
        });

        it('should use correct endpoint structure', async () => {
            const mockResponse = {
                data: [{
                    prices: [{
                        price: 100.50,
                        quote_currency: 'USD'
                    }]
                }]
            };

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            await adapter.getTokenPrice({
                tokenAddress: '0xABC123',
                network: 'eth-mainnet',
                mode: TokenPriceBenchmarkMode.PRICE_ONLY
            });

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/v1/pricing/historical_by_addresses_v2/eth-mainnet/USD/0xABC123/'),
                expect.any(Object)
            );
        });

        it('should handle HTTP errors', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: false,
                status: 500
            });

            await expect(adapter.getTokenPrice({
                tokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                network: 'eth-mainnet',
                mode: TokenPriceBenchmarkMode.PRICE_ONLY
            })).rejects.toThrow();
        });

        it('should handle missing price data', async () => {
            const mockResponse = {
                data: []
            };

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            await expect(adapter.getTokenPrice({
                tokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                network: 'eth-mainnet',
                mode: TokenPriceBenchmarkMode.PRICE_ONLY
            })).rejects.toThrow('No price data');
        });

        it('should handle network timeout', async () => {
            (global.fetch as any).mockRejectedValueOnce(new Error('Network timeout'));

            await expect(adapter.getTokenPrice({
                tokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                network: 'eth-mainnet',
                mode: TokenPriceBenchmarkMode.PRICE_ONLY
            })).rejects.toThrow();
        });

        it('should include API key in headers when available', async () => {
            const originalEnv = process.env.GOLDRUSH_API_KEY;
            process.env.GOLDRUSH_API_KEY = 'test-api-key';

            const mockResponse = {
                data: [{
                    prices: [{
                        price: 2147.62,
                        quote_currency: 'USD'
                    }]
                }]
            };

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            await adapter.getTokenPrice({
                tokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                network: 'eth-mainnet',
                mode: TokenPriceBenchmarkMode.PRICE_ONLY
            });

            expect(global.fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer test-api-key'
                    })
                })
            );

            process.env.GOLDRUSH_API_KEY = originalEnv;
        });

        it('should work with different networks', async () => {
            const mockResponse = {
                data: [{
                    prices: [{
                        price: 1.00,
                        quote_currency: 'USD'
                    }]
                }]
            };

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            await adapter.getTokenPrice({
                tokenAddress: '0xUSDC',
                network: 'polygon-mainnet',
                mode: TokenPriceBenchmarkMode.PRICE_ONLY
            });

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/polygon-mainnet/'),
                expect.any(Object)
            );
        });
    });
});
