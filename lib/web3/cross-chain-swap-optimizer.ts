/**
 * Cross-Chain Swap Optimizer
 * Advanced utility combining bridges and DEXs for optimal cross-chain trading
 * 
 * Features:
 * - Best rate finder across all bridges and DEXs
 * - Multi-hop routing (e.g., ETH → Base USDC via various paths)
 * - Complete cost comparison with fees, slippage, and gas
 * - Multi-priority optimization (cheapest, fastest, best-rate)
 * - Path recommendations with impact analysis
 */

import { formatUnits, parseUnits } from 'viem';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Chain {
  id: string;
  name: string;
  chainId: number;
  nativeToken: string;
  decimals: number;
}

export interface Asset {
  symbol: string;
  name: string;
  chainId: number;
  address: string;
  decimals: number;
  coingeckoId?: string;
}

export interface BridgeProtocol {
  id: string;
  name: string;
  fee: number; // percentage
  minAmount: number;
  maxAmount: number;
  supportedChains: string[]; // chain IDs
  avgTime: number; // seconds
  liquidity: number; // USD
  slippage: number; // percentage
}

export interface DEXProtocol {
  id: string;
  name: string;
  chainId: string;
  fee: number; // percentage
  liquidity: number; // USD
  slippage: number; // percentage
  avgTime: number; // seconds
  supportedAssets: string[]; // asset symbols
}

export interface RouteStep {
  type: 'bridge' | 'swap' | 'native-swap';
  protocol: BridgeProtocol | DEXProtocol;
  fromAsset: Asset;
  toAsset: Asset;
  inputAmount: string;
  outputAmount: string;
  fee: number; // USD
  feeBps: number; // basis points
  priceImpact: number; // percentage
  executionTime: number; // seconds
  liquidity: number; // USD
}

export interface CrossChainRoute {
  id: string;
  steps: RouteStep[];
  startAsset: Asset;
  endAsset: Asset;
  startChain: Chain;
  endChain: Chain;
  
  // Input/Output
  inputAmount: string;
  outputAmount: string;
  
  // Costs
  totalFee: number; // USD
  totalFeeBps: number;
  totalGasCost: number; // USD
  totalCost: number; // USD = totalFee + totalGasCost
  
  // Rates
  rate: number; // inputAmount / outputAmount
  priceImpact: number; // percentage
  effectiveSlippage: number; // percentage
  
  // Execution
  totalTime: number; // seconds
  bottleneck: RouteStep | null; // slowest step
  
  // Scores
  costScore: number; // 0-100, higher = cheaper
  speedScore: number; // 0-100, higher = faster
  rateScore: number; // 0-100, higher = better rate
  overallScore: number; // weighted score
}

export interface CrossChainSwapOptions {
  maxSlippage?: number; // percentage
  maxTime?: number; // seconds
  excludeBridges?: string[]; // bridge IDs
  excludeDexes?: string[]; // DEX IDs
  priority?: 'cheapest' | 'fastest' | 'best-rate' | 'balanced';
  allowDirect?: boolean; // allow direct routes only
  maxHops?: number; // maximum number of steps
}

export interface SwapImpactAnalysis {
  route: CrossChainRoute;
  priceImpactBreakdown: {
    bridgeImpact: number;
    dexImpact: number;
    totalImpact: number;
  };
  slippageWarning?: string;
  riskFactors: string[];
  recommendations: string[];
}

export interface CrossChainComparison {
  query: {
    fromAsset: string;
    fromChain: string;
    toAsset: string;
    toChain: string;
    amount: string;
  };
  routes: CrossChainRoute[];
  bestByRate: CrossChainRoute;
  bestByCost: CrossChainRoute;
  bestBySpeed: CrossChainRoute;
  recommended: CrossChainRoute;
}

export interface LiquidityAnalysis {
  asset: string;
  chain: string;
  available: number;
  bridgedAmount: number;
  nativeAmount: number;
  concentration: number; // percentage on single bridge
  riskLevel: 'low' | 'medium' | 'high';
  recommendation: string;
}

