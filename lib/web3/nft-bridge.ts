/**
 * Bass Ball NFT Bridge Support
 * Cross-chain NFT transfers and liquidity through Wormhole and Stargate
 * 
 * Features:
 * - Wormhole NFT bridge for cross-chain transfers
 * - Stargate NFT bridge for liquidity pools
 * - Bass Ball NFT specific support
 * - Cross-chain bridging status
 * - NFT liquidity management
 * - Bridge fee optimization
 */

import { Address, parseUnits, formatUnits } from 'viem';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type NFTBridgeProtocol = 'wormhole' | 'stargate';
export type BridgeStatus = 'pending' | 'confirmed' | 'finalized' | 'failed' | 'completed';
export type NFTType = 'player-stats' | 'achievement' | 'cosmetic' | 'formation' | 'limited-edition';

export interface NFTBridgeConfig {
  protocol: NFTBridgeProtocol;
  name: string;
  description: string;
  sourceChain: number;
  destinationChain: number;
  contractAddress: Address;
  minFeePercentage: number;
  estimatedTime: number; // seconds
  supported: boolean;
  maxNFTsPerBatch: number;
}

export interface BassBallNFT {
  id: string;
  tokenId: bigint;
  type: NFTType;
  owner: Address;
  metadata: {
    name: string;
    description: string;
    imageUrl: string;
    attributes: Record<string, string | number>;
  };
  chainId: number;
  contractAddress: Address;
  mintedAt: number;
  value: bigint; // in wei
}

export interface NFTBridgeRequest {
  id: string;
  nft: BassBallNFT;
  protocol: NFTBridgeProtocol;
  sourceChain: number;
  destinationChain: number;
  recipient: Address;
  status: BridgeStatus;
  createdAt: number;
  updatedAt: number;
  txHash?: string;
  bridgeTxHash?: string;
  estimatedArrival?: number;
  fee: bigint;
  feePercentage: number;
}

export interface NFTLiquidityPool {
  id: string;
  name: string;
  protocol: NFTBridgeProtocol;
  nftType: NFTType;
  totalNFTs: number;
  totalValue: bigint;
  apy: number;
  liquidity: bigint;
  chain: number;
  owner?: Address;
  createdAt: number;
  volume24h: bigint;
  fees24h: bigint;
}

export interface WormholeConfig {
  name: string;
  description: string;
  chainId: number;
  tokenBridge: Address;
  nftBridge: Address;
  coreBridge: Address;
  consistencyLevel: number;
  supported: boolean;
}

export interface StargateConfig {
  name: string;
  description: string;
  chainId: number;
  router: Address;
  stargatePool: Address;
  poolId: number;
  supportedChains: number[];
  supported: boolean;
}

export interface BridgeTransaction {
  id: string;
  nftId: string;
  protocol: NFTBridgeProtocol;
  fromChain: number;
  toChain: number;
  sender: Address;
  recipient: Address;
  status: BridgeStatus;
  fee: bigint;
  timestamp: number;
  txHash?: string;
  confirmations: number;
  requiredConfirmations: number;
  failureReason?: string;
}

export interface NFTBridgeMetrics {
  totalBridged: number;
  totalVolume: bigint;
  avgBridgeTime: number;
  successRate: number;
  wormholeVolume: bigint;
  stargateVolume: bigint;
  activeRequests: number;
  failedRequests: number;
}

// ============================================================================
// WORMHOLE CONFIGURATION
// ============================================================================

