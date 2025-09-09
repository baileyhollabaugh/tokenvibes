const { Connection, Keypair, PublicKey, SystemProgram } = require('@solana/web3.js');
const axios = require('axios');

class TokenCreator {
  constructor() {
    this.connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://solana-mainnet.g.alchemy.com/v2/sw8B8Gyq0uicnRSqohuwG',
      'confirmed'
    );
  }

  async prepareTokenMetadata(tokenData) {
    try {
      console.log('🚀 Preparing token metadata...');
      console.log('Token data:', tokenData);

      // Create metadata JSON
      const metadata = {
        name: tokenData.name,
        symbol: tokenData.symbol,
        description: tokenData.description,
        image: tokenData.imageUri || '',
        external_url: '',
        attributes: [],
        properties: {
          files: [],
          category: 'image',
          creators: []
        }
      };

      // For now, return a placeholder metadata URI
      // In production, you'd upload to IPFS/Arweave here
      const metadataUri = `https://example.com/metadata/${Date.now()}.json`;
      console.log('✅ Metadata URI prepared:', metadataUri);

      // Create mint keypair
      const mintKeypair = Keypair.generate();
      console.log('🔑 Mint address:', mintKeypair.publicKey.toString());

      return {
        success: true,
        mintAddress: mintKeypair.publicKey.toString(),
        metadataUri: metadataUri,
        metadata: metadata,
        mintKeypair: Array.from(mintKeypair.secretKey), // For frontend use
        quantity: tokenData.quantity,
        decimals: tokenData.decimals,
        destinationAddress: tokenData.destinationAddress
      };

    } catch (error) {
      console.error('❌ Metadata preparation failed:', error);
      throw new Error(`Metadata preparation failed: ${error.message}`);
    }
  }
}

module.exports = TokenCreator;