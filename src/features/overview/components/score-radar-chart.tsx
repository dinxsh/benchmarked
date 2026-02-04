'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useMemo } from 'react';

interface Provider {
    id: string;
    name: string;
    slug: string;
    scores: {
        final_score: number;
        latency_score: number;
        reliability_score: number;
        response_size_score: number;
        coverage_score: number;
        dx_score: number;
        pricing_score: number;
    };
}

interface ScoreRadarChartProps {
    providers: Provider[];
}

export function ScoreRadarChart({ providers }: ScoreRadarChartProps) {
    const [selectedProviderId, setSelectedProviderId] = useState<string>('average');

    const { chartData, chartConfig } = useMemo(() => {
        if (!providers || providers.length === 0) {
            return { chartData: [], chartConfig: {} as ChartConfig };
        }

        // Define score categories
        const categories = [
            { key: 'latency_score', label: 'Latency' },
            { key: 'reliability_score', label: 'Reliability' },
            { key: 'response_size_score', label: 'Response Size' },
            { key: 'coverage_score', label: 'Coverage' },
            { key: 'dx_score', label: 'DX' },
            { key: 'pricing_score', label: 'Pricing' }
        ];

        let scoresToUse: Record<string, number> = {};

        if (selectedProviderId === 'average') {
            // Take top 3 providers by final score for average
            const topProviders = [...providers]
                .sort((a, b) => b.scores.final_score - a.scores.final_score)
                .slice(0, 3);

            // Average scores across top providers
            scoresToUse = categories.reduce((acc, category) => {
                const sum = topProviders.reduce((s, p) => s + (p.scores[category.key as keyof typeof p.scores] || 0), 0);
                acc[category.key] = Math.round(sum / topProviders.length);
                return acc;
            }, {} as Record<string, number>);
        } else {
            // Find specific provider
            const provider = providers.find(p => p.id === selectedProviderId);
            if (provider) {
                scoresToUse = provider.scores;
            }
        }

        const data = categories.map((category) => ({
            category: category.label,
            score: scoresToUse[category.key] || 0
        }));

        // Create chart config
        const config = {
            score: {
                label: selectedProviderId === 'average' ? 'Average Score' : (providers.find(p => p.id === selectedProviderId)?.name || 'Score'),
                color: 'var(--chart-1)'
            }
        } satisfies ChartConfig;

        return { chartData: data, chartConfig: config };
    }, [providers, selectedProviderId]);

    if (!providers || providers.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">Score Breakdown</CardTitle>
                <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
                    <SelectTrigger className="h-8 w-[140px] text-xs">
                        <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="average">Top 3 Average</SelectItem>
                        {providers.map((provider) => (
                            <SelectItem key={provider.id} value={provider.id}>
                                {provider.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent className="pt-4">
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <RadarChart data={chartData}>
                        <PolarGrid className="stroke-muted" />
                        <PolarAngleAxis
                            dataKey="category"
                            tick={{ fill: 'var(--foreground)', fontSize: 13, fontWeight: 500 }}
                        />
                        <PolarRadiusAxis
                            angle={90}
                            domain={[0, 100]}
                            tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Radar
                            name={chartConfig.score?.label || 'Score'}
                            dataKey='score'
                            stroke={chartConfig.score?.color}
                            fill={chartConfig.score?.color}
                            fillOpacity={0.2}
                            strokeWidth={2}
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                    </RadarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
