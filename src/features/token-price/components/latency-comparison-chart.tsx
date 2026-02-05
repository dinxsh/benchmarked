'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Clock } from 'lucide-react';

interface LatencyComparisonChartProps {
    results: Array<{
        provider: { name: string; color: string };
        latency: number;
        status: string;
    }>;
}

export function LatencyComparisonChart({ results }: LatencyComparisonChartProps) {
    const validResults = results.filter(r => r.status !== 'unavailable' && r.latency > 0);

    const chartData = validResults
        .map(result => ({
            name: result.provider.name,
            latency: result.latency,
            fill: result.status === 'success' ? result.provider.color : 'var(--destructive)'
        }))
        .sort((a, b) => a.latency - b.latency);

    if (chartData.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Response Time Comparison
                    </CardTitle>
                    <CardDescription>Provider latency comparison</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        No latency data available
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Response Time Comparison
                </CardTitle>
                <CardDescription>
                    Latency across {chartData.length} provider{chartData.length !== 1 ? 's' : ''}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                        <XAxis
                            type="number"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}ms`}
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                        Provider
                                                    </span>
                                                    <span className="font-bold text-muted-foreground">
                                                        {payload[0].payload.name}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                        Latency
                                                    </span>
                                                    <span className="font-bold">
                                                        {payload[0].value}ms
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar dataKey="latency" radius={[0, 4, 4, 0]} maxBarSize={60}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
