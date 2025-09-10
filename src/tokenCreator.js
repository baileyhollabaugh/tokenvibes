const { 
  Connection, 
  Keypair, 
  PublicKey, 
  SystemProgram,
  Transaction,
  TransactionInstruction
} = require('@solana/web3.js');

const {
  createInitializeMintInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  getMinimumBalanceForRentExemptMint
} = require('@solana/spl-token');

// Metaplex imports
const { createUmi } = require('@metaplex-foundation/umi-bundle-defaults');
const { mplTokenMetadata } = require('@metaplex-foundation/mpl-token-metadata');
const { createMetadataAccountV3 } = require('@metaplex-foundation/mpl-token-metadata');

class TokenCreator {
  constructor() {
    this.connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://solana-mainnet.g.alchemy.com/v2/sw8B8Gyq0uicnRSqohuwG',
      'confirmed'
    );
    
    // Setup Umi for Metaplex
    this.umi = createUmi(this.connection.rpcEndpoint);
    this.umi.use(mplTokenMetadata());
  }

  async createToken(tokenData, walletPublicKey) {
    try {
      console.log('🚀 Preparing token creation transaction...');
      console.log('Token data:', tokenData);
      console.log('Wallet address:', walletPublicKey.toString());

      // Create Metaplex-compliant metadata for block explorer display
      const metadata = {
        name: tokenData.name,
        symbol: tokenData.symbol,
        description: `${tokenData.name} (${tokenData.symbol}) - Total Supply: ${tokenData.quantity.toLocaleString()}`,
        image: "", // No image for MVP
        external_url: "",
        attributes: [
          {
            trait_type: "Total Supply",
            value: tokenData.quantity.toString()
          }
        ],
        properties: {
          files: [],
          category: "token",
          creators: []
        }
      };

      // For now, return a placeholder metadata URI
      const metadataUri = `https://example.com/metadata/${Date.now()}.json`;
      console.log('✅ Metadata URI prepared:', metadataUri);

      // Create mint keypair
      const mintKeypair = Keypair.generate();
      console.log('🔑 Mint address:', mintKeypair.publicKey.toString());

      // Get rent exemption for mint account
      const rentExemption = await getMinimumBalanceForRentExemptMint(this.connection);
      
      // Create the mint account
      const createAccountInstruction = SystemProgram.createAccount({
        fromPubkey: walletPublicKey,
        newAccountPubkey: mintKeypair.publicKey,
        lamports: rentExemption,
        space: MINT_SIZE,
        programId: TOKEN_PROGRAM_ID
      });

      // Initialize the mint
      const initializeMintInstruction = createInitializeMintInstruction(
        mintKeypair.publicKey, // mint
        tokenData.decimals,    // decimals
        walletPublicKey,       // mintAuthority
        walletPublicKey        // freezeAuthority
      );

      // Get the destination token account address
      const destinationTokenAccount = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        new PublicKey(tokenData.destinationAddress)
      );

      // Create associated token account instruction
      const createTokenAccountInstruction = createAssociatedTokenAccountInstruction(
        walletPublicKey,                    // payer
        destinationTokenAccount,            // associatedToken
        new PublicKey(tokenData.destinationAddress), // owner
        mintKeypair.publicKey               // mint
      );

      // Mint tokens to the destination account
      const mintToInstruction = createMintToInstruction(
        mintKeypair.publicKey,        // mint
        destinationTokenAccount,      // destination
        walletPublicKey,              // authority
        tokenData.quantity * Math.pow(10, tokenData.decimals) // amount
      );

      // Note: For MVP, we're creating a basic SPL token
      // The token will be functional but may not show metadata in all block explorers
      // To show proper metadata in Solscan, we would need to add Metaplex metadata account creation
      console.log('ℹ️ Creating basic SPL token (metadata display may be limited)');
      console.log('ℹ️ Token will be functional with name, symbol, and quantity');

      // Create transaction
      const transaction = new Transaction();
      transaction.add(createAccountInstruction);
      transaction.add(initializeMintInstruction);
      transaction.add(createTokenAccountInstruction);
      transaction.add(mintToInstruction);

      // Set recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = walletPublicKey;

      console.log('✅ Transaction prepared for signing');

      // Return the transaction for frontend signing
      return {
        success: true,
        mintAddress: mintKeypair.publicKey.toString(),
        name: tokenData.name,
        symbol: tokenData.symbol,
        quantity: tokenData.quantity,
        decimals: tokenData.decimals,
        destinationAddress: tokenData.destinationAddress,
        destinationTokenAccount: destinationTokenAccount.toString(),
        metadata: metadata,
        metadataUri: metadataUri,
        mintKeypair: Array.from(mintKeypair.secretKey),
        transaction: transaction.serialize({ requireAllSignatures: false }).toString('base64')
      };

    } catch (error) {
      console.error('❌ Token creation failed:', error);
      throw new Error(`Token creation failed: ${error.message}`);
    }
  }
}

module.exports = TokenCreator;