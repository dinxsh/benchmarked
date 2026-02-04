'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { IconBolt, IconFileZip, IconTrendingDown, IconTrendingUp } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { formatDecimal } from '@/lib/utils';

interface Provider {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
    rank: number;
    current_metrics: {
        latency_p50: number;
        response_size_bytes?: number;
    };
}

interface RankingCardsProps {
    providers: Provider[];
    onFilterClick: (filter: 'fastest' | 'slowest' | 'smallest' | 'biggest') => void;
    activeFilter?: string;
}

export function RankingCards({ providers, onFilterClick, activeFilter }: RankingCardsProps) {
    if (!providers || providers.length === 0) {
        return null;
    }

    // Find extremes
    const fastest = [...providers].sort((a, b) => a.current_metrics.latency_p50 - b.current_metrics.latency_p50)[0];
    const slowest = [...providers].sort((a, b) => b.current_metrics.latency_p50 - a.current_metrics.latency_p50)[0];

    const providersWithSize = providers.filter(p => p.current_metrics.response_size_bytes);
    const smallest = providersWithSize.length > 0
        ? [...providersWithSize].sort((a, b) => (a.current_metrics.response_size_bytes || 0) - (b.current_metrics.response_size_bytes || 0))[0]
        : providers[0]; // Fallback to first provider if no size data
    const biggest = providersWithSize.length > 0
        ? [...providersWithSize].sort((a, b) => (b.current_metrics.response_size_bytes || 0) - (a.current_metrics.response_size_bytes || 0))[0]
        : providers[0]; // Fallback to first provider if no size data

    const RankCard = ({
        title,
        icon: Icon,
        provider,
        metric,
        color,
        filterKey,
        iconColor,
        noData
    }: {
        title: string;
        icon: any;
        provider: Provider;
        metric: string;
        color: string;
        filterKey: 'fastest' | 'slowest' | 'smallest' | 'biggest';
        iconColor: string;
        noData?: boolean;
    }) => {
        const isActive = activeFilter === filterKey;

        return (
            <Card
                className={`cursor-pointer transition-all ${isActive ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'} ${noData ? 'opacity-60' : ''}`}
                onClick={() => !noData && onFilterClick(filterKey)}
            >
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">{title}</CardTitle>
                        <Icon className={`h-5 w-5 ${iconColor}`} />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={provider.logo_url} alt={provider.name} />
                            <AvatarFallback>{provider.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold truncate">{provider.name}</div>
                            <div className="text-sm text-muted-foreground">
                                {noData ? 'No data available' : metric}
                            </div>
                        </div>
                        <Badge variant={isActive ? "default" : "outline"} className={color}>
                            #{provider.rank}
                        </Badge>
                    </div>
                    {isActive && !noData && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full mt-3 text-xs"
                            onClick={(e) => {
                                e.stopPropagation();
                                onFilterClick(filterKey);
                            }}
                        >
                            Clear Filter
                        </Button>
                    )}
                </CardContent>
            </Card>
        );
    };

    const hasResponseSizeData = providersWithSize.length > 0;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <RankCard
                title="⚡ Fastest"
                icon={IconBolt}
                provider={fastest}
                metric={`${fastest.current_metrics.latency_p50}ms`}
                color="text-yellow-600"
                filterKey="fastest"
                iconColor="text-yellow-500"
            />
            <RankCard
                title="🐌 Slowest"
                icon={IconTrendingDown}
                provider={slowest}
                metric={`${slowest.current_metrics.latency_p50}ms`}
                color="text-red-600"
                filterKey="slowest"
                iconColor="text-red-500"
            />


            <RankCard
                title="📦 Smallest Response"
                icon={IconFileZip}
                provider={smallest}
                metric={hasResponseSizeData ? `${formatDecimal((smallest.current_metrics.response_size_bytes || 0) / 1024)} KB` : 'N/A'}
                color="text-green-600"
                filterKey="smallest"
                iconColor="text-green-500"
                noData={!hasResponseSizeData}
            />
            <RankCard
                title="📊 Biggest Response"
                icon={IconTrendingUp}
                provider={biggest}
                metric={hasResponseSizeData ? `${formatDecimal((biggest.current_metrics.response_size_bytes || 0) / 1024)} KB` : 'N/A'}
                color="text-blue-600"
                filterKey="biggest"
                iconColor="text-blue-500"
                noData={!hasResponseSizeData}
            />
        </div>
    );
}
