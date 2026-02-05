'use client';

import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PriceDeviationChartProps {
    results: Array<{
        provider: {
            name: string;
            color: string;
        };
        price: number | null;
        status: string;
    }>;
    stats: {
        medianPrice: string;
    };
}

export function PriceDeviationChart({ results, stats }: PriceDeviationChartProps) {
    const median = parseFloat(stats.medianPrice);

    const data = results
        .filter((r) => r.status === 'success' && r.price !== null)
        .map((r) => {
            const price = r.price!;
            // Calculate percentage deviation: positive = above median, negative = below median
            const deviation = ((price - median) / median) * 100;

            // For visibility: if deviation is tiny but non-zero, boost it slightly for the visual bar only
            // We use a separate property for the bar size vs the real value
            const absDeviation = Math.abs(deviation);
            const isTiny = absDeviation > 0 && absDeviation < 0.05;
            const visualDeviation = isTiny
                ? (deviation > 0 ? 0.05 : -0.05)
                : deviation;

            return {
                name: r.provider.name,
                deviation: deviation,
                visualDeviation: visualDeviation,
                price: price,
                color: r.provider.color,
                formattedDeviation: deviation.toFixed(4),
            };
        })
        // Sort by real deviation
        .sort((a, b) => Math.abs(a.deviation) - Math.abs(b.deviation));

    return (
        <Card>
            <CardHeader>
                <CardTitle className=" text-base font-medium flex items-center gap-2">
                    Price Deviation Analysis
                </CardTitle>
                <CardDescription>
                    % Deviation from Median Price (${median.toFixed(2)})
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.2} />
                            <XAxis
                                type="number"
                                domain={['auto', 'auto']}
                                tickFormatter={(val) => `${val.toFixed(2)}%`}
                                fontSize={12}
                                stroke="var(--muted-foreground)"
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
                                                <div className="space-y-3">
                                                    <div className="border-b border-border/50 pb-2">
                                                        <span className="font-semibold text-base text-foreground block">
                                                            {d.name}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <div className="flex justify-between items-center text-sm">
                                                            <span className="text-muted-foreground font-medium">Price:</span>
                                                            <span className="font-mono font-bold text-lg text-violet-400">
                                                                ${d.price.toFixed(4)}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-sm">
                                                            <span className="text-muted-foreground font-medium">Deviation:</span>
                                                            <span
                                                                className={`font-mono font-bold text-base ${d.deviation > 0
                                                                    ? 'text-red-400' // Lighter red for dark mode
                                                                    : d.deviation < 0
                                                                        ? 'text-emerald-400'
                                                                        : 'text-muted-foreground'
                                                                    }`}
                                                            >
                                                                {d.deviation > 0 ? '+' : ''}
                                                                {d.formattedDeviation}%
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
                            <ReferenceLine x={0} stroke="var(--foreground)" strokeWidth={1} />
                            <Bar dataKey="visualDeviation" radius={[0, 4, 4, 0]} barSize={32}>
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.deviation === 0 ? 'var(--muted)' : entry.color}
                                        fillOpacity={0.8}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
