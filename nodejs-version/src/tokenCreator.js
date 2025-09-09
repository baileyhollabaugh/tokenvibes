const { Connection, Keypair, PublicKey, SystemProgram } = require('@solana/web3.js');
const { createUmi } = require('@metaplex-foundation/umi-bundle-defaults');
const { createFungible } = require('@metaplex-foundation/mpl-token-metadata');
const { createTokenIfMissing, findAssociatedTokenPda, mintTokensTo } = require('@metaplex-foundation/mpl-toolbox');
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

  async createToken(tokenData, walletPublicKey) {
    try {
      console.log('🚀 Starting token creation...');
      console.log('Token data:', tokenData);
      console.log('Wallet address:', walletPublicKey.toString());

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

      // Create a temporary keypair for the wallet (this is a limitation of the current approach)
      // In a real production app, you'd need to handle this differently
      const tempWalletKeypair = Keypair.generate();
      
      // Create the token with metadata using Metaplex
      console.log('🪙 Creating token with Metaplex...');
      const createFungibleResult = await createFungible(this.umi, {
        mint: mintKeypair,
        name: tokenData.name,
        uri: metadataUri,
        sellerFeeBasisPoints: 0,
        decimals: tokenData.decimals,
        mintAuthority: tempWalletKeypair,
      }).sendAndConfirm(this.umi);

      console.log('✅ Token created successfully');

      // Create associated token account if needed
      console.log('🏦 Creating associated token account...');
      const associatedTokenPda = findAssociatedTokenPda(this.umi, {
        mint: mintKeypair.publicKey,
        owner: tempWalletKeypair.publicKey,
      });

      await createTokenIfMissing(this.umi, {
        mint: mintKeypair.publicKey,
        owner: tempWalletKeypair.publicKey,
      }).sendAndConfirm(this.umi);

      // Mint tokens
      console.log('💰 Minting tokens...');
      const mintAmount = BigInt(tokenData.quantity) * BigInt(10 ** tokenData.decimals);
      
      await mintTokensTo(this.umi, {
        mint: mintKeypair.publicKey,
        destination: associatedTokenPda,
        amount: mintAmount,
        mintAuthority: tempWalletKeypair,
      }).sendAndConfirm(this.umi);

      console.log('✅ Tokens minted successfully');

      return {
        success: true,
        mintAddress: mintKeypair.publicKey.toString(),
        metadataUri: metadataUri,
        transactionSignature: createFungibleResult.signature,
        quantity: tokenData.quantity,
        decimals: tokenData.decimals
      };

    } catch (error) {
      console.error('❌ Token creation failed:', error);
      throw new Error(`Token creation failed: ${error.message}`);
    }
  }
}

module.exports = TokenCreator;