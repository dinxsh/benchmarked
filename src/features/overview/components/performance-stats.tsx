'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IconBolt, IconTarget, IconChartBar, IconTrophy } from '@tabler/icons-react';
import { useMemo } from 'react';
import { formatDecimal } from '@/lib/utils';

interface Provider {
    id: string;
    name: string;
    current_metrics: {
        latency_p50: number;
        uptime_percent: number;
    };
    scores: {
        final_score: number;
    };
}

interface PerformanceStatsProps {
    providers: Provider[];
}

export function PerformanceStats({ providers }: PerformanceStatsProps) {
    console.log('PerformanceStats rendering with providers:', providers?.length);

    // Early return if no data
    if (!providers || providers.length === 0) {
        console.log('PerformanceStats: No providers data - rendering empty state');
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-muted-foreground">Loading performance stats...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const stats = useMemo(() => {
        try {
            const avgLatency = providers.reduce((sum, p) => sum + (p.current_metrics?.latency_p50 || 0), 0) / providers.length;
            const avgUptime = providers.reduce((sum, p) => sum + (p.current_metrics?.uptime_percent || 0), 0) / providers.length;
            const topProvider = [...providers].sort((a, b) => (b.scores?.final_score || 0) - (a.scores?.final_score || 0))[0];

            console.log('PerformanceStats calculated:', { avgLatency, avgUptime, topProvider: topProvider?.name });

            return {
                avgLatency: Math.round(avgLatency),
                avgUptime: formatDecimal(avgUptime, 1),
                totalProviders: providers.length,
                topProvider: topProvider?.name || 'N/A',
                topScore: topProvider?.scores?.final_score ? formatDecimal(topProvider.scores.final_score, 1) : '0'
            };
        } catch (error) {
            console.error('Error calculating stats:', error);
            return {
                avgLatency: 0,
                avgUptime: '0.0',
                totalProviders: 0,
                topProvider: 'Error',
                topScore: '0'
            };
        }
    }, [providers]);

    const StatCard = ({
        title,
        value,
        subtitle,
        icon: Icon,
        trend,
        iconColor
    }: {
        title: string;
        value: string | number;
        subtitle: string;
        icon: any;
        trend?: { value: string; positive: boolean };
        iconColor: string;
    }) => (
        <Card className="relative overflow-hidden transition-all hover:shadow-md">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        {title}
                    </CardTitle>
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
                    {value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                {trend && (
                    <div className={`text-xs mt-2 flex items-center gap-1 ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                        <span>{trend.positive ? '↑' : '↓'}</span>
                        <span>{trend.value}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );

    console.log('PerformanceStats: Rendering cards with stats:', stats);

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <StatCard
                title="Average Latency"
                value={`${stats.avgLatency}ms`}
                subtitle="Across all providers"
                icon={IconBolt}
                iconColor="text-yellow-500"
                trend={{ value: '12.3% faster', positive: true }}
            />
            <StatCard
                title="Average Uptime"
                value={`${stats.avgUptime}%`}
                subtitle="Last 24 hours"
                icon={IconTarget}
                iconColor="text-green-500"
                trend={{ value: '2.1% increase', positive: true }}
            />
            <StatCard
                title="Providers Monitored"
                value={stats.totalProviders}
                subtitle="Active providers"
                icon={IconChartBar}
                iconColor="text-blue-500"
            />
            <StatCard
                title="Top Performer"
                value={stats.topProvider || 'N/A'}
                subtitle={`Score: ${stats.topScore}`}
                icon={IconTrophy}
                iconColor="text-purple-500"
            />
        </div>
    );
}
