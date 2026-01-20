# 🚀 QUICK START - Bass Ball Phase 7 NFT Bridge

**Status:** ✅ Complete  
**Time to Implement:** 15 minutes  
**Difficulty:** Intermediate  

---

## 5-Minute Overview

Bass Ball NFT Bridge enables cross-chain NFT transfers using two protocols:

**Wormhole** - For high-value NFTs
- 13-validator security
- 15-60 minute bridge time
- 0.25% fee
- Best for: Player Stats NFTs worth >3 ETH

**Stargate** - For frequent transfers
- Liquidity pool-based
- 2-10 minute bridge time
- 0.15% fee
- Best for: Cosmetics, Formations, Achievements

---

## Quick Start Code

### 1. Bridge an NFT (5 minutes)

```typescript
import { 
  createWormholeNFTBridgeRequest,
  isNFTEligibleForBridging,
  getBestBridgeForNFT,
  createBridgeTransaction,
} from './lib/web3/nft-bridge';

// Your NFT
const myNFT = {
  id: 'nft_123',
  chainId: 1,           // Ethereum
  type: 'player-stats', // One of 5 types
  contractAddress: '0x...',
  tokenId: '1',
  owner: userAddress,
  value: ethers.parseEther('2.5'),
};

// Check if eligible
if (!isNFTEligibleForBridging(myNFT)) {
  console.error('NFT cannot be bridged');
  return;
}

// Get best bridge for this NFT
const protocol = getBestBridgeForNFT(myNFT, 8453); // To Base
// Returns: 'wormhole' (high value) or 'stargate' (low value)

// Create bridge request
const request = 
  protocol === 'wormhole'
    ? createWormholeNFTBridgeRequest(myNFT, 8453, recipientAddress)
    : createStargateNFTBridgeRequest(myNFT, 8453, recipientAddress);

// Execute the bridge
const txHash = await createBridgeTransaction(request);
console.log(`Bridge started: ${txHash}`);
```

### 2. Monitor Bridge Progress

```typescript
import { getWormholeBridgeStatus } from './lib/web3/nft-bridge';

// Poll bridge status
const interval = setInterval(() => {
  const status = getWormholeBridgeStatus(request);
  console.log(`Status: ${status.status} (${status.progress}%)`);
  
  if (status.progress === 100) {
    clearInterval(interval);
    console.log('Bridge complete!');
  }
}, 5000); // Check every 5 seconds
```

### 3. Create Liquidity Pool

```typescript
import { 
  createNFTLiquidityPool,
  addNFTToPool,
  calculateLPRewards,
} from './lib/web3/nft-bridge';

// Create pool for player stats on Base
const pool = createNFTLiquidityPool(
  'stargate',           // Protocol
  'player-stats',       // NFT type
  8453,                 // Chain (Base)
  ethers.parseEther('10') // Initial liquidity
);

// Add NFTs to pool
let updatedPool = pool;
for (const nft of myNFTs) {
  updatedPool = addNFTToPool(updatedPool, nft);
}

// Calculate rewards after 30 days
const rewards = calculateLPRewards(updatedPool, 5, 30); // 5% share, 30 days
console.log(`Earned: ${ethers.formatEther(rewards.rewards)} ETH`);
console.log(`APY: ${rewards.apy}%`);
```

---

## React Component Usage

### Bridge Selector Component

```typescript
import { NFTBridgeSelector } from './NFT_BRIDGE_COMPONENTS';

<NFTBridgeSelector
  userNFTs={[nft1, nft2, nft3]}
  supportedChains={[1, 10, 42161, 8453, 137]}
  onBridgeInitiate={(nftId, destChain) => {
    console.log(`Bridge ${nftId} to chain ${destChain}`);
  }}
/>
```

### Monitor Bridge Progress

```typescript
import { NFTBridgeMonitor } from './NFT_BRIDGE_COMPONENTS';

<NFTBridgeMonitor
  bridge={{
    status: 'confirmed',
    progress: 75,
    nftName: 'Legendary Player',
    fromChain: 'Ethereum',
    toChain: 'Base',
    fee: '0.0625 ETH',
    estimatedCompletion: Date.now() + 30 * 60000, // 30 min
  }}
  autoRefresh={true}
/>
```

### NFT Liquidity Pool Manager

```typescript
import { NFTLiquidityPoolManager } from './NFT_BRIDGE_COMPONENTS';

<NFTLiquidityPoolManager
  pools={[
    {
      id: 'pool_1',
      name: 'Player Stats Pool',
      protocol: 'stargate',
      totalValue: '50 ETH',
      apy: 25.5,
      tvl: '50 ETH',
      volume24h: '5 ETH',
      myShare: 5,
      myRewards: '0.25 ETH',
    },
  ]}
  onAddLiquidity={(poolId) => console.log(`Add liquidity to ${poolId}`)}
  onRemoveLiquidity={(poolId) => console.log(`Remove liquidity from ${poolId}`)}
/>
```

---

## Key Functions Reference

### Wormhole Functions
```typescript
getWormholeConfig(chainId)                    // Get config for chain
createWormholeNFTBridgeRequest(nft, to, recipient)  // Create request
getWormholeBridgeStatus(request)              // Check progress
```

