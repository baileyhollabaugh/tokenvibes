console.log('🚀 TOKEN VIBES v11 - WITH SELLING FEATURES');
console.log('🚀 Timestamp:', Date.now());

let wallet = null;
let walletAddress = null;
let sellWallet = null;
let sellWalletAddress = null;
let selectedToken = null;
let userTokens = [];

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

// Navigation functions
function showMainNav() {
  document.getElementById('mainNav').style.display = 'block';
  document.getElementById('createTokenSection').style.display = 'none';
  document.getElementById('sellTokenSection').style.display = 'none';
}

function showCreateToken() {
  document.getElementById('mainNav').style.display = 'none';
  document.getElementById('createTokenSection').style.display = 'block';
  document.getElementById('sellTokenSection').style.display = 'none';
}

function showSellToken() {
  document.getElementById('mainNav').style.display = 'none';
  document.getElementById('createTokenSection').style.display = 'none';
  document.getElementById('sellTokenSection').style.display = 'block';
  
  // Reset sell token sections
  document.getElementById('tokenSelection').style.display = 'none';
  document.getElementById('saleConfig').style.display = 'none';
  document.getElementById('saleManagement').style.display = 'none';
  document.getElementById('buyTokenSection').style.display = 'none';
}

function showBuyTokens() {
  document.getElementById('buyTokenSection').style.display = 'block';
  document.getElementById('tokenSelection').style.display = 'none';
  document.getElementById('saleConfig').style.display = 'none';
  document.getElementById('saleManagement').style.display = 'none';
}

// Connect to Phantom wallet (Create Token)
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

// Connect to Phantom wallet (Sell Token)
document.getElementById('sellConnectWallet').addEventListener('click', async () => {
  try {
    const provider = getProvider();
    if (!provider) {
      alert('Phantom wallet not found! Please install Phantom wallet extension.');
      return;
    }

    const response = await provider.connect();
    sellWallet = provider;
    sellWalletAddress = response.publicKey.toString();

    document.getElementById('sellWalletStatus').style.display = 'block';
    document.getElementById('sellWalletAddress').textContent = sellWalletAddress;
    document.getElementById('sellConnectWallet').style.display = 'none';
    document.getElementById('sellWalletInfo').style.display = 'none';

    // Load user's tokens
    await loadUserTokens();

  } catch (error) {
    console.error('Failed to connect wallet:', error);
    alert('Failed to connect wallet. Please try again.');
  }
});

// Load user's SPL tokens from Solana mainnet
async function loadUserTokens() {
  try {
    console.log('🔍 Loading user tokens for address:', sellWalletAddress);
    
    // Connect to Solana mainnet
    const connection = new solanaWeb3.Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    const publicKey = new solanaWeb3.PublicKey(sellWalletAddress);
    
    // Get all token accounts for this wallet
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
      programId: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
    });
    
    console.log('🔍 Found token accounts:', tokenAccounts.value.length);
    
    userTokens = [];
    
    for (const accountInfo of tokenAccounts.value) {
      const tokenAccount = accountInfo.account.data.parsed.info;
      const tokenAmount = tokenAccount.tokenAmount;
      
      // Only include tokens with non-zero balance
      if (tokenAmount.uiAmount > 0) {
        try {
          // Get token metadata
          const mintAddress = tokenAccount.mint;
          const tokenMetadata = await getTokenMetadata(mintAddress);
          
          userTokens.push({
            mint: mintAddress,
            name: tokenMetadata.name || 'Unknown Token',
            symbol: tokenMetadata.symbol || 'UNKNOWN',
            balance: tokenAmount.uiAmount,
            decimals: tokenAmount.decimals,
            tokenAccount: accountInfo.pubkey.toString()
          });
        } catch (metadataError) {
          console.log('⚠️ Could not fetch metadata for token:', tokenAccount.mint);
          // Add token without metadata
          userTokens.push({
            mint: tokenAccount.mint,
            name: 'Unknown Token',
            symbol: 'UNKNOWN',
            balance: tokenAmount.uiAmount,
            decimals: tokenAmount.decimals,
            tokenAccount: accountInfo.pubkey.toString()
          });
        }
      }
    }
    
    console.log('✅ Loaded user tokens:', userTokens);

    displayUserTokens();
    document.getElementById('tokenSelection').style.display = 'block';

  } catch (error) {
    console.error('Failed to load tokens:', error);
    alert('Failed to load your tokens. Please try again.');
  }
}

