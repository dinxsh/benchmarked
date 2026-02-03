# PRD: Pluggable Backend Infrastructure for Web3 Infra Dashboard
## Minimal, Drop-in Backend for Existing Frontend

**Version:** 1.0  
**Date:** February 2, 2026  
**Status:** Implementation Ready

---

## Executive Summary

This PRD defines a **minimal, pluggable backend infrastructure** designed to drop into an existing React frontend with zero breaking changes. The backend is a single Node.js/Express server with SQLite storage, deployable in under 30 minutes.

**Key Principle:** Frontend already exists → Backend must adapt to frontend's data contracts.

---

## 1. Product Requirements

### 1.1 Core Constraints

**MUST HAVE:**
- Drop-in compatibility with existing frontend components
- No frontend code changes required
- Single command deployment
- Works with existing API expectations
- Auto-populates with sample data on first run

**MUST NOT:**
- Require complex infrastructure (no Kubernetes, Docker Compose, etc.)
- Need separate services for cache/queue/workers
- Break existing component props/interfaces
- Require DevOps knowledge

### 1.2 Success Criteria

- [ ] Backend starts with `npm start`
- [ ] Frontend connects without config changes
- [ ] Sample data appears immediately
- [ ] Real metrics update every 5 minutes
- [ ] Can deploy to Railway/Render/Fly.io in one click
- [ ] Total setup time < 30 minutes

---

## 2. Architecture Overview

### 2.1 Single-Process Design

```
┌─────────────────────────────────────────────────┐
│                  Node.js Process                │
│                                                 │
│  ┌──────────────┐  ┌──────────────┐           │
│  │   Express    │  │   Scheduler  │           │
│  │  REST API    │  │  (node-cron) │           │
│  └──────┬───────┘  └──────┬───────┘           │
│         │                  │                    │
│         └──────────┬───────┘                    │
│                    │                            │
│         ┌──────────▼──────────┐                │
│         │   SQLite Database   │                │
│         │   (single file)     │                │
│         └─────────────────────┘                │
└─────────────────────────────────────────────────┘
```

**Why this works:**
- Single process = no orchestration
- SQLite = no database server needed
- In-process cron = no external scheduler
- Everything in one repo

### 2.2 File Structure

```
backend/
├── src/
│   ├── index.js              # Main server entry
│   ├── config.js             # Environment config
│   ├── routes/
│   │   ├── leaderboard.js    # GET /api/leaderboard
│   │   ├── provider.js       # GET /api/provider/:slug
│   │   ├── metrics.js        # GET /api/metrics/:provider
│   │   └── compare.js        # GET /api/compare
│   ├── services/
│   │   ├── collector.js      # Metric collection logic
│   │   ├── scorer.js         # Score calculation
│   │   └── providers.js      # Provider adapter registry
│   ├── db/
│   │   ├── schema.sql        # Database schema
│   │   ├── seed.sql          # Sample data
│   │   └── client.js         # SQLite client wrapper
│   └── adapters/
│       ├── alchemy.js        # Alchemy-specific logic
│       ├── infura.js         # Infura-specific logic
│       └── quicknode.js      # QuickNode-specific logic
├── data/
│   └── benchmark.db          # SQLite database (gitignored)
├── package.json
├── .env.example
└── README.md
```

---

## 3. Database Design (SQLite)

### 3.1 Schema Definition

**File:** `src/db/schema.sql`

```sql
-- ============================================
-- Table 1: providers (static metadata)
-- ============================================
CREATE TABLE IF NOT EXISTS providers (
  id TEXT PRIMARY KEY,              -- 'alchemy', 'infura', etc.
  name TEXT NOT NULL,               -- 'Alchemy', 'Infura'
  slug TEXT UNIQUE NOT NULL,        -- URL-friendly: 'alchemy'
  logo_url TEXT,                    -- Full URL to logo
  website_url TEXT,                 -- Provider homepage
  
  -- Chain support (stored as JSON array string)
  supported_chains TEXT NOT NULL,   -- '["ethereum","polygon","arbitrum"]'
  
  -- Pricing (stored as JSON object string)
  pricing_info TEXT,                -- '{"free_limit":300000000,"cost_per_million":1.5}'
  
  -- Capabilities (stored as JSON object string)
  capabilities TEXT,                -- '{"nft_metadata":true,"logs":true}'
  
  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Table 2: current_metrics (latest snapshot)
-- ============================================
CREATE TABLE IF NOT EXISTS current_metrics (
  provider_id TEXT PRIMARY KEY,
  
  -- Latency metrics (milliseconds)
  latency_p50 INTEGER,
  latency_p95 INTEGER,
  latency_p99 INTEGER,
  
  -- Reliability metrics
  uptime_percent REAL,              -- 99.98
  error_rate REAL,                  -- 0.02
  
  -- Scoring
  final_score REAL,                 -- 0-100
  latency_score REAL,
  reliability_score REAL,
  coverage_score REAL,
  dx_score REAL,
  pricing_score REAL,
  
  -- Ranking
  rank INTEGER,
  trend TEXT,                       -- 'up', 'down', 'stable'
  
  -- Metadata
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (provider_id) REFERENCES providers(id)
);

-- ============================================
-- Table 3: metrics_history (time-series)
-- ============================================
CREATE TABLE IF NOT EXISTS metrics_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_id TEXT NOT NULL,
  timestamp DATETIME NOT NULL,
  
  -- Snapshot metrics
  latency_p50 INTEGER,
  latency_p95 INTEGER,
  uptime_percent REAL,
  error_rate REAL,
  
  -- Chain-specific (optional)
  chain TEXT,                       -- 'ethereum', 'polygon', etc.
  
  FOREIGN KEY (provider_id) REFERENCES providers(id)
);

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_history_provider_time 
  ON metrics_history(provider_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_history_chain_time 
  ON metrics_history(chain, timestamp DESC);

-- ============================================
-- Retention policy (keep last 30 days only)
-- ============================================
-- Trigger to auto-delete old data
CREATE TRIGGER IF NOT EXISTS cleanup_old_metrics
AFTER INSERT ON metrics_history
BEGIN
  DELETE FROM metrics_history
  WHERE timestamp < datetime('now', '-30 days');
END;
```

