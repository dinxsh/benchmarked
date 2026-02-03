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