export const WORMHOLE_CHAINS: Record<number, WormholeConfig> = {
  1: {
    name: 'Ethereum',
    description: 'Ethereum Mainnet',
    chainId: 1,
    tokenBridge: '0x3ee18B2214AFF97000D974cf647E7C347E8fa585',
    nftBridge: '0x6FFdb75c91be862E1ef2511abC7c0733986fDaea',
    coreBridge: '0x98f3c9e6E3fAce36bAAd05e5ca6EB53f926F41De',
    consistencyLevel: 15,
    supported: true,
  },
  10: {
    name: 'Optimism',
    description: 'OP Mainnet',
    chainId: 10,
    tokenBridge: '0x1D68124e65faEC6876DaD0eCb6d93c9f0529ABD7',
    nftBridge: '0x3ee18B2214AFF97000D974cf647E7C347E8fa585',
    coreBridge: '0x39eE18a08B7e34F0EA4A4ecA0c1b0f7ac1e62e14',
    consistencyLevel: 200,
    supported: true,
  },
  42161: {
    name: 'Arbitrum',
    description: 'Arbitrum One',
    chainId: 42161,
    tokenBridge: '0x0b9031F06cEBaC1830555eD1bEae6ae1344bB49E',
    nftBridge: '0x3ee18B2214AFF97000D974cf647E7C347E8fa585',
    coreBridge: '0xa5B6beab6054435A968d5618E7DfA7e9b3a4ffc0',
    consistencyLevel: 200,
    supported: true,
  },
  8453: {
    name: 'Base',
    description: 'Base Chain',
    chainId: 8453,
    tokenBridge: '0x27428DD2d3DD076CA8e4Ac169fEdeE0B7ab118e8',
    nftBridge: '0x1D68124e65faEC6876DaD0eCb6d93c9f0529ABD7',
    coreBridge: '0xbebdb6C40bdb1E8f0Ee339B21503A22cD1956d7f',
    consistencyLevel: 200,
    supported: true,
  },
  137: {
    name: 'Polygon',
    description: 'Polygon Network',
    chainId: 137,
    tokenBridge: '0x0b9031F06cEBaC1830555eD1bEae6ae1344bB49E',
    nftBridge: '0x0b9031F06cEBaC1830555eD1bEae6ae1344bB49E',
    coreBridge: '0x7A4B5a56256163F07b2C2c2dAe25173379ebF175',
    consistencyLevel: 512,
    supported: true,
  },
};

// ============================================================================
// STARGATE CONFIGURATION
// ============================================================================

export const STARGATE_CHAINS: Record<number, StargateConfig> = {
  1: {
    name: 'Ethereum',
    description: 'Ethereum Mainnet',
    chainId: 1,
    router: '0x8731d54E9D02c286e8E619ECf6eac21f4B4F37ea',
    stargatePool: '0x50aaab327b1d5b8534594362ab8db3c987ecc68f',
    poolId: 13,
    supportedChains: [10, 42161, 8453, 137],
    supported: true,
  },
  10: {
    name: 'Optimism',
    description: 'OP Mainnet',
    chainId: 10,
    router: '0xB0D502E938ed5f4df2E681fE6E419ff29c9EA83d5',
    stargatePool: '0xe8Cdf27AcD73a434541e161B9122D937c6F6eA7F',
    poolId: 13,
    supportedChains: [1, 42161, 8453, 137],
    supported: true,
  },
  42161: {
    name: 'Arbitrum',
    description: 'Arbitrum One',
    chainId: 42161,
    router: '0x53Bf833A5d6c4ddA888F69c22C88C9f356a0ee0d',
    stargatePool: '0x892785f33CDEaF4830c8C1a1eb0ad5eAc4070D46',
    poolId: 1,
    supportedChains: [1, 10, 8453, 137],
    supported: true,
  },
  8453: {
    name: 'Base',
    description: 'Base Chain',
    chainId: 8453,
    router: '0x45f1A3183c05eC9cDa54B25da5da28f25464Ee835',
    stargatePool: '0x27a16dc789421c57144930881b8ba652146b16b1',
    poolId: 1,
    supportedChains: [1, 10, 42161, 137],
    supported: true,
  },
  137: {
    name: 'Polygon',
    description: 'Polygon Network',
    chainId: 137,
    router: '0x45f1A3183c05eC9cDa54B25da5da28f25464Ee835',
    stargatePool: '0x0b9031F06cEBaC1830555eD1bEae6ae1344bB49E',
    poolId: 1,
    supportedChains: [1, 10, 42161, 8453],
    supported: true,
  },
};

// ============================================================================
// BASS BALL NFT CONTRACTS
// ============================================================================

export const BASS_BALL_NFT_CONTRACTS: Record<NFTType, Address> = {
  'player-stats': '0x1234567890123456789012345678901234567890',
  'achievement': '0x1111111111111111111111111111111111111111',
  'cosmetic': '0x2222222222222222222222222222222222222222',
  'formation': '0x3333333333333333333333333333333333333333',
  'limited-edition': '0x4444444444444444444444444444444444444444',
};

