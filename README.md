<h1 align="center">Benchmarked</h1>

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com)
[![Recharts](https://img.shields.io/badge/Recharts-2.15-22b5bf?style=flat-square)](https://recharts.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**Live Solana RPC benchmark — real measurements, no simulated data**

[View Demo](https://try-benchmarked.vercel.app) · [Report Bug](https://github.com/dinxsh/benchmarked/issues) · [Request Feature](https://github.com/dinxsh/benchmarked/issues)

</div>

---

## What it does

Benchmarked fires real HTTP requests to six Solana RPC/API providers on every run and ranks them by a weighted composite score. Every number on the dashboard is a live measurement — nothing is simulated or cached.

**Providers benchmarked:** Alchemy · QuickNode · Helius · Ankr · LaserStream · GoldRush

---

## Dashboard layout

The root page (`/`) is the entire product. It renders:

| Section | Description |
|---|---|
| **Hero band** | #1 ranked provider with its key metrics |
| **Winner cards** | Category leaders — Speed, Reliability, Throughput, Value |
| **Key metrics strip** | Single-number KPIs across all providers |
| **Benchmark kanban** | 8 charts in a 2×2 puzzle grid (see below) |
| **Full provider table** | Sortable, filterable comparison of all providers |
| **Capability matrix** | Feature-flag grid (transactions, traces, NFT metadata, etc.) |

### The 8 charts

```
┌─────────────────────────────┬───────────────┐
│  Latency Distribution       │ Uptime &      │
│  P50 · P95 · P99 stacked    │ Error Rate    │
├───────────────┬─────────────┴───────────────┤
│ Throughput    │  Latency Spread             │
│ RPS by tier   │  Jitter per provider        │
├───────────────┼─────────────┬───────────────┤
│  Cost vs      │ Score       │  Multi-Axis   │
│  Performance  │ Breakdown   │  Radar        │
├───────────────┴─────────────┴───────────────┤
│  Dimension Comparison (full width)          │
└─────────────────────────────────────────────┘
```

---

## How measurements work

Each run fires **5 sequential requests** per provider (100 ms gap, `performance.now()` timing):

- **JSON-RPC providers** — `POST getSlot` · 5 s timeout
- **GoldRush REST** — `GET /v1/solana-mainnet/address/{wallet}/balances_v2/` · 8 s timeout

Throughput uses a separate **concurrent burst** (8–10 parallel requests) measured wall-clock.

### Composite score formula

```
score = latency_component × 0.40
      + reliability_component × 0.35
      + throughput_component × 0.25
```

| Component | Normalization |
|---|---|
| Latency | `max(0, 100 − (P50 / 2000) × 100)` |
| Reliability | `uptime_percent` (0–100) |
| Throughput | `min(100, (rps / 200) × 100)` |

See full methodology in the [API source](src/app/api/benchmarks/solana/route.ts) and [scoring lib](src/lib/benchmark/scoring.ts).

---

## Getting started

### Prerequisites

- Node.js 18+ or Bun
- API keys for the providers you want to measure

### Installation

```bash
git clone https://github.com/dinxsh/benchmarked.git
cd benchmarked
npm install
```

### Environment

Create `.env.local` with your provider keys:

```env
# GoldRush (Covalent)
GOLDRUSH_API_KEY=your_key_here

# Alchemy — either a full endpoint URL or just the key
ALCHEMY_SOLANA_ENDPOINT=https://solana-mainnet.g.alchemy.com/v2/your_key
# ALCHEMY_API_KEY=your_key_here   (alternative)

# Helius
HELIUS_API_KEY=your_key_here

# QuickNode — full endpoint URL
QUICKNODE_SOLANA_ENDPOINT=https://your-endpoint.quiknode.pro/your_key/

# LaserStream
LASERSTREAM_API_KEY=your_key_here

# Ankr — public endpoint works without a key
# ANKR_API_KEY=your_key_here
```

Providers with missing keys are excluded from the run. At least one key is required.

### Run

```bash
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve production build
```

---

## Project structure

```
src/
├── app/
│   ├── page.tsx                        # Root page — entire benchmark dashboard
│   ├── api/
│   │   └── benchmarks/solana/route.ts  # Benchmark runner — fires real requests
│   └── dashboard/                      # Secondary pages (provider detail, methodology, etc.)
│
├── components/goldrush/
│   ├── HeroBand.tsx                    # #1 provider hero section
│   ├── WinnerCards.tsx                 # Category leader cards
│   ├── KeyMetricsStrip.tsx             # KPI strip
│   ├── BenchmarkTabs.tsx               # Kanban grid (all 8 charts)
│   ├── GRProviderTable.tsx             # Sortable full comparison table
│   ├── GRCapabilityMatrix.tsx          # Feature flag grid
│   ├── GRProviderDrawer.tsx            # Provider detail slide-over
│   ├── StickyNav.tsx                   # Scroll-triggered sticky header
│   └── charts/
│       ├── GRLatencyChart.tsx          # Stacked bar — P50/P95/P99
│       ├── GRThroughputChart.tsx       # Horizontal bar — RPS by tier
│       ├── GRUptimeList.tsx            # Progress bars — uptime + error rate
│       ├── GRLatencySpread.tsx         # Stacked column — jitter per provider
│       ├── GRCostScatter.tsx           # Bubble chart — cost vs score
│       ├── GRScoreBreakdown.tsx        # Stacked bar — score components
│       ├── GRRadarChart.tsx            # Multi-axis radar — top 5 providers
│       └── GRDimensionTable.tsx        # Table with mini-bars — 5 dimensions
│
└── lib/
    ├── benchmark/
    │   ├── data.ts                     # GRProvider type, CAPABILITIES, color palette
    │   ├── scoring.ts                  # Score/rank/radar formulas
    │   └── simulate.ts                 # useLiveBenchmark hook
    └── adapters/
        ├── base.ts                     # BaseAdapter — measure(), percentile(), testCall()
        ├── solana-alchemy.ts
        ├── solana-quicknode.ts
        ├── solana-helius.ts
        ├── solana-ankr.ts
        ├── solana-laserteam.ts
        └── solana-goldrush.ts
```

---

## Tech stack

| Layer | Library | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16 |
| Language | TypeScript | 5.7 |
| Styling | Tailwind CSS | 4.0 |
| Charts | Recharts | 2.15 |
| Icons | Lucide React | 0.476 |
| State (URL) | Nuqs | 2.4 |
| Data fetching | TanStack Query | 5.90 |
| UI primitives | Radix UI | — |

---

## Contributing

1. Fork the repo
2. Create a branch — `git checkout -b feature/your-feature`
3. Commit — `git commit -m 'Add your feature'`
4. Push — `git push origin feature/your-feature`
5. Open a pull request

---

## License

MIT — see [LICENSE](LICENSE).
