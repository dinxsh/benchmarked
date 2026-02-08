'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Loader2, Zap, Activity, TrendingUp, Award, Clock, CheckCircle2, AlertCircle, BarChart3, Gauge, Radio } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  Legend
} from 'recharts';

interface StreamingMetrics {
  connection_latency: number;
  first_data_latency: number;
  throughput: number;
  message_count: number;
  connection_drops: number;
  reconnection_count: number;
  data_completeness: number;
  uptime_percent: number;
  average_message_size: number;
  error_rate: number;
}

interface ProviderResult {
  provider: {
    id: string;
    name: string;
    logo: string;
    color: string;
  };
  status: string;
  metrics: StreamingMetrics;
  testDuration: number;
  error?: string;
}

interface BenchmarkResponse {
  success: boolean;
  results: ProviderResult[];
  stats: {
    fastestProvider: { name: string; latency: number } | null;
    mostReliableProvider: { name: string; uptime: number } | null;
    highestThroughputProvider: { name: string; throughput: number } | null;
    averageLatency: number;
    averageThroughput: number;
    averageUptime: number;
  };
  summary: {
    totalProviders: number;
    successfulTests: number;
  };
}

const PROVIDER_COLORS: Record<string, string> = {
  'goldrush-streaming': '#FFD700',
  'zerion': '#9333EA',
  'alchemy-ws': '#3B82F6',
  'infura-ws': '#EF4444',
  'quicknode-ws': '#06B6D4',
  'ankr-ws': '#10B981',
};

