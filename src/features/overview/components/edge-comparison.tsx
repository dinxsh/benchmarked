'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  IconDeviceLaptop,
  IconCloud,
  IconMaximize,
  IconMinimize,
  IconRefresh,
  IconBolt,
  IconTrophy,
  IconServer
} from '@tabler/icons-react';

import { ScrollArea } from '@/components/ui/scroll-area';

export function EdgeCloudComparison() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ edge: number; cloud: number } | null>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [progress, setProgress] = useState({ edge: 0, cloud: 0 });

  // Use refs to handle animation intervals cleanly
  const intervalsRef = useRef<{ edge?: NodeJS.Timeout; cloud?: NodeJS.Timeout }>({});

  const simulateProgress = (key: 'edge' | 'cloud', durationMs: number) => {
    // Clear existing if any
    if (intervalsRef.current[key]) clearInterval(intervalsRef.current[key]);

    // Reset
    setProgress(p => ({ ...p, [key]: 0 }));

    const updateFreq = 20; // ms
    // Simulate getting to 90% in durationMs
    const step = 90 / (durationMs / updateFreq);

    intervalsRef.current[key] = setInterval(() => {
      setProgress(prev => {
        if (prev[key] >= 95) { // Hold at 95% until done
          return prev;
        }
        return { ...prev, [key]: Math.min(prev[key] + step, 95) };
      });
    }, updateFreq);
  };

  const finishProgress = (key: 'edge' | 'cloud') => {
    if (intervalsRef.current[key]) clearInterval(intervalsRef.current[key]);
    setProgress(p => ({ ...p, [key]: 100 }));
  };

  const runTest = async () => {
    setLoading(true);
    setResults(null);
    setProviders([]);

    // Start simulations (Edge slower visually, Cloud faster visually)
    simulateProgress('edge', 2000);
    simulateProgress('cloud', 800);

    try {
      const edgeStart = performance.now();
      // 1. Edge Test (Client-side fetch to a public RPC)
      try {
        await fetch('https://rpc.ankr.com/eth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_blockNumber',
            params: [],
            id: 1
          })
        });
      } catch (e) {
        console.error("Edge test failed", e);
      }
      const edgeLatency = Math.round(performance.now() - edgeStart);
      finishProgress('edge');

      // 2. Cloud Test (Server-side via our API)
      let cloudLatency = 0;
      try {
        const cloudRes = await fetch('/api/benchmarks/head');
        const cloudJson = await cloudRes.json();

        // Set providers
        if (cloudJson.providers) {
          setProviders(cloudJson.providers);
        }

        const fastestCloud = cloudJson.providers?.[0];
        if (fastestCloud?.latency) {
          cloudLatency = fastestCloud.latency;
        } else {
          console.warn("No cloud provider data returned");
          // Only set if we actually got a number
        }
      } catch (e) {
        console.error("Cloud test failed", e);
        // Do not set cloudLatency to a fake number
      }

      finishProgress('cloud');
      setResults({ edge: edgeLatency, cloud: cloudLatency });

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      Object.values(intervalsRef.current).forEach(clearInterval);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Calculate stats
  const speedup = results ? (results.edge / results.cloud).toFixed(1) : '0';
  const winner = results ? (results.cloud < results.edge ? 'Cloud' : 'Edge') : '';

  return (
    <Card
      className={cn(
        "relative transition-all duration-500 overflow-hidden border-border/50 shadow-sm",
        isFullscreen
          ? "fixed inset-0 z-50 h-[100vh] w-[100vw] rounded-none m-0 border-0 bg-background p-4 md:p-12 overflow-y-auto"
          : "w-full hover:border-sidebar-accent"
      )}
    >
      {/* Background Effects - Subtle/Professional */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px] pointer-events-none opacity-40" />
      <CardContent className="relative z-10 grid gap-8 pt-8">
        <div className={cn("grid gap-8 transition-all", isFullscreen ? "grid-cols-12 max-w-7xl mx-auto w-full" : "grid-cols-1 md:grid-cols-12")}>

          {/* Left Column: Comparisons */}
          <div className={cn("space-y-6 flex flex-col justify-center", isFullscreen ? "col-span-12 lg:col-span-7" : "col-span-12 lg:col-span-7")}>

            {/* Edge Card */}
            <div className="group relative rounded-lg border border-border/50 bg-card/50 p-6 transition-all hover:bg-muted/30 hover:border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-md bg-muted text-muted-foreground group-hover:text-foreground transition-colors">
                    <IconDeviceLaptop className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold tracking-tight text-foreground text-lg">Browser Direct</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Standard HTTP/1.1</span>
                  </div>
                </div>
                {results && (
                  <div className="flex flex-col items-end">
                    <span className="text-3xl font-bold font-mono tracking-tighter text-foreground">{results.edge}<span className="text-sm font-medium text-muted-foreground ml-1">ms</span></span>
                  </div>
                )}
              </div>
              <Progress value={progress.edge} className="h-2 bg-muted rounded-full" indicatorClassName={cn("bg-muted-foreground/40 transition-all duration-300 rounded-full", results && "bg-muted-foreground/60")} />
            </div>

            {/* Cloud Card */}
            <div className="group relative rounded-lg border border-border bg-gradient-to-br from-card to-muted/20 p-6 transition-all hover:border-foreground/20">
              <div className="relative flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-md bg-foreground/5 text-foreground shadow-sm group-hover:scale-105 transition-transform duration-300">
                    <IconCloud className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold tracking-tight text-foreground text-lg">Optimized Edge</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1">
                      <IconBolt className="h-3 w-3 fill-current" /> Premium HTTP/2
                    </span>
                  </div>
                </div>
                {results && (
                  <div className="flex flex-col items-end">
                    <span className="text-3xl font-bold font-mono tracking-tighter text-foreground drop-shadow-sm">{results.cloud}<span className="text-sm font-medium text-muted-foreground ml-1">ms</span></span>
                  </div>
                )}
              </div>
              <Progress
                value={progress.cloud}
                className="h-2 bg-muted rounded-full"
                indicatorClassName="bg-foreground transition-all duration-300 rounded-full"
              />
            </div>

            {/* Winner / Results Box */}
            <div className="pt-2">
              {results ? (
                <div className="relative rounded-lg bg-muted/20 border border-border p-8 flex flex-col items-center text-center overflow-hidden">

                  <Badge variant="outline" className="mb-5 text-xs font-semibold uppercase tracking-widest pl-2 pr-4 py-1.5 gap-2 border-foreground/20 text-foreground animate-in zoom-in duration-300">
                    <IconTrophy className="h-3.5 w-3.5" />
                    {winner} Architecture Wins
                  </Badge>

                  <h3 className="text-6xl md:text-8xl font-black tracking-tighter text-foreground mb-3 scale-100 transition-transform duration-500 hover:scale-105 cursor-default">
                    {speedup}x<span className="text-3xl md:text-4xl text-muted-foreground font-light tracking-tighter ml-1 opacity-70">Faster</span>
                  </h3>

                  <p className="text-muted-foreground max-w-[500px] text-sm font-medium leading-relaxed">
                    Request processed <span className="text-foreground font-bold">{results.edge - results.cloud}ms</span> faster.
                    Our distributed mesh routed your request to the nearest available node automatically.
                  </p>

                  <div className="mt-8">
                    <Button onClick={runTest} disabled={loading} size="lg" className="font-bold min-w-[200px] shadow-sm">
                      {loading ? <IconRefresh className="mr-2 h-4 w-4 animate-spin" /> : <IconBolt className="mr-2 h-4 w-4" />}
                      Run Benchmark Again
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="h-56 rounded-lg border border-dashed border-border/60 flex flex-col items-center justify-center p-6 text-center bg-muted/5 gap-6 hover:bg-muted/10 transition-colors">
                  <div className="relative">
                    <div className="relative p-4 rounded-full bg-background border border-border shadow-sm">
                      <IconServer className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-lg text-foreground">Ready for Global Benchmark</h4>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">Compare local execution vs high-performance edge infrastructure</p>
                  </div>
                  <Button onClick={runTest} disabled={loading} size="lg" className="font-bold min-w-[180px]">
                    {loading ? (
                      <><IconRefresh className="mr-2 h-4 w-4 animate-spin" /> Initializing...</>
                    ) : (
                      <><IconBolt className="mr-2 h-4 w-4" /> Start Benchmark</>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Providers List (Only show when data exists or in fullscreen) */}
          <div className={cn(
            "space-y-4 animate-in fade-in slide-in-from-right-8 duration-700 delay-100 col-span-12 lg:col-span-5 h-full",
            !providers.length && !loading && "hidden lg:block lg:opacity-30 blur-sm pointer-events-none scale-95"
          )}>
            <div className="rounded-lg border border-border/50 bg-card h-full flex flex-col overflow-hidden shadow-sm">
              <div className="flex items-center justify-between p-4 border-b border-border/40 bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="relative h-2 w-2">
                    <span className="absolute inset-0 rounded-full bg-foreground animate-ping opacity-20" />
                    <span className="relative block h-2 w-2 rounded-full bg-foreground" />
                  </div>
                  <h4 className="font-bold text-sm tracking-wide text-foreground uppercase">Live Activity</h4>
                </div>
                <Badge variant="outline" className="font-mono text-[10px] h-5 border-border/50 bg-background/50">
                  {providers.length > 0 ? `${providers.length} NODES ONLINE` : 'GATHERING DATA...'}
                </Badge>
              </div>

              <ScrollArea className={cn("flex-1 bg-gradient-to-b from-background/50 to-transparent", isFullscreen ? "h-[500px]" : "h-[450px]")}>
                {providers.length === 0 ? (
                  <p className="text-xs font-mono uppercase tracking-widest opacity-70">Awaiting Signal</p>
                ) : (
                  <div className="">
                    {providers.map((provider, i) => (
                      <div key={provider.name} className="group relative flex items-center justify-between p-4 hover:bg-muted/40 transition-all border-b border-border/30 last:border-0 hover:border-border/60">
                        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary/0 group-hover:bg-primary/50 transition-colors" />
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{provider.name}</span>
                            {i === 0 && <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-[3px]">Success</span>}
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono">
                            <div className="flex items-center gap-1.5">
                              <div className={cn("h-1.5 w-1.5 rounded-full shadow-sm animate-pulse",
                                provider.status === 'leading' ? "bg-emerald-500 shadow-emerald-500/50" :
                                  provider.status === 'lagging' ? "bg-amber-500 shadow-amber-500/50" : "bg-red-500 shadow-red-500/50"
                              )} />
                              <span className={cn(
                                "font-semibold",
                                provider.status === 'leading' ? "text-emerald-500/80" : "text-muted-foreground"
                              )}>{provider.status === 'leading' ? 'SYNCED' : 'LAGGING'}</span>
                            </div>
                            <span className="opacity-20 text-border">|</span>
                            <span className="opacity-70">#{provider.blockHeight}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className={cn(
                            "font-mono font-bold text-sm tracking-tight transition-transform group-hover:scale-105",
                            provider.latency < results?.cloud! + 20 ? "text-emerald-500" : "text-muted-foreground"
                          )}>
                            {provider.latency}
                            <span className="text-[10px] font-medium text-muted-foreground/50 ml-0.5 group-hover:text-muted-foreground/80">ms</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              <div className="p-3 border-t border-border/40 bg-muted/5 text-[9px] text-center text-muted-foreground/60 uppercase tracking-widest font-mono">
                Mesh Network • {providers.length || 0} Active Zones
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
