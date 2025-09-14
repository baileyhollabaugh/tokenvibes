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

// Metaplex Umi imports following official templates
const { createUmi } = require('@metaplex-foundation/umi-bundle-defaults');
const { mplTokenMetadata } = require('@metaplex-foundation/mpl-token-metadata');
const { createMetadataAccountV3, findMetadataPda } = require('@metaplex-foundation/mpl-token-metadata');
const { publicKey, some, none } = require('@metaplex-foundation/umi');

class TokenCreator {
  constructor() {
    this.connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://solana-mainnet.g.alchemy.com/v2/sw8B8Gyq0uicnRSqohuwG',
      'confirmed'
    );
    
    // Setup Umi following official Metaplex templates
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

      // Create metadata account using official Metaplex Umi pattern
      console.log('📝 Creating metadata account using official Metaplex Umi...');
      
      // Set the payer for this transaction
      this.umi.identity = {
        publicKey: publicKey(walletPublicKey.toString()),
        signMessage: async () => new Uint8Array(0),
        signTransaction: async () => new Uint8Array(0),
      };
      
      // Find metadata PDA using Umi
      const metadataPda = findMetadataPda(this.umi, { 
        mint: publicKey(mintKeypair.publicKey.toString()) 
      });
      
      console.log('✅ Metadata account:', metadataPda.toString());
      
      // Create metadata instruction using official Umi createMetadataAccountV3
      const createMetadataInstruction = createMetadataAccountV3(this.umi, {
        metadata: metadataPda,
        mint: publicKey(mintKeypair.publicKey.toString()),
        mintAuthority: publicKey(walletPublicKey.toString()),
        payer: publicKey(walletPublicKey.toString()),
        updateAuthority: publicKey(walletPublicKey.toString()),
        data: {
          name: metadata.name,
          symbol: metadata.symbol,
          uri: metadataUri,
          sellerFeeBasisPoints: 0,
          creators: none(),
          collection: none(),
          uses: none(),
        },
        isMutable: true,
        collectionDetails: none(),
      });
      
      console.log('✅ Official Metaplex metadata instruction created');
      
      // Convert Umi TransactionBuilder to Solana TransactionInstruction
      // The Umi instruction is a TransactionBuilder with items array
      console.log('Umi instruction structure:', createMetadataInstruction);
      
      // Extract the instruction from the TransactionBuilder
      if (!createMetadataInstruction.items || createMetadataInstruction.items.length === 0) {
        throw new Error('No instructions found in Umi TransactionBuilder');
      }
      
      const umiInstruction = createMetadataInstruction.items[0].instruction;
      console.log('Umi instruction data:', umiInstruction);
      
      if (!umiInstruction || !umiInstruction.keys || !umiInstruction.programId || !umiInstruction.data) {
        throw new Error('Invalid Umi instruction structure');
      }
      
      const metadataInstruction = new TransactionInstruction({
        keys: umiInstruction.keys.map(key => ({
          pubkey: new PublicKey(key.pubkey),
          isSigner: key.isSigner,
          isWritable: key.isWritable,
        })),
        programId: new PublicKey(umiInstruction.programId),
        data: Buffer.from(umiInstruction.data),
      });
      
      console.log('✅ Metadata instruction converted successfully');

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
      console.log('Transaction instructions count:', transaction.instructions.length);

      // Serialize transaction with error handling
      let serializedTransaction;
      try {
        serializedTransaction = transaction.serialize({ requireAllSignatures: false });
        console.log('✅ Transaction serialized successfully, length:', serializedTransaction.length);
      } catch (serializeError) {
        console.error('❌ Transaction serialization failed:', serializeError);
        throw new Error(`Transaction serialization failed: ${serializeError.message}`);
      }

      // Return the transaction for frontend signing
      return {
        success: true,
        mintAddress: mintKeypair.publicKey.toString(),
        metadataAddress: metadataPda.toString(),
        name: tokenData.name,
        symbol: tokenData.symbol,
        quantity: tokenData.quantity,
        decimals: tokenData.decimals,
        destinationAddress: tokenData.destinationAddress,
        destinationTokenAccount: destinationTokenAccount.toString(),
        metadata: metadata,
        metadataUri: metadataUri,
        mintKeypair: Array.from(mintKeypair.secretKey),
        transaction: serializedTransaction.toString('base64')
      };

    } catch (error) {
      console.error('❌ Token creation failed:', error);
      throw new Error(`Token creation failed: ${error.message}`);
    }
  }
}

module.exports = TokenCreator;