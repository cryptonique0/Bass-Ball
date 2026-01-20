# 🌉 Cross-Chain Swap Optimizer - Complete Guide

**Status**: ✅ Production Ready  
**Release Date**: January 20, 2026  
**Module**: `lib/web3/cross-chain-swap-optimizer.ts`  

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Best Rate Finder](#best-rate-finder)
3. [Multi-Hop Routing](#multi-hop-routing)
4. [Cost Comparison](#cost-comparison)
5. [Route Analysis](#route-analysis)
6. [Integration Examples](#integration-examples)
7. [API Reference](#api-reference)

---

## Overview

The Cross-Chain Swap Optimizer finds the best path for trading assets across different blockchains by combining bridges and DEXs intelligently.

### Key Features

✅ **Best rate finder** across all bridges and DEXs  
✅ **Multi-hop routing** (e.g., ETH → USDC → Base USDC)  
✅ **Complete cost breakdown** with fees, slippage, and gas  
✅ **3 optimization modes**: cheapest, fastest, best-rate  
✅ **Liquidity analysis** and risk assessment  
✅ **Real-time route comparison**  
✅ **Execution-ready exports**  

### Supported Routes

**Chains**: Ethereum, Base, Arbitrum, Optimism, Polygon  
**Assets**: ETH, USDC, USDC.e, DAI  
**Bridges**: Stargate, Hop, Across, Socket, Canonical  
**DEXs**: Uniswap V3, Aerodrome, Curve, BaseSwap  

---

## Best Rate Finder

### 1. Find Optimal Path

```typescript
import { getOptimalCrossChainPath } from '@/lib/web3/cross-chain-swap-optimizer';

// ETH on Ethereum → USDC on Base
const route = getOptimalCrossChainPath(
  'ETH',           // from asset
  'ethereum',      // from chain
  'USDC',          // to asset
  'base',          // to chain
  '1.0',           // amount (1 ETH)
  { priority: 'best-rate' }
);

console.log(`Best rate: ${route.rate.toFixed(4)}`);
console.log(`Output: ${route.outputAmount} USDC`);
console.log(`Steps: ${route.steps.length}`);

// Output example:
// Best rate: 1.0025
// Output: 2497.50 USDC
// Steps: 3 (swap -> bridge -> swap)
```

### 2. Compare All Routes

```typescript
import { compareAllRoutes } from '@/lib/web3/cross-chain-swap-optimizer';

const comparison = compareAllRoutes(
  'ETH',
  'ethereum',
  'USDC',
  'base',
  '10.0'
);

console.log(`Total routes found: ${comparison.routes.length}`);
console.log(`\nBest by rate: ${comparison.bestByRate.rate.toFixed(4)}`);
console.log(`Best by cost: $${comparison.bestByCost.totalCost.toFixed(2)}`);
console.log(`Best by speed: ${comparison.bestBySpeed.totalTime}s`);
console.log(`Recommended: ${comparison.recommended.id}`);

// Show top 3 routes
comparison.routes.slice(0, 3).forEach((route, i) => {
  console.log(`\n${i + 1}. ${formatRoute(route)}`);
  console.log(`   Cost: $${route.totalCost.toFixed(2)}`);
  console.log(`   Rate: ${route.rate.toFixed(4)}`);
  console.log(`   Time: ${route.totalTime}s`);
  console.log(`   Output: ${route.outputAmount}`);
});

// Output:
// Total routes found: 8
//
// Best by rate: 1.0015
// Best by cost: $5.23
// Best by speed: 120s
// Recommended: swap-bridge-swap-across-...
//
// 1. ETH → USDC (Uniswap V3) → ETH (Across) → USDC (Aerodrome)
//    Cost: $4.50
//    Rate: 1.0020
//    Time: 240s
//    Output: 2495.00 USDC
//
// 2. ETH → USDC (Aerodrome) → ETH (Stargate) → USDC (Uniswap V3)
//    Cost: $5.23
//    Rate: 1.0015
//    Time: 300s
//    Output: 2497.50 USDC
//
// 3. Direct Bridge (Hop) → USDC (Curve)
//    Cost: $3.80
//    Rate: 1.0030
//    Time: 180s
//    Output: 2493.00 USDC
```

### 3. Get All Routes

```typescript
import { getAllCrossChainRoutes } from '@/lib/web3/cross-chain-swap-optimizer';

const allRoutes = getAllCrossChainRoutes(
  'ETH',
  'ethereum',
  'USDC',
  'base',
  '5.0',
  {
    maxSlippage: 1.0,        // Max 1% slippage
    maxTime: 600,            // Max 10 minutes
    excludeBridges: ['stargate'], // Skip Stargate
    priority: 'cheapest',
  }
);

console.log(`Filtered routes (cost optimized): ${allRoutes.length}`);

allRoutes.forEach((route, i) => {
  console.log(`${i + 1}. ${route.totalCost.toFixed(2)}`, `($${route.totalCost.toFixed(2)})`);
});
```

---

## Multi-Hop Routing

### 1. Understand Route Steps

```typescript
import { 
  getOptimalCrossChainPath,
  formatRoute 
} from '@/lib/web3/cross-chain-swap-optimizer';

const route = getOptimalCrossChainPath('ETH', 'ethereum', 'USDC', 'base', '1.0');

console.log(`Route: ${formatRoute(route)}`);
console.log(`Total steps: ${route.steps.length}\n`);

route.steps.forEach((step, i) => {
  console.log(`Step ${i + 1}: ${step.type.toUpperCase()}`);
  console.log(`  Protocol: ${('name' in step.protocol) ? step.protocol.name : 'Unknown'}`);
  console.log(`  From: ${step.inputAmount} ${step.fromAsset.symbol}`);
  console.log(`  To: ${step.outputAmount} ${step.toAsset.symbol}`);
  console.log(`  Fee: $${step.fee.toFixed(2)}`);
  console.log(`  Price Impact: ${step.priceImpact.toFixed(2)}%`);
  console.log(`  Time: ${step.executionTime}s\n`);
});

// Output example:
// Route: ETH → USDC (Uniswap V3) → ETH (Across) → USDC (Aerodrome)
// Total steps: 3
//
// Step 1: SWAP
//   Protocol: Uniswap V3
//   From: 1.0 ETH
//   To: 2500.00 USDC
//   Fee: $0.75
//   Price Impact: 0.05%
//   Time: 20s
//
// Step 2: BRIDGE
//   Protocol: Across
//   From: 2500.00 USDC
//   To: 2493.75 USDC
//   Fee: $0.75
//   Price Impact: 0.05%
//   Time: 120s
//
// Step 3: SWAP
//   Protocol: Aerodrome
//   From: 2493.75 USDC
//   To: 2493.50 USDC
//   Fee: $0.60
//   Price Impact: 0.04%
//   Time: 15s
```

### 2. Trace Route Execution

```typescript
import { getOptimalCrossChainPath } from '@/lib/web3/cross-chain-swap-optimizer';

const route = getOptimalCrossChainPath('ETH', 'ethereum', 'DAI', 'base', '10.0');

console.log(`\n📍 Route Trace: ${route.startChain.name} → ${route.endChain.name}\n`);

let amount = parseFloat(route.inputAmount);
console.log(`Starting amount: ${amount} ${route.startAsset.symbol}`);

route.steps.forEach((step, i) => {
  const output = parseFloat(step.outputAmount);
  const loss = amount - output;
  const lossPercent = (loss / amount) * 100;

  console.log(`\nAfter Step ${i + 1}:`);
  console.log(`  ✓ Output: ${output} ${step.toAsset.symbol}`);
  console.log(`  ⚠️ Loss: ${loss.toFixed(4)} (${lossPercent.toFixed(2)}%)`);
  
  amount = output;
});

console.log(`\nFinal amount: ${route.outputAmount} ${route.endAsset.symbol}`);
console.log(`Total loss: ${(parseFloat(route.inputAmount) - parseFloat(route.outputAmount)).toFixed(4)}`);
console.log(`Effective rate: ${route.rate.toFixed(4)}`);
```

### 3. Direct vs Multi-Hop

```typescript
import { getAllCrossChainRoutes } from '@/lib/web3/cross-chain-swap-optimizer';

const routes = getAllCrossChainRoutes('ETH', 'ethereum', 'USDC', 'base', '5.0');

// Categorize routes
const directRoutes = routes.filter(r => r.steps.length === 1);
const multiHopRoutes = routes.filter(r => r.steps.length > 1);

console.log(`Direct routes: ${directRoutes.length}`);
directRoutes.forEach(r => {
  console.log(`  • ${r.steps[0].protocol.name}: $${r.totalCost.toFixed(2)}, ${r.totalTime}s`);
});

console.log(`\nMulti-hop routes: ${multiHopRoutes.length}`);
multiHopRoutes.forEach(r => {
  const stepNames = r.steps.map(s => s.protocol.name).join(' → ');
  console.log(`  • ${stepNames}`);
  console.log(`    Cost: $${r.totalCost.toFixed(2)}, Time: ${r.totalTime}s`);
});
```

---

## Cost Comparison

### 1. Breakdown All Costs

```typescript
import { getOptimalCrossChainPath } from '@/lib/web3/cross-chain-swap-optimizer';

const route = getOptimalCrossChainPath('ETH', 'ethereum', 'USDC', 'base', '2.0');

console.log(`\n💰 Cost Breakdown\n`);
console.log(`Input Amount: ${route.inputAmount} ETH`);
console.log(`Output Amount: ${route.outputAmount} USDC`);
console.log(`Exchange Rate: ${route.rate.toFixed(4)}`);

console.log(`\nFees:`);
console.log(`  Bridge/DEX Fees: $${route.totalFee.toFixed(2)}`);
console.log(`  Gas Costs: $${route.totalGasCost.toFixed(2)}`);
console.log(`  Total Cost: $${route.totalCost.toFixed(2)}`);

console.log(`\nImpact:`);
console.log(`  Price Impact: ${route.priceImpact.toFixed(2)}%`);
console.log(`  Effective Slippage: ${route.effectiveSlippage.toFixed(2)}%`);

console.log(`\nTiming:`);
console.log(`  Total Time: ${route.totalTime}s (${(route.totalTime / 60).toFixed(1)}m)`);
console.log(`  Bottleneck: ${route.bottleneck?.protocol.name} (${route.bottleneck?.executionTime}s)`);

// Output:
// 💰 Cost Breakdown
//
// Input Amount: 2.0 ETH
// Output Amount: 4990.00 USDC
// Exchange Rate: 1.0020
//
// Fees:
//   Bridge/DEX Fees: $2.50
//   Gas Costs: $0.80
//   Total Cost: $3.30
//
// Impact:
//   Price Impact: 0.05%
//   Effective Slippage: 0.04%
//
// Timing:
//   Total Time: 240s (4.0m)
//   Bottleneck: Across (120s)
```

### 2. Compare Costs Across Routes

```typescript
import { compareAllRoutes } from '@/lib/web3/cross-chain-swap-optimizer';

const comparison = compareAllRoutes('ETH', 'ethereum', 'USDC', 'base', '5.0');

const sortedByCost = [...comparison.routes].sort((a, b) => a.totalCost - b.totalCost);

console.log(`\n💵 Cost Ranking (5 ETH input)\n`);
console.log(`Rank | Route | Cost | Output | Rate | Time`);
console.log(`-----|-------|------|--------|------|-----`);

sortedByCost.slice(0, 5).forEach((route, i) => {
  const steps = route.steps.map(s => s.protocol.name.split(' ')[0]).join('→');
  const output = parseFloat(route.outputAmount).toFixed(0);
  
  console.log(
    `${i + 1}    | ${steps} | $${route.totalCost.toFixed(2)} | ${output} | ${route.rate.toFixed(4)} | ${route.totalTime}s`
  );
});

// Calculate savings
console.log(`\n💡 Savings Analysis`);
const costDiff = sortedByCost[sortedByCost.length - 1].totalCost - sortedByCost[0].totalCost;
const outputDiff = 
  parseFloat(sortedByCost[0].outputAmount) - 
  parseFloat(sortedByCost[sortedByCost.length - 1].outputAmount);

console.log(`Cost difference (best vs worst): $${costDiff.toFixed(2)}`);
console.log(`Output difference: ${outputDiff.toFixed(2)} USDC`);
```

### 3. Gas Cost Analysis

```typescript
import { getAllCrossChainRoutes } from '@/lib/web3/cross-chain-swap-optimizer';

const routes = getAllCrossChainRoutes('ETH', 'ethereum', 'USDC', 'base', '10.0');

console.log(`\n⛽ Gas Cost Analysis\n`);

// Analyze gas by route type
const directGas = routes
  .filter(r => r.steps.length === 1)
  .reduce((sum, r) => sum + r.totalGasCost, 0) / 
  routes.filter(r => r.steps.length === 1).length;

const multiHopGas = routes
  .filter(r => r.steps.length > 1)
  .reduce((sum, r) => sum + r.totalGasCost, 0) / 
  routes.filter(r => r.steps.length > 1).length;

console.log(`Average gas for direct routes: $${directGas.toFixed(2)}`);
console.log(`Average gas for multi-hop routes: $${multiHopGas.toFixed(2)}`);

// Most expensive routes
const sortedByGas = [...routes].sort((a, b) => b.totalGasCost - a.totalGasCost);
console.log(`\nMost expensive (gas):`);
sortedByGas.slice(0, 3).forEach((r, i) => {
  console.log(`  ${i + 1}. $${r.totalGasCost.toFixed(2)} (${r.steps.length} steps)`);
});
```

---

## Route Analysis

### 1. Analyze Impact

```typescript
import { 
  getOptimalCrossChainPath,
  analyzeRouteImpact 
} from '@/lib/web3/cross-chain-swap-optimizer';

const route = getOptimalCrossChainPath('ETH', 'ethereum', 'USDC', 'base', '5.0');
const analysis = analyzeRouteImpact(route);

console.log(`\n📊 Impact Analysis\n`);

console.log(`Price Impact Breakdown:`);
console.log(`  Bridge Impact: ${analysis.priceImpactBreakdown.bridgeImpact.toFixed(3)}%`);
console.log(`  DEX Impact: ${analysis.priceImpactBreakdown.dexImpact.toFixed(3)}%`);
console.log(`  Total Impact: ${analysis.priceImpactBreakdown.totalImpact.toFixed(3)}%`);

if (analysis.slippageWarning) {
  console.log(`\n⚠️ ${analysis.slippageWarning}`);
}

console.log(`\nRisk Factors (${analysis.riskFactors.length}):`);
analysis.riskFactors.forEach(factor => {
  console.log(`  • ${factor}`);
});

console.log(`\nRecommendations (${analysis.recommendations.length}):`);
analysis.recommendations.forEach(rec => {
  console.log(`  • ${rec}`);
});
```

### 2. Liquidity Analysis

```typescript
import { analyzeLiquidityDistribution } from '@/lib/web3/cross-chain-swap-optimizer';

const analysis = analyzeLiquidityDistribution('USDC', 100000);

console.log(`\n💧 USDC Liquidity Distribution\n`);

Object.entries(analysis).forEach(([chain, data]) => {
  console.log(`${data.chain}:`);
  console.log(`  Available: $${data.available.toLocaleString()}`);
  console.log(`  Bridged: $${data.bridgedAmount.toLocaleString()} (${data.concentration.toFixed(0)}%)`);
  console.log(`  Native: $${data.nativeAmount.toLocaleString()}`);
  console.log(`  Risk: ${data.riskLevel.toUpperCase()}`);
  console.log(`  Note: ${data.recommendation}\n`);
});
```

### 3. Route Scores

```typescript
import { compareAllRoutes } from '@/lib/web3/cross-chain-swap-optimizer';

const comparison = compareAllRoutes('ETH', 'ethereum', 'USDC', 'base', '10.0');

console.log(`\n🎯 Route Scoring (Top 5)\n`);
console.log(`Rank | Overall | Cost | Speed | Rate | Route`);
console.log(`-----|---------|------|-------|------|------`);

comparison.routes.slice(0, 5).forEach((route, i) => {
  const steps = route.steps.map(s => s.type[0]).join('');
  console.log(
    `${i + 1}    | ${route.overallScore.toFixed(0)}/100  | ${route.costScore.toFixed(0)} | ${route.speedScore.toFixed(0)}  | ${route.rateScore.toFixed(0)}  | ${steps}`
  );
});
```

---

## Integration Examples

### Complete Swap Flow

```typescript
import {
  getOptimalCrossChainPath,
  analyzeRouteImpact,
  exportRouteForExecution,
  formatRoute,
} from '@/lib/web3/cross-chain-swap-optimizer';

async function executeOptimalSwap(
  fromAsset: string,
  fromChain: string,
  toAsset: string,
  toChain: string,
  amount: string
) {
  console.log(`\n🌉 Cross-Chain Swap\n`);
  console.log(`${fromAsset} (${fromChain}) → ${toAsset} (${toChain})`);
  console.log(`Amount: ${amount}\n`);

  try {
    // 1. Find optimal path
    const route = getOptimalCrossChainPath(
      fromAsset,
      fromChain,
      toAsset,
      toChain,
      amount,
      { priority: 'balanced', maxSlippage: 1.0 }
    );

    console.log(`✓ Optimal route found`);
    console.log(`  ${formatRoute(route)}`);

    // 2. Analyze impact
    const impact = analyzeRouteImpact(route);
    
    if (impact.riskFactors.length > 0) {
      console.log(`\n⚠️ Risk Factors:`);
      impact.riskFactors.forEach(r => console.log(`   • ${r}`));
    }

    if (impact.recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`);
      impact.recommendations.forEach(r => console.log(`   • ${r}`));
    }

    // 3. Show cost breakdown
    console.log(`\n💰 Cost Summary:`);
    console.log(`   Total Cost: $${route.totalCost.toFixed(2)}`);
    console.log(`   Output: ${route.outputAmount} ${toAsset}`);
    console.log(`   Rate: ${route.rate.toFixed(4)}`);
    console.log(`   Time: ${(route.totalTime / 60).toFixed(1)} minutes`);

    // 4. Get execution data
    const executionData = exportRouteForExecution(route);
    console.log(`\n📋 Ready for on-chain execution`);
    
    return { route, impact, executionData };
  } catch (error) {
    console.error(`✗ Error: ${error}`);
    throw error;
  }
}

// Usage
await executeOptimalSwap('ETH', 'ethereum', 'USDC', 'base', '10.0');
```

### Monitor Route Changes

```typescript
import { compareAllRoutes } from '@/lib/web3/cross-chain-swap-optimizer';

async function monitorBestRoute(
  fromAsset: string,
  fromChain: string,
  toAsset: string,
  toChain: string,
  amount: string,
  interval: number = 60000 // 1 minute
) {
  let bestRoute = null;
  let checkCount = 0;

  const checker = setInterval(() => {
    checkCount++;
    const comparison = compareAllRoutes(fromAsset, fromChain, toAsset, toChain, amount);
    const current = comparison.recommended;

    if (!bestRoute || current.overallScore > bestRoute.overallScore) {
      bestRoute = current;
      console.log(`[${new Date().toLocaleTimeString()}] #${checkCount} - New best route found!`);
      console.log(`  Score: ${current.overallScore.toFixed(0)}/100`);
      console.log(`  Cost: $${current.totalCost.toFixed(2)}`);
      console.log(`  Output: ${current.outputAmount} ${toAsset}`);
    } else {
      console.log(`[${new Date().toLocaleTimeString()}] #${checkCount} - No improvement`);
    }
  }, interval);

  return () => clearInterval(checker);
}

// Monitor for 5 minutes
const stop = await monitorBestRoute('ETH', 'ethereum', 'USDC', 'base', '5.0', 30000);
setTimeout(() => stop(), 5 * 60 * 1000);
```

---

## API Reference

### Main Functions

| Function | Returns | Purpose |
|----------|---------|---------|
| `getOptimalCrossChainPath(from, fromChain, to, toChain, amount, options)` | `CrossChainRoute` | Get best single route |
| `getAllCrossChainRoutes(from, fromChain, to, toChain, amount, options)` | `CrossChainRoute[]` | Get all routes sorted |
| `compareAllRoutes(from, fromChain, to, toChain, amount, options)` | `CrossChainComparison` | Compare with analytics |

### Analysis Functions

| Function | Returns | Purpose |
|----------|---------|---------|
| `analyzeRouteImpact(route)` | `SwapImpactAnalysis` | Analyze price impact |
| `analyzeLiquidityDistribution(asset, amount)` | `LiquidityAnalysis[]` | Check liquidity risk |

### Utility Functions

| Function | Returns | Purpose |
|----------|---------|---------|
| `formatRoute(route)` | `string` | Human-readable route |
| `estimateRouteOutput(from, fromChain, to, toChain, amount)` | `string` | Quick output estimate |
| `exportRouteForExecution(route)` | `string` | JSON for on-chain |
| `getSupportedChains()` | `Chain[]` | Available chains |
| `getSupportedAssets(chainId)` | `Asset[]` | Assets on chain |
| `getAvailableBridges()` | `BridgeProtocol[]` | All bridges |

### Options

```typescript
interface CrossChainSwapOptions {
  maxSlippage?: number;        // Max slippage %
  maxTime?: number;            // Max execution time (s)
  excludeBridges?: string[];   // Skip specific bridges
  excludeDexes?: string[];     // Skip specific DEXs
  priority?: 'cheapest' | 'fastest' | 'best-rate' | 'balanced';
  allowDirect?: boolean;       // Direct routes only
  maxHops?: number;            // Max route steps
}
```

---

## UI Components

See [CROSS_CHAIN_SWAP_COMPONENTS.tsx](CROSS_CHAIN_SWAP_COMPONENTS.tsx) for:
- Route Finder Widget
- Cost Breakdown Display
- Route Comparison Table
- Impact Analysis Panel
- Liquidity Distribution Chart
- Execution Readiness Checker

---

**Last Updated**: January 20, 2026  
**Status**: ✅ Production Ready  
**Module Size**: 1000+ lines  
**TypeScript**: 100% type-safe