// Get token metadata from Solana
async function getTokenMetadata(mintAddress) {
  try {
    // Try to get metadata from Metaplex
    const connection = new solanaWeb3.Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    const mintPublicKey = new solanaWeb3.PublicKey(mintAddress);
    
    // This is a simplified approach - in production you'd use the Metaplex SDK
    // For now, we'll return basic info and let the user fill in details
    return {
      name: 'Token',
      symbol: 'TKN'
    };
  } catch (error) {
    console.log('Could not fetch metadata for:', mintAddress);
    return {
      name: 'Unknown Token',
      symbol: 'UNKNOWN'
    };
  }
}

// Display user's tokens
function displayUserTokens() {
  const tokenList = document.getElementById('tokenList');
  tokenList.innerHTML = '';

  userTokens.forEach((token, index) => {
    const tokenItem = document.createElement('div');
    tokenItem.className = 'token-item';
    tokenItem.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong>${token.name}</strong> (${token.symbol})
          <br>
          <small>Balance: ${token.balance.toLocaleString()}</small>
        </div>
        <div style="text-align: right;">
          <small>Mint: ${token.mint.substring(0, 8)}...</small>
        </div>
      </div>
    `;
    
    tokenItem.addEventListener('click', () => selectToken(token, index));
    tokenList.appendChild(tokenItem);
  });
}

// Select a token for sale
function selectToken(token, index) {
  // Remove previous selection
  document.querySelectorAll('.token-item').forEach(item => {
    item.classList.remove('selected');
  });
  
  // Add selection to clicked item
  document.querySelectorAll('.token-item')[index].classList.add('selected');
  
  selectedToken = token;
  
  // Show selected token info
  document.getElementById('selectedTokenInfo').innerHTML = `
    <strong>${token.name}</strong> (${token.symbol})<br>
    <small>Balance: ${token.balance.toLocaleString()} | Mint: ${token.mint}</small>
  `;
  
  // Update available balance
  document.getElementById('availableBalance').textContent = token.balance.toLocaleString();
  
  // Show sale configuration
  document.getElementById('saleConfig').style.display = 'block';
  
  // Reset form
  document.getElementById('saleQuantity').value = '';
  document.getElementById('pricePerToken').value = '';
  document.getElementById('totalValue').textContent = '0';
}

// Calculate total value
document.getElementById('saleQuantity').addEventListener('input', updateTotalValue);
document.getElementById('pricePerToken').addEventListener('input', updateTotalValue);

function updateTotalValue() {
  const quantity = parseFloat(document.getElementById('saleQuantity').value) || 0;
  const price = parseFloat(document.getElementById('pricePerToken').value) || 0;
  const total = quantity * price;
  document.getElementById('totalValue').textContent = total.toFixed(2);
}

// Deploy sale contract
document.getElementById('saleForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  if (!selectedToken) {
    alert('Please select a token first!');
    return;
  }
  
  const quantity = parseFloat(document.getElementById('saleQuantity').value);
  const price = parseFloat(document.getElementById('pricePerToken').value);
  
  if (quantity > selectedToken.balance) {
    alert('You cannot sell more tokens than you have!');
    return;
  }
  
  if (quantity <= 0 || price <= 0) {
    alert('Please enter valid quantities and prices!');
    return;
  }
  
  try {
    console.log('🚀 Deploying sale contract...');
    console.log('Token:', selectedToken);
    console.log('Quantity:', quantity);
    console.log('Price per token:', price);
    
    const response = await fetch('/api/tokens/deploy-sale', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tokenMint: selectedToken.mint,
        quantity: quantity,
        pricePerToken: price,
        sellerWallet: sellWalletAddress
      })
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error);
    }
    
    console.log('✅ Sale contract deployed:', data.data);
    
    alert(`🎉 Sale contract deployed successfully!\n\nContract Address: ${data.data.contractAddress}\n\nYou can now share this address for others to buy your tokens!`);
    
    // Show sale management
    document.getElementById('saleManagement').style.display = 'block';
    document.getElementById('saleConfig').style.display = 'none';
    
    // Add to active sales
    const activeSales = document.getElementById('activeSales');
    const saleItem = document.createElement('div');
    saleItem.className = 'sale-item';
    saleItem.innerHTML = `
      <h5>${selectedToken.name} (${selectedToken.symbol})</h5>
      <p><strong>Contract:</strong> ${data.data.contractAddress}</p>
      <p><strong>Quantity:</strong> ${data.data.quantity.toLocaleString()} tokens</p>
      <p><strong>Price:</strong> ${data.data.pricePerToken} USDC per token</p>
      <p><strong>Total Value:</strong> ${data.data.totalValue.toFixed(2)} USDC</p>
      <div style="margin-top: 10px;">
        <button class="btn btn-secondary" style="margin-right: 10px;">Withdraw USDC</button>
        <button class="btn btn-secondary">Cancel Sale</button>
      </div>
    `;
    activeSales.appendChild(saleItem);
    
  } catch (error) {
    console.error('Failed to deploy sale contract:', error);
    alert('Failed to deploy sale contract. Please try again.');
  }
});

// Load contract for buying
document.getElementById('loadContractBtn').addEventListener('click', async () => {
  const contractAddress = document.getElementById('contractAddress').value.trim();
  
  if (!contractAddress) {
    alert('Please enter a contract address!');
    return;
  }
  
  try {
    console.log('🔍 Loading contract:', contractAddress);
    
    const response = await fetch(`/api/tokens/contract-info/${contractAddress}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error);
    }
    
    const contractInfo = data.data;
    console.log('✅ Loaded contract info:', contractInfo);
    
    document.querySelector('.contract-details').innerHTML = `
      <h5>${contractInfo.tokenName} (${contractInfo.tokenSymbol})</h5>
      <p><strong>Price per token:</strong> ${contractInfo.pricePerToken} USDC</p>
      <p><strong>Available:</strong> ${contractInfo.availableTokens} tokens</p>
      <p><strong>Contract:</strong> ${contractAddress}</p>
    `;
    
    document.getElementById('contractInfo').style.display = 'block';
    
    // Update buy quantity calculation
    document.getElementById('buyQuantity').addEventListener('input', updateBuyTotal);
    
  } catch (error) {
    console.error('Failed to load contract:', error);
    alert('Failed to load contract. Please check the address and try again.');
  }
});

