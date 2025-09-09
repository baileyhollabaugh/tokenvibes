const { Connection, Keypair, PublicKey, SystemProgram } = require('@solana/web3.js');
const { createUmi } = require('@metaplex-foundation/umi-bundle-defaults');
const { irysUploader } = require('@metaplex-foundation/umi-uploader-irys');

class TokenCreator {
  constructor() {
    this.connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
      'confirmed'
    );
    
    this.umi = createUmi(this.connection.rpcEndpoint)
      .use(irysUploader({
        address: process.env.IRYS_URL || 'https://node1.irys.xyz',
        providerUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
        timeout: 60000,
      }));
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

      // Upload metadata to Arweave
      console.log('📤 Uploading metadata to Arweave...');
      const metadataUri = await this.umi.uploader.uploadJson(metadata);
      console.log('✅ Metadata uploaded:', metadataUri);

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