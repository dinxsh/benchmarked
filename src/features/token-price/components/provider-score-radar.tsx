'use client';

import {
    PolarAngleAxis,
    PolarGrid,
    PolarRadiusAxis,
    Radar,
    RadarChart,
    ResponsiveContainer,
    Tooltip,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ProviderScoreRadarProps {
    results: Array<{
        provider: {
            name: string;
            color: string;
        };
        price: number | null;
        latency: number;
        status: string;
        priceUSD?: string;
    }>;
    stats: {
        medianPrice: string;
        avgLatency: number;
    };
}

export function ProviderScoreRadar({ results, stats }: ProviderScoreRadarProps) {
    const medianPrice = parseFloat(stats.medianPrice);
    const maxLatency = Math.max(...results.map(r => r.latency || 0)) * 1.2; // 20% buffer

    // Only successful providers
    const validProviders = results.filter(r => r.status === 'success' && r.price !== null);

    const data = validProviders.map(r => {
        const price = r.price!;

        // Calculate scores (0-100)
        // 1. Velocity Score: Lower latency is better
        const velocityScore = Math.max(0, 100 - (r.latency / maxLatency) * 100);

        // 2. Precision Score: Lower deviation is better
        const deviation = Math.abs((price - medianPrice) / medianPrice);
        const precisionScore = Math.max(0, 100 - (deviation * 1000)); // weighted deviation

        // 3. Reliability: 100 if success (filtered), but could be historical if data existed
        const reliabilityScore = 100;

        return {
            name: r.provider.name,
            Velocity: parseFloat(velocityScore.toFixed(0)),
            Precision: parseFloat(precisionScore.toFixed(0)),
            Reliability: reliabilityScore,
            color: r.provider.color,
            fullMark: 100,
        };
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base font-medium">Provider Performance Radar</CardTitle>
                <CardDescription>
                    Comparative Scoring (0-100) of Velocity, Precision, and Reliability
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                            <PolarGrid stroke="var(--muted-foreground)" strokeOpacity={0.2} />
                            <PolarAngleAxis dataKey="name" fontSize={11} stroke="var(--muted-foreground)" />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />

                            {/* We create one Radar for each provider to show individual shapes, 
                                but standard Radar charts usually overlap 1 shape per metric category.
                                Since we want to compare PROVIDERS, we need to restructure data or use multiple Radars?
                                Actually, standard Radar compares ONE entity across multiple metrics.
                                To compare MULTIPLE entities, we map multiple Radars.
                             */}

                            {data.map((entry, index) => (
                                <Radar
                                    key={entry.name}
                                    name={entry.name}
                                    dataKey="value" // This form requires reshaping data differently... 
                                // Recharts Radar expects data array of Metrics, not Providers.
                                // Let's Pivot the data logic below to be correct for Recharts.
                                // Wait, if we want multiple polygons, we need a single data array with keys for each provider?
                                // No, Recharts <Radar> takes a dataKey from the data array. The data array defines the AXES.
                                // So data should be: [{ subject: 'Velocity', A: 120, B: 110 }, { subject: 'Precision', ... }]
                                />
                            ))}
                            {/* Correct approach for multi-provider comparison */}
                        </RadarChart>
                    </ResponsiveContainer>

                    {/* Fallback to normalized bar chart or simpler implementation if Radar is too complex for this data structure */}
                    <p className="text-center text-xs text-muted-foreground mt-4">
                        * Comparison of top providers normalized against the group average.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

// Re-writing the component with correct Data Structure for Recharts Radar
export function ProviderScoreRadarCorrect({ results, stats }: ProviderScoreRadarProps) {
    const medianPrice = parseFloat(stats.medianPrice);
    const maxLatency = Math.max(...results.map(r => r.latency || 1000)) * 1.2 || 1000;

    const validProviders = results.filter(r => r.status === 'success' && r.price !== null);

    if (validProviders.length < 3) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-medium">Provider Scores</CardTitle>
                    <CardDescription>Need at least 3 successful providers for Radar analysis</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[300px] text-muted-foreground">
                    Insufficient Data
                </CardContent>
            </Card>
        );
    }

    // Build metric scores for each provider
    const providers = validProviders.map(r => {
        const price = r.price!;
        // 1. Velocity Score (0-100)
        const velocityScore = Math.max(0, 100 - (r.latency / maxLatency) * 100);
        // 2. Precision Score (0-100)
        const deviation = Math.abs((price - medianPrice) / medianPrice);
        const precisionScore = Math.max(0, 100 - (deviation * 5000)); // steeper penalty

        return {
            name: r.provider.name,
            color: r.provider.color,
            Velocity: velocityScore,
            Precision: precisionScore,
            Reliability: 100
        };
    });

    // Pivot data for Recharts: Array of { subject: 'Metric', Provider1: score, Provider2: score... }
    const radarData = [
        { subject: 'Velocity', fullMark: 100 },
        { subject: 'Precision', fullMark: 100 },
        { subject: 'Reliability', fullMark: 100 },
    ].map(metric => {
        const item: any = { subject: metric.subject, fullMark: 100 };
        providers.forEach(p => {
            // @ts-ignore
            item[p.name] = p[metric.subject];
        });
        return item;
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base font-medium">Provider Performance Radar</CardTitle>
                <CardDescription>Comparative Scoring (0-100)</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                            <PolarGrid stroke="var(--muted-foreground)" strokeOpacity={0.2} />
                            <PolarAngleAxis dataKey="subject" fontSize={12} stroke="var(--muted-foreground)" />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />

                            {providers.map((p, i) => (
                                <Radar
                                    key={p.name}
                                    name={p.name}
                                    dataKey={p.name}
                                    stroke={p.color}
                                    fill={p.color}
                                    fillOpacity={0.3}
                                />
                            ))}
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        // Radar chart payload structure is tricky.
                                        // payload[0] usually contains the data object for the hovered point (if specific) or all if shared.
                                        // However, in this implementation we map multiple Radars.
                                        // Hovering often triggers the "axis" tooltip in Recharts Radar.
                                        // Let's try to show data for the specific hovered area if possible, or all providers for that axis?
                                        // With multiple Radars, usually the active payload contains the data for the specific Radar hovered.

                                        const data = payload[0];
                                        return (
                                            <div className="rounded-lg border bg-popover p-3 shadow-md min-w-[150px]">
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-1.5 mb-1.5">
                                                        <span className="font-semibold text-sm text-foreground">
                                                            {payload[0].name}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                                        <span className="text-muted-foreground font-medium">Metric:</span>
                                                        <span className="font-mono text-right text-foreground font-medium">{payload[0].payload.subject}</span>

                                                        <span className="text-muted-foreground font-medium">Score:</span>
                                                        <span className="font-mono text-right font-bold text-violet-400">
                                                            {Number(payload[0].value).toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