### 3.2 Seed Data

**File:** `src/db/seed.sql`

```sql
-- Sample providers (realistic data)
INSERT OR IGNORE INTO providers (id, name, slug, logo_url, website_url, supported_chains, pricing_info, capabilities) VALUES
  (
    'alchemy',
    'Alchemy',
    'alchemy',
    'https://www.alchemy.com/favicon.ico',
    'https://www.alchemy.com',
    '["ethereum","polygon","arbitrum","optimism","base"]',
    '{"free_limit":300000000,"cost_per_million":1.5,"rate_limit":"300 req/sec"}',
    '{"transactions":true,"logs":true,"token_balances":true,"nft_metadata":true,"historical_depth":"full","custom_indexing":true}'
  ),
  (
    'infura',
    'Infura',
    'infura',
    'https://infura.io/favicon.ico',
    'https://infura.io',
    '["ethereum","polygon","arbitrum","optimism"]',
    '{"free_limit":100000,"cost_per_million":1.0,"rate_limit":"100 req/sec"}',
    '{"transactions":true,"logs":true,"token_balances":true,"nft_metadata":false,"historical_depth":"full","custom_indexing":false}'
  ),
  (
    'quicknode',
    'QuickNode',
    'quicknode',
    'https://www.quicknode.com/favicon.ico',
    'https://www.quicknode.com',
    '["ethereum","polygon","arbitrum","optimism","bnb","avalanche"]',
    '{"free_limit":0,"cost_per_million":2.0,"rate_limit":"500 req/sec"}',
    '{"transactions":true,"logs":true,"token_balances":true,"nft_metadata":true,"historical_depth":"full","custom_indexing":true}'
  );

-- Initial metric snapshots
INSERT OR IGNORE INTO current_metrics (provider_id, latency_p50, latency_p95, uptime_percent, error_rate, final_score, rank) VALUES
  ('alchemy', 118, 245, 99.98, 0.02, 94.2, 1),
  ('infura', 145, 310, 99.85, 0.15, 87.5, 2),
  ('quicknode', 130, 280, 99.92, 0.08, 90.1, 3);
```

### 3.3 Database Client

**File:** `src/db/client.js`

```javascript
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
  constructor() {
    const dbPath = path.join(__dirname, '../../data/benchmark.db');
    
    // Ensure data directory exists
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Failed to connect to database:', err);
        process.exit(1);
      }
      console.log('✓ Connected to SQLite database');
    });
    
    // Enable foreign keys
    this.db.run('PRAGMA foreign_keys = ON');
  }
  
  // Initialize schema and seed data
  async initialize() {
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, 'schema.sql'), 
      'utf8'
    );
    const seedSQL = fs.readFileSync(
      path.join(__dirname, 'seed.sql'), 
      'utf8'
    );
    
    await this.exec(schemaSQL);
    await this.exec(seedSQL);
    
    console.log('✓ Database initialized');
  }
  
  // Execute SQL (for schema/seed)
  exec(sql) {
    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
  
  // Query with parameters
  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
  
  // Query single row
  queryOne(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      });
    });
  }
  
  // Execute write operation
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }
  
  // Close connection
  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

// Singleton instance
const db = new Database();

module.exports = db;
```

---

## 4. API Routes (Contract-First Design)

### 4.1 API Contract Principles

**Golden Rules:**
1. Match frontend's existing expectations exactly
2. No optional fields that frontend relies on
3. Always include `last_updated` timestamp
4. Return 200 for success, 404 for not found, 500 for errors
5. Cache headers on all GET endpoints

### 4.2 Route: Leaderboard

**File:** `src/routes/leaderboard.js`

