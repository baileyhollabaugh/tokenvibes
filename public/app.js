// SPL Token constants
const TOKEN_PROGRAM_ID = new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const MINT_SIZE = 82;

let wallet = null;
let walletAddress = null;
let connection = null;

// Initialize connection
window.addEventListener('load', () => {
  // Use your Alchemy RPC endpoint
  connection = new solanaWeb3.Connection('https://solana-mainnet.g.alchemy.com/v2/sw8B8Gyq0uicnRSqohuwG', 'confirmed');
});

// Check if Phantom is installed
const getProvider = () => {
  if ('solana' in window) {
    const provider = window.solana;
    if (provider.isPhantom) {
      return provider;
    }
  }
  return null;
};

// Connect to Phantom wallet
document.getElementById('connectWallet').addEventListener('click', async () => {
  try {
    const provider = getProvider();
    if (!provider) {
      alert('Phantom wallet not found! Please install Phantom wallet extension.');
      return;
    }

    const response = await provider.connect();
    wallet = provider;
    walletAddress = response.publicKey.toString();

    document.getElementById('walletStatus').style.display = 'block';
    document.getElementById('walletAddress').textContent = walletAddress;
    document.getElementById('connectWallet').style.display = 'none';
    document.getElementById('walletPrivateKeyGroup').style.display = 'block';

    // Auto-fill destination address with connected wallet
    document.getElementById('destinationAddress').value = walletAddress;

  } catch (error) {
    console.error('Failed to connect wallet:', error);
    alert('Failed to connect wallet. Please try again.');
  }
});

// Check if wallet is already connected
window.addEventListener('load', async () => {
  const provider = getProvider();
  if (provider && provider.isConnected) {
    try {
      const response = await provider.connect();
      wallet = provider;
      walletAddress = response.publicKey.toString();

      document.getElementById('walletStatus').style.display = 'block';
      document.getElementById('walletAddress').textContent = walletAddress;
      document.getElementById('connectWallet').style.display = 'none';
      document.getElementById('walletPrivateKeyGroup').style.display = 'block';

      // Auto-fill destination address with connected wallet
      document.getElementById('destinationAddress').value = walletAddress;
    } catch (error) {
      console.log('Wallet not connected');
    }
  }
});

