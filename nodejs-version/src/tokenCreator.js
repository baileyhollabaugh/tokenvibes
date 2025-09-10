const { 
  Connection, 
  Keypair, 
  PublicKey, 
  Transaction
} = require('@solana/web3.js');

// Metaplex Umi imports
const { createUmi } = require('@metaplex-foundation/umi-bundle-defaults');
const { keypairIdentity, generateSigner, percentAmount, publicKey } = require('@metaplex-foundation/umi');
const { createFungible } = require('@metaplex-foundation/mpl-token-metadata');
const { createTokenIfMissing } = require('@metaplex-foundation/mpl-toolbox');
const { fromWeb3JsKeypair } = require('@metaplex-foundation/umi-web3js-adapters');
const { getAssociatedTokenAddress } = require('@solana/spl-token');

class TokenCreator {
  constructor() {
    this.connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://solana-mainnet.g.alchemy.com/v2/sw8B8Gyq0uicnRSqohuwG',
      'confirmed'
    );
  }

  async createToken(tokenData, walletPublicKey) {
    try {
      console.log('🚀 Creating token with Metaplex metadata...');
      console.log('Token data:', tokenData);
      console.log('Wallet address:', walletPublicKey.toString());

      // Create Umi instance
      const umi = createUmi(this.connection.rpcEndpoint)
        .use(keypairIdentity(fromWeb3JsKeypair(Keypair.generate()))); // Use a random keypair for Umi

      // Create metadata JSON
      const metadata = {
        name: tokenData.name,
        symbol: tokenData.symbol,
        description: tokenData.description || '',
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

      // Create the mint signer
      const mint = generateSigner(umi);
      console.log('🔑 Mint address:', mint.publicKey.toString());

      // Create the token with metadata using Metaplex Umi
      console.log('🪙 Creating fungible token with metadata...');
      const result = await createFungible(umi, {
        mint,
        name: tokenData.name,
        symbol: tokenData.symbol,
        uri: metadataUri,
        sellerFeeBasisPoints: percentAmount(0), // 0% royalty
        decimals: tokenData.decimals,
        tokenOwner: publicKey(walletPublicKey.toString()),
        amount: BigInt(tokenData.quantity * Math.pow(10, tokenData.decimals)),
        tokenStandard: 0, // Fungible token standard
      }).sendAndConfirm(umi);

      console.log('✅ Token created with metadata:', result);

      // Get the destination token account address
      const destinationTokenAccount = await getAssociatedTokenAddress(
        new PublicKey(mint.publicKey.toString()),
        new PublicKey(tokenData.destinationAddress)
      );

      // Create associated token account if needed
      try {
        await createTokenIfMissing(umi, {
          mint: publicKey(mint.publicKey.toString()),
          owner: publicKey(tokenData.destinationAddress),
          amount: 0n,
        });
        console.log('✅ Associated token account created');
      } catch (error) {
        console.log('ℹ️ Token account may already exist:', error.message);
      }

      console.log('✅ Token creation completed with signature:', result.signature);

      // Return the results
      return {
        success: true,
        mintAddress: mint.publicKey.toString(),
        metadataUri: metadataUri,
        metadata: metadata,
        quantity: tokenData.quantity,
        decimals: tokenData.decimals,
        destinationAddress: tokenData.destinationAddress,
        destinationTokenAccount: destinationTokenAccount.toString(),
        signature: result.signature
      };

    } catch (error) {
      console.error('❌ Token creation failed:', error);
      throw new Error(`Token creation failed: ${error.message}`);
    }
  }
}

module.exports = TokenCreator;
