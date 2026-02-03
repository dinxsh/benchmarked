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
app.use(
  cors({
    origin: config.CORS_ORIGIN || '*',
    credentials: true
  })
);
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
