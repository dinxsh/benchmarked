'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface PriceVarianceChartProps {
    results: Array<{
        provider: { name: string; color: string };
        price: number | null;
        status: string;
    }>;
    stats: {
        medianPrice: string;
        minPrice: string;
        maxPrice: string;
        priceVariance: string;
    };
}

export function PriceVarianceChart({ results, stats }: PriceVarianceChartProps) {
    const successfulResults = results
        .filter(r => r.status === 'success' && r.price)
        .sort((a, b) => (a.price || 0) - (b.price || 0));

    const chartData = successfulResults.map((result, index) => ({
        index: index + 1,
        price: result.price,
        provider: result.provider.name,
        median: parseFloat(stats.medianPrice)
    }));

    if (chartData.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Price Variance Analysis
                    </CardTitle>
                    <CardDescription>Price distribution and consensus</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        No price data available
                    </div>
                </CardContent>
            </Card>
        );
    }

    const variance = parseFloat(stats.priceVariance);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Price Variance Analysis
                </CardTitle>
                <CardDescription>
                    Variance: {variance.toFixed(4)}% | Range: ${stats.minPrice} - ${stats.maxPrice}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorMedian" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--muted)" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="var(--muted)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                            dataKey="provider"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${value.toFixed(2)}`}
                        />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="rounded-lg border bg-popover p-3 shadow-md min-w-[180px]">
                                            <div className="space-y-3">
                                                <div className="border-b border-border/50 pb-2">
                                                    <span className="font-semibold text-base text-foreground block">
                                                        {payload[0].payload.provider}
                                                    </span>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-muted-foreground font-medium">Price:</span>
                                                        <span className="font-mono font-bold text-lg text-violet-400">
                                                            ${(payload[0].value as number)?.toFixed(4)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-muted-foreground font-medium">Median:</span>
                                                        <span className="font-mono font-bold text-emerald-400">
                                                            ${(payload[1]?.value as number)?.toFixed(4)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="price"
                            stroke="var(--chart-1)"
                            fillOpacity={1}
                            fill="url(#colorPrice)"
                        />
                        <Area
                            type="monotone"
                            dataKey="median"
                            stroke="var(--muted)"
                            fillOpacity={1}
                            fill="url(#colorMedian)"
                            strokeDasharray="5 5"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
