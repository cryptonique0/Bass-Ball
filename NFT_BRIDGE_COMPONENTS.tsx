/**
 * Bass Ball NFT Bridge Components
 * React components for cross-chain NFT transfers and liquidity management
 * 
 * Components:
 * - NFTBridgeSelector: Select NFT and destination chain
 * - BridgeProtocolComparison: Compare Wormhole vs Stargate
 * - NFTBridgeMonitor: Track bridge progress
 * - NFTLiquidityPoolManager: Manage liquidity pools
 * - LPRewardsDashboard: View LP rewards
 * - BridgeHistoryPanel: Bridge transaction history
 * - NFTPortfolioMultiChain: View NFTs across chains
 * - BridgeStatsDisplay: Bridge statistics
 */

'use client';

import React, { useState, useEffect } from 'react';

// ============================================================================
// 1. NFT BRIDGE SELECTOR COMPONENT
// ============================================================================

export interface NFTBridgeSelectorProps {
  userNFTs: any[];
  supportedChains: number[];
  onBridgeInitiate: (nftId: string, destChain: number) => void;
}

export const NFTBridgeSelector: React.FC<NFTBridgeSelectorProps> = ({
  userNFTs,
  supportedChains,
  onBridgeInitiate,
}) => {
  const [selectedNFT, setSelectedNFT] = useState<string | null>(null);
  const [selectedChain, setSelectedChain] = useState<number | null>(null);

  const chainNames: Record<number, string> = {
    1: 'Ethereum',
    10: 'Optimism',
    42161: 'Arbitrum',
    8453: 'Base',
    137: 'Polygon',
  };

  const handleBridge = () => {
    if (selectedNFT && selectedChain) {
      onBridgeInitiate(selectedNFT, selectedChain);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Bridge NFT</h2>

      {/* NFT Selection */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Select NFT to Bridge
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
          {userNFTs.map((nft) => (
            <button
              key={nft.id}
              onClick={() => setSelectedNFT(nft.id)}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                selectedNFT === nft.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="font-semibold text-gray-900">{nft.metadata.name}</div>
              <div className="text-sm text-gray-600">{nft.type}</div>
              <div className="text-xs text-gray-500">
                Current: {chainNames[nft.chainId] || `Chain ${nft.chainId}`}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chain Selection */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Destination Chain
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {supportedChains.map((chainId) => (
            <button
              key={chainId}
              onClick={() => setSelectedChain(chainId)}
              className={`p-3 rounded-lg border-2 transition-all font-medium ${
                selectedChain === chainId
                  ? 'border-green-500 bg-green-50 text-green-900'
                  : 'border-gray-200 text-gray-700 hover:border-green-300'
              }`}
            >
              {chainNames[chainId] || `Chain ${chainId}`}
            </button>
          ))}
        </div>
      </div>

      {/* Bridge Button */}
      <button
        onClick={handleBridge}
        disabled={!selectedNFT || !selectedChain}
        className={`w-full py-3 rounded-lg font-semibold transition-all ${
          selectedNFT && selectedChain
            ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        Initiate Bridge
      </button>
    </div>
  );
};

// ============================================================================
// 2. BRIDGE PROTOCOL COMPARISON COMPONENT
// ============================================================================

export interface BridgeOption {
  protocol: 'wormhole' | 'stargate';
  fee: string;
  estimatedTime: string;
  speed: 'fast' | 'standard' | 'optimized';
  recommended: boolean;
}

export interface BridgeProtocolComparisonProps {
  options: BridgeOption[];
  onSelectProtocol: (protocol: 'wormhole' | 'stargate') => void;
}

export const BridgeProtocolComparison: React.FC<BridgeProtocolComparisonProps> = ({
  options,
  onSelectProtocol,
}) => {
  const protocolIcons: Record<string, string> = {
    wormhole: '🌀',
    stargate: '⭐',
  };

  const protocolDescriptions: Record<string, string> = {
    wormhole: 'Decentralized 13-validator consensus',
    stargate: 'Fast liquidity pool-based bridging',
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Choose Bridge Protocol</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map((option) => (
          <button
            key={option.protocol}
            onClick={() => onSelectProtocol(option.protocol)}
            className={`p-5 rounded-lg border-2 transition-all text-left ${
              option.recommended
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{protocolIcons[option.protocol]}</span>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 capitalize">
                    {option.protocol}
                  </h3>
                  <p className="text-sm text-gray-600">{protocolDescriptions[option.protocol]}</p>
                </div>
              </div>
              {option.recommended && (
                <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded">
                  Recommended
                </span>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Fee:</span>
                <span className="font-semibold text-gray-900">{option.fee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span className="font-semibold text-gray-900">{option.estimatedTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Speed:</span>
                <span className="font-semibold capitalize text-gray-900">{option.speed}</span>
              </div>
            </div>

            <button className="w-full mt-4 bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition">
              Select
            </button>
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// 3. NFT BRIDGE MONITOR COMPONENT
// ============================================================================

export interface BridgeStatusData {
  status: 'pending' | 'confirmed' | 'finalized' | 'completed' | 'failed';
  progress: number;
  nftName: string;
  fromChain: string;
  toChain: string;
  fee: string;
  estimatedCompletion?: number;
}

export interface NFTBridgeMonitorProps {
  bridge: BridgeStatusData;
  autoRefresh?: boolean;
}

export const NFTBridgeMonitor: React.FC<NFTBridgeMonitorProps> = ({
  bridge,
  autoRefresh = true,
}) => {
  const [progress, setProgress] = useState(bridge.progress);

  useEffect(() => {
    if (!autoRefresh || progress >= 100) return;

    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 5, 100));
    }, 3000);

    return () => clearInterval(interval);
  }, [autoRefresh, progress]);

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500',
    confirmed: 'bg-blue-500',
    finalized: 'bg-purple-500',
    completed: 'bg-green-500',
    failed: 'bg-red-500',
  };

  const statusEmojis: Record<string, string> = {
    pending: '⏳',
    confirmed: '✓',
    finalized: '✓✓',
    completed: '✅',
    failed: '❌',
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Bridge Progress</h2>

      {/* NFT Details */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-bold text-lg text-gray-900">{bridge.nftName}</h3>
            <p className="text-sm text-gray-600">
              {bridge.fromChain} → {bridge.toChain}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Fee</p>
            <p className="font-semibold text-gray-900">{bridge.fee}</p>
          </div>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-gray-700 capitalize">{bridge.status}</span>
          <span className="text-2xl">{statusEmojis[bridge.status]}</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${statusColors[bridge.status]}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-2 text-sm text-gray-600 text-right">{progress}%</div>
      </div>

      {/* Status Steps */}
      <div className="space-y-3 mb-6">
        {['pending', 'confirmed', 'finalized', 'completed'].map((step, idx) => (
          <div key={step} className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                progress >= ((idx + 1) / 4) * 100
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {idx + 1}
            </div>
            <span className="capitalize text-gray-700">{step}</span>
          </div>
        ))}
      </div>

      {/* ETA */}
      {bridge.estimatedCompletion && (
        <div className="p-3 bg-blue-50 rounded text-sm text-gray-700">
          Estimated completion:{' '}
          <span className="font-semibold">
            {new Date(bridge.estimatedCompletion * 1000).toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 4. NFT LIQUIDITY POOL MANAGER COMPONENT
// ============================================================================

export interface PoolData {
  id: string;
  name: string;
  protocol: 'wormhole' | 'stargate';
  totalValue: string;
  apy: number;
  tvl: string;
  volume24h: string;
  myShare?: number;
  myRewards?: string;
}

export interface NFTLiquidityPoolManagerProps {
  pools: PoolData[];
  onAddLiquidity: (poolId: string) => void;
  onRemoveLiquidity: (poolId: string) => void;
}

export const NFTLiquidityPoolManager: React.FC<NFTLiquidityPoolManagerProps> = ({
  pools,
  onAddLiquidity,
  onRemoveLiquidity,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">NFT Liquidity Pools</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Pool</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">TVL</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">APY</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">24h Volume</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">My Share</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pools.map((pool) => (
              <tr key={pool.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-4">
                  <div>
                    <p className="font-semibold text-gray-900">{pool.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{pool.protocol}</p>
                  </div>
                </td>
                <td className="py-4 px-4 font-semibold text-gray-900">{pool.tvl}</td>
                <td className="py-4 px-4">
                  <span className="font-semibold text-green-600">{pool.apy.toFixed(1)}%</span>
                </td>
                <td className="py-4 px-4 text-gray-900">{pool.volume24h}</td>
                <td className="py-4 px-4">
                  {pool.myShare ? (
                    <div>
                      <p className="font-semibold text-gray-900">{pool.myShare.toFixed(2)}%</p>
                      <p className="text-xs text-gray-600">{pool.myRewards} rewards</p>
                    </div>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </td>
                <td className="py-4 px-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onAddLiquidity(pool.id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-blue-700"
                    >
                      Add
                    </button>
                    {pool.myShare && (
                      <button
                        onClick={() => onRemoveLiquidity(pool.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================================================
// 5. LP REWARDS DASHBOARD COMPONENT
// ============================================================================

export interface RewardData {
  poolName: string;
  yourShare: number;
  rewards24h: string;
  rewardsTotal: string;
  apy: number;
  estimatedYearlyReward: string;
}

export interface LPRewardsDashboardProps {
  rewards: RewardData[];
  totalRewards: string;
}

export const LPRewardsDashboard: React.FC<LPRewardsDashboardProps> = ({
  rewards,
  totalRewards,
}) => {
  return (
    <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 max-w-3xl text-white">
      <h2 className="text-2xl font-bold mb-6">LP Rewards</h2>

      {/* Total Rewards */}
      <div className="bg-white/10 rounded-lg p-4 mb-6 backdrop-blur">
        <p className="text-blue-100 text-sm font-semibold mb-1">Total Rewards</p>
        <p className="text-4xl font-bold">{totalRewards}</p>
      </div>

      {/* Rewards by Pool */}
      <div className="space-y-3">
        {rewards.map((reward, idx) => (
          <div key={idx} className="bg-white/10 rounded-lg p-4 backdrop-blur">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-lg">{reward.poolName}</h3>
                <p className="text-sm text-blue-100">Share: {reward.yourShare.toFixed(2)}%</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-100">24h Rewards</p>
                <p className="text-xl font-semibold">{reward.rewards24h}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-blue-100">APY</p>
                <p className="font-semibold">{reward.apy.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-blue-100">Total Earned</p>
                <p className="font-semibold">{reward.rewardsTotal}</p>
              </div>
              <div>
                <p className="text-blue-100">Yearly (est.)</p>
                <p className="font-semibold">{reward.estimatedYearlyReward}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// 6. BRIDGE HISTORY PANEL COMPONENT
// ============================================================================

export interface BridgeHistoryItem {
  id: string;
  nftName: string;
  type: string;
  fromChain: string;
  toChain: string;
  status: 'completed' | 'pending' | 'failed';
  fee: string;
  date: number;
  txHash?: string;
}

export interface BridgeHistoryPanelProps {
  transactions: BridgeHistoryItem[];
}

export const BridgeHistoryPanel: React.FC<BridgeHistoryPanelProps> = ({ transactions }) => {
  const statusBadges: Record<string, string> = {
    completed: '🟢 Completed',
    pending: '🟡 Pending',
    failed: '🔴 Failed',
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Bridge History</h2>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {transactions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No bridge transactions yet</p>
        ) : (
          transactions.map((tx) => (
            <div key={tx.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{tx.nftName}</h3>
                  <p className="text-sm text-gray-600 mb-1">{tx.type}</p>
                  <p className="text-xs text-gray-500">
                    {tx.fromChain} → {tx.toChain}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{statusBadges[tx.status]}</p>
                  <p className="text-xs text-gray-500 mt-2">{tx.fee} fee</p>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                <span>{new Date(tx.date * 1000).toLocaleDateString()}</span>
                {tx.txHash && (
                  <a href={`#${tx.txHash}`} className="text-blue-600 hover:underline">
                    View TX
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 7. NFT PORTFOLIO MULTI-CHAIN COMPONENT
// ============================================================================

export interface MultiChainNFT {
  id: string;
  name: string;
  type: string;
  chains: number[];
  value: string;
}

export interface NFTPortfolioMultiChainProps {
  nfts: MultiChainNFT[];
}

export const NFTPortfolioMultiChain: React.FC<NFTPortfolioMultiChainProps> = ({ nfts }) => {
  const chainNames: Record<number, string> = {
    1: 'ETH',
    10: 'OP',
    42161: 'ARB',
    8453: 'BASE',
    137: 'MATIC',
  };

  const chainColors: Record<number, string> = {
    1: 'bg-purple-100 text-purple-800',
    10: 'bg-red-100 text-red-800',
    42161: 'bg-blue-100 text-blue-800',
    8453: 'bg-cyan-100 text-cyan-800',
    137: 'bg-purple-100 text-purple-800',
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">NFT Portfolio</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {nfts.map((nft) => (
          <div key={nft.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition">
            <h3 className="font-bold text-gray-900 mb-2">{nft.name}</h3>
            <p className="text-sm text-gray-600 mb-3">{nft.type}</p>

            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-2">On Chains:</p>
              <div className="flex flex-wrap gap-2">
                {nft.chains.map((chainId) => (
                  <span
                    key={chainId}
                    className={`text-xs font-semibold px-2 py-1 rounded ${chainColors[chainId] || 'bg-gray-100'}`}
                  >
                    {chainNames[chainId] || `Chain ${chainId}`}
                  </span>
                ))}
              </div>
            </div>

            <div className="font-semibold text-gray-900 text-lg">{nft.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// 8. BRIDGE STATS DISPLAY COMPONENT
// ============================================================================

export interface BridgeStatsData {
  totalBridged: number;
  totalVolume: string;
  successRate: number;
  avgBridgeTime: string;
  wormholeVolume: string;
  stargateVolume: string;
}

export interface BridgeStatsDisplayProps {
  stats: BridgeStatsData;
}

export const BridgeStatsDisplay: React.FC<BridgeStatsDisplayProps> = ({ stats }) => {
  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg shadow-lg p-6 max-w-4xl text-white">
      <h2 className="text-2xl font-bold mb-6">Bridge Statistics</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Total Bridged */}
        <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
          <p className="text-slate-300 text-sm font-semibold mb-1">Total Bridged</p>
          <p className="text-3xl font-bold">{stats.totalBridged}</p>
          <p className="text-xs text-slate-400 mt-1">NFTs</p>
        </div>

        {/* Total Volume */}
        <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
          <p className="text-slate-300 text-sm font-semibold mb-1">Total Volume</p>
          <p className="text-2xl font-bold">{stats.totalVolume}</p>
        </div>

        {/* Success Rate */}
        <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
          <p className="text-slate-300 text-sm font-semibold mb-1">Success Rate</p>
          <p className="text-3xl font-bold text-green-400">{stats.successRate.toFixed(1)}%</p>
        </div>

        {/* Avg Bridge Time */}
        <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
          <p className="text-slate-300 text-sm font-semibold mb-1">Avg Bridge Time</p>
          <p className="text-2xl font-bold">{stats.avgBridgeTime}</p>
        </div>

        {/* Wormhole Volume */}
        <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg p-4 backdrop-blur border border-blue-400/30">
          <p className="text-slate-300 text-sm font-semibold mb-1">Wormhole</p>
          <p className="text-2xl font-bold">{stats.wormholeVolume}</p>
        </div>

        {/* Stargate Volume */}
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg p-4 backdrop-blur border border-green-400/30">
          <p className="text-slate-300 text-sm font-semibold mb-1">Stargate</p>
          <p className="text-2xl font-bold">{stats.stargateVolume}</p>
        </div>
      </div>
    </div>
  );
};

export default {
  NFTBridgeSelector,
  BridgeProtocolComparison,
  NFTBridgeMonitor,
  NFTLiquidityPoolManager,
  LPRewardsDashboard,
  BridgeHistoryPanel,
  NFTPortfolioMultiChain,
  BridgeStatsDisplay,
};
