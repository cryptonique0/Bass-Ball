# 🌊 Base Ecosystem Features & Integration Guide

## Overview

This document outlines the comprehensive Base ecosystem integration for Bass Ball, including bridges, DEXs, token utilities, and advanced DeFi capabilities.

## Features Implemented

### 1. **Base Ecosystem Utilities** (`lib/web3/base-ecosystem.ts`)

Complete TypeScript utilities for interacting with the Base ecosystem:

- **Network Statistics**: Block number, gas price, chain health monitoring
- **Token Management**: Support for major Base tokens (ETH, USDC, USDT, DAI, cbETH)
- **Gas Optimization**: Price estimation, cost calculations, L1 vs Base comparisons
- **Ecosystem Services**: Integration points for Bridges, DEXs, and indexers

#### Key Functions

```typescript
// Network information
await getBaseNetworkStats(); // Current block, gas price, etc.

// Gas handling
const estimate = await estimateBaseGasPrice();
const savings = calculateBaseSavings(l1Price, 'complex');

// Token utilities
getBaseTokenDetails('USDC');
formatBaseTokenAmount(amount, 18);
parseBaseTokenAmount('1.5', 18);

// Ecosystem health
const health = await getBaseEcosystemHealth();
```

### 2. **React Hooks** (`hooks/useBaseEcosystem.ts`)

Production-ready React hooks for Base ecosystem integration:

#### Main Hook: `useBaseEcosystem()`
```typescript
const {
  // Network state
  blockNumber,
  gasPrice,
  isBase,
  
  // Gas estimation
  estimatedGasPrice,
  gasRecommendation, // 'low' | 'standard' | 'fast'
  estimatedTxCost,
  
  // Ecosystem data
  bridges,
  dexs,
  services,
  
  // Health & loading
  ecosystemHealth,
  isLoading,
  error,
  
  // Utilities
  getBridgeLink,
  getSwapLink,
  getTokenInfo,
  refresh,
} = useBaseEcosystem();
```

#### Additional Hooks

**`useBaseGasMonitor()`**
- Tracks gas price history (60 data points)
- Provides trend analysis (increasing/decreasing/stable)
- Calculates moving average

**`useBaseCostComparison(txComplexity)`**
- Shows savings vs Ethereum L1
- Displays cost in USD
- Indicates significance of savings

**`useBaseServiceAvailable(serviceId)`**
- Checks if service is available
- Returns service details

### 3. **The Graph Queries** (`lib/web3/base-graph-queries.ts`)

Ready-to-use GraphQL queries for Base Chain data:

#### Uniswap V3 Queries
- Pool data with liquidity and fees
- Swap history and analytics
- User liquidity positions

#### Aerodrome Queries
- Pool information
- Swap data
- Pair analytics

#### Market Data Queries
- Daily market statistics
- Hourly candle data
- Trading volume and liquidity trends

#### Helper Functions
- `parsePoolData()` - Normalize pool information
- `parseSwapData()` - Format swap transactions
- `calculatePriceImpact()` - Analyze slippage
- `calculateLPAPY()` - Compute LP returns
- `calculateAveragePrice()` - Derive price from reserves

### 4. **Supported Tokens**

Major tokens on Base Chain with contract addresses:

| Token | Symbol | Address | Decimals |
|-------|--------|---------|----------|
| Ether | ETH | 0x0000... | 18 |
| USD Coin | USDC | 0x8335... | 6 |
| Tether | USDT | 0xfde4... | 6 |
| Dai | DAI | 0x50c5... | 18 |
| Coinbase ETH | cbETH | 0x2Ae3... | 18 |

### 5. **Bridges Integration**

Support for major bridge protocols:

| Bridge | Features | URL |
|--------|----------|-----|
| Stargate Finance | Cross-chain liquidity | stargate.finance |
| Across Protocol | Relayed bridge | across.to |
| Optimism Bridge | Native OP ↔ Base | optimism.io/bridge |

**Bridge Helper Functions**
```typescript
// Get bridge URL with parameters
getBridgeUrl('STARGATE', 'USDC', '100');

// Example output
// https://stargate.finance?token=USDC&amount=100&toChain=8453
```

### 6. **DEX Integration**

Support for major DEXs on Base:

| DEX | Type | Router Address |
|-----|------|----------------|
| Uniswap V3 | AMM | 0x2626... |
| Aerodrome | Native DEX | 0xcF77... |
| PancakeSwap V3 | AMM | 0x1b81... |

**DEX Helper Functions**
```typescript
// Get swap URL
getSwapLink('UNISWAP_V3', 'ETH', 'USDC');

// Build swap interface URL
// https://app.uniswap.org/swap?chain=base&...
```

## Usage Examples

### Example 1: Display Base Ecosystem Status

```typescript
'use client';

import { useBaseEcosystem } from '@/hooks/useBaseEcosystem';

export function BaseEcosystemStatus() {
  const {
    blockNumber,
    gasPrice,
    estimatedGasPrice,
    isBase,
    ecosystemHealth,
    isLoading,
  } = useBaseEcosystem();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Base Ecosystem Status</h2>
      <p>Block: {blockNumber}</p>
      <p>Gas Price: {estimatedGasPrice} Gwei</p>
      <p>Network: {isBase ? '✅ Connected' : '❌ Not connected'}</p>
      <p>Health: {ecosystemHealth}</p>
    </div>
  );
}
```

