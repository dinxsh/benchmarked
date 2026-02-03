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
