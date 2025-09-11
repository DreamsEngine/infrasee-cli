#!/bin/bash

# Dreamsflare CLI Installation Script
# This script installs dreamsflare CLI globally on your system

set -e

echo "🚀 Installing Dreamsflare CLI..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✓ Node.js $(node --version) detected"
echo "✓ npm $(npm --version) detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Create global link
echo "🔗 Creating global link..."
npm link

echo ""
echo "✅ Installation complete!"
echo ""
echo "🎉 Dreamsflare CLI has been installed successfully!"
echo ""
echo "Quick start:"
echo "  1. Create a .env file with your API tokens:"
echo "     echo 'CLOUDFLARE_API_TOKEN=your_token' >> .env"
echo "     echo 'COOLIFY_API_TOKEN=your_token' >> .env"
echo ""
echo "  2. Test your connection:"
echo "     dreamsflare test"
echo "     dreamsflare coolify test"
echo ""
echo "  3. Search for domains:"
echo "     dreamsflare all ip 192.168.1.1 --csv"
echo ""
echo "For more information, run: dreamsflare --help"
echo ""
echo "Happy domain hunting! 🔍"