```javascript
const express = require('express');
const router = express.Router();
const db = require('../db/client');

/**
 * GET /api/leaderboard
 * 
 * Returns ranked list of all providers
 * 
 * Query params:
 *   - chain: filter by chain (optional)
 *   - sort: custom sort field (optional)
 * 
 * Response contract (matches frontend expectations):
 * {
 *   "data": [
 *     {
 *       "id": "alchemy",
 *       "name": "Alchemy",
 *       "slug": "alchemy",
 *       "logo_url": "https://...",
 *       "final_score": 94.2,
 *       "latency_p50": 118,
 *       "uptime_percent": 99.98,
 *       "supported_chains": ["ethereum", "polygon"],
 *       "rank": 1,
 *       "trend": "up",
 *       "health_status": "healthy"
 *     }
 *   ],
 *   "last_updated": "2026-02-02T10:30:00Z"
 * }
 */
router.get('/', async (req, res) => {
  try {
    const { chain, sort } = req.query;
    
    // Build SQL query
    let sql = `
      SELECT 
        p.id, p.name, p.slug, p.logo_url,
        p.supported_chains,
        m.final_score, m.latency_p50, m.uptime_percent, 
        m.rank, m.trend
      FROM providers p
      INNER JOIN current_metrics m ON p.id = m.provider_id
    `;
    
    const params = [];
    
    // Chain filter
    if (chain) {
      sql += ` WHERE p.supported_chains LIKE ?`;
      params.push(`%"${chain}"%`);
    }
    
    // Sorting
    const sortField = sort === 'latency' ? 'm.latency_p50 ASC' : 'm.rank ASC';
    sql += ` ORDER BY ${sortField}`;
    
    const providers = await db.query(sql, params);
    
    // Transform data to match frontend contract
    const data = providers.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      logo_url: p.logo_url,
      final_score: p.final_score,
      latency_p50: p.latency_p50,
      uptime_percent: p.uptime_percent,
      supported_chains: JSON.parse(p.supported_chains),
      rank: p.rank,
      trend: p.trend || 'stable',
      health_status: getHealthStatus(p.uptime_percent)
    }));
    
    // Set cache headers (5 minutes)
    res.set('Cache-Control', 'public, max-age=300');
    
    res.json({
      data,
      last_updated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch leaderboard',
      message: error.message 
    });
  }
});

/**
 * Helper: Determine health status based on uptime
 */
function getHealthStatus(uptime) {
  if (uptime >= 99.9) return 'healthy';
  if (uptime >= 99.0) return 'degraded';
  return 'unstable';
}

module.exports = router;
```

### 4.3 Route: Provider Detail

**File:** `src/routes/provider.js`

```javascript
const express = require('express');
const router = express.Router();
const db = require('../db/client');

/**
 * GET /api/provider/:slug
 * 
 * Returns full provider details
 * 
 * Response contract:
 * {
 *   "provider": {
 *     "id": "alchemy",
 *     "name": "Alchemy",
 *     "slug": "alchemy",
 *     "logo_url": "https://...",
 *     "website_url": "https://alchemy.com",
 *     "supported_chains": ["ethereum", "polygon"],
 *     "pricing": {
 *       "tier": "freemium",
 *       "free_limit": 300000000,
 *       "cost_per_million": 1.5,
 *       "rate_limit": "300 req/sec"
 *     },
 *     "capabilities": {
 *       "transactions": true,
 *       "logs": true,
 *       ...
 *     },
 *     "current_metrics": {
 *       "latency_p50": 118,
 *       "latency_p95": 245,
 *       "uptime_percent": 99.98,
 *       "error_rate": 0.02
 *     },
 *     "scores": {
 *       "final_score": 94.2,
 *       "latency_score": 96.5,
 *       ...
 *     },
 *     "rank": 1,
 *     "trend": "up"
 *   },
 *   "last_updated": "2026-02-02T10:30:00Z"
 * }
 */
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const provider = await db.queryOne(`
      SELECT 
        p.*,
        m.latency_p50, m.latency_p95, m.latency_p99,
        m.uptime_percent, m.error_rate,
        m.final_score, m.latency_score, m.reliability_score,
        m.coverage_score, m.dx_score, m.pricing_score,
        m.rank, m.trend
      FROM providers p
      LEFT JOIN current_metrics m ON p.id = m.provider_id
      WHERE p.slug = ?
    `, [slug]);
    
    if (!provider) {
      return res.status(404).json({ 
        error: 'Provider not found',
        slug 
      });
    }
    
    // Parse JSON fields
    const supported_chains = JSON.parse(provider.supported_chains || '[]');
    const pricing = JSON.parse(provider.pricing_info || '{}');
    const capabilities = JSON.parse(provider.capabilities || '{}');
    
    // Set cache headers (2 minutes)
    res.set('Cache-Control', 'public, max-age=120');
    
    res.json({
      provider: {
        id: provider.id,
        name: provider.name,
        slug: provider.slug,
        logo_url: provider.logo_url,
        website_url: provider.website_url,
        supported_chains,
        pricing,
        capabilities,
        current_metrics: {
          latency_p50: provider.latency_p50,
          latency_p95: provider.latency_p95,
          latency_p99: provider.latency_p99,
          uptime_percent: provider.uptime_percent,
          error_rate: provider.error_rate
        },
        scores: {
          final_score: provider.final_score,
          latency_score: provider.latency_score,
          reliability_score: provider.reliability_score,
          coverage_score: provider.coverage_score,
          dx_score: provider.dx_score,
          pricing_score: provider.pricing_score
        },
        rank: provider.rank,
        trend: provider.trend || 'stable'
      },
      last_updated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Provider detail error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch provider details',
      message: error.message 
    });
  }
});

module.exports = router;
```

### 4.4 Route: Metrics History

**File:** `src/routes/metrics.js`

```javascript
const express = require('express');
const router = express.Router();
const db = require('../db/client');

/**
 * GET /api/metrics/:provider
 * 
 * Returns time-series data for charts
 * 
 * Query params:
 *   - metric: 'latency_p50' | 'latency_p95' | 'uptime_percent' (default: latency_p50)
 *   - timeframe: '24h' | '7d' | '30d' (default: 24h)
 *   - chain: filter by chain (optional)
 * 
 * Response contract:
 * {
 *   "data": [
 *     {
 *       "timestamp": "2026-02-02T10:00:00Z",
 *       "value": 118
 *     },
 *     ...
 *   ],
 *   "metric": "latency_p50",
 *   "unit": "ms",
 *   "timeframe": "24h",
 *   "provider": "alchemy"
 * }
 */
router.get('/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const { 
      metric = 'latency_p50', 
      timeframe = '24h', 
      chain 
    } = req.query;
    
    // Validate metric
    const validMetrics = ['latency_p50', 'latency_p95', 'latency_p99', 'uptime_percent'];
    if (!validMetrics.includes(metric)) {
      return res.status(400).json({ 
        error: 'Invalid metric',
        valid_metrics: validMetrics 
      });
    }
    
    // Calculate time window
    const hours = timeframe === '7d' ? 168 : timeframe === '30d' ? 720 : 24;
    
    // Build query
    let sql = `
      SELECT 
        timestamp,
        ${metric} as value
      FROM metrics_history
      WHERE provider_id = ?
        AND timestamp > datetime('now', '-${hours} hours')
    `;
    
    const params = [provider];
    
    if (chain) {
      sql += ` AND chain = ?`;
      params.push(chain);
    }
    
    sql += ` ORDER BY timestamp ASC`;
    
    const history = await db.query(sql, params);
    
    // Format timestamps
    const data = history.map(row => ({
      timestamp: new Date(row.timestamp).toISOString(),
      value: row.value
    }));
    
    // Set cache headers (5 minutes)
    res.set('Cache-Control', 'public, max-age=300');
    
    res.json({
      data,
      metric,
      unit: metric.includes('latency') ? 'ms' : '%',
      timeframe,
      provider
    });
    
  } catch (error) {
    console.error('Metrics history error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch metrics',
      message: error.message 
    });
  }
});

module.exports = router;
```

### 4.5 Route: Compare

**File:** `src/routes/compare.js`

```javascript
const express = require('express');
const router = express.Router();
const db = require('../db/client');

/**
 * GET /api/compare
 * 
 * Side-by-side provider comparison
 * 
 * Query params:
 *   - a: provider A slug (required)
 *   - b: provider B slug (required)
 * 
 * Response contract:
 * {
 *   "provider_a": { ... },  // Same as /api/provider/:slug
 *   "provider_b": { ... },
 *   "deltas": {
 *     "latency_p50": -15,
 *     "uptime_percent": 0.05,
 *     "final_score": 6.3,
 *     "winner": "provider_a"
 *   }
 * }
 */
router.get('/', async (req, res) => {
  try {
    const { a, b } = req.query;
    
    if (!a || !b) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        required: ['a', 'b']
      });
    }
    
    // Fetch both providers
    const [providerA, providerB] = await Promise.all([
      getProviderData(a),
      getProviderData(b)
    ]);
    
    if (!providerA || !providerB) {
      return res.status(404).json({ 
        error: 'One or both providers not found',
        provider_a: providerA ? 'found' : 'not found',
        provider_b: providerB ? 'found' : 'not found'
      });
    }
    
    // Calculate deltas
    const deltas = {
      latency_p50: providerA.current_metrics.latency_p50 - providerB.current_metrics.latency_p50,
      latency_p95: providerA.current_metrics.latency_p95 - providerB.current_metrics.latency_p95,
      uptime_percent: providerA.current_metrics.uptime_percent - providerB.current_metrics.uptime_percent,
      final_score: providerA.scores.final_score - providerB.scores.final_score,
      winner: null
    };
    
    // Determine winner (higher final score wins)
    deltas.winner = deltas.final_score > 0 ? 'provider_a' : 
                    deltas.final_score < 0 ? 'provider_b' : 'tie';
    
    // Set cache headers (5 minutes)
    res.set('Cache-Control', 'public, max-age=300');
    
    res.json({
      provider_a: providerA,
      provider_b: providerB,
      deltas
    });
    
  } catch (error) {
    console.error('Compare error:', error);
    res.status(500).json({ 
      error: 'Failed to compare providers',
      message: error.message 
    });
  }
});

/**
 * Helper: Get full provider data (reuses provider route logic)
 */
async function getProviderData(slug) {
  const provider = await db.queryOne(`
    SELECT 
      p.*,
      m.latency_p50, m.latency_p95, m.latency_p99,
      m.uptime_percent, m.error_rate,
      m.final_score, m.latency_score, m.reliability_score,
      m.coverage_score, m.dx_score, m.pricing_score,
      m.rank, m.trend
    FROM providers p
    LEFT JOIN current_metrics m ON p.id = m.provider_id
    WHERE p.slug = ?
  `, [slug]);
  
  if (!provider) return null;
  
  return {
    id: provider.id,
    name: provider.name,
    slug: provider.slug,
    logo_url: provider.logo_url,
    website_url: provider.website_url,
    supported_chains: JSON.parse(provider.supported_chains || '[]'),
    pricing: JSON.parse(provider.pricing_info || '{}'),
    capabilities: JSON.parse(provider.capabilities || '{}'),
    current_metrics: {
      latency_p50: provider.latency_p50,
      latency_p95: provider.latency_p95,
      latency_p99: provider.latency_p99,
      uptime_percent: provider.uptime_percent,
      error_rate: provider.error_rate
    },
    scores: {
      final_score: provider.final_score,
      latency_score: provider.latency_score,
      reliability_score: provider.reliability_score,
      coverage_score: provider.coverage_score,
      dx_score: provider.dx_score,
      pricing_score: provider.pricing_score
    },
    rank: provider.rank,
    trend: provider.trend || 'stable'
  };
}

module.exports = router;
```

---

## 5. Metric Collection System

### 5.1 Collector Service

**File:** `src/services/collector.js`

