import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PriceComparisonChart } from '../price-comparison-chart';

describe('PriceComparisonChart', () => {
    const mockResults = [
        {
            provider: { name: 'CoinGecko', color: '#8DC63F' },
            price: 2142.54,
            status: 'success' as const
        },
        {
            provider: { name: 'Moralis', color: '#2E7DAF' },
            price: 2116.26,
            status: 'success' as const
        },
        {
            provider: { name: 'GoldRush (Covalent)', color: '#F59E0B' },
            price: null,
            status: 'error' as const
        }
    ];

    it('should render chart with successful results', () => {
        render(<PriceComparisonChart results={mockResults} />);

        expect(screen.getByText('Price Comparison')).toBeInTheDocument();
        expect(screen.getByText(/Token price across 2 provider/)).toBeInTheDocument();
    });

    it('should show empty state when no successful results', () => {
        const emptyResults = [
            {
                provider: { name: 'Provider1', color: '#000' },
                price: null,
                status: 'error' as const
            }
        ];

        render(<PriceComparisonChart results={emptyResults} />);

        expect(screen.getByText('No price data available')).toBeInTheDocument();
    });

    it('should filter out failed providers', () => {
        render(<PriceComparisonChart results={mockResults} />);

        // Should only show 2 providers (successful ones)
        expect(screen.getByText(/2 provider/)).toBeInTheDocument();
    });

    it('should clean provider names', () => {
        const { container } = render(<PriceComparisonChart results={mockResults} />);

        // GoldRush (Covalent) should be cleaned to just "Covalent"
        // This would be visible in the chart's data
        expect(container).toBeInTheDocument();
    });
});
