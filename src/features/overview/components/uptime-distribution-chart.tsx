'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell } from 'recharts';
import { useMemo } from 'react';

interface Provider {
    id: string;
    name: string;
    slug: string;
    current_metrics: {
        uptime_percent: number;
    };
}

interface UptimeDistributionChartProps {
    providers: Provider[];
}

export function UptimeDistributionChart({ providers }: UptimeDistributionChartProps) {
    const { chartData, chartConfig, avgUptime } = useMemo(() => {
        if (!providers || providers.length === 0) {
            return { chartData: [], chartConfig: {}, avgUptime: 0 };
        }

        const data = providers.map((provider) => ({
            name: provider.name,
            value: provider.current_metrics.uptime_percent,
            slug: provider.slug
        }));

        const colors = [
            'var(--chart-1)', // Orange
            'var(--chart-2)', // Purple
            'var(--chart-3)', // Light
            'var(--chart-4)', // Accent
            'var(--chart-5)', // Another Orange
            'hsl(217, 91%, 60%)',  // Blue
            'hsl(142, 71%, 45%)',  // Green
            'hsl(340, 75%, 55%)'   // Pink
        ];

        const config: any = {};
        providers.forEach((provider, index) => {
            config[provider.slug] = {
                label: provider.name,
                color: colors[index % colors.length]
            };
        });

        const avg = data.reduce((sum, p) => sum + p.value, 0) / data.length;

        return { chartData: data, chartConfig: config, avgUptime: avg.toFixed(1) };
    }, [providers]);

    if (!providers || providers.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Uptime Distribution</CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <PieChart>
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    formatter={(value) => `${Number(value).toFixed(2)}%`}
                                />
                            }
                        />
                        <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={2}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={chartConfig[entry.slug]?.color} />
                            ))}
                        </Pie>
                    </PieChart>
                </ChartContainer>

                {/* Custom Compact Legend */}
                <div className="mt-4 flex flex-wrap justify-center gap-2 px-4">
                    {chartData.map((entry, index) => (
                        <div key={entry.slug} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <div
                                className="h-2 w-2 rounded-full shrink-0"
                                style={{ backgroundColor: chartConfig[entry.slug]?.color }}
                            />
                            <span className="truncate max-w-[120px]">{entry.name}</span>
                        </div>
                    ))}
                </div>

                <div className="mt-6 text-center">
                    <div className="text-2xl font-bold text-primary">{avgUptime}%</div>
                    <div className="text-xs text-muted-foreground">Average Uptime</div>
                </div>
            </CardContent>
        </Card>
    );
}