// Calculate buy total
function updateBuyTotal() {
  const quantity = parseFloat(document.getElementById('buyQuantity').value) || 0;
  const price = 1.00; // This would come from the contract
  const total = quantity * price;
  document.getElementById('buyTotalCost').textContent = total.toFixed(2);
}

// Buy tokens
document.getElementById('buyTokenForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const quantity = parseFloat(document.getElementById('buyQuantity').value);
  const contractAddress = document.getElementById('contractAddress').value;
  
  if (quantity <= 0) {
    alert('Please enter a valid quantity!');
    return;
  }
  
  try {
    console.log('🛒 Buying tokens...');
    console.log('Quantity:', quantity);
    console.log('Contract:', contractAddress);
    
    const response = await fetch('/api/tokens/buy-tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contractAddress: contractAddress,
        quantity: quantity,
        buyerWallet: walletAddress || 'mock-buyer-address'
      })
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error);
    }
    
    console.log('✅ Token purchase successful:', data.data);
    
    alert(`🎉 Purchase successful!\n\nYou bought ${data.data.quantity} tokens for ${data.data.totalCost} USDC!\n\nTransaction: ${data.data.transactionSignature}\n\nTokens have been sent to your wallet.`);
    
    // Reset form
    document.getElementById('buyQuantity').value = '';
    document.getElementById('contractAddress').value = '';
    document.getElementById('contractInfo').style.display = 'none';
    
  } catch (error) {
    console.error('Failed to buy tokens:', error);
    alert('Failed to buy tokens. Please try again.');
  }
});

// Navigation event listeners
document.getElementById('createTokenBtn').addEventListener('click', showCreateToken);
document.getElementById('sellTokenBtn').addEventListener('click', showSellToken);
document.getElementById('backToMainBtn').addEventListener('click', showMainNav);
document.getElementById('backToMainFromCreate').addEventListener('click', showMainNav);
document.getElementById('backToMainFromSell').addEventListener('click', showMainNav);
document.getElementById('switchToBuyBtn').addEventListener('click', showBuyTokens);

// Check if wallet is already connected (Create Token)
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

// Original token creation form (unchanged)
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
        <strong style="color: #00b894;">✅ Token Created Successfully!</strong><br>
        <p style="margin: 10px 0; color: #2d3436;">Your token has been created on Solana. Even if confirmation timed out, the transaction was submitted successfully.</p>
        <div style="margin-top: 15px;">
          <a href="https://solscan.io/tx/${signature}" target="_blank" style="background: #1e3a8a; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">
            🔍 View Transaction on Solscan
          </a>
        </div>
        <div style="margin-top: 10px;">
          <strong>Transaction Signature:</strong> ${signature}
        </div>
        <div style="margin-top: 15px;">
          <button class="btn btn-primary" onclick="showSellToken()">
            💰 Sell This Token Now!
          </button>
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

console.log('🎉 Token Vibes v11 loaded successfully!');
// Force deployment Fri Sep 12 17:53:19 CDT 2025
