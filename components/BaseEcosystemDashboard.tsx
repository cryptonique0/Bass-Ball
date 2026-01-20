/**
 * Base Ecosystem Dashboard Component
 * Displays Base ecosystem information, gas prices, bridges, and DEXs
 * Production-ready React component with Tailwind styling
 */

'use client';

import React, { useMemo } from 'react';
import { useBaseEcosystem, useBaseGasMonitor, useBaseCostComparison } from '@/hooks/useBaseEcosystem';

interface BaseEcosystemDashboardProps {
  showBridges?: boolean;
  showDexs?: boolean;
  showGasMonitor?: boolean;
  showCostComparison?: boolean;
  className?: string;
}

export function BaseEcosystemDashboard({
  showBridges = true,
  showDexs = true,
  showGasMonitor = true,
  showCostComparison = true,
  className = '',
}: BaseEcosystemDashboardProps) {
  const ecosystem = useBaseEcosystem();
  const gasMonitor = useBaseGasMonitor();
  const costComparison = useBaseCostComparison('complex');

  const statusIndicator = useMemo(() => {
    switch (ecosystem.ecosystemHealth) {
      case 'healthy':
        return '🟢';
      case 'degraded':
        return '🟡';
      case 'down':
        return '🔴';
      default:
        return '⚪';
    }
  }, [ecosystem.ecosystemHealth]);

  if (ecosystem.isLoading) {
    return (
      <div className={`p-6 bg-gray-900 rounded-lg border border-gray-800 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-800 rounded w-3/4"></div>
          <div className="h-4 bg-gray-800 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Network Status */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-6 border border-blue-500/30">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Base Ecosystem</h2>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{statusIndicator}</span>
            <span className="text-sm font-medium text-gray-300 capitalize">
              {ecosystem.ecosystemHealth}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-black/30 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1">Block Number</p>
            <p className="text-lg font-mono font-bold text-white">
              {ecosystem.blockNumber.toLocaleString()}
            </p>
          </div>

          <div className="bg-black/30 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1">Gas Price</p>
            <p className="text-lg font-mono font-bold text-white">
              {ecosystem.gasPrice} Gwei
            </p>
          </div>

          <div className="bg-black/30 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1">Network</p>
            <p className="text-lg font-bold text-white">
              {ecosystem.isBase ? '✅ Base' : '❌ Other'}
            </p>
          </div>

          <div className="bg-black/30 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1">Est. TX Cost</p>
            <p className="text-lg font-bold text-green-400">
              ${ecosystem.estimatedTxCost || '0.00'}
            </p>
          </div>
        </div>
      </div>

      {/* Gas Monitor */}
      {showGasMonitor && (
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Gas Price Monitor</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Current</p>
              <p className="text-xl font-bold text-white">
                {gasMonitor.currentGasPrice} Gwei
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-1">24h Average</p>
              <p className="text-xl font-bold text-white">
                {gasMonitor.gasAverage} Gwei
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-1">Trend</p>
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold text-white capitalize">
                  {gasMonitor.gasTrend}
                </p>
                <span className="text-lg">
                  {gasMonitor.gasTrend === 'increasing' && '📈'}
                  {gasMonitor.gasTrend === 'decreasing' && '📉'}
                  {gasMonitor.gasTrend === 'stable' && '➡️'}
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-1">Recommendation</p>
              <p className="text-xl font-bold capitalize">
                <span
                  className={
                    gasMonitor.recommendation === 'low'
                      ? 'text-green-400'
                      : gasMonitor.recommendation === 'fast'
                      ? 'text-red-400'
                      : 'text-yellow-400'
                  }
                >
                  {gasMonitor.recommendation}
                </span>
              </p>
            </div>
          </div>

          <div className="mt-4 text-xs text-gray-400">
            Historical data points: {gasMonitor.historyLength} / 60
          </div>
        </div>
      )}

      {/* Cost Comparison */}
      {showCostComparison && costComparison && (
        <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-lg p-6 border border-green-500/30">
          <h3 className="text-xl font-bold text-white mb-4">💰 Cost Comparison vs Ethereum</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-300">Ethereum L1</p>
              <p className="text-3xl font-bold text-white">{costComparison.ethereumCost}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-300">Base Chain</p>
              <p className="text-3xl font-bold text-green-400">{costComparison.baseCost}</p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-black/30 rounded-lg border border-green-500/20">
            <p className="text-sm text-gray-300">
              You save: <span className="text-lg font-bold text-green-400">{costComparison.savedAmount}</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              That's {costComparison.savingsPercent} cheaper! 🎉
            </p>
          </div>
        </div>
      )}

      {/* Bridges */}
      {showBridges && (
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">🌉 Bridges to Base</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ecosystem.bridges.map(bridge => (
              <a
                key={bridge.id}
                href={ecosystem.getBridgeLink(bridge.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-blue-900/30 border border-blue-500/30 rounded-lg hover:border-blue-500 hover:bg-blue-900/50 transition-all"
              >
                <p className="font-semibold text-blue-300 mb-1">{bridge.name}</p>
                <p className="text-xs text-gray-400">{bridge.id}</p>
                <p className="text-xs text-blue-400 mt-2">→ Open Bridge</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* DEXs */}
      {showDexs && (
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">📊 DEXs on Base</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ecosystem.dexs.map(dex => (
              <div
                key={dex.id}
                className="p-4 bg-purple-900/30 border border-purple-500/30 rounded-lg"
              >
                <p className="font-semibold text-purple-300 mb-1">{dex.name}</p>
                <p className="text-xs text-gray-400 font-mono">{dex.router}</p>
                {dex.factory && (
                  <p className="text-xs text-gray-400 font-mono mt-1">{dex.factory}</p>
                )}
                <p className="text-xs text-purple-400 mt-2">ID: {dex.id}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services */}
      {ecosystem.services.length > 0 && (
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">🔗 Services</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ecosystem.services.map(service => (
              <a
                key={service.id}
                href={service.url || service.endpoint || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-indigo-900/30 border border-indigo-500/30 rounded-lg hover:border-indigo-500 hover:bg-indigo-900/50 transition-all"
              >
                <p className="font-semibold text-indigo-300">{service.name || service.id}</p>
                {service.explorer && (
                  <p className="text-xs text-gray-400 mt-1">📈 Explorer</p>
                )}
                {service.endpoint && (
                  <p className="text-xs text-gray-400 font-mono mt-1 truncate">{service.endpoint}</p>
                )}
                <p className="text-xs text-indigo-400 mt-2">→ Visit</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {ecosystem.error && (
        <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4">
          <p className="text-sm text-red-300">
            <span className="font-semibold">Error: </span>
            {ecosystem.error}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="text-xs text-gray-500 text-center">
        <p>Base Ecosystem Dashboard • Auto-refreshes every 30 seconds</p>
        <p className="mt-1">Powered by Viem + Wagmi + The Graph</p>
      </div>
    </div>
  );
}

/**
 * Minimal Base Status Badge Component
 * Show quick status in header or nav
 */
export function BaseStatusBadge() {
  const { isBase, gasPrice, ecosystemHealth } = useBaseEcosystem();

  const statusColor = {
    healthy: 'bg-green-900/30 border-green-500/30 text-green-300',
    degraded: 'bg-yellow-900/30 border-yellow-500/30 text-yellow-300',
    down: 'bg-red-900/30 border-red-500/30 text-red-300',
  }[ecosystemHealth] || 'bg-gray-900/30 border-gray-500/30 text-gray-300';

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-full border ${statusColor}`}>
      <span className="w-2 h-2 rounded-full bg-current"></span>
      <span className="text-sm font-medium">
        {isBase ? '✅ Base' : '❌'} • {gasPrice} Gwei
      </span>
    </div>
  );
}

export default BaseEcosystemDashboard;
