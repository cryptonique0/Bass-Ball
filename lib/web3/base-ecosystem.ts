/**
 * Base Ecosystem Integration Library
 * Comprehensive utilities for interacting with Base Chain ecosystem
 * Includes bridges, swaps, liquidity pools, and ecosystem services
 */

import { createPublicClient, createWalletClient, http, parseUnits, formatUnits } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// ============================================================================
// BASE ECOSYSTEM CONSTANTS
// ============================================================================

export const BASE_ECOSYSTEM = {
  // Bridges
  BRIDGES: {
    STARGATE: {
      name: 'Stargate Finance',
      url: 'https://stargate.finance',
      chainId: 8453,
      lzEndpoint: '0xb6319cC6c8c27A8F5dAF0DD3DF91EA35C4720dd7',
    },
    ACROSS: {
      name: 'Across Protocol',
      url: 'https://across.to',
      chainId: 8453,
    },
    OPTIMISM: {
      name: 'Optimism Bridge',
      url: 'https://app.optimism.io/bridge',
      chainId: 8453,
    },
  },

  // DEXs on Base
  DEXS: {
    UNISWAP_V3: {
      name: 'Uniswap V3',
      router: '0x2626664c2b8576550740a7c3e8d93b44fdf31e32',
      factory: '0x33128a8fC17869897dcE68Ed026d694621f6FDaD',
    },
    AERODROME: {
      name: 'Aerodrome Finance',
      router: '0xcF77a3Ba9A5CA922fB7c40eb8D5039056eA385B8',
      factory: '0x420DD5456806D6347BB051413C6F13EFAd94da20',
    },
    PANCAKESWAP_V3: {
      name: 'PancakeSwap V3',
      router: '0x1b81D678ffb9C0263b24A97847620C99d213eB14',
    },
  },

  // Tokens
  TOKENS: {
    ETH: {
      symbol: 'ETH',
      decimals: 18,
      address: '0x0000000000000000000000000000000000000000', // Native
    },
    USDC: {
      symbol: 'USDC',
      decimals: 6,
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b1566111578',
    },
    USDT: {
      symbol: 'USDT',
      decimals: 6,
      address: '0xfde4C96c8593536E31F26A3d5f51B3b0FA7C00B1',
    },
    DAI: {
      symbol: 'DAI',
      decimals: 18,
      address: '0x50c5725949A6F0c72E6C4a641F14122319E53ffc',
    },
    CBETH: {
      symbol: 'cbETH',
      decimals: 18,
      address: '0x2Ae3F1Ec7F1F5012CFEab0411dC8C84497535e73',
    },
  },

  // Services
  SERVICES: {
    THE_GRAPH: {
      endpoint: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-base',
      explorer: 'https://thegraph.com/explorer?chain=base',
    },
    BASESCAN: {
      url: 'https://basescan.org',
      api: 'https://api.basescan.org/api',
    },
    COINBASE_COMMERCE: {
      name: 'Coinbase Commerce',
      url: 'https://commerce.coinbase.com',
    },
  },

  // RPC Endpoints
  RPC: {
    MAINNET: 'https://mainnet.base.org',
    SEPOLIA: 'https://sepolia.base.org',
    ANKR: 'https://rpc.ankr.com/base',
    CHAINSTACK: 'https://base-mainnet.blastapi.io',
  },
} as const;

// ============================================================================
// BASE CHAIN CLIENTS
// ============================================================================

export const createBaseClients = (rpcUrl?: string) => {
  const publicClient = createPublicClient({
    chain: base,
    transport: http(rpcUrl || BASE_ECOSYSTEM.RPC.MAINNET),
  });

  return { publicClient };
};

export const createBaseWalletClient = (privateKey: `0x${string}`, rpcUrl?: string) => {
  const account = privateKeyToAccount(privateKey);
  
  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(rpcUrl || BASE_ECOSYSTEM.RPC.MAINNET),
  });

  return { walletClient, account };
};

// ============================================================================
// BASE ECOSYSTEM UTILITIES
// ============================================================================

/**
 * Get Base network statistics
 */
