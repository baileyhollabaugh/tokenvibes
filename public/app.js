import * as splToken from 'https://cdn.jsdelivr.net/npm/@solana/spl-token@latest/+esm';

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

    // Initialize mint instruction using SPL Token library
    const initializeMintInstruction = splToken.createInitializeMintInstruction(
      mintKeypair.publicKey,
      decimals,
      wallet.publicKey, // mint authority
      null // freeze authority
    );

    // Create associated token account
    const destinationPublicKey = new solanaWeb3.PublicKey(destAddress);
    const associatedTokenAddress = await splToken.getAssociatedTokenAddress(
      mintKeypair.publicKey,
      destinationPublicKey
    );

    const createATAInstruction = splToken.createAssociatedTokenAccountInstruction(
      wallet.publicKey, // payer
      associatedTokenAddress, // associated token account
      destinationPublicKey, // owner
      mintKeypair.publicKey // mint
    );

    // Mint tokens instruction
    const mintAmount = BigInt(tokenQuantity) * BigInt(10 ** 9);

    const mintTokensInstruction = splToken.createMintToInstruction(
      mintKeypair.publicKey, // mint
      associatedTokenAddress, // destination
      wallet.publicKey, // authority
      mintAmount // amount
    );

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
