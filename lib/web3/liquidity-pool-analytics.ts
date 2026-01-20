/**
 * Liquidity Pool Analytics System
 * Deep DeFi insights: Top pools, APY calculations, risk indicators, pool finder
 */

import { formatUnits, parseUnits } from 'viem';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface LiquidityPool {
  id: string;
  name: string;
  dex: string;
  token0: {
    symbol: string;
    address: string;
    decimals: number;
    price: number;
  };
  token1: {
    symbol: string;
    address: string;
    decimals: number;
    price: number;
  };
  tvl: number; // Total Value Locked in USD
  volume24h: number; // 24h trading volume in USD
  volume7d: number; // 7 day volume in USD
  fee: number; // Pool fee in basis points (e.g., 3000 = 0.30%)
  apy: number; // Annual Percentage Yield
  apr: number; // Annual Percentage Rate (fee-based)
  liquidity: {
    token0Amount: number;
    token1Amount: number;
  };
  priceRange?: {
    min: number;
    max: number;
  };
  lastUpdated: number;
  riskLevel: 'low' | 'medium' | 'high';
  concentration?: number; // For concentrated liquidity pools
}

export interface PoolAnalytics {
  pool: LiquidityPool;
  apyBreakdown: {
    feeApy: number;
    incentiveApy: number;
    totalApy: number;
  };
  riskMetrics: {
    impermanentLoss: number;
    slippage: number;
    volatility: number;
    riskScore: number; // 0-100
  };
  recommendations: string[];
}

export interface PoolSearchParams {
  token0?: string;
  token1?: string;
  dex?: string;
  minTvl?: number;
  maxTvl?: number;
  minApy?: number;
  sortBy?: 'tvl' | 'volume' | 'apy' | 'risk';
  order?: 'asc' | 'desc';
}

export interface YieldCalculation {
  principalAmount: number;
  apyRate: number;
  investmentPeriod: number; // days
  compoundingFrequency: 'daily' | 'continuous';
  projectedYield: number;
  projectedTotal: number;
  impermanentLoss: number;
  netYield: number;
}

// ============================================================================
// LIQUIDITY POOL DATABASE
// ============================================================================

