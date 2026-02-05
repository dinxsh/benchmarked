import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MoralisAdapter } from '../moralis';
import { TokenPriceBenchmarkMode } from '../../benchmark-types';

global.fetch = vi.fn();

describe('MoralisAdapter', () => {
    let adapter: MoralisAdapter;

    beforeEach(() => {
        adapter = new MoralisAdapter();
        vi.clearAllMocks();
        // Set API key for tests
        process.env.MORALIS_API_KEY = 'test-moralis-key';
    });

    describe('getTokenPrice', () => {
        it('should fetch token price successfully', async () => {
            const mockResponse = {
                usdPrice: 2116.26,
                tokenSymbol: 'WETH',
                tokenName: 'Wrapped Ether',
                '24hrPercentChange': '1.5'
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

            expect(result.price).toBe(2116.26);
            expect(result.priceUSD).toBe('2116.26');
            expect(result.additionalData?.symbol).toBe('WETH');
            expect(result.additionalData?.name).toBe('Wrapped Ether');
        });

        it('should require API key', async () => {
            delete process.env.MORALIS_API_KEY;

            await expect(adapter.getTokenPrice({
                tokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                network: 'eth-mainnet',
                mode: TokenPriceBenchmarkMode.PRICE_ONLY
            })).rejects.toThrow('Moralis API Key required');

            process.env.MORALIS_API_KEY = 'test-moralis-key';
        });

        it('should use correct v2.2 endpoint', async () => {
            const mockResponse = {
                usdPrice: 100.50
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
                expect.stringContaining('/api/v2.2/erc20/0xABC123/price?chain=eth'),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'X-API-Key': 'test-moralis-key'
                    })
                })
            );
        });

        it('should handle HTTP errors with detailed message', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: false,
                status: 401,
                text: async () => 'Unauthorized'
            });

            await expect(adapter.getTokenPrice({
                tokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                network: 'eth-mainnet',
                mode: TokenPriceBenchmarkMode.PRICE_ONLY
            })).rejects.toThrow('HTTP 401');
        });

        it('should handle invalid price data', async () => {
            const mockResponse = {
                usdPrice: null
            };

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            await expect(adapter.getTokenPrice({
                tokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                network: 'eth-mainnet',
                mode: TokenPriceBenchmarkMode.PRICE_ONLY
            })).rejects.toThrow('No valid price data');
        });

        it('should map network names correctly', async () => {
            const mockResponse = {
                usdPrice: 1.00
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
                expect.stringContaining('chain=polygon'),
                expect.any(Object)
            );
        });

        it('should only include additional data in FULL_DATA mode', async () => {
            const mockResponse = {
                usdPrice: 2116.26,
                tokenSymbol: 'WETH',
                tokenName: 'Wrapped Ether'
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

            expect(result.additionalData).toBeUndefined();
        });
    });
});
