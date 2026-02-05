'use client';

import {
    CartesianGrid,
    Cell,
    ReferenceLine,
    ResponsiveContainer,
    Scatter,
    ScatterChart,
    Tooltip,
    XAxis,
    YAxis,
    ZAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface BenchmarkScatterChartProps {
    results: Array<{
        provider: {
            name: string;
            color: string;
        };
        price: number | null;
        latency: number;
        status: string;
    }>;
    stats: {
        medianPrice: string;
        avgLatency: number;
    };
}

export function BenchmarkScatterChart({ results, stats }: BenchmarkScatterChartProps) {
    const data = results
        .filter((r) => r.status === 'success' && r.price !== null)
        .map((r) => ({
            name: r.provider.name,
            x: r.latency,
            y: r.price!,
            z: 1, // Size
            color: r.provider.color,
        }));

    const medianPrice = parseFloat(stats.medianPrice);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base font-medium">Performance Matrix</CardTitle>
                <CardDescription>
                    Latency vs. Price Correlation (Ideally Bottom-Left or Center Line)
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                            <XAxis
                                type="number"
                                dataKey="x"
                                name="Latency"
                                unit="ms"
                                stroke="var(--muted-foreground)"
                                fontSize={12}
                                label={{ value: 'Latency (ms)', position: 'bottom', offset: 0, fontSize: 10, fill: 'var(--muted-foreground)' }}
                            />
                            <YAxis
                                type="number"
                                dataKey="y"
                                name="Price"
                                unit="$"
                                stroke="var(--muted-foreground)"
                                fontSize={12}
                                domain={['auto', 'auto']}
                                label={{ value: 'Price ($)', angle: -90, position: 'insideLeft', fontSize: 10, fill: 'var(--muted-foreground)' }}
                            />
                            <ZAxis type="number" dataKey="z" range={[400, 400]} />
                            <Tooltip
                                cursor={{ strokeDasharray: '3 3' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const d = payload[0].payload;
                                        // Calculate generic deviation if not passed (though we passed median in stats)
                                        // Ideally calculate exact deviation if we had median here.
                                        // As a quick win, just show data we have.
                                        return (
                                            <div className="rounded-lg border bg-popover p-3 shadow-md min-w-[150px]">
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-1.5 mb-1.5">
                                                        <span className="font-semibold text-sm text-foreground">
                                                            {d.name}
                                                        </span>
                                                        <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                            {/* Provider type would need to be passed in data, assume we can add it */}
                                                            PROVIDER
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                                        <span className="text-muted-foreground">Price:</span>
                                                        <span className="font-mono text-right text-foreground">${d.y.toFixed(4)}</span>

                                                        <span className="text-muted-foreground">Latency:</span>
                                                        <span className="font-mono text-right text-foreground">{d.x}ms</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            {/* Median Price Line */}
                            <ReferenceLine
                                y={medianPrice}
                                stroke="var(--foreground)"
                                strokeDasharray="3 3"
                                label={{ position: 'insideTopRight', value: 'Median Price', fontSize: 10, fill: 'var(--muted-foreground)' }}
                            />
                            {/* Avg Latency Line */}
                            <ReferenceLine
                                x={stats.avgLatency}
                                stroke="var(--muted-foreground)"
                                strokeDasharray="3 3"
                                label={{ position: 'insideTopRight', value: 'Avg Latency', fontSize: 10, fill: 'var(--muted-foreground)', angle: -90 }}
                            />
                            <Scatter name="Providers" data={data}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="var(--background)" strokeWidth={2} />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