const LIQUIDITY_POOLS: LiquidityPool[] = [
  // Uniswap V3 Major Pools
  {
    id: 'uniswap-v3-eth-usdc-1',
    name: 'ETH/USDC (0.01%)',
    dex: 'Uniswap V3',
    token0: { symbol: 'WETH', address: '0x4200000000000000000000000000000000000006', decimals: 18, price: 2500 },
    token1: { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b1566111578', decimals: 6, price: 1 },
    tvl: 45000000,
    volume24h: 12500000,
    volume7d: 87500000,
    fee: 100, // 0.01%
    apy: 3.2,
    apr: 2.8,
    liquidity: { token0Amount: 18000, token1Amount: 45000000 },
    lastUpdated: Date.now(),
    riskLevel: 'low',
  },
  {
    id: 'uniswap-v3-eth-usdc-2',
    name: 'ETH/USDC (0.05%)',
    dex: 'Uniswap V3',
    token0: { symbol: 'WETH', address: '0x4200000000000000000000000000000000000006', decimals: 18, price: 2500 },
    token1: { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b1566111578', decimals: 6, price: 1 },
    tvl: 68000000,
    volume24h: 18700000,
    volume7d: 130900000,
    fee: 500, // 0.05%
    apy: 8.4,
    apr: 7.6,
    liquidity: { token0Amount: 27200, token1Amount: 68000000 },
    lastUpdated: Date.now(),
    riskLevel: 'low',
  },
  {
    id: 'uniswap-v3-eth-usdc-3',
    name: 'ETH/USDC (0.30%)',
    dex: 'Uniswap V3',
    token0: { symbol: 'WETH', address: '0x4200000000000000000000000000000000000006', decimals: 18, price: 2500 },
    token1: { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b1566111578', decimals: 6, price: 1 },
    tvl: 95000000,
    volume24h: 24500000,
    volume7d: 171500000,
    fee: 3000, // 0.30%
    apy: 15.2,
    apr: 13.8,
    liquidity: { token0Amount: 38000, token1Amount: 95000000 },
    lastUpdated: Date.now(),
    riskLevel: 'low-medium',
  },
  {
    id: 'uniswap-v3-usdc-usdt-1',
    name: 'USDC/USDT (0.01%)',
    dex: 'Uniswap V3',
    token0: { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b1566111578', decimals: 6, price: 1 },
    token1: { symbol: 'USDT', address: '0xfde4C96c8593536E31F26A3d5f51B3b0FA7C00B1', decimals: 6, price: 1 },
    tvl: 35000000,
    volume24h: 8200000,
    volume7d: 57400000,
    fee: 100, // 0.01%
    apy: 2.1,
    apr: 1.9,
    liquidity: { token0Amount: 17500000, token1Amount: 17500000 },
    lastUpdated: Date.now(),
    riskLevel: 'very-low',
  },
  {
    id: 'uniswap-v3-usdc-dai-1',
    name: 'USDC/DAI (0.01%)',
    dex: 'Uniswap V3',
    token0: { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b1566111578', decimals: 6, price: 1 },
    token1: { symbol: 'DAI', address: '0x50c5725949A6F0c72E6C4a641F14122319E53ffc', decimals: 18, price: 1 },
    tvl: 28000000,
    volume24h: 6400000,
    volume7d: 44800000,
    fee: 100, // 0.01%
    apy: 1.8,
    apr: 1.6,
    liquidity: { token0Amount: 14000000, token1Amount: 14000000 },
    lastUpdated: Date.now(),
    riskLevel: 'very-low',
  },

  // Aerodrome Pools (Base Native)
  {
    id: 'aerodrome-eth-usdc-1',
    name: 'ETH/USDC',
    dex: 'Aerodrome',
    token0: { symbol: 'WETH', address: '0x4200000000000000000000000000000000000006', decimals: 18, price: 2500 },
    token1: { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b1566111578', decimals: 6, price: 1 },
    tvl: 32000000,
    volume24h: 7500000,
    volume7d: 52500000,
    fee: 3000, // 0.30%
    apy: 24.5,
    apr: 18.2,
    liquidity: { token0Amount: 12800, token1Amount: 32000000 },
    lastUpdated: Date.now(),
    riskLevel: 'medium',
  },
  {
    id: 'aerodrome-aero-usdc-1',
    name: 'AERO/USDC',
    dex: 'Aerodrome',
    token0: { symbol: 'AERO', address: '0x940181a94A35A4569E4529A3CDfB74e38FD4D91f', decimals: 18, price: 0.85 },
    token1: { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b1566111578', decimals: 6, price: 1 },
    tvl: 18500000,
    volume24h: 4200000,
    volume7d: 29400000,
    fee: 3000, // 0.30%
    apy: 38.7,
    apr: 22.5,
    liquidity: { token0Amount: 21765000, token1Amount: 18500000 },
    lastUpdated: Date.now(),
    riskLevel: 'medium-high',
  },
  {
    id: 'aerodrome-usdc-usdt-1',
    name: 'USDC/USDT',
    dex: 'Aerodrome',
    token0: { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b1566111578', decimals: 6, price: 1 },
    token1: { symbol: 'USDT', address: '0xfde4C96c8593536E31F26A3d5f51B3b0FA7C00B1', decimals: 6, price: 1 },
    tvl: 15200000,
    volume24h: 3400000,
    volume7d: 23800000,
    fee: 1000, // 0.10%
    apy: 3.5,
    apr: 3.2,
    liquidity: { token0Amount: 7600000, token1Amount: 7600000 },
    lastUpdated: Date.now(),
    riskLevel: 'very-low',
  },

  // Curve Finance Pools
  {
    id: 'curve-3pool-1',
    name: '3Pool (USDC/USDT/DAI)',
    dex: 'Curve Finance',
    token0: { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b1566111578', decimals: 6, price: 1 },
    token1: { symbol: 'DAI', address: '0x50c5725949A6F0c72E6C4a641F14122319E53ffc', decimals: 18, price: 1 },
    tvl: 85000000,
    volume24h: 15600000,
    volume7d: 109200000,
    fee: 400, // 0.04%
    apy: 4.2,
    apr: 3.8,
    liquidity: { token0Amount: 28333333, token1Amount: 28333333 },
    lastUpdated: Date.now(),
    riskLevel: 'very-low',
  },

  // Balancer Pools
  {
    id: 'balancer-weth-usdc-dai-1',
    name: 'ETH/USDC/DAI (80/10/10)',
    dex: 'Balancer',
    token0: { symbol: 'WETH', address: '0x4200000000000000000000000000000000000006', decimals: 18, price: 2500 },
    token1: { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b1566111578', decimals: 6, price: 1 },
    tvl: 52000000,
    volume24h: 8900000,
    volume7d: 62300000,
    fee: 3000, // 0.30%
    apy: 12.8,
    apr: 10.5,
    liquidity: { token0Amount: 20800, token1Amount: 52000000 },
    lastUpdated: Date.now(),
    riskLevel: 'medium',
  },

  // High-Risk/High-Yield Pools
  {
    id: 'aerodrome-high-yield-1',
    name: 'New Token/USDC (Incentivized)',
    dex: 'Aerodrome',
    token0: { symbol: 'NEWT', address: '0x1234567890123456789012345678901234567890', decimals: 18, price: 0.10 },
    token1: { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b1566111578', decimals: 6, price: 1 },
    tvl: 5200000,
    volume24h: 850000,
    volume7d: 5950000,
    fee: 3000, // 0.30%
    apy: 125.6,
    apr: 58.3,
    liquidity: { token0Amount: 52000000, token1Amount: 5200000 },
    lastUpdated: Date.now(),
    riskLevel: 'high',
  },
];

// ============================================================================
// POOL DISCOVERY & FILTERING
// ============================================================================

/**
 * Get top pools sorted by TVL
 */
export const getTopPoolsByTVL = (limit: number = 10): LiquidityPool[] => {
  return LIQUIDITY_POOLS.sort((a, b) => b.tvl - a.tvl).slice(0, limit);
};

/**
 * Get top pools sorted by 24h volume
 */
export const getTopPoolsByVolume = (limit: number = 10): LiquidityPool[] => {
  return LIQUIDITY_POOLS.sort((a, b) => b.volume24h - a.volume24h).slice(0, limit);
};

/**
 * Get top pools sorted by APY
 */
export const getTopPoolsByAPY = (limit: number = 10): LiquidityPool[] => {
  return LIQUIDITY_POOLS.filter(p => p.riskLevel !== 'high') // Filter out high-risk by default
    .sort((a, b) => b.apy - a.apy)
    .slice(0, limit);
};

/**
 * Get pools by DEX
 */
export const getPoolsByDEX = (dex: string): LiquidityPool[] => {
  return LIQUIDITY_POOLS.filter(p => p.dex.toLowerCase() === dex.toLowerCase());
};

/**
 * Get pools by risk level
 */
export const getPoolsByRiskLevel = (riskLevel: string): LiquidityPool[] => {
  return LIQUIDITY_POOLS.filter(p => p.riskLevel === riskLevel);
};

/**
 * Search pools by token pair
 */
export const searchPoolsByTokenPair = (token0: string, token1: string): LiquidityPool[] => {
  const t0 = token0.toUpperCase();
  const t1 = token1.toUpperCase();

  return LIQUIDITY_POOLS.filter(p => {
    const match1 = (p.token0.symbol === t0 && p.token1.symbol === t1);
    const match2 = (p.token0.symbol === t1 && p.token1.symbol === t0);
    return match1 || match2;
  });
};

/**
 * Search pools by single token
 */
export const searchPoolsByToken = (symbol: string): LiquidityPool[] => {
  const s = symbol.toUpperCase();
  return LIQUIDITY_POOLS.filter(p => p.token0.symbol === s || p.token1.symbol === s);
};

/**
 * Advanced pool search with multiple filters
 */
export const searchPools = (params: PoolSearchParams): LiquidityPool[] => {
  let results = [...LIQUIDITY_POOLS];

  // Filter by token pair
  if (params.token0 && params.token1) {
    results = results.filter(p => {
      const match1 = (p.token0.symbol === params.token0!.toUpperCase() && p.token1.symbol === params.token1!.toUpperCase());
      const match2 = (p.token0.symbol === params.token1!.toUpperCase() && p.token1.symbol === params.token0!.toUpperCase());
      return match1 || match2;
    });
  } else if (params.token0) {
    results = results.filter(p => p.token0.symbol === params.token0!.toUpperCase() || p.token1.symbol === params.token0!.toUpperCase());
  }

  // Filter by DEX
  if (params.dex) {
    results = results.filter(p => p.dex.toLowerCase() === params.dex!.toLowerCase());
  }

  // Filter by TVL
  if (params.minTvl) {
    results = results.filter(p => p.tvl >= params.minTvl!);
  }
  if (params.maxTvl) {
    results = results.filter(p => p.tvl <= params.maxTvl!);
  }

  // Filter by APY
  if (params.minApy) {
    results = results.filter(p => p.apy >= params.minApy!);
  }

  // Sort
  const sortBy = params.sortBy || 'tvl';
  const order = params.order || 'desc';

  results.sort((a, b) => {
    let aValue = 0;
    let bValue = 0;

    switch (sortBy) {
      case 'tvl':
        aValue = a.tvl;
        bValue = b.tvl;
        break;
      case 'volume':
        aValue = a.volume24h;
        bValue = b.volume24h;
        break;
      case 'apy':
        aValue = a.apy;
        bValue = b.apy;
        break;
      case 'risk':
        const riskMap = { 'very-low': 0, 'low': 1, 'low-medium': 2, 'medium': 3, 'medium-high': 4, 'high': 5 };
        aValue = riskMap[a.riskLevel as keyof typeof riskMap] || 3;
        bValue = riskMap[b.riskLevel as keyof typeof riskMap] || 3;
        break;
    }

    return order === 'desc' ? bValue - aValue : aValue - bValue;
  });

  return results;
};

/**
 * Get pool by ID
 */
export const getPoolById = (poolId: string): LiquidityPool | null => {
  return LIQUIDITY_POOLS.find(p => p.id === poolId) || null;
};

/**
 * Get all pools
 */
export const getAllPools = (): LiquidityPool[] => {
  return LIQUIDITY_POOLS;
};

// ============================================================================
// APY CALCULATIONS
// ============================================================================

/**
 * Calculate APY with impermanent loss adjustment
 */
export const calculateRealAPY = (pool: LiquidityPool, volatility: number): number => {
  const il = calculateImpermanentLoss(volatility);
  return Math.max(0, pool.apy - il);
};

/**
 * Calculate impermanent loss based on price volatility
 * Higher volatility = higher IL risk
 */
export const calculateImpermanentLoss = (volatilityPercent: number): number => {
  // Formula: IL ≈ (2 * sqrt(volatility) - (1 + volatility)) * 100
  // This is a simplified approximation
  const v = volatilityPercent / 100;
  return Math.max(0, (2 * Math.sqrt(v) - (1 + v)) * 100);
};

/**
 * Calculate projected yield for investment amount
 */
export const calculateProjectedYield = (params: {
  poolId: string;
  investmentAmount: number;
  daysToInvest: number;
  volatility?: number;
}): YieldCalculation => {
  const pool = getPoolById(params.poolId);
  if (!pool) {
    throw new Error(`Pool ${params.poolId} not found`);
  }

  const apyRate = params.volatility
    ? calculateRealAPY(pool, params.volatility)
    : pool.apy;

  const dailyRate = apyRate / 365 / 100;
  const daysPeriod = params.daysToInvest;

  // Compound daily
  const projectedTotal = params.investmentAmount * Math.pow(1 + dailyRate, daysPeriod);
  const projectedYield = projectedTotal - params.investmentAmount;

  const il = params.volatility ? calculateImpermanentLoss(params.volatility) : 0;
  const netYield = projectedYield - (params.investmentAmount * il / 100);

  return {
    principalAmount: params.investmentAmount,
    apyRate,
    investmentPeriod: daysPeriod,
    compoundingFrequency: 'daily',
    projectedYield: Math.round(projectedYield * 100) / 100,
    projectedTotal: Math.round(projectedTotal * 100) / 100,
    impermanentLoss: Math.round(il * 100) / 100,
    netYield: Math.round(netYield * 100) / 100,
  };
};

/**
 * Compare multiple pools APY
 */
export const comparePoolAPY = (poolIds: string[]): Array<{ pool: string; apy: number; tvl: number }> => {
  return poolIds
    .map(id => {
      const pool = getPoolById(id);
      return pool ? { pool: pool.name, apy: pool.apy, tvl: pool.tvl } : null;
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .sort((a, b) => b.apy - a.apy);
};

/**
 * Get APY breakdown for a pool
 */
export const getAPYBreakdown = (poolId: string) => {
  const pool = getPoolById(poolId);
  if (!pool) throw new Error(`Pool ${poolId} not found`);

  const feeApy = pool.apr;
  const incentiveApy = pool.apy - pool.apr;

  return {
    pool: pool.name,
    feeApy: Math.round(feeApy * 100) / 100,
    incentiveApy: Math.round(incentiveApy * 100) / 100,
    totalApy: Math.round(pool.apy * 100) / 100,
    source: {
      fees: `Trading fees from the pool`,
      incentives: `Governance token rewards`,
    },
  };
};

// ============================================================================
// RISK ANALYSIS
// ============================================================================

/**
 * Calculate risk metrics for a pool
 */
export const calculateRiskMetrics = (pool: LiquidityPool, priceVolatility?: number): PoolAnalytics['riskMetrics'] => {
  const volatility = priceVolatility || 0.15; // Default 15% volatility
  const impermanentLoss = calculateImpermanentLoss(volatility * 100);

  // Calculate slippage based on liquidity and typical trade size
  const typicalTradeSize = pool.tvl * 0.01; // 1% of TVL
  const slippage = (typicalTradeSize / pool.tvl) * 100 * 0.5; // Simplified calculation

  // Risk score: 0-100
  // Based on: TVL (larger is safer), APY (higher yield = more risk), volatility, IL
  const tvlScore = Math.min(50, pool.tvl / 1000000); // 50 points for TVL
  const apyScore = Math.min(30, pool.apy / 10); // 30 points for APY
  const ilScore = Math.min(20, impermanentLoss); // 20 points for IL
  const riskScore = tvlScore + apyScore - ilScore;

  return {
    impermanentLoss: Math.round(impermanentLoss * 100) / 100,
    slippage: Math.round(slippage * 100) / 100,
    volatility: Math.round(volatility * 100 * 100) / 100,
    riskScore: Math.max(0, Math.min(100, Math.round(riskScore))),
  };
};

/**
 * Get detailed pool analytics
 */
export const getPoolAnalytics = (poolId: string, volatility?: number): PoolAnalytics => {
  const pool = getPoolById(poolId);
  if (!pool) throw new Error(`Pool ${poolId} not found`);

  const breakdown = getAPYBreakdown(poolId);
  const riskMetrics = calculateRiskMetrics(pool, volatility);

  const recommendations: string[] = [];

  if (pool.tvl < 1000000) {
    recommendations.push('⚠️ Low TVL pool - higher slippage and liquidity risk');
  }
  if (pool.apy > 50) {
    recommendations.push('🚨 Very high APY - verify incentive sustainability');
  }
  if (riskMetrics.impermanentLoss > 5) {
    recommendations.push('📊 Monitor price volatility - high IL risk');
  }
  if (pool.volume24h < pool.tvl * 0.1) {
    recommendations.push('📉 Low volume relative to TVL - limited liquidity');
  }
  if (riskMetrics.riskScore > 70) {
    recommendations.push('⚠️ High risk profile - suitable for experienced LPs only');
  } else if (riskMetrics.riskScore < 30) {
    recommendations.push('✅ Low risk profile - good for conservative LPs');
  }

  if (pool.apy > 15 && pool.tvl > 10000000 && riskMetrics.impermanentLoss < 3) {
    recommendations.push('💰 Good risk/reward balance');
  }

  return {
    pool,
    apyBreakdown: {
      feeApy: breakdown.feeApy,
      incentiveApy: breakdown.incentiveApy,
      totalApy: breakdown.totalApy,
    },
    riskMetrics,
    recommendations,
  };
};

/**
 * Calculate slippage for a trade
 */
export const calculateSlippage = (poolId: string, tradeAmount: number): { slippage: number; slippageAmount: number } => {
  const pool = getPoolById(poolId);
  if (!pool) throw new Error(`Pool ${poolId} not found`);

  // Simplified slippage calculation
  const liquidityDepth = Math.max(pool.token0.price * pool.liquidity.token0Amount, pool.token1.price * pool.liquidity.token1Amount);
  const slippagePercent = (tradeAmount / liquidityDepth) * 100 * 0.5;
  const slippageAmount = tradeAmount * (slippagePercent / 100);

  return {
    slippage: Math.round(slippagePercent * 10000) / 10000,
    slippageAmount: Math.round(slippageAmount * 100) / 100,
  };
};

/**
 * Get impermanent loss warning
 */
export const getImpermanentLossWarning = (pool: LiquidityPool, price0Change: number, price1Change: number): {
  warning: string;
  ilPercent: number;
  recommendation: string;
} => {
  // Price change ratio
  const priceRatio = (1 + price0Change / 100) / (1 + price1Change / 100);
  
  // Simplified IL calculation for this specific price change
  const il = (2 * Math.sqrt(priceRatio) - (1 + priceRatio)) * 100;

  let warning = '✅ Safe';
  let recommendation = 'Prices are stable';

  if (Math.abs(il) > 0.5 && Math.abs(il) <= 2) {
    warning = '⚠️ Moderate IL Risk';
    recommendation = 'Monitor position closely';
  } else if (Math.abs(il) > 2 && Math.abs(il) <= 5) {
    warning = '🔴 High IL Risk';
    recommendation = 'Consider reducing exposure';
  } else if (Math.abs(il) > 5) {
    warning = '🚨 Extreme IL Risk';
    recommendation = 'Exit position or rebalance immediately';
  }

  return {
    warning,
    ilPercent: Math.round(Math.abs(il) * 100) / 100,
    recommendation,
  };
};

// ============================================================================
// POOL STATISTICS
// ============================================================================

/**
 * Get DEX statistics
 */
export const getDEXStats = () => {
  const dexes = new Map<string, { tvl: number; volume24h: number; poolCount: number }>();

  LIQUIDITY_POOLS.forEach(pool => {
    if (!dexes.has(pool.dex)) {
      dexes.set(pool.dex, { tvl: 0, volume24h: 0, poolCount: 0 });
    }

    const stats = dexes.get(pool.dex)!;
    stats.tvl += pool.tvl;
    stats.volume24h += pool.volume24h;
    stats.poolCount += 1;
  });

  return Array.from(dexes.entries()).map(([dex, stats]) => ({
    dex,
    ...stats,
    volumeToTVL: Math.round((stats.volume24h / stats.tvl) * 365 * 100) / 100,
  }));
};

/**
 * Get overall market statistics
 */
export const getMarketStats = () => {
  let totalTVL = 0;
  let totalVolume24h = 0;
  let totalVolume7d = 0;
  let avgAPY = 0;

  LIQUIDITY_POOLS.forEach(pool => {
    totalTVL += pool.tvl;
    totalVolume24h += pool.volume24h;
    totalVolume7d += pool.volume7d;
    avgAPY += pool.apy;
  });

  const poolCount = LIQUIDITY_POOLS.length;
  avgAPY = avgAPY / poolCount;

  return {
    totalTVL: Math.round(totalTVL),
    totalVolume24h: Math.round(totalVolume24h),
    totalVolume7d: Math.round(totalVolume7d),
    poolCount,
    averageAPY: Math.round(avgAPY * 100) / 100,
    volumeToTVL: Math.round((totalVolume24h / totalTVL) * 365 * 100) / 100,
  };
};

/**
 * Get liquidity distribution by DEX
 */
export const getLiquidityDistribution = () => {
  const dexes = new Map<string, number>();

  LIQUIDITY_POOLS.forEach(pool => {
    dexes.set(pool.dex, (dexes.get(pool.dex) || 0) + pool.tvl);
  });

  return Array.from(dexes.entries())
    .map(([dex, tvl]) => ({
      dex,
      tvl: Math.round(tvl),
      percentage: Math.round((tvl / getMarketStats().totalTVL) * 100),
    }))
    .sort((a, b) => b.tvl - a.tvl);
};

/**
 * Get risk level distribution
 */
export const getRiskDistribution = () => {
  const riskLevels = new Map<string, number>();

  LIQUIDITY_POOLS.forEach(pool => {
    riskLevels.set(pool.riskLevel, (riskLevels.get(pool.riskLevel) || 0) + 1);
  });

  return Array.from(riskLevels.entries()).map(([level, count]) => ({
    riskLevel: level,
    poolCount: count,
    percentage: Math.round((count / LIQUIDITY_POOLS.length) * 100),
  }));
};

// ============================================================================
// POOL RECOMMENDATIONS
// ============================================================================

/**
 * Get recommended pools for conservative LP
 */
export const getConservativePoolsRecommendation = (limit: number = 5): LiquidityPool[] => {
  return LIQUIDITY_POOLS
    .filter(p => ['very-low', 'low'].includes(p.riskLevel))
    .sort((a, b) => b.apy - a.apy)
    .slice(0, limit);
};

/**
 * Get recommended pools for balanced LP
 */
export const getBalancedPoolsRecommendation = (limit: number = 5): LiquidityPool[] => {
  return LIQUIDITY_POOLS
    .filter(p => ['low-medium', 'medium'].includes(p.riskLevel) && p.apy >= 8 && p.apy <= 30)
    .sort((a, b) => b.apy - a.apy)
    .slice(0, limit);
};

/**
 * Get recommended pools for yield seeker
 */
export const getYieldSeekerPoolsRecommendation = (limit: number = 5): LiquidityPool[] => {
  return LIQUIDITY_POOLS
    .filter(p => p.apy > 30 && p.tvl > 5000000)
    .sort((a, b) => b.apy - a.apy)
    .slice(0, limit);
};

/**
 * Get portfolio recommendation based on user profile
 */
export const getPortfolioRecommendation = (profile: 'conservative' | 'balanced' | 'aggressive') => {
  const allocations = {
    conservative: [
      { pool: getConservativePoolsRecommendation(1)[0], weight: 0.5 },
      { pool: getConservativePoolsRecommendation(2)?.[1], weight: 0.5 },
    ],
    balanced: [
      { pool: getConservativePoolsRecommendation(1)[0], weight: 0.3 },
      { pool: getBalancedPoolsRecommendation(2)[0], weight: 0.4 },
      { pool: getBalancedPoolsRecommendation(2)?.[1], weight: 0.3 },
    ],
    aggressive: [
      { pool: getYieldSeekerPoolsRecommendation(1)[0], weight: 0.5 },
      { pool: getYieldSeekerPoolsRecommendation(2)[0], weight: 0.3 },
      { pool: getYieldSeekerPoolsRecommendation(3)?.[2], weight: 0.2 },
    ],
  };

  const recommendation = allocations[profile].filter(a => a.pool);
  
  let expectedAPY = 0;
  recommendation.forEach(item => {
    if (item.pool) expectedAPY += item.pool.apy * item.weight;
  });

  return {
    profile,
    allocation: recommendation.map(item => ({
      pool: item.pool?.name || 'N/A',
      dex: item.pool?.dex || 'N/A',
      weight: Math.round(item.weight * 100),
      apy: item.pool?.apy || 0,
    })),
    expectedPortfolioAPY: Math.round(expectedAPY * 100) / 100,
  };
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  getTopPoolsByTVL,
  getTopPoolsByVolume,
  getTopPoolsByAPY,
  getPoolsByDEX,
  getPoolsByRiskLevel,
  searchPoolsByTokenPair,
  searchPoolsByToken,
  searchPools,
  getPoolById,
  getAllPools,
  calculateRealAPY,
  calculateImpermanentLoss,
  calculateProjectedYield,
  comparePoolAPY,
  getAPYBreakdown,
  calculateRiskMetrics,
  getPoolAnalytics,
  calculateSlippage,
  getImpermanentLossWarning,
  getDEXStats,
  getMarketStats,
  getLiquidityDistribution,
  getRiskDistribution,
  getConservativePoolsRecommendation,
  getBalancedPoolsRecommendation,
  getYieldSeekerPoolsRecommendation,
  getPortfolioRecommendation,
} as const;
