const { 
  Connection, 
  Keypair, 
  PublicKey, 
  SystemProgram,
  Transaction
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

const { createUmi } = require('@metaplex-foundation/umi-bundle-defaults');
const { createGenericFileFromJson, irysUploader } = require('@metaplex-foundation/umi-uploader-irys');
const { createMetadataAccountV3, findMetadataPda } = require('@metaplex-foundation/mpl-token-metadata');

class TokenCreator {
  constructor() {
    this.connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://solana-mainnet.g.alchemy.com/v2/sw8B8Gyq0uicnRSqohuwG',
      'confirmed'
    );
    
    // Initialize Umi for metadata operations
    this.umi = createUmi(this.connection.rpcEndpoint)
      .use(irysUploader({
        address: 'https://node1.bundlr.network',
        timeout: 60000,
      }));
  }

  async createToken(tokenData, walletPublicKey) {
    try {
      console.log('🚀 Preparing token creation with Umi and proper Metaplex...');
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

      // Create metadata JSON
      const metadata = {
        name: tokenData.name,
        symbol: tokenData.symbol,
        description: tokenData.description || `A token called ${tokenData.name}`,
        image: tokenData.imageUri || '',
        external_url: '',
        attributes: [],
        properties: {
          files: [],
          category: 'image',
          creators: []
        }
      };

      // Upload metadata to IPFS using Umi
      console.log('📤 Uploading metadata to IPFS...');
      const metadataFile = createGenericFileFromJson(metadata, 'metadata.json');
      const [metadataUri] = await this.umi.uploader.upload([metadataFile]);
      console.log('✅ Metadata uploaded:', metadataUri);

      // Find metadata PDA
      const metadataPda = findMetadataPda(this.umi, { mint: mintKeypair.publicKey });
      console.log('📝 Metadata PDA:', metadataPda[0].toString());

      // Create metadata account instruction using Umi
      const createMetadataInstruction = createMetadataAccountV3(this.umi, {
        metadata: metadataPda[0],
        mint: mintKeypair.publicKey,
        mintAuthority: walletPublicKey,
        payer: walletPublicKey,
        updateAuthority: walletPublicKey,
        data: {
          name: tokenData.name,
          symbol: tokenData.symbol,
          uri: metadataUri,
          sellerFeeBasisPoints: 0,
          creators: null,
          collection: null,
          uses: null,
        },
        isMutable: true,
        collectionDetails: null,
      });

      // Create transaction with all instructions
      const transaction = new Transaction();
      transaction.add(createAccountInstruction);
      transaction.add(initializeMintInstruction);
      transaction.add(createTokenAccountInstruction);
      transaction.add(mintToInstruction);
      
      // Add metadata instruction (this will be a Umi instruction)
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
        metadataAddress: metadataPda[0].toString(),
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