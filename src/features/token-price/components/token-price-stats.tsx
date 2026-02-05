'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Clock, TrendingUp, CheckCircle2, AlertCircle, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TokenPriceStatsProps {
    stats: {
        avgLatency: number;
        successRate: number;
        fastestProvider: string;
        priceConsensus: number;
        medianPrice: string;
        priceVariance: string;
        minLatency: number;
        maxLatency: number;
        minPrice: string;
        maxPrice: string;
    };
    results: Array<{
        status: string;
    }>;
}

export function TokenPriceStats({ stats, results }: TokenPriceStatsProps) {
    const successCount = results.filter(r => r.status === 'success').length;
    const totalProviders = results.length;
    const errorCount = results.filter(r => r.status === 'error').length;

    const statCards = [
        {
            title: 'Median Price',
            value: `$${stats.medianPrice}`,
            description: `Range: $${stats.minPrice} - $${stats.maxPrice}`,
            icon: DollarSign,
            color: 'text-[var(--chart-1)]',
            bgColor: 'bg-[var(--chart-1)]/10',
        },
        {
            title: 'Avg Response Time',
            value: `${stats.avgLatency}ms`,
            description: `Fastest: ${stats.minLatency}ms | Slowest: ${stats.maxLatency}ms`,
            icon: Clock,
            color: 'text-[var(--chart-2)]',
            bgColor: 'bg-[var(--chart-2)]/10',
        },
        {
            title: 'Success Rate',
            value: `${stats.successRate}%`,
            description: `${successCount}/${totalProviders} providers successful`,
            icon: CheckCircle2,
            color: 'text-[var(--chart-3)]',
            bgColor: 'bg-[var(--chart-3)]/10',
        },
        {
            title: 'Price Consensus',
            value: `${stats.priceConsensus}%`,
            description: `Variance: ${parseFloat(stats.priceVariance).toFixed(4)}%`,
            icon: TrendingUp,
            color: 'text-[var(--chart-4)]',
            bgColor: 'bg-[var(--chart-4)]/10',
        },
        {
            title: 'Fastest Provider',
            value: stats.fastestProvider,
            description: `${stats.minLatency}ms response time`,
            icon: Activity,
            color: 'text-[var(--chart-5)]',
            bgColor: 'bg-[var(--chart-5)]/10',
        },
        {
            title: 'Failed Providers',
            value: errorCount.toString(),
            description: errorCount > 0 ? 'Check API keys or rate limits' : 'All providers operational',
            icon: AlertCircle,
            color: errorCount > 0 ? 'text-destructive' : 'text-muted-foreground',
            bgColor: errorCount > 0 ? 'bg-destructive/10' : 'bg-muted/10',
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {statCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <div className={cn('p-2 rounded-lg', stat.bgColor)}>
                                <Icon className={cn('h-4 w-4', stat.color)} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {stat.description}
                            </p>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
