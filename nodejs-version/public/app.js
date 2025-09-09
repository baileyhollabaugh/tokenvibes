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

// Create token using Phantom wallet
async function createTokenWithPhantom(tokenData) {
    try {
        console.log('🚀 Creating token with Phantom wallet...');
        
        // First, prepare metadata on backend
        const requestData = {
            name: tokenData.name,
            symbol: tokenData.symbol,
            description: tokenData.description,
            quantity: tokenData.quantity,
            destinationAddress: tokenData.destinationAddress,
            walletAddress: walletAddress,
            decimals: 9
        };
        
        console.log('Sending data:', requestData);
        
        const response = await fetch('/api/tokens/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error);
        }
        
        console.log('✅ Metadata prepared:', data.data);
        
        // Now create the token using Solana Web3.js directly
        const mintKeypair = solanaWeb3.Keypair.fromSecretKey(
            new Uint8Array(data.data.mintKeypair)
        );
        
        // Get rent exemption
        const rentExemption = await connection.getMinimumBalanceForRentExemption(82);
        
        // Create account instruction
        const createAccountInstruction = solanaWeb3.SystemProgram.createAccount({
            fromPubkey: wallet.publicKey,
            newAccountPubkey: mintKeypair.publicKey,
            lamports: rentExemption,
            space: 82,
            programId: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
        });

        // Initialize mint instruction
        const initializeMintData = new Uint8Array(9);
        initializeMintData[0] = 0; // InitializeMint instruction
        // Leave the rest as zeros for now (decimals, mintAuthority, freezeAuthority)
        
        const initializeMintInstruction = new solanaWeb3.TransactionInstruction({
            keys: [
                { pubkey: mintKeypair.publicKey, isSigner: false, isWritable: true },
                { pubkey: new solanaWeb3.PublicKey('SysvarRent111111111111111111111111111111111'), isSigner: false, isWritable: false }
            ],
            programId: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
            data: initializeMintData
        });

        // Create associated token account
        const destinationPublicKey = new solanaWeb3.PublicKey(tokenData.destinationAddress);
        const associatedTokenAddress = await solanaWeb3.getAssociatedTokenAddress(
            mintKeypair.publicKey,
            destinationPublicKey
        );

        const createATAInstruction = solanaWeb3.createAssociatedTokenAccountInstruction(
            wallet.publicKey, // payer
            associatedTokenAddress, // ata
            destinationPublicKey, // owner
            mintKeypair.publicKey // mint
        );

        // Mint tokens instruction
        const mintAmount = BigInt(tokenData.quantity) * BigInt(10 ** 9);
        const mintTokensInstruction = solanaWeb3.createMintToInstruction(
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
        await connection.confirmTransaction(signature);

        return {
            success: true,
            mintAddress: mintKeypair.publicKey.toString(),
            metadataUri: data.data.metadataUri,
            transactionSignature: signature,
            quantity: tokenData.quantity,
            decimals: 9
        };

    } catch (error) {
        console.error('Token creation failed:', error);
        throw error;
    }
}

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
        const tokenData = {
            name: document.getElementById('name').value.trim(),
            symbol: document.getElementById('symbol').value.trim().toUpperCase(),
            description: document.getElementById('description').value.trim(),
            quantity: parseInt(document.getElementById('quantity').value),
            destinationAddress: document.getElementById('destinationAddress').value.trim()
        };

        const result_data = await createTokenWithPhantom(tokenData);
        
        resultContent.innerHTML = `
            <div class="result-item">
                <strong>Token Name:</strong> ${tokenData.name}
            </div>
            <div class="result-item">
                <strong>Symbol:</strong> ${tokenData.symbol}
            </div>
            <div class="result-item">
                <strong>Mint Address:</strong> ${result_data.mintAddress}
            </div>
            <div class="result-item">
                <strong>Quantity:</strong> ${result_data.quantity.toLocaleString()}
            </div>
            <div class="result-item">
                <strong>Decimals:</strong> 9
            </div>
            <div class="result-item">
                <strong>Transaction:</strong> 
                <a href="https://explorer.solana.com/tx/${result_data.transactionSignature}" target="_blank">
                    View on Solana Explorer
                </a>
            </div>
            <div class="result-item">
                <strong>Metadata:</strong> 
                <a href="${result_data.metadataUri}" target="_blank">
                    View Metadata
                </a>
            </div>
        `;
        result.className = 'result';
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