### Stargate Functions
```typescript
getStargateConfig(chainId)                    // Get config for chain
createStargateNFTBridgeRequest(nft, to, recipient)  // Create request
getStargateBridgeStatus(request)              // Check progress
```

### Pool Functions
```typescript
createNFTLiquidityPool(protocol, type, chain, liquidity)  // Create pool
addNFTToPool(pool, nft)                       // Add NFT
removeNFTFromPool(pool, nftId)                // Remove NFT
calculateLPRewards(pool, share, days)         // Calculate earnings
```

### Helper Functions
```typescript
isNFTEligibleForBridging(nft)                 // Check eligibility
getBestBridgeForNFT(nft, destChain)           // Get optimal bridge
compareBridgeOptions(nft, destChain)          // Compare options
```

---

## Contract Addresses Quick Reference

### Ethereum (Chain 1)
```typescript
Wormhole NFT Bridge:   0x6FFd7EdE62328b3Af38FCD61461Bbfc52F5651fE
Stargate Router:       0x8731d54E9D02c286e8E619e7667aDaE90534Ea60
Player Stats NFT:      0x1111111111111111111111111111111111111111
```

### Base (Chain 8453)
```typescript
Wormhole NFT Bridge:   0x82eD3A7514cF52e15cBc828f8f2797FEe5eB6B73
Stargate Router:       0x45f1A52Ce91F202F59c17264f07B7aBf0E9c6cDe
Player Stats NFT:      0x1111111111111111111111111111111111111114
```

### All Chains
See [NFT_BRIDGE_QUICK_REFERENCE.md](#Contract-Addresses) for complete list

---

## Common Patterns

### Pattern 1: Bridge NFT & Monitor
```typescript
const protocol = getBestBridgeForNFT(nft, destChain);
const request = protocol === 'wormhole'
  ? createWormholeNFTBridgeRequest(nft, destChain, recipient)
  : createStargateNFTBridgeRequest(nft, destChain, recipient);

const txHash = await createBridgeTransaction(request);

// Monitor completion
while (!isBridgeTransactionComplete(txHash)) {
  const status = protocol === 'wormhole'
    ? getWormholeBridgeStatus(request)
    : getStargateBridgeStatus(request);
  
  console.log(`Progress: ${status.progress}%`);
  await sleep(10000); // Wait 10 seconds
}
```

### Pattern 2: Provide Liquidity
```typescript
// Create pool
const pool = createNFTLiquidityPool('stargate', 'player-stats', 8453, initialLiquidity);

// Add your NFTs
let pool = updatedPool;
for (const nft of myNFTs) {
  pool = addNFTToPool(pool, nft);
}

// Track rewards
setInterval(() => {
  const rewards = calculateLPRewards(pool, myShare, daysActive);
  console.log(`Total rewards: ${ethers.formatEther(rewards.rewards)}`);
}, 3600000); // Every hour
```

---

## Troubleshooting

### NFT Not Eligible
```typescript
if (!isNFTEligibleForBridging(nft)) {
  // Check:
  // 1. Is NFT on a supported chain?
  // 2. Is NFT a supported type? (5 types available)
  // 3. Is NFT unlocked for transfer?
}
```

### Bridge Stuck Pending
```typescript
const status = getWormholeBridgeStatus(request);
if (status.status === 'pending' && Date.now() > timeout) {
  // Wormhole can take 15-60 minutes
  // Consider using Stargate instead (2-10 min)
}
```

### High Fees
```typescript
// Use Stargate for low-value NFTs to save fees
// Stargate: 0.15% vs Wormhole: 0.25%
const protocol = getBestBridgeForNFT(nft, destChain);
// Automatically selects cheapest option
```

---

## File Reference

| File | Purpose | Lines |
|------|---------|-------|
| [lib/web3/nft-bridge.ts](lib/web3/nft-bridge.ts) | Core implementation | 950+ |
| [NFT_BRIDGE_GUIDE.md](NFT_BRIDGE_GUIDE.md) | Comprehensive guide | 1000+ |
| [NFT_BRIDGE_COMPONENTS.tsx](NFT_BRIDGE_COMPONENTS.tsx) | React components | 1100+ |
| [NFT_BRIDGE_QUICK_REFERENCE.md](NFT_BRIDGE_QUICK_REFERENCE.md) | Function reference | 400+ |

---

## Next Steps

1. **Import functions** from `lib/web3/nft-bridge`
2. **Test with contract addresses** from quick reference
3. **Review Phase 7 guide** for advanced patterns
4. **Deploy to testnet** first
5. **Monitor bridge transactions** in production

---

## Support

- **Function reference:** [NFT_BRIDGE_QUICK_REFERENCE.md](NFT_BRIDGE_QUICK_REFERENCE.md)
- **Detailed guide:** [NFT_BRIDGE_GUIDE.md](NFT_BRIDGE_GUIDE.md)
- **React components:** [NFT_BRIDGE_COMPONENTS.tsx](NFT_BRIDGE_COMPONENTS.tsx)
- **Full implementation:** [lib/web3/nft-bridge.ts](lib/web3/nft-bridge.ts)

---

**Ready to bridge NFTs?** Start with the code examples above! 🚀
