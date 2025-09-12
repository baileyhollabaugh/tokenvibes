const express = require('express');
const TokenCreator = require('../tokenCreator');
const DatabaseLogger = require('../database');
const { PublicKey } = require('@solana/web3.js');

const router = express.Router();
const tokenCreator = new TokenCreator();

// Create token endpoint
router.post('/create', async (req, res) => {
  // Create database logger instance for this request
  const dbLogger = new DatabaseLogger();
  
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
    console.log('🔍 DEBUG: Token data to log:', {
      name: tokenData.name,
      symbol: tokenData.symbol,
      quantity: tokenData.quantity,
      mintAddress: result.mintAddress,
      creatorWallet: walletAddress
    });
    try {
      await dbLogger.logTokenCreation({
        ...tokenData,
        mintAddress: result.mintAddress,
        creatorWallet: walletAddress
      });
      console.log('🔍 DEBUG: Token creation logging completed successfully');
    } catch (dbError) {
      console.error('❌ Database logging failed:', dbError);
      console.error('❌ Database error details:', JSON.stringify(dbError, null, 2));
      // Don't fail the request if logging fails
    }

    res.json({
      success: true,
      message: 'Token created successfully!',
      data: result
    });

  } catch (error) {
    console.error('Token creation error:', error);
    
    // Log failed token creation to database
    try {
      await dbLogger.logTokenError({
        name: req.body.name,
        symbol: req.body.symbol,
        quantity: req.body.quantity,
        destinationAddress: req.body.destinationAddress,
        creatorWallet: req.body.walletAddress
      }, error.message);
    } catch (dbError) {
      console.error('❌ Error logging failed:', dbError);
    }

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

// Get user's SPL tokens from Solana mainnet
router.get('/user-tokens/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required'
      });
    }

    console.log('🔍 Fetching tokens for wallet:', walletAddress);
    
    // Connect to Solana mainnet
    const { Connection, PublicKey } = require('@solana/web3.js');
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    const publicKey = new PublicKey(walletAddress);
    
    // Get all token accounts for this wallet
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
      programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
    });
    
    console.log('🔍 Found token accounts:', tokenAccounts.value.length);
    
    const userTokens = [];
    
    for (const accountInfo of tokenAccounts.value) {
      const tokenAccount = accountInfo.account.data.parsed.info;
      const tokenAmount = tokenAccount.tokenAmount;
      
      // Only include tokens with non-zero balance
      if (tokenAmount.uiAmount > 0) {
        userTokens.push({
          mint: tokenAccount.mint,
          name: 'Token', // Will be enhanced with metadata later
          symbol: 'TKN',
          balance: tokenAmount.uiAmount,
          decimals: tokenAmount.decimals,
          tokenAccount: accountInfo.pubkey.toString()
        });
      }
    }
    
    console.log('✅ Loaded user tokens:', userTokens.length);

    res.json({
      success: true,
      data: userTokens
    });

  } catch (error) {
    console.error('Get user tokens error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Deploy sale contract
router.post('/deploy-sale', async (req, res) => {
  try {
    const { tokenMint, quantity, pricePerToken, sellerWallet } = req.body;

    if (!tokenMint || !quantity || !pricePerToken || !sellerWallet) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: tokenMint, quantity, pricePerToken, sellerWallet'
      });
    }

    // For now, simulate contract deployment
    // In production, this would deploy an actual Anchor smart contract
    const contractAddress = 'ABC123' + Math.random().toString(36).substring(2, 15);
    
    console.log('🚀 Simulating sale contract deployment...');
    console.log('Token:', tokenMint);
    console.log('Quantity:', quantity);
    console.log('Price:', pricePerToken);
    console.log('Seller:', sellerWallet);

    res.json({
      success: true,
      data: {
        contractAddress,
        tokenMint,
        quantity: parseInt(quantity),
        pricePerToken: parseFloat(pricePerToken),
        sellerWallet,
        totalValue: parseInt(quantity) * parseFloat(pricePerToken),
        status: 'active'
      }
    });

  } catch (error) {
    console.error('Deploy sale error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get contract info for buying
router.get('/contract-info/:contractAddress', async (req, res) => {
  try {
    const { contractAddress } = req.params;

    if (!contractAddress) {
      return res.status(400).json({
        success: false,
        error: 'Contract address is required'
      });
    }

    // For now, return mock contract data
    // In production, this would fetch from the Solana blockchain
    const mockContractInfo = {
      contractAddress,
      tokenName: 'GROKCOIN',
      tokenSymbol: 'GROK',
      tokenMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      pricePerToken: 1.00,
      availableTokens: 100,
      totalTokens: 100,
      sellerWallet: 'ABC123...',
      status: 'active'
    };

    res.json({
      success: true,
      data: mockContractInfo
    });

  } catch (error) {
    console.error('Get contract info error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Buy tokens
router.post('/buy-tokens', async (req, res) => {
  try {
    const { contractAddress, quantity, buyerWallet } = req.body;

    if (!contractAddress || !quantity || !buyerWallet) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: contractAddress, quantity, buyerWallet'
      });
    }

    // For now, simulate token purchase
    // In production, this would interact with the smart contract
    const pricePerToken = 1.00; // This would come from the contract
    const totalCost = parseInt(quantity) * pricePerToken;

    console.log('🛒 Simulating token purchase...');
    console.log('Contract:', contractAddress);
    console.log('Quantity:', quantity);
    console.log('Buyer:', buyerWallet);
    console.log('Total cost:', totalCost);

    res.json({
      success: true,
      data: {
        contractAddress,
        quantity: parseInt(quantity),
        totalCost,
        buyerWallet,
        transactionSignature: 'ABC123' + Math.random().toString(36).substring(2, 15)
      }
    });

  } catch (error) {
    console.error('Buy tokens error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get token statistics endpoint
router.get('/stats', async (req, res) => {
  const dbLogger = new DatabaseLogger();
  
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
