# NFT Bridge Quick Reference

Complete quick lookup guide for Bass Ball NFT cross-chain bridge implementation.

## Table of Contents

1. [Function Reference](#function-reference)
2. [Protocol Comparison](#protocol-comparison)
3. [Contract Addresses](#contract-addresses)
4. [Common Patterns](#common-patterns)
5. [Error Codes](#error-codes)

---

## Function Reference

### Wormhole Bridge Functions

#### `getWormholeConfig(chainId: number)`

Retrieve Wormhole configuration for a specific chain.

```typescript
const config = getWormholeConfig(8453); // Base
// Returns: WormholeConfig with addresses, decimals, wrapped tokens
```

**Parameters:**
- `chainId`: Target chain ID (1, 10, 42161, 8453, 137)

**Returns:** `WormholeConfig` object with bridge contract, token bridge, NFT bridge addresses

---

#### `createWormholeNFTBridgeRequest(nft: BassBallNFT, destChainId: number, recipient: string)`

Create a Wormhole bridge request for an NFT.

```typescript
const nft: BassBallNFT = {
  id: 'nft_123',
  chainId: 1,
  type: 'player-stats',
  contractAddress: '0x...',
  tokenId: '1',
  owner: userAddress,
  metadata: { name: 'Legendary Player', stats: {...} },
  value: ethers.parseEther('2.5'),
};

const request = createWormholeNFTBridgeRequest(nft, 8453, recipientAddress);
// Initiates Wormhole bridge (13-validator consensus, 15-60 minutes)
```

**Parameters:**
- `nft`: BassBallNFT object
- `destChainId`: Destination chain ID
- `recipient`: Recipient address on destination chain

**Returns:** `NFTBridgeRequest` with Wormhole configuration

---

#### `getWormholeBridgeStatus(request: NFTBridgeRequest)`

Check status of Wormhole bridge transaction.

```typescript
const status = getWormholeBridgeStatus(request);
// Returns: { status: 'pending' | 'confirmed' | 'finalized', progress: 0-100 }
```

**Parameters:**
- `request`: NFTBridgeRequest object

**Returns:** Status data with progress percentage (0-100)

---

### Stargate Bridge Functions

#### `getStargateConfig(chainId: number)`

Retrieve Stargate configuration for a specific chain.

```typescript
const config = getStargateConfig(42161); // Arbitrum
// Returns: StargateConfig with router, pool addresses
```

**Parameters:**
- `chainId`: Target chain ID

**Returns:** `StargateConfig` with router and pool contract addresses

---

#### `createStargateNFTBridgeRequest(nft: BassBallNFT, destChainId: number, recipient: string)`

Create a Stargate bridge request for rapid NFT transfer.

```typescript
const request = createStargateNFTBridgeRequest(nft, 137, recipientAddress);
// Initiates Stargate bridge (liquidity pools, 2-10 minutes)
```

**Parameters:**
- `nft`: BassBallNFT object
- `destChainId`: Destination chain ID
- `recipient`: Recipient address on destination chain

**Returns:** `NFTBridgeRequest` with Stargate configuration

---

#### `getStargateBridgeStatus(request: NFTBridgeRequest)`

Monitor Stargate bridge progress.

```typescript
const status = getStargateBridgeStatus(request);
// Returns: { status: 'pending' | 'confirmed' | 'completed', progress: 0-100 }
```

**Parameters:**
- `request`: NFTBridgeRequest object

**Returns:** Real-time bridge status

---

### NFT Liquidity Pool Functions

#### `createNFTLiquidityPool(protocol: 'wormhole' | 'stargate', nftType: string, chainId: number, initialLiquidity: bigint)`

Create a new NFT liquidity pool.

```typescript
const pool = createNFTLiquidityPool(
  'stargate',
  'player-stats',
  8453,
  ethers.parseEther('10')
);
// Returns: NFTLiquidityPool object
```

**Parameters:**
- `protocol`: Bridge protocol ('stargate' recommended for pools)
- `nftType`: Bass Ball NFT type
- `chainId`: Chain where pool operates
- `initialLiquidity`: Initial liquidity amount

**Returns:** `NFTLiquidityPool` object

---

#### `addNFTToPool(pool: NFTLiquidityPool, nft: BassBallNFT)`

Add NFT to liquidity pool.

```typescript
const updatedPool = addNFTToPool(pool, nft);
```

**Parameters:**
- `pool`: Target liquidity pool
- `nft`: NFT to add

**Returns:** Updated `NFTLiquidityPool`

---

#### `removeNFTFromPool(pool: NFTLiquidityPool, nftId: string)`

Remove NFT from liquidity pool.

```typescript
const updatedPool = removeNFTFromPool(pool, 'nft_123');
```

**Parameters:**
- `pool`: Target liquidity pool
- `nftId`: ID of NFT to remove

**Returns:** Updated `NFTLiquidityPool`

---

#### `calculateLPRewards(pool: NFTLiquidityPool, lpShare: number, daysActive: number)`

Calculate LP rewards for pool participation.

```typescript
const rewards = calculateLPRewards(pool, 5, 30);
// Returns: { rewards: bigint, apy: number, dailyReward: bigint }
```

**Parameters:**
- `pool`: Liquidity pool
- `lpShare`: Your percentage share (0-100)
- `daysActive`: Days active in pool

**Returns:** Rewards calculation object

---

### Bass Ball NFT Functions

#### `createBassBallNFT(type: string, owner: string, quantity: number, metadata: any, value: bigint)`

Create a Bass Ball NFT.

```typescript
const playerNFT = createBassBallNFT(
  'player-stats',
  ownerAddress,
  1,
  {
    name: 'Legendary Player',
    stats: { speed: 95, accuracy: 92 },
    rarity: 'legendary'
  },
  ethers.parseEther('2.5')
);
```

**Parameters:**
- `type`: NFT type ('player-stats', 'achievement', 'cosmetic', 'formation', 'limited-edition')
- `owner`: Owner address
- `quantity`: Number of NFTs (1 for unique, >1 for fungible)
- `metadata`: NFT metadata object
- `value`: NFT value in wei

**Returns:** `BassBallNFT` object

---

#### `isNFTEligibleForBridging(nft: BassBallNFT)`

Check if NFT can be bridged.

```typescript
const eligible = isNFTEligibleForBridging(nft);
// Returns: boolean
```

**Parameters:**
- `nft`: NFT to check

**Returns:** Eligibility status (true/false)

---

#### `getBestBridgeForNFT(nft: BassBallNFT, destChainId: number)`

Determine optimal bridge protocol for NFT.

```typescript
const protocol = getBestBridgeForNFT(nft, 8453);
// Returns: 'wormhole' | 'stargate' based on value and time
```

**Parameters:**
- `nft`: NFT to bridge
- `destChainId`: Destination chain

**Returns:** Recommended protocol ('wormhole' or 'stargate')

---

### Bridge Transaction Functions

#### `createBridgeTransaction(request: NFTBridgeRequest)`

Create a bridge transaction on-chain.

```typescript
const txHash = await createBridgeTransaction(request);
```

**Parameters:**
- `request`: NFTBridgeRequest object

**Returns:** Transaction hash (string)

---

#### `updateBridgeTransactionStatus(txHash: string, status: string)`

Update bridge transaction status.

```typescript
updateBridgeTransactionStatus('0x...', 'finalized');
```

**Parameters:**
- `txHash`: Transaction hash
- `status`: New status

**Returns:** void

---

#### `isBridgeTransactionComplete(txHash: string)`

Check if bridge transaction is complete.

```typescript
const complete = isBridgeTransactionComplete(txHash);
// Returns: boolean
```

**Parameters:**
- `txHash`: Transaction hash

**Returns:** Completion status

---

### Analytics Functions

#### `calculateNFTBridgeMetrics(request: NFTBridgeRequest)`

Calculate comprehensive bridge metrics.

```typescript
const metrics = calculateNFTBridgeMetrics(request);
// Returns: NFTBridgeMetrics with stats
```

**Parameters:**
- `request`: NFTBridgeRequest object

**Returns:** `NFTBridgeMetrics` object

---

#### `getNFTBridgeStats()`

Get platform-wide bridge statistics.

```typescript
const stats = getNFTBridgeStats();
// Returns: { totalBridged, totalVolume, successRate, avgTime, ... }
```

**Parameters:** None

**Returns:** Bridge statistics object

---

## Protocol Comparison

### Quick Decision Matrix

| Factor | Wormhole | Stargate |
|--------|----------|----------|
| **Best For** | High-value NFTs | Frequent transfers |
| **Speed** | 15-60 min | 2-10 min |
| **Fee** | 0.25% | 0.15% |
| **Security** | 13-validator | Liquidity pools |
| **NFT Types** | All 5 types | All 5 types |
| **TVL Requirement** | None | Pool dependent |

### Fee Calculation Examples

**Wormhole Bridge (High-Value):**
```
NFT Value: 5 ETH
Fee: 5 × 0.0025 = 0.0125 ETH (~$40)
Time: ~30 minutes
Best for: Player Stats, Achievements worth >3 ETH
```

**Stargate Bridge (Regular):**
```
NFT Value: 1 ETH
Fee: 1 × 0.0015 = 0.0015 ETH (~$5)
Time: ~5 minutes
Best for: Cosmetics, Formations, regular transfers
```

---

## Contract Addresses

### Wormhole Addresses

```typescript
const WORMHOLE_ADDRESSES = {
  1: {           // Ethereum
    bridge: '0x98f3c9e6E3fAce36bAAd05FE09629bBF1a73A8d',
    tokenBridge: '0x0290FB167208Af455bB137780163b7B7a9a10C16',
    nftBridge: '0x6FFd7EdE62328b3Af38FCD61461Bbfc52F5651fE',
  },
  10: {          // Optimism
    bridge: '0x4cb69FaE7e7Af841e44E1A1c30f6Ff537F2a8A78',
    tokenBridge: '0x1b85fac37f7f05fe9bAeaf1D7B5a4E00DD81DbEC',
    nftBridge: '0xC7A204bDBFe983FCD8d8E61D02b475D4073ff3E1',
  },
  42161: {       // Arbitrum
    bridge: '0xa5F208e072434bC67592E4C49C1B991BA79BCA46',
    tokenBridge: '0x0b52991Eb7d7cb7886991E48A226eaB7c4d3f3d8',
    nftBridge: '0xC69Ab6007DfBd8fF337637C84bF630960e6fb04F',
  },
  8453: {        // Base
    bridge: '0x79A61018B2F888D82e4FF119b79068FA2dd54c38',
    tokenBridge: '0x77a3aBa617E2bA0b6c1572d8657cbd2fbc308d13',
    nftBridge: '0x82eD3A7514cF52e15cBc828f8f2797FEe5eB6B73',
  },
  137: {         // Polygon
    bridge: '0x7bbcE28e64B3F8b733988EFA87a1D02912B4AFF2',
    tokenBridge: '0x5a58505Fa1851B94BE9b8FFB33cc45b0A38756DA',
    nftBridge: '0xB6F6954FF8d4c3dA6aaA2c6Eb5Fc1eEda7bcF7f0',
  },
};
```

### Stargate Addresses

```typescript
const STARGATE_ADDRESSES = {
  1: {           // Ethereum
    router: '0x8731d54E9D02c286e8E619e7667aDaE90534Ea60',
    nftPool: '0x4f6f3a0c9F5fCF3bE9F9F4e8D0c0e0f0a0b0c0d0',
  },
  10: {          // Optimism
    router: '0x45f1A52Ce91F202F59c17264f07B7aBf0E9c6cDe',
    nftPool: '0x5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a5a',
  },
  42161: {       // Arbitrum
    router: '0x53Bf833A5d6c4ddA888F69c22C88Dcf7e85a9686',
    nftPool: '0x6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b6b',
  },
  8453: {        // Base
    router: '0x45f1A52Ce91F202F59c17264f07B7aBf0E9c6cDe',
    nftPool: '0x7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c7c',
  },
  137: {         // Polygon
    router: '0x45f1A52Ce91F202F59c17264f07B7aBf0E9c6cDe',
    nftPool: '0x8d8d8d8d8d8d8d8d8d8d8d8d8d8d8d8d8d8d8d8d',
  },
};
```

### Bass Ball NFT Contract Addresses

```typescript
const BASSBALL_NFT_CONTRACTS = {
  'player-stats': {
    1: '0x1111111111111111111111111111111111111111',   // Ethereum
    10: '0x1111111111111111111111111111111111111112',  // Optimism
    42161: '0x1111111111111111111111111111111111111113', // Arbitrum
    8453: '0x1111111111111111111111111111111111111114', // Base
    137: '0x1111111111111111111111111111111111111115',  // Polygon
  },
  'achievement': {
    1: '0x2222222222222222222222222222222222222221',
    10: '0x2222222222222222222222222222222222222222',
    // ... other chains
  },
  'cosmetic': {
    1: '0x3333333333333333333333333333333333333331',
    // ... other chains
  },
  'formation': {
    1: '0x4444444444444444444444444444444444444441',
    // ... other chains
  },
  'limited-edition': {
    1: '0x5555555555555555555555555555555555555551',
    // ... other chains
  },
};
```

---

## Common Patterns

### Pattern 1: Bridge an NFT to Another Chain

```typescript
import {
  isNFTEligibleForBridging,
  getBestBridgeForNFT,
  createWormholeNFTBridgeRequest,
  createStargateNFTBridgeRequest,
  createBridgeTransaction,
  getWormholeBridgeStatus,
} from './lib/web3/nft-bridge';

// Check eligibility
if (!isNFTEligibleForBridging(nft)) {
  throw new Error('NFT cannot be bridged');
}

// Determine best protocol
const protocol = getBestBridgeForNFT(nft, 8453); // Base

// Create request
const request =
  protocol === 'wormhole'
    ? createWormholeNFTBridgeRequest(nft, 8453, recipientAddress)
    : createStargateNFTBridgeRequest(nft, 8453, recipientAddress);

// Execute bridge
const txHash = await createBridgeTransaction(request);

// Monitor status
const status = getWormholeBridgeStatus(request);
console.log(`Bridge progress: ${status.progress}%`);
```

### Pattern 2: Create and Manage Liquidity Pool

```typescript
import {
  createNFTLiquidityPool,
  addNFTToPool,
  calculateLPRewards,
} from './lib/web3/nft-bridge';

// Create pool for player stats on Base
const pool = createNFTLiquidityPool(
  'stargate',
  'player-stats',
  8453,
  ethers.parseEther('10') // 10 ETH initial liquidity
);

// Add NFTs to pool
let updatedPool = pool;
for (const nft of myNFTs) {
  updatedPool = addNFTToPool(updatedPool, nft);
}

// Calculate rewards after 30 days
const rewards = calculateLPRewards(updatedPool, 5, 30); // 5% share, 30 days
console.log(`Earned: ${ethers.formatEther(rewards.rewards)} ETH`);
console.log(`APY: ${rewards.apy.toFixed(2)}%`);
```

### Pattern 3: Batch Bridge Multiple NFTs

```typescript
// Bridge multiple NFTs with cost optimization
const nftsToMove = [nft1, nft2, nft3, nft4];
const results = [];

for (const nft of nftsToMove) {
  const protocol = getBestBridgeForNFT(nft, 42161); // Arbitrum

  const request =
    protocol === 'wormhole'
      ? createWormholeNFTBridgeRequest(nft, 42161, recipient)
      : createStargateNFTBridgeRequest(nft, 42161, recipient);

  const txHash = await createBridgeTransaction(request);
  results.push({ nft: nft.id, txHash, protocol });
}

return results;
```

### Pattern 4: Monitor Bridge Completion

```typescript
// Poll bridge status until completion
async function waitForBridgeCompletion(
  txHash: string,
  maxWait: number = 3600000 // 1 hour
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWait) {
    const isComplete = isBridgeTransactionComplete(txHash);
    if (isComplete) return true;

    // Wait 30 seconds before next check
    await new Promise((resolve) => setTimeout(resolve, 30000));
  }

  return false;
}

// Usage
if (await waitForBridgeCompletion(txHash)) {
  console.log('Bridge completed successfully!');
} else {
  console.error('Bridge did not complete within timeout');
}
```

---

## Error Codes

### Bridge Errors

| Code | Message | Solution |
|------|---------|----------|
| `E001` | NFT not eligible | Check `isNFTEligibleForBridging()` |
| `E002` | Insufficient liquidity | Wait for pool to accumulate liquidity |
| `E003` | Invalid destination chain | Check chain ID is in supported list |
| `E004` | Bridge protocol error | Retry with alternative protocol |
| `E005` | Fee exceeds limit | Adjust slippage tolerance |
| `E006` | Transaction reverted | Check gas, nonce, allowances |
| `E007` | Timeout | Monitor with `getWormholeBridgeStatus()` |

### Contract Errors

| Code | Message | Solution |
|------|---------|----------|
| `C001` | Unauthorized | Approve NFT bridge contract first |
| `C002` | Token not found | Verify contract address and chain |
| `C003` | Pool empty | Add liquidity before bridging |
| `C004` | Invalid metadata | Ensure metadata meets standards |

---

## Integration Checklist

- [ ] Import bridge functions
- [ ] Verify contract addresses for your chain
- [ ] Check NFT eligibility
- [ ] Select bridge protocol (Wormhole for high-value, Stargate for frequent)
- [ ] Create bridge request
- [ ] Approve NFT contract if needed
- [ ] Execute bridge transaction
- [ ] Monitor status with polling
- [ ] Verify NFT on destination chain

---

## Support Resources

- **Wormhole Docs**: https://docs.wormhole.com/wormhole/
- **Stargate Docs**: https://stargate.finance/docs
- **Bass Ball Bridge Guide**: See `NFT_BRIDGE_GUIDE.md`
- **Full Implementation**: See `lib/web3/nft-bridge.ts`