```javascript
const db = require('../db/client');
const providerAdapters = require('./providers');

/**
 * Main metric collection orchestrator
 * Called by cron every 5 minutes
 */
class MetricsCollector {
  constructor() {
    this.isCollecting = false;
  }
  
  /**
   * Collect metrics for all providers
   */
  async collectAll() {
    if (this.isCollecting) {
      console.log('⚠ Collection already in progress, skipping');
      return;
    }
    
    this.isCollecting = true;
    console.log('📊 Starting metrics collection...');
    
    try {
      // Get all providers
      const providers = await db.query('SELECT id FROM providers');
      
      // Collect metrics in parallel
      const results = await Promise.allSettled(
        providers.map(p => this.collectForProvider(p.id))
      );
      
      // Log results
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      console.log(`✓ Collection complete: ${successful} succeeded, ${failed} failed`);
      
      // Recalculate scores after collection
      await require('./scorer').calculateAllScores();
      
    } catch (error) {
      console.error('❌ Collection failed:', error);
    } finally {
      this.isCollecting = false;
    }
  }
  
  /**
   * Collect metrics for a single provider
   */
  async collectForProvider(providerId) {
    const adapter = providerAdapters.get(providerId);
    
    if (!adapter) {
      console.warn(`⚠ No adapter found for ${providerId}`);
      return;
    }
    
    console.log(`  Collecting metrics for ${providerId}...`);
    
    try {
      // Run adapter's measurement logic
      const metrics = await adapter.measure();
      
      // Update current_metrics
      await db.run(`
        INSERT OR REPLACE INTO current_metrics 
        (provider_id, latency_p50, latency_p95, latency_p99, uptime_percent, error_rate, last_updated)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        providerId,
        metrics.latency_p50,
        metrics.latency_p95,
        metrics.latency_p99,
        metrics.uptime_percent,
        metrics.error_rate
      ]);
      
      // Insert into history
      await db.run(`
        INSERT INTO metrics_history
        (provider_id, timestamp, latency_p50, latency_p95, uptime_percent, error_rate)
        VALUES (?, CURRENT_TIMESTAMP, ?, ?, ?, ?)
      `, [
        providerId,
        metrics.latency_p50,
        metrics.latency_p95,
        metrics.uptime_percent,
        metrics.error_rate
      ]);
      
      console.log(`  ✓ ${providerId}: p50=${metrics.latency_p50}ms, uptime=${metrics.uptime_percent}%`);
      
    } catch (error) {
      console.error(`  ❌ ${providerId} failed:`, error.message);
      
      // Mark as error in current_metrics
      await db.run(`
        UPDATE current_metrics 
        SET error_rate = 100, last_updated = CURRENT_TIMESTAMP
        WHERE provider_id = ?
      `, [providerId]);
    }
  }
}

module.exports = new MetricsCollector();
```

### 5.2 Provider Adapter Interface

**File:** `src/services/providers.js`

```javascript
/**
 * Provider Adapter Registry
 * 
 * Each adapter implements:
 * - measure(): Promise<Metrics>
 * 
 * Metrics shape:
 * {
 *   latency_p50: number,
 *   latency_p95: number,
 *   latency_p99: number,
 *   uptime_percent: number,
 *   error_rate: number
 * }
 */

const alchemyAdapter = require('../adapters/alchemy');
const infuraAdapter = require('../adapters/infura');
const quicknodeAdapter = require('../adapters/quicknode');

class ProviderRegistry {
  constructor() {
    this.adapters = new Map();
    
    // Register adapters
    this.register('alchemy', alchemyAdapter);
    this.register('infura', infuraAdapter);
    this.register('quicknode', quicknodeAdapter);
  }
  
  register(id, adapter) {
    this.adapters.set(id, adapter);
  }
  
  get(id) {
    return this.adapters.get(id);
  }
  
  getAll() {
    return Array.from(this.adapters.keys());
  }
}

module.exports = new ProviderRegistry();
```

### 5.3 Example Adapter: Alchemy

**File:** `src/adapters/alchemy.js`

```javascript
const https = require('https');

/**
 * Alchemy Adapter
 * Measures latency and reliability by making test RPC calls
 */
class AlchemyAdapter {
  constructor() {
    this.endpoint = process.env.ALCHEMY_ENDPOINT || 'https://eth-mainnet.g.alchemy.com/v2/demo';
    this.sampleSize = 10; // Number of test calls
  }
  
  /**
   * Main measurement function
   */
  async measure() {
    const samples = [];
    let errorCount = 0;
    
    // Run multiple test calls
    for (let i = 0; i < this.sampleSize; i++) {
      try {
        const latency = await this.testCall();
        samples.push(latency);
      } catch (error) {
        errorCount++;
      }
      
      // Small delay between calls
      await this.sleep(200);
    }
    
    if (samples.length === 0) {
      throw new Error('All test calls failed');
    }
    
    // Calculate percentiles
    samples.sort((a, b) => a - b);
    
    return {
      latency_p50: this.percentile(samples, 50),
      latency_p95: this.percentile(samples, 95),
      latency_p99: this.percentile(samples, 99),
      uptime_percent: ((this.sampleSize - errorCount) / this.sampleSize) * 100,
      error_rate: (errorCount / this.sampleSize) * 100
    };
  }
  
  /**
   * Make a single test RPC call and measure latency
   */
  async testCall() {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const postData = JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1
      });
      
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': postData.length
        },
        timeout: 5000 // 5 second timeout
      };
      
      const req = https.request(this.endpoint, options, (res) => {
        let data = '';
        
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const latency = Date.now() - startTime;
          
          if (res.statusCode === 200) {
            resolve(latency);
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        });
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.write(postData);
      req.end();
    });
  }
  
  /**
   * Calculate percentile from sorted array
   */
  percentile(arr, p) {
    if (arr.length === 0) return 0;
    
    const index = Math.ceil((p / 100) * arr.length) - 1;
    return arr[Math.max(0, index)];
  }
  
  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new AlchemyAdapter();
