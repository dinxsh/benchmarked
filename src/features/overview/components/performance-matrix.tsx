'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemo } from 'react';
import { formatDecimal } from '@/lib/utils';

interface Provider {
    id: string;
    name: string;
    current_metrics: {
        latency_p50: number;
        uptime_percent: number;
        response_size_bytes?: number;
    };
    scores: {
        reliability_score: number;
        coverage_score: number;
        pricing_score: number;
    };
    metadata?: {
        pricing?: {
            cost_per_million?: number;
        };
    };
}

interface PerformanceMatrixProps {
    providers: Provider[];
}

export function PerformanceMatrix({ providers }: PerformanceMatrixProps) {
    const metrics = useMemo(() => {
        if (!providers || providers.length === 0) {
            return [];
        }

        const fastest = [...providers].sort((a, b) => a.current_metrics.latency_p50 - b.current_metrics.latency_p50)[0];
        const slowest = [...providers].sort((a, b) => b.current_metrics.latency_p50 - a.current_metrics.latency_p50)[0];
        const bestUptime = [...providers].sort((a, b) => b.current_metrics.uptime_percent - a.current_metrics.uptime_percent)[0];

        const providersWithSize = providers.filter(p => (p.current_metrics.response_size_bytes || 0) > 0);
        const smallest = providersWithSize.length > 0
            ? [...providersWithSize].sort((a, b) => (a.current_metrics.response_size_bytes || 0) - (b.current_metrics.response_size_bytes || 0))[0]
            : null;
        const largest = providersWithSize.length > 0
            ? [...providersWithSize].sort((a, b) => (b.current_metrics.response_size_bytes || 0) - (a.current_metrics.response_size_bytes || 0))[0]
            : null;

        const mostReliable = [...providers].sort((a, b) => b.scores.reliability_score - a.scores.reliability_score)[0];
        const mostFeatures = [...providers].sort((a, b) => b.scores.coverage_score - a.scores.coverage_score)[0];
        const bestPricing = [...providers].sort((a, b) => b.scores.pricing_score - a.scores.pricing_score)[0];

        return [
            {
                label: 'Fastest',
                value: `${fastest.current_metrics.latency_p50}ms`,
                provider: fastest.name,
                color: 'text-emerald-500' // Success
            },
            {
                label: 'Slowest',
                value: `${slowest.current_metrics.latency_p50}ms`,
                provider: slowest.name,
                color: 'text-rose-500' // Error
            },
            {
                label: 'Best Uptime',
                value: `${formatDecimal(bestUptime.current_metrics.uptime_percent, 2)}%`,
                provider: bestUptime.name,
                color: 'text-emerald-500' // Success
            },
            {
                label: 'Smallest Response',
                value: smallest
                    ? (smallest.current_metrics.response_size_bytes || 0) < 1024
                        ? `${smallest.current_metrics.response_size_bytes} B`
                        : `${formatDecimal((smallest.current_metrics.response_size_bytes || 0) / 1024, 1)} KB`
                    : 'N/A',
                provider: smallest?.name || 'N/A',
                color: 'text-blue-500' // Info/Neutral
            },
            {
                label: 'Largest Response',
                value: largest
                    ? (largest.current_metrics.response_size_bytes || 0) < 1024
                        ? `${largest.current_metrics.response_size_bytes} B`
                        : `${formatDecimal((largest.current_metrics.response_size_bytes || 0) / 1024, 1)} KB`
                    : 'N/A',
                provider: largest?.name || 'N/A',
                color: 'text-amber-500' // Warning
            },
            {
                label: 'Most Reliable',
                value: `${formatDecimal(mostReliable.scores.reliability_score, 1)}`,
                provider: mostReliable.name,
                color: 'text-emerald-500' // Success
            },
            {
                label: 'Best Value',
                value: `${formatDecimal(bestPricing.scores.pricing_score, 1)}`,
                provider: bestPricing.name,
                color: 'text-emerald-500' // Success
            },
            {
                label: 'Most Features',
                value: `${formatDecimal(mostFeatures.scores.coverage_score, 1)}`,
                provider: mostFeatures.name,
                color: 'text-indigo-500' // Feature/Special
            }
        ];
    }, [providers]);

    if (!providers || providers.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Performance Matrix</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {metrics.map((metric, index) => (
                        <div
                            key={index}
                            className="group relative overflow-hidden rounded-lg border bg-card p-4 transition-all hover:border-primary hover:shadow-md"
                        >
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                                {metric.label}
                            </div>
                            <div className={`text-2xl font-bold ${metric.color} mb-1`}>
                                {metric.value}
                            </div>
                            <div className="text-xs text-muted-foreground truncate" title={metric.provider}>
                                {metric.provider}
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
