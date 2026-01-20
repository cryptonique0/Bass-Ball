/**
 * Gas Optimization Engine
 * Tracks gas prices, batches transactions, optimizes routing, and calculates savings
 * 
 * Features:
 * - Real-time gas price tracking (low, standard, high)
 * - Batch transaction management
 * - Route optimization for bridges & DEX combos
 * - Savings estimates vs direct approach
 */

import { formatGwei, parseGwei } from 'viem';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface GasPrice {
  low: number;
  standard: number;
  high: number;
  current: number; // Real-time gas price
  timestamp: number;
  network: string;
}

export interface Transaction {
  id: string;
  to: string;
  data: string;
  value: string;
  gasLimit: number;
  type: 'swap' | 'bridge' | 'approve' | 'deposit' | 'withdraw' | 'claim';
  description: string;
  estimatedGas?: number;
}

export interface BatchedTransaction {
  id: string;
  transactions: Transaction[];
  totalGasEstimate: number;
  timestamp: number;
  status: 'pending' | 'submitted' | 'confirmed' | 'failed';
  explorerUrl?: string;
}

export interface Route {
  id: string;
  steps: RouteStep[];
  totalCost: number;
  savings: number;
  savingsPercent: number;
  executionTime: number; // milliseconds
  gasBreakdown: GasBreakdown;
}

export interface RouteStep {
  type: 'bridge' | 'dex' | 'swap';
  protocol: string;
  inputToken: string;
  outputToken: string;
  inputAmount: string;
  outputAmount: string;
  estimatedGas: number;
  estimatedTime: number;
}

export interface GasBreakdown {
  bridgeCost: number;
  dexCost: number;
  approveCost: number;
  total: number;
}

export interface GasEstimate {
  action: string;
  gasUnits: number;
  gasCostWei: string;
  gasCostUSD: string;
  gasPrice: number;
  timestamp: number;
  network: string;
}

export interface SavingsReport {
  directApproachCost: number;
  optimizedRouteCost: number;
  savingsWei: string;
  savingsUSD: string;
  savingsPercent: number;
  recommendation: string;
  breakEvenPoint?: number;
}

export interface GasTrackingState {
  currentPrice: GasPrice;
  priceHistory: GasPrice[];
  batchQueue: Transaction[];
  completedBatches: BatchedTransaction[];
  lastUpdate: number;
}

export interface PortfolioGasAnalysis {
  totalGasSpent30d: string;
  averageGasPerTx: string;
  mostExpensiveOperation: {
    type: string;
    cost: string;
    date: number;
  };
  optimizationOpportunities: string[];
  estimatedMonthlyOptimization: string;
}

// ============================================================================
// GAS PRICE TRACKING
// ============================================================================

// Simulated real-time gas prices (in Gwei)
let gasStateCache: GasTrackingState = {
  currentPrice: {
    low: 20,
    standard: 35,
    high: 50,
    current: 35,
    timestamp: Date.now(),
    network: 'Base',
  },
  priceHistory: [],
  batchQueue: [],
  completedBatches: [],
  lastUpdate: Date.now(),
};

/**
 * Get current gas prices on Base Chain
 */
export const getCurrentGasPrice = (): GasPrice => {
  // Simulate realistic gas fluctuation
  const randomVariation = (basePrice: number) => {
    const variation = basePrice * (Math.random() * 0.1 - 0.05);
    return Math.round((basePrice + variation) * 100) / 100;
  };

  const priceData: GasPrice = {
    low: randomVariation(20),
    standard: randomVariation(35),
    high: randomVariation(50),
    current: randomVariation(35),
    timestamp: Date.now(),
    network: 'Base',
  };

  gasStateCache.currentPrice = priceData;
  gasStateCache.priceHistory.push(priceData);
  
  // Keep only last 1000 price points
  if (gasStateCache.priceHistory.length > 1000) {
    gasStateCache.priceHistory.shift();
  }

  return priceData;
};

/**
 * Get historical gas prices
 */
export const getGasPriceHistory = (hours: number = 24): GasPrice[] => {
  const now = Date.now();
  const cutoff = now - hours * 60 * 60 * 1000;
  return gasStateCache.priceHistory.filter(p => p.timestamp >= cutoff);
};

/**
 * Calculate average gas price over time period
 */