// ============================================================================
// CHAIN & ASSET DATA
// ============================================================================

const CHAINS: Record<string, Chain> = {
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    chainId: 1,
    nativeToken: 'ETH',
    decimals: 18,
  },
  base: {
    id: 'base',
    name: 'Base',
    chainId: 8453,
    nativeToken: 'ETH',
    decimals: 18,
  },
  arbitrum: {
    id: 'arbitrum',
    name: 'Arbitrum',
    chainId: 42161,
    nativeToken: 'ETH',
    decimals: 18,
  },
  optimism: {
    id: 'optimism',
    name: 'Optimism',
    chainId: 10,
    nativeToken: 'ETH',
    decimals: 18,
  },
  polygon: {
    id: 'polygon',
    name: 'Polygon',
    chainId: 137,
    nativeToken: 'MATIC',
    decimals: 18,
  },
};

const ASSETS: Record<string, Asset> = {
  'ETH-ethereum': {
    symbol: 'ETH',
    name: 'Ethereum',
    chainId: 1,
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
    decimals: 18,
    coingeckoId: 'ethereum',
  },
  'ETH-base': {
    symbol: 'ETH',
    name: 'Ethereum',
    chainId: 8453,
    address: '0x4200000000000000000000000000000000000006',
    decimals: 18,
    coingeckoId: 'ethereum',
  },
  'USDC-ethereum': {
    symbol: 'USDC',
    name: 'USD Coin',
    chainId: 1,
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    decimals: 6,
    coingeckoId: 'usd-coin',
  },
  'USDC-base': {
    symbol: 'USDC',
    name: 'USD Coin',
    chainId: 8453,
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b1566469c3d',
    decimals: 6,
    coingeckoId: 'usd-coin',
  },
  'USDC.e-base': {
    symbol: 'USDC.e',
    name: 'USD Coin (Ethereum)',
    chainId: 8453,
    address: '0xd0B53D9277641d375ced175c3e6AdB0415b4d7f1',
    decimals: 6,
    coingeckoId: 'usd-coin',
  },
  'DAI-ethereum': {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    chainId: 1,
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    decimals: 18,
    coingeckoId: 'dai',
  },
  'DAI-base': {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    chainId: 8453,
    address: '0x50c5725949A6F0c72E6C4a641F14DA7493d45ec7',
    decimals: 18,
    coingeckoId: 'dai',
  },
};

const BRIDGE_PROTOCOLS: Record<string, BridgeProtocol> = {
  stargate: {
    id: 'stargate',
    name: 'Stargate',
    fee: 0.05,
    minAmount: 1,
    maxAmount: 10000000,
    supportedChains: ['ethereum', 'base', 'arbitrum', 'optimism', 'polygon'],
    avgTime: 300,
    liquidity: 500000000,
    slippage: 0.1,
  },
  'hop-protocol': {
    id: 'hop-protocol',
    name: 'Hop Protocol',
    fee: 0.04,
    minAmount: 0.1,
    maxAmount: 5000000,
    supportedChains: ['ethereum', 'base', 'arbitrum', 'optimism', 'polygon'],
    avgTime: 180,
    liquidity: 300000000,
    slippage: 0.08,
  },
  across: {
    id: 'across',
    name: 'Across',
    fee: 0.03,
    minAmount: 1,
    maxAmount: 1000000,
    supportedChains: ['ethereum', 'base', 'arbitrum', 'optimism', 'polygon'],
    avgTime: 120,
    liquidity: 400000000,
    slippage: 0.05,
  },
  socket: {
    id: 'socket',
    name: 'Socket',
    fee: 0.02,
    minAmount: 0.5,
    maxAmount: 500000,
    supportedChains: ['ethereum', 'base', 'arbitrum'],
    avgTime: 60,
    liquidity: 200000000,
    slippage: 0.03,
  },
  'canonical-bridge': {
    id: 'canonical-bridge',
    name: 'Canonical Bridge',
    fee: 0.0,
    minAmount: 0.01,
    maxAmount: 100000,
    supportedChains: ['ethereum', 'base', 'optimism'],
    avgTime: 600,
    liquidity: 1000000000,
    slippage: 0.01,
  },
};

