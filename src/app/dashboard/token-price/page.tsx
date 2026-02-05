'use client';

import { useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TokenPriceBenchmarkMode } from '@/lib/benchmark-types';
import { TokenPriceStats } from '@/features/token-price/components/token-price-stats';
import { PriceDeviationChart } from '@/features/token-price/components/price-deviation-chart';
import { BenchmarkScatterChart } from '@/features/token-price/components/benchmark-scatter-chart';
import { ProviderStatusChart } from '@/features/token-price/components/provider-status-chart';
import { PriceVarianceChart } from '@/features/token-price/components/price-variance-chart';
import { ResponseTimelineChart } from '@/features/token-price/components/response-timeline-chart';
import { ProviderScoreRadarCorrect } from '@/features/token-price/components/provider-score-radar';
import { BenchmarkControls } from '@/features/token-price/components/benchmark-controls';

interface BenchmarkResult {
    provider: {
        id: string;
        name: string;
        type: string;
        logo: string;
        color: string;
        hasTokenPrice: boolean;
        endpoint: string;
        method: string;
        description: string;
    };
    status: 'success' | 'error' | 'unavailable';
    latency: number;
    price: number | null;
    priceUSD?: string;
    timestamp?: string;
    error?: string;
    additionalData?: any;
}

interface BenchmarkResponse {
    token: string;
    network: string;
    mode: string;
    results: BenchmarkResult[];
    stats: {
        avgLatency: number;
        successRate: number;
        fastestProvider: string;
        priceConsensus: number;
        medianPrice: string;
        priceVariance: string;
        minLatency: number;
        maxLatency: number;
        minPrice: string;
        maxPrice: string;
    };
    timestamp: string;
}

