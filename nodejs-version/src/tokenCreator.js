const { 
  Connection, 
  Keypair, 
  PublicKey, 
  Transaction
} = require('@solana/web3.js');

const {
  createMint,
  createAssociatedTokenAccount,
  mintTo,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID
} = require('@solana/spl-token');

class TokenCreator {
  constructor() {
    this.connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://solana-mainnet.g.alchemy.com/v2/sw8B8Gyq0uicnRSqohuwG',
      'confirmed'
    );
  }

  async createToken(tokenData, walletPublicKey) {
    try {
      console.log('🚀 Creating token on backend...');
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

      // For now, return a placeholder metadata URI
      const metadataUri = `https://example.com/metadata/${Date.now()}.json`;
      console.log('✅ Metadata URI prepared:', metadataUri);

      // Create the mint using the proper createMint function
      console.log('🔑 Creating mint...');
      const mintAddress = await createMint(
        this.connection,
        walletPublicKey,           // payer
        walletPublicKey,           // mintAuthority
        walletPublicKey,           // freezeAuthority (can be null)
        tokenData.decimals         // decimals
      );

      console.log('✅ Mint created:', mintAddress.toString());

      // Get the destination token account address
      const destinationTokenAccount = await getAssociatedTokenAddress(
        mintAddress,
        new PublicKey(tokenData.destinationAddress)
      );

      console.log('📝 Creating associated token account...');
      
      // Create the associated token account if it doesn't exist
      try {
        await createAssociatedTokenAccount(
          this.connection,
          walletPublicKey,                    // payer
          new PublicKey(tokenData.destinationAddress), // owner
          mintAddress                         // mint
        );
        console.log('✅ Associated token account created');
      } catch (error) {
        // Account might already exist, that's okay
        console.log('ℹ️ Token account may already exist:', error.message);
      }

      console.log('🪙 Minting tokens...');
      
      // Mint tokens to the destination account
      const signature = await mintTo(
        this.connection,
        walletPublicKey,           // payer
        mintAddress,               // mint
        destinationTokenAccount,   // destination
        walletPublicKey,           // authority
        tokenData.quantity * Math.pow(10, tokenData.decimals) // amount (in smallest units)
      );

      console.log('✅ Tokens minted, signature:', signature);

      // Return the results
      return {
        success: true,
        mintAddress: mintAddress.toString(),
        metadataUri: metadataUri,
        metadata: metadata,
        quantity: tokenData.quantity,
        decimals: tokenData.decimals,
        destinationAddress: tokenData.destinationAddress,
        destinationTokenAccount: destinationTokenAccount.toString(),
        signature: signature
      };

    } catch (error) {
      console.error('❌ Token creation failed:', error);
      throw new Error(`Token creation failed: ${error.message}`);
    }
  }
}

module.exports = TokenCreator;
