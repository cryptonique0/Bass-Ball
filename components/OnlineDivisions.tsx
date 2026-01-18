'use client';

import React, { useState } from 'react';

interface PlayerRanking {
  rank: number;
  name: string;
  division: string;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  winRate: number;
}

interface OnlineDivisionsProps {
  currentPlayer: {
    name: string;
    division: string;
    points: number;
    rank: number;
  };
  rankings: PlayerRanking[];
}

export function OnlineDivisionsLeaderboard({ currentPlayer, rankings }: OnlineDivisionsProps) {
  const [selectedDivision, setSelectedDivision] = useState('all');

  const divisions = [
    'all',
    'Professional',
    'Professional II',
    'Professional III',
    'Division 1',
    'Division 2',
  ];

  const getDivisionColor = (division: string): string => {
    if (division.includes('Professional')) return 'text-yellow-400';
    if (division.includes('1')) return 'text-blue-400';
    if (division.includes('2')) return 'text-purple-400';
    return 'text-gray-400';
  };

  const filteredRankings = selectedDivision === 'all'
    ? rankings
    : rankings.filter((r) => r.division === selectedDivision);

  const userRank = filteredRankings.find((r) => r.name === currentPlayer.name);

  return (
    <div className="space-y-6">
      {/* Current Rank */}
      <div className="card p-6 border-2 border-blue-500">
        <h3 className="text-xl font-bold mb-4">🏆 Your Ranking</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-gray-400 text-sm">Rank</p>
            <p className="text-4xl font-bold text-yellow-400">#{userRank?.rank || '-'}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Division</p>
            <p className={`text-2xl font-bold ${getDivisionColor(currentPlayer.division)}`}>
              {currentPlayer.division}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Points</p>
            <p className="text-3xl font-bold text-green-500">{currentPlayer.points}</p>
          </div>
        </div>

        {/* Win Rate */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
          <div className="bg-gray-800 p-2 rounded text-center">
            <p className="text-green-400 font-bold">{userRank?.wins || 0}W</p>
            <p className="text-gray-400 text-xs">Wins</p>
          </div>
          <div className="bg-gray-800 p-2 rounded text-center">
            <p className="text-gray-400 font-bold">{userRank?.draws || 0}D</p>
            <p className="text-gray-400 text-xs">Draws</p>
          </div>
          <div className="bg-gray-800 p-2 rounded text-center">
            <p className="text-red-400 font-bold">{userRank?.losses || 0}L</p>
            <p className="text-gray-400 text-xs">Losses</p>
          </div>
        </div>
      </div>

      {/* Division Filter */}
      <div className="card p-6">
        <h3 className="text-xl font-bold mb-4">📊 Division Leaderboard</h3>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {divisions.map((div) => (
            <button
              key={div}
              onClick={() => setSelectedDivision(div)}
              className={`px-4 py-2 rounded text-sm font-bold whitespace-nowrap transition-colors ${
                selectedDivision === div
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {div === 'all' ? 'All' : div}
            </button>
          ))}
        </div>

        {/* Rankings Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-2 px-2">Rank</th>
                <th className="text-left py-2 px-2">Player</th>
                <th className="text-center py-2 px-2">W-D-L</th>
                <th className="text-center py-2 px-2">GF-GA</th>
                <th className="text-right py-2 px-2">Points</th>
              </tr>
            </thead>
            <tbody>
              {filteredRankings.slice(0, 20).map((player) => (
                <tr
                  key={player.rank}
                  className={`border-b border-gray-800 hover:bg-gray-800 transition-colors ${
                    player.name === currentPlayer.name ? 'bg-blue-900 bg-opacity-30' : ''
                  }`}
                >
                  <td className="py-3 px-2">
                    <span className="font-bold text-yellow-400">#{player.rank}</span>
                  </td>
                  <td className="py-3 px-2">
                    <div>
                      <p className="font-bold">{player.name}</p>
                      <p className="text-xs text-gray-400">{player.division}</p>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className="text-green-400 font-bold">{player.wins}</span>
                    <span className="text-gray-400 mx-1">-</span>
                    <span className="text-gray-400 font-bold">{player.draws}</span>
                    <span className="text-gray-400 mx-1">-</span>
                    <span className="text-red-400 font-bold">{player.losses}</span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className="font-bold">{player.goalsFor}</span>
                    <span className="text-gray-400 mx-1">-</span>
                    <span className="font-bold">{player.goalsAgainst}</span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className="font-bold text-blue-400">{player.points}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Season Rewards Component
interface SeasonRewards {
  rank: number;
  division: string;
  points: number;
  rewards: {
    coins: number;
    packs: number;
    contract: string;
  };
}

export function SeasonRewardsPreview() {
  const rewards: SeasonRewards[] = [
    {
      rank: 1,
      division: 'Professional',
      points: 3000,
      rewards: { coins: 50000, packs: 10, contract: 'Elite' },
    },
    {
      rank: 2,
      division: 'Professional',
      points: 2500,
      rewards: { coins: 40000, packs: 8, contract: 'Elite' },
    },
    {
      rank: 3,
      division: 'Professional',
      points: 2000,
      rewards: { coins: 30000, packs: 6, contract: 'Gold' },
    },
  ];

  return (
    <div className="card p-6">
      <h3 className="text-xl font-bold mb-4">🎁 Season Rewards</h3>

      <div className="space-y-3">
        {rewards.map((reward) => (
          <div key={reward.rank} className="bg-gray-800 p-4 rounded border-l-4 border-yellow-500">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-bold">
                  {reward.rank === 1 ? '🥇' : reward.rank === 2 ? '🥈' : '🥉'} Top {reward.rank}
                </p>
                <p className="text-sm text-gray-400">{reward.division}</p>
              </div>
              <span className="text-sm font-bold text-blue-400">{reward.points} points</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="text-center">
                <p className="text-yellow-400 font-bold">{reward.rewards.coins.toLocaleString()}</p>
                <p className="text-xs text-gray-400">Coins</p>
              </div>
              <div className="text-center">
                <p className="text-blue-400 font-bold">{reward.rewards.packs}</p>
                <p className="text-xs text-gray-400">Packs</p>
              </div>
              <div className="text-center">
                <p className="text-green-400 font-bold">{reward.rewards.contract}</p>
                <p className="text-xs text-gray-400">Contract</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-900 bg-opacity-30 rounded border border-blue-600 text-sm">
        <p className="text-blue-300 font-bold mb-1">💡 Season Ends In</p>
        <p className="text-gray-400">15 days, 7 hours</p>
      </div>
    </div>
  );
}

// Matchmaking Component
interface MatchmakingProps {
  onFindMatch: () => void;
  isSearching: boolean;
  estimatedWaitTime: number;
}

export function OnlineMatchmaking({ onFindMatch, isSearching, estimatedWaitTime }: MatchmakingProps) {
  return (
    <div className="card p-6 border-2 border-green-500">
      <h3 className="text-xl font-bold mb-4">🎮 Find Online Match</h3>

      {!isSearching ? (
        <div className="space-y-4">
          <p className="text-gray-300">Matchmaking will find you an opponent at a similar skill level.</p>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-800 p-3 rounded">
              <p className="text-gray-400">Average Wait Time</p>
              <p className="font-bold text-green-400">{estimatedWaitTime}s</p>
            </div>
            <div className="bg-gray-800 p-3 rounded">
              <p className="text-gray-400">Active Players</p>
              <p className="font-bold text-blue-400">24,532</p>
            </div>
          </div>

          <button onClick={onFindMatch} className="btn btn-primary w-full py-3 text-lg font-bold">
            🔍 Find Match
          </button>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <div className="relative h-20 flex items-center justify-center">
            <div className="absolute w-16 h-16 border-4 border-blue-500 rounded-full animate-spin"></div>
            <div className="absolute w-10 h-10 border-4 border-transparent border-t-green-500 rounded-full animate-spin" style={{ animationDirection: 'reverse' }}></div>
          </div>

          <div>
            <p className="font-bold text-lg">Searching for opponent...</p>
            <p className="text-sm text-gray-400 mt-1">{estimatedWaitTime}s elapsed</p>
          </div>

          <button className="btn btn-secondary w-full">Cancel Search</button>
        </div>
      )}
    </div>
  );
}