const DEX_PROTOCOLS: Record<string, DEXProtocol> = {
  'uniswap-v3': {
    id: 'uniswap-v3',
    name: 'Uniswap V3',
    chainId: 'ethereum',
    fee: 0.3,
    liquidity: 1000000000,
    slippage: 0.05,
    avgTime: 20,
    supportedAssets: ['ETH', 'USDC', 'DAI'],
  },
  'uniswap-v3-base': {
    id: 'uniswap-v3-base',
    name: 'Uniswap V3',
    chainId: 'base',
    fee: 0.3,
    liquidity: 500000000,
    slippage: 0.05,
    avgTime: 15,
    supportedAssets: ['ETH', 'USDC', 'DAI', 'USDC.e'],
  },
  aerodrome: {
    id: 'aerodrome',
    name: 'Aerodrome',
    chainId: 'base',
    fee: 0.25,
    liquidity: 300000000,
    slippage: 0.04,
    avgTime: 15,
    supportedAssets: ['ETH', 'USDC', 'DAI'],
  },
  curve: {
    id: 'curve',
    name: 'Curve Finance',
    chainId: 'base',
    fee: 0.04,
    liquidity: 200000000,
    slippage: 0.02,
    avgTime: 20,
    supportedAssets: ['USDC', 'DAI', 'USDC.e'],
  },
};

// ============================================================================
// MAIN FUNCTION: Get Optimal Cross-Chain Path
// ============================================================================

/**
 * Find the optimal cross-chain swap path
 */
export const getOptimalCrossChainPath = (
  fromAsset: string,
  fromChain: string,
  toAsset: string,
  toChain: string,
  amount: string,
  options: CrossChainSwapOptions = {}
): CrossChainRoute => {
  const routes = getAllCrossChainRoutes(fromAsset, fromChain, toAsset, toChain, amount, options);
  
  if (routes.length === 0) {
    throw new Error(`No routes found from ${fromAsset} on ${fromChain} to ${toAsset} on ${toChain}`);
  }

  // Sort by priority
  const priority = options.priority || 'balanced';
  
  if (priority === 'cheapest') {
    return routes.reduce((best, current) =>
      current.totalCost < best.totalCost ? current : best
    );
  } else if (priority === 'fastest') {
    return routes.reduce((best, current) =>
      current.totalTime < best.totalTime ? current : best
    );
  } else if (priority === 'best-rate') {
    return routes.reduce((best, current) =>
      current.rate < best.rate ? current : best
    );
  } else {
    // Balanced: return highest overallScore
    return routes.reduce((best, current) =>
      current.overallScore > best.overallScore ? current : best
    );
  }
};

/**
 * Get all possible routes sorted by score
 */
