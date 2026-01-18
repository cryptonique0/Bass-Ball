#!/bin/bash

# Bass Ball - Quick Start Script
# This script sets up Bass Ball for local development or deployment

set -e

echo "🎮 Bass Ball - Quick Start"
echo "=========================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

echo "✅ Node.js $(node --version)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Check for .env.local
echo ""
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local not found. Creating from .env.example..."
    cp .env.example .env.local
    echo "📝 Please edit .env.local with your configuration:"
    echo "   - NEXT_PUBLIC_PRIVY_APP_ID (get from https://privy.io)"
    echo "   - NEXT_PUBLIC_WALLETCONNECT_ID (get from https://walletconnect.com)"
    echo ""
fi

# Offer to deploy NFT contract
echo ""
read -p "Do you want to deploy the NFT contract to Base Sepolia? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -z "$PRIVATE_KEY" ]; then
        echo "⚠️  PRIVATE_KEY not set in .env.local"
        echo "Add your deployer private key to .env.local and try again"
    else
        echo "🚀 Deploying NFT contract to Base Sepolia..."
        npx hardhat run scripts/deployNFT.ts --network baseSepolia
        echo "📝 Copy the contract address to .env.local:"
        echo "   NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x..."
    fi
fi

# Ask deployment preference
echo ""
echo "🚀 Ready to start development or deploy?"
echo "   1) Start local dev server (npm run dev)"
echo "   2) Deploy to Vercel (vercel)"
echo "   3) Deploy with Docker (docker-compose up --build)"
echo "   4) Exit"
echo ""

read -p "Choose option (1-4): " -n 1 option
echo

case $option in
    1)
        echo "🚀 Starting local dev server..."
        npm run dev
        ;;
    2)
        if ! command -v vercel &> /dev/null; then
            echo "Installing Vercel CLI..."
            npm install -g vercel
        fi
        echo "🚀 Deploying to Vercel..."
        vercel
        ;;
    3)
        if ! command -v docker &> /dev/null; then
            echo "❌ Docker is not installed"
            exit 1
        fi
        echo "🚀 Starting with Docker Compose..."
        docker-compose up --build
        ;;
    *)
        echo "Exiting. Run 'npm run dev' to start development"
        ;;
esac

echo ""
echo "✅ Setup complete!"
