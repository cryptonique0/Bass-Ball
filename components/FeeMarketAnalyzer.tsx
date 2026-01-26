import React, { useMemo } from 'react';
import { useEIP1559Fees } from '../hooks/useEIP1559';
import { formatEther } from 'viem';

interface FeeMarketAnalyzerProps {
  chainId?: number;
  showHistory?: boolean;
  className?: string;
}

export const FeeMarketAnalyzer = ({
  chainId = 8453,
  showHistory = true,
  className = '',
}: FeeMarketAnalyzerProps) => {
  const { feeEstimate, baseFee, formatFee } = useEIP1559Fees();

  const congestionLevel = useMemo(() => {
    if (!baseFee) return 'unknown';
    if (baseFee < BigInt(1e9)) return 'low';
    if (baseFee < BigInt(5e9)) return 'moderate';
    if (baseFee < BigInt(20e9)) return 'high';
    return 'extreme';
  }, [baseFee]);

  const congestionColor = {
    low: 'text-green-400 bg-green-500/10',
    moderate: 'text-cyan-400 bg-cyan-500/10',
    high: 'text-orange-400 bg-orange-500/10',
    extreme: 'text-red-400 bg-red-500/10',
    unknown: 'text-gray-400 bg-gray-500/10',
  }[congestionLevel];

  if (!feeEstimate || !baseFee) {
    return (
      <div className={`bg-slate-900 rounded-lg p-4 animate-pulse ${className}`}>
        <div className="h-4 bg-slate-700 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg border border-slate-700 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white">Fee Market Analysis</h3>
        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${congestionColor}`}>
          {congestionLevel.toUpperCase()}
        </div>
      </div>

      {/* Base Fee */}
      <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
        <div className="text-sm text-gray-400 mb-2">Base Fee Per Gas</div>
        <div className="text-3xl font-bold text-cyan-400">
          {formatFee(baseFee)}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Current EIP-1559 base fee
        </div>
      </div>

      {/* Fee Strategies */}
      <div className="space-y-3 mb-6">
        {/* Slow */}
        <div className="bg-slate-800/50 rounded-lg p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-white">Slow</div>
              <div className="text-xs text-gray-400">~2-5 minutes</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm text-blue-400">
                {formatFee(feeEstimate.slow.maxFeePerGas)}
              </div>
              <div className="text-xs text-gray-500">
                Priority: {formatFee(feeEstimate.slow.maxPriorityFeePerGas)}
              </div>
            </div>
          </div>
        </div>

        {/* Standard */}
        <div className="bg-slate-800/50 rounded-lg p-4 border-l-4 border-cyan-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-white">Standard</div>
              <div className="text-xs text-gray-400">~15-30 seconds</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm text-cyan-400">
                {formatFee(feeEstimate.standard.maxFeePerGas)}
              </div>
              <div className="text-xs text-gray-500">
                Priority: {formatFee(feeEstimate.standard.maxPriorityFeePerGas)}
              </div>
            </div>
          </div>
        </div>

        {/* Fast */}
        <div className="bg-slate-800/50 rounded-lg p-4 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-white">Fast</div>
              <div className="text-xs text-gray-400">~5-15 seconds</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm text-orange-400">
                {formatFee(feeEstimate.fast.maxFeePerGas)}
              </div>
              <div className="text-xs text-gray-500">
                Priority: {formatFee(feeEstimate.fast.maxPriorityFeePerGas)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Network Status */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="text-sm text-blue-300">
          <strong>Network Status:</strong> {congestionLevel === 'low' ? 'Good time to transact' : congestionLevel === 'moderate' ? 'Moderate congestion' : 'High congestion - consider waiting'}
        </div>
      </div>
    </div>
  );
};