export const getAllCrossChainRoutes = (
  fromAsset: string,
  fromChain: string,
  toAsset: string,
  toChain: string,
  amount: string,
  options: CrossChainSwapOptions = {}
): CrossChainRoute[] => {
  const routes: CrossChainRoute[] = [];

  const fromChainObj = CHAINS[fromChain];
  const toChainObj = CHAINS[toChain];
  
  if (!fromChainObj || !toChainObj) {
    throw new Error(`Invalid chain: ${!fromChainObj ? fromChain : toChain}`);
  }

  const startAsset = getAsset(fromAsset, fromChain);
  const endAsset = getAsset(toAsset, toChain);
  
  if (!startAsset || !endAsset) {
    throw new Error(`Asset not found on chain`);
  }

  const amountNum = parseFloat(amount);

  // Same chain swap (no bridge needed)
  if (fromChain === toChain) {
    if (fromAsset === toAsset) {
      // No swap needed - direct transfer
      routes.push({
        id: 'direct-transfer',
        steps: [],
        startAsset,
        endAsset,
        startChain: fromChainObj,
        endChain: toChainObj,
        inputAmount: amount,
        outputAmount: amount,
        totalFee: 0,
        totalFeeBps: 0,
        totalGasCost: 5, // Minimal gas for transfer
        totalCost: 5,
        rate: 1,
        priceImpact: 0,
        effectiveSlippage: 0,
        totalTime: 15,
        bottleneck: null,
        costScore: 100,
        speedScore: 100,
        rateScore: 100,
        overallScore: 100,
      });
    } else {
      // Same chain swap via DEX
      const dexes = getDexesByChain(fromChain).filter(d =>
        d.supportedAssets.includes(fromAsset) && d.supportedAssets.includes(toAsset)
      );

      dexes.forEach(dex => {
        const route = createDexSwapRoute(
          startAsset,
          endAsset,
          fromChainObj,
          toChainObj,
          dex,
          amountNum
        );
        if (route) {
          routes.push(route);
        }
      });
    }
  } else {
    // Cross-chain routes - need bridge + optional swap

    // Get available bridges
    const bridges = getBridgesForRoute(fromChain, toChain).filter(b =>
      !options.excludeBridges?.includes(b.id)
    );

    bridges.forEach(bridge => {
      // Route: Direct bridge + optional swap on destination
      const directBridgeRoute = createBridgeRoute(
        startAsset,
        endAsset,
        fromChainObj,
        toChainObj,
        bridge,
        amountNum,
        options.maxHops ?? 3
      );
      if (directBridgeRoute) {
        routes.push(directBridgeRoute);
      }

      // Route: Swap on source -> bridge -> swap on destination
      const swapBridgeSwapRoute = createSwapBridgeSwapRoute(
        fromAsset,
        toAsset,
        fromChain,
        toChain,
        fromChainObj,
        toChainObj,
        bridge,
        amountNum,
        options
      );
      if (swapBridgeSwapRoute) {
        routes.push(swapBridgeSwapRoute);
      }
    });
  }

  // Filter by options
  const filtered = routes.filter(route => {
    if (options.maxSlippage && route.effectiveSlippage > options.maxSlippage) return false;
    if (options.maxTime && route.totalTime > options.maxTime) return false;
    if (options.maxHops && route.steps.length > options.maxHops) return false;
    return true;
  });

  // Calculate scores
  filtered.forEach(route => calculateRouteScores(route));

  // Sort by overallScore
  return filtered.sort((a, b) => b.overallScore - a.overallScore);
};

/**
 * Compare all routes with recommendations
 */
export const compareAllRoutes = (
  fromAsset: string,
  fromChain: string,
  toAsset: string,
  toChain: string,
  amount: string,
  options?: CrossChainSwapOptions
): CrossChainComparison => {
  const routes = getAllCrossChainRoutes(fromAsset, fromChain, toAsset, toChain, amount, options);

  const bestByRate = routes.reduce((best, current) =>
    current.rate < best.rate ? current : best
  );

  const bestByCost = routes.reduce((best, current) =>
    current.totalCost < best.totalCost ? current : best
  );

  const bestBySpeed = routes.reduce((best, current) =>
    current.totalTime < best.totalTime ? current : best
  );

  const recommended = routes[0]; // Already sorted by overallScore

  return {
    query: {
      fromAsset,
      fromChain,
      toAsset,
      toChain,
      amount,
    },
    routes,
    bestByRate,
    bestByCost,
    bestBySpeed,
    recommended,
  };
};

// ============================================================================
// ROUTE CREATION HELPERS
// ============================================================================