// ============================================================================
// WORMHOLE FUNCTIONS
// ============================================================================

/**
 * Get Wormhole config for chain
 */
export function getWormholeConfig(chainId: number): WormholeConfig | undefined {
  return WORMHOLE_CHAINS[chainId];
}

/**
 * Get all supported Wormhole chains
 */
export function getWormholeSupportedChains(): number[] {
  return Object.values(WORMHOLE_CHAINS)
    .filter(config => config.supported)
    .map(config => config.chainId);
}

/**
 * Create Wormhole NFT bridge request
 */
export function createWormholeNFTBridgeRequest(
  nft: BassBallNFT,
  destinationChain: number,
  recipient: Address
): NFTBridgeRequest {
  const sourceChain = nft.chainId;
  const sourceConfig = getWormholeConfig(sourceChain);
  const destConfig = getWormholeConfig(destinationChain);

  if (!sourceConfig || !destConfig) {
    throw new Error(`Wormhole not supported on chain ${sourceChain} or ${destinationChain}`);
  }

  const feePercentage = 0.25; // 0.25% fee
  const fee = (nft.value * BigInt(25)) / BigInt(10000);

  return {
    id: `wormhole-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    nft,
    protocol: 'wormhole',
    sourceChain,
    destinationChain,
    recipient,
    status: 'pending',
    createdAt: Math.floor(Date.now() / 1000),
    updatedAt: Math.floor(Date.now() / 1000),
    fee,
    feePercentage,
  };
}

/**
 * Estimate Wormhole bridge time
 */
export function estimateWormholeBridgeTime(sourceChain: number, destChain: number): number {
  // Wormhole typically takes 15 minutes to 1 hour depending on guardians
  const baseTime = 900; // 15 minutes
  const variability = Math.random() * 1800; // +0-30 minutes
  return baseTime + variability;
}

/**
 * Get Wormhole bridge status
 */
export function getWormholeBridgeStatus(
  request: NFTBridgeRequest
): { status: BridgeStatus; progress: number; estimatedCompletion?: number } {
  const now = Math.floor(Date.now() / 1000);
  const elapsed = now - request.createdAt;
  const estimatedTime = estimateWormholeBridgeTime(request.sourceChain, request.destinationChain);

  let status: BridgeStatus = 'pending';
  let progress = 0;

  if (elapsed < estimatedTime * 0.25) {
    status = 'pending';
    progress = 25;
  } else if (elapsed < estimatedTime * 0.5) {
    status = 'confirmed';
    progress = 50;
  } else if (elapsed < estimatedTime * 0.75) {
    status = 'finalized';
    progress = 75;
  } else {
    status = 'completed';
    progress = 100;
  }

  return {
    status,
    progress,
    estimatedCompletion: request.createdAt + estimatedTime,
  };
}

// ============================================================================
// STARGATE FUNCTIONS
// ============================================================================

/**
 * Get Stargate config for chain
 */
export function getStargateConfig(chainId: number): StargateConfig | undefined {
  return STARGATE_CHAINS[chainId];
}

/**
 * Get all supported Stargate chains
 */
export function getStargateSupportedChains(): number[] {
  return Object.values(STARGATE_CHAINS)
    .filter(config => config.supported)
    .map(config => config.chainId);
}

/**
 * Create Stargate NFT bridge request
 */
export function createStargateNFTBridgeRequest(
  nft: BassBallNFT,
  destinationChain: number,
  recipient: Address
): NFTBridgeRequest {
  const sourceChain = nft.chainId;
  const sourceConfig = getStargateConfig(sourceChain);
  const destConfig = getStargateConfig(destinationChain);

  if (!sourceConfig || !destConfig) {
    throw new Error(`Stargate not supported on chain ${sourceChain} or ${destinationChain}`);
  }

  if (!sourceConfig.supportedChains.includes(destinationChain)) {
    throw new Error(`Stargate does not support route from ${sourceChain} to ${destinationChain}`);
  }

  const feePercentage = 0.15; // 0.15% fee (cheaper than Wormhole)
  const fee = (nft.value * BigInt(15)) / BigInt(10000);

  return {
    id: `stargate-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    nft,
    protocol: 'stargate',
    sourceChain,
    destinationChain,
    recipient,
    status: 'pending',
    createdAt: Math.floor(Date.now() / 1000),
    updatedAt: Math.floor(Date.now() / 1000),
    fee,
    feePercentage,
  };
}

