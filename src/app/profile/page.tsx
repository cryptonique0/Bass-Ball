'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useMatchStore } from '@/store/useMatchStore';
import { getPlayerNFTs, getTeamNFT } from '@/lib/contracts';
import Link from 'next/link';

interface MatchHistoryEntry {
  matchId: string;
  date: Date;
  homeScore: number;
  awayScore: number;
  duration: number;
  result: 'win' | 'loss' | 'draw';
  opponent: string;
}

const ProfilePage = () => {
  const { user } = usePrivy();
  const { playerProfile, setPlayerProfile } = useMatchStore();
  const [nfts, setNfts] = useState<any[]>([]);
  const [teamNft, setTeamNft] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'matches' | 'nfts'>('stats');

  useEffect(() => {
    if (!playerProfile || !user?.wallet?.address) {
      setIsLoading(false);
      return;
    }

    const loadProfile = async () => {
      setIsLoading(true);
      try {
        // Load NFTs
        const playerNfts = await getPlayerNFTs(playerProfile.id, user.wallet!.address);
        setNfts(playerNfts);

        // Load team NFT
        const team = await getTeamNFT(playerProfile.id, user.wallet!.address);
        setTeamNft(team);
      } catch (error) {
        console.error('Failed to load profile data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [playerProfile?.id, user?.wallet?.address]);

  if (!playerProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-2xl font-bold mb-4">Player profile not found</p>
          <Link href="/" className="text-blue-400 hover:text-blue-300">
            Return to home
          </Link>
        </div>
      </div>
    );
  }

  const mockMatchHistory: MatchHistoryEntry[] = [
    {
      matchId: 'match-1',
      date: new Date(Date.now() - 86400000),
      homeScore: 2,
      awayScore: 1,
      duration: 1800,
      result: 'win',
      opponent: 'Crypto Kings',
    },
    {
      matchId: 'match-2',
      date: new Date(Date.now() - 172800000),
      homeScore: 1,
      awayScore: 1,
      duration: 1800,
      result: 'draw',
      opponent: 'Web3 Warriors',
    },
    {
      matchId: 'match-3',
      date: new Date(Date.now() - 259200000),
      homeScore: 0,
      awayScore: 2,
      duration: 1800,
      result: 'loss',
      opponent: 'DeFi Dragons',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">{playerProfile.username}</h1>
              <p className="text-blue-100">
                {user?.wallet?.address
                  ? `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}`
                  : 'Guest Player'}
              </p>
            </div>
            <Link
              href="/game"
              className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded font-semibold transition-colors"
            >
              Play Match
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-blue-700/50 rounded p-4">
              <p className="text-blue-200 text-sm">Rating</p>
              <p className="text-3xl font-bold">{playerProfile.ranking.rating.toFixed(0)}</p>
            </div>
            <div className="bg-green-700/50 rounded p-4">
              <p className="text-green-200 text-sm">Wins</p>
              <p className="text-3xl font-bold">{playerProfile.stats.wins}</p>
            </div>
            <div className="bg-red-700/50 rounded p-4">
              <p className="text-red-200 text-sm">Losses</p>
              <p className="text-3xl font-bold">{playerProfile.stats.losses}</p>
            </div>
            <div className="bg-purple-700/50 rounded p-4">
              <p className="text-purple-200 text-sm">Goals</p>
              <p className="text-3xl font-bold">{playerProfile.stats.goalsScored}</p>
            </div>
            <div className="bg-yellow-700/50 rounded p-4">
              <p className="text-yellow-200 text-sm">Win Rate</p>
              <p className="text-3xl font-bold">
                {playerProfile.stats.wins + playerProfile.stats.losses > 0
                  ? (
                      (playerProfile.stats.wins / (playerProfile.stats.wins + playerProfile.stats.losses)) *
                      100
                    ).toFixed(1)
                  : '0'}
                %
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-700">
          {(['stats', 'matches', 'nfts'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-4 font-semibold transition-colors border-b-2 ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Detailed Stats */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">Career Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Matches</span>
                  <span className="text-white font-semibold">
                    {playerProfile.stats.wins + playerProfile.stats.losses}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Goals Scored</span>
                  <span className="text-green-400 font-semibold">{playerProfile.stats.goalsScored}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Goals Conceded</span>
                  <span className="text-red-400 font-semibold">{playerProfile.stats.goalsConceded}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Assists</span>
                  <span className="text-blue-400 font-semibold">{playerProfile.stats.assists}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                  <span className="text-gray-400">Goal Differential</span>
                  <span className="text-yellow-400 font-semibold">
                    {playerProfile.stats.goalsScored - playerProfile.stats.goalsConceded}
                  </span>
                </div>
              </div>
            </div>

            {/* Ranking Info */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">Ranking</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm mb-2">ELO Rating</p>
                  <div className="text-4xl font-bold text-blue-400">{playerProfile.ranking.rating.toFixed(0)}</div>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">Leaderboard Position</p>
                  <div className="text-3xl font-bold text-green-400">#{playerProfile.ranking.position || 'N/A'}</div>
                </div>
                <div className="bg-blue-900/30 rounded p-3">
                  <p className="text-xs text-gray-400">Rating increases with wins against higher-rated opponents</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Matches Tab */}
        {activeTab === 'matches' && (
          <div className="space-y-4">
            {mockMatchHistory.length > 0 ? (
              mockMatchHistory.map((match) => (
                <div
                  key={match.matchId}
                  className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">{match.date.toLocaleDateString()}</p>
                      <p className="text-white font-semibold">vs {match.opponent}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-bold">
                          <span className="text-white">{match.homeScore}</span>
                          <span className="text-gray-500 mx-2">-</span>
                          <span className="text-white">{match.awayScore}</span>
                        </div>
                        <span
                          className={`px-3 py-1 rounded font-semibold text-sm ${
                            match.result === 'win'
                              ? 'bg-green-900 text-green-400'
                              : match.result === 'loss'
                                ? 'bg-red-900 text-red-400'
                                : 'bg-yellow-900 text-yellow-400'
                          }`}
                        >
                          {match.result.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400">No matches yet. Play your first match!</p>
              </div>
            )}
          </div>
        )}

        {/* NFTs Tab */}
        {activeTab === 'nfts' && (
          <div className="space-y-6">
            {/* Team NFT */}
            {teamNft && (
              <div className="bg-gray-800 rounded-lg p-6 border border-purple-500">
                <h3 className="text-xl font-bold text-white mb-4">Team NFT</h3>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
                    <span className="text-4xl">🏆</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg">{teamNft.teamName}</p>
                    <p className="text-gray-400">{teamNft.league}</p>
                    <p className="text-xs text-gray-500 mt-2">Soul-Bound (Non-transferable)</p>
                  </div>
                </div>
              </div>
            )}

            {/* Player Card NFTs */}
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-400">Loading NFTs...</p>
              </div>
            ) : nfts.length > 0 ? (
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Player Card NFTs</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {nfts.map((nft) => (
                    <div
                      key={nft.id}
                      className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors text-center"
                    >
                      <div className="w-full aspect-square bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-lg mb-3 flex items-center justify-center">
                        <span className="text-4xl">🎁</span>
                      </div>
                      <p className="text-white font-semibold text-sm">{nft.name}</p>
                      <p className="text-gray-400 text-xs mt-1">
                        {nft.rarity.charAt(0).toUpperCase() + nft.rarity.slice(1)}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">x{nft.balance}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400">No NFTs yet. Win matches to earn rewards!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
