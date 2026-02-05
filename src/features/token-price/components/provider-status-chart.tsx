'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Activity } from 'lucide-react';

interface ProviderStatusChartProps {
    results: Array<{
        provider: { name: string };
        status: 'success' | 'error' | 'unavailable';
    }>;
}

export function ProviderStatusChart({ results }: ProviderStatusChartProps) {
    const statusCounts = results.reduce((acc, result) => {
        acc[result.status] = (acc[result.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const chartData = [
        { name: 'Success', value: statusCounts.success || 0, fill: 'var(--chart-1)' },
        { name: 'Error', value: statusCounts.error || 0, fill: 'var(--destructive)' },
        { name: 'Unavailable', value: statusCounts.unavailable || 0, fill: 'var(--muted)' }
    ].filter(item => item.value > 0);

    const total = results.length;
    const successRate = ((statusCounts.success || 0) / total * 100).toFixed(0);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Provider Status Distribution
                </CardTitle>
                <CardDescription>
                    {successRate}% success rate ({statusCounts.success || 0}/{total} providers)
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0];
                                    return (
                                        <div className="rounded-lg border bg-popover p-3 shadow-md min-w-[140px]">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2 border-b border-border/50 pb-1.5">
                                                    <div
                                                        className="w-2 h-2 rounded-full"
                                                        style={{ backgroundColor: data.payload.fill }}
                                                    />
                                                    <span className="font-semibold text-sm text-foreground">
                                                        {data.name}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-muted-foreground">Count:</span>
                                                    <span className="font-mono font-medium text-foreground">{data.value}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