export const getAverageGasPrice = (hours: number = 24): number => {
  const history = getGasPriceHistory(hours);
  if (history.length === 0) return gasStateCache.currentPrice.standard;
  
  const sum = history.reduce((acc, p) => acc + p.current, 0);
  return Math.round((sum / history.length) * 100) / 100;
};

/**
 * Get gas price percentile (expensive/cheap relative to recent history)
 */
export const getGasPricePercentile = (): {
  percentile: number;
  rating: 'very_cheap' | 'cheap' | 'average' | 'expensive' | 'very_expensive';
} => {
  const history = getGasPriceHistory(24);
  if (history.length < 10) {
    return { percentile: 50, rating: 'average' };
  }

  const sorted = history
    .map(p => p.current)
    .sort((a, b) => a - b);
  
  const current = gasStateCache.currentPrice.current;
  const percentile = Math.round(
    (sorted.filter(p => p <= current).length / sorted.length) * 100
  );

  let rating: 'very_cheap' | 'cheap' | 'average' | 'expensive' | 'very_expensive';
  if (percentile < 20) rating = 'very_cheap';
  else if (percentile < 40) rating = 'cheap';
  else if (percentile < 60) rating = 'average';
  else if (percentile < 80) rating = 'expensive';
  else rating = 'very_expensive';

  return { percentile, rating };
};

/**
 * Recommend optimal time to transact based on gas prices
 */
export const getOptimalGasTime = (): {
  recommendation: 'now' | 'soon' | 'wait' | 'urgent';
  reason: string;
  expectedGasSavings: number;
  timeframe: string;
} => {
  const { percentile, rating } = getGasPricePercentile();
  const average = getAverageGasPrice(24);
  const current = gasStateCache.currentPrice.current;
  
  if (percentile < 30) {
    return {
      recommendation: 'now',
      reason: 'Gas prices are in the bottom 30% - excellent time to transact',
      expectedGasSavings: Math.round(((average - current) / average) * 100),
      timeframe: 'Next 15 minutes',
    };
  } else if (percentile < 50) {
    return {
      recommendation: 'soon',
      reason: 'Gas prices are below average',
      expectedGasSavings: Math.round(((average - current) / average) * 100),
      timeframe: 'Next 2 hours',
    };
  } else if (percentile < 70) {
    return {
      recommendation: 'wait',
      reason: 'Gas prices are above average - consider waiting',
      expectedGasSavings: Math.round(((average - current) / average) * 100) * -1,
      timeframe: 'Next 4 hours',
    };
  } else {
    return {
      recommendation: 'urgent',
      reason: 'Gas prices are very high - wait unless transaction is critical',
      expectedGasSavings: Math.round(((average - current) / average) * 100) * -1,
      timeframe: 'Next 8 hours',
    };
  }
};

// ============================================================================
// TRANSACTION BATCHING
// ============================================================================

/**
 * Add transaction to batch queue
 */
export const addToBatch = (tx: Transaction): string => {
  const txId = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const newTx: Transaction = {
    ...tx,
    id: txId,
  };

  gasStateCache.batchQueue.push(newTx);
  return txId;
};

/**
 * Add multiple transactions at once
 */
