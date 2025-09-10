console.log('🚀 APP.JS LOADED - VERSION 7 - NEW CODE');
console.log('🚀 Timestamp:', Date.now());

let wallet = null;
let walletAddress = null;

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

    // Create token on backend
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

    console.log('✅ Token transaction prepared on backend:', data.data);

    // Sign and submit transaction
    const transaction = solanaWeb3.Transaction.from(Buffer.from(data.data.transaction, 'base64'));
    
    // Create the mint keypair from the secret key
    const mintKeypair = solanaWeb3.Keypair.fromSecretKey(new Uint8Array(data.data.mintKeypair));
    
    // Sign with both the wallet and the mint keypair
    transaction.partialSign(mintKeypair);
    const signedTransaction = await wallet.signTransaction(transaction);
    
    // Submit transaction
    const connection = new solanaWeb3.Connection('https://solana-mainnet.g.alchemy.com/v2/sw8B8Gyq0uicnRSqohuwG', 'confirmed');
    
    try {
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      console.log('✅ Transaction sent:', signature);
      
      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }
      
      console.log('✅ Transaction confirmed:', signature);
    } catch (error) {
      console.error('❌ Transaction failed:', error);
      throw error;
    }

    resultContent.innerHTML = `
      <div class="result-item">
        <strong>Token Name:</strong> ${data.data.name || 'N/A'}
      </div>
      <div class="result-item">
        <strong>Symbol:</strong> ${data.data.symbol || 'N/A'}
      </div>
      <div class="result-item">
        <strong>Mint Address:</strong> ${data.data.mintAddress}
      </div>
      <div class="result-item">
        <strong>Token Account:</strong> ${data.data.destinationTokenAccount}
      </div>
      <div class="result-item">
        <strong>Quantity:</strong> ${data.data.quantity.toLocaleString()}
      </div>
      <div class="result-item">
        <strong>Decimals:</strong> ${data.data.decimals}
      </div>
      <div class="result-item">
        <strong>Transaction:</strong>
        <a href="https://explorer.solana.com/tx/${signature}" target="_blank">
          View on Solana Explorer
        </a>
      </div>
      <div class="result-item">
        <strong>Metadata:</strong>
        <a href="${data.data.metadataUri}" target="_blank">
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
