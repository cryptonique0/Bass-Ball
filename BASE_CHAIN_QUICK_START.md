# 🚀 BASE Chain Quick Start

**Bass Ball on BASE Chain - 5 Minute Setup Guide**

---

## What You Need

```bash
# Node.js 18+
node --version

# Private key with a small amount of ETH/BASE for deployment
# Get testnet BASE from: https://www.base.org/faucet

# Environment variables ready
cp .env.example .env.local
```

---

## Quick Setup (5 Steps)

### 1️⃣ Install Dependencies
```bash
npm install
```

### 2️⃣ Configure Environment
```bash
# Edit .env.local with your values
nano .env.local

# Minimum required:
PRIVATE_KEY=0x...                    # Your private key
BASESCAN_API_KEY=...                 # From https://basescan.org/apis
BASE_RPC_URL=https://mainnet.base.org
BASE_CHAIN_ID=8453
```

### 3️⃣ Compile Contracts
```bash
npm run contracts:compile
```

### 4️⃣ Deploy to Testnet (BASE Sepolia)
```bash
npm run contracts:deploy -- --network baseSepolia
```

**Output will show:**
```
✓ PlayerCardNFT deployed to: 0x...
✓ MatchResultRegistry deployed to: 0x...
[... more contracts ...]
```

Copy these addresses to `.env.local`

### 5️⃣ Deploy to Mainnet (Production)
```bash
npm run contracts:deploy -- --network base
```

⚠️ **WARNING**: This costs real money! Only do after testnet success.

---

## Verify Deployment

### Check on BaseScan
```
Testnet: https://sepolia.basescan.org/address/0x...
Mainnet: https://basescan.org/address/0x...
```

### Query Contract
```bash
npx hardhat console --network base

# In console:
> const contract = await ethers.getContractAt("PlayerCardNFT", "0x...")
> await contract.totalSupply()
0  # Good! Ready to mint
```

---

## Network Details

| Network | Chain ID | RPC | Explorer |
|---------|----------|-----|----------|
| **Mainnet** | 8453 | https://mainnet.base.org | https://basescan.org |
| **Sepolia** | 84532 | https://sepolia.base.org | https://sepolia.basescan.org |

---

## Get Test BASE

For development:
1. Go to https://www.base.org/faucet
2. Connect wallet
3. Get testnet BASE
4. Deploy to Sepolia

---

## Common Issues

**"Failed to send transaction"**
→ Check private key has ETH balance

**"Insufficient permissions"**
→ Use deployer account from PRIVATE_KEY

**"Network unreachable"**
→ Verify RPC URL in .env.local

---

## Next Steps

1. ✅ **Testnet** (Sepolia): https://sepolia.basescan.org
2. ✅ **Mainnet** (Production): https://basescan.org
3. 📖 **Full Guide**: [BASE_CHAIN_DEPLOYMENT_GUIDE.md](BASE_CHAIN_DEPLOYMENT_GUIDE.md)
4. 🔐 **Gasless**: [BASE_GASLESS_TRANSACTIONS.md](BASE_GASLESS_TRANSACTIONS.md)

---

**Ready to deploy? Start with Step 1! 🎮**
