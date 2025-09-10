const express = require('express');
const TokenCreator = require('../tokenCreator');
const { PublicKey } = require('@solana/web3.js');

const router = express.Router();
const tokenCreator = new TokenCreator();

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

    res.json({
      success: true,
      message: 'Token created successfully!',
      data: result
    });

  } catch (error) {
    console.error('Token creation error:', error);
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

module.exports = router;
