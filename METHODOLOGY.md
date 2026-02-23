# Benchmark Methodology

How every number on the dashboard is measured, derived, and displayed.

---

## 1. Measurement Process

Each benchmark run fires **5 sequential requests** per provider with a **100 ms gap** between calls. All timing uses `performance.now()` measured server-side inside the Next.js API route — client network latency is excluded.

| Provider type | Benchmark endpoint | Timeout |
|---|---|---|
| JSON-RPC (Alchemy, QuickNode, Ankr, LaserStream, Helius) | `POST getSlot` | 5 s |
| REST API (GoldRush) | `GET /v1/solana-mainnet/address/{wallet}/balances_v2/` | 8 s |

The clock starts immediately before `fetch()` and stops after the full response body is consumed (`response.text()` or `response.json()`). This measures **total round-trip time** including DNS (cached after first call), TCP, TLS, server processing, and body transfer.

All 6 providers run **in parallel** via `Promise.allSettled` so a slow provider does not delay others.

---

## 2. Raw Latency Metrics

The 5 timing samples are sorted ascending. Percentiles use ceiling interpolation:

```
index = ceil((p / 100) × sampleSize) − 1
value = sortedSamples[max(0, index)]
```

With 5 samples this resolves to:

| Percentile | Sample index (0-based) |
|---|---|
| P50 | 2 (median) |
| P95 | 4 (worst sample) |
| P99 | 4 (same as P95 with n=5) |

### P50 — Median Latency
The middle value of the 5 sorted samples. Represents typical response time under normal conditions. Used as the primary latency signal in the composite score.

### P95 — 95th Percentile Latency
The worst sample in a 5-sample window (index 4). Represents the latency a user would experience on a bad-but-not-worst request.

### P99 — 99th Percentile Latency
Equal to P95 at n=5 due to the ceiling formula. At larger sample sizes this would diverge. Represents tail latency.

### Jitter
```
jitter = P99 − P50
```
Measures **latency variance** — how much the response time swings between median and worst case. Low jitter = consistent. High jitter = unpredictable. Shown in the Latency Spread chart and tooltips.

---

## 3. Reliability Metrics

### Uptime %
```
uptime_percent = (successful_requests / total_requests) × 100
```
With 5 samples, resolution is `0 / 20 / 40 / 60 / 80 / 100`. A request counts as failed if it throws (timeout, HTTP 5xx, network error). HTTP 4xx is treated as a live endpoint and counts as success.

### Error Rate %
```
error_rate = 100 − uptime_percent
```
The inverse of uptime. Shown directly in the provider table and uptime chart.

---

## 4. Throughput — Requests per Second (RPS)

Throughput is measured **separately** from the latency samples using a concurrent burst:

```
CONCURRENT = 10  (JSON-RPC providers)
CONCURRENT =  8  (GoldRush REST)

rps = floor(CONCURRENT / elapsed_wall_time_seconds)
```

All concurrent requests fire simultaneously via `Promise.allSettled`. Elapsed time is wall-clock from the first `fetch()` to the last settled promise. This simulates how many requests the provider can handle when hit in parallel — a more realistic throughput signal than sequential RPS.

---

## 5. Slot Height

For JSON-RPC providers, `getSlot` returns the current confirmed slot number. This is captured during the `measureWithThroughput` call and surfaced in tooltips to indicate how fresh/synchronized the provider's view of the chain is. REST providers (GoldRush) return `0` since the balances endpoint does not expose slot height.

---

## 6. Composite Score

```
score = latencyScore × 0.40
      + reliabilityScore × 0.35
      + throughputScore × 0.25
```

Each component is normalized to **0–100** before weighting:

### Latency component (40%)
```
latencyScore = max(0,  100 − (P50 / 2000) × 100)
```
- 0 ms P50 → 100 pts
- 1000 ms P50 → 50 pts
- ≥2000 ms P50 → 0 pts

The 2000 ms ceiling ensures REST/Data API providers (which are structurally slower than JSON-RPC) still receive a non-zero latency score.

### Reliability component (35%)
```
reliabilityScore = uptime_percent   (already 0–100)
```
Direct pass-through. 100% uptime = 35 pts contribution. One failed sample out of 5 = 80% uptime = 28 pts contribution.

