/**
 * Seasonal Rankings & Team Ownership Components
 * UI for displaying NFTs and managing customization
 */

'use client';

import React, { useState, useMemo } from 'react';
import { SeasonalRankingNFTManager } from '@/lib/seasonalRankingNFT';
import { TeamOwnershipNFTManager } from '@/lib/teamOwnershipNFT';
import { TeamCustomizationManager } from '@/lib/teamCustomization';

/**
 * Seasonal Ranking NFT Display
 */
export function SeasonalRankingNFTCard({ nft }: { nft: any }) {
  const getBadgeColor = (badge: string) => {
    const colors: Record<string, string> = {
      platinum: '#E5E4E2',
      gold: '#FFD700',
      silver: '#C0C0C0',
      bronze: '#CD7F32',
      participant: '#808080',
    };
    return colors[badge] || '#808080';
  };

  const getBadgeLabel = (badge: string) => {
    const labels: Record<string, string> = {
      platinum: '🥇 Platinum',
      gold: '🥇 Gold',
      silver: '🥈 Silver',
      bronze: '🥉 Bronze',
      participant: '🎖️ Participant',
    };
    return labels[badge] || badge;
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 border-2 rounded-lg p-6 text-white max-w-sm">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-2xl font-bold">{nft.playerName}</h3>
          <p className="text-sm text-gray-300">{nft.playerTeam}</p>
        </div>
        <div
          className="px-4 py-2 rounded-full font-bold text-sm"
          style={{ backgroundColor: getBadgeColor(nft.badge), color: '#000' }}
        >
          {getBadgeLabel(nft.badge)}
        </div>
      </div>

      {/* Season Info */}
      <div className="mb-4 pb-4 border-b border-gray-600">
        <p className="text-sm text-gray-300">
          <span className="font-semibold">Season:</span> {nft.seasonName}
        </p>
        <p className="text-lg font-bold text-yellow-400">Rank #{nft.finalRank}</p>
        <p className="text-sm text-gray-300">
          {nft.leaguePosition}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-400">Total Points</p>
          <p className="text-xl font-bold">{nft.totalPoints}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Matches</p>
          <p className="text-xl font-bold">{nft.matchesPlayed}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Goals</p>
          <p className="text-xl font-bold text-green-400">⚽ {nft.goalsScored}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Assists</p>
          <p className="text-xl font-bold text-blue-400">🅰️ {nft.assists}</p>
        </div>
      </div>

      {/* Rating */}
      <div className="bg-gray-700 rounded p-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-300">Average Rating</span>
          <span className="text-2xl font-bold text-yellow-400">{nft.averageRating}/10</span>
        </div>
        <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
          <div
            className="bg-yellow-400 h-2 rounded-full"
            style={{ width: `${(nft.averageRating / 10) * 100}%` }}
          />
        </div>
      </div>

      {/* Token ID */}
      <p className="text-xs text-gray-500 truncate">{nft.tokenId}</p>
    </div>
  );
}

/**
 * Seasonal Leaderboard
 */
