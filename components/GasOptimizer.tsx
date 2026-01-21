'use client';

import React, { useEffect, useState } from 'react';
import { useTransaction } from '../hooks/useTransaction';
import { formatEther } from 'viem';

interface GasOptimizerProps {
  onGasPriceChange?: (price: bigint) => void;
  autoRefresh?: boolean;
  className?: string;
}

/**
 * Gas Optimizer Component - Shows real-time gas prices and optimization tips
 */
export function GasOptimizer({ 
  onGasPriceChange, 
  autoRefresh = true,
  className = '' 
}: GasOptimizerProps) {
  const { gasPrices, fetchGasPrices } = useTransaction();
  const [selectedStrategy, setSelectedStrategy] = useState<'slow' | 'standard' | 'fast'>('standard');

  useEffect(() => {
    if (gasPrices && onGasPriceChange) {
      onGasPriceChange(gasPrices[selectedStrategy]);
    }
  }, [gasPrices, selectedStrategy, onGasPriceChange]);

  if (!gasPrices) {
    return (
      <div className={`bg-slate-900 rounded-lg p-4 animate-pulse ${className}`}>
        <div className="h-4 bg-slate-700 rounded w-1/2"></div>
      </div>
    );
  }

  const strategies = [
    {
      name: 'Slow',
      key: 'slow' as const,
      timeEstimate: '1-2 min',
      savings: '30%',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      name: 'Standard',
      key: 'standard' as const,
      timeEstimate: '15-30 sec',
      savings: '0%',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      default: true,
    },
    {
      name: 'Fast',
      key: 'fast' as const,
      timeEstimate: '5-15 sec',
      savings: '-20%',
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
    },
  ];

  return (
    <div className={`bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg border border-slate-700 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <h3 className="text-lg font-bold text-white">Gas Optimizer</h3>
        </div>
        <button
          onClick={fetchGasPrices}
          className="p-2 hover:bg-slate-700 rounded transition-colors"
          title="Refresh gas prices"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Current gas price display */}
      <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
        <div className="text-sm text-gray-400 mb-2">Current Network Gas Price</div>
        <div className="text-2xl font-bold text-cyan-400">
          {(parseFloat(formatEther(gasPrices.standard)) * 1e9).toFixed(1)} Gwei
        </div>
        <div className="text-xs text-gray-500 mt-1">
          ≈ ${(parseFloat(formatEther(gasPrices.standard)) * 1e9 * 2000 / 1e9).toFixed(4)}
        </div>
      </div>

      {/* Strategy selection */}
      <div className="space-y-3 mb-6">
        {strategies.map((strategy) => (
          <button
            key={strategy.key}
            onClick={() => setSelectedStrategy(strategy.key)}
            className={`
              w-full p-4 rounded-lg border-2 transition-all text-left
              ${selectedStrategy === strategy.key
                ? `${strategy.bgColor} border-${strategy.color.split('-')[1]}-400`
                : 'border-slate-600 hover:border-slate-500'
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className={`font-bold ${strategy.color}`}>{strategy.name}</div>
                <div className="text-sm text-gray-400">{strategy.timeEstimate}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm text-white">
                  {(parseFloat(formatEther(gasPrices[strategy.key])) * 1e9).toFixed(1)} Gwei
                </div>
                <div className={`text-sm font-semibold ${strategy.savings.startsWith('-') ? 'text-orange-400' : 'text-green-400'}`}>
                  {strategy.savings}
                </div>
              </div>
            </div>

            {/* Selection indicator */}
            {selectedStrategy === strategy.key && (
              <div className="flex items-center gap-2 mt-3 text-sm text-cyan-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Selected</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Tips */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-blue-300">
            <strong>Tip:</strong> Use "Slow" for non-urgent transactions to save gas fees. Use "Fast" only when time is critical.
          </div>
        </div>
      </div>
    </div>
  );
}

interface TransactionProgressProps {
  txData: any;
  className?: string;
}

/**
 * Transaction Progress Component - Shows real-time transaction progress
 */
export function TransactionProgress({ txData, className = '' }: TransactionProgressProps) {
  if (txData.state === 'idle') {
    return null;
  }

  const stateColors: Record<string, string> = {
    signing: 'from-purple-500 to-pink-500',
    pending: 'from-blue-500 to-cyan-500',
    confirming: 'from-cyan-500 to-green-500',
    completed: 'from-green-500 to-emerald-500',
    error: 'from-red-500 to-orange-500',
  };

  const stateLabels: Record<string, string> = {
    signing: 'Signing Transaction',
    pending: 'Confirming Transaction',
    confirming: 'Finalizing',
    completed: 'Transaction Complete',
    error: 'Transaction Failed',
  };

  return (
    <div className={`bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg border border-slate-700 p-6 ${className}`}>
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-white">
            {stateLabels[txData.state]}
          </span>
          <span className="text-sm font-mono text-gray-400">
            {Math.round(txData.progress)}%
          </span>
        </div>
        
        <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${stateColors[txData.state]} transition-all duration-300`}
            style={{ width: `${txData.progress}%` }}
          />
        </div>
      </div>

      {/* Details */}
      <div className="space-y-3">
        {/* Confirmations */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Confirmations</span>
          <span className="text-white font-mono">
            {txData.confirmations} / {txData.requiredConfirmations}
          </span>
        </div>

        {/* Hash */}
        {txData.hash && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Transaction Hash</span>
            <a
              href={txData.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 font-mono truncate"
              title={txData.hash}
            >
              {txData.hash.slice(0, 10)}...{txData.hash.slice(-8)}
            </a>
          </div>
        )}

        {/* Error */}
        {txData.error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded p-3 text-sm text-red-400">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{txData.error}</span>
          </div>
        )}
      </div>

      {/* Explorer link */}
      {txData.explorerUrl && (
        <a
          href={txData.explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm font-semibold text-cyan-400 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          View on Explorer
        </a>
      )}
    </div>
  );
}
