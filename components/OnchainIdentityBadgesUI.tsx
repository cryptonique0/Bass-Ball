/**
 * Onchain Identity Badges UI Component
 * Display and manage NFT identity badges for players on Base
 */

'use client';

import React, { useState, useEffect } from 'react';
import { OnchainIdentityProvider } from '@/lib/onchainIdentityProvider';
import type { Badge, PlayerBadge, BadgeCollection } from '@/lib/onchainIdentityProvider';

interface BadgeUIProps {
  playerAddress: string;
  playerName: string;
  playerRating: number;
  playerStats: {
    gamesPlayed: number;
    wins: number;
    losses: number;
    currentStreak?: number;
    joinedAt: number;
  };
}

export const OnchainIdentityBadgesUI: React.FC<BadgeUIProps> = ({
  playerAddress,
  playerName,
  playerRating,
  playerStats,
}) => {
  const [activeTab, setActiveTab] = useState<'earned' | 'available' | 'leaderboard'>('earned');
  const [playerBadges, setPlayerBadges] = useState<PlayerBadge[]>([]);
  const [availableBadges, setAvailableBadges] = useState<Badge[]>([]);
  const [collection, setCollection] = useState<BadgeCollection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [selectedBadge, setSelectedBadge] = useState<PlayerBadge | Badge | null>(null);
  const [mintingBadgeId, setMintingBadgeId] = useState<string>('');

  const provider = OnchainIdentityProvider.getInstance();

  // Load badges on mount
  useEffect(() => {
    loadBadges();
  }, [playerAddress]);

  const loadBadges = () => {
    try {
      const badges = provider.getPlayerBadges(playerAddress);
      setPlayerBadges(badges);

      const winRate = playerStats.gamesPlayed > 0 ? (playerStats.wins / playerStats.gamesPlayed) * 100 : 0;
      const eligible = provider.checkBadgeEligibility(playerAddress, playerName, {
        gamesPlayed: playerStats.gamesPlayed,
        wins: playerStats.wins,
        losses: playerStats.losses,
        rating: playerRating,
        joinedAt: playerStats.joinedAt,
        currentStreak: playerStats.currentStreak,
      });

      const available = provider
        .getAllBadges()
        .filter(b => eligible.includes(b.badgeId) && !badges.some(pb => pb.badgeId === b.badgeId));

      setAvailableBadges(available);

      const col = provider.getPlayerCollection(playerAddress);
      setCollection(col);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load badges');
    }
  };

  const handleClaimBadge = async (badgeId: string) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const badge = provider.awardBadge(badgeId, playerAddress, playerName);
      setSuccess(`🎉 Badge "${badge.badgeSnapshot.name}" claimed!`);
      setPlayerBadges([...playerBadges, badge]);
      setAvailableBadges(availableBadges.filter(b => b.badgeId !== badgeId));

      setTimeout(() => loadBadges(), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim badge');
    } finally {
      setLoading(false);
    }
  };

  const handleMintBadge = async (badgeId: string) => {
    setLoading(true);
    setError('');
    setSuccess('');
    setMintingBadgeId(badgeId);

    try {
      const mintRequest = provider.requestBadgeMint(playerAddress, badgeId);

      // Simulate minting (in production, this would call actual smart contract)
      setTimeout(() => {
        const txHash = `0x${Math.random().toString(16).slice(2)}`;
        const contractAddress = '0x0000000000000000000000000000000000000000';
        const tokenId = Math.floor(Math.random() * 10000).toString();

        const completed = provider.completeBadgeMint(
          mintRequest.mintRequestId,
          txHash,
          contractAddress,
          tokenId,
          '0.002'
        );

        if (completed) {
          setSuccess(`✓ Badge minted onchain! TX: ${txHash.slice(0, 10)}...`);
          loadBadges();
        }

        setLoading(false);
        setMintingBadgeId('');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Minting failed');
      setLoading(false);
      setMintingBadgeId('');
    }
  };

  const getRarityColor = (rarity: string): string => {
    const colors: Record<string, string> = {
      common: 'from-gray-400 to-gray-600',
      uncommon: 'from-green-400 to-green-600',
      rare: 'from-blue-400 to-blue-600',
      epic: 'from-purple-400 to-purple-600',
      legendary: 'from-yellow-400 to-yellow-600',
    };
    return colors[rarity] || colors.common;
  };

  const getRarityBorder = (rarity: string): string => {
    const borders: Record<string, string> = {
      common: 'border-gray-500',
      uncommon: 'border-green-500',
      rare: 'border-blue-500',
      epic: 'border-purple-500',
      legendary: 'border-yellow-500',
    };
    return borders[rarity] || borders.common;
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-gradient-to-br from-slate-900 via-slate-800 to-black rounded-2xl overflow-hidden border border-slate-700">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white">{playerName}</h1>
            <p className="text-purple-200 text-sm">Onchain Identity Badges</p>
          </div>
          <div className="text-right">
            <p className="text-yellow-300 text-3xl font-bold">★ {playerRating}</p>
            <p className="text-purple-200 text-sm">{playerStats.gamesPlayed} matches</p>
          </div>
        </div>

        {/* Primary Badge */}
        {collection?.primaryBadge && (
          <div className="bg-black/40 rounded-lg p-4 border border-purple-400">
            <p className="text-purple-300 text-xs uppercase tracking-wide mb-2">Primary Badge</p>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{collection.primaryBadge.badgeSnapshot.icon}</span>
              <div>
                <p className="text-white font-bold">{collection.primaryBadge.badgeSnapshot.name}</p>
                <p className="text-purple-300 text-sm">{collection.primaryBadge.badgeSnapshot.description}</p>
              </div>
              {collection.primaryBadge.minted && (
                <span className="ml-auto text-green-400 text-sm font-semibold">✓ Minted</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="m-4 p-4 bg-red-900/30 border border-red-500 text-red-300 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="m-4 p-4 bg-green-900/30 border border-green-500 text-green-300 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0 border-b border-slate-700 px-6">
        {(['earned', 'available', 'leaderboard'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === tab
                ? 'border-b-blue-500 text-blue-400'
                : 'border-b-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab === 'earned' && `🎖️ Earned (${playerBadges.length})`}
            {tab === 'available' && `🎯 Available (${availableBadges.length})`}
            {tab === 'leaderboard' && '🏆 Leaderboard'}
          </button>
        ))}
      </div>

      <div className="p-6 space-y-6">
        {/* Earned Badges */}
        {activeTab === 'earned' && (
          <div>
            {playerBadges.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400 mb-4">No badges earned yet</p>
                <p className="text-slate-500 text-sm">Play more matches and improve your rating to earn badges!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {playerBadges.map(badge => (
                  <div
                    key={badge.badgeTokenId}
                    onClick={() => setSelectedBadge(badge)}
                    className={`bg-gradient-to-br ${getRarityColor(badge.badgeSnapshot.rarity)} p-0.5 rounded-xl cursor-pointer hover:shadow-lg transition-all ${getRarityBorder(badge.badgeSnapshot.rarity)} border-2`}
                  >
                    <div className="bg-slate-800 rounded-lg p-4">
                      <div className="text-5xl mb-3 text-center">{badge.badgeSnapshot.icon}</div>
                      <h3 className="text-white font-bold text-center mb-1">{badge.badgeSnapshot.name}</h3>
                      <p className="text-slate-300 text-xs text-center mb-3">{badge.badgeSnapshot.description}</p>

                      <div className="flex justify-between items-center text-xs">
                        <span className={`px-2 py-1 rounded-full capitalize font-semibold ${
                          badge.badgeSnapshot.rarity === 'legendary'
                            ? 'bg-yellow-500/20 text-yellow-300'
                            : badge.badgeSnapshot.rarity === 'epic'
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-slate-500/20 text-slate-300'
                        }`}>
                          {badge.badgeSnapshot.rarity}
                        </span>
                        {badge.minted && (
                          <span className="text-green-400 font-semibold">✓ Onchain</span>
                        )}
                      </div>

                      {!badge.minted && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMintBadge(badge.badgeId);
                          }}
                          disabled={loading || mintingBadgeId === badge.badgeId}
                          className="w-full mt-3 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-xs font-semibold rounded transition-colors"
                        >
                          {mintingBadgeId === badge.badgeId ? '⏳ Minting...' : '🔗 Mint NFT'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Available Badges */}
        {activeTab === 'available' && (
          <div>
            {availableBadges.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400 mb-4">No more badges to earn</p>
                <p className="text-slate-500 text-sm">You've already earned all available badges!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableBadges.map(badge => (
                  <div
                    key={badge.badgeId}
                    onClick={() => setSelectedBadge(badge)}
                    className={`bg-gradient-to-br ${getRarityColor(badge.rarity)} p-0.5 rounded-xl cursor-pointer hover:shadow-lg transition-all ${getRarityBorder(badge.rarity)} border-2`}
                  >
                    <div className="bg-slate-800 rounded-lg p-4">
                      <div className="text-5xl mb-3 text-center">{badge.icon}</div>
                      <h3 className="text-white font-bold text-center mb-1">{badge.name}</h3>
                      <p className="text-slate-300 text-xs text-center mb-3">{badge.description}</p>

                      <div className="bg-black/40 rounded p-2 mb-3 text-xs text-slate-300 space-y-1">
                        {badge.requirements.minGamesPlayed && (
                          <p>📊 {badge.requirements.minGamesPlayed}+ games</p>
                        )}
                        {badge.requirements.minWinRate && (
                          <p>🎯 {badge.requirements.minWinRate}% win rate</p>
                        )}
                        {badge.requirements.minRating && (
                          <p>⭐ {badge.requirements.minRating}+ rating</p>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClaimBadge(badge.badgeId);
                        }}
                        disabled={loading}
                        className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-xs font-semibold rounded transition-colors"
                      >
                        {loading ? '⏳ Claiming...' : '🎁 Claim'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Leaderboard */}
        {activeTab === 'leaderboard' && (
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Top Badge Collectors</h3>
            <div className="bg-slate-800 rounded-lg overflow-hidden">
              <div className="divide-y divide-slate-700">
                {Array.from({ length: 10 }).map((_, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 hover:bg-slate-700/50 transition-colors">
                    <span className="text-2xl font-bold text-yellow-400 w-8 text-center">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                    </span>
                    <div className="flex-1">
                      <p className="text-white font-semibold">Player {idx + 1}</p>
                      <p className="text-slate-400 text-sm">{Math.floor(Math.random() * 1000)} rating</p>
                    </div>
                    <div className="text-right">
                      <p className="text-blue-400 font-bold">{Math.floor(Math.random() * 6) + 1} badges</p>
                      <p className="text-slate-400 text-xs">
                        {['🚀', '🏆', '💎'][Math.floor(Math.random() * 3)]}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 max-w-md w-full p-6">
            <div className="text-center">
              <div className="text-7xl mb-4">{
                'badgeSnapshot' in selectedBadge
                  ? (selectedBadge as PlayerBadge).badgeSnapshot.icon
                  : (selectedBadge as Badge).icon
              }</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {'badgeSnapshot' in selectedBadge
                  ? (selectedBadge as PlayerBadge).badgeSnapshot.name
                  : (selectedBadge as Badge).name}
              </h2>
              <p className="text-slate-300 mb-4">
                {'badgeSnapshot' in selectedBadge
                  ? (selectedBadge as PlayerBadge).badgeSnapshot.description
                  : (selectedBadge as Badge).description}
              </p>

              {('badgeSnapshot' in selectedBadge) && (
                <div className="bg-black/40 rounded-lg p-3 mb-4 text-left space-y-2">
                  <p className="text-slate-400 text-xs">
                    <span className="text-white font-semibold">Earned:</span> {new Date((selectedBadge as PlayerBadge).earnedAt).toLocaleDateString()}
                  </p>
                  {(selectedBadge as PlayerBadge).minted && (
                    <p className="text-green-400 text-xs">
                      <span className="font-semibold">✓ Minted onchain</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedBadge(null)}
              className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnchainIdentityBadgesUI;
