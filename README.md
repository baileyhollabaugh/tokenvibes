# Token Vibes - Solana Token Creator MVP

A simple, vibe-based website for creating Solana SPL tokens without coding knowledge. Built for non-technical users who want to turn their ideas into tokens on the Solana blockchain.

## Features

- 🎨 **Matrix-style animated logo** with typing effect
- 👛 **Phantom wallet integration** (Phantom-only for MVP)
- 🪙 **Token creation form** with all required fields
- 📱 **Mobile-optimized** design with large buttons
- 🖼️ **Image upload** for token metadata
- ✅ **Form validation** and error handling
- 💰 **0.01 SOL anti-spam fee** 
- 🎯 **Success page** with Solana Explorer links

## Tech Stack

- **Frontend**: Plain HTML, CSS, JavaScript (no frameworks)
- **Blockchain**: Solana (devnet for testing)
- **Wallet**: Phantom wallet integration
- **Hosting**: Vercel (serverless)
- **Libraries**: @solana/web3.js only

## Quick Start

1. **Clone or download** this repository
2. **Install Phantom wallet** from [phantom.app](https://phantom.app)
3. **Get some devnet SOL** from [Solana Faucet](https://faucet.solana.com)
4. **Open index.html** in your browser
5. **Connect wallet** and create your token!

## Deployment to Vercel

### Option 1: GitHub Integration (Recommended)

1. **Create a GitHub account** if you don't have one
2. **Create a new repository** called "token-vibes"
3. **Upload your files** to the repository:
   - `index.html`
   - `package.json`
   - `README.md`
4. **Go to [vercel.com](https://vercel.com)** and sign up
5. **Click "New Project"** and import your GitHub repository
6. **Deploy** - Vercel will automatically deploy your site!

### Option 2: Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from your project folder**:
   ```bash
   vercel
   ```

4. **Follow the prompts** and your site will be live!

## Testing on Solana Devnet

The app is configured to use Solana devnet for testing:

- **Network**: Solana Devnet
- **Faucet**: Get free devnet SOL at [faucet.solana.com](https://faucet.solana.com)
- **Explorer**: View transactions at [explorer.solana.com](https://explorer.solana.com/?cluster=devnet)

## How It Works

1. **User connects Phantom wallet**
2. **Fills out token creation form**:
   - Token name and ticker
   - Total quantity (1-1B tokens)
   - Decimals (default: 9)
   - Mint/freeze authority options
   - Description and image
   - Send-to address
3. **Pays 0.01 SOL + network fees**
4. **Token is created** on Solana blockchain
5. **Success page shows** token details and explorer link

## Form Fields Explained

- **Token Name**: The full name of your token (e.g., "Art Vibes Club")
- **Ticker**: Short symbol (e.g., "AVC") - max 10 characters
- **Quantity**: Total tokens to create (1 to 1 billion)
- **Decimals**: How many decimal places (9 is standard)
- **Retain Mint Ability**: Can you create more tokens later?
- **Freezing Ability**: Can you pause token transfers?
- **Description**: Tell people about your token (max 500 chars)
- **Send To**: Wallet address to receive all tokens
- **Image**: Upload PNG/JPG for token metadata

## Security Features

- **Input validation** prevents invalid data
- **Address validation** ensures proper Solana addresses
- **File type/size limits** for image uploads
- **Confirmation dialog** before permanent blockchain action
- **Error handling** for common issues

## Mobile Optimization

- **Large buttons** for easy tapping
- **Responsive design** works on all screen sizes
- **Touch-friendly** form elements
- **Optimized for Phantom mobile app**

## Future Features (Not in MVP)

- Token-gated content
- Holder interactions (chat/email)
- Event ticket features
- Multi-wallet support
- Trading pools
- Analytics dashboard
- Governance features

## Troubleshooting

**"Phantom wallet not installed"**
- Install Phantom from [phantom.app](https://phantom.app)

**"Insufficient funds"**
- Get devnet SOL from [faucet.solana.com](https://faucet.solana.com)

**"Transaction failed"**
- Check your internet connection
- Ensure you have enough SOL for fees
- Try again in a few moments

**"Invalid address"**
- Make sure the send-to address is a valid Solana address
- Use the connected wallet address (auto-filled)

## Support

This is an MVP demo for investor presentations. For issues:
1. Check the browser console for error messages
2. Ensure you're using Phantom wallet
3. Make sure you're on Solana devnet
4. Try refreshing the page

## License

MIT License - feel free to use this code for your own projects!

---

**Built with good vibes for the Solana community** 🚀
