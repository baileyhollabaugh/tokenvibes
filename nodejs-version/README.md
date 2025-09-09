# Token Vibes - Node.js Version

Professional Solana token creation platform with full Metaplex metadata support.

## �� Features

- ✅ **Full Metaplex Integration** - Complete metadata support
- ✅ **Image Upload** - Upload token images to IPFS/Arweave
- ✅ **Professional API** - RESTful endpoints for token creation
- ✅ **Error Handling** - Comprehensive error management
- ✅ **Security** - Rate limiting, CORS, helmet protection
- ✅ **Scalable** - Built for production use

## 📦 Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start development server
npm run dev

# Or start production server
npm start
```

## 🔧 Configuration

Edit `.env` file:

```env
SOLANA_RPC_URL=https://api.devnet.solana.com
PORT=3000
NODE_ENV=development
```

## 📡 API Endpoints

### Create Token
```
POST /api/tokens/create
Content-Type: multipart/form-data

Fields:
- name: string (required)
- symbol: string (required)
- description: string
- quantity: number (required)
- decimals: number (default: 9)
- image: file (optional)
- walletPrivateKey: string (required)
```

### Get Token Info
```
GET /api/tokens/info/:mintAddress
```

## 🚀 Deployment

### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Render
```bash
# Connect your GitHub repo to Render
# Set environment variables in Render dashboard
# Deploy automatically on push
```

## 🔒 Security Notes

- Never commit private keys to version control
- Use environment variables for sensitive data
- Implement proper authentication for production
- Consider using hardware wallets for large amounts

## 📚 Documentation

- [Solana Web3.js Docs](https://solana-labs.github.io/solana-web3.js/)
- [Metaplex Documentation](https://developers.metaplex.com/)
- [Irys Documentation](https://docs.irys.xyz/)