### Example 2: Gas Cost Comparison

```typescript
import { useBaseCostComparison } from '@/hooks/useBaseEcosystem';

export function GasCostComparison() {
  const comparison = useBaseCostComparison('complex');

  if (!comparison) return null;

  return (
    <div>
      <h3>Transaction Cost Comparison</h3>
      <p>Ethereum: {comparison.ethereumCost}</p>
      <p>Base: {comparison.baseCost}</p>
      <p>💰 Savings: {comparison.savedAmount} ({comparison.savingsPercent})</p>
    </div>
  );
}
```

### Example 3: Bridge Integration

```typescript
import { useBaseEcosystem } from '@/hooks/useBaseEcosystem';

export function BridgeSelector() {
  const { bridges, getBridgeLink } = useBaseEcosystem();

  return (
    <div>
      <h3>Bridge to Base</h3>
      {bridges.map(bridge => (
        <a 
          key={bridge.id} 
          href={getBridgeLink(bridge.id, 'USDC', '100')}
          target="_blank"
          rel="noopener noreferrer"
        >
          {bridge.name}
        </a>
      ))}
    </div>
  );
}
```

### Example 4: Monitor Gas Prices

```typescript
import { useBaseGasMonitor } from '@/hooks/useBaseEcosystem';

export function GasMonitor() {
  const {
    currentGasPrice,
    gasAverage,
    gasTrend,
    recommendation,
  } = useBaseGasMonitor();

  return (
    <div>
      <h3>Gas Price Monitor</h3>
      <p>Current: {currentGasPrice} Gwei</p>
      <p>Average: {gasAverage} Gwei</p>
      <p>Trend: {gasTrend} {gasTrend === 'increasing' ? '📈' : '📉'}</p>
      <p>Recommendation: {recommendation}</p>
    </div>
  );
}
```

### Example 5: Query Pool Data

```typescript
import { ApolloClient, useQuery } from '@apollo/client';
import { UNISWAP_V3_POOL_QUERY, parsePoolData } from '@/lib/web3/base-graph-queries';

export function PoolAnalytics() {
  const { data, loading } = useQuery(UNISWAP_V3_POOL_QUERY, {
    variables: { first: 10, skip: 0 }
  });

  if (loading) return <div>Loading pools...</div>;

  return (
    <div>
      {data?.pools.map((pool: any) => {
        const parsed = parsePoolData(pool);
        return (
          <div key={parsed.address}>
            <h4>{parsed.token0.symbol} / {parsed.token1.symbol}</h4>
            <p>Volume 24h: ${parsed.volume24h}</p>
            <p>Liquidity: ${pool.liquidity}</p>
          </div>
        );
      })}
    </div>
  );
}
```

## Installation & Setup

### 1. Add Dependencies (Already in package.json)

```bash
npm install viem wagmi ethers dotenv
```

### 2. Configure Environment Variables

Add to `.env.local`:

```env
# Base RPC Endpoints
NEXT_PUBLIC_BASE_RPC=https://mainnet.base.org
NEXT_PUBLIC_BASE_SEPOLIA_RPC=https://sepolia.base.org

# The Graph
NEXT_PUBLIC_GRAPH_ENDPOINT=https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-base

# Optional: API Keys
BASESCAN_API_KEY=your_api_key
```

### 3. Import and Use

```typescript
import { useBaseEcosystem } from '@/hooks/useBaseEcosystem';
import { getBaseNetworkStats } from '@/lib/web3/base-ecosystem';
```

## Benefits for Bass Ball

1. **Lower Gas Costs**: 4000x cheaper than Ethereum L1
2. **Fast Transactions**: 2-second blocks, 15-second finality
3. **Better UX**: Real-time gas monitoring and optimization recommendations
4. **DeFi Integration**: Access to swaps, bridges, and liquidity pools
5. **Market Data**: Real-time analytics from The Graph
6. **Cross-Chain**: Bridge tokens from Ethereum/other chains

## Security Considerations

- ✅ All RPC calls use public endpoints (no private keys exposed)
- ✅ Hooks handle errors gracefully
- ✅ Validation for token addresses and amounts
- ✅ Safe type conversions with viem/ethers
- ✅ No localStorage of sensitive data

## Performance Optimization

- **Caching**: 30-second auto-refresh for ecosystem data
- **Batching**: Parallel requests for network stats
- **Memoization**: useCallback and useMemo throughout hooks
- **Lazy Loading**: Data loads on demand

## Future Enhancements

- [ ] Advanced LP position management
- [ ] Multi-chain routing for swaps
- [ ] Price alert system
- [ ] Historical analytics dashboard
- [ ] NFT market integration
- [ ] Governance token tracking

## Resources

- [Base Docs](https://docs.base.org)
- [Uniswap V3 on Base](https://app.uniswap.org/?chain=base)
- [Aerodrome Finance](https://aerodrome.finance)
- [The Graph Subgraphs](https://thegraph.com)
- [BaseScan Block Explorer](https://basescan.org)

---

**Last Updated**: January 20, 2026
**Status**: ✅ Production Ready