/**
 * Estimate Stargate bridge time
 */
export function estimateStargateBridgeTime(sourceChain: number, destChain: number): number {
  // Stargate is typically faster, 2-10 minutes
  const baseTime = 120; // 2 minutes
  const variability = Math.random() * 480; // +0-8 minutes
  return baseTime + variability;
}

/**
 * Get Stargate bridge status
 */
export function getStargateBridgeStatus(
  request: NFTBridgeRequest
): { status: BridgeStatus; progress: number; estimatedCompletion?: number } {
  const now = Math.floor(Date.now() / 1000);
  const elapsed = now - request.createdAt;
  const estimatedTime = estimateStargateBridgeTime(request.sourceChain, request.destinationChain);

  let status: BridgeStatus = 'pending';
  let progress = 0;

  if (elapsed < estimatedTime * 0.33) {
    status = 'pending';
    progress = 33;
  } else if (elapsed < estimatedTime * 0.66) {
    status = 'confirmed';
    progress = 66;
  } else {
    status = 'finalized';
    progress = 100;
  }

  return {
    status,
    progress,
    estimatedCompletion: request.createdAt + estimatedTime,
  };
}

// ============================================================================
// NFT LIQUIDITY POOL FUNCTIONS
// ============================================================================

/**
 * Create NFT liquidity pool
 */
export function createNFTLiquidityPool(
  protocol: NFTBridgeProtocol,
  nftType: NFTType,
  chain: number,
  initialLiquidity: bigint
): NFTLiquidityPool {
  return {
    id: `pool-${protocol}-${nftType}-${Date.now()}`,
    name: `${protocol === 'wormhole' ? 'Wormhole' : 'Stargate'} ${nftType} Pool`,
    protocol,
    nftType,
    totalNFTs: Math.floor(Number(initialLiquidity) / 1000),
    totalValue: initialLiquidity,
    apy: Math.random() * 150 + 20, // 20-170% APY
    liquidity: initialLiquidity,
    chain,
    createdAt: Math.floor(Date.now() / 1000),
    volume24h: 0n,
    fees24h: 0n,
  };
}

/**
 * Add NFT to liquidity pool
 */
export function addNFTToPool(pool: NFTLiquidityPool, nft: BassBallNFT): NFTLiquidityPool {
  const updated = { ...pool };
  updated.totalNFTs += 1;
  updated.totalValue += nft.value;
  updated.liquidity += nft.value;
  updated.updatedAt = Math.floor(Date.now() / 1000);
  return updated;
}

/**
 * Remove NFT from liquidity pool
 */
export function removeNFTFromPool(pool: NFTLiquidityPool, nft: BassBallNFT): NFTLiquidityPool {
  const updated = { ...pool };
  updated.totalNFTs = Math.max(0, updated.totalNFTs - 1);
  updated.totalValue = updated.totalValue > nft.value ? updated.totalValue - nft.value : 0n;
  updated.liquidity = updated.liquidity > nft.value ? updated.liquidity - nft.value : 0n;
  updated.updatedAt = Math.floor(Date.now() / 1000);
  return updated;
}

/**
 * Calculate LP rewards
 */
export function calculateLPRewards(
  pool: NFTLiquidityPool,
  lpShare: number,
  daysActive: number
): bigint {
  const dailyReward = (pool.totalValue * BigInt(pool.apy)) / BigInt(36500); // APY / 365
  const totalReward = dailyReward * BigInt(daysActive);
  const lpReward = (totalReward * BigInt(Math.floor(lpShare * 10000))) / BigInt(10000);
  return lpReward;
}

// ============================================================================
// BASS BALL NFT SPECIFIC FUNCTIONS
// ============================================================================

/**
 * Create Bass Ball NFT
 */
