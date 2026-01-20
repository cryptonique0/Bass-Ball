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
    // AMM DEXs
    UNISWAP_V3: {
      name: 'Uniswap V3',
      url: 'https://app.uniswap.org',
      router: '0x2626664c2b8576550740a7c3e8d93b44fdf31e32',
      factory: '0x33128a8fC17869897dcE68Ed026d694621f6FDaD',
      type: 'AMM',
      tvl: '450M+',
      volume24h: '80M+',
      supported: true,
    },
    AERODROME: {
      name: 'Aerodrome Finance',
      url: 'https://aerodrome.finance',
      router: '0xcF77a3Ba9A5CA922fB7c40eb8D5039056eA385B8',
      factory: '0x420DD5456806D6347BB051413C6F13EFAd94da20',
      type: 'Velodrome Fork',
      tvl: '200M+',
      volume24h: '40M+',
      supported: true,
    },
    PANCAKESWAP_V3: {
      name: 'PancakeSwap V3',
      url: 'https://pancakeswap.finance',
      router: '0x1b81D678ffb9C0263b24A97847620C99d213eB14',
      factory: '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
      type: 'AMM',
      tvl: '150M+',
      volume24h: '30M+',
      supported: true,
    },
    CURVE_FINANCE: {
      name: 'Curve Finance',
      url: 'https://curve.fi',
      router: '0x0c59d36b23f809f8b6C674E3E1B53CaAdc1d5d1a',
      factory: '0xF18056Bbd320E96A48e3519423d0aE4E2f47a6c0',
      type: 'Stablecoin DEX',
      tvl: '100M+',
      volume24h: '20M+',
      supported: true,
    },
    BALANCER: {
      name: 'Balancer',
      url: 'https://balancer.fi',
      router: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
      factory: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
      type: 'Liquidity Pools',
      tvl: '80M+',
      volume24h: '15M+',
      supported: true,
    },
    YUPPY_SWAP: {
      name: 'Yuppy Swap',
      url: 'https://yuppy.io',
      router: '0xC4D6f8f2aa8dA9A6F1b5E9b3e1f0f8d3b9a8c7d6',
      type: 'DEX Aggregator',
      tvl: '50M+',
      volume24h: '10M+',
      supported: true,
    },
    THRUSTER: {
      name: 'Thruster',
      url: 'https://thruster.finance',
      router: '0x98994a9A7b2788990C78f11A3470bB50586cE1d2',
      factory: '0x2E2E80a5A4A6fb905e7b7eF99fE95c58c8D8BC54',
      type: 'DEX',
      tvl: '60M+',
      volume24h: '12M+',
      supported: true,
    },
    ALIEN_BASE: {
      name: 'Alien Base',
      url: 'https://alienbase.xyz',
      router: '0x8cFe327CfF474E41eFFE1A9a22f917CFFaEd379B',
      type: 'DEX',
      tvl: '40M+',
      volume24h: '8M+',
      supported: true,
    },
    MOONSWAP: {
      name: 'MoonSwap',
      url: 'https://moonswap.io',
      router: '0x18556DA3B851Dff6e1f14e0F7c8e0e3e8e2c6b4d',
      type: 'AMM',
      tvl: '30M+',
      volume24h: '5M+',
      supported: true,
    },
    METAMASK_SWAP: {
      name: 'MetaMask Swap',
      url: 'https://metamask.io/swaps',
      type: 'DEX Aggregator',
      tvl: 'N/A',
      volume24h: 'N/A',
      supported: true,
    },
    ONE_INCH: {
      name: '1inch',
      url: 'https://1inch.io',
      type: 'DEX Aggregator',
      tvl: 'N/A',
      volume24h: 'N/A',
      supported: true,
    },
    COWSWAP: {
      name: 'CoW Swap',
      url: 'https://cow.fi',
      type: 'Intent DEX',
      tvl: '25M+',
      volume24h: '5M+',
      supported: true,
    },
    // Specialized DEXs
    SYNTHETIX: {
      name: 'Synthetix',
      url: 'https://synthetix.io',
      router: '0x1b81D678ffb9C0263b24A97847620C99d213eB14',
      type: 'Synthetic Assets',
      tvl: '20M+',
      volume24h: '3M+',
      supported: true,
    },
    VELODROME_FORK: {
      name: 'Velodrome Base Fork',
      url: 'https://velodrome.finance',
      router: '0x6Fc6F4B7f0D58d5C78cf6e7eC5FE0a0c8e2b8f7d',
      type: 'Velodrome Fork',
      tvl: '70M+',
      volume24h: '14M+',
      supported: true,
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
export const getBaseDexs = (filter?: { type?: string; supported?: boolean }) => {
  return Object.entries(BASE_ECOSYSTEM.DEXS)
    .map(([key, dex]) => ({
      id: key,
      ...dex,
    }))
    .filter(dex => {
      if (filter?.type && dex.type !== filter.type) return false;
      if (filter?.supported !== undefined && dex.supported !== filter.supported) return false;
      return true;
    })
    .sort((a, b) => {
      // Sort by TVL if available
      const aTvl = parseInt(a.tvl?.replace(/[M+]/g, '') || '0');
      const bTvl = parseInt(b.tvl?.replace(/[M+]/g, '') || '0');
      return bTvl - aTvl;
    });
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
 * Get all DEX types available on Base
 */
export const getBaseDexTypes = (): string[] => {
  const types = new Set<string>();
  Object.values(BASE_ECOSYSTEM.DEXS).forEach(dex => {
    if (dex.type) types.add(dex.type);
  });
  return Array.from(types);
};

/**
 * Get DEXs by type (e.g., 'AMM', 'DEX Aggregator', etc.)
 */
export const getDexsByType = (type: string) => {
  return getBaseDexs({ type });
};

/**
 * Get all AMM DEXs on Base
 */
export const getBaseAMMs = () => {
  return getBaseDexs({ type: 'AMM' });
};

/**
 * Get all DEX aggregators on Base
 */
export const getBaseDexAggregators = () => {
  return getBaseDexs({ type: 'DEX Aggregator' });
};

/**
 * Get DEX by ID
 */
export const getBaseDexById = (id: string) => {
  const dexKey = id.toUpperCase() as keyof typeof BASE_ECOSYSTEM.DEXS;
  const dex = BASE_ECOSYSTEM.DEXS[dexKey];
  if (!dex) {
    throw new Error(`DEX ${id} not found on Base`);
  }
  return {
    id: dexKey,
    ...dex,
  };
};

/**
 * Get top DEXs by TVL
 */
export const getTopDexsByTVL = (limit: number = 5) => {
  return getBaseDexs()
    .sort((a, b) => {
      const aTvl = parseInt(a.tvl?.replace(/[M+]/g, '') || '0');
      const bTvl = parseInt(b.tvl?.replace(/[M+]/g, '') || '0');
      return bTvl - aTvl;
    })
    .slice(0, limit);
};

/**
 * Get top DEXs by 24h volume
 */
export const getTopDexsByVolume = (limit: number = 5) => {
  return getBaseDexs()
    .sort((a, b) => {
      const aVol = parseInt(a.volume24h?.replace(/[M+]/g, '') || '0');
      const bVol = parseInt(b.volume24h?.replace(/[M+]/g, '') || '0');
      return bVol - aVol;
    })
    .slice(0, limit);
};

/**
 * Check if DEX is supported
 */
export const isBaseDexSupported = (dexId: string): boolean => {
  try {
    const dex = getBaseDexById(dexId);
    return dex.supported === true;
  } catch {
    return false;
  }
};

/**
 * Get total TVL across all DEXs on Base
 */
export const getTotalBaseDexTVL = (): { totalTVL: string; dexCount: number } => {
  const dexs = getBaseDexs();
  let totalTvl = 0;

  dexs.forEach(dex => {
    const tvl = parseInt(dex.tvl?.replace(/[M+]/g, '') || '0');
    totalTvl += tvl;
  });

  return {
    totalTVL: `${totalTvl}M+`,
    dexCount: dexs.length,
  };
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
  getBaseDexTypes,
  getDexsByType,
  getBaseAMMs,
  getBaseDexAggregators,
  getBaseDexById,
  getTopDexsByTVL,
  getTopDexsByVolume,
  isBaseDexSupported,
  getTotalBaseDexTVL,
  getBridgeUrl,
  getSwapUrl,
  getBaseEcosystemHealth,
  convertEthereumToBaseValue,
};