function createDexSwapRoute(
  fromAsset: Asset,
  toAsset: Asset,
  fromChain: Chain,
  toChain: Chain,
  dex: DEXProtocol,
  amount: number
): CrossChainRoute | null {
  const step: RouteStep = {
    type: 'swap',
    protocol: dex,
    fromAsset,
    toAsset,
    inputAmount: amount.toString(),
    outputAmount: (amount * (1 - dex.fee / 100) * (1 - dex.slippage / 100)).toString(),
    fee: amount * (dex.fee / 100) * 2500, // Assuming $2500 per ETH
    feeBps: Math.round(dex.fee * 100),
    priceImpact: dex.slippage,
    executionTime: dex.avgTime,
    liquidity: dex.liquidity,
  };

  const outputAmount = parseFloat(step.outputAmount);

  return {
    id: `dex-${dex.id}-${Date.now()}`,
    steps: [step],
    startAsset: fromAsset,
    endAsset: toAsset,
    startChain: fromChain,
    endChain: toChain,
    inputAmount: amount.toString(),
    outputAmount: outputAmount.toString(),
    totalFee: step.fee,
    totalFeeBps: step.feeBps,
    totalGasCost: 3,
    totalCost: step.fee + 3,
    rate: amount / outputAmount,
    priceImpact: step.priceImpact,
    effectiveSlippage: step.priceImpact,
    totalTime: step.executionTime,
    bottleneck: step,
    costScore: 0,
    speedScore: 0,
    rateScore: 0,
    overallScore: 0,
  };
}

function createBridgeRoute(
  fromAsset: Asset,
  toAsset: Asset,
  fromChain: Chain,
  toChain: Chain,
  bridge: BridgeProtocol,
  amount: number,
  maxHops: number
): CrossChainRoute | null {
  const bridgeStep: RouteStep = {
    type: 'bridge',
    protocol: bridge,
    fromAsset,
    toAsset: toAsset.symbol === fromAsset.symbol ? toAsset : fromAsset, // Same asset symbol
    inputAmount: amount.toString(),
    outputAmount: (amount * (1 - bridge.fee / 100) * (1 - bridge.slippage / 100)).toString(),
    fee: amount * (bridge.fee / 100) * 2500,
    feeBps: Math.round(bridge.fee * 100),
    priceImpact: bridge.slippage,
    executionTime: bridge.avgTime,
    liquidity: bridge.liquidity,
  };

  const bridgeOutput = parseFloat(bridgeStep.outputAmount);

  // If assets are different on destination, add swap step
  const steps: RouteStep[] = [bridgeStep];
  let finalOutput = bridgeOutput;

  if (fromAsset.symbol !== toAsset.symbol) {
    const destDexes = getDexesByChain(toChain.id).filter(d =>
      d.supportedAssets.includes(fromAsset.symbol) && d.supportedAssets.includes(toAsset.symbol)
    );

    if (destDexes.length > 0 && steps.length < maxHops) {
      const dex = destDexes[0];
      const swapStep: RouteStep = {
        type: 'swap',
        protocol: dex,
        fromAsset,
        toAsset,
        inputAmount: bridgeOutput.toString(),
        outputAmount: (bridgeOutput * (1 - dex.fee / 100) * (1 - dex.slippage / 100)).toString(),
        fee: bridgeOutput * (dex.fee / 100) * 2500,
        feeBps: Math.round(dex.fee * 100),
        priceImpact: dex.slippage,
        executionTime: dex.avgTime,
        liquidity: dex.liquidity,
      };
      steps.push(swapStep);
      finalOutput = parseFloat(swapStep.outputAmount);
    }
  }

  const totalFee = steps.reduce((sum, s) => sum + s.fee, 0);
  const totalFeeBps = steps.reduce((sum, s) => sum + s.feeBps, 0);
  const totalGasCost = steps.length * 3 + 5;
  const totalTime = steps.reduce((sum, s) => sum + s.executionTime, 0);

  return {
    id: `bridge-${bridge.id}-${Date.now()}`,
    steps,
    startAsset: fromAsset,
    endAsset: toAsset,
    startChain: fromChain,
    endChain: toChain,
    inputAmount: amount.toString(),
    outputAmount: finalOutput.toString(),
    totalFee,
    totalFeeBps,
    totalGasCost,
    totalCost: totalFee + totalGasCost,
    rate: amount / finalOutput,
    priceImpact: steps.reduce((max, s) => Math.max(max, s.priceImpact), 0),
    effectiveSlippage: steps.reduce((sum, s) => sum + s.priceImpact, 0) / steps.length,
    totalTime,
    bottleneck: steps.reduce((max, s) => s.executionTime > max.executionTime ? s : max),
    costScore: 0,
    speedScore: 0,
    rateScore: 0,
    overallScore: 0,
  };
}

