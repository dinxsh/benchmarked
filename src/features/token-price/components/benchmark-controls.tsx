'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2, Play, Settings2, Filter, X } from 'lucide-react';
import { TokenPriceBenchmarkMode } from '@/lib/benchmark-types';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';

const TOKEN_SUGGESTIONS = [
    { symbol: 'WETH', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' },
    { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
    { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
    { symbol: 'WBTC', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' },
    { symbol: 'DAI', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F' },
    { symbol: 'UNI', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984' },
    { symbol: 'LINK', address: '0x514910771AF9Ca656af840dff83E8264EcF986CA' },
    { symbol: 'AAVE', address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9' },
    { symbol: 'PEPE', address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933' },
    { symbol: 'SHIB', address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE' },
    { symbol: 'CRV', address: '0xD533a949740bb3306d119CC777fa900bA034cd52' },
    { symbol: 'MKR', address: '0x9f8F72aA9304c8B593d555F12ef6589cC3a579A2' }
];

interface BenchmarkControlsProps {
    onRun: (config: { token: string; network: string; mode: string }) => void;
    loading: boolean;
    providerNames?: string[]; // List of providers to filter
    onFilterChange?: (selected: string[]) => void;
}

export function BenchmarkControls({ onRun, loading, providerNames = [], onFilterChange }: BenchmarkControlsProps) {
    const [tokenInput, setTokenInput] = useState('');
    const [network, setNetwork] = useState('eth-mainnet');
    const [mode, setMode] = useState<TokenPriceBenchmarkMode>(TokenPriceBenchmarkMode.PRICE_ONLY);
    const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    // Initialize selection when names are loaded
    if (providerNames.length > 0 && selectedProviders.length === 0 && !selectedProviders.includes('All')) {
        // Default to all selected (handled by parent usually, but good to have state reflect it)
        // Actually, let's keep selectedProviders empty to mean "ALL".
    }

    const validateInput = (input: string) => {
        if (!input) return null;
        // Simple regex for EVM address
        const isAddress = /^0x[a-fA-F0-9]{40}$/.test(input);
        // Check if it's a known symbol (rough check)
        const isSymbol = /^[a-zA-Z0-9]{2,8}$/.test(input);

        if (!isAddress && !isSymbol) {
            return "Invalid format. Use 0x Address or Symbol.";
        }
        return null;
    };

    const handleRun = () => {
        const error = validateInput(tokenInput);
        if (error) {
            setValidationError(error);
            return;
        }
        setValidationError(null);
        onRun({ token: tokenInput, network, mode });
    };

    const handleTokenChipClick = (address: string) => {
        setTokenInput(address);
        setValidationError(null);
    };

    const toggleProvider = (name: string) => {
        const current = selectedProviders.length === 0 ? [...providerNames] : selectedProviders; // If empty, assume all were active

        let next;
        if (current.includes(name)) {
            next = current.filter(n => n !== name);
        } else {
            next = [...current, name];
        }

        // If all filtered out, keep at least one or allow empty? Let's allow empty but maybe warn.
        setSelectedProviders(next);
        onFilterChange?.(next);
    };

    const selectAllProviders = () => {
        setSelectedProviders([]); // Empty means ALL
        onFilterChange?.([]);
    };

    const isFiltered = selectedProviders.length > 0 && selectedProviders.length < providerNames.length;

    return (
        <Card className="border border-border/40 shadow-sm relative overflow-hidden bg-card/50">
            <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                            <Settings2 className="w-4 h-4 text-foreground/70" />
                            Benchmark Configuration
                        </CardTitle>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
                {/* Main Controls Row */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col lg:flex-row gap-4 lg:items-end w-full">
                        {/* Token Input with integrated suggestions */}
                        <div className="flex-1 space-y-1.5 min-w-[350px]">
                            <div className="flex justify-between items-center w-full">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 whitespace-nowrap mr-4">
                                    Target Token
                                </label>
                                <div className="hidden lg:flex flex-1 gap-1 overflow-x-auto pb-1 justify-end [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                    {TOKEN_SUGGESTIONS.map((token) => (
                                        <Badge
                                            key={token.symbol}
                                            variant="outline"
                                            className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors text-[9px] h-4 px-1.5 border-border/40 text-muted-foreground whitespace-nowrap flex-shrink-0"
                                            onClick={() => handleTokenChipClick(token.address)}
                                        >
                                            {token.symbol}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                            <div className="relative">
                                <Input
                                    placeholder="Contract Address OR Symbol..."
                                    value={tokenInput}
                                    onChange={(e) => {
                                        setTokenInput(e.target.value);
                                        if (validationError) setValidationError(null);
                                    }}
                                    className={`font-mono text-sm pl-3 h-10 border-border/60 focus-visible:ring-primary/20 bg-background/50 w-full ${validationError ? 'border-red-500/50 focus-visible:ring-red-500/20' : ''}`}
                                />
                                {tokenInput && (
                                    <button
                                        onClick={() => setTokenInput('')}
                                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            {validationError && (
                                <p className="text-[10px] text-red-500 font-medium absolute -bottom-5 left-0 animate-in fade-in slide-in-from-top-1">
                                    {validationError}
                                </p>
                            )}
                        </div>

                        {/* Network Selector */}
                        <div className="space-y-1.5 w-full lg:w-[180px]">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                                Network
                            </label>
                            <Select value={network} onValueChange={setNetwork}>
                                <SelectTrigger className="h-10 border-border/60 bg-background/50">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="eth-mainnet">Ethereum</SelectItem>
                                    <SelectItem value="polygon-mainnet">Polygon</SelectItem>
                                    <SelectItem value="arbitrum-mainnet">Arbitrum</SelectItem>
                                    <SelectItem value="optimism-mainnet">Optimism</SelectItem>
                                    <SelectItem value="base-mainnet">Base</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Mode Selector */}
                        <div className="space-y-1.5 w-full lg:w-[160px]">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                                Mode
                            </label>
                            <Select value={mode} onValueChange={(v) => setMode(v as TokenPriceBenchmarkMode)}>
                                <SelectTrigger className="h-10 border-border/60 bg-background/50">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={TokenPriceBenchmarkMode.PRICE_ONLY}>Price Only</SelectItem>
                                    <SelectItem value={TokenPriceBenchmarkMode.FULL_DATA}>Full Data</SelectItem>
                                    <SelectItem value={TokenPriceBenchmarkMode.HISTORICAL}>Historical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Action Buttons */}
                        <div className="w-full lg:w-[180px]">
                            <Button
                                onClick={handleRun}
                                disabled={loading || !tokenInput}
                                className="w-full h-10 font-semibold shadow-sm"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Running
                                    </>
                                ) : (
                                    <>
                                        <Play className="mr-2 h-4 w-4 fill-current" />
                                        Run Benchmark
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Mobile Only: Extra Suggestions */}
                    <div className="lg:hidden flex flex-wrap gap-1.5">
                        {TOKEN_SUGGESTIONS.map((token) => (
                            <Badge
                                key={token.symbol}
                                variant="outline"
                                className="cursor-pointer hover:bg-muted text-[10px] px-2 py-0.5 border-border/40"
                                onClick={() => handleTokenChipClick(token.address)}
                            >
                                {token.symbol}
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Filter Toggle Section */}
                {providerNames && providerNames.length > 0 && (
                    <div className="pt-2">
                        <div className="flex items-center gap-2 mb-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-xs font-medium text-muted-foreground hover:text-foreground -ml-2"
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <Filter className="w-3.5 h-3.5 mr-1.5" />
                                {showFilters ? 'Hide Filters' : 'Filter Results'}
                                {isFiltered && <Badge variant="default" className="ml-2 h-5 px-1.5 text-[10px]">{selectedProviders.length}</Badge>}
                            </Button>
                            <Separator className="flex-1 opacity-50" />
                        </div>

                        {showFilters && (
                            <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-1 duration-200 bg-muted/30 p-3 rounded-lg border border-border/50">
                                <Toggle
                                    pressed={selectedProviders.length === 0}
                                    onPressedChange={selectAllProviders}
                                    size="sm"
                                    className="data-[state=on]:bg-foreground data-[state=on]:text-background text-xs font-medium h-7 px-3"
                                >
                                    All Providers
                                </Toggle>
                                {providerNames.map((name) => {
                                    // Logic: if selectedProviders is empty, ALL are selected implicitly. 
                                    // To show visual toggle state correctly:
                                    // If list empty -> ALL active.
                                    // If list has items -> Only those active.
                                    const isActive = selectedProviders.length === 0 || selectedProviders.includes(name);

                                    return (
                                        <Toggle
                                            key={name}
                                            pressed={isActive}
                                            onPressedChange={() => toggleProvider(name)}
                                            size="sm"
                                            variant="outline"
                                            className="data-[state=on]:bg-primary/10 data-[state=on]:border-primary/30 data-[state=on]:text-primary text-xs h-7 px-3 border-dashed data-[state=on]:border-solid"
                                        >
                                            {name}
                                        </Toggle>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
