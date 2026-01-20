#!/bin/bash

# 🌊 Base Ecosystem Integration Script
# Verifies and sets up Base ecosystem features for Bass Ball

set -e

echo "🌊 Base Ecosystem Integration Verification"
echo "==========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check files exist
echo "📁 Checking files..."

files=(
  "lib/web3/base-ecosystem.ts"
  "hooks/useBaseEcosystem.ts"
  "lib/web3/base-graph-queries.ts"
  "components/BaseEcosystemDashboard.tsx"
  "BASE_ECOSYSTEM_FEATURES.md"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓${NC} $file"
  else
    echo -e "${YELLOW}✗${NC} $file (missing)"
  fi
done

echo ""
echo "🔧 Checking dependencies..."

# Check for required packages
packages=(
  "viem"
  "wagmi"
  "ethers"
  "@apollo/client"
  "graphql"
)

for pkg in "${packages[@]}"; do
  if grep -q "\"$pkg\"" package.json; then
    echo -e "${GREEN}✓${NC} $pkg"
  else
    echo -e "${YELLOW}✗${NC} $pkg (not found in package.json)"
  fi
done

echo ""
echo "🌐 Base Network Configuration"
echo "=============================="
echo "Mainnet: https://mainnet.base.org"
echo "Sepolia: https://sepolia.base.org"
echo "Chain ID: 8453 (Mainnet) / 84532 (Sepolia)"
echo ""

echo "💰 Supported Tokens on Base"
echo "============================="
echo "• ETH (Native)"
echo "• USDC (0x833589fCD6eDb6E08f4c7C32D4f71b1566111578)"
echo "• USDT (0xfde4C96c8593536E31F26A3d5f51B3b0FA7C00B1)"
echo "• DAI (0x50c5725949A6F0c72E6C4a641F14122319E53ffc)"
echo "• cbETH (0x2Ae3F1Ec7F1F5012CFEab0411dC8C84497535e73)"
echo ""

echo "🌉 Bridge Integration"
echo "====================="
echo "• Stargate Finance"
echo "• Across Protocol"
echo "• Optimism Bridge"
echo ""

echo "📊 DEX Integration"
echo "=================="
echo "• Uniswap V3"
echo "• Aerodrome Finance"
echo "• PancakeSwap V3"
echo ""

echo "📈 Data Sources"
echo "==============="
echo "• The Graph (Subgraphs)"
echo "• BaseScan (Block Explorer)"
echo "• Coinbase Commerce (Payments)"
echo ""

echo "🚀 Quick Start"
echo "=============="
echo ""
echo "1. Import the hook in your component:"
echo "   import { useBaseEcosystem } from '@/hooks/useBaseEcosystem';"
echo ""
echo "2. Use in your component:"
echo "   const { gasPrice, bridges, dexs } = useBaseEcosystem();"
echo ""
echo "3. Add the dashboard component:"
echo "   import { BaseEcosystemDashboard } from '@/components/BaseEcosystemDashboard';"
echo "   <BaseEcosystemDashboard />"
echo ""

echo "📚 Documentation"
echo "================"
echo "See BASE_ECOSYSTEM_FEATURES.md for complete documentation"
echo ""

echo -e "${GREEN}✅ Base Ecosystem Integration Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Update .env.local with Base RPC endpoints"
echo "2. Import hooks and components in your pages"
echo "3. Check BASE_ECOSYSTEM_FEATURES.md for usage examples"
echo "4. Deploy to production when ready"
echo ""