function createSwapBridgeSwapRoute(
  fromAsset: string,
  toAsset: string,
  fromChain: string,
  toChain: string,
  fromChainObj: Chain,
  toChainObj: Chain,
  bridge: BridgeProtocol,
  amount: number,
  options: CrossChainSwapOptions
): CrossChainRoute | null {
  const steps: RouteStep[] = [];
  let currentAmount = amount;

  // Get intermediate asset (usually USDC or bridge asset)
  const intermediateAsset = fromAsset === 'ETH' ? 'USDC' : fromAsset;
  const bridgeAsset = getAsset(intermediateAsset, fromChain);

  if (!bridgeAsset) return null;

  // Step 1: Swap on source chain if needed
  if (fromAsset !== intermediateAsset) {
    const sourceDexes = getDexesByChain(fromChain).filter(d =>
      d.supportedAssets.includes(fromAsset) && d.supportedAssets.includes(intermediateAsset)
    );

    if (sourceDexes.length === 0) return null;

    const sourceDex = sourceDexes[0];
    const swapStep: RouteStep = {
      type: 'swap',
      protocol: sourceDex,
      fromAsset: getAsset(fromAsset, fromChain)!,
      toAsset: bridgeAsset,
      inputAmount: currentAmount.toString(),
      outputAmount: (currentAmount * (1 - sourceDex.fee / 100) * (1 - sourceDex.slippage / 100)).toString(),
      fee: currentAmount * (sourceDex.fee / 100) * 2500,
      feeBps: Math.round(sourceDex.fee * 100),
      priceImpact: sourceDex.slippage,
      executionTime: sourceDex.avgTime,
      liquidity: sourceDex.liquidity,
    };
    steps.push(swapStep);
    currentAmount = parseFloat(swapStep.outputAmount);
  }

  // Step 2: Bridge
  const bridgeStep: RouteStep = {
    type: 'bridge',
    protocol: bridge,
    fromAsset: bridgeAsset,
    toAsset: getAsset(intermediateAsset, toChain) || bridgeAsset,
    inputAmount: currentAmount.toString(),
    outputAmount: (currentAmount * (1 - bridge.fee / 100) * (1 - bridge.slippage / 100)).toString(),
    fee: currentAmount * (bridge.fee / 100) * 2500,
    feeBps: Math.round(bridge.fee * 100),
    priceImpact: bridge.slippage,
    executionTime: bridge.avgTime,
    liquidity: bridge.liquidity,
  };
  steps.push(bridgeStep);
  currentAmount = parseFloat(bridgeStep.outputAmount);

  // Step 3: Swap on destination if needed
  if (intermediateAsset !== toAsset) {
    const destDexes = getDexesByChain(toChain).filter(d =>
      d.supportedAssets.includes(intermediateAsset) && d.supportedAssets.includes(toAsset)
    );

    if (destDexes.length === 0) return null;

    const destDex = destDexes[0];
    const destAsset = getAsset(toAsset, toChain);
    if (!destAsset) return null;

    const swapStep: RouteStep = {
      type: 'swap',
      protocol: destDex,
      fromAsset: getAsset(intermediateAsset, toChain)!,
      toAsset: destAsset,
      inputAmount: currentAmount.toString(),
      outputAmount: (currentAmount * (1 - destDex.fee / 100) * (1 - destDex.slippage / 100)).toString(),
      fee: currentAmount * (destDex.fee / 100) * 2500,
      feeBps: Math.round(destDex.fee * 100),
      priceImpact: destDex.slippage,
      executionTime: destDex.avgTime,
      liquidity: destDex.liquidity,
    };
    steps.push(swapStep);
    currentAmount = parseFloat(swapStep.outputAmount);
  }

  if (steps.length > (options.maxHops ?? 3)) return null;

  const totalFee = steps.reduce((sum, s) => sum + s.fee, 0);
  const totalFeeBps = steps.reduce((sum, s) => sum + s.feeBps, 0);
  const totalGasCost = steps.length * 3 + 5;
  const totalTime = steps.reduce((sum, s) => sum + s.executionTime, 0);

  return {
    id: `swap-bridge-swap-${bridge.id}-${Date.now()}`,
    steps,
    startAsset: getAsset(fromAsset, fromChain)!,
    endAsset: getAsset(toAsset, toChain)!,
    startChain: fromChainObj,
    endChain: toChainObj,
    inputAmount: amount.toString(),
    outputAmount: currentAmount.toString(),
    totalFee,
    totalFeeBps,
    totalGasCost,
    totalCost: totalFee + totalGasCost,
    rate: amount / currentAmount,
    priceImpact: steps.reduce((max, s) => Math.max(max, s.priceImpact), 0),
    effectiveSlippage: steps.reduce((sum, s) => sum + s.priceImpact, 0) / steps.length,
    totalTime,
    bottleneck: steps.reduce((max, s) => s.executionTime > max.executionTime ? s : max),
    costScore: 0,
    speedScore: 0,
    rateScore: 0,
    overallScore: 0,
  };
}

