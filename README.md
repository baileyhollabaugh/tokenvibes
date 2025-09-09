# Token Vibes - Solana Token Creation Platform

A comprehensive platform for creating Solana SPL tokens with full Metaplex metadata support.

## 📁 Project Structure

### 🌐 Browser Version (`/browser-version/`)
- **Status**: Archived - Basic functionality only
- **Limitations**: No metadata support, browser compatibility issues
- **Use Case**: Simple token creation without metadata
- **Deployment**: Vercel (static hosting)

### 🚀 Node.js Version (`/nodejs-version/`)
- **Status**: Active development - Full functionality
- **Features**: Complete Metaplex metadata, image upload, professional API
- **Use Case**: Production-ready token creation platform
- **Deployment**: Railway/Render (server hosting)

## 🎯 Features Comparison

| Feature | Browser Version | Node.js Version |
|---------|----------------|-----------------|
| Basic Token Creation | ✅ | ✅ |
| Metaplex Metadata | ❌ | ✅ |
| Image Upload | ❌ | ✅ |
| Professional API | ❌ | ✅ |
| Error Handling | ⚠️ Basic | ✅ Advanced |
| Scalability | ❌ Limited | ✅ Full |

## 🚀 Quick Start

### Browser Version (Archived)
```bash
cd browser-version
# Deploy to Vercel for basic functionality
```

### Node.js Version (Recommended)
```bash
cd nodejs-version
./setup.sh
npm run dev
```

## 📚 Documentation

- [Browser Version README](./browser-version/README.md)
- [Node.js Version README](./nodejs-version/README.md)

## 🔧 Development

The Node.js version provides:
- Full Solana Web3.js integration
- Metaplex Umi library support
- IPFS/Arweave integration
- Professional error handling
- Scalable architecture

## 📄 License

MIT License - See LICENSE file for details