export default function StreamingBenchmarkPage() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<BenchmarkResponse | null>(null);
  const [duration, setDuration] = useState(30000);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkTheme = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const runBenchmark = async () => {
    setLoading(true);
    setProgress(0);
    setResults(null);

    try {
      const response = await fetch(
        `/api/benchmarks/streaming?network=ethereum&streamType=newBlocks&duration=${duration}&expectedRate=10`
      );
      const data = await response.json();
      setResults(data);
      setProgress(100);
    } catch (error) {
      console.error('Benchmark failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loading && progress < 95) {
      const timer = setInterval(() => {
        setProgress((prev) => Math.min(prev + 1, 95));
      }, duration / 95);
      return () => clearInterval(timer);
    }
  }, [loading, duration, progress]);

  const sortedResults = results?.results
    .filter((r) => r.status === 'success')
    .sort((a, b) => a.metrics.connection_latency - b.metrics.connection_latency) || [];

  const getPerformanceScore = (result: ProviderResult) => {
    const latencyScore = Math.max(0, 100 - (result.metrics.connection_latency / 5));
    const throughputScore = Math.min(100, result.metrics.throughput * 8);
    const uptimeScore = result.metrics.uptime_percent;
    return Math.round((latencyScore + throughputScore + uptimeScore) / 3);
  };

  const radialChartData = sortedResults.map((r, idx) => ({
    name: r.provider.name.replace(' WebSocket', '').replace(' Streaming', ''),
    score: getPerformanceScore(r),
    fill: PROVIDER_COLORS[r.provider.id] || '#6B7280'
  }));

  const chartColors = sortedResults.map(r => PROVIDER_COLORS[r.provider.id] || '#6B7280');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-6 lg:p-8 space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-background border border-primary/20 p-6 md:p-8">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Radio className="h-6 w-6 text-primary" />
            </div>
            <Badge variant="outline" className="gap-1.5">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Live Benchmark
            </Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
            Streaming API Performance
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Real-time WebSocket performance analysis across {results?.summary.totalProviders || 6} providers
          </p>
        </div>
      </div>

      {/* Control Panel */}
      <Card className="border-muted/40 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4" />
                Test Duration
              </div>
              <div className="flex flex-wrap gap-2">
                {[10, 20, 30, 60].map((sec) => (
                  <Button
                    key={sec}
                    variant={duration === sec * 1000 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDuration(sec * 1000)}
                    disabled={loading}
                    className="min-w-[80px] font-mono"
                  >
                    {sec}s
                  </Button>
                ))}
              </div>
            </div>

            <Button
              onClick={runBenchmark}
              disabled={loading}
              size="lg"
              className="w-full lg:w-auto min-w-[200px] h-12 text-base font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Running Test
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-5 w-5" />
                  Start Benchmark
                </>
              )}
            </Button>
          </div>

          {loading && (
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Testing providers...</span>
                <span className="font-mono font-semibold">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {results && (
        <>
          {/* Live Metrics Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Tests */}
            <Card className="border-muted/40 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                  <Badge variant="outline">{results.summary.successfulTests}/{results.summary.totalProviders}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Tests Completed</p>
                  <p className="text-3xl font-bold">{results.summary.successfulTests}</p>
                </div>
                <Progress
                  value={(results.summary.successfulTests / results.summary.totalProviders) * 100}
                  className="mt-3 h-1.5"
                />
              </CardContent>
            </Card>

            {/* Fastest Provider */}
            <Card className="border-muted/40 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-yellow-500/5 to-background">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Fastest</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Connection Speed</p>
                  <p className="text-2xl font-bold truncate">
                    {results.stats.fastestProvider?.name.replace(' Streaming', '') || 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {results.stats.fastestProvider ? `${Math.round(results.stats.fastestProvider.latency)}ms` : '-'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Most Reliable */}
            <Card className="border-muted/40 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-green-500/5 to-background">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Reliable</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Best Uptime</p>
                  <p className="text-2xl font-bold truncate">
                    {results.stats.mostReliableProvider?.name.replace(' Streaming', '') || 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {results.stats.mostReliableProvider ? `${results.stats.mostReliableProvider.uptime.toFixed(1)}%` : '-'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Highest Throughput */}
            <Card className="border-muted/40 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-blue-500/5 to-background">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Throughput</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Messages/Sec</p>
                  <p className="text-2xl font-bold truncate">
                    {results.stats.highestThroughputProvider?.name.replace(' Streaming', '') || 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {results.stats.highestThroughputProvider ? `${results.stats.highestThroughputProvider.throughput.toFixed(2)}` : '-'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Dashboard Layout */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Provider Cards */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Provider Performance
                </h2>
                <Badge variant="outline" className="font-mono">
                  {sortedResults.length} providers
                </Badge>
              </div>

              {sortedResults.map((result, index) => {
                const score = getPerformanceScore(result);
                const color = PROVIDER_COLORS[result.provider.id] || '#6B7280';

                return (
                  <Card
                    key={result.provider.id}
                    className={`border-muted/40 shadow-lg hover:shadow-xl transition-all hover:scale-[1.01] ${
                      index === 0 ? 'ring-2 ring-primary/20' : ''
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {index === 0 && <Award className="h-5 w-5 text-yellow-500" />}
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{result.provider.logo}</span>
                            <div>
                              <h3 className="font-semibold text-lg">{result.provider.name}</h3>
                              <p className="text-xs text-muted-foreground">Rank #{index + 1}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold" style={{ color }}>
                            {score}
                          </div>
                          <p className="text-xs text-muted-foreground">Score</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Latency</p>
                          <p className="text-lg font-mono font-semibold">
                            {Math.round(result.metrics.connection_latency)}ms
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Throughput</p>
                          <p className="text-lg font-mono font-semibold">
                            {result.metrics.throughput.toFixed(1)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Messages</p>
                          <p className="text-lg font-mono font-semibold">
                            {result.metrics.message_count}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Uptime</p>
                          <p className="text-lg font-mono font-semibold">
                            {result.metrics.uptime_percent.toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Reliability</span>
                          <span className="font-mono">{result.metrics.uptime_percent.toFixed(0)}%</span>
                        </div>
                        <Progress value={result.metrics.uptime_percent} className="h-2" style={{
                          ['--progress-background' as any]: color
                        }} />

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Data Quality</span>
                          <span className="font-mono">{(100 - result.metrics.error_rate).toFixed(0)}%</span>
                        </div>
                        <Progress value={100 - result.metrics.error_rate} className="h-2" />
                      </div>

                      {result.metrics.connection_drops > 0 && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-orange-500">
                          <AlertCircle className="h-3 w-3" />
                          {result.metrics.connection_drops} connection drop(s)
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Right Column - Stats & Charts */}
            <div className="space-y-6">
              {/* Overall Performance Gauge */}
              <Card className="border-muted/40 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Gauge className="h-5 w-5" />
                    Performance Scores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadialBarChart
                      innerRadius="10%"
                      outerRadius="100%"
                      data={radialChartData}
                      startAngle={180}
                      endAngle={0}
                    >
                      <RadialBar
                        background
                        dataKey="score"
                        cornerRadius={10}
                      />
                      <Legend
                        iconSize={10}
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                        wrapperStyle={{ fontSize: '12px' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? 'hsl(240 10% 3.9%)' : 'hsl(0 0% 100%)',
                          border: '1px solid hsl(240 5.9% 90%)',
                          borderRadius: '8px',
                        }}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Latency Comparison */}
              <Card className="border-muted/40 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Latency Comparison</CardTitle>
                  <CardDescription>Connection time (ms)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                      data={sortedResults.map(r => ({
                        name: r.provider.name.replace(' WebSocket', '').replace(' Streaming', '').substring(0, 8),
                        value: Math.round(r.metrics.connection_latency)
                      }))}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#e5e7eb'} horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={70} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? 'hsl(240 10% 3.9%)' : 'hsl(0 0% 100%)',
                          border: '1px solid hsl(240 5.9% 90%)',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {sortedResults.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PROVIDER_COLORS[entry.provider.id] || '#6B7280'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Network Stats */}
              <Card className="border-muted/40 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Network Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Avg Latency</span>
                      <span className="font-mono font-semibold">{Math.round(results.stats.averageLatency)}ms</span>
                    </div>
                    <Progress value={Math.min(100, (200 - results.stats.averageLatency) / 2)} className="h-1.5" />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Avg Throughput</span>
                      <span className="font-mono font-semibold">{results.stats.averageThroughput.toFixed(2)} msg/s</span>
                    </div>
                    <Progress value={Math.min(100, results.stats.averageThroughput * 10)} className="h-1.5" />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Avg Uptime</span>
                      <span className="font-mono font-semibold">{results.stats.averageUptime.toFixed(1)}%</span>
                    </div>
                    <Progress value={results.stats.averageUptime} className="h-1.5" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      {!results && !loading && (
        <Card className="border-dashed border-2 border-muted/40">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="rounded-full bg-muted/50 p-6 mb-6">
              <Activity className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Ready to benchmark</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Click &quot;Start Benchmark&quot; to test streaming performance across all providers
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>6 providers ready</span>
              <span>•</span>
              <span>WebSocket protocol</span>
              <span>•</span>
              <span>Real-time metrics</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
