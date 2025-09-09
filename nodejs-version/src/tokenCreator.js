const { Connection, Keypair, PublicKey, SystemProgram } = require('@solana/web3.js');
const { createUmi } = require('@metaplex-foundation/umi-bundle-defaults');
const { createFungible } = require('@metaplex-foundation/mpl-token-metadata');
const { createTokenIfMissing, findAssociatedTokenPda, mintTokensTo } = require('@metaplex-foundation/mpl-toolbox');
const { irysUploader } = require('@metaplex-foundation/umi-uploader-irys');
const { generateSigner, signerIdentity } = require('@metaplex-foundation/umi');

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
      
      // Use the destination address for the token account
      const destinationPublicKey = new PublicKey(tokenData.destinationAddress);
      
      // Set up Umi with a signer
      const umiWithSigner = this.umi.use(signerIdentity(tempWalletKeypair));
      
      // Create the token with metadata using Metaplex
      console.log('🪙 Creating token with Metaplex...');
      const createFungibleResult = await createFungible(umiWithSigner, {
        mint: mintKeypair,
        name: tokenData.name,
        uri: metadataUri,
        sellerFeeBasisPoints: 0,
        decimals: tokenData.decimals,
        mintAuthority: tempWalletKeypair,
      }).sendAndConfirm(umiWithSigner);

      console.log('✅ Token created successfully');

      // Create associated token account if needed
      console.log('🏦 Creating associated token account...');
      const associatedTokenPda = findAssociatedTokenPda(umiWithSigner, {
        mint: mintKeypair.publicKey,
        owner: destinationPublicKey,
      });

      await createTokenIfMissing(umiWithSigner, {
        mint: mintKeypair.publicKey,
        owner: destinationPublicKey,
      }).sendAndConfirm(umiWithSigner);

      // Mint tokens
      console.log('💰 Minting tokens...');
      const mintAmount = BigInt(tokenData.quantity) * BigInt(10 ** tokenData.decimals);
      
      await mintTokensTo(umiWithSigner, {
        mint: mintKeypair.publicKey,
        destination: associatedTokenPda,
        amount: mintAmount,
        mintAuthority: tempWalletKeypair,
      }).sendAndConfirm(umiWithSigner);

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