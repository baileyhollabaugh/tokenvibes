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

// Metaplex Token Metadata Program ID
const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

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

      // Create metadata account for block explorer display
      console.log('📝 Creating metadata account for name/ticker display...');
      
      
      // Find metadata PDA
      const [metadataAccount] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('metadata'),
          TOKEN_METADATA_PROGRAM_ID.toBytes(),
          mintKeypair.publicKey.toBytes()
        ],
        TOKEN_METADATA_PROGRAM_ID
      );
      
      console.log('✅ Metadata account:', metadataAccount.toString());
      
      // Create proper metadata instruction using modern format
      console.log('📝 Creating modern metadata instruction...');
      
      // Create metadata account instruction using CreateMetadataAccountV2 format
      const nameBytes = Buffer.from(metadata.name, 'utf8');
      const symbolBytes = Buffer.from(metadata.symbol, 'utf8');
      const uriBytes = Buffer.from(metadataUri, 'utf8');

      const metadataInstruction = new TransactionInstruction({
        keys: [
          { pubkey: metadataAccount, isSigner: false, isWritable: true },
          { pubkey: mintKeypair.publicKey, isSigner: false, isWritable: false },
          { pubkey: walletPublicKey, isSigner: true, isWritable: false },
          { pubkey: walletPublicKey, isSigner: true, isWritable: false },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: TOKEN_METADATA_PROGRAM_ID,
        data: Buffer.concat([
          Buffer.from([1]), // CreateMetadataAccountV2 instruction
          Buffer.from([1]), // isMutable = true
          Buffer.from([nameBytes.length]), // data name length
          nameBytes, // name
          Buffer.from([symbolBytes.length]), // data symbol length
          symbolBytes, // symbol
          Buffer.from([uriBytes.length]), // data uri length
          uriBytes, // uri
          Buffer.from([0, 0]), // seller fee basis points = 0 (2 bytes)
          Buffer.from([0]), // creators length = 0
        ])
      });
      
      console.log('✅ Modern metadata instruction created');
      
      // Create transaction
      const transaction = new Transaction();
      transaction.add(createAccountInstruction);
      transaction.add(initializeMintInstruction);
      transaction.add(createTokenAccountInstruction);
      transaction.add(mintToInstruction);
      transaction.add(metadataInstruction);

      // Set recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = walletPublicKey;

      console.log('✅ Transaction prepared for signing');

      // Return the transaction for frontend signing
      return {
        success: true,
        mintAddress: mintKeypair.publicKey.toString(),
        metadataAddress: metadataAccount.toString(),
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