export function createBassBallNFT(
  type: NFTType,
  owner: Address,
  chainId: number,
  metadata: BassBallNFT['metadata'],
  value: bigint
): BassBallNFT {
  return {
    id: `bass-nft-${type}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    tokenId: BigInt(Date.now() % 1000000),
    type,
    owner,
    metadata,
    chainId,
    contractAddress: BASS_BALL_NFT_CONTRACTS[type],
    mintedAt: Math.floor(Date.now() / 1000),
    value,
  };
}

/**
 * Is Bass Ball NFT eligible for bridging
 */
export function isNFTEligibleForBridging(nft: BassBallNFT, destinationChain: number): boolean {
  // Check if NFT type supports bridging
  const supportedTypes: NFTType[] = ['player-stats', 'achievement', 'cosmetic', 'formation'];
  if (!supportedTypes.includes(nft.type)) {
    return false;
  }

  // Check if destination chain is supported
  const wormholeChains = getWormholeSupportedChains();
  const stargateChains = getStargateSupportedChains();

  return wormholeChains.includes(destinationChain) || stargateChains.includes(destinationChain);
}

/**
 * Get best bridge for NFT
 */
export function getBestBridgeForNFT(
  nft: BassBallNFT,
  destinationChain: number
): NFTBridgeProtocol | null {
  const sourceConfig = getWormholeConfig(nft.chainId);
  const destWormhole = getWormholeConfig(destinationChain);
  const destStargate = getStargateConfig(destinationChain);
  const sourceStargate = getStargateConfig(nft.chainId);

  // Prefer Stargate if available (cheaper, faster)
  if (sourceStargate && destStargate && sourceStargate.supportedChains.includes(destinationChain)) {
    return 'stargate';
  }

  // Fall back to Wormhole
  if (sourceConfig && destWormhole) {
    return 'wormhole';
  }

  return null;
}

// ============================================================================
// BRIDGE TRANSACTION FUNCTIONS
// ============================================================================

/**
 * Create bridge transaction
 */
export function createBridgeTransaction(
  request: NFTBridgeRequest
): BridgeTransaction {
  return {
    id: request.id,
    nftId: request.nft.id,
    protocol: request.protocol,
    fromChain: request.sourceChain,
    toChain: request.destinationChain,
    sender: request.nft.owner,
    recipient: request.recipient,
    status: 'pending',
    fee: request.fee,
    timestamp: request.createdAt,
    confirmations: 0,
    requiredConfirmations: request.protocol === 'wormhole' ? 13 : 1,
  };
}

/**
 * Update bridge transaction status
 */
export function updateBridgeTransactionStatus(
  tx: BridgeTransaction,
  status: BridgeStatus,
  txHash?: string
): BridgeTransaction {
  const updated = { ...tx };
  updated.status = status;
  if (txHash) updated.txHash = txHash;

  if (status === 'confirmed') {
    updated.confirmations = Math.floor(updated.requiredConfirmations * 0.5);
  } else if (status === 'finalized') {
    updated.confirmations = updated.requiredConfirmations;
  }

  return updated;
}

/**
 * Is bridge transaction complete
 */
export function isBridgeTransactionComplete(tx: BridgeTransaction): boolean {
  return tx.status === 'completed' || tx.status === 'failed';
}

// ============================================================================
// ANALYTICS FUNCTIONS
// ============================================================================

/**
 * Calculate NFT bridge metrics
 */
export function calculateNFTBridgeMetrics(
  transactions: BridgeTransaction[]
): NFTBridgeMetrics {
  const completed = transactions.filter(tx => tx.status === 'completed');
  const failed = transactions.filter(tx => tx.status === 'failed');
  const active = transactions.filter(tx => !isBridgeTransactionComplete(tx));

  const totalVolume = transactions.reduce((sum, tx) => sum + tx.fee, 0n);
  const wormholeVolume = transactions
    .filter(tx => tx.protocol === 'wormhole')
    .reduce((sum, tx) => sum + tx.fee, 0n);
  const stargateVolume = transactions
    .filter(tx => tx.protocol === 'stargate')
    .reduce((sum, tx) => sum + tx.fee, 0n);

  const successRate = transactions.length > 0
    ? (completed.length / transactions.length) * 100
    : 0;

  const avgBridgeTime = completed.length > 0
    ? completed.reduce((sum, tx) => sum + (Math.random() * 3600), 0) / completed.length
    : 0;

  return {
    totalBridged: completed.length,
    totalVolume,
    avgBridgeTime,
    successRate,
    wormholeVolume,
    stargateVolume,
    activeRequests: active.length,
    failedRequests: failed.length,
  };
}

/**
 * Get NFT bridge statistics
 */
export function getNFTBridgeStats(requests: NFTBridgeRequest[]): {
  byProtocol: Record<NFTBridgeProtocol, number>;
  byChain: Record<number, number>;
  byType: Record<NFTType, number>;
} {
  const stats = {
    byProtocol: { wormhole: 0, stargate: 0 },
    byChain: {} as Record<number, number>,
    byType: {
      'player-stats': 0,
      'achievement': 0,
      'cosmetic': 0,
      'formation': 0,
      'limited-edition': 0,
    },
  };

  for (const req of requests) {
    stats.byProtocol[req.protocol]++;
    stats.byChain[req.destinationChain] = (stats.byChain[req.destinationChain] || 0) + 1;
    stats.byType[req.nft.type]++;
  }

  return stats;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format bridge time
 */
export function formatBridgeTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3600)}h`;
}

/**
 * Get bridge protocol name
 */
export function getBridgeProtocolName(protocol: NFTBridgeProtocol): string {
  return protocol === 'wormhole' ? 'Wormhole' : 'Stargate';
}

/**
 * Compare bridge options
 */
export function compareBridgeOptions(
  nft: BassBallNFT,
  destinationChain: number
): {
  protocol: NFTBridgeProtocol;
  fee: bigint;
  estimatedTime: number;
  recommended: boolean;
}[] {
  const options: {
    protocol: NFTBridgeProtocol;
    fee: bigint;
    estimatedTime: number;
    recommended: boolean;
  }[] = [];

  // Check Wormhole
  const wormholeConfig = getWormholeConfig(nft.chainId);
  const wormholeDestConfig = getWormholeConfig(destinationChain);
  if (wormholeConfig && wormholeDestConfig) {
    const request = createWormholeNFTBridgeRequest(nft, destinationChain, nft.owner);
    options.push({
      protocol: 'wormhole',
      fee: request.fee,
      estimatedTime: estimateWormholeBridgeTime(nft.chainId, destinationChain),
      recommended: false,
    });
  }

  // Check Stargate
  const stargateConfig = getStargateConfig(nft.chainId);
  const stargateDestConfig = getStargateConfig(destinationChain);
  if (stargateConfig && stargateDestConfig && stargateConfig.supportedChains.includes(destinationChain)) {
    const request = createStargateNFTBridgeRequest(nft, destinationChain, nft.owner);
    options.push({
      protocol: 'stargate',
      fee: request.fee,
      estimatedTime: estimateStargateBridgeTime(nft.chainId, destinationChain),
      recommended: true, // Cheaper and faster
    });
  }

  // Sort by fee (cheapest first)
  options.sort((a, b) => {
    if (a.fee === b.fee) return a.estimatedTime - b.estimatedTime;
    return Number(a.fee - b.fee);
  });

  return options;
}

/**
 * Export NFT bridge state
 */
export function exportNFTBridgeState(
  requests: NFTBridgeRequest[],
  pools: NFTLiquidityPool[],
  transactions: BridgeTransaction[]
): string {
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    summary: {
      totalRequests: requests.length,
      totalPools: pools.length,
      totalTransactions: transactions.length,
    },
    requests: requests.map(r => ({
      id: r.id,
      protocol: r.protocol,
      status: r.status,
      nftType: r.nft.type,
      sourceChain: r.sourceChain,
      destinationChain: r.destinationChain,
    })),
    pools: pools.map(p => ({
      id: p.id,
      protocol: p.protocol,
      nftType: p.nftType,
      totalValue: p.totalValue.toString(),
      apy: p.apy,
    })),
    metrics: calculateNFTBridgeMetrics(transactions),
  }, null, 2);
}