export function SeasonalLeaderboard({ seasonId }: { seasonId: string }) {
  const manager = SeasonalRankingNFTManager.getInstance();
  const leaderboard = manager.getSeasonLeaderboard(seasonId);
  const season = manager.getSeason(seasonId);

  const groupedByBadge = useMemo(() => {
    const groups: Record<string, any[]> = {
      platinum: [],
      gold: [],
      silver: [],
      bronze: [],
      participant: [],
    };
    leaderboard.forEach((nft) => {
      groups[nft.badge].push(nft);
    });
    return groups;
  }, [leaderboard]);

  const badgeIcons: Record<string, string> = {
    platinum: '🥇',
    gold: '🥇',
    silver: '🥈',
    bronze: '🥉',
    participant: '🎖️',
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl">
      <h2 className="text-3xl font-bold mb-2">{season?.seasonName} Leaderboard</h2>
      <p className="text-gray-600 mb-6">
        {leaderboard.length} players ranked
      </p>

      {Object.entries(groupedByBadge).map(([badge, players]) => {
        if (players.length === 0) return null;

        return (
          <div key={badge} className="mb-8">
            <h3 className="text-xl font-bold mb-4 capitalize flex items-center gap-2">
              <span>{badgeIcons[badge]}</span>
              {badge} ({players.length})
            </h3>

            <div className="space-y-2">
              {players.map((nft, idx) => (
                <div
                  key={nft.tokenId}
                  className="flex items-center justify-between bg-gray-50 p-4 rounded hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-gray-400 w-8">#{nft.finalRank}</span>
                    <div>
                      <p className="font-semibold text-gray-900">{nft.playerName}</p>
                      <p className="text-sm text-gray-600">{nft.playerTeam}</p>
                    </div>
                  </div>

                  <div className="flex gap-8 text-right">
                    <div>
                      <p className="text-xs text-gray-600">Points</p>
                      <p className="font-bold text-gray-900">{nft.totalPoints}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Rating</p>
                      <p className="font-bold text-yellow-600">{nft.averageRating}/10</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Goals</p>
                      <p className="font-bold text-green-600">{nft.goalsScored}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Team Ownership NFT Card
 */
export function TeamOwnershipNFTCard({ nft }: { nft: any }) {
  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      founder: '#E5E4E2',
      major: '#FFD700',
      minor: '#0066FF',
      supporter: '#808080',
    };
    return colors[tier] || '#808080';
  };

  return (
    <div className="bg-gradient-to-br from-blue-900 to-blue-800 border-2 rounded-lg p-6 text-white max-w-sm">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-2xl font-bold">{nft.teamName}</h3>
          <p className="text-sm text-gray-300">{nft.teamCity}</p>
        </div>
        <div
          className="px-4 py-2 rounded-full font-bold text-sm"
          style={{ backgroundColor: getTierColor(nft.ownershipTier), color: '#000' }}
        >
          {nft.ownershipTier}
        </div>
      </div>

      {/* Ownership */}
      <div className="mb-4 pb-4 border-b border-blue-600">
        <p className="text-3xl font-bold text-blue-300">{nft.ownershipPercentage}%</p>
        <p className="text-sm text-gray-300">Ownership</p>
      </div>

      {/* Rights & Privileges */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-300">Voting Rights</span>
          <span className={nft.votingRights ? 'text-green-400' : 'text-red-400'}>
            {nft.votingRights ? '✓' : '✗'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-300">Voting Power</span>
          <span className="font-bold">{nft.governanceVotingPower}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-300">Revenue Share</span>
          <span className="font-bold text-green-400">{nft.revenueShare}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-300">Free Tickets</span>
          <span className="font-bold">{nft.matchTicketAllowance}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-300">Merch Discount</span>
          <span className="font-bold text-yellow-400">{nft.merchandiseDiscount}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-300">Board Seat Eligible</span>
          <span className={nft.boardSeatEligible ? 'text-green-400' : 'text-red-400'}>
            {nft.boardSeatEligible ? '✓' : '✗'}
          </span>
        </div>
      </div>

      {/* Team Performance */}
      <div className="bg-blue-700 rounded p-3 mb-4">
        <p className="text-xs text-gray-300 mb-2">Team Record</p>
        <div className="flex gap-4 font-bold">
          <div>
            <p className="text-xs text-gray-400">W-D-L</p>
            <p className="text-lg">
              {nft.teamWins}-{nft.teamDraws}-{nft.teamLosses}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Win %</p>
            <p className="text-lg text-green-300">{nft.teamWinPercentage.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Years Owned */}
      <p className="text-sm text-gray-300">
        <span className="font-semibold">Years Owned:</span> {nft.yearsOwned}
      </p>
    </div>
  );
}

/**
 * Team Customization Preview
 */
export function TeamCustomizationPreview({ teamId }: { teamId: string }) {
  const manager = TeamCustomizationManager.getInstance();
  const customization = manager.getTeamCustomization(teamId);

  if (!customization) {
    return (
      <div className="bg-gray-100 rounded-lg p-6 text-center">
        <p className="text-gray-600">No customization found for this team</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl">
      <h2 className="text-2xl font-bold mb-4">{customization.teamName}</h2>

      {/* Team Colors */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Team Colors</h3>
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <div
              className="w-16 h-16 rounded border-2 border-gray-300"
              style={{ backgroundColor: customization.teamColors.primary }}
            />
            <p className="text-sm text-gray-600 mt-2">Primary</p>
            <p className="text-xs font-mono text-gray-500">{customization.teamColors.primary}</p>
          </div>
          <div className="flex flex-col items-center">
            <div
              className="w-16 h-16 rounded border-2 border-gray-300"
              style={{ backgroundColor: customization.teamColors.secondary }}
            />
            <p className="text-sm text-gray-600 mt-2">Secondary</p>
            <p className="text-xs font-mono text-gray-500">{customization.teamColors.secondary}</p>
          </div>
          <div className="flex flex-col items-center">
            <div
              className="w-16 h-16 rounded border-2 border-gray-300"
              style={{ backgroundColor: customization.teamColors.accent }}
            />
            <p className="text-sm text-gray-600 mt-2">Accent</p>
            <p className="text-xs font-mono text-gray-500">{customization.teamColors.accent}</p>
          </div>
        </div>
      </div>

      {/* Jerseys */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {['home', 'away', 'third'].map((type) => {
          const jersey = customization[`jersey${type.charAt(0).toUpperCase() + type.slice(1)}` as any];
          if (!jersey) return null;

          return (
            <div key={type} className="text-center">
              <p className="font-semibold capitalize mb-2">{type} Jersey</p>
              <div
                className="w-full h-24 rounded border-2 border-gray-300 flex items-center justify-center text-white font-bold"
                style={{
                  background: `linear-gradient(135deg, ${jersey.primary} 50%, ${jersey.secondary} 50%)`,
                }}
              >
                {customization.teamName.substring(0, 3).toUpperCase()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Current Badge */}
      {customization.currentBadge && (
        <div className="mb-6 p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">Current Badge</h3>
          <div className="flex items-center gap-4">
            <div
              className="w-20 h-20 rounded-full border-4 flex items-center justify-center text-white font-bold"
              style={{
                backgroundColor: customization.currentBadge.colors.primary,
                borderColor: customization.currentBadge.colors.accent,
              }}
            >
              {customization.currentBadge.text.teamName.substring(0, 1)}
            </div>
            <div>
              <p className="font-semibold capitalize">{customization.currentBadge.design}</p>
              <p className="text-sm text-gray-600">{customization.currentBadge.text.teamName}</p>
              <p className="text-xs text-gray-500">
                {new Date(customization.currentBadge.createdDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Team Details */}
      {(customization.teamStadium || customization.teamMotto) && (
        <div className="mb-6 p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">Team Details</h3>
          {customization.teamStadium && (
            <p className="text-sm">
              <span className="font-semibold">Stadium:</span> {customization.teamStadium}
            </p>
          )}
          {customization.teamMotto && (
            <p className="text-sm mt-1">
              <span className="font-semibold">Motto:</span> <em>{customization.teamMotto}</em>
            </p>
          )}
        </div>
      )}

      {/* History */}
      {customization.customizationHistory.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Customization History</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {customization.customizationHistory.slice(0, 5).map((entry, idx) => (
              <div key={idx} className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
                <p className="font-mono">{new Date(entry.timestamp).toLocaleDateString()}</p>
                <p>{entry.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
