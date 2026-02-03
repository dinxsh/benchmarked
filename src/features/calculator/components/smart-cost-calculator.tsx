'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
    IconCalculator,
    IconMaximize,
    IconMinimize,
    IconCheck,
    IconInfoCircle,
    IconServer,
    IconCpu,
    IconDatabaseExport
} from '@tabler/icons-react';
import { cn, formatNumber } from '@/lib/utils';

interface ProviderCost {
    id: number;
    name: string;
    cost: number;
    basePrice: number;
    freeTier: string;
    features: string[];
    isWinner?: boolean;
}

export function SmartCostCalculator() {
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Inputs
    const [monthlyRequests, setMonthlyRequests] = useState([10000000]); // 10M
    const [isPremiumCompute, setIsPremiumCompute] = useState(false); // Complexity
    const [responseSize, setResponseSize] = useState([1]); // KB

    const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

    // Advanced Pricing Logic
    const calculation = useMemo(() => {
        const reqs = monthlyRequests[0];
        const sizeKB = responseSize[0];

        // Compute Multiplier: Premium requests (traces, debug) cost much more
        const computeMultiplier = isPremiumCompute ? 5 : 1;

        // Bandwidth: approx $0.08 per GB
        // Total GB = (reqs * sizeKB) / 1,000,000
        const totalGB = (reqs * sizeKB) / 1000000;
        const bandwidthCost = totalGB * 0.08;

        const providers = [
            {
                id: 1,
                name: 'Covalent',
                basePrice: 0.10, // Estimate based on credit efficiency for data
                freeLimit: 1000000000,
                features: ['Unified API', 'Granular Data', 'Long-term Storage']
            },
            {
                id: 2,
                name: 'Alchemy',
                basePrice: 0.45, // 2025 Pricing: Starts at $0.45/million CUs
                freeLimit: 300000000, // 300M CUs/month free
                features: ['Reliable', 'Deep History']
            },
            {
                id: 3,
                name: 'QuickNode',
                basePrice: 0.61, // ~$49 for 80M credits
                freeLimit: 10000000, // 10M free
                features: ['Fast', 'Global']
            },
            {
                id: 4,
                name: 'Infura',
                basePrice: 0.50, // Estimate roughly based on $50/mo plans
                freeLimit: 3000000,
                features: ['Standard']
            },
            {
                id: 5,
                name: 'Subsquid',
                basePrice: 0.10,
                freeLimit: Infinity, // "Free" for now (Network bootstrapping)
                features: ['Decentralized', 'Open']
            },
            {
                id: 6,
                name: 'Ankr',
                basePrice: 0.50, // Hybrid/Premium pricing varies
                freeLimit: 0,
                features: ['Hybrid']
            },
            {
                id: 7,
                name: 'Chainstack',
                basePrice: 0.30,
                freeLimit: 3000000,
                features: ['Multi-cloud']
            },
            {
                id: 8,
                name: 'GetBlock',
                basePrice: 0.60,
                freeLimit: 40000,
                features: ['User-friendly']
            },
            {
                id: 9,
                name: 'BlockPi',
                basePrice: 0.20,
                freeLimit: 0,
                features: ['DePIN', 'Low Latency']
            },
            {
                id: 10,
                name: 'Bitquery',
                basePrice: 3.50, // Specialized Data API (Premium)
                freeLimit: 10000,
                features: ['Complex Queries', 'Analytics']
            },
            {
                id: 11,
                name: 'The Graph',
                basePrice: 1.20, // Query fees vary
                freeLimit: 100000,
                features: ['Indexed Data']
            }
        ];

        const calculated: ProviderCost[] = providers.map(p => {
            // Logic: Max(0, (Reqs - Limit)) / 1M * Base * Multiplier + Bandwidth
            const billableRatio = Math.max(0, reqs - p.freeLimit);
            const computeCost = (billableRatio / 1000000) * p.basePrice * computeMultiplier;
            // Some providers charge differently for bandwidth, simplified here:
            const total = computeCost + (['Subsquid', 'Covalent'].includes(p.name) ? 0 : bandwidthCost);

            return {
                ...p,
                cost: total,
                // Handle Infinity case for display
                freeTier: p.freeLimit === Infinity ? 'Unlimited' : formatNumber(p.freeLimit)
            };
        }).sort((a, b) => a.cost - b.cost);

        // Mark winner
        calculated[0].isWinner = true;

        // Statistics for insights
        const winner = calculated[0];
        const average = calculated.reduce((acc, c) => acc + c.cost, 0) / calculated.length;
        const savings = average - winner.cost;
        const maxCost = Math.max(...calculated.map(c => c.cost));

        return { list: calculated, winner, savings, maxCost };

    }, [monthlyRequests, isPremiumCompute, responseSize]);

    return (
        <Card
            className={cn(
                "relative transition-all duration-500 overflow-hidden border-border/50 shadow-sm",
                isFullscreen
                    ? "fixed inset-0 z-50 h-[100vh] w-[100vw] rounded-none m-0 border-0 bg-background p-4 md:p-8 overflow-y-auto"
                    : "w-full hover:border-sidebar-accent"
            )}
        >
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px] pointer-events-none opacity-40" />

            <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-6 border-b border-border/40">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                            <CardTitle className={cn("tracking-tight font-bold", isFullscreen ? "text-3xl" : "text-xl")}>
                                Smart Cost Calculator
                            </CardTitle>
                            {isFullscreen && <span className="text-sm text-muted-foreground font-medium mt-1">Real-time infrastructure estimation</span>}
                        </div>
                    </div>
                </div>
                <Button variant="outline" size="icon" onClick={toggleFullscreen} className="shrink-0 rounded-md h-8 w-8 hover:bg-muted transition-colors">
                    {isFullscreen ? <IconMinimize className="h-4 w-4" /> : <IconMaximize className="h-4 w-4" />}
                </Button>
            </CardHeader>

            <CardContent className="relative z-10 pt-8 pb-4">
                <div className={cn("grid gap-8 lg:gap-12", isFullscreen ? "grid-cols-1 md:grid-cols-12 max-w-7xl mx-auto h-full" : "grid-cols-1 lg:grid-cols-12")}>

                    {/* Controls Panel */}
                    <div className={cn("space-y-8 p-6 rounded-xl border border-border/50 bg-card/50", "lg:col-span-5", isFullscreen ? "md:col-span-4" : "")}>

                        {/* Request Slider */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold tracking-wide text-foreground flex items-center gap-2">
                                    <IconServer className="h-4 w-4 text-muted-foreground" />
                                    Request Volume
                                </label>
                                <Badge variant="secondary" className="font-mono text-base px-2 py-0.5">{formatNumber(monthlyRequests[0])}</Badge>
                            </div>
                            <Slider
                                value={monthlyRequests}
                                onValueChange={setMonthlyRequests}
                                max={1000000000}
                                min={100000}
                                step={100000}
                                className="w-full"
                            />
                        </div>

                        {/* Compute Units Toggle */}
                        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-border/30">
                            <div className="space-y-0.5">
                                <label className="text-sm font-semibold flex items-center gap-2">
                                    <IconCpu className="h-4 w-4 text-muted-foreground" />
                                    Premium Compute
                                </label>
                                <p className="text-[10px] text-muted-foreground">Trace API, Archive, Debug calls (5x cost)</p>
                            </div>
                            <Switch checked={isPremiumCompute} onCheckedChange={setIsPremiumCompute} />
                        </div>

                        {/* Response Size Slider */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold tracking-wide text-foreground flex items-center gap-2">
                                    <IconDatabaseExport className="h-4 w-4 text-muted-foreground" />
                                    Avg Response Size
                                </label>
                                <Badge variant="outline" className="font-mono">{responseSize[0]} KB</Badge>
                            </div>
                            <Slider
                                value={responseSize}
                                onValueChange={setResponseSize}
                                max={100}
                                min={1}
                                step={1}
                                className="w-full"
                            />
                        </div>

                        {/* Summary Box (Only in non-fullscreen or bottom) */}
                        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4">
                            <h4 className="text-xs uppercase tracking-widest font-bold text-emerald-600 mb-2 flex items-center gap-1">
                                <IconCheck className="h-3 w-3" /> Recommended
                            </h4>
                            <p className="text-sm font-medium">
                                <span className="font-bold text-foreground">{calculation.winner.name}</span> is your best option.
                                You save <span className="font-mono font-bold">${formatNumber(Math.round(calculation.savings))}</span>/mo compared to average.
                            </p>
                        </div>
                    </div>

                    {/* Visualization & List Panel */}
                    <div className={cn("space-y-6", "lg:col-span-7", isFullscreen ? "md:col-span-8 overflow-y-auto pr-2" : "")}>
                        {/* Chart Header */}
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-lg">Cost Comparison</h3>
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">Estimated Monthly Bill</span>
                        </div>

                        {/* Chart + List */}
                        <div className="space-y-3">
                            {calculation.list.map((provider) => {
                                // Calculate relative width for the bar (min 5%)
                                const widthPercentage = Math.max(5, (provider.cost / (calculation.maxCost || 1)) * 100);

                                return (
                                    <div
                                        key={provider.id}
                                        className={cn(
                                            "group relative flex flex-col gap-2 p-3 rounded-lg border transition-all hover:bg-muted/30",
                                            provider.isWinner ? "border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10" : "border-border/40 bg-card"
                                        )}
                                    >
                                        <div className="flex items-center justify-between z-10 relative">
                                            <div className="flex items-center gap-3">
                                                <div className={cn("h-2 w-2 rounded-full", provider.isWinner ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/30")} />
                                                <span className="font-bold text-sm">{provider.name}</span>
                                                {provider.isWinner && <Badge className="h-4 text-[9px] bg-emerald-500 hover:bg-emerald-600 text-white border-0">BEST VALUE</Badge>}
                                            </div>
                                            <div className="text-right">
                                                <span className={cn("font-mono font-bold", provider.isWinner ? "text-emerald-500" : "text-foreground")}>
                                                    ${provider.cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Bar Visualization */}
                                        <div className="relative h-1.5 w-full bg-muted/30 rounded-full overflow-hidden mt-1">
                                            <div
                                                className={cn("absolute top-0 left-0 h-full rounded-full transition-all duration-500", provider.isWinner ? "bg-emerald-500" : "bg-muted-foreground/50")}
                                                style={{ width: `${widthPercentage}%` }}
                                            />
                                        </div>

                                        {/* Details Row (visible on group hover or constantly in full screen?) -> Keep usage simple for now */}
                                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1 opacity-70">
                                            <span>Free Tier: {provider.freeTier}</span>
                                            <span>Base: ${provider.basePrice.toFixed(2)}/M</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </CardContent>
        </Card>
    );
}