### Throughput component (25%)
```
throughputScore = min(100,  (rps / 200) × 100)
```
Capped at 200 rps. JSON-RPC providers naturally achieve higher RPS than REST/Data APIs; the cap prevents raw throughput from dominating and keeps the score meaningful across provider types.

### Rank
Providers sorted by composite score descending, numbered 1 (best) onwards. Computed server-side and re-applied client-side via `rerank()` after any data update.

---

## 7. Value Score

```
value_score = score / costPerM     (for paid providers)
value_score = ∞                    (for free providers)
```

`costPerM` is USD per million requests (e.g. Alchemy = $1.50, GoldRush = $0.50). Value score answers "how many composite score points do you get per dollar spent at scale?" Higher = better economics. Free providers are shown as `∞` since no cost denominator exists.

---

## 8. Radar Chart Dimensions

Five normalized axes (0–100 each) used in the Multi-Axis Radar and Dimension Comparison table:

| Dimension | Formula | Notes |
|---|---|---|
| **Speed** | `max(0, (1 − P50 / maxP50) × 100)` | Relative to the slowest provider in this run |
| **Uptime** | `uptime_percent` | Direct, not relative |
| **Throughput** | `min(100, (rps / maxRps) × 100)` | Relative to the fastest provider in this run |
| **Reliability** | `max(0, 100 − errRate × 10)` | 0% err = 100, 10% err = 0, linear |
| **Coverage** | `capabilities.capScore` | Static, based on feature flags (see §9) |

Speed and Throughput are **relative to the current cohort** — they shift if a new provider is added to the benchmark.

---

## 9. Capability Score

Providers are scored on 6 binary feature flags. Each flag is worth ~16.67 points:

| Feature | Alchemy | QuickNode | Helius | GoldRush | Ankr | LaserStream |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Transactions | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Event Logs | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Token Balances | ✓ | ✓ | ✓ | ✓ | — | — |
| NFT Metadata | ✓ | ✓ | ✓ | ✓ | — | — |
| Custom Indexing | ✓ | ✓ | ✓ | ✓ | — | — |
| Traces | ✓ | ✓ | ✓ | — | — | — |
| **capScore** | **100** | **100** | **100** | **83** | **33** | **33** |

These are **static** — not measured at runtime. They reflect documented provider capabilities and are stored in `src/lib/benchmark/data.ts → CAPABILITIES`.

---

## 10. Color Thresholds

All color coding uses these shared thresholds:

| Metric | Green | Amber | Red |
|---|---|---|---|
| P50 latency | ≤ 20 ms | ≤ 100 ms | > 100 ms |
| P95 / P99 latency | — | ≤ 300 ms | > 300 ms |
| Jitter (P99−P50) | ≤ 150 ms | ≤ 400 ms | > 400 ms |
| Uptime | ≥ 99% | ≥ 95% | < 95% |
| Composite score | ≥ 80 | ≥ 60 | < 60 |
| Error rate | 0% | < 1% | ≥ 1% |

---

## 11. Limitations

- **Sample size = 5** — statistical resolution is coarse. P95 and P99 are identical at n=5. Larger sample sizes (20–100) would separate these.
- **Single region** — measurements run from wherever the Next.js server is deployed. Results represent latency from that region only, not global averages.
- **No cache control** — `Cache-Control: no-store` headers prevent intermediate caching but CDN or provider-side caching at the endpoint is not controlled.
- **Sequential samples** — the 5 latency samples are sequential (not concurrent), so they do not reflect sustained-load behavior. The separate throughput burst captures that.
- **Throughput burst duration** — `CONCURRENT / elapsed` measures the wall time of one burst of 8–10 requests, not a sustained stream. Sustained RPS under real load would differ.
- **Provider warm-up** — no explicit warm-up call before the timed samples. The first call may include connection setup overhead not present in subsequent calls.
- **Endpoint choice** — JSON-RPC providers use `getSlot` (lightweight, no payload). GoldRush uses `balances_v2` (returns full token list). Response payload size differs between types, making raw latency comparison cross-type directional rather than exact.
