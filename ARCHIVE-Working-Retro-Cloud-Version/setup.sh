#!/bin/bash

echo "�� Token Vibes Node.js Setup Script"
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo ""
    echo "Please install Node.js first:"
    echo "1. Visit: https://nodejs.org/"
    echo "2. Download the LTS version"
    echo "3. Install it"
    echo "4. Restart your terminal"
    echo "5. Run this script again"
    echo ""
    echo "Or install via Homebrew:"
    echo "brew install node"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo "✅ npm found: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
    echo ""
    echo "🎉 Setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Edit .env file with your configuration"
    echo "2. Run: npm run dev"
    echo "3. Open: http://localhost:3000"
    echo ""
    echo "For production:"
    echo "1. Set NODE_ENV=production in .env"
    echo "2. Run: npm start"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi
