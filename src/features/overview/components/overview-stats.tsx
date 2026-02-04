'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { IconRocket, IconBolt, IconFileZip, IconTrophy } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

interface Provider {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
    rank: number;
    scores: {
        final_score: number;
    };
    current_metrics: {
        latency_p50: number;
        uptime_percent: number;
        response_size_bytes?: number;
    };
}

interface OverviewStatsProps {
    providers: Provider[];
}

export function OverviewStats({ providers }: OverviewStatsProps) {
    const router = useRouter();

    if (!providers || providers.length === 0) {
        return null;
    }

    // Find top performers
    const fastest = [...providers].sort((a, b) => a.current_metrics.latency_p50 - b.current_metrics.latency_p50)[0];
    const mostReliable = [...providers].sort((a, b) => b.current_metrics.uptime_percent - a.current_metrics.uptime_percent)[0];
    const mostEfficient = [...providers]
        .filter(p => p.current_metrics.response_size_bytes)
        .sort((a, b) => (a.current_metrics.response_size_bytes || 0) - (b.current_metrics.response_size_bytes || 0))[0];
    const bestOverall = [...providers].sort((a, b) => b.scores.final_score - a.scores.final_score)[0];

    const StatCard = ({
        title,
        icon: Icon,
        provider,
        metric,
        color
    }: {
        title: string;
        icon: any;
        provider: Provider;
        metric: string;
        color: string;
    }) => (
        <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push(`/dashboard/provider/${provider.slug}`)}
        >
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    <Icon className={`h-4 w-4 ${color}`} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={provider.logo_url} alt={provider.name} />
                        <AvatarFallback>{provider.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <div className="font-semibold">{provider.name}</div>
                        <div className="text-sm text-muted-foreground">{metric}</div>
                    </div>
                    <Badge variant="outline" className={color}>
                        #{provider.rank}
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <StatCard
                title="Fastest Provider"
                icon={IconBolt}
                provider={fastest}
                metric={`${fastest.current_metrics.latency_p50}ms latency`}
                color="text-yellow-500"
            />
            <StatCard
                title="Most Reliable"
                icon={IconRocket}
                provider={mostReliable}
                metric={`${mostReliable.current_metrics.uptime_percent}% uptime`}
                color="text-green-500"
            />
            {mostEfficient && (
                <StatCard
                    title="Most Efficient"
                    icon={IconFileZip}
                    provider={mostEfficient}
                    metric={`${((mostEfficient.current_metrics.response_size_bytes || 0) / 1024).toFixed(2)} KB`}
                    color="text-blue-500"
                />
            )}
            <StatCard
                title="Best Overall"
                icon={IconTrophy}
                provider={bestOverall}
                metric={`${bestOverall.scores.final_score} score`}
                color="text-purple-500"
            />
        </div>
    );
}