// ============================================================================
// SCORING & ANALYSIS
// ============================================================================

function calculateRouteScores(route: CrossChainRoute): void {
  // Normalize scores to 0-100

  // Cost score: lower cost = higher score
  const maxCost = 100; // Assume max reasonable cost
  route.costScore = Math.max(0, 100 - (route.totalCost / maxCost) * 100);

  // Speed score: lower time = higher score
  const maxTime = 3600; // 1 hour
  route.speedScore = Math.max(0, 100 - (route.totalTime / maxTime) * 100);

  // Rate score: lower rate (better exchange) = higher score
  const maxRate = 1.1; // Assume max reasonable rate impact
  route.rateScore = Math.max(0, 100 - (route.rate / maxRate) * 100);

  // Overall score: weighted average
  route.overallScore = (route.costScore * 0.4) + (route.speedScore * 0.3) + (route.rateScore * 0.3);
}

/**
 * Analyze price impact and risks for a route
 */
export const analyzeRouteImpact = (route: CrossChainRoute): SwapImpactAnalysis => {
  const bridgeStep = route.steps.find(s => s.type === 'bridge');
  const swapSteps = route.steps.filter(s => s.type !== 'bridge');

  const riskFactors: string[] = [];
  const recommendations: string[] = [];

  // Check liquidity
  if (route.steps.some(s => s.liquidity < 1000000)) {
    riskFactors.push('Low liquidity on one or more steps');
    recommendations.push('Consider splitting your order into smaller amounts');
  }

  // Check slippage
  if (route.effectiveSlippage > 1) {
    riskFactors.push('High slippage risk (>1%)');
    recommendations.push('Consider setting a lower maximum slippage tolerance');
  }

  // Check bridge time
  if (bridgeStep && bridgeStep.executionTime > 600) {
    riskFactors.push('Long bridge execution time (>10 minutes)');
    recommendations.push('Bridge may take significant time; plan accordingly');
  }

  // Check multi-hop
  if (route.steps.length > 2) {
    riskFactors.push('Complex multi-hop route with multiple failure points');
    recommendations.push('Consider simpler routes if available');
  }

  // Check price impact vs direct
  if (route.priceImpact > 2) {
    riskFactors.push('High total price impact (>2%)');
    recommendations.push('Wait for better market conditions if possible');
  }

  return {
    route,
    priceImpactBreakdown: {
      bridgeImpact: bridgeStep?.priceImpact ?? 0,
      dexImpact: swapSteps.reduce((max, s) => Math.max(max, s.priceImpact), 0),
      totalImpact: route.priceImpact,
    },
    slippageWarning: route.effectiveSlippage > 0.5
      ? `Expected slippage: ${route.effectiveSlippage.toFixed(2)}%`
      : undefined,
    riskFactors,
    recommendations,
  };
};

/**
 * Analyze liquidity distribution for an asset
 */