export const addMultipleToBatch = (txs: Omit<Transaction, 'id'>[]): string[] => {
  return txs.map(tx => {
    const withId: Transaction = {
      ...tx,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    return addToBatch(withId);
  }).slice(0, txs.length);
};

/**
 * Get pending batch transactions
 */
export const getPendingBatch = (): Transaction[] => {
  return [...gasStateCache.batchQueue];
};

/**
 * Estimate gas for batch of transactions
 */
export const estimateBatchGas = (txs: Transaction[] = gasStateCache.batchQueue): number => {
  // Base overhead for batch
  let total = 21000;

  txs.forEach(tx => {
    if (tx.estimatedGas) {
      total += tx.estimatedGas;
    } else {
      // Estimate based on type
      const baseGas: Record<string, number> = {
        approve: 45000,
        swap: 120000,
        bridge: 200000,
        deposit: 90000,
        withdraw: 90000,
        claim: 60000,
      };
      total += baseGas[tx.type] || 100000;
    }
  });

  return total;
};

/**
 * Calculate savings from batching vs individual transactions
 */
export const calculateBatchSavings = (
  txs: Transaction[] = gasStateCache.batchQueue
): SavingsReport => {
  const gasPrice = gasStateCache.currentPrice.current;
  
  // Individual transaction approach
  const individualGas = txs.reduce((sum, tx) => {
    const baseGas: Record<string, number> = {
      approve: 45000,
      swap: 120000,
      bridge: 200000,
      deposit: 90000,
      withdraw: 90000,
      claim: 60000,
    };
    return sum + (tx.estimatedGas || baseGas[tx.type] || 100000) + 21000;
  }, 0);

  // Batched approach
  const batchedGas = estimateBatchGas(txs);

  const directCost = individualGas * gasPrice;
  const optimizedCost = batchedGas * gasPrice;
  const savings = directCost - optimizedCost;
  const savingsPercent = (savings / directCost) * 100;

  return {
    directApproachCost: directCost,
    optimizedRouteCost: optimizedCost,
    savingsWei: savings.toString(),
    savingsUSD: (savings * 0.000001).toFixed(2), // Approximate at $1 per Gwei
    savingsPercent: Math.round(savingsPercent * 100) / 100,
    recommendation: savingsPercent > 15
      ? '✅ Strong candidate for batching'
      : savingsPercent > 5
      ? '⚠️ Moderate savings from batching'
      : '❌ Minimal savings - consider individual transactions',
    breakEvenPoint: savingsPercent > 0 ? txs.length : undefined,
  };
};

/**
 * Submit batched transactions
 */
export const submitBatch = (): BatchedTransaction => {
  const batch: BatchedTransaction = {
    id: `batch-${Date.now()}`,
    transactions: [...gasStateCache.batchQueue],
    totalGasEstimate: estimateBatchGas(),
    timestamp: Date.now(),
    status: 'submitted',
    explorerUrl: `https://basescan.io/tx/0x${Math.random().toString(16).substr(2)}`,
  };

  gasStateCache.completedBatches.push(batch);
  gasStateCache.batchQueue = [];

  return batch;
};

/**
 * Get completed batches
 */
export const getCompletedBatches = (limit: number = 10): BatchedTransaction[] => {
  return gasStateCache.completedBatches.slice(-limit).reverse();
};

/**
 * Clear pending batch
 */
export const clearBatch = (): void => {
  gasStateCache.batchQueue = [];
};

// ============================================================================
// ROUTE OPTIMIZATION
// ============================================================================

// Sample bridge routes
const BRIDGE_ROUTES = [
  {
    name: 'Stargate',
    gas: 180000,
    speed: 5,
    cost: 25, // Gwei
    liquidity: 500000000,
  },
  {
    name: 'Hop Protocol',
    gas: 140000,
    speed: 3,
    cost: 18,
    liquidity: 300000000,
  },
  {
    name: 'Across',
    gas: 120000,
    speed: 2,
    cost: 15,
    liquidity: 400000000,
  },
  {
    name: 'Socket',
    gas: 100000,
    speed: 1,
    cost: 12,
    liquidity: 200000000,
  },
];

// Sample DEX routes
const DEX_ROUTES = [
  {
    name: 'Uniswap V3',
    gas: 100000,
    liquidity: 1000000000,
    fee: 0.05,
  },
  {
    name: 'Aerodrome',
    gas: 85000,
    liquidity: 500000000,
    fee: 0.04,
  },
  {
    name: 'Curve',
    gas: 95000,
    liquidity: 300000000,
    fee: 0.03,
  },
  {
    name: 'BaseSwap',
    gas: 90000,
    liquidity: 200000000,
    fee: 0.05,
  },
];

/**
 * Find optimal bridge for token transfer
 */
export const findOptimalBridge = (
  amount: number,
  fromChain: string,
  toChain: string,
  priority: 'cheapest' | 'fastest' | 'balanced' = 'balanced'
): RouteStep => {
  let selectedBridge = BRIDGE_ROUTES[0];

  if (priority === 'cheapest') {
    selectedBridge = BRIDGE_ROUTES.reduce((best, route) =>
      route.cost < best.cost ? route : best
    );
  } else if (priority === 'fastest') {
    selectedBridge = BRIDGE_ROUTES.reduce((best, route) =>
      route.speed < best.speed ? route : best
    );
  } else {
    // Balanced: consider both cost and speed
    const scores = BRIDGE_ROUTES.map(route => ({
      route,
      score: (route.cost * 0.6) + (route.speed * 20 * 0.4),
    }));
    selectedBridge = scores.reduce((best, current) =>
      current.score < best.score ? current.route : best.route
    );
  }

  return {
    type: 'bridge',
    protocol: selectedBridge.name,
    inputToken: 'USDC',
    outputToken: 'USDC',
    inputAmount: amount.toString(),
    outputAmount: (amount * 0.995).toString(), // Account for fee
    estimatedGas: selectedBridge.gas,
    estimatedTime: selectedBridge.speed * 60, // Convert to seconds
  };
};

/**
 * Find optimal DEX for swap
 */
export const findOptimalDEX = (
  inputAmount: number,
  inputToken: string,
  outputToken: string,
  priority: 'cheapest' | 'fastest' | 'balanced' = 'balanced'
): RouteStep => {
  let selectedDex = DEX_ROUTES[0];

  if (priority === 'cheapest') {
    selectedDex = DEX_ROUTES.reduce((best, route) =>
      (route.gas * gasStateCache.currentPrice.current) < 
      (best.gas * gasStateCache.currentPrice.current) 
        ? route : best
    );
  } else if (priority === 'fastest') {
    selectedDex = DEX_ROUTES.reduce((best, route) =>
      route.gas < best.gas ? route : best
    );
  } else {
    // Balanced
    const scores = DEX_ROUTES.map(route => ({
      route,
      score: (route.gas * 0.5) + (route.fee * 1000 * 0.5),
    }));
    selectedDex = scores.reduce((best, current) =>
      current.score < best.score ? current.route : best.route
    );
  }

  return {
    type: 'swap',
    protocol: selectedDex.name,
    inputToken,
    outputToken,
    inputAmount: inputAmount.toString(),
    outputAmount: (inputAmount * (1 - selectedDex.fee / 100)).toString(),
    estimatedGas: selectedDex.gas,
    estimatedTime: 30,
  };
};

/**
 * Optimize complex route (bridge + swap)
 */
export const optimizeRoute = (
  inputAmount: number,
  inputToken: string,
  outputToken: string,
  fromChain: string,
  toChain: string,
  priority: 'cheapest' | 'fastest' | 'balanced' = 'balanced'
): Route => {
  const steps: RouteStep[] = [];
  let totalGas = 0;

  // Add bridge step if needed
  if (fromChain !== toChain) {
    const bridgeStep = findOptimalBridge(inputAmount, fromChain, toChain, priority);
    steps.push(bridgeStep);
    totalGas += bridgeStep.estimatedGas;
  }

  // Add swap step if needed
  if (inputToken !== outputToken) {
    const swapAmount = steps.length > 0 ? Number(steps[steps.length - 1].outputAmount) : inputAmount;
    const swapStep = findOptimalDEX(swapAmount, inputToken, outputToken, priority);
    steps.push(swapStep);
    totalGas += swapStep.estimatedGas;
  }

  // Add approval step for input token if needed
  if (steps.length > 0) {
    totalGas += 45000; // Typical approval gas
  }

  const currentGasPrice = gasStateCache.currentPrice.current;
  const totalCost = totalGas * currentGasPrice;

  // Calculate vs direct approach (direct swap without bridge)
  const directSwapGas = 120000 + 45000; // Swap + approval
  const directCost = directSwapGas * currentGasPrice;

  const savings = directCost - totalCost;
  const savingsPercent = (savings / directCost) * 100;

  return {
    id: `route-${Date.now()}`,
    steps,
    totalCost,
    savings,
    savingsPercent: Math.round(savingsPercent * 100) / 100,
    executionTime: steps.reduce((sum, s) => sum + s.estimatedTime, 0),
    gasBreakdown: {
      bridgeCost: steps.find(s => s.type === 'bridge')?.estimatedGas ?? 0,
      dexCost: steps.find(s => s.type === 'swap')?.estimatedGas ?? 0,
      approveCost: 45000,
      total: totalGas,
    },
  };
};

/**
 * Compare multiple routes
 */
export const compareRoutes = (
  inputAmount: number,
  inputToken: string,
  outputToken: string,
  fromChain: string,
  toChain: string
): Route[] => {
  return [
    optimizeRoute(inputAmount, inputToken, outputToken, fromChain, toChain, 'cheapest'),
    optimizeRoute(inputAmount, inputToken, outputToken, fromChain, toChain, 'fastest'),
    optimizeRoute(inputAmount, inputToken, outputToken, fromChain, toChain, 'balanced'),
  ];
};

// ============================================================================
// GAS ESTIMATION & ANALYTICS
// ============================================================================

/**
 * Estimate gas for specific transaction type
 */
export const estimateTransactionGas = (
  type: 'approve' | 'swap' | 'bridge' | 'deposit' | 'withdraw' | 'claim',
  complexity: 'simple' | 'medium' | 'complex' = 'medium'
): number => {
  const baseGas: Record<string, number> = {
    approve: 45000,
    swap: 120000,
    bridge: 180000,
    deposit: 90000,
    withdraw: 90000,
    claim: 60000,
  };

  const multiplier = complexity === 'simple' ? 0.8 : complexity === 'complex' ? 1.2 : 1;
  return Math.round(baseGas[type] * multiplier);
};

/**
 * Calculate gas cost in USD
 */
export const calculateGasCostUSD = (
  gasUnits: number,
  ethPrice: number = 2500 // USD
): string => {
  const gasPrice = gasStateCache.currentPrice.current;
  const gasCostWei = gasUnits * gasPrice * 1e9; // Convert Gwei to Wei
  const gasCostETH = gasCostWei / 1e18;
  const gasCostUSD = gasCostETH * ethPrice;
  
  return gasCostUSD.toFixed(2);
};

/**
 * Get portfolio gas analysis
 */
export const getPortfolioGasAnalysis = (
  ethPrice: number = 2500
): PortfolioGasAnalysis => {
  const allBatches = gasStateCache.completedBatches;
  
  if (allBatches.length === 0) {
    return {
      totalGasSpent30d: '$0.00',
      averageGasPerTx: '$0.00',
      mostExpensiveOperation: {
        type: 'N/A',
        cost: '$0.00',
        date: 0,
      },
      optimizationOpportunities: [
        'Start batching transactions to save on gas',
        'Monitor gas prices before transacting',
        'Use bridges when more economical',
      ],
      estimatedMonthlyOptimization: '$0.00',
    };
  }

  const batchesInLast30Days = allBatches.filter(
    b => Date.now() - b.timestamp < 30 * 24 * 60 * 60 * 1000
  );

  const totalGasUnits = batchesInLast30Days.reduce(
    (sum, b) => sum + b.totalGasEstimate, 
    0
  );
  const avgGasPrice = getAverageGasPrice(30 * 24);
  const totalCost = totalGasUnits * avgGasPrice * 1e9 / 1e18 * ethPrice;
  const avgCostPerTx = totalCost / Math.max(batchesInLast30Days.reduce(
    (sum, b) => sum + b.transactions.length,
    0
  ), 1);

  const mostExpensive = batchesInLast30Days.reduce((max, b) => {
    const cost = b.totalGasEstimate * avgGasPrice * 1e9 / 1e18 * ethPrice;
    const maxCost = max.totalGasEstimate * avgGasPrice * 1e9 / 1e18 * ethPrice;
    return cost > maxCost ? b : max;
  });

  const estimatedSavings = totalCost * 0.25; // Conservative 25% optimization

  return {
    totalGasSpent30d: `$${totalCost.toFixed(2)}`,
    averageGasPerTx: `$${avgCostPerTx.toFixed(2)}`,
    mostExpensiveOperation: {
      type: mostExpensive.transactions[0]?.type || 'unknown',
      cost: `$${(mostExpensive.totalGasEstimate * avgGasPrice * 1e9 / 1e18 * ethPrice).toFixed(2)}`,
      date: mostExpensive.timestamp,
    },
    optimizationOpportunities: [
      `Batch more transactions together (saving ~15-25%)`,
      `Monitor gas prices and transact during low periods`,
      `Use optimal bridges to reduce route complexity`,
      `Consider staggering large operations`,
    ],
    estimatedMonthlyOptimization: `$${estimatedSavings.toFixed(2)}`,
  };
};

/**
 * Get gas spending trend
 */
export const getGasSpendingTrend = (days: number = 30): Array<{
  date: string;
  spent: number;
  txCount: number;
  avgGasPrice: number;
}> => {
  const trends: Array<{
    date: string;
    spent: number;
    txCount: number;
    avgGasPrice: number;
  }> = [];

  for (let i = days - 1; i >= 0; i--) {
    const dayStart = Date.now() - (i + 1) * 24 * 60 * 60 * 1000;
    const dayEnd = Date.now() - i * 24 * 60 * 60 * 1000;

    const dayBatches = gasStateCache.completedBatches.filter(
      b => b.timestamp >= dayStart && b.timestamp <= dayEnd
    );

    const dateStr = new Date(dayStart).toISOString().split('T')[0];
    const avgPrice = getAverageGasPrice(24);
    const totalGas = dayBatches.reduce((sum, b) => sum + b.totalGasEstimate, 0);
    const spent = totalGas * avgPrice * 1e9 / 1e18;

    trends.push({
      date: dateStr,
      spent,
      txCount: dayBatches.reduce((sum, b) => sum + b.transactions.length, 0),
      avgGasPrice: avgPrice,
    });
  }

  return trends;
};

// ============================================================================
// ALERTS & NOTIFICATIONS
// ============================================================================

export interface GasAlert {
  id: string;
  type: 'price_drop' | 'price_spike' | 'batch_ready' | 'network_congestion';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: number;
  actionUrl?: string;
}

/**
 * Get gas alerts
 */
export const getGasAlerts = (): GasAlert[] => {
  const alerts: GasAlert[] = [];
  const currentPrice = gasStateCache.currentPrice.current;
  const avgPrice = getAverageGasPrice(24);

  // Price spike alert
  if (currentPrice > avgPrice * 1.3) {
    alerts.push({
      id: `alert-spike-${Date.now()}`,
      type: 'price_spike',
      severity: 'high',
      message: `Gas prices are ${Math.round(((currentPrice / avgPrice - 1) * 100))}% above 24h average`,
      timestamp: Date.now(),
    });
  }

  // Price drop alert
  if (currentPrice < avgPrice * 0.7) {
    alerts.push({
      id: `alert-drop-${Date.now()}`,
      type: 'price_drop',
      severity: 'medium',
      message: `Gas prices are ${Math.round(((1 - currentPrice / avgPrice) * 100))}% below 24h average - good time to transact`,
      timestamp: Date.now(),
    });
  }

  // Batch ready alert
  if (gasStateCache.batchQueue.length >= 3) {
    alerts.push({
      id: `alert-batch-${Date.now()}`,
      type: 'batch_ready',
      severity: 'low',
      message: `You have ${gasStateCache.batchQueue.length} pending transactions. Batch them to save gas?`,
      timestamp: Date.now(),
      actionUrl: '/batch-submit',
    });
  }

  return alerts;
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format gas price for display
 */
export const formatGasPrice = (gweiPrice: number): string => {
  if (gweiPrice >= 1000) {
    return `${(gweiPrice / 1000).toFixed(2)} kGwei`;
  }
  return `${gweiPrice.toFixed(2)} Gwei`;
};

/**
 * Get gas price grade
 */
export const getGasPriceGrade = (price: number): {
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  color: string;
  recommendation: string;
} => {
  const avg = getAverageGasPrice(24);
  const ratio = price / avg;

  if (ratio < 0.6) {
    return { grade: 'A+', color: '#22c55e', recommendation: 'Excellent - transact now!' };
  } else if (ratio < 0.8) {
    return { grade: 'A', color: '#84cc16', recommendation: 'Good - favorable conditions' };
  } else if (ratio < 1.0) {
    return { grade: 'B', color: '#eab308', recommendation: 'Average - acceptable' };
  } else if (ratio < 1.2) {
    return { grade: 'C', color: '#f97316', recommendation: 'High - consider waiting' };
  } else if (ratio < 1.4) {
    return { grade: 'D', color: '#ef4444', recommendation: 'Very high - wait if possible' };
  } else {
    return { grade: 'F', color: '#dc2626', recommendation: 'Extreme - only for urgent tx' };
  }
};

/**
 * Export gas report as JSON
 */
export const exportGasReport = (): string => {
  return JSON.stringify({
    generatedAt: new Date().toISOString(),
    currentGasPrice: gasStateCache.currentPrice,
    portfolioAnalysis: getPortfolioGasAnalysis(),
    gasPriceGrade: getGasPriceGrade(gasStateCache.currentPrice.current),
    optimalTime: getOptimalGasTime(),
    pendingTransactions: gasStateCache.batchQueue.length,
    completedBatches: gasStateCache.completedBatches.length,
    alerts: getGasAlerts(),
  }, null, 2);
};

/**
 * Reset gas tracking state
 */
export const resetGasState = (): void => {
  gasStateCache = {
    currentPrice: getCurrentGasPrice(),
    priceHistory: [],
    batchQueue: [],
    completedBatches: [],
    lastUpdate: Date.now(),
  };
};