```

### 5.4 Scoring Service

**File:** `src/services/scorer.js`

```javascript
const db = require('../db/client');

/**
 * Scoring algorithm
 * Calculates final scores for all providers based on metrics
 */
class ScoringService {
  /**
   * Calculate scores for all providers
   */
  async calculateAllScores() {
    console.log('🎯 Calculating scores...');
    
    try {
      // Get all providers with current metrics
      const providers = await db.query(`
        SELECT 
          p.id,
          p.supported_chains,
          p.capabilities,
          p.pricing_info,
          m.latency_p50,
          m.uptime_percent,
          m.error_rate
        FROM providers p
        INNER JOIN current_metrics m ON p.id = m.provider_id
      `);
      
      // Calculate individual scores
      const scored = providers.map(p => {
        const scores = this.calculateScores(p);
        return { provider_id: p.id, ...scores };
      });
      
      // Sort by final score to assign ranks
      scored.sort((a, b) => b.final_score - a.final_score);
      
      // Update database
      for (let i = 0; i < scored.length; i++) {
        const s = scored[i];
        const rank = i + 1;
        
        await db.run(`
          UPDATE current_metrics
          SET 
            final_score = ?,
            latency_score = ?,
            reliability_score = ?,
            coverage_score = ?,
            dx_score = ?,
            pricing_score = ?,
            rank = ?
          WHERE provider_id = ?
        `, [
          s.final_score,
          s.latency_score,
          s.reliability_score,
          s.coverage_score,
          s.dx_score,
          s.pricing_score,
          rank,
          s.provider_id
        ]);
      }
      
      console.log('✓ Scores updated');
      
    } catch (error) {
      console.error('❌ Scoring failed:', error);
    }
  }
  
  /**
   * Calculate individual scores for a provider
   */
  calculateScores(provider) {
    // 1. Latency Score (0-100, inverse scale)
    // Lower latency = higher score
    const latency_p50 = provider.latency_p50 || 1000;
    const latency_score = Math.max(0, Math.min(100, 100 - (latency_p50 / 10)));
    
    // 2. Reliability Score (0-100, linear)
    const uptime = provider.uptime_percent || 0;
    const reliability_score = uptime;
    
    // 3. Coverage Score (0-100)
    const chains = JSON.parse(provider.supported_chains || '[]');
    const coverage_score = Math.min(100, (chains.length / 10) * 100);
    
    // 4. DX Score (0-100, based on capabilities)
    const capabilities = JSON.parse(provider.capabilities || '{}');
    const dx_score = this.calculateDXScore(capabilities);
    
    // 5. Pricing Score (0-100, inverse of cost)
    const pricing = JSON.parse(provider.pricing_info || '{}');
    const cost = pricing.cost_per_million || 5;
    const pricing_score = Math.max(0, Math.min(100, 100 - (cost * 10)));
    
    // Weighted final score
    const final_score = (
      (latency_score * 0.30) +
      (reliability_score * 0.25) +
      (coverage_score * 0.20) +
      (dx_score * 0.15) +
      (pricing_score * 0.10)
    );
    
    return {
      latency_score: Math.round(latency_score * 100) / 100,
      reliability_score: Math.round(reliability_score * 100) / 100,
      coverage_score: Math.round(coverage_score * 100) / 100,
      dx_score: Math.round(dx_score * 100) / 100,
      pricing_score: Math.round(pricing_score * 100) / 100,
      final_score: Math.round(final_score * 100) / 100
    };
  }
  
  /**
   * Calculate DX score based on feature completeness
   */
  calculateDXScore(capabilities) {
    const weights = {
      transactions: 20,
      logs: 15,
      token_balances: 15,
      nft_metadata: 10,
      historical_depth: 25,
      custom_indexing: 15
    };
    
    let score = 0;
    
    for (const [feature, weight] of Object.entries(weights)) {
      if (capabilities[feature]) {
        score += weight;
      }
    }
    
    return score;
  }
}

module.exports = new ScoringService();
```

---

## 6. Main Server Setup

### 6.1 Entry Point

**File:** `src/index.js`

```javascript
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const db = require('./db/client');
const config = require('./config');

// Services
const collector = require('./services/collector');

// Routes
const leaderboardRoute = require('./routes/leaderboard');
const providerRoute = require('./routes/provider');
const metricsRoute = require('./routes/metrics');
const compareRoute = require('./routes/compare');

// Initialize Express
const app = express();

