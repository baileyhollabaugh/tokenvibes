const express = require('express');
const TokenCreator = require('../tokenCreator');
const { Keypair, PublicKey } = require('@solana/web3.js');

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

    // Create wallet public key from address
    const walletPublicKey = new PublicKey(walletAddress);

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

    // Prepare metadata and return data for frontend signing
    const result = await tokenCreator.prepareTokenMetadata(tokenData);

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

// Get token info endpoint
router.get('/info/:mintAddress', async (req, res) => {
  try {
    const { mintAddress } = req.params;
    const mintPublicKey = new PublicKey(mintAddress);
    
    const accountInfo = await tokenCreator.connection.getAccountInfo(mintPublicKey);
    
    if (!accountInfo) {
      return res.status(404).json({ error: 'Token not found' });
    }

    res.json({
      mintAddress,
      accountInfo: {
        owner: accountInfo.owner.toString(),
        executable: accountInfo.executable,
        lamports: accountInfo.lamports,
        dataLength: accountInfo.data.length
      }
    });

  } catch (error) {
    console.error('Token info error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
