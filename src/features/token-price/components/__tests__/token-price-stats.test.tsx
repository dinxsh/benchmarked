import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TokenPriceStats } from '../token-price-stats';

describe('TokenPriceStats', () => {
    const mockStats = {
        avgLatency: 500,
        successRate: 40,
        fastestProvider: 'CoinGecko',
        priceConsensus: 96,
        medianPrice: '2129.40',
        priceVariance: '0.7345',
        minLatency: 339,
        maxLatency: 1033,
        minPrice: '2116.26',
        maxPrice: '2142.54'
    };

    const mockResults = [
        { status: 'success' },
        { status: 'success' },
        { status: 'error' },
        { status: 'error' },
        { status: 'unavailable' }
    ];

    it('should render all 6 stat cards', () => {
        render(<TokenPriceStats stats={mockStats} results={mockResults as any} />);

        expect(screen.getByText('Median Price')).toBeInTheDocument();
        expect(screen.getByText('Avg Response Time')).toBeInTheDocument();
        expect(screen.getByText('Success Rate')).toBeInTheDocument();
        expect(screen.getByText('Price Consensus')).toBeInTheDocument();
        expect(screen.getByText('Fastest Provider')).toBeInTheDocument();
        expect(screen.getByText('Failed Providers')).toBeInTheDocument();
    });

    it('should display correct median price', () => {
        render(<TokenPriceStats stats={mockStats} results={mockResults as any} />);

        expect(screen.getByText('$2129.40')).toBeInTheDocument();
    });

    it('should display correct average latency', () => {
        render(<TokenPriceStats stats={mockStats} results={mockResults as any} />);

        expect(screen.getByText('500ms')).toBeInTheDocument();
    });

    it('should display correct success rate', () => {
        render(<TokenPriceStats stats={mockStats} results={mockResults as any} />);

        expect(screen.getByText('40%')).toBeInTheDocument();
    });

    it('should display fastest provider name', () => {
        render(<TokenPriceStats stats={mockStats} results={mockResults as any} />);

        expect(screen.getByText('CoinGecko')).toBeInTheDocument();
    });

    it('should calculate failed providers correctly', () => {
        render(<TokenPriceStats stats={mockStats} results={mockResults as any} />);

        // 2 errors out of 5 total
        expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should show price range in description', () => {
        render(<TokenPriceStats stats={mockStats} results={mockResults as any} />);

        expect(screen.getByText(/Range: \$2116\.26 - \$2142\.54/)).toBeInTheDocument();
    });

    it('should show latency range in description', () => {
        render(<TokenPriceStats stats={mockStats} results={mockResults as any} />);

        expect(screen.getByText(/Fastest: 339ms \| Slowest: 1033ms/)).toBeInTheDocument();
    });
});
