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

class TokenCreator {
  constructor() {
    this.connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://solana-mainnet.g.alchemy.com/v2/sw8B8Gyq0uicnRSqohuwG',
      'confirmed'
    );
  }

  async createToken(tokenData, walletPublicKey) {
    try {
      console.log('🚀 Preparing token creation transaction...');
      console.log('Token data:', tokenData);
      console.log('Wallet address:', walletPublicKey.toString());

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
        metadataUri: metadataUri,
        metadata: metadata,
        mintKeypair: Array.from(mintKeypair.secretKey),
        quantity: tokenData.quantity,
        decimals: tokenData.decimals,
        destinationAddress: tokenData.destinationAddress,
        destinationTokenAccount: destinationTokenAccount.toString(),
        transaction: transaction.serialize({ requireAllSignatures: false }).toString('base64')
      };

    } catch (error) {
      console.error('❌ Token creation failed:', error);
      throw new Error(`Token creation failed: ${error.message}`);
    }
  }
}

module.exports = TokenCreator;