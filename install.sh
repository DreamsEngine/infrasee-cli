#!/bin/bash

# InfraSee CLI Installation Script
# This script installs InfraSee CLI globally on your system

set -e

echo "🚀 Installing InfraSee CLI..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt "18" ]; then
    echo "❌ Error: Node.js 18.0.0 or higher is required"
    echo "   Your version: $(node -v)"
    echo "   Please upgrade Node.js and try again"
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
echo "🎉 InfraSee CLI has been installed successfully!"
echo ""
echo "Quick start:"
echo "  1. Create a .env file with your API tokens:"
echo "     echo 'CLOUDFLARE_API_TOKEN=your_token' >> .env"
echo "     echo 'COOLIFY_API_TOKEN=your_token' >> .env"
echo "     echo 'DIGITALOCEAN_TOKEN=your_token' >> .env"
echo ""
echo "  2. Test your connections:"
echo "     infrasee test                    # Test Cloudflare"
echo "     infrasee coolify test            # Test Coolify"
echo "     infrasee digitalocean test       # Test DigitalOcean"
echo ""
echo "  3. Search for resources:"
echo "     infrasee all ip 192.168.1.1 --csv"
echo ""
echo "For more information, run: infrasee --help"
echo ""
echo "Happy infrastructure discovery! 🔍"