export const getBaseNetworkStats = async () => {
  const { publicClient } = createBaseClients();

  try {
    const blockNumber = await publicClient.getBlockNumber();
    const gasPrice = await publicClient.getGasPrice();
    const chainId = await publicClient.getChainId();

    return {
      chainId,
      blockNumber: Number(blockNumber),
      gasPrice: formatUnits(gasPrice, 'gwei'),
      isBase: chainId === 8453,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching Base network stats:', error);
    throw error;
  }
};

/**
 * Check if token is on Base
 */
export const isTokenOnBase = (tokenSymbol: string): boolean => {
  return tokenSymbol in BASE_ECOSYSTEM.TOKENS;
};

/**
 * Get token details on Base
 */
export const getBaseTokenDetails = (tokenSymbol: string) => {
  const token = BASE_ECOSYSTEM.TOKENS[tokenSymbol as keyof typeof BASE_ECOSYSTEM.TOKENS];
  if (!token) {
    throw new Error(`Token ${tokenSymbol} not found on Base`);
  }
  return token;
};

/**
 * Format token amount
 */
export const formatBaseTokenAmount = (
  amount: string | number | bigint,
  decimals: number
): string => {
  return formatUnits(BigInt(amount), decimals);
};

/**
 * Parse token amount
 */
export const parseBaseTokenAmount = (
  amount: string | number,
  decimals: number
): bigint => {
  return parseUnits(amount.toString(), decimals);
};

/**
 * Get Base gas price estimation
 */
export const estimateBaseGasPrice = async (): Promise<{
  gasPrice: string;
  priceInUSD: string;
  recommendation: 'low' | 'standard' | 'fast';
}> => {
  const { publicClient } = createBaseClients();

  try {
    const gasPrice = await publicClient.getGasPrice();
    const gasPriceGwei = parseFloat(formatUnits(gasPrice, 'gwei'));

    // Base average gas price (usually 0.01-0.1 Gwei)
    let recommendation: 'low' | 'standard' | 'fast' = 'standard';
    if (gasPriceGwei < 0.05) recommendation = 'low';
    if (gasPriceGwei > 0.15) recommendation = 'fast';

    // Rough ETH price (would use oracle in production)
    const ethPrice = 2500; // Example price
    const costPerTx = gasPriceGwei * 21000 * (ethPrice / 1e9); // Basic tx

    return {
      gasPrice: gasPriceGwei.toFixed(4),
      priceInUSD: costPerTx.toFixed(2),
      recommendation,
    };
  } catch (error) {
    console.error('Error estimating Base gas price:', error);
    throw error;
  }
};

/**
 * Calculate savings compared to Ethereum L1
 */
export const calculateBaseSavings = (l1GasPrice: number, txComplexity: 'simple' | 'complex' = 'simple'): {
  l1Cost: number;
  baseCost: number;
  savings: number;
  savingsPercent: number;
} => {
  // Base average gas price
  const baseGasPrice = 0.05; // Gwei
  
  // Typical gas usage
  const gasUsage = txComplexity === 'simple' ? 21000 : 100000;
  
  // Simple tx costs
  const ethPrice = 2500;
  const l1Cost = (l1GasPrice * gasUsage * ethPrice) / 1e9;
  const baseCost = (baseGasPrice * gasUsage * ethPrice) / 1e9;
  const savings = l1Cost - baseCost;
  const savingsPercent = (savings / l1Cost) * 100;

  return {
    l1Cost: parseFloat(l1Cost.toFixed(2)),
    baseCost: parseFloat(baseCost.toFixed(2)),
    savings: parseFloat(savings.toFixed(2)),
    savingsPercent: parseFloat(savingsPercent.toFixed(1)),
  };
};

// ============================================================================
// BASE ECOSYSTEM SERVICES
// ============================================================================

/**
 * Get Base ecosystem bridges info
 */
export const getBaseBridges = () => {
  return Object.entries(BASE_ECOSYSTEM.BRIDGES).map(([key, bridge]) => ({
    id: key,
    ...bridge,
  }));
};

/**
 * Get Base DEX info
 */
export const getBaseDexs = () => {
  return Object.entries(BASE_ECOSYSTEM.DEXS).map(([key, dex]) => ({
    id: key,
    ...dex,
  }));
};

/**
 * Get Base services info
 */
export const getBaseServices = () => {
  return Object.entries(BASE_ECOSYSTEM.SERVICES).map(([key, service]) => ({
    id: key,
    ...service,
  }));
};

/**
 * Build bridge URL for asset
 */
export const getBridgeUrl = (
  bridge: keyof typeof BASE_ECOSYSTEM.BRIDGES,
  token?: string,
  amount?: string
): string => {
  const bridgeData = BASE_ECOSYSTEM.BRIDGES[bridge];
  let url = bridgeData.url;

  if (token && amount) {
    url += `?token=${token}&amount=${amount}&toChain=8453`;
  }

  return url;
};

/**
 * Build swap URL for token pair
 */
export const getSwapUrl = (
  dex: keyof typeof BASE_ECOSYSTEM.DEXS,
  fromToken: string,
  toToken: string,
  amount?: string
): string => {
  const dexData = BASE_ECOSYSTEM.DEXS[dex];
  
  // Format parameters based on DEX
  let params = `inputCurrency=${BASE_ECOSYSTEM.TOKENS[fromToken as keyof typeof BASE_ECOSYSTEM.TOKENS]?.address || ''}&outputCurrency=${BASE_ECOSYSTEM.TOKENS[toToken as keyof typeof BASE_ECOSYSTEM.TOKENS]?.address || ''}`;
  
  if (amount) {
    params += `&exactAmount=${amount}`;
  }

  if (dex === 'UNISWAP_V3') {
    return `https://app.uniswap.org/swap?chain=base&${params}`;
  } else if (dex === 'AERODROME') {
    return `https://aerodrome.finance/swap?${params}`;
  }

  return '';
};

// ============================================================================
// BASE ECOSYSTEM MONITORING
// ============================================================================

/**
 * Get Base ecosystem health
 */
export const getBaseEcosystemHealth = async (): Promise<{
  status: 'healthy' | 'degraded' | 'down';
  blockTime: number;
  gasPrice: string;
  tvl: string;
  activeDexs: number;
  lastUpdated: string;
}> => {
  try {
    const stats = await getBaseNetworkStats();
    const { gasPrice } = await estimateBaseGasPrice();

    // TVL data would come from DeFi Llama API in production
    return {
      status: 'healthy',
      blockTime: 2, // Base's standard block time
      gasPrice,
      tvl: '2.5B', // Placeholder
      activeDexs: 5,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error checking Base ecosystem health:', error);
    return {
      status: 'down',
      blockTime: 0,
      gasPrice: '0',
      tvl: '0',
      activeDexs: 0,
      lastUpdated: new Date().toISOString(),
    };
  }
};

/**
 * Convert amount from Ethereum to Base equivalent
 * (useful for cross-chain pricing)
 */
export const convertEthereumToBaseValue = async (
  ethereumAmount: number
): Promise<{
  ethereumAmount: number;
  baseEquivalent: number;
  gasFeeDifference: string;
}> => {
  const l1Price = 50; // Example L1 gas price in Gwei
  const savings = calculateBaseSavings(l1Price, 'complex');

  return {
    ethereumAmount,
    baseEquivalent: ethereumAmount - savings.savingsPercent / 100,
    gasFeeDifference: `-${savings.savingsPercent.toFixed(1)}%`,
  };
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  BASE_ECOSYSTEM,
  createBaseClients,
  createBaseWalletClient,
  getBaseNetworkStats,
  isTokenOnBase,
  getBaseTokenDetails,
  formatBaseTokenAmount,
  parseBaseTokenAmount,
  estimateBaseGasPrice,
  calculateBaseSavings,
  getBaseBridges,
  getBaseDexs,
  getBaseServices,
  getBridgeUrl,
  getSwapUrl,
  getBaseEcosystemHealth,
  convertEthereumToBaseValue,
};
