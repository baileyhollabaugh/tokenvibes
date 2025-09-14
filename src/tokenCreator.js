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

const {
  createCreateMetadataAccountV2Instruction,
} = require('@metaplex-foundation/mpl-token-metadata');

// Use hardcoded program ID for compatibility with proper error handling
const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

// Validate the program ID is properly initialized
if (!TOKEN_METADATA_PROGRAM_ID || typeof TOKEN_METADATA_PROGRAM_ID.toBuffer !== 'function') {
  throw new Error('TOKEN_METADATA_PROGRAM_ID is not properly initialized');
}

class TokenCreator {
  constructor() {
    this.connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://solana-mainnet.g.alchemy.com/v2/sw8B8Gyq0uicnRSqohuwG',
      'confirmed'
    );
  }

  async createToken(tokenData, walletPublicKey) {
    try {
      console.log('🚀 Preparing token creation with Metaplex metadata...');
      console.log('Token data:', tokenData);
      console.log('Wallet address:', walletPublicKey.toString());

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

      // Create metadata account PDA with error handling
      console.log('🔍 Creating metadata PDA...');
      console.log('🔍 TOKEN_METADATA_PROGRAM_ID:', TOKEN_METADATA_PROGRAM_ID);
      console.log('🔍 TOKEN_METADATA_PROGRAM_ID.toBuffer type:', typeof TOKEN_METADATA_PROGRAM_ID.toBuffer);
      console.log('🔍 mintKeypair.publicKey:', mintKeypair.publicKey);
      console.log('🔍 mintKeypair.publicKey.toBuffer type:', typeof mintKeypair.publicKey.toBuffer);
      
      if (!TOKEN_METADATA_PROGRAM_ID.toBuffer) {
        throw new Error('TOKEN_METADATA_PROGRAM_ID.toBuffer is undefined');
      }
      
      const [metadataPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('metadata'),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mintKeypair.publicKey.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );

      console.log('📝 Metadata PDA:', metadataPDA.toString());

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

      // For now, use a placeholder metadata URI
      const metadataUri = `https://example.com/metadata/${Date.now()}.json`;
      console.log('✅ Metadata URI prepared:', metadataUri);

      // Create metadata account instruction using V2 (available in version 3.4.0)
      const createMetadataInstruction = createCreateMetadataAccountV2Instruction(
        {
          metadata: metadataPDA,
          mint: mintKeypair.publicKey,
          mintAuthority: walletPublicKey,
          payer: walletPublicKey,
          updateAuthority: walletPublicKey,
        },
        {
          createMetadataAccountArgsV2: {
            data: {
              name: tokenData.name,
              symbol: tokenData.symbol,
              uri: metadataUri,
              sellerFeeBasisPoints: 0,
              creators: null,
              collection: null,
            },
            isMutable: true,
          },
        }
      );

      // Create transaction
      const transaction = new Transaction();
      transaction.add(createAccountInstruction);
      transaction.add(initializeMintInstruction);
      transaction.add(createTokenAccountInstruction);
      transaction.add(mintToInstruction);
      transaction.add(createMetadataInstruction);

      // Set recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = walletPublicKey;

      console.log('✅ Transaction prepared for signing with metadata');

      // Return the transaction for frontend signing
      return {
        success: true,
        name: tokenData.name,
        symbol: tokenData.symbol,
        mintAddress: mintKeypair.publicKey.toString(),
        metadataAddress: metadataPDA.toString(),
        metadataUri: metadataUri,
        metadata: metadata,
        mintKeypair: Array.from(mintKeypair.secretKey),
        quantity: tokenData.quantity,
        decimals: tokenData.decimals,
        destinationAddress: tokenData.destinationAddress,
        destinationTokenAccount: destinationTokenAccount.toString(),
        transaction: transaction.serialize().toString('base64')
      };

    } catch (error) {
      console.error('❌ Token creation failed:', error);
      throw new Error(`Token creation failed: ${error.message}`);
    }
  }
}

module.exports = TokenCreator;