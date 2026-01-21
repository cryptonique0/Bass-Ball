'use client';

import React, { useState } from 'react';
import { useBassBallGame, useGameToken, contractRegistry } from '../hooks/useContracts';
import { useWallet } from '../hooks/useWallet';
import { formatEther } from 'viem';

interface PlayerStatsDisplayProps {
  showRank?: boolean;
  showEarnings?: boolean;
  className?: string;
}

/**
 * PlayerStats Component - Displays player game statistics from contract
 */
export const PlayerStats = ({ 
  showRank = true, 
  showEarnings = true,
  className = '' 
}: PlayerStatsDisplayProps) => {
  const { address, chainId } = useWallet();
  const gameAddress = contractRegistry.getAddress('BASSBALL_GAME', chainId || 8453);
  const { stats, earnings } = useBassBallGame(gameAddress, address);

  if (!address) {
    return (
      <div className={`bg-slate-900 rounded-lg p-6 text-center text-gray-400 ${className}`}>
        Connect wallet to view player stats
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={`bg-slate-900 rounded-lg p-6 animate-pulse ${className}`}>
        <div className="h-4 bg-slate-700 rounded w-1/2 mx-auto"></div>
      </div>
    );
  }

  const winRate = stats.wins + stats.losses > 0 
    ? ((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(1)
    : '0.0';

  const levelColor = stats.level >= 10 ? 'text-amber-400' : stats.level >= 5 ? 'text-cyan-400' : 'text-green-400';

  return (
    <div className={`bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg border border-slate-700 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Player Stats</h3>
        <div className={`text-3xl font-bold ${levelColor}`}>
          Lvl {stats.level}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Wins */}
        <div className="bg-slate-800/50 rounded-lg p-4">
          <div className="text-sm text-gray-400">Wins</div>
          <div className="text-3xl font-bold text-green-400">{stats.wins}</div>
        </div>

        {/* Losses */}
        <div className="bg-slate-800/50 rounded-lg p-4">
          <div className="text-sm text-gray-400">Losses</div>
          <div className="text-3xl font-bold text-red-400">{stats.losses}</div>
        </div>

        {/* Win Rate */}
        <div className="bg-slate-800/50 rounded-lg p-4">
          <div className="text-sm text-gray-400">Win Rate</div>
          <div className="text-3xl font-bold text-cyan-400">{winRate}%</div>
        </div>

        {/* Total Score */}
        <div className="bg-slate-800/50 rounded-lg p-4">
          <div className="text-sm text-gray-400">Total Score</div>
          <div className="text-2xl font-bold text-blue-400">{stats.totalScore}</div>
        </div>
      </div>

      {/* Earnings */}
      {showEarnings && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <div className="text-sm text-amber-300 mb-1">Claimable Earnings</div>
          <div className="text-2xl font-bold text-amber-400">
            {formatEther(earnings)} BASS
          </div>
        </div>
      )}
    </div>
  );
}

interface TokenBalanceProps {
  tokenAddress?: string;
  showSymbol?: boolean;
  className?: string;
}

/**
 * TokenBalance Component - Displays game token balance
 */
export const TokenBalance = ({ 
  tokenAddress, 
  showSymbol = true,
  className = '' 
}: TokenBalanceProps) => {
  const { address, chainId } = useWallet();
  const contractAddress = tokenAddress || contractRegistry.getAddress('GAME_TOKEN', chainId || 8453);
  const { balance, symbol, formatBalance } = useGameToken(contractAddress, address);

  if (!address) {
    return (
      <div className={`bg-slate-900 rounded-lg p-4 text-center text-gray-400 ${className}`}>
        Connect wallet to view balance
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg border border-slate-700 p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-gray-400">Balance</span>
        <span className="text-lg font-bold text-cyan-400">
          {balance ? formatBalance(balance as bigint) : '0.00'} {showSymbol && symbol}
        </span>
      </div>
    </div>
  );
};

interface ContractInteractionProps {
  contractType: 'game' | 'token' | 'team';
  action: string;
  onExecute?: () => void;
  className?: string;
}

/**
 * ContractInteraction Component - Execute contract functions with UI feedback
 */
export const ContractInteraction = ({ 
  contractType, 
  action, 
  onExecute,
  className = '' 
}: ContractInteractionProps) => {
  const { address } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (!address) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      onExecute?.();
      // Actual contract interaction would happen in the action handler
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <button
        onClick={handleClick}
        disabled={loading || !address}
        className={`
          w-full py-3 px-4 rounded-lg font-semibold transition-all
          ${loading
            ? 'bg-slate-700 cursor-wait'
            : address
            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white'
            : 'bg-slate-700 text-gray-500 cursor-not-allowed'
          }
        `}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            Processing...
          </span>
        ) : (
          action
        )}
      </button>

      {error && (
        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
