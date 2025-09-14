const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const tokenRoutes = require('./routes/tokenRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Log environment status for debugging
console.log('🔍 Environment check:');
console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
console.log('🔍 VERCEL:', process.env.VERCEL);
console.log('🔍 PORT:', PORT);
console.log('🔍 SOLANA_RPC_URL:', process.env.SOLANA_RPC_URL ? 'SET' : 'NOT SET');

// Trust proxy setting removed - causing conflicts with rate limiting

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.mainnet-beta.solana.com", "https://solana-mainnet.g.alchemy.com", "wss://solana-mainnet.g.alchemy.com"],
    },
  },
}));
app.use(cors());

// Rate limiting - Vercel-compatible configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Vercel-specific configuration to avoid trust proxy issues
  trustProxy: false, // Disable trust proxy to avoid rate limiting bypass
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files with proper cache headers for Vercel
app.use(express.static(path.join(__dirname, '../public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// Routes
app.use('/api/tokens', tokenRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});


// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  console.error('Error Stack:', err.stack);
  
  // Handle specific error types
  if (err.message.includes('Token creation failed')) {
    return res.status(400).json({
      success: false,
      error: 'Token creation failed',
      message: err.message
    });
  }
  
  if (err.message.includes('rate limit')) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests',
      message: 'Please try again later'
    });
  }
  
  res.status(500).json({ 
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Export the Express app for Vercel
module.exports = app;

// Only listen on port for local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Token Vibes Server running on port ${PORT}`);
    console.log(`🌐 Frontend: http://localhost:${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api`);
  });
}
