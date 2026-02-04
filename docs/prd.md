# PRD: Next.js Backendless Infrastructure for Web3 Benchmarks

**Version:** 2.0
**Date:** February 4, 2026
**Status:** Implemented

---

## Executive Summary

This PRD defines the **Backendless Architecture** for the Web3 Benchmarking Dashboard. Instead of a separate backend service, the application leverages Next.js API Routes and Server Actions combined with a MongoDB database to provide a seamless, full-stack experience within a single deployment unit.

**Key Principle:** Unified Next.js application handling both frontend UI and backend benchmarking logic.

---

## 1. Product Requirements

### 1.1 Core Capabilities
- **Benchmark Execution**: Run latency, uptime, and response size tests against RPC providers.
- **Data Persistence**: Store benchmark results and provider metadata in MongoDB.
- **Leaderboard Ranking**: Rank providers based on a weighted scoring algorithm.
- **Response Analysis**: Capture and display actual API responses (JSON bodies) and calculate their sizes.
- **Provider Filtering**: sort/filter by fastest, slowest, smallest response, biggest response.

### 1.2 Supported Providers
The system currently implements adapters for the following 8 providers:
1.  **Alchemy** (RPC)
2.  **Infura** (RPC)
3.  **QuickNode** (RPC)
4.  **GoldRush** (REST)
5.  **Ankr** (RPC)
6.  **Chainstack** (RPC)
7.  **Bitquery** (GraphQL)
8.  **Subsquid** (Archive API)

---

## 2. Architecture Overview

### 2.1 Backendless Design (Next.js API Routes)

```
┌─────────────────────────────────────────────────┐
│                 Next.js Application             │
│                                                 │
│  ┌──────────────┐  ┌─────────────────────────┐  │
│  │   Frontend   │  │   API Routes            │  │
│  │  Components  │  │  (/api/benchmarks/...)  │  │
│  └──────┬───────┘  └──────┬──────────────────┘  │
│         │                 │                     │
│         └──────────┬──────┘                     │
│                    │                            │
│         ┌──────────▼──────────┐                 │
│         │      MongoDB        │                 │
│         │    (Collection)     │                 │
│         └─────────────────────┘                 │
└─────────────────────────────────────────────────┘
```

### 2.2 File Structure

```
src/
├── app/
│   ├── api/
│   │   └── benchmarks/
│   │       ├── route.ts         # GET /api/benchmarks (Leaderboard/Metrics)
│   │       └── run/
│   │           └── route.ts     # POST /api/benchmarks/run (Trigger Benchmarks)
│   └── dashboard/               # Frontend Pages
├── lib/
│   ├── adapters/                # Provider Adapters
│   │   ├── base.ts              # BaseAdapter Class
│   │   ├── alchemy.ts           # Alchemy Implementation
│   │   ├── goldrush.ts          # GoldRush Implementation
│   │   └── ...                  # Other Adapters
│   ├── benchmark-store.ts       # Data Access Layer
│   └── db.ts                    # MongoDB Connection
└── models/
    └── Benchmark.ts             # Mongoose Schema
```

---

## 3. Data Models (MongoDB/Mongoose)

### 3.1 Schema: Benchmark

**File:** `src/models/Benchmark.ts`

```typescript
interface IBenchmark {
  providerId: string;    // e.g., 'alchemy'
  name: string;          // e.g., 'Alchemy'
  slug: string;          // e.g., 'alchemy'
  
  // Metadata
  metadata: {
    logo_url: string;
    website_url: string;
    supported_chains: string[];
    pricing: {
      cost_per_million: number;
      rate_limit: string;
    };
    capabilities: Record<string, boolean>;
  };
  
  // Current Performance Metrics
  metrics: {
    latency_p50: number;
    latency_p95: number;
    latency_p99: number;
    uptime_percent: number;
    error_rate: number;
    response_size_bytes: number; // Size of last captured response
  };
  
  // Captured Response Data
  details: {
    last_response_body: any;     // Actual JSON response from provider
  };
  
  // Scoring
  scores: {
    final_score: number;
    latency_score: number;
    reliability_score: number;
    response_size_score: number;
    coverage_score: number;
    dx_score: number;
    pricing_score: number;
  };
  
  // Historical Data
  metrics_history: {
    timestamp: Date;
    value: number; // Latency p50
  }[];
  
  timestamp: Date;
}
```

---

## 4. API Routes

### 4.1 Trigger Benchmark Run
**Endpoint:** `POST /api/benchmarks/run`

Triggers the benchmark execution process:
1.  Instantiates all provider adapters.
2.  Runs `measure()` on each adapter (captures latency, uptime, response body).
3.  Calculates scores.
4.  Upserts results to MongoDB.

**Response:**
```json
{
  "success": true,
  "timestamp": "2026-02-04T08:33:03.779Z",
  "results": [
    {
      "provider": "Alchemy",
      "status": "success",
      "metrics": {
        "latency_p50": 89,
        "uptime_percent": 100,
        "response_size_bytes": 654960
      },
      "scores": {
        "final_score": 87.59,
        "response_size_score": 55.4
      }
    },
    ...
  ]
}
```

### 4.2 Get Leaderboard/Metrics
**Endpoint:** `GET /api/benchmarks`

Retrieves benchmark data for the dashboard. Supports fetching full leaderboard or specific provider details.

**Query Params:**
- `type`: `leaderboard` (default) or `provider`
- `sort`: `fastest`, `slowest`, `metrics` (response size), `uptime`

---

## 5. Benchmarking Logic

### 5.1 Response Capture
The system authenticates requests appropriately for each provider (RPC, REST, GraphQL) and captures the **actual response body** to ensure data accuracy.

**Method Strategy:**
-   **Standard RPC (Alchemy, Infura, etc.):** `eth_getBlockByNumber` via POST.
-   **REST (GoldRush):** `GET /block_v2/latest`.
-   **GraphQL (Bitquery):** Custom GraphQL query for block height and timestamp.
-   **Archive (Subsquid):** `GET /height`.

**Size Calculation:**
The response size is calculated in bytes based on the stringified JSON payload of the response.

### 5.2 Scoring Algorithm
Providers are ranked on a 0-100 scale using a weighted formula:

```typescript
Final Score = 
  (Latency Score * 0.25) +
  (Reliability Score * 0.25) +
  (Response Size Score * 0.15) +
  (Coverage Score * 0.15) +
  (DX Score * 0.10) +
  (Pricing Score * 0.10)
```

**Metric Normalization:**
-   **Latency:** Inverse scale (lower is better).
-   **Reliability:** Direct percentage (uptime).
-   **Response Size:** Inverse scale (smaller is typically better for bandwidth, though context matters).
-   **Coverage/DX:** weighted based on supported features/chains.

---

## 6. Frontend Integration

### 6.1 Ranking Cards
Interactive cards at the top of the dashboard overview:
-   **Fastest Provider:** Validates lowest p50 latency.
-   **Slowest Provider:** Highlights performance bottlenecks.
-   **Smallest Response:** Identifies bandwidth-efficient providers.
-   **Biggest Response:** Identifies data-rich responses.

### 6.2 Provider Details
-   **Metrics Display:** Latency, Uptime, Response Size.
-   **Example Response Viewer:** A popup modal allowing users to inspect the actual JSON response body returned by the provider during the last benchmark run.

---

## 7. Deployment & Automation

-   **Hosting:** Next.js application (Vercel/Railway/etc.).
-   **Database:** MongoDB Atlas.
-   **Automation:** Cron job (e.g., Vercel Cron) targeting `POST /api/benchmarks/run` every 6 hours.