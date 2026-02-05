'use client';

import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    ReferenceLine
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ResponseTimelineChartProps {
    results: Array<{
        provider: {
            name: string;
            color: string;
        };
        status: string;
        latency: number;
        error?: string;
    }>;
}

export function ResponseTimelineChart({ results }: ResponseTimelineChartProps) {
    const data = results
        .map((r) => ({
            name: r.provider.name,
            latency: r.latency,
            status: r.status,
            color: r.status === 'success' ? r.provider.color : 'var(--destructive)',
            errorMessage: r.error || 'Unknown Error',
            displayLatency: r.latency > 0 ? r.latency : 0
        }))
        .sort((a, b) => a.displayLatency - b.displayLatency);

    const maxLatency = Math.max(...data.map(d => d.displayLatency));

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base font-medium">Request Timeline & Status</CardTitle>
                <CardDescription>
                    Duration of all requests, including failures (Red)
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.2} />
                            <XAxis
                                type="number"
                                hide
                            />
                            <YAxis
                                dataKey="name"
                                type="category"
                                width={100}
                                fontSize={12}
                                stroke="var(--muted-foreground)"
                            />
                            <Tooltip
                                cursor={{ fill: 'var(--muted)', opacity: 0.1 }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const d = payload[0].payload;
                                        return (
                                            <div className="rounded-lg border bg-popover p-3 shadow-md min-w-[180px]">
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
                                                        <span className="font-semibold text-sm text-foreground">
                                                            {d.name}
                                                        </span>
                                                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${d.status === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                            {d.status}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                                        <span className="text-muted-foreground">Duration:</span>
                                                        <span className="font-mono text-right text-foreground">{d.displayLatency}ms</span>

                                                        {d.status !== 'success' && (
                                                            <>
                                                                <span className="text-muted-foreground">Error:</span>
                                                                <span className="font-mono text-right text-red-500 break-words max-w-[100px] truncate" title={d.errorMessage}>
                                                                    {d.errorMessage}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="displayLatency" radius={[0, 4, 4, 0]} barSize={24} background={{ fill: 'var(--muted)', rx: 4, opacity: 0.1 }}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
