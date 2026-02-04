'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
    IconDatabaseExport,
    IconBolt,
    IconShieldCheck,
    IconCurrencyDollar
} from '@tabler/icons-react';
import { cn, formatNumber } from '@/lib/utils';

interface ProviderCost {
    id: number;
    name: string;
    cost: number;
    basePrice: number;
    freeTier: string;
    features: string[];
    latencyScore: number;
    reliabilityScore: number;
    weightedScore?: number;
    isWinner?: boolean;
}

export function SmartCostCalculator() {
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Inputs
    const [monthlyRequests, setMonthlyRequests] = useState([10000000]); // 10M

    // Priorities (Boolean)
    const [prioritizeCost, setPrioritizeCost] = useState(true);
    const [prioritizeSpeed, setPrioritizeSpeed] = useState(false);
    const [prioritizeReliability, setPrioritizeReliability] = useState(false);

    const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

    // Advanced Pricing & Scoring Logic
    const calculation = useMemo(() => {
        const reqs = monthlyRequests[0];

        const providers = [
            {
                id: 1,
                name: 'Covalent',
                basePrice: 0.10,
                freeLimit: 25000,
                features: ['Unified API', 'Granular Data', 'Long-term Storage'],
                latencyScore: 85,
                reliabilityScore: 90
            },
            {
                id: 2,
                name: 'Alchemy',
                basePrice: 0.45,
                freeLimit: 300000000,
                features: ['Reliable', 'Deep History'],
                latencyScore: 92,
                reliabilityScore: 98
            },
            {
                id: 3,
                name: 'QuickNode',
                basePrice: 0.61,
                freeLimit: 10000000,
                features: ['Fast', 'Global'],
                latencyScore: 95,
                reliabilityScore: 94
            },
            {
                id: 4,
                name: 'Infura',
                basePrice: 0.50,
                freeLimit: 3000000,
                features: ['Standard'],
                latencyScore: 88,
                reliabilityScore: 99
            },
            {
                id: 5,
                name: 'Subsquid',
                basePrice: 0,
                freeLimit: 0,
                features: ['Decentralized', 'Open'],
                latencyScore: 75,
                reliabilityScore: 85
            },
            {
                id: 6,
                name: 'Ankr',
                basePrice: 0.50,
                freeLimit: 0,
                features: ['Hybrid'],
                latencyScore: 82,
                reliabilityScore: 88
            },
            {
                id: 7,
                name: 'Chainstack',
                basePrice: 0.30,
                freeLimit: 3000000,
                features: ['Multi-cloud'],
                latencyScore: 80,
                reliabilityScore: 90
            },
            {
                id: 8,
                name: 'GetBlock',
                basePrice: 0.60,
                freeLimit: 40000,
                features: ['User-friendly'],
                latencyScore: 78,
                reliabilityScore: 85
            },
            {
                id: 9,
                name: 'BlockPi',
                basePrice: 0.20,
                freeLimit: 0,
                features: ['DePIN', 'Low Latency'],
                latencyScore: 90,
                reliabilityScore: 80
            },
            {
                id: 10,
                name: 'Bitquery',
                basePrice: 3.50,
                freeLimit: 10000,
                features: ['Complex Queries', 'Analytics'],
                latencyScore: 70,
                reliabilityScore: 95
            },
            {
                id: 11,
                name: 'The Graph',
                basePrice: 1.20,
                freeLimit: 100000,
                features: ['Indexed Data'],
                latencyScore: 65,
                reliabilityScore: 92
            }
        ];

        // 1. Calculate Costs
        let calculated: ProviderCost[] = providers.map(p => {
            let cost = 0;
            let freeTierDisplay = '';

            // Pricing matches docs/pricing.md strict mode
            switch (p.name) {
                case 'Alchemy':
                    freeTierDisplay = '300M CUs';
                    if (reqs <= 300_000_000) cost = 0;
                    else cost = ((reqs - 300_000_000) / 1_000_000) * 0.45;
                    break;
                case 'Infura':
                    freeTierDisplay = '3M reqs/mo';
                    if (reqs <= 3_000_000) cost = 0;
                    else if (reqs <= 6_000_000) cost = 50;
                    else if (reqs <= 30_000_000) cost = 225;
                    else if (reqs <= 150_000_000) cost = 1000;
                    else cost = 1000 + ((reqs - 150_000_000) / 1_000_000) * 6.66;
                    break;
                case 'Chainstack':
                    freeTierDisplay = '3M reqs/mo';
                    if (reqs <= 3_000_000) cost = 0;
                    else if (reqs <= 20_000_000) cost = 49;
                    else if (reqs <= 80_000_000) cost = 199;
                    else if (reqs <= 140_000_000) cost = 349;
                    else if (reqs <= 400_000_000) cost = 990;
                    else cost = 990 + ((reqs - 400_000_000) / 1_000_000) * 15;
                    break;
                case 'QuickNode':
                    freeTierDisplay = '10M credits';
                    if (reqs <= 10_000_000) cost = 0;
                    else if (reqs <= 80_000_000) cost = 49;
                    else if (reqs <= 450_000_000) cost = 249;
                    else if (reqs <= 950_000_000) cost = 499;
                    else if (reqs <= 2_000_000_000) cost = 999;
                    else cost = 999 + ((reqs - 2_000_000_000) / 1_000_000) * 0.5;
                    break;
                case 'Ankr':
                    freeTierDisplay = '30M credits';
                    if (reqs <= 30_000_000) cost = 0;
                    else cost = ((reqs - 30_000_000) / 1_000_000) * 0.10;
                    break;
                case 'GetBlock':
                    freeTierDisplay = '40k reqs';
                    if (reqs <= 40_000) cost = 0;
                    else if (reqs <= 500_000) cost = 6;
                    else if (reqs <= 1_000_000) cost = 10;
                    else if (reqs <= 5_000_000) cost = 30;
                    else if (reqs <= 10_000_000) cost = 50;
                    else if (reqs <= 50_000_000) cost = 200;
                    else cost = 500;
                    break;
                case 'The Graph':
                    freeTierDisplay = '100k queries';
                    if (reqs <= 100_000) cost = 0;
                    else cost = ((reqs - 100_000) / 100_000) * 2;
                    break;
                case 'Bitquery':
                    freeTierDisplay = '10k trial';
                    if (reqs <= 10_000) cost = 0;
                    else cost = 249;
                    break;
                case 'Covalent':
                    freeTierDisplay = '100k calls';
                    if (reqs <= 100_000) cost = 0;
                    else cost = 50;
                    break;
                case 'Subsquid':
                    freeTierDisplay = 'Subscription';
                    cost = 0;
                    break;
                default:
                    cost = 0;
            }

            return {
                ...p,
                cost,
                basePrice: 0,
                freeTier: freeTierDisplay,
                latencyScore: p.latencyScore,
                reliabilityScore: p.reliabilityScore
            };
        });

        const maxCost = Math.max(...calculated.map(c => c.cost), 1); // Avoid div by 0

        // 2. Calculate Weighted Scores (Binary Logic)
        const wCost = prioritizeCost ? 1 : 0;
        const wSpeed = prioritizeSpeed ? 1 : 0;
        const wRel = prioritizeReliability ? 1 : 0;

        // If no priority selected, default to Cost
        const safeWCost = (wCost + wSpeed + wRel) === 0 ? 1 : wCost;
        const totalWeight = safeWCost + wSpeed + wRel;

        calculated = calculated.map(p => {
            // Cost Score: Lower is better. 100 = cheapest, 0 = most expensive.
            const costScore = 100 * (1 - (p.cost / maxCost));

            // Weighted Sum
            const weightedScore = (
                (costScore * safeWCost) +
                (p.latencyScore * wSpeed) +
                (p.reliabilityScore * wRel)
            ) / totalWeight;

            // Boost winner slightly if it's exceptionally cheap (Bonus)
            // if (p.cost === 0) weightedScore += 5;

            return { ...p, weightedScore };
        });

        // 3. Sort by Weighted Score (Descending)
        calculated.sort((a, b) => (b.weightedScore || 0) - (a.weightedScore || 0));

        // Mark winner
        calculated[0].isWinner = true;

        // Statistics for insights
        const winner = calculated[0];
        const averageCost = calculated.reduce((acc, c) => acc + c.cost, 0) / calculated.length;
        const savings = Math.max(0, averageCost - winner.cost);

        return { list: calculated, winner, savings, maxCost, averageCost, hasPriorities: (wCost + wSpeed + wRel) > 0 };

    }, [monthlyRequests, prioritizeCost, prioritizeSpeed, prioritizeReliability]);

    return (
        <Card
            className={cn(
                "relative transition-all duration-500 overflow-hidden border-border/50 shadow-sm flex flex-col h-full min-h-[600px]",
                isFullscreen
                    ? "fixed inset-0 z-50 h-[100vh] w-[100vw] rounded-none m-0 border-0 bg-background p-4 md:p-8 overflow-y-auto"
                    : "w-full hover:border-sidebar-accent"
            )}
        >
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px] pointer-events-none opacity-40" />

            <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-6 border-b border-border/40 bg-card/50 backdrop-blur-sm">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <IconCalculator className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <CardTitle className={cn("tracking-tight font-bold", isFullscreen ? "text-3xl" : "text-xl")}>
                                Smart Cost Calculator
                            </CardTitle>
                            <CardDescription className="text-xs mt-1">
                                Estimate and compare infrastructure costs based on your specific needs.
                            </CardDescription>
                        </div>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="shrink-0 rounded-md h-8 w-8 hover:bg-muted text-muted-foreground transition-colors">
                    {isFullscreen ? <IconMinimize className="h-4 w-4" /> : <IconMaximize className="h-4 w-4" />}
                </Button>
            </CardHeader>

            <CardContent className="relative z-10 p-0 flex-1 flex flex-col lg:flex-row">

                {/* Controls Panel */}
                <div className={cn("p-6 lg:p-8 space-y-8 border-b lg:border-b-0 lg:border-r border-border/40 bg-muted/10", "lg:w-[400px] shrink-0", isFullscreen ? "lg:w-[450px]" : "")}>

                    {/* Request Volume */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold tracking-wide text-foreground flex items-center gap-2">
                                <IconServer className="h-4 w-4 text-muted-foreground" />
                                Request Volume
                            </label>
                            <div className="font-mono text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                                {formatNumber(monthlyRequests[0])} <span className="text-xs text-muted-foreground font-normal ml-1">reqs/mo</span>
                            </div>
                        </div>
                        <Slider
                            value={monthlyRequests}
                            onValueChange={setMonthlyRequests}
                            max={1000000000}
                            min={100000}
                            step={100000}
                            className="w-full py-4"
                        />
                        <div className="flex justify-between text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                            <span>100k</span>
                            <span>1B+</span>
                        </div>
                    </div>

                    {/* Priorities */}
                    <div className="space-y-4 pt-4 border-t border-border/40">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                            Evaluation Criteria
                        </h4>
                        <div className="flex flex-col gap-3">
                            <div
                                className={cn(
                                    "flex items-start space-x-3 p-3 rounded-xl border transition-all cursor-pointer",
                                    prioritizeCost ? "bg-emerald-500/10 border-emerald-500/50" : "bg-card border-border hover:border-border/80"
                                )}
                                onClick={() => setPrioritizeCost(!prioritizeCost)}
                            >
                                <Checkbox id="cost" checked={prioritizeCost} onCheckedChange={(c) => setPrioritizeCost(c as boolean)} className="mt-1 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500" />
                                <div className="flex-1 space-y-1">
                                    <Label htmlFor="cost" className="font-medium text-sm cursor-pointer flex items-center gap-2">
                                        <IconCurrencyDollar className={cn("h-4 w-4", prioritizeCost ? "text-emerald-500" : "text-muted-foreground")} />
                                        Cost Efficiency
                                    </Label>
                                    <p className="text-[11px] text-muted-foreground leading-snug">
                                        Prioritize providers with the lowest cost per request.
                                    </p>
                                </div>
                            </div>

                            <div
                                className={cn(
                                    "flex items-start space-x-3 p-3 rounded-xl border transition-all cursor-pointer",
                                    prioritizeSpeed ? "bg-orange-500/10 border-orange-500/50" : "bg-card border-border hover:border-border/80"
                                )}
                                onClick={() => setPrioritizeSpeed(!prioritizeSpeed)}
                            >
                                <Checkbox id="speed" checked={prioritizeSpeed} onCheckedChange={(c) => setPrioritizeSpeed(c as boolean)} className="mt-1 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500" />
                                <div className="flex-1 space-y-1">
                                    <Label htmlFor="speed" className="font-medium text-sm cursor-pointer flex items-center gap-2">
                                        <IconBolt className={cn("h-4 w-4", prioritizeSpeed ? "text-orange-500" : "text-muted-foreground")} />
                                        Low Latency
                                    </Label>
                                    <p className="text-[11px] text-muted-foreground leading-snug">
                                        Favor providers with the fastest response times.
                                    </p>
                                </div>
                            </div>

                            <div
                                className={cn(
                                    "flex items-start space-x-3 p-3 rounded-xl border transition-all cursor-pointer",
                                    prioritizeReliability ? "bg-blue-500/10 border-blue-500/50" : "bg-card border-border hover:border-border/80"
                                )}
                                onClick={() => setPrioritizeReliability(!prioritizeReliability)}
                            >
                                <Checkbox id="reliability" checked={prioritizeReliability} onCheckedChange={(c) => setPrioritizeReliability(c as boolean)} className="mt-1 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500" />
                                <div className="flex-1 space-y-1">
                                    <Label htmlFor="reliability" className="font-medium text-sm cursor-pointer flex items-center gap-2">
                                        <IconShieldCheck className={cn("h-4 w-4", prioritizeReliability ? "text-blue-500" : "text-muted-foreground")} />
                                        Maximum Uptime
                                    </Label>
                                    <p className="text-[11px] text-muted-foreground leading-snug">
                                        Ensure the highest reliability scores.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recommendation Card */}
                    <div className="mt-auto pt-6">
                        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 p-5">
                            <div className="absolute top-0 right-0 p-3 opacity-10">
                                <IconCheck className="h-16 w-16 text-emerald-500" />
                            </div>
                            <h4 className="text-xs uppercase tracking-widest font-bold text-emerald-500 mb-2 flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Top Recommendation
                            </h4>
                            <div className="relative z-10">
                                <div className="text-lg font-bold text-foreground mb-1">{calculation.winner.name}</div>
                                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                                    Best match for your criteria.
                                    {calculation.savings > 0 ? (
                                        <span> Save <span className="font-mono font-bold text-emerald-500">${formatNumber(Math.round(calculation.savings))}</span>/mo vs average.</span>
                                    ) : (
                                        " Offers optimal value."
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results Panel */}
                <div className="flex-1 p-6 lg:p-8 overflow-y-auto bg-card">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            Provider Analysis
                            <Badge variant="secondary" className="text-[10px] font-normal px-1.5 py-0 h-5">Ranked by Score</Badge>
                        </h3>
                        <div className="text-right">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider block">Est. Monthly Cost</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {calculation.list.map((provider, index) => {
                            const widthPercentage = Math.max(5, (provider.weightedScore || 0));

                            return (
                                <div
                                    key={provider.id}
                                    className={cn(
                                        "group relative flex flex-col p-4 rounded-xl border transition-all duration-300",
                                        "hover:shadow-md hover:border-primary/20 hover:bg-muted/5",
                                        provider.isWinner
                                            ? "border-emerald-500/40 bg-emerald-500/[0.03] shadow-sm"
                                            : "border-border/40 bg-card"
                                    )}
                                >
                                    {/* Header Row */}
                                    <div className="flex items-center justify-between mb-3 relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold border",
                                                index === 0 ? "bg-emerald-500 text-white border-emerald-500" : "bg-muted text-muted-foreground border-transparent"
                                            )}>
                                                {index + 1}
                                            </div>
                                            <span className={cn("font-bold text-sm", provider.isWinner && "text-emerald-500")}>{provider.name}</span>
                                            {provider.isWinner && (
                                                <Badge className="h-4 text-[9px] bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20 px-1.5">
                                                    WINNER
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <span className={cn(
                                                "font-mono font-bold text-base",
                                                provider.isWinner ? "text-emerald-500" : "text-foreground"
                                            )}>
                                                ${provider.cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Score Bar */}
                                    <div className="relative h-2 w-full bg-muted/40 rounded-full overflow-hidden mb-3">
                                        <div
                                            className={cn(
                                                "absolute top-0 left-0 h-full rounded-full transition-all duration-700 ease-out",
                                                provider.isWinner ? "bg-emerald-500" : "bg-primary/40 group-hover:bg-primary/60"
                                            )}
                                            style={{ width: `${widthPercentage}%` }}
                                        />
                                    </div>

                                    {/* Footer / Stats */}
                                    <div className="flex items-center justify-between text-[11px] text-muted-foreground/80">
                                        <div className="flex items-center gap-4">
                                            <span className="flex items-center gap-1.5">
                                                <div className="h-1.5 w-1.5 rounded-full bg-orange-500/70" />
                                                Speed: <span className="font-mono text-foreground">{provider.latencyScore}</span>
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500/70" />
                                                Rel: <span className="font-mono text-foreground">{provider.reliabilityScore}</span>
                                            </span>
                                        </div>
                                        <div className="font-medium text-xs opacity-75 group-hover:opacity-100 transition-opacity">
                                            {provider.freeTier}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </CardContent>
        </Card>
    );
}
