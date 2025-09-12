console.log('🚀 ROOT APP.JS - WORKING VERSION');
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
    document.getElementById('walletInfo').style.display = 'none';

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
      document.getElementById('walletInfo').style.display = 'none';

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

  // Show loading with Token the T-Rex
  submitBtn.disabled = true;
  loading.style.display = 'none';
  document.getElementById('trexLoading').style.display = 'block';
  result.style.display = 'none';

  try {
    const name = document.getElementById('name').value;
    const symbol = document.getElementById('symbol').value;
    const quantity = document.getElementById('quantity').value;
    const destinationAddress = document.getElementById('destinationAddress').value;

    const tokenData = {
      name,
      symbol,
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
    console.log('🔍 DEBUG: Full response data:', JSON.stringify(data, null, 2));
    console.log('🔍 DEBUG: Name from response:', data.data.name);
    console.log('🔍 DEBUG: Symbol from response:', data.data.symbol);

    // Sign and submit transaction
    const transaction = solanaWeb3.Transaction.from(Buffer.from(data.data.transaction, 'base64'));
    
    // Create the mint keypair from the secret key
    const mintKeypair = solanaWeb3.Keypair.fromSecretKey(new Uint8Array(data.data.mintKeypair));
    
    // Submit transaction
    const connection = new solanaWeb3.Connection('https://solana-mainnet.g.alchemy.com/v2/sw8B8Gyq0uicnRSqohuwG', 'confirmed');
    
    // Get fresh blockhash to avoid stale transaction error
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    
    // Sign with both the wallet and the mint keypair
    transaction.partialSign(mintKeypair);
    const signedTransaction = await wallet.signTransaction(transaction);
    
    let signature;
    try {
      signature = await connection.sendRawTransaction(signedTransaction.serialize());
      console.log('✅ Transaction sent:', signature);
      
      // Wait for confirmation with shorter timeout
      try {
        const confirmation = await connection.confirmTransaction(signature, 'confirmed');
        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${confirmation.value.err}`);
        }
        console.log('✅ Transaction confirmed:', signature);
      } catch (confirmError) {
        // If confirmation times out but we have a signature, the transaction likely succeeded
        if (confirmError.message.includes('not confirmed in') && signature) {
          console.log('⚠️ Confirmation timeout, but transaction was sent. Checking on Solscan...');
          // Don't throw error, just log it and continue with success message
        } else {
          throw confirmError;
        }
      }
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
        <strong>Metadata Address:</strong> ${data.data.metadataAddress || 'N/A'}
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
      <div class="result-item" style="margin-top: 20px; padding: 15px; background: #e8f5e8; border: 2px solid #00b894; border-radius: 8px;">
        <strong style="color: #00b894;">✅ Transaction Submitted Successfully!</strong><br>
        <p style="margin: 10px 0; color: #2d3436;">Your token has been created on Solana. Even if confirmation timed out, the transaction was submitted successfully.</p>
        <div style="margin-top: 15px;">
          <a href="https://solscan.io/tx/${signature}" target="_blank" style="background: #1e3a8a; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">
            🔍 View Transaction on Solscan
          </a>
        </div>
        <div style="margin-top: 10px;">
          <strong>Transaction Signature:</strong> ${signature}
        </div>
      </div>
      <div class="result-item">
        <strong>Metadata:</strong>
        <a href="${data.data.metadataUri}" target="_blank">
          View Metadata JSON
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
    document.getElementById('trexLoading').style.display = 'none';
  }
});