export default function TokenPricePage() {

    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<BenchmarkResponse | null>(null);
    const [filteredProviders, setFilteredProviders] = useState<string[]>([]);

    const handleBenchmark = async (config: { token: string; network: string; mode: string }) => {
        setLoading(true);
        try {
            const response = await fetch(
                `/api/benchmarks/token-price?token=${encodeURIComponent(config.token)}&network=${config.network}&mode=${config.mode}`
            );
            const data = await response.json();
            setResults(data);
            // Reset filters on new run, or keep them? Resetting is safer to avoid confusion.
            setFilteredProviders([]);
        } catch (error) {
            console.error('Benchmark failed:', error);
            alert('Failed to run benchmark');
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    const getFilteredResults = () => {
        if (!results) return null;
        if (filteredProviders.length === 0) return results.results;
        return results.results.filter(r => filteredProviders.includes(r.provider.name));
    };

    const displayResults = getFilteredResults();
    const allProviderNames = results ? results.results.map(r => r.provider.name) : [];

    return (
        <ScrollArea className="h-[calc(100vh-4rem)]">
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-[95%] mx-auto">
                <div className="flex flex-col gap-8 w-full">
                    {/* Header Section */}
                    <div className="flex flex-col gap-1 border-b pb-4">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">
                            Token Price Benchmarking
                        </h1>
                    </div>

                    {/* Unified Control Panel */}
                    <BenchmarkControls
                        onRun={handleBenchmark}
                        loading={loading}
                        providerNames={allProviderNames}
                        onFilterChange={setFilteredProviders}
                    />

                    {/* Enhanced Stats Overview */}
                    {results && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                            <TokenPriceStats stats={results.stats} results={displayResults || []} />
                        </div>
                    )}

                    {/* Charts Grid - Bento Style - REPLACED WITH ADVANCED ANALYTICS */}
                    {results && displayResults && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                            {/* Price Deviation - Replaces Price Comparison (2 cols) */}
                            <div className="lg:col-span-2">
                                <PriceDeviationChart results={displayResults} stats={results.stats} />
                            </div>

                            {/* Status Distribution (1 col) */}
                            <div className="lg:col-span-1">
                                <ProviderStatusChart results={displayResults} />
                            </div>

                            {/* Response Timeline - Shows Errors! (2 cols) */}
                            <div className="lg:col-span-2">
                                <ResponseTimelineChart results={displayResults} />
                            </div>

                            {/* Provider Radar Score (1 col) */}
                            <div className="lg:col-span-1">
                                <ProviderScoreRadarCorrect results={displayResults} stats={results.stats} />
                            </div>

                            {/* Benchmark Scatter (2 cols) */}
                            <div className="lg:col-span-2">
                                <BenchmarkScatterChart results={displayResults} stats={results.stats} />
                            </div>

                            {/* Price Variance (1 col) */}
                            <div className="lg:col-span-1">
                                <PriceVarianceChart results={displayResults} stats={results.stats} />
                            </div>
                        </div>
                    )}

                    {/* Results Table */}
                    {results && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Provider Comparison Results</CardTitle>
                                <CardDescription>
                                    Token: {results.token} | Network: {results.network}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border/50">
                                                <th className="text-left p-4 font-medium text-muted-foreground w-[80px]">Rank</th>
                                                <th className="text-left p-4 font-medium text-muted-foreground">Provider</th>
                                                <th className="text-left p-4 font-medium text-muted-foreground w-[120px]">Status</th>
                                                <th className="text-left p-4 font-medium text-muted-foreground">Token Price (USD)</th>
                                                <th className="text-left p-4 font-medium text-muted-foreground">Response Time</th>
                                                <th className="text-left p-4 font-medium text-muted-foreground text-right">API Type</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {results.results
                                                .sort((a, b) => {
                                                    if (a.status !== 'success') return 1;
                                                    if (b.status !== 'success') return -1;
                                                    return a.latency - b.latency;
                                                })
                                                .map((result, index) => {
                                                    const rank = result.status === 'success' ? index + 1 : '--';
                                                    const isWinner = index === 0 && result.status === 'success';

                                                    return (
                                                        <tr key={result.provider.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                                                            <td className="p-4 font-mono text-muted-foreground font-medium">{rank}</td>
                                                            <td className="p-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div
                                                                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shadow-sm border border-border/50"
                                                                        style={{
                                                                            backgroundColor: `color-mix(in srgb, ${result.provider.color}, transparent 90%)`,
                                                                            color: result.provider.color,
                                                                        }}
                                                                    >
                                                                        {result.provider.logo}
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <div className="font-semibold flex items-center gap-2 text-foreground">
                                                                            {result.provider.name}
                                                                            {isWinner && (
                                                                                <Badge variant="default" className="h-5 px-1.5 text-[10px] bg-indigo-500 hover:bg-indigo-600 gap-1">
                                                                                    🏆 FASTEST
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground w-[200px] truncate">
                                                                            {result.provider.type}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="p-4">
                                                                {result.status === 'success' ? (
                                                                    <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500 h-6">
                                                                        Success
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge variant="destructive" className="h-6">
                                                                        Error
                                                                    </Badge>
                                                                )}
                                                            </td>
                                                            <td className="p-4">
                                                                {result.price ? (
                                                                    <span className="font-mono font-bold text-foreground text-base">
                                                                        ${result.priceUSD}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-muted-foreground font-mono">--</span>
                                                                )}
                                                            </td>
                                                            <td className="p-4">
                                                                {result.latency > 0 ? (
                                                                    <span
                                                                        className="font-mono font-medium"
                                                                        style={{
                                                                            color: result.latency < 300 ? 'var(--chart-2)' : result.latency < 500 ? 'var(--chart-5)' : 'var(--chart-1)'
                                                                        }}
                                                                    >
                                                                        {result.latency}ms
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-muted-foreground font-mono">--</span>
                                                                )}
                                                            </td>
                                                            <td className="p-4 text-right">
                                                                <Badge variant="secondary" className="font-mono text-xs font-normal opacity-80">
                                                                    {result.provider.method}
                                                                </Badge>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Initial State */}
                    {!results && !loading && (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <p className="text-muted-foreground">
                                    Select a token and click "Benchmark All Providers" to start testing. The system
                                    will query each provider's API and measure response time, accuracy, and data
                                    completeness.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </ScrollArea>
    );
}
