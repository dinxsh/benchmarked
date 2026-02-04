'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useMemo } from 'react';

interface Provider {
    id: string;
    name: string;
    slug: string;
    current_metrics: {
        response_size_bytes?: number;
    };
}

interface ResponseSizeChartProps {
    providers: Provider[];
}

export function ResponseSizeChart({ providers }: ResponseSizeChartProps) {
    const { chartData, chartConfig } = useMemo(() => {
        if (!providers || providers.length === 0) {
            return { chartData: [], chartConfig: {} };
        }

        // Filter providers with response size data and sort by size
        const providersWithSize = providers
            .filter((p) => p.current_metrics.response_size_bytes)
            .sort((a, b) => (a.current_metrics.response_size_bytes || 0) - (b.current_metrics.response_size_bytes || 0));

        const data = providersWithSize.map((provider) => ({
            name: provider.name,
            response_size: ((provider.current_metrics.response_size_bytes || 0) / 1024).toFixed(2), // Changed key to response_size
            sizeBytes: provider.current_metrics.response_size_bytes || 0,
            slug: provider.slug
        }));

        const config = {
            response_size: {
                label: 'Response Size',
                color: 'var(--chart-1)'
            }
        } satisfies ChartConfig;

        return { chartData: data, chartConfig: config };
    }, [providers]);

    if (chartData.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Response Size Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                        No response size data available
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Response Size Comparison</CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                            dataKey="name"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => `${value} KB`}
                            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                        />
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    formatter={(value) => `${value} KB`}
                                />
                            }
                        />
                        <Bar
                            dataKey="response_size"
                            fill="var(--chart-1)"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
