/**
 * Base Chain Graph Queries
 * Queries for The Graph indexing on Base Chain
 * Provides data for DEX analytics, trading volumes, liquidity pools, etc.
 */

import { gql } from '@apollo/client';

// ============================================================================
// UNISWAP V3 QUERIES (Base Chain)
// ============================================================================

export const UNISWAP_V3_POOL_QUERY = gql`
  query GetPools($skip: Int, $first: Int) {
    pools(
      first: $first
      skip: $skip
      orderBy: volumeUSD
      orderDirection: desc
      subgraphError: allow
    ) {
      id
      token0 {
        id
        symbol
        name
        decimals
      }
      token1 {
        id
        symbol
        name
        decimals
      }
      feeTier
      liquidity
      sqrtPrice
      tick
      volumeUSD
      feesUSD
      txCount
      collectedFeesToken0
      collectedFeesToken1
    }
  }
`;

export const UNISWAP_V3_SWAP_QUERY = gql`
  query GetSwaps($poolId: String!, $skip: Int, $first: Int) {
    swaps(
      first: $first
      skip: $skip
      where: { pool: $poolId }
      orderBy: timestamp
      orderDirection: desc
      subgraphError: allow
    ) {
      id
      transaction {
        id
        blockNumber
        timestamp
      }
      sender
      recipient
      amount0
      amount1
      amountUSD
      sqrtPriceX96
      tick
      logIndex
    }
  }
`;

export const UNISWAP_V3_LIQUIDITY_QUERY = gql`
  query GetLiquidity($owner: String!) {
    positions(
      where: { owner: $owner }
      orderBy: liquidity
      orderDirection: desc
      subgraphError: allow
    ) {
      id
      nftId
      pool {
        id
        token0 {
          symbol
          decimals
        }
        token1 {
          symbol
          decimals
        }
        feeTier
      }
      tickLower
      tickUpper
      liquidity
      collectedFeesToken0
      collectedFeesToken1
    }
  }
`;

// ============================================================================
// AERODROME QUERIES (Base Native DEX)
// ============================================================================

export const AERODROME_POOLS_QUERY = gql`
  query GetAerodromePools($skip: Int, $first: Int) {
    pairs(
      first: $first
      skip: $skip
      orderBy: reserveUSD
      orderDirection: desc
      subgraphError: allow
    ) {
      id
      token0 {
        id
        symbol
        name
        decimals
      }
      token1 {
        id
        symbol
        name
        decimals
      }
      reserve0
      reserve1
      reserveUSD
      volumeUSD
      txCount
      stable
    }
  }
`;

export const AERODROME_SWAP_QUERY = gql`
  query GetAerodymeSwaps($pairId: String!, $skip: Int, $first: Int) {
    swaps(
      first: $first
      skip: $skip
      where: { pair: $pairId }
      orderBy: timestamp
      orderDirection: desc
      subgraphError: allow
    ) {
      id
      timestamp
      from
      to
      sender
      amount0In
      amount1In
      amount0Out
      amount1Out
      amountUSD
    }
  }
`;

// ============================================================================
// TOKEN QUERIES
// ============================================================================

export const TOKEN_PRICE_QUERY = gql`
  query GetTokenPrice($id: String!) {
    token(id: $id, subgraphError: allow) {
      id
      symbol
      name
      decimals
      derivedETH
      tradeVolume
      tradeVolumeUSD
      totalLiquidity
      totalLiquidityUSD
      txCount
    }
  }
`;

export const TOKENS_BY_VOLUME_QUERY = gql`
  query GetTopTokens($skip: Int, $first: Int) {
    tokens(
      first: $first
      skip: $skip
      orderBy: tradeVolumeUSD
      orderDirection: desc
      subgraphError: allow
    ) {
      id
      symbol
      name
      decimals
      tradeVolumeUSD
      totalLiquidityUSD
      txCount
    }
  }
`;

// ============================================================================
// TRANSACTION QUERIES
// ============================================================================

export const USER_TRANSACTIONS_QUERY = gql`
  query GetUserTransactions($user: String!, $skip: Int, $first: Int) {
    transactions(
      first: $first
      skip: $skip
      where: { user: $user }
      orderBy: timestamp
      orderDirection: desc
      subgraphError: allow
    ) {
      id
      timestamp
      blockNumber
      type
      amount
      amountUSD
      to
      from
    }
  }
`;

export const RECENT_TRANSACTIONS_QUERY = gql`
  query GetRecentTransactions($skip: Int, $first: Int) {
    transactions(
      first: $first
      skip: $skip
      orderBy: timestamp
      orderDirection: desc
      subgraphError: allow
    ) {
      id
      timestamp
      blockNumber
      type
      amountUSD
      from
      to
    }
  }
`;

// ============================================================================
// LIQUIDITY PROVIDER QUERIES
// ============================================================================

