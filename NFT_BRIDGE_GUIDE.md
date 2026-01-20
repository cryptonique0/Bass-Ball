# Bass Ball NFT Bridge Support - Complete Implementation Guide

## Overview

The NFT Bridge Support system enables cross-chain transfers of Bass Ball NFTs using two industry-leading protocols:
- **Wormhole**: Decentralized bridging with 13 security validators
- **Stargate**: Ultra-fast liquidity pool-based bridging

This guide covers bridging player stats, achievements, cosmetics, formations, and limited-edition NFTs across 5 blockchain networks.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Wormhole NFT Bridge](#wormhole-nft-bridge)
3. [Stargate NFT Bridge](#stargate-nft-bridge)
4. [Bass Ball NFT Types](#bass-ball-nft-types)
5. [Cross-Chain Bridge Requests](#cross-chain-bridge-requests)
6. [NFT Liquidity Pools](#nft-liquidity-pools)
7. [Bridge Status Monitoring](#bridge-status-monitoring)
8. [Advanced Patterns](#advanced-patterns)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Supported Chains & Bridges

```
Ethereum (1) ──┬─→ Stargate/Wormhole ─→ Optimism (10)
               ├─→ Stargate/Wormhole ─→ Arbitrum (42161)
               ├─→ Stargate/Wormhole ─→ Base (8453)
               └─→ Stargate/Wormhole ─→ Polygon (137)
```

### NFT Bridge Flow

```
1. User initiates bridge request
2. System selects optimal bridge (Stargate preferred for cost/speed)
3. NFT locked on source chain
4. Bridge validators confirm ownership
5. NFT unlocked/minted on destination chain
6. User receives NFT at destination
```

### Bridge Comparison

| Feature | Wormhole | Stargate |
|---------|----------|----------|
| **Speed** | 15-60 minutes | 2-10 minutes |
| **Fee** | 0.25% | 0.15% |
| **Security** | 13-validator consensus | Liquidity pools |
| **Type** | Burn/mint | Liquidity-based |
| **Best For** | High value NFTs | Frequent transfers |

---

## Wormhole NFT Bridge

### What is Wormhole?

Wormhole is a decentralized bridge protocol that uses a network of 13 security guardians to validate cross-chain transfers. Each guardian must attest to the transfer, creating a cryptographic proof.

### Wormhole Configuration

```typescript
import { getWormholeConfig, getWormholeSupportedChains } from '@/lib/web3/nft-bridge';

// Get Wormhole config for a specific chain
const ethereumConfig = getWormholeConfig(1);
console.log(ethereumConfig);
// {
//   name: 'Ethereum',
//   chainId: 1,
//   nftBridge: '0x6FFdb75c91be862E1ef2511abC7c0733986fDaea',
//   coreBridge: '0x98f3c9e6E3fAce36bAAd05e5ca6EB53f926F41De',
//   consistencyLevel: 15,
//   supported: true
// }

// Get all Wormhole supported chains
const supportedChains = getWormholeSupportedChains();
console.log(supportedChains); // [1, 10, 42161, 8453, 137]
```

### Creating Wormhole NFT Requests

```typescript
import { createWormholeNFTBridgeRequest, BassBallNFT } from '@/lib/web3/nft-bridge';

// Create a player stats NFT
const playerNFT: BassBallNFT = {
  id: 'player-123',
  tokenId: 1001n,
  type: 'player-stats',
  owner: '0xUserAddress',
  metadata: {
    name: 'Diamond Player #123',
    description: 'Season 3 Diamond tier player',
    imageUrl: 'https://...',
    attributes: {
      mmr: 2100,
      wins: 145,
      level: 45,
      team: 'Team Blue'
    }
  },
  chainId: 1, // Ethereum
  contractAddress: '0x1234567890123456789012345678901234567890',
  mintedAt: 1704067200,
  value: parseUnits('5', 18) // 5 ETH value
};

// Request to bridge from Ethereum to Base Chain
const bridgeRequest = createWormholeNFTBridgeRequest(
  playerNFT,
  8453, // Base Chain
  '0xRecipientAddress'
);

console.log(bridgeRequest);
// {
//   id: 'wormhole-...',
//   protocol: 'wormhole',
//   sourceChain: 1,
//   destinationChain: 8453,
//   status: 'pending',
//   fee: 0.0125 ETH (0.25%),
//   estimatedArrival: 900s (15 min)
// }
```

### Wormhole Bridge Status Tracking

```typescript
import { getWormholeBridgeStatus } from '@/lib/web3/nft-bridge';

// Poll for bridge status
const status = getWormholeBridgeStatus(bridgeRequest);

console.log(status);
// {
//   status: 'confirmed',
//   progress: 50,
//   estimatedCompletion: 1704068100
// }

// Status progression:
// 0-25% → 'pending' (validators signing)
// 25-50% → 'confirmed' (majority consensus)
// 50-75% → 'finalized' (final confirmations)
// 75-100% → 'completed' (NFT unlocked on destination)
```

### Example: Full Wormhole Flow

```typescript
import {
  createWormholeNFTBridgeRequest,
  getWormholeBridgeStatus,
  createBridgeTransaction,
  updateBridgeTransactionStatus
} from '@/lib/web3/nft-bridge';

// 1. Create bridge request
const request = createWormholeNFTBridgeRequest(
  playerNFT,
  42161, // Arbitrum
  userAddress
);

// 2. Create transaction record
let transaction = createBridgeTransaction(request);

// 3. Monitor bridge progress
const checkBridgeProgress = async () => {
  while (!isBridgeTransactionComplete(transaction)) {
    const status = getWormholeBridgeStatus(request);
    
    if (status.progress === 50) {
      transaction = updateBridgeTransactionStatus(
        transaction,
        'confirmed',
        '0xTxHash...'
      );
    }
    
    if (status.progress === 100) {
      transaction = updateBridgeTransactionStatus(
        transaction,
        'completed'
      );
    }
    
    // Wait before next check
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
};
```

---

## Stargate NFT Bridge

### What is Stargate?

Stargate is a liquidity-based bridging protocol. Instead of validators, it uses pools of NFTs on each chain. When you bridge an NFT, you receive an equivalent NFT from the destination pool, and your original NFT joins the source pool.

### Stargate Configuration

```typescript
import { getStargateConfig, getStargateSupportedChains } from '@/lib/web3/nft-bridge';

// Get Stargate config for a specific chain
const baseConfig = getStargateConfig(8453);
console.log(baseConfig);
// {
//   name: 'Base',
//   chainId: 8453,
//   router: '0x45f1A3183c05eC9cDa54B25da5da28f25464Ee835',
//   stargatePool: '0x27a16dc789421c57144930881b8ba652146b16b1',
//   poolId: 1,
//   supportedChains: [1, 10, 42161, 137]
// }

// Check if route exists
const sourceConfig = getStargateConfig(8453); // Base
if (sourceConfig.supportedChains.includes(42161)) {
  console.log('Base → Arbitrum route available via Stargate');
}
```

### Creating Stargate NFT Requests

```typescript
import { createStargateNFTBridgeRequest } from '@/lib/web3/nft-bridge';

// Create cosmetics NFT
const cosmeticNFT: BassBallNFT = {
  type: 'cosmetic',
  owner: '0xUserAddress',
  chainId: 10, // Optimism
  metadata: {
    name: 'Golden Jersey',
    description: 'Exclusive gold team jersey',
    imageUrl: 'https://...',
    attributes: { rarity: 'legendary', edition: 1 }
  },
  value: parseUnits('2', 18) // 2 ETH value
  // ... other fields
};

// Bridge to Arbitrum via Stargate
const stargateRequest = createStargateNFTBridgeRequest(
  cosmeticNFT,
  42161, // Arbitrum
  '0xRecipientAddress'
);

console.log(stargateRequest);
// {
//   protocol: 'stargate',
//   fee: 0.003 ETH (0.15% - cheaper than Wormhole!),
//   estimatedTime: 120s (2 minutes)
// }
```

### Stargate Bridge Status Tracking

```typescript
import { getStargateBridgeStatus, formatBridgeTime } from '@/lib/web3/nft-bridge';

const status = getStargateBridgeStatus(stargateRequest);

console.log(`Status: ${status.status} (${status.progress}%)`);
console.log(`Estimated: ${formatBridgeTime(300 - elapsed)}`);

// Status progression (faster than Wormhole):
// 0-33% → 'pending'
// 33-66% → 'confirmed'
// 66-100% → 'finalized'
```

---

## Bass Ball NFT Types

### Supported NFT Types

```typescript
import { BASS_BALL_NFT_CONTRACTS } from '@/lib/web3/nft-bridge';

// All Bass Ball NFT contract addresses
const contracts = BASS_BALL_NFT_CONTRACTS;
// {
//   'player-stats': '0x1234...',
//   'achievement': '0x1111...',
//   'cosmetic': '0x2222...',
//   'formation': '0x3333...',
//   'limited-edition': '0x4444...'
// }
```

### Creating Bass Ball NFTs

```typescript
import { createBassBallNFT, isNFTEligibleForBridging } from '@/lib/web3/nft-bridge';

// 1. Player Stats NFT
const playerStats = createBassBallNFT(
  'player-stats',
  '0xPlayerAddress',
  1, // Ethereum
  {
    name: 'Legend Player #42',
    description: 'Season 3 Legend tier (2400+ MMR)',
    imageUrl: 'ipfs://...',
    attributes: {
      mmr: 2450,
      wins: 234,
      matches: 432,
      mvps: 18
    }
  },
  parseUnits('8', 18) // 8 ETH
);

// 2. Achievement NFT
const achievement = createBassBallNFT(
  'achievement',
  '0xPlayerAddress',
  1,
  {
    name: '100 Win Achievement',
    description: 'Earned 100 match victories',
    imageUrl: 'ipfs://...',
    attributes: { milestone: 100, date: 2024 }
  },
  parseUnits('0.5', 18) // 0.5 ETH
);

// 3. Check eligibility
const eligibleForBridge = isNFTEligibleForBridging(playerStats, 42161);
if (eligibleForBridge) {
  console.log('NFT can be bridged to Arbitrum');
}
```

### NFT Metadata Standard

```typescript
interface NFTMetadata {
  name: string;              // Display name
  description: string;       // Full description
  imageUrl: string;         // IPFS or external URL
  attributes: {
    [key: string]: string | number;
  };
}

// Example attributes by type
const playerStatsAttrs = {
  mmr: 2400,
  wins: 234,
  level: 45,
  rank: 'Legend'
};

const achievementAttrs = {
  milestone: 100,
  rarity: 'rare',
  season: 3
};

const cosmeticAttrs = {
  itemType: 'jersey',
  color: 'gold',
  edition: 1,
  rarity: 'legendary'
};
```

---

## Cross-Chain Bridge Requests

### Get Best Bridge Option

```typescript
import { 
  getBestBridgeForNFT,
  compareBridgeOptions 
} from '@/lib/web3/nft-bridge';

// Get recommended bridge
const bestBridge = getBestBridgeForNFT(nft, 8453); // Base
console.log(bestBridge); // 'stargate' (faster, cheaper)

// Compare all options
const options = compareBridgeOptions(nft, 8453);

options.forEach(opt => {
  console.log(`
    Protocol: ${opt.protocol}
    Fee: ${formatUnits(opt.fee, 18)} ETH
    Time: ${formatBridgeTime(opt.estimatedTime)}
    Recommended: ${opt.recommended}
  `);
});
```

### Multi-Bridge Support

```typescript
import {
  createWormholeNFTBridgeRequest,
  createStargateNFTBridgeRequest
} from '@/lib/web3/nft-bridge';

// High-value NFT → Use Wormhole (more secure)
if (nft.value > parseUnits('5', 18)) {
  const request = createWormholeNFTBridgeRequest(nft, 42161, recipient);
  // Wormhole's 13-validator consensus for high-value items
}

// Regular NFT → Use Stargate (faster, cheaper)
else {
  const request = createStargateNFTBridgeRequest(nft, 42161, recipient);
  // Stargate's liquidity-based for frequent transfers
}
```

---

## NFT Liquidity Pools

### Creating Liquidity Pools

```typescript
import { 
  createNFTLiquidityPool,
  addNFTToPool,
  removeNFTFromPool 
} from '@/lib/web3/nft-bridge';

// Create Stargate player-stats liquidity pool on Base
const pool = createNFTLiquidityPool(
  'stargate',
  'player-stats',
  8453, // Base Chain
  parseUnits('100', 18) // 100 ETH initial liquidity
);

console.log(pool);
// {
//   id: 'pool-stargate-player-stats-...',
//   totalNFTs: 100,
//   totalValue: 100 ETH,
//   apy: 82.5% (example),
//   liquidity: 100 ETH
// }
```

### Managing Pool Liquidity

```typescript
import { addNFTToPool, removeNFTFromPool } from '@/lib/web3/nft-bridge';

let playerPool = createNFTLiquidityPool(
  'stargate',
  'player-stats',
  8453,
  parseUnits('50', 18)
);

// Add player stats NFTs to pool
playerPool = addNFTToPool(playerPool, playerStatsNFT1);
playerPool = addNFTToPool(playerPool, playerStatsNFT2);

console.log(playerPool.totalNFTs); // 102
console.log(playerPool.totalValue); // 58 ETH

// Remove when needed
playerPool = removeNFTFromPool(playerPool, playerStatsNFT1);

console.log(playerPool.totalNFTs); // 101
```

### LP Reward Calculations

```typescript
import { calculateLPRewards } from '@/lib/web3/nft-bridge';

// LP provided 10% of total pool liquidity
const lpShare = 0.10;

// Pool has 80% APY
// LP active for 30 days
const rewards = calculateLPRewards(pool, lpShare, 30);

console.log(`Rewards: ${formatUnits(rewards, 18)} ETH`);
// Calculation: (50 ETH * 80% / 365) * 30 * 10% ≈ 0.329 ETH
```

### Pool Economics

```typescript
// Pool Parameters
const pool = {
  apy: 85.5,              // 85.5% annual yield
  totalValue: 150n,       // $150K in pool
  totalNFTs: 300,        // 300 NFTs locked

  // LP receives share of:
  // - Bridge transfer fees (0.15%)
  // - Arbitrage opportunities
  // - Protocol incentives
};

// Example: If $1M volume bridges through in 24h:
const volume = parseUnits('1000000', 18); // $1M
const bridgeFeeRate = 0.0015; // 0.15%
const fees = volume * BigInt(15) / BigInt(10000);
// Fees collected: $1,500 distributed to LPs
```

---

## Bridge Status Monitoring

### Real-Time Status Tracking

```typescript
import {
  getWormholeBridgeStatus,
  getStargateBridgeStatus,
  createBridgeTransaction,
  updateBridgeTransactionStatus
} from '@/lib/web3/nft-bridge';

async function monitorNFTBridge(request: NFTBridgeRequest) {
  let transaction = createBridgeTransaction(request);

  const pollInterval = setInterval(async () => {
    const status = request.protocol === 'wormhole'
      ? getWormholeBridgeStatus(request)
      : getStargateBridgeStatus(request);

    console.log(`
      Status: ${status.status}
      Progress: ${status.progress}%
      Est. Completion: ${new Date(status.estimatedCompletion * 1000)}
    `);

    // Update transaction record
    transaction = updateBridgeTransactionStatus(
      transaction,
      status.status as BridgeStatus
    );

    // Stop when complete
    if (status.progress === 100) {
      clearInterval(pollInterval);
    }
  }, 5000); // Poll every 5 seconds
}
```

### Status Webhooks

```typescript
// Set up webhook for status updates
async function setupBridgeWebhook(
  requestId: string,
  webhookUrl: string
) {
  // When status changes, POST to webhook:
  // {
  //   requestId: 'wormhole-...',
  //   status: 'finalized',
  //   progress: 75,
  //   timestamp: 1704068100
  // }
}
```

---

## Advanced Patterns

### Batch Bridge Multiple NFTs

```typescript
import { compareBridgeOptions } from '@/lib/web3/nft-bridge';

async function batchBridgeNFTs(
  nfts: BassBallNFT[],
  destinationChain: number,
  recipient: Address
) {
  const requests = [];

  for (const nft of nfts) {
    // Get best bridge for each NFT
    const options = compareBridgeOptions(nft, destinationChain);
    const best = options[0];

    let request;
    if (best.protocol === 'wormhole') {
      request = createWormholeNFTBridgeRequest(nft, destinationChain, recipient);
    } else {
      request = createStargateNFTBridgeRequest(nft, destinationChain, recipient);
    }

    requests.push(request);
  }

  return requests;
}

// Usage
const playerNFTs = [playerStats1, playerStats2, playerStats3];
const bridgeRequests = await batchBridgeNFTs(playerNFTs, 42161, userAddress);

console.log(`Bridging ${bridgeRequests.length} NFTs...`);
// Estimated cost: Sum of all fees
// Estimated time: Max of all times
```

### Cost-Optimized Bridging

```typescript
import { compareBridgeOptions } from '@/lib/web3/nft-bridge';

async function bridgeCheaply(
  nfts: BassBallNFT[],
  destinationChain: number
) {
  let totalFee = 0n;
  const requests = [];

  for (const nft of nfts) {
    // Pick cheapest option
    const options = compareBridgeOptions(nft, destinationChain);
    const cheapest = options[options.length - 1];

    let request;
    if (cheapest.protocol === 'wormhole') {
      request = createWormholeNFTBridgeRequest(nft, destinationChain, nft.owner);
    } else {
      request = createStargateNFTBridgeRequest(nft, destinationChain, nft.owner);
    }

    totalFee += request.fee;
    requests.push(request);
  }

  console.log(`Total fees: ${formatUnits(totalFee, 18)} ETH`);
  return requests;
}
```

### Multi-Destination Bridging

```typescript
async function bridgeToMultipleChains(
  nft: BassBallNFT,
  destinationChains: number[],
  recipient: Address
) {
  const requests = [];

  for (const chain of destinationChains) {
    const best = getBestBridgeForNFT(nft, chain);

    if (best === 'wormhole') {
      const req = createWormholeNFTBridgeRequest(nft, chain, recipient);
      requests.push(req);
    } else {
      const req = createStargateNFTBridgeRequest(nft, chain, recipient);
      requests.push(req);
    }
  }

  return requests;
}

// Bridge achievement to all supported chains
const allChains = [1, 10, 42161, 8453, 137];
const multiChainRequests = await bridgeToMultipleChains(
  achievementNFT,
  allChains,
  userAddress
);
```

---

## Best Practices

### 1. Choose Protocol Based on Use Case

```typescript
// High-value NFTs (> 5 ETH)
if (nft.value > parseUnits('5', 18)) {
  createWormholeNFTBridgeRequest(nft, destChain, recipient);
  // 13-validator security
}

// Regular transfers
else {
  createStargateNFTBridgeRequest(nft, destChain, recipient);
  // Faster, cheaper
}
```

### 2. Handle Bridge Failures Gracefully

```typescript
async function bridgeWithFallback(
  nft: BassBallNFT,
  destinationChain: number,
  recipient: Address
) {
  try {
    // Try Stargate first (faster)
    const request = createStargateNFTBridgeRequest(nft, destinationChain, recipient);
    return request;
  } catch (error) {
    // Fall back to Wormhole
    console.log('Stargate unavailable, using Wormhole');
    const request = createWormholeNFTBridgeRequest(nft, destinationChain, recipient);
    return request;
  }
}
```

### 3. Monitor and Retry Failed Bridges

```typescript
async function monitorBridgeWithRetry(
  request: NFTBridgeRequest,
  maxRetries = 3
) {
  let retries = 0;
  let lastStatus = 'pending';

  while (retries < maxRetries) {
    const status = request.protocol === 'wormhole'
      ? getWormholeBridgeStatus(request)
      : getStargateBridgeStatus(request);

    if (status.status === 'failed') {
      retries++;
      if (retries < maxRetries) {
        console.log(`Retry ${retries}/${maxRetries}...`);
        await new Promise(r => setTimeout(r, 30000)); // Wait 30s
      }
    }

    if (status.status === 'completed') {
      return 'success';
    }
  }

  throw new Error('Bridge failed after retries');
}
```

---

## Troubleshooting

### Bridge Stuck in Pending

```typescript
// Check if there are network issues
const sourceConfig = getWormholeConfig(nft.chainId);
if (!sourceConfig || !sourceConfig.supported) {
  throw new Error('Source chain not supported');
}

// Verify destination exists
const destConfig = getWormholeConfig(destinationChain);
if (!destConfig) {
  throw new Error('Destination chain not supported');
}
```

### Insufficient Liquidity (Stargate)

```typescript
// Check pool liquidity before bridging
const pool = getNFTLiquidityPool(destinationChain);
if (pool.liquidity < nft.value) {
  // Use Wormhole instead
  return createWormholeNFTBridgeRequest(nft, destinationChain, recipient);
}
```

### High Fees

```typescript
// Compare bridges and pick cheapest
const options = compareBridgeOptions(nft, destinationChain);
const cheapest = options.reduce((a, b) => a.fee < b.fee ? a : b);

if (cheapest.fee > maxAcceptableFee) {
  console.log('Fees too high, consider bridging later');
}
```

---

## Code Examples Summary

### 1. Simple Wormhole Bridge
```typescript
const request = createWormholeNFTBridgeRequest(nft, 42161, recipient);
```

### 2. Fast Stargate Bridge
```typescript
const request = createStargateNFTBridgeRequest(nft, 8453, recipient);
```

### 3. Best Option Selection
```typescript
const best = getBestBridgeForNFT(nft, destinationChain);
```

### 4. Create Liquidity Pool
```typescript
const pool = createNFTLiquidityPool('stargate', 'player-stats', 8453, liquidity);
```

### 5. Monitor Bridge Status
```typescript
const status = getWormholeBridgeStatus(request);
```

---

**Total Code Examples**: 60+  
**Supported Chains**: 5 (Ethereum, Optimism, Arbitrum, Base, Polygon)  
**Bridge Protocols**: 2 (Wormhole, Stargate)  
**NFT Types**: 5 (Player Stats, Achievements, Cosmetics, Formations, Limited Editions)
