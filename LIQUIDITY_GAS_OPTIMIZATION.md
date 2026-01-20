# ⛽ Gas Optimization Engine - Complete Guide

**Status**: ✅ Production Ready  
**Release Date**: January 20, 2026  
**Module**: `lib/web3/gas-optimization.ts`  

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Gas Price Tracking](#gas-price-tracking)
3. [Transaction Batching](#transaction-batching)
4. [Route Optimization](#route-optimization)
5. [Savings Calculations](#savings-calculations)
6. [Integration Examples](#integration-examples)
7. [Best Practices](#best-practices)
8. [API Reference](#api-reference)

---

## Overview

The Gas Optimization Engine provides:
- **Real-time gas price tracking** with historical data
- **Smart transaction batching** to reduce costs
- **Route optimization** for bridges and DEX swaps
- **Savings analysis** comparing direct vs optimized approaches
- **Portfolio analytics** for gas spending patterns
- **Alerts & notifications** for optimal transaction timing

### Key Features

✅ Current, average, and low gas price options  
✅ Batch transactions with automatic gas estimation  
✅ Find cheapest bridge + DEX combinations  
✅ Show savings vs direct approach  
✅ Historical gas price tracking  
✅ Portfolio gas analysis  
✅ Real-time alerts  
✅ Export reports  

---

## Gas Price Tracking

### 1. Get Current Gas Prices

```typescript
import { getCurrentGasPrice, formatGasPrice } from '@/lib/web3/gas-optimization';

const prices = getCurrentGasPrice();
console.log(`Low: ${formatGasPrice(prices.low)}`);
console.log(`Standard: ${formatGasPrice(prices.standard)}`);
console.log(`High: ${formatGasPrice(prices.high)}`);

// Output:
// Low: 18.45 Gwei
// Standard: 32.10 Gwei
// High: 48.75 Gwei
```

### 2. Get Price History

```typescript
import { getGasPriceHistory, getAverageGasPrice } from '@/lib/web3/gas-optimization';

// Last 24 hours
const history = getGasPriceHistory(24);
console.log(`${history.length} price points in last 24h`);

// Calculate average
const avg24h = getAverageGasPrice(24);
const avg7d = getAverageGasPrice(24 * 7);
console.log(`24h Average: ${avg24h.toFixed(2)} Gwei`);
console.log(`7d Average: ${avg7d.toFixed(2)} Gwei`);
```

### 3. Get Price Percentile

```typescript
import { getGasPricePercentile } from '@/lib/web3/gas-optimization';

const { percentile, rating } = getGasPricePercentile();
console.log(`Current price is at ${percentile}th percentile`);
console.log(`Rating: ${rating}`);

// Output:
// Current price is at 75th percentile
// Rating: expensive
```

### 4. Optimal Time to Transact

```typescript
import { getOptimalGasTime } from '@/lib/web3/gas-optimization';

const timing = getOptimalGasTime();

console.log(`Recommendation: ${timing.recommendation}`);
console.log(`Reason: ${timing.reason}`);
console.log(`Expected savings: ${timing.expectedGasSavings}%`);
console.log(`Timeframe: ${timing.timeframe}`);

// Output:
// Recommendation: wait
// Reason: Gas prices are above average - consider waiting
// Expected savings: 12%
// Timeframe: Next 4 hours
```

### 5. Gas Price Grade

```typescript
import { getGasPriceGrade } from '@/lib/web3/gas-optimization';

const { grade, color, recommendation } = getGasPriceGrade(35);

console.log(`Grade: ${grade}`);
console.log(`Recommendation: ${recommendation}`);
console.log(`Color for UI: ${color}`);

// Output:
// Grade: B
// Recommendation: Average - acceptable
// Color for UI: #eab308
```

---

## Transaction Batching

### 1. Add Transactions to Batch

```typescript
import { addToBatch, addMultipleToBatch, getPendingBatch } from '@/lib/web3/gas-optimization';

// Add single transaction
const txId = addToBatch({
  to: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
  data: '0x...', // Uniswap V3 swap calldata
  value: '0',
  gasLimit: 150000,
  type: 'swap',
  description: 'Swap ETH for USDC',
});

console.log(`Transaction added: ${txId}`);

// Add multiple transactions at once
const txIds = addMultipleToBatch([
  {
    to: '0x...',
    data: '0x...',
    value: '0',
    gasLimit: 45000,
    type: 'approve',
    description: 'Approve USDC spending',
  },
  {
    to: '0x...',
    data: '0x...',
    value: '0',
    gasLimit: 120000,
    type: 'swap',
    description: 'Swap USDC for DAI',
  },
  {
    to: '0x...',
    data: '0x...',
    value: '0',
    gasLimit: 90000,
    type: 'deposit',
    description: 'Deposit to aave',
  },
]);

console.log(`Added ${txIds.length} transactions`);

// View pending batch
const pending = getPendingBatch();
console.log(`Pending transactions: ${pending.length}`);
```

### 2. Estimate Batch Gas

```typescript
import { 
  estimateBatchGas, 
  calculateBatchSavings, 
  getPendingBatch 
} from '@/lib/web3/gas-optimization';

const pending = getPendingBatch();
const batchGasEstimate = estimateBatchGas(pending);

console.log(`Total gas for batch: ${batchGasEstimate} units`);

// Individual approach would be:
// approve: 45,000 + overhead
// swap: 120,000 + overhead
// deposit: 90,000 + overhead
// Total: ~261,000 + 21,000*3 overhead = 324,000

// Batched approach: ~261,000 + 21,000 overhead = 282,000
// Savings: ~42,000 gas units!
```

### 3. Calculate Batch Savings

```typescript
import { calculateBatchSavings } from '@/lib/web3/gas-optimization';

const savings = calculateBatchSavings();

console.log(`Direct approach cost: ${savings.directApproachCost} Wei`);
console.log(`Optimized batch cost: ${savings.optimizedRouteCost} Wei`);
console.log(`Savings: ${savings.savingsUSD}`);
console.log(`Savings %: ${savings.savingsPercent}%`);
console.log(`Recommendation: ${savings.recommendation}`);

// Output:
// Direct approach cost: 11340000000000 Wei
// Optimized batch cost: 9870000000000 Wei
// Savings: $0.05
// Savings %: 13.0%
// Recommendation: ✅ Strong candidate for batching
```

### 4. Submit Batch

```typescript
import { submitBatch, getCompletedBatches } from '@/lib/web3/gas-optimization';

const batch = submitBatch();

console.log(`Batch ID: ${batch.id}`);
console.log(`Status: ${batch.status}`);
console.log(`Total gas: ${batch.totalGasEstimate}`);
console.log(`Explorer: ${batch.explorerUrl}`);

// Get completed batches
const recent = getCompletedBatches(5);
console.log(`Recent batches: ${recent.length}`);

recent.forEach(b => {
  console.log(`- ${b.id}: ${b.transactions.length} txs, ${b.status}`);
});
```

---

## Route Optimization

### 1. Find Optimal Bridge

```typescript
import { findOptimalBridge } from '@/lib/web3/gas-optimization';

// Find cheapest bridge from Ethereum to Base
const cheapestBridge = findOptimalBridge(1000, 'ethereum', 'base', 'cheapest');

console.log(`Protocol: ${cheapestBridge.protocol}`);
console.log(`Input: ${cheapestBridge.inputAmount}`);
console.log(`Output: ${cheapestBridge.outputAmount}`);
console.log(`Gas: ${cheapestBridge.estimatedGas}`);
console.log(`Time: ${cheapestBridge.estimatedTime}s`);

// Output:
// Protocol: Socket
// Input: 1000
// Output: 995
// Gas: 100000
// Time: 60s

// Fastest bridge
const fastestBridge = findOptimalBridge(1000, 'ethereum', 'base', 'fastest');
console.log(`Fastest: ${fastestBridge.protocol} (${fastestBridge.estimatedTime}s)`);

// Balanced approach
const balancedBridge = findOptimalBridge(1000, 'ethereum', 'base', 'balanced');
console.log(`Balanced: ${balancedBridge.protocol}`);
```

### 2. Find Optimal DEX

```typescript
import { findOptimalDEX } from '@/lib/web3/gas-optimization';

// Find cheapest DEX for swap
const cheapestDex = findOptimalDEX(100, 'ETH', 'USDC', 'cheapest');

console.log(`DEX: ${cheapestDex.protocol}`);
console.log(`Input: ${cheapestDex.inputAmount} ${cheapestDex.inputToken}`);
console.log(`Output: ${cheapestDex.outputAmount} ${cheapestDex.outputToken}`);
console.log(`Gas: ${cheapestDex.estimatedGas}`);

// Output:
// DEX: Aerodrome
// Input: 100 ETH
// Output: 99.96 USDC
// Gas: 85000
```

### 3. Optimize Complex Routes

```typescript
import { optimizeRoute, compareRoutes } from '@/lib/web3/gas-optimization';

// Single optimized route
const route = optimizeRoute(
  1000,           // amount
  'USDC',         // input token
  'DAI',          // output token
  'ethereum',     // from chain
  'base',         // to chain
  'balanced'      // priority
);

console.log(`Route ID: ${route.id}`);
console.log(`Total cost: ${route.totalCost} Wei`);
console.log(`Savings vs direct: ${route.savingsUSD}`);
console.log(`Savings %: ${route.savingsPercent}%`);
console.log(`Execution time: ${route.executionTime}s`);

console.log(`\nGas Breakdown:`);
console.log(`- Bridge: ${route.gasBreakdown.bridgeCost}`);
console.log(`- DEX: ${route.gasBreakdown.dexCost}`);
console.log(`- Approval: ${route.gasBreakdown.approveCost}`);
console.log(`- Total: ${route.gasBreakdown.total}`);

// Compare all route priorities
const allRoutes = compareRoutes(1000, 'USDC', 'DAI', 'ethereum', 'base');

allRoutes.forEach(r => {
  console.log(`${r.steps[0]?.protocol}: $${r.totalCost.toFixed(2)}, ${r.savingsPercent}% savings`);
});

// Output:
// Across: $0.38, 22% savings
// Hop: $0.45, 18% savings
// Stargate: $0.52, 12% savings
```

---

## Savings Calculations

### 1. Estimate Transaction Gas

```typescript
import { estimateTransactionGas } from '@/lib/web3/gas-optimization';

// Simple approval
const approveGas = estimateTransactionGas('approve', 'simple');
console.log(`Simple approve: ${approveGas}`);

// Complex swap
const swapGas = estimateTransactionGas('swap', 'complex');
console.log(`Complex swap: ${swapGas}`);

// Output:
// Simple approve: 36000
// Complex swap: 144000
```

### 2. Calculate Gas Cost in USD

```typescript
import { calculateGasCostUSD } from '@/lib/web3/gas-optimization';

const gasUnits = 150000;
const ethPrice = 2500;

const usdCost = calculateGasCostUSD(gasUnits, ethPrice);
console.log(`Gas cost in USD: $${usdCost}`);

// With different gas prices
const costLow = calculateGasCostUSD(gasUnits, 2500);   // $1.23
const costHigh = calculateGasCostUSD(gasUnits, 2500);  // $1.97

console.log(`Low gas: $${costLow}`);
console.log(`High gas: $${costHigh}`);
```

### 3. Portfolio Gas Analysis

```typescript
import { getPortfolioGasAnalysis } from '@/lib/web3/gas-optimization';

const analysis = getPortfolioGasAnalysis();

console.log(`Total spent (30d): ${analysis.totalGasSpent30d}`);
console.log(`Average per tx: ${analysis.averageGasPerTx}`);
console.log(`Most expensive: ${analysis.mostExpensiveOperation.type} - ${analysis.mostExpensiveOperation.cost}`);
console.log(`\nOptimization opportunities:`);
analysis.optimizationOpportunities.forEach(opp => {
  console.log(`- ${opp}`);
});
console.log(`\nEstimated monthly savings: ${analysis.estimatedMonthlyOptimization}`);

// Output:
// Total spent (30d): $124.50
// Average per tx: $0.85
// Most expensive: swap - $3.20
// 
// Optimization opportunities:
// - Batch more transactions together (saving ~15-25%)
// - Monitor gas prices and transact during low periods
// - Use optimal bridges to reduce route complexity
// - Consider staggering large operations
// 
// Estimated monthly savings: $31.13
```

### 4. Gas Spending Trend

```typescript
import { getGasSpendingTrend } from '@/lib/web3/gas-optimization';

const trend = getGasSpendingTrend(30);

trend.forEach(day => {
  console.log(`${day.date}: $${day.spent.toFixed(2)} (${day.txCount} txs, ${day.avgGasPrice.toFixed(2)} Gwei avg)`);
});

// Output:
// 2025-12-21: $3.45 (4 txs, 28.50 Gwei avg)
// 2025-12-22: $2.10 (2 txs, 25.00 Gwei avg)
// 2025-12-23: $5.80 (8 txs, 35.20 Gwei avg)
// ... 27 more days
```

---

## Integration Examples

### Complete Gas Optimization Workflow

```typescript
import {
  getCurrentGasPrice,
  getOptimalGasTime,
  addMultipleToBatch,
  calculateBatchSavings,
  getGasPriceGrade,
  optimizeRoute,
  submitBatch,
  formatGasPrice,
} from '@/lib/web3/gas-optimization';

// 1. Check current gas situation
const prices = getCurrentGasPrice();
const timing = getOptimalGasTime();
const grade = getGasPriceGrade(prices.current);

console.log(`Current: ${formatGasPrice(prices.current)} (Grade: ${grade.grade})`);
console.log(`Recommendation: ${grade.recommendation}`);
console.log(`Best time: ${timing.recommendation} - ${timing.reason}`);

// 2. Plan complex operation (bridge + swap)
const route = optimizeRoute(
  1000,
  'USDC',
  'DAI',
  'ethereum',
  'base',
  'balanced'
);

console.log(`\nOptimal route found:`);
console.log(`Steps: ${route.steps.length}`);
console.log(`Total cost: $${(route.totalCost * 0.000001 * 2500).toFixed(2)}`);
console.log(`Savings vs direct: ${route.savingsPercent}%`);

// 3. Batch transactions
const batchTxIds = addMultipleToBatch([
  {
    to: '0x...',
    data: '0x...',
    value: '0',
    gasLimit: 45000,
    type: 'approve',
    description: 'Approve for bridge',
  },
  {
    to: '0x...',
    data: '0x...',
    value: '0',
    gasLimit: 100000,
    type: 'bridge',
    description: 'Bridge USDC to Base',
  },
  {
    to: '0x...',
    data: '0x...',
    value: '0',
    gasLimit: 85000,
    type: 'swap',
    description: 'Swap USDC to DAI',
  },
]);

// 4. Calculate batch savings
const savings = calculateBatchSavings();
console.log(`\nBatch savings:`);
console.log(`Individual cost: $${(savings.directApproachCost * 0.000001 * 2500).toFixed(2)}`);
console.log(`Batch cost: $${(savings.optimizedRouteCost * 0.000001 * 2500).toFixed(2)}`);
console.log(`Total savings: ${savings.savingsPercent}%`);

// 5. Submit when ready
const batch = submitBatch();
console.log(`\nBatch submitted: ${batch.id}`);
console.log(`Explorer: ${batch.explorerUrl}`);
```

---

## Best Practices

### 1. Gas Timing Strategy

```typescript
// Monitor gas prices before transacting
const { recommendation, timeframe } = getOptimalGasTime();

if (recommendation === 'now') {
  // Transact immediately
} else if (recommendation === 'wait') {
  // Set up notification for next 4 hours
  setTimeout(() => checkGasAgain(), 1000 * 60 * 30); // Check in 30 min
}
```

### 2. Batch Non-Urgent Transactions

```typescript
// Group related operations for batching
const operations = [
  { type: 'approve', token: 'USDC' },
  { type: 'swap', from: 'USDC', to: 'ETH' },
  { type: 'stake', token: 'ETH' },
];

// Batch them together
operations.forEach(op => addToBatch({
  to: getOperationAddress(op),
  data: encodeOperation(op),
  value: '0',
  gasLimit: estimateTransactionGas(op.type),
  type: op.type,
  description: `${op.type} operation`,
}));

// Submit when conditions are favorable
if (percentile < 30) {
  submitBatch();
}
```

### 3. Choose Optimal Routes

```typescript
// Compare all route options
const routes = compareRoutes(amount, inputToken, outputToken, from, to);

// Pick based on user priority
const selected = userPreference === 'speed'
  ? routes.find(r => r.executionTime === Math.min(...routes.map(r => r.executionTime)))
  : routes.find(r => r.totalCost === Math.min(...routes.map(r => r.totalCost)));

console.log(`Selected route: ${selected.steps[0].protocol}`);
```

### 4. Monitor Portfolio

```typescript
// Periodic portfolio analysis
setInterval(() => {
  const analysis = getPortfolioGasAnalysis();
  
  // Alert if spending exceeds threshold
  if (parseFloat(analysis.totalGasSpent30d) > 100) {
    notifyUser(`High gas spending: ${analysis.totalGasSpent30d}`);
  }
  
  // Suggest optimizations
  if (analysis.optimizationOpportunities.length > 0) {
    showOptimizationTip(analysis.optimizationOpportunities[0]);
  }
}, 24 * 60 * 60 * 1000); // Daily check
```

### 5. Handle Gas Alerts

```typescript
import { getGasAlerts } from '@/lib/web3/gas-optimization';

// Check for alerts regularly
setInterval(() => {
  const alerts = getGasAlerts();
  
  alerts.forEach(alert => {
    if (alert.severity === 'high') {
      showNotification(alert.message, {
        actionUrl: alert.actionUrl,
        autoClose: false, // Require user action
      });
    } else if (alert.severity === 'medium') {
      showNotification(alert.message, {
        autoClose: 10000,
      });
    }
  });
}, 5 * 60 * 1000); // Check every 5 minutes
```

---

## API Reference

### Gas Tracking Functions

| Function | Returns | Purpose |
|----------|---------|---------|
| `getCurrentGasPrice()` | `GasPrice` | Get current gas prices |
| `getGasPriceHistory(hours)` | `GasPrice[]` | Get historical prices |
| `getAverageGasPrice(hours)` | `number` | Calculate average price |
| `getGasPricePercentile()` | `{percentile, rating}` | Compare to recent prices |
| `getOptimalGasTime()` | `{recommendation, reason, savings, timeframe}` | When to transact |
| `getGasPriceGrade(price)` | `{grade, color, recommendation}` | Grade current price |
| `formatGasPrice(gwei)` | `string` | Format for display |

### Batch Transaction Functions

| Function | Returns | Purpose |
|----------|---------|---------|
| `addToBatch(tx)` | `string` | Add single transaction |
| `addMultipleToBatch(txs)` | `string[]` | Add multiple transactions |
| `getPendingBatch()` | `Transaction[]` | Get queue |
| `estimateBatchGas(txs)` | `number` | Estimate total gas |
| `calculateBatchSavings(txs)` | `SavingsReport` | Calculate savings |
| `submitBatch()` | `BatchedTransaction` | Submit batch |
| `getCompletedBatches(limit)` | `BatchedTransaction[]` | Get history |
| `clearBatch()` | `void` | Clear queue |

### Route Optimization Functions

| Function | Returns | Purpose |
|----------|---------|---------|
| `findOptimalBridge(amount, from, to, priority)` | `RouteStep` | Best bridge |
| `findOptimalDEX(amount, inputToken, outputToken, priority)` | `RouteStep` | Best DEX |
| `optimizeRoute(...)` | `Route` | Complete optimized route |
| `compareRoutes(...)` | `Route[]` | Compare 3 route options |

### Analytics Functions

| Function | Returns | Purpose |
|----------|---------|---------|
| `estimateTransactionGas(type, complexity)` | `number` | Estimate gas units |
| `calculateGasCostUSD(gasUnits, ethPrice)` | `string` | USD cost |
| `getPortfolioGasAnalysis(ethPrice)` | `PortfolioGasAnalysis` | 30-day analysis |
| `getGasSpendingTrend(days)` | `Trend[]` | Daily spending trend |
| `getGasAlerts()` | `GasAlert[]` | Current alerts |
| `exportGasReport()` | `string` | JSON export |

---

## UI Component Library

See [GAS_OPTIMIZATION_COMPONENTS.tsx](GAS_OPTIMIZATION_COMPONENTS.tsx) for:
- Gas Price Tracker Widget
- Batch Manager Interface
- Route Optimizer Display
- Savings Calculator
- Portfolio Dashboard
- Alert Notification System

---

**Last Updated**: January 20, 2026  
**Status**: ✅ Production Ready  
**Module Size**: 850+ lines  
**TypeScript**: 100% type-safe