export const LP_POSITIONS_QUERY = gql`
  query GetLPPositions($address: String!) {
    liquidityPositions(
      where: { user: $address }
      subgraphError: allow
    ) {
      id
      user
      pair {
        id
        token0 {
          symbol
          decimals
        }
        token1 {
          symbol
          decimals
        }
        reserve0
        reserve1
        reserveUSD
      }
      liquidityTokenBalance
      liquidityTokenBalanceUSD
    }
  }
`;

export const LP_STATS_QUERY = gql`
  query GetLPStats($address: String!) {
    liquidityProvider(id: $address, subgraphError: allow) {
      id
      liquidityPositions {
        id
        liquidityTokenBalanceUSD
      }
      usdSwapped
    }
  }
`;

// ============================================================================
// MARKET DATA QUERIES
// ============================================================================

export const MARKET_DAY_DATA_QUERY = gql`
  query GetMarketDayData($skip: Int, $first: Int) {
    dayDatas(
      first: $first
      skip: $skip
      orderBy: date
      orderDirection: desc
      subgraphError: allow
    ) {
      id
      date
      volumeUSD
      txCount
      totalLiquidityUSD
    }
  }
`;

export const HOURLY_DATA_QUERY = gql`
  query GetHourlyData($startTime: Int!, $endTime: Int!) {
    hourDatas(
      where: {
        periodStartUnix_gte: $startTime
        periodStartUnix_lte: $endTime
      }
      orderBy: periodStartUnix
      orderDirection: asc
      subgraphError: allow
    ) {
      id
      periodStartUnix
      volumeUSD
      txCount
      totalLiquidityUSD
    }
  }
`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse pool data from The Graph
 */
export const parsePoolData = (pool: any) => {
  return {
    address: pool.id,
    token0: {
      address: pool.token0.id,
      symbol: pool.token0.symbol,
      name: pool.token0.name,
      decimals: pool.token0.decimals,
    },
    token1: {
      address: pool.token1.id,
      symbol: pool.token1.symbol,
      name: pool.token1.name,
      decimals: pool.token1.decimals,
    },
    fee: pool.feeTier,
    liquidity: pool.liquidity,
    volume24h: pool.volumeUSD,
    fees24h: pool.feesUSD,
    transactions: pool.txCount,
  };
};

/**
 * Parse swap data from The Graph
 */
export const parseSwapData = (swap: any) => {
  return {
    id: swap.id,
    timestamp: swap.transaction.timestamp,
    blockNumber: swap.transaction.blockNumber,
    sender: swap.sender,
    recipient: swap.recipient,
    amount0: swap.amount0,
    amount1: swap.amount1,
    amountUSD: swap.amountUSD,
  };
};

/**
 * Calculate price impact from swap
 */
export const calculatePriceImpact = (
  amountIn: number,
  amountOut: number,
  expectedOutput: number
): number => {
  const impact = ((expectedOutput - amountOut) / expectedOutput) * 100;
  return Math.max(0, impact);
};

/**
 * Calculate APY for liquidity provider
 */
export const calculateLPAPY = (
  feesEarned24h: number,
  totalLiquidity: number,
  days: number = 1
): number => {
  if (totalLiquidity === 0) return 0;
  const dailyReturn = feesEarned24h / totalLiquidity;
  const annualReturn = dailyReturn * 365;
  return annualReturn * 100;
};

/**
 * Calculate average price
 */
export const calculateAveragePrice = (
  reserves0: number,
  reserves1: number,
  decimals0: number,
  decimals1: number
): number => {
  const adjustedReserve0 = reserves0 / Math.pow(10, decimals0);
  const adjustedReserve1 = reserves1 / Math.pow(10, decimals1);
  return adjustedReserve1 / adjustedReserve0;
};

// ============================================================================
// EXPORTS
// ============================================================================

export const BASE_GRAPH_QUERIES = {
  // Uniswap V3
  UNISWAP_V3_POOL_QUERY,
  UNISWAP_V3_SWAP_QUERY,
  UNISWAP_V3_LIQUIDITY_QUERY,
  
  // Aerodrome
  AERODROME_POOLS_QUERY,
  AERODROME_SWAP_QUERY,
  
  // Tokens
  TOKEN_PRICE_QUERY,
  TOKENS_BY_VOLUME_QUERY,
  
  // Transactions
  USER_TRANSACTIONS_QUERY,
  RECENT_TRANSACTIONS_QUERY,
  
  // Liquidity
  LP_POSITIONS_QUERY,
  LP_STATS_QUERY,
  
  // Market
  MARKET_DAY_DATA_QUERY,
  HOURLY_DATA_QUERY,
  
  // Helpers
  parsePoolData,
  parseSwapData,
  calculatePriceImpact,
  calculateLPAPY,
  calculateAveragePrice,
};

export default BASE_GRAPH_QUERIES;