document.getElementById('tokenForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!wallet || !walletAddress) {
    alert('Please connect your Phantom wallet first!');
    return;
  }

  const submitBtn = document.getElementById('submitBtn');
  const loading = document.getElementById('loading');
  const result = document.getElementById('result');
  const resultContent = document.getElementById('resultContent');

  // Show loading
  submitBtn.disabled = true;
  loading.style.display = 'block';
  result.style.display = 'none';

  try {
    const name = document.getElementById('name').value;
    const symbol = document.getElementById('symbol').value;
    const description = document.getElementById('description').value;
    const quantity = document.getElementById('quantity').value;
    const destinationAddress = document.getElementById('destinationAddress').value;

    const tokenData = {
      name,
      symbol,
      description,
      quantity: parseInt(quantity),
      decimals: 9,
      destinationAddress,
      walletAddress
    };

    // First, prepare metadata on backend
    const response = await fetch('/api/tokens/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tokenData)
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error);
    }

    console.log('✅ Metadata prepared:', data.data);

    const { mintAddress, mintSecretKey, metadata, name: tokenName, symbol: tokenSymbol, description: desc, quantity: tokenQuantity, decimals, destinationAddress: destAddress } = data.data;

    // Create the transaction on the frontend
    const mintKeypair = solanaWeb3.Keypair.fromSecretKey(new Uint8Array(mintSecretKey));

    // Calculate rent exemption for mint account
    const rentExemption = await connection.getMinimumBalanceForRentExemption(
      solanaWeb3.MINT_SIZE
    );

    // Create account instruction
    const createAccountInstruction = solanaWeb3.SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      lamports: rentExemption,
      space: solanaWeb3.MINT_SIZE,
      programId: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
    });

    // Initialize mint instruction (manual implementation)
    const initializeMintData = new Uint8Array(67);
    initializeMintData[0] = 0; // InitializeMint instruction
    initializeMintData[1] = decimals; // decimals
    initializeMintData[2] = 1; // mint authority present
    wallet.publicKey.toBytes().forEach((byte, i) => {
      initializeMintData[3 + i] = byte;
    });
    initializeMintData[35] = 0; // freeze authority absent

    const initializeMintInstruction = new solanaWeb3.TransactionInstruction({
      keys: [
        { pubkey: mintKeypair.publicKey, isSigner: false, isWritable: true },
        { pubkey: solanaWeb3.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }
      ],
      programId: TOKEN_PROGRAM_ID,
      data: initializeMintData
    });

    // Create associated token account
    const destinationPublicKey = new solanaWeb3.PublicKey(destAddress);
    const associatedTokenAddress = await solanaWeb3.PublicKey.findProgramAddress(
      [
        destinationPublicKey.toBytes(),
        TOKEN_PROGRAM_ID.toBytes(),
        mintKeypair.publicKey.toBytes(),
      ],
      new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
    ).then(([address]) => address);

    const createATAInstruction = new solanaWeb3.TransactionInstruction({
      keys: [
        { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: associatedTokenAddress, isSigner: false, isWritable: true },
        { pubkey: destinationPublicKey, isSigner: false, isWritable: false },
        { pubkey: mintKeypair.publicKey, isSigner: false, isWritable: false },
        { pubkey: solanaWeb3.SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: solanaWeb3.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false }
      ],
      programId: new solanaWeb3.PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
      data: new Uint8Array(0)
    });

    // Mint tokens instruction
    const mintAmount = BigInt(tokenQuantity) * BigInt(10 ** 9);

    const mintToData = new Uint8Array(9);
    mintToData[0] = 7; // MintTo instruction
    const amountBytes = new Uint8Array(8);
    for (let i = 0; i < 8; i++) {
      amountBytes[i] = Number((mintAmount >> BigInt(i * 8)) & BigInt(0xFF));
    }
    mintToData.set(amountBytes, 1);

    const mintTokensInstruction = new solanaWeb3.TransactionInstruction({
      keys: [
        { pubkey: mintKeypair.publicKey, isSigner: false, isWritable: true },
        { pubkey: associatedTokenAddress, isSigner: false, isWritable: true },
        { pubkey: wallet.publicKey, isSigner: true, isWritable: false }
      ],
      programId: TOKEN_PROGRAM_ID,
      data: mintToData
    });

    // Create transaction
    const transaction = new solanaWeb3.Transaction();
    transaction.add(createAccountInstruction);
    transaction.add(initializeMintInstruction);
    transaction.add(createATAInstruction);
    transaction.add(mintTokensInstruction);

    // Set recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    // Sign transaction with both wallet and mint keypair
    const signedTransaction = await wallet.signTransaction(transaction);
    signedTransaction.partialSign(mintKeypair);

    // Send transaction
    const signature = await connection.sendRawTransaction(signedTransaction.serialize());
    await connection.confirmTransaction(signature, 'confirmed');

    console.log('✅ Transaction confirmed:', signature);

    resultContent.innerHTML = `
      <div class="result-item">
        <strong>Token Name:</strong> ${tokenName || 'N/A'}
      </div>
      <div class="result-item">
        <strong>Symbol:</strong> ${tokenSymbol || 'N/A'}
      </div>
      <div class="result-item">
        <strong>Mint Address:</strong> ${mintAddress}
      </div>
      <div class="result-item">
        <strong>Quantity:</strong> ${tokenQuantity.toLocaleString()}
      </div>
      <div class="result-item">
        <strong>Decimals:</strong> ${decimals}
      </div>
      <div class="result-item">
        <strong>Transaction:</strong>
        <a href="https://explorer.solana.com/tx/${signature}" target="_blank">
          View on Solana Explorer
        </a>
      </div>
      <div class="result-item">
        <strong>Metadata:</strong>
        <a href="${metadata.uri}" target="_blank">
          View Metadata
        </a>
      </div>
    `;
    result.className = 'result';

  } catch (error) {
    console.error('Error:', error);
    resultContent.innerHTML = `<p><strong>Error:</strong> ${error.message}</p>`;
    result.className = 'result error';
  } finally {
    result.style.display = 'block';
    submitBtn.disabled = false;
    loading.style.display = 'none';
  }
});
