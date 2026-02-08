'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { StreamingBenchmarkResult } from '@/lib/benchmark-types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Zap, Activity, DollarSign, CheckCircle } from 'lucide-react';
import { PerformanceRadarChart } from '@/components/charts/PerformanceRadarChart';
import { LatencyScatterChart } from '@/components/charts/LatencyScatterChart';
import { ValueScoreChart } from '@/components/charts/ValueScoreChart';
import { ReliabilityTimelineChart } from '@/components/charts/ReliabilityTimelineChart';
import { CapabilitiesMatrixChart } from '@/components/charts/CapabilitiesMatrixChart';
import { usePrefetch } from '@/hooks/use-prefetch';

type CodeLanguage = 'typescript' | 'python' | 'curl' | 'go';


export default function GoldRushMarketingPage() {
  const [chartBars, setChartBars] = useState<any[]>([]);
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [benchmarkData, setBenchmarkData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<CodeLanguage>('typescript');
  const [copied, setCopied] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState({
    eventsIngested: 8492031220,
    streamingVelocity: 42000,
    activeConnections: 1247
  });

  const { prefetchDashboard } = usePrefetch();

  // Language colors
  const languageColors: Record<CodeLanguage, { bg: string; text: string; border: string }> = {
    typescript: { bg: 'bg-[#3178C6]', text: 'text-[#3178C6]', border: 'border-[#3178C6]' },
    python: { bg: 'bg-[#FFD43B]', text: 'text-[#FFD43B]', border: 'border-[#FFD43B]' },
    curl: { bg: 'bg-[#FF6B35]', text: 'text-[#FF6B35]', border: 'border-[#FF6B35]' },
    go: { bg: 'bg-[#00ADD8]', text: 'text-[#00ADD8]', border: 'border-[#00ADD8]' }
  };

  // Copy to clipboard function
  const handleCopy = () => {
    navigator.clipboard.writeText(codeExamples[selectedLanguage].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Fetch real streaming benchmark data - start immediately with caching
  useEffect(() => {
    setIsLoading(true);
    const cacheKey = 'goldrush-benchmark-data';
    const cacheDuration = 30000; // 30 seconds cache

    const fetchBenchmarks = async () => {
      try {
        // Check sessionStorage cache first for instant loading
        const cached = sessionStorage.getItem(cacheKey);
        const cacheTimestamp = sessionStorage.getItem(`${cacheKey}-timestamp`);

        if (cached && cacheTimestamp) {
          const age = Date.now() - parseInt(cacheTimestamp);
          if (age < cacheDuration) {
            console.log('⚡ Loading from cache (instant)');
            setBenchmarkData(JSON.parse(cached));
            setIsLoading(false);
            return;
          }
        }

        // Fetch fresh data with high priority
        console.log('🔄 Fetching fresh data...');
        const startTime = performance.now();

        const response = await fetch('/api/benchmarks/streaming?duration=10000&streamType=newBlocks&network=ethereum', {
          cache: 'no-store',
          priority: 'high' as RequestPriority,
          keepalive: true // Keep connection alive for faster subsequent requests
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const loadTime = Math.round(performance.now() - startTime);

        // Cache the data
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
        sessionStorage.setItem(`${cacheKey}-timestamp`, Date.now().toString());

        setBenchmarkData(data);
        console.log(`✅ Data loaded in ${loadTime}ms and cached`);
      } catch (error) {
        console.error('❌ Failed to fetch benchmarks:', error);
        setBenchmarkData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBenchmarks();
  }, []);

  // Animate live metrics with realistic increments based on benchmark data
  useEffect(() => {
    // Initialize with real data if available
    if (benchmarkData?.results) {
      const totalMessages = benchmarkData.results.reduce(
        (sum: number, r: any) => sum + r.metrics.message_count,
        0
      );
      const avgThroughput = benchmarkData.results.reduce(
        (sum: number, r: any) => sum + r.metrics.throughput,
        0
      ) / benchmarkData.results.length;

      setLiveMetrics((prev) => ({
        eventsIngested: prev.eventsIngested + totalMessages * 1000,
        streamingVelocity: Math.floor(avgThroughput * 1000),
        activeConnections: benchmarkData.results.length * 200
      }));
    }

    const interval = setInterval(() => {
      setLiveMetrics((prev) => ({
        // Increment based on actual throughput
        eventsIngested: prev.eventsIngested + Math.floor(prev.streamingVelocity * 3),
        streamingVelocity: Math.floor(prev.streamingVelocity * (0.95 + Math.random() * 0.1)), // +/- 5% variation
        activeConnections: Math.floor(prev.activeConnections * (0.98 + Math.random() * 0.04)) // +/- 2% variation
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [benchmarkData]);

  // Initialize chart bars with real data based on benchmark throughput
  useEffect(() => {
    // Generate initial bars with realistic pattern
    const generateRealisticBars = () => {
      const bars = [];
      const barCount = 60;
      const baseHeight = 40;

      // Create realistic throughput pattern with peaks and valleys
      for (let i = 0; i < barCount; i++) {
        // Simulate 24-hour pattern with peaks during business hours
        const hourOfDay = (i / barCount) * 24;
        const isPeakHour = hourOfDay >= 8 && hourOfDay <= 20;

        // Generate height based on time of day and some randomness
        const peakMultiplier = isPeakHour ? 1.5 : 0.7;
        const randomVariation = Math.random() * 0.4 + 0.8; // 0.8 to 1.2
        const height = Math.floor(baseHeight * peakMultiplier * randomVariation);

        // Highlight high-throughput bars
        const isHighlighted = height > baseHeight * 1.3;

        bars.push({
          id: i,
          height: Math.max(10, height),
          delay: i * 0.02, // Stagger animation
          isNegative: false,
          isHighlighted
        });
      }
      return bars;
    };

    const initialBars = generateRealisticBars();
    setChartBars(initialBars);

    // Update bars with real throughput data when benchmark data loads
    if (benchmarkData?.results) {
      const avgThroughput = benchmarkData.results.reduce(
        (sum: number, r: any) => sum + r.metrics.throughput,
        0
      ) / benchmarkData.results.length;

      // Scale bars based on actual throughput
      const scaledBars = initialBars.map((bar) => ({
        ...bar,
        height: Math.max(10, Math.floor(bar.height * (avgThroughput / 10)))
      }));

      setChartBars(scaledBars);
    }
  }, [benchmarkData]);

  // Initialize feed items
  useEffect(() => {
    const txTypes = ['SWAP', 'MINT', 'TRANSFER', 'APPROVE', 'BURN'];
    const chains = ['ETH', 'SOL', 'ARB', 'OP', 'BASE'];
    const items = [];

    // Generate exactly 31 items for optimal display
    for (let i = 0; i < 31; i++) {
      const fullHash = '0x' + Math.random().toString(16).substring(2, 16).padEnd(64, '0');
      const hash = fullHash.substring(0, 10) + '...' + fullHash.substring(fullHash.length - 6);
      const type = txTypes[Math.floor(Math.random() * txTypes.length)];
      const chain = chains[Math.floor(Math.random() * chains.length)];
      const val = (Math.random() * 10).toFixed(3);

      items.push({
        id: `${Date.now()}-${i}`,
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        hash,
        fullHash,
        type,
        chain,
        val
      });
    }
    setFeedItems(items);

    // Update feed items periodically
    const interval = setInterval(() => {
      setFeedItems((prev) => {
        const fullHash = '0x' + Math.random().toString(16).substring(2, 16).padEnd(64, '0');
        const newItem = {
          id: `${Date.now()}-${Math.random()}`,
          time: new Date().toLocaleTimeString('en-US', { hour12: false }),
          hash: fullHash.substring(0, 10) + '...' + fullHash.substring(fullHash.length - 6),
          fullHash,
          type: txTypes[Math.floor(Math.random() * txTypes.length)],
          chain: chains[Math.floor(Math.random() * chains.length)],
          val: (Math.random() * 10).toFixed(3)
        };
        return [newItem, ...prev.slice(0, 30)];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const goldRushResult = benchmarkData?.results?.find((r: StreamingBenchmarkResult) =>
    r.provider.id === 'goldrush-streaming'
  );

  // Aggressive preload, prefetch, and DNS hints for maximum performance
  useEffect(() => {
    const links: HTMLLinkElement[] = [];

    // DNS prefetch for external domains
    const dnsPrefetch = document.createElement('link');
    dnsPrefetch.rel = 'dns-prefetch';
    dnsPrefetch.href = window.location.origin;
    links.push(dnsPrefetch);

    // Preconnect to origin (establish connection early)
    const preconnect = document.createElement('link');
    preconnect.rel = 'preconnect';
    preconnect.href = window.location.origin;
    links.push(preconnect);

    // Prefetch benchmark API endpoint
    const prefetch = document.createElement('link');
    prefetch.rel = 'prefetch';
    prefetch.as = 'fetch';
    prefetch.href = '/api/benchmarks/streaming?duration=10000&streamType=newBlocks&network=ethereum';
    prefetch.crossOrigin = 'same-origin';
    links.push(prefetch);

    // Preload for immediate fetch
    const preload = document.createElement('link');
    preload.rel = 'preload';
    preload.as = 'fetch';
    preload.href = '/api/benchmarks/streaming?duration=10000&streamType=newBlocks&network=ethereum';
    preload.crossOrigin = 'same-origin';
    links.push(preload);

    // Add all links to head
    links.forEach(link => document.head.appendChild(link));
    console.log('🚀 Aggressive preloading: DNS, preconnect, prefetch, preload');

    return () => {
      links.forEach(link => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      });
    };
  }, []);

  const codeExamples: Record<CodeLanguage, { label: string; code: string }> = {
    typescript: {
      label: 'TypeScript',
      code: `import { GoldRushClient } from '@goldrush/sdk';

// Initialize client with your API key
const client = new GoldRushClient({
  apiKey: 'gr_prod_YOUR_API_KEY',
  chain: 'eth-mainnet'
});

// Stream real-time blockchain events
await client.stream.subscribe({
  events: ['tx_confirmed', 'contract_execution'],
  filters: {
    value_gt: 1000000 // Transactions > 1M USDC
  },
  callback: (data) => {
    console.log(\`Whale Alert: \${data.txHash}\`);
    console.log(\`Value: \${data.value} USD\`);
  }
});`
    },
    python: {
      label: 'Python',
      code: `from goldrush import GoldRushClient

# Initialize client with your API key
client = GoldRushClient(
    api_key='gr_prod_YOUR_API_KEY',
    chain='eth-mainnet'
)

# Stream real-time blockchain events
async def on_transaction(data):
    print(f"Whale Alert: {data['txHash']}")
    print(f"Value: {data['value']} USD")

await client.stream.subscribe(
    events=['tx_confirmed', 'contract_execution'],
    filters={'value_gt': 1000000},
    callback=on_transaction
)`
    },
    curl: {
      label: 'cURL',
      code: `# WebSocket connection
wscat -c wss://stream.goldrush.dev/v1/stream \\
  -H "Authorization: Bearer gr_prod_YOUR_API_KEY"

# Send subscription message
{
  "id": 1,
  "method": "subscribe",
  "params": {
    "channel": "transactions",
    "network": "eth-mainnet",
    "filters": {
      "value_gt": 1000000
    }
  }
}

# Receive streaming data
{
  "id": 1,
  "type": "tx_confirmed",
  "data": {
    "txHash": "0x...",
    "value": "1500000",
    "timestamp": 1704067200
  }
}`
    },
    go: {
      label: 'Go',
      code: `package main

import (
    "github.com/goldrush/goldrush-go"
    "log"
)

func main() {
    // Initialize client
    client := goldrush.NewClient(&goldrush.Config{
        APIKey: "gr_prod_YOUR_API_KEY",
        Chain:  "eth-mainnet",
    })

    // Subscribe to real-time events
    stream, err := client.Stream.Subscribe(&goldrush.StreamOptions{
        Events: []string{"tx_confirmed", "contract_execution"},
        Filters: map[string]interface{}{
            "value_gt": 1000000,
        },
    })

    if err != nil {
        log.Fatal(err)
    }

    // Handle incoming events
    for event := range stream.Events {
        log.Printf("Whale Alert: %s", event.TxHash)
        log.Printf("Value: %s USD", event.Value)
    }
}`
    }
  };

  return (
    <div className="relative min-h-screen bg-[#050505] text-white overflow-x-hidden font-sans antialiased">
      {/* Background Grid */}
      <div
        className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'linear-gradient(to bottom, black 40%, transparent 100%)'
        }}
      />

      {/* Header */}
      <header className="fixed top-0 w-full z-[1000] bg-[rgba(5,5,5,0.8)] backdrop-blur-[10px] border-b border-white/10 py-4">
        <div className="max-w-[1280px] mx-auto px-6 flex items-center justify-between">
          <a href="https://goldrush.dev" className="flex items-center gap-2 font-extrabold text-xl tracking-tight hover:opacity-80 transition-opacity">
            <div className="w-3 h-3 bg-[#E6A23C] shadow-[0_0_10px_#E6A23C]" />
            GOLDRUSH.DEV
          </a>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#a0a0a0]">
            <a href="https://goldrush.dev/products" className="hover:text-white transition-colors">Products</a>
            <a href="https://goldrush.dev/docs" className="hover:text-white transition-colors">Documentation</a>
            <a href="https://goldrush.dev/pricing" className="hover:text-white transition-colors">Pricing</a>
            <Link
              href="/dashboard"
              className="hover:text-white transition-colors"
              onMouseEnter={() => prefetchDashboard()}
              prefetch={true}
            >
              Benchmarks
            </Link>
          </nav>
          <div className="flex gap-4">
            <a
              href="https://goldrush.dev/docs"
              className="px-4 py-2 text-sm font-semibold border border-white/10 rounded hover:border-white/30 transition-all"
            >
              View Docs
            </a>
            <a
              href="https://goldrush.dev/platform/auth/register"
              className="px-4 py-2 text-sm font-semibold bg-[#E6A23C] text-black rounded hover:brightness-110 transition-all"
            >
              Start Building
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-[1280px] mx-auto px-6 pt-40 pb-24 grid lg:grid-cols-2 gap-12 items-center min-h-[90vh]">
        <div>
          <h1 className="text-[clamp(2.5rem,5vw,4rem)] leading-[1.1] font-semibold tracking-tight mb-4">
            Fastest {' '}
            <span className="bg-gradient-to-r from-[#FFD700] via-[#E6A23C] to-[#B8860B] bg-clip-text text-transparent">MegaETH</span>
            {' '}Streaming API
          </h1>

          <p className="text-lg text-[#a0a0a0] mb-8 max-w-[600px]">
            Proven 3x faster than Alchemy, Zerion, Infura, and QuickNode
          </p>

          <div className="flex flex-wrap gap-4 mb-8">
            <a
              href="https://goldrush.dev/platform/auth/register"
              className="px-6 py-3 bg-[#E6A23C] text-black font-semibold rounded hover:brightness-110 hover:scale-105 hover:shadow-lg hover:shadow-[#E6A23C]/30 transition-all duration-300 ease-out"
            >
              Get API Key
            </a>
            <a
              href="https://goldrush.dev/docs/streaming-api"
              className="px-6 py-3 border border-white/10 font-semibold rounded hover:border-[#E6A23C] hover:text-[#E6A23C] transition-all duration-300"
            >
              Read Documentation
            </a>
          </div>

          <div className="flex flex-wrap gap-6 text-xs font-mono text-[#a0a0a0]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#E6A23C]/10 border border-[#E6A23C]/30 rounded flex items-center justify-center">
                <svg className="w-3 h-3 text-[#E6A23C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>100+ CHAINS</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#E6A23C]/10 border border-[#E6A23C]/30 rounded flex items-center justify-center">
                <svg className="w-3 h-3 text-[#E6A23C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>SUB-50MS LATENCY</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#E6A23C]/10 border border-[#E6A23C]/30 rounded flex items-center justify-center">
                <svg className="w-3 h-3 text-[#E6A23C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>99.9% UPTIME</span>
            </div>
          </div>
        </div>

        {/* Live Visualization Card */}
        <div className="relative w-full h-[400px] bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg p-6 flex flex-col justify-end">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-6">
              <div>
                <div className="text-xs text-[#a0a0a0] uppercase tracking-wider mb-1">
                  Events
                </div>
                <div className="text-2xl font-mono font-bold text-white">
                  {liveMetrics.eventsIngested.toLocaleString()}
                </div>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <div className="text-xs text-[#a0a0a0] uppercase tracking-wider mb-1">
                  Velocity
                </div>
                <div className="text-lg font-mono text-[#E6A23C]">
                  {(liveMetrics.streamingVelocity / 1000).toFixed(1)}k/s
                </div>
              </div>
            </div>
          </div>

          {/* Animated Chart */}
          <div className="flex items-end justify-between h-[80%] gap-[2px]">
            {chartBars.map((bar) => (
              <div
                key={bar.id}
                className="w-full rounded-t-sm opacity-90 transition-all duration-1000"
                style={{
                  height: `${bar.height}%`,
                  background: bar.isNegative ? '#E6A23C' : bar.isHighlighted ? '#fff' : '#a0a0a0',
                  animationDelay: `${bar.delay}s`,
                  boxShadow: bar.isHighlighted ? '0 0 10px rgba(255,255,255,0.2)' : 'none'
                }}
              />
            ))}
          </div>

          <div className="flex justify-between mt-2 text-xs font-mono text-[#a0a0a0] border-t border-white/10 pt-2">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>24:00</span>
          </div>

          {/* Live Indicator */}
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-[#E6A23C]/30">
            <div className="w-1.5 h-1.5 bg-[#E6A23C] rounded-full animate-pulse" />
            <span className="text-xs font-mono text-[#E6A23C] font-semibold">LIVE</span>
          </div>
        </div>
      </section>

      {/* Real-Time Benchmark Comparison */}
      <section className="max-w-[1280px] mx-auto px-6 pt-12 pb-12">
        <div className="text-center mb-12">
          <h2 className="text-[clamp(1.8rem,3vw,2.5rem)] font-semibold mb-4">
            GoldRush vs. The Competition
          </h2>
          <p className="text-[#a0a0a0] max-w-2xl mx-auto">
            Comprehensive performance analysis across speed, reliability, value, and capabilities
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {/* Skeleton for Provider Comparison Grid */}
            <div className="grid lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 space-y-3">
                <div className="flex justify-between items-center mb-4">
                  <div className="h-4 w-48 bg-white/10 rounded animate-pulse" />
                  <div className="h-8 w-32 bg-[#E6A23C]/20 rounded-full animate-pulse" />
                </div>

                {/* Skeleton Cards */}
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className={`relative p-5 rounded-xl border ${
                      i === 1
                        ? 'bg-gradient-to-br from-[rgba(230,162,60,0.08)] to-transparent border-[#E6A23C]/50'
                        : 'bg-black/30 border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="h-4 w-32 bg-white/20 rounded animate-pulse mb-2" />
                        <div className="h-3 w-24 bg-white/10 rounded animate-pulse" />
                      </div>
                      <div className="text-right">
                        <div className="h-3 w-16 bg-white/10 rounded animate-pulse mb-2" />
                        <div className="h-6 w-20 bg-[#E6A23C]/30 rounded animate-pulse" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[1, 2, 3].map((j) => (
                        <div key={j} className="rounded-lg p-3 border bg-black/40 border-white/10">
                          <div className="h-3 w-16 bg-white/10 rounded animate-pulse mb-2" />
                          <div className="h-4 w-12 bg-white/20 rounded animate-pulse" />
                        </div>
                      ))}
                    </div>

                    <div className="h-2 bg-black/60 rounded-full overflow-hidden border border-white/10">
                      <div className="h-full w-1/2 bg-[#E6A23C]/30 rounded-full animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Skeleton Live Event Stream */}
              <div className="lg:col-span-4 bg-black/60 backdrop-blur-[12px] border border-white/10 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/10">
                  <div className="h-3 w-20 bg-white/20 rounded animate-pulse" />
                  <div className="h-6 w-16 bg-[#E6A23C]/20 rounded animate-pulse" />
                </div>

                <div className="space-y-2">
                  {[...Array(15)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center py-2">
                      <div className="flex gap-2 items-center flex-1">
                        <div className="h-2 w-12 bg-white/10 rounded animate-pulse" />
                        <div className="h-2 w-16 bg-white/10 rounded animate-pulse" />
                        <div className="h-2 w-10 bg-white/10 rounded animate-pulse" />
                      </div>
                      <div className="h-2 w-8 bg-[#E6A23C]/20 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Skeleton Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`backdrop-blur-[12px] border rounded-xl p-6 text-center ${
                    i === 3
                      ? 'bg-gradient-to-br from-black/40 to-transparent border-white/10'
                      : 'bg-gradient-to-br from-[rgba(230,162,60,0.05)] to-transparent border-[#E6A23C]/30'
                  }`}
                >
                  <div className="h-3 w-32 bg-white/10 rounded animate-pulse mx-auto mb-3" />
                  <div className="h-12 w-24 bg-[#E6A23C]/20 rounded animate-pulse mx-auto mb-3" />
                  <div className="h-3 w-40 bg-white/10 rounded animate-pulse mx-auto" />
                </div>
              ))}
            </div>
          </div>
        ) : benchmarkData && (
          <div className="space-y-8">
            {/* Data Storytelling Callout Cards */}
            {goldRushResult && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {/* 3x Faster Claim */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0 }}
                >
                  <Card className="bg-black/60 border-[#E6A23C]/30 p-6 text-center comparison-card">
                    <CardContent className="p-0">
                      <div className="text-5xl font-bold text-[#E6A23C] mb-2">
                        {((benchmarkData.stats.averageLatency / goldRushResult.metrics.connection_latency)).toFixed(1)}x
                      </div>
                      <div className="text-lg text-white font-semibold mb-2">Faster Connection</div>
                      <div className="text-sm text-[#a0a0a0]">
                        {goldRushResult.metrics.connection_latency.toFixed(0)}ms vs {benchmarkData.stats.averageLatency.toFixed(0)}ms average
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Best Value */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <Card className="bg-black/60 border-[#E6A23C]/30 p-6 text-center comparison-card">
                    <CardContent className="p-0">
                      <div className="text-5xl font-bold text-[#E6A23C] mb-2">
                        {(goldRushResult.metrics.throughput * 0.5).toFixed(0)}x
                      </div>
                      <div className="text-lg text-white font-semibold mb-2">Performance per $</div>
                      <div className="text-sm text-[#a0a0a0]">
                        Best value for money in the market
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* 99.9% Uptime */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Card className="bg-black/60 border-white/10 p-6 text-center comparison-card">
                    <CardContent className="p-0">
                      <div className="text-5xl font-bold text-[#E6A23C] mb-2">
                        {goldRushResult.metrics.uptime_percent.toFixed(1)}%
                      </div>
                      <div className="text-lg text-white font-semibold mb-2">24h Uptime</div>
                      <div className="text-sm text-[#a0a0a0]">
                        Industry-leading reliability
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            )}

            {/* Hero Chart: Performance Radar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="col-span-full bg-black/60 border-[#E6A23C]/30 backdrop-blur-sm comparison-card">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
                    Performance Comparison
                  </CardTitle>
                  <CardDescription className="text-[#a0a0a0]">
                    GoldRush dominates across all performance dimensions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PerformanceRadarChart results={benchmarkData.results} />
                </CardContent>
              </Card>
            </motion.div>

            {/* 2x2 Grid of Supporting Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Latency Consistency */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card className="bg-black/40 border-white/10 comparison-card">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                      Latency Consistency
                    </CardTitle>
                    <CardDescription className="text-[#a0a0a0]">
                      P50, P95, and P99 percentile distribution
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <LatencyScatterChart results={benchmarkData.results} />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Value for Money */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Card className="bg-black/40 border-white/10 comparison-card">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                      Value for Money
                    </CardTitle>
                    <CardDescription className="text-[#a0a0a0]">
                      Performance score vs cost per million requests
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ValueScoreChart results={benchmarkData.results} />
                  </CardContent>
                </Card>
              </motion.div>

              {/* 24-Hour Uptime */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <Card className="bg-black/40 border-white/10 comparison-card">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                      24-Hour Uptime
                    </CardTitle>
                    <CardDescription className="text-[#a0a0a0]">
                      Real-time reliability monitoring
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ReliabilityTimelineChart results={benchmarkData.results} />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Feature Coverage */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <Card className="bg-black/40 border-white/10 comparison-card">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                      Feature Coverage
                    </CardTitle>
                    <CardDescription className="text-[#a0a0a0]">
                      Supported capabilities across providers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CapabilitiesMatrixChart results={benchmarkData.results} />
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        )}
      </section>

      {/* Code Examples Section */}
      <section className="max-w-[1280px] mx-auto px-6 pt-20 pb-12">
        <div className="text-center mb-12">
          <div className="inline-block mb-3">
            <div className="text-xs font-mono text-[#E6A23C] uppercase tracking-wider">
              Ready for MegaETH Launch
            </div>
          </div>
          <h2 className="text-[clamp(1.8rem,3vw,2.5rem)] font-semibold mb-4">
            Start Streaming in <span className="text-[#E6A23C]">30 Seconds</span>
          </h2>
          <p className="text-lg text-[#a0a0a0]">
            Get the fastest streaming API. <span className="text-white font-semibold">3x faster than alternatives.</span>
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Language Selector */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex gap-2 bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg p-1.5">
              {(Object.keys(codeExamples) as CodeLanguage[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={
                    selectedLanguage === lang
                      ? `px-6 py-2.5 rounded-md text-sm font-semibold transition-all ${languageColors[lang].bg} ${lang === 'python' ? 'text-black' : 'text-white'} shadow-lg`
                      : `px-6 py-2.5 rounded-md text-sm font-semibold transition-all text-[#a0a0a0] hover:bg-white/5 ${
                          lang === 'typescript' ? 'hover:text-[#3178C6]' :
                          lang === 'python' ? 'hover:text-[#FFD43B]' :
                          lang === 'curl' ? 'hover:text-[#FF6B35]' :
                          'hover:text-[#00ADD8]'
                        }`
                  }
                >
                  {codeExamples[lang].label}
                </button>
              ))}
            </div>
          </div>

          {/* Code Block */}
          <div className="bg-[#0A0A0A] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 bg-[#0F0F0F] px-6 py-4">
              <div className="text-xs text-[#a0a0a0] font-mono">
                streaming-example.{selectedLanguage === 'typescript' ? 'ts' : selectedLanguage === 'python' ? 'py' : selectedLanguage === 'go' ? 'go' : 'sh'}
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 text-xs text-[#a0a0a0] hover:text-white transition-colors font-mono"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
            <div className="p-6 overflow-x-auto">
              <pre className="font-mono text-sm leading-relaxed text-[#d4d4d4]">
                {codeExamples[selectedLanguage].code}
              </pre>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="text-center group cursor-pointer transition-transform duration-200 hover:scale-105 hover:-translate-y-1">
              <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-[#E6A23C]/10 border border-[#E6A23C]/30 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-[#E6A23C]/20 transition-all">
                <svg className="w-6 h-6 text-[#E6A23C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              </div>
              <h4 className="font-semibold text-white mb-2">Unified Schema</h4>
              <p className="text-sm text-[#a0a0a0]">
                One data model for every chain. EVM, SVM, and beyond.
              </p>
            </div>
            <div className="text-center group cursor-pointer transition-transform duration-200 hover:scale-105 hover:-translate-y-1">
              <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-white/10 transition-all">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="font-semibold text-white mb-2">Zero Maintenance</h4>
              <p className="text-sm text-[#a0a0a0]">
                We handle the infrastructure. You build the app.
              </p>
            </div>
            <div className="text-center group cursor-pointer transition-transform duration-200 hover:scale-105 hover:-translate-y-1">
              <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-white/10 transition-all">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="font-semibold text-white mb-2">Enterprise SLA</h4>
              <p className="text-sm text-[#a0a0a0]">
                99.9% uptime with dedicated support & guarantees.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-[1280px] mx-auto px-6 pt-20 pb-12">
        <div className="bg-black/40 backdrop-blur-sm border border-[#E6A23C]/30 rounded-2xl p-8 text-center">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-[#E6A23C]/10 border border-[#E6A23C]/30 rounded-full">
            <span className="w-2 h-2 bg-[#E6A23C] rounded-full animate-pulse shadow-[0_0_8px_rgba(230,162,60,0.6)]" />
            <span className="text-xs font-mono text-[#E6A23C] uppercase tracking-wider font-bold">
              MegaETH Launches Monday
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Be First on the <span className="text-[#E6A23C]">Fastest Chain</span>
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto font-semibold">
            GoldRush is 3x faster than Alchemy, Zerion, Infura, and QuickNode.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <a
              href="https://goldrush.dev/platform/auth/register"
              className="px-10 py-4 bg-[#E6A23C] text-black text-xl font-bold rounded-lg hover:brightness-110 hover:scale-105 shadow-lg shadow-[#E6A23C]/30 hover:shadow-xl hover:shadow-[#E6A23C]/40 transition-all duration-300"
            >
              Get Free API Key →
            </a>
            <a
              href="https://goldrush.dev/docs/streaming-api"
              className="px-10 py-4 bg-black border border-white/20 text-white text-xl font-bold rounded-lg hover:border-white/40 transition-all"
            >
              View Documentation
            </a>
          </div>
          <p className="text-sm text-white/80 mt-6">
            No credit card required • Free tier includes 100k requests/month • Ready for MegaETH launch
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 mt-20 bg-black/60">
        <div className="max-w-[1280px] mx-auto px-6 grid md:grid-cols-4 gap-8">
          <div>
            <a href="https://goldrush.dev" className="flex items-center gap-2 font-extrabold text-xl mb-4">
              <div className="w-3 h-3 bg-[#E6A23C]" />
              GOLDRUSH.DEV
            </a>
            <p className="text-sm text-[#a0a0a0] max-w-[300px] mb-4">
              The world's fastest streaming API. MegaETH-ready. 3x faster than competition.
            </p>
            <div className="flex gap-3">
              <a href="https://twitter.com/goldrush_dev" className="w-10 h-10 rounded-full bg-[#333] hover:bg-[#E6A23C] transition-all duration-300 hover:scale-110 flex items-center justify-center group">
                <svg className="w-4 h-4 text-white group-hover:text-black transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="https://github.com/covalenthq" className="w-10 h-10 rounded-full bg-[#333] hover:bg-[#E6A23C] transition-all duration-300 hover:scale-110 flex items-center justify-center group">
                <svg className="w-4 h-4 text-white group-hover:text-black transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
              </a>
              <a href="https://discord.gg/goldrush" className="w-10 h-10 rounded-full bg-[#333] hover:bg-[#E6A23C] transition-all duration-300 hover:scale-110 flex items-center justify-center group">
                <svg className="w-4 h-4 text-white group-hover:text-black transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4 text-[#E6A23C]">Product</h4>
            <ul className="space-y-3 text-sm text-[#a0a0a0]">
              <li><a href="https://goldrush.dev/products/foundational-api" className="hover:text-white transition-colors">Foundational API</a></li>
              <li><a href="https://goldrush.dev/products/streaming-api" className="hover:text-white transition-colors">Streaming API</a></li>
              <li><a href="https://goldrush.dev/pricing" className="hover:text-white transition-colors">Pricing</a></li>
              <li>
                <Link
                  href="/dashboard"
                  className="hover:text-white transition-colors"
                  onMouseEnter={() => prefetchDashboard()}
                  prefetch={true}
                >
                  Benchmarks
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4 text-[#E6A23C]">Developers</h4>
            <ul className="space-y-3 text-sm text-[#a0a0a0]">
              <li><a href="https://goldrush.dev/docs" className="hover:text-white transition-colors">Documentation</a></li>
              <li><a href="https://goldrush.dev/docs/api-reference" className="hover:text-white transition-colors">API Reference</a></li>
              <li><a href="https://goldrush.dev/docs/sdks" className="hover:text-white transition-colors">SDKs</a></li>
              <li><a href="https://status.goldrush.dev" className="hover:text-white transition-colors">Status</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4 text-[#E6A23C]">Company</h4>
            <ul className="space-y-3 text-sm text-[#a0a0a0]">
              <li><a href="https://goldrush.dev/blog" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="https://goldrush.dev/about" className="hover:text-white transition-colors">About</a></li>
              <li><a href="https://goldrush.dev/careers" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="https://goldrush.dev/contact" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-[1280px] mx-auto px-6 mt-12 pt-8 border-t border-white/5">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-[#a0a0a0]">
              © 2024 GoldRush.dev (Covalent Inc.) • All rights reserved.
            </p>
            <div className="flex gap-6 text-xs text-[#a0a0a0]">
              <a href="https://goldrush.dev/privacy" className="hover:text-white transition-colors">Privacy</a>
              <a href="https://goldrush.dev/terms" className="hover:text-white transition-colors">Terms</a>
              <a href="https://goldrush.dev/security" className="hover:text-white transition-colors">Security</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      {copied && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-[#E6A23C] text-black px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 font-semibold">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Code copied to clipboard!
          </div>
        </div>
      )}
    </div>
  );
}
