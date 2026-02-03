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