// Middleware
app.use(cors({
  origin: config.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
});

// API Routes
app.use('/api/leaderboard', leaderboardRoute);
app.use('/api/provider', providerRoute);
app.use('/api/metrics', metricsRoute);
app.use('/api/compare', compareRoute);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    path: req.path 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Startup sequence
async function start() {
  try {
    console.log('🚀 Starting Web3 Infra Benchmarking Backend...');
    
    // Initialize database
    await db.initialize();
    
    // Run initial metric collection
    console.log('📊 Running initial metric collection...');
    await collector.collectAll();
    
    // Setup cron job (every 5 minutes)
    cron.schedule('*/5 * * * *', () => {
      console.log('⏰ Cron triggered');
      collector.collectAll();
    });
    
    console.log('✓ Cron scheduled (every 5 minutes)');
    
    // Start server
    const PORT = config.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Ready to accept requests`);
      console.log(`\nAPI Endpoints:`);
      console.log(`  GET  /api/leaderboard`);
      console.log(`  GET  /api/provider/:slug`);
      console.log(`  GET  /api/metrics/:provider`);
      console.log(`  GET  /api/compare?a=alchemy&b=infura`);
    });
    
  } catch (error) {
    console.error('❌ Startup failed:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await db.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await db.close();
  process.exit(0);
});

// Start the server
start();
```

### 6.2 Configuration

**File:** `src/config.js`

```javascript
require('dotenv').config();

module.exports = {
  // Server
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  // Provider endpoints (for testing)
  ALCHEMY_ENDPOINT: process.env.ALCHEMY_ENDPOINT,
  INFURA_ENDPOINT: process.env.INFURA_ENDPOINT,
  QUICKNODE_ENDPOINT: process.env.QUICKNODE_ENDPOINT,
  
  // Collection settings
  COLLECTION_INTERVAL: process.env.COLLECTION_INTERVAL || '*/5 * * * *', // 5 min
  SAMPLE_SIZE: parseInt(process.env.SAMPLE_SIZE || '10'),
  
  // Database
  DB_PATH: process.env.DB_PATH || './data/benchmark.db'
};
```

---

## 7. Package Configuration

### 7.1 package.json

**File:** `package.json`

```json
{
  "name": "web3-infra-backend",
  "version": "1.0.0",
  "description": "Pluggable backend for Web3 infrastructure benchmarking dashboard",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "init-db": "node scripts/init-db.js",
    "test": "node scripts/test-endpoints.js"
  },
  "keywords": ["web3", "rpc", "benchmarking", "infrastructure"],
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "sqlite3": "^5.1.7",
    "node-cron": "^3.0.3",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.3"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 7.2 Environment Variables

**File:** `.env.example`

```bash
# Server Configuration
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Provider Endpoints (optional - uses public endpoints by default)
ALCHEMY_ENDPOINT=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
INFURA_ENDPOINT=https://mainnet.infura.io/v3/YOUR_KEY
QUICKNODE_ENDPOINT=https://YOUR_SUBDOMAIN.quiknode.pro/YOUR_KEY

# Collection Settings
COLLECTION_INTERVAL=*/5 * * * *
SAMPLE_SIZE=10

# Database
DB_PATH=./data/benchmark.db
```

---

## 8. Deployment Guide

### 8.1 Local Development

```bash
# 1. Clone and install
git clone <repo>
cd backend
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your settings

# 3. Start server
npm run dev

# Server starts on http://localhost:3001
# Auto-initializes database with sample data
# Begins collecting metrics every 5 minutes
```

### 8.2 Production Deployment

#### Option A: Railway (Recommended)

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Initialize project
railway init

# 4. Deploy
railway up

# 5. Add environment variables in Railway dashboard
```

**Railway configuration:**
- Auto-detects Node.js
- Persistent volume for SQLite: `/data`
- Environment variables: Add via dashboard
- Custom domain: Available on paid plan

#### Option B: Render

```yaml
# render.yaml
services:
  - type: web
    name: web3-infra-backend
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001
    disk:
      name: data
      mountPath: /data
      sizeGB: 1
```

#### Option C: Fly.io

```toml
# fly.toml
app = "web3-infra-backend"

[build]
  builder = "heroku/buildpacks:20"

[[services]]
  internal_port = 3001
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

[mounts]
  source = "data"
  destination = "/data"
```

---

## 9. Frontend Integration

### 9.1 API Client Setup

**File:** `frontend/src/lib/api.ts`

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class ApiClient {
  private baseUrl: string;
  
  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }
  
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return response.json();
  }
  
  // Leaderboard
  async getLeaderboard(params?: { chain?: string; sort?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.get(`/api/leaderboard${query ? `?${query}` : ''}`);
  }
  
  // Provider detail
  async getProvider(slug: string) {
    return this.get(`/api/provider/${slug}`);
  }
  
  // Metrics history
  async getMetrics(provider: string, params?: { 
    metric?: string; 
    timeframe?: string; 
    chain?: string;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return this.get(`/api/metrics/${provider}${query ? `?${query}` : ''}`);
  }
  
  // Compare
  async compare(providerA: string, providerB: string) {
    return this.get(`/api/compare?a=${providerA}&b=${providerB}`);
  }
}

export const api = new ApiClient();
```

### 9.2 React Query Setup

**File:** `frontend/src/hooks/useApi.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useLeaderboard(params?: { chain?: string; sort?: string }) {
  return useQuery({
    queryKey: ['leaderboard', params],
    queryFn: () => api.getLeaderboard(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProvider(slug: string) {
  return useQuery({
    queryKey: ['provider', slug],
    queryFn: () => api.getProvider(slug),
    enabled: !!slug,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useMetrics(provider: string, params?: {
  metric?: string;
  timeframe?: string;
}) {
  return useQuery({
    queryKey: ['metrics', provider, params],
    queryFn: () => api.getMetrics(provider, params),
    enabled: !!provider,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCompare(providerA: string, providerB: string) {
  return useQuery({
    queryKey: ['compare', providerA, providerB],
    queryFn: () => api.compare(providerA, providerB),
    enabled: !!providerA && !!providerB,
    staleTime: 5 * 60 * 1000,
  });
}
```

### 9.3 Frontend Environment Config

**File:** `frontend/.env.local`

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**For production:**
```bash
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

---

## 10. Testing & Validation

### 10.1 Test Script

**File:** `scripts/test-endpoints.js`

```javascript
const http = require('http');

const BASE_URL = process.env.API_URL || 'http://localhost:3001';

async function testEndpoint(path, expectedFields) {
  return new Promise((resolve, reject) => {
    http.get(`${BASE_URL}${path}`, (res) => {
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          
          // Check for expected fields
          const missing = expectedFields.filter(field => !(field in json));
          
          if (missing.length > 0) {
            reject(new Error(`Missing fields: ${missing.join(', ')}`));
          } else {
            resolve(json);
          }
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('🧪 Running API tests...\n');
  
  const tests = [
    {
      name: 'Leaderboard',
      path: '/api/leaderboard',
      fields: ['data', 'last_updated']
    },
    {
      name: 'Provider Detail',
      path: '/api/provider/alchemy',
      fields: ['provider', 'last_updated']
    },
    {
      name: 'Metrics History',
      path: '/api/metrics/alchemy?timeframe=24h',
      fields: ['data', 'metric', 'timeframe']
    },
    {
      name: 'Compare',
      path: '/api/compare?a=alchemy&b=infura',
      fields: ['provider_a', 'provider_b', 'deltas']
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      await testEndpoint(test.path, test.fields);
      console.log(`✓ ${test.name}`);
      passed++;
    } catch (error) {
      console.log(`✗ ${test.name}: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
```

**Run tests:**
```bash
npm test
```

---

## 11. Monitoring & Observability

### 11.1 Logging

Backend includes console logging for:
- Server startup
- Database initialization
- Metric collection (success/failure per provider)
- Score calculation
- API requests
- Errors

**Production logging:**
Add a logging library like `winston`:

```bash
npm install winston
```

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### 11.2 Health Checks

Built-in health endpoint:

```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-02T10:30:00Z"
}
```

---

## 12. Maintenance & Operations

### 12.1 Database Maintenance

**Backup SQLite database:**
```bash
sqlite3 data/benchmark.db ".backup backup.db"
```

**Clear old history (manual):**
```bash
sqlite3 data/benchmark.db "DELETE FROM metrics_history WHERE timestamp < datetime('now', '-30 days')"
```

**Vacuum database:**
```bash
sqlite3 data/benchmark.db "VACUUM"
```

### 12.2 Adding New Providers

1. Add provider metadata to `seed.sql`
2. Create adapter in `src/adapters/newprovider.js`
3. Register adapter in `src/services/providers.js`
4. Restart server

**Adapter template:**
```javascript
class NewProviderAdapter {
  constructor() {
    this.endpoint = process.env.NEWPROVIDER_ENDPOINT;
  }
  
  async measure() {
    // Implement measurement logic
    return {
      latency_p50: 0,
      latency_p95: 0,
      latency_p99: 0,
      uptime_percent: 0,
      error_rate: 0
    };
  }
}

module.exports = new NewProviderAdapter();
```

---

## 13. Troubleshooting

### Common Issues

**Issue: Database locked**
```
Solution: SQLite has limited concurrent write support. 
If this occurs frequently, consider migrating to PostgreSQL.
```

**Issue: Metrics not updating**
```
Check logs for cron execution
Verify adapters can reach provider endpoints
Check for API key issues in .env
```

**Issue: CORS errors**
```
Update CORS_ORIGIN in .env to match frontend URL
Ensure frontend is using correct API_URL
```

**Issue: High memory usage**
```
Reduce SAMPLE_SIZE in .env
Implement more aggressive history cleanup
Consider upgrading deployment plan
```

---

## 14. Roadmap & Extensions

### Phase 2 Features (Post-MVP)

- [ ] PostgreSQL migration (for production scale)
- [ ] Redis caching layer
- [ ] Websocket support for real-time updates
- [ ] API authentication
- [ ] Rate limiting
- [ ] Custom metric weights (user preferences)
- [ ] Historical snapshots (daily/weekly reports)
- [ ] Provider status page integration
- [ ] Multi-chain specific benchmarks
- [ ] Geographic latency testing

---

## 15. Summary

This backend is designed to be:

✅ **Minimal** - Single Node.js process, no complex infrastructure  
✅ **Pluggable** - Drop into existing frontend with zero changes  
✅ **Self-contained** - SQLite database, in-process scheduling  
✅ **Production-ready** - Deploy to Railway/Render/Fly in minutes  
✅ **Extensible** - Easy to add new providers and metrics  
✅ **Observable** - Built-in logging and health checks  

**Total setup time: ~30 minutes**
**Total files: ~15**
**Total lines of code: ~1500**

---

## Appendix A: Complete File Checklist

```
backend/
├── src/
│   ├── index.js ✓
│   ├── config.js ✓
│   ├── routes/
│   │   ├── leaderboard.js ✓
│   │   ├── provider.js ✓
│   │   ├── metrics.js ✓
│   │   └── compare.js ✓
│   ├── services/
│   │   ├── collector.js ✓
│   │   ├── scorer.js ✓
│   │   └── providers.js ✓
│   ├── db/
│   │   ├── schema.sql ✓
│   │   ├── seed.sql ✓
│   │   └── client.js ✓
│   └── adapters/
│       ├── alchemy.js ✓
│       ├── infura.js (similar to alchemy.js)
│       └── quicknode.js (similar to alchemy.js)
├── scripts/
│   └── test-endpoints.js ✓
├── data/
│   └── .gitkeep (database generated at runtime)
├── package.json ✓
├── .env.example ✓
├── .gitignore
└── README.md
```

---

**End of PRD**

This document provides everything needed to implement a production-ready, pluggable backend that seamlessly integrates with your existing frontend components. 🚀