export const analyzeLiquidityDistribution = (
  asset: string,
  amount: number
): Record<string, LiquidityAnalysis> => {
  const analysis: Record<string, LiquidityAnalysis> = {};

  Object.entries(CHAINS).forEach(([chainId, chain]) => {
    const assetKey = `${asset}-${chain.id}`;
    const bridges = Object.values(BRIDGE_PROTOCOLS);
    
    const bridgedAmount = bridges.reduce((sum, b) => {
      if (b.supportedChains.includes(chain.id)) {
        return sum + b.liquidity;
      }
      return sum;
    }, 0);

    const nativeAmount = Math.random() * 1000000000; // Mock data
    const totalAvailable = bridgedAmount + nativeAmount;

    const concentration = (bridgedAmount / totalAvailable) * 100;
    
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (concentration > 70) riskLevel = 'high';
    else if (concentration > 50) riskLevel = 'medium';

    let recommendation = `${concentration.toFixed(0)}% of liquidity is bridged`;
    if (concentration > 80) {
      recommendation += ' - high centralization risk';
    } else if (concentration < 20) {
      recommendation += ' - mostly native liquidity';
    }

    analysis[chain.id] = {
      asset,
      chain: chain.name,
      available: totalAvailable,
      bridgedAmount,
      nativeAmount,
      concentration,
      riskLevel,
      recommendation,
    };
  });

  return analysis;
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getAsset(symbol: string, chainId: string): Asset | undefined {
  return ASSETS[`${symbol}-${chainId}`];
}

function getDexesByChain(chainId: string): DEXProtocol[] {
  return Object.values(DEX_PROTOCOLS).filter(d => d.chainId === chainId);
}

function getBridgesForRoute(fromChain: string, toChain: string): BridgeProtocol[] {
  return Object.values(BRIDGE_PROTOCOLS).filter(b =>
    b.supportedChains.includes(fromChain) && b.supportedChains.includes(toChain)
  );
}

/**
 * Get all supported chains
 */
export const getSupportedChains = (): Chain[] => {
  return Object.values(CHAINS);
};

/**
 * Get all supported assets on a chain
 */
export const getSupportedAssets = (chainId: string): Asset[] => {
  return Object.values(ASSETS).filter(a => a.chainId === parseInt(CHAINS[chainId]?.chainId.toString() || '0'));
};

/**
 * Get all available bridges
 */
export const getAvailableBridges = (): BridgeProtocol[] => {
  return Object.values(BRIDGE_PROTOCOLS);
};

/**
 * Format route for display
 */
export const formatRoute = (route: CrossChainRoute): string => {
  const stepDescriptions = route.steps.map(s => {
    const proto = 'name' in s.protocol ? s.protocol.name : s.protocol.name;
    return `${s.fromAsset.symbol} → ${s.toAsset.symbol} (${proto})`;
  });

  const description = stepDescriptions.length > 0
    ? stepDescriptions.join(' → ')
    : `Direct transfer of ${route.startAsset.symbol}`;

  return description;
};

/**
 * Estimate output amount for route
 */
export const estimateRouteOutput = (
  fromAsset: string,
  fromChain: string,
  toAsset: string,
  toChain: string,
  inputAmount: string
): string => {
  try {
    const route = getOptimalCrossChainPath(fromAsset, fromChain, toAsset, toChain, inputAmount);
    return route.outputAmount;
  } catch {
    return '0';
  }
};

/**
 * Export route as JSON for on-chain execution
 */
export const exportRouteForExecution = (route: CrossChainRoute): string => {
  return JSON.stringify({
    id: route.id,
    steps: route.steps.map(s => ({
      type: s.type,
      protocol: 'name' in s.protocol ? s.protocol.id : s.protocol.id,
      fromAsset: s.fromAsset.address,
      toAsset: s.toAsset.address,
      inputAmount: s.inputAmount,
    })),
    totalInputAmount: route.inputAmount,
    expectedOutputAmount: route.outputAmount,
    maxSlippage: route.effectiveSlippage,
    deadline: Math.floor(Date.now() / 1000) + 300, // 5 min deadline
  }, null, 2);
};
