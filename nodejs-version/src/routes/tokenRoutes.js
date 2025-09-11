const express = require('express');
const TokenCreator = require('../tokenCreator');
const DatabaseLogger = require('../database');
const { PublicKey } = require('@solana/web3.js');

const router = express.Router();
const tokenCreator = new TokenCreator();
const dbLogger = new DatabaseLogger();

// Create token endpoint
router.post('/create', async (req, res) => {
  try {
    const { name, symbol, description, quantity, destinationAddress, walletAddress } = req.body;

    // Validate required fields
    if (!name || !symbol || !quantity || !walletAddress || !destinationAddress) {
      return res.status(400).json({
        error: 'Missing required fields: name, symbol, quantity, walletAddress, destinationAddress'
      });
    }

    // Prepare token data
    const tokenData = {
      name: name.trim(),
      symbol: symbol.trim().toUpperCase(),
      description: description?.trim() || '',
      quantity: parseInt(quantity),
      decimals: 9, // Always use 9 decimals
      destinationAddress: destinationAddress.trim(),
      imageUri: '' // No image upload
    };

    // Create token on backend
    const walletPublicKey = new PublicKey(walletAddress);
    const result = await tokenCreator.createToken(tokenData, walletPublicKey);

    // Log successful token creation to database
    console.log('🔍 DEBUG: About to log token creation to database...');
    await dbLogger.logTokenCreation({
      ...tokenData,
      mintAddress: result.mintAddress,
      creatorWallet: walletAddress
    });
    console.log('🔍 DEBUG: Token creation logging completed');

    res.json({
      success: true,
      message: 'Token created successfully!',
      data: result
    });

  } catch (error) {
    console.error('Token creation error:', error);
    
    // Log failed token creation to database
    await dbLogger.logTokenError({
      name: req.body.name,
      symbol: req.body.symbol,
      quantity: req.body.quantity,
      destinationAddress: req.body.destinationAddress,
      creatorWallet: req.body.walletAddress
    }, error.message);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get token info endpoint (placeholder)
router.get('/info/:mintAddress', (req, res) => {
  res.status(501).json({ message: 'Not Implemented' });
});

// Get token statistics endpoint
router.get('/stats', async (req, res) => {
  try {
    const stats = await dbLogger.getTokenStats();
    
    if (!stats) {
      return res.status(503).json({
        success: false,
        error: 'Database not available'
      });
    }

    // Calculate some basic statistics
    const totalTokens = stats.length;
    const successfulTokens = stats.filter(token => token.success).length;
    const failedTokens = stats.filter(token => !token.success).length;
    
    // Get recent tokens (last 10)
    const recentTokens = stats.slice(0, 10);

    res.json({
      success: true,
      data: {
        totalTokens,
        successfulTokens,
        failedTokens,
        successRate: totalTokens > 0 ? (successfulTokens / totalTokens * 100).toFixed(1) : 0,
        recentTokens
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
