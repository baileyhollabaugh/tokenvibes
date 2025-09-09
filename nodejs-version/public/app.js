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
    
    // Handle file upload click
    document.getElementById('fileUpload').addEventListener('click', () => {
        document.getElementById('image').click();
    });
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
        const formData = new FormData(e.target);
        formData.append('walletAddress', walletAddress);
        formData.append('decimals', '9'); // Always use 9 decimals
        
        const response = await fetch('/api/tokens/create', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
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
                    <strong>Quantity:</strong> ${data.data.quantity.toLocaleString()}
                </div>
                <div class="result-item">
                    <strong>Decimals:</strong> 9
                </div>
                <div class="result-item">
                    <strong>Transaction:</strong> 
                    <a href="https://explorer.solana.com/tx/${data.data.transactionSignature}" target="_blank">
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
        } else {
            resultContent.innerHTML = `<p><strong>Error:</strong> ${data.error}</p>`;
            result.className = 'result error';
        }
        
        result.style.display = 'block';
        
    } catch (error) {
        console.error('Error:', error);
        resultContent.innerHTML = `<p><strong>Error:</strong> ${error.message}</p>`;
        result.className = 'result error';
        result.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        loading.style.display = 'none';
    }
});
