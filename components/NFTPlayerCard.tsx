/**
 * NFT Player Card Display & Management Component
 * Shows player cards with stats, upgrades, and transfers
 */

'use client';

import React, { useState, useEffect } from 'react';
import NFTPlayerCardManager, { type NFTPlayerCard, type PlayerCardStats } from '../lib/nftPlayerCards';

interface NFTPlayerCardProps {
  card: NFTPlayerCard;
  showActions?: boolean;
  onUpgrade?: (tokenId: string, stat: keyof PlayerCardStats) => void;
  onTransfer?: (tokenId: string, toOwner: string) => void;
  compact?: boolean;
}

/**
 * StatBar Component - Visual stat display
 */
function StatBar({ stat, value, max = 99 }: { stat: string; value: number; max?: number }) {
  const percentage = (value / max) * 100;
  let color = '#4CBB17'; // Green default

  if (value < 40) color = '#FF6B6B'; // Red
  else if (value < 65) color = '#FFA500'; // Orange
  else if (value < 85) color = '#4CBB17'; // Green
  else color = '#FFD700'; // Gold

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-semibold">
        <span>{stat}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/**
 * RarityBadge Component
 */
function RarityBadge({ rarity }: { rarity: string }) {
  const rarityColors: Record<string, string> = {
    common: 'bg-gray-200 text-gray-900',
    uncommon: 'bg-green-200 text-green-900',
    rare: 'bg-blue-200 text-blue-900',
    epic: 'bg-purple-200 text-purple-900',
    legendary: 'bg-yellow-200 text-yellow-900',
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-bold ${
        rarityColors[rarity] || rarityColors.common
      }`}
    >
      {rarity.toUpperCase()}
    </span>
  );
}

/**
 * NFTPlayerCard Component - Main card display
 */
export function NFTPlayerCardDisplay({
  card,
  showActions = false,
  onUpgrade,
  onTransfer,
  compact = false,
}: NFTPlayerCardProps) {
  const manager = NFTPlayerCardManager.getInstance();
  const rating = manager.calculateCardRating(card);
  const config = manager.getRarityConfig(card.rarity);

  const [isUpgrading, setIsUpgrading] = useState(false);
  const [selectedStat, setSelectedStat] = useState<keyof PlayerCardStats>('pace');
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferTo, setTransferTo] = useState('');

  const handleUpgradeStat = (stat: keyof PlayerCardStats) => {
    if (onUpgrade) {
      onUpgrade(card.tokenId, stat);
      setIsUpgrading(false);
    }
  };

  const handleTransfer = () => {
    if (onTransfer && transferTo.trim()) {
      onTransfer(card.tokenId, transferTo);
      setTransferTo('');
      setIsTransferring(false);
    }
  };

  if (compact) {
    return (
      <div className="rounded-lg border border-gray-300 bg-white p-3 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="font-bold text-gray-900">{card.playerName}</div>
            <div className="text-xs text-gray-600">
              {card.playerTeam} • {card.playerPosition}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{rating}</div>
            <RarityBadge rarity={card.rarity} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className="font-semibold">{card.stats.pace}</div>
            <div className="text-gray-600">Pace</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">{card.stats.shooting}</div>
            <div className="text-gray-600">Shooting</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">{card.stats.defense}</div>
            <div className="text-gray-600">Defense</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 bg-gradient-to-b from-white to-gray-50 shadow-lg overflow-hidden"
      style={{ borderColor: config.color }}>
      {/* Card Header */}
      <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-2xl font-bold">{card.playerName}</h2>
            <p className="text-blue-100">{card.playerTeam}</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{rating}</div>
            <p className="text-blue-100 text-sm">Overall</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-blue-100">{card.playerPosition}</span>
          <RarityBadge rarity={card.rarity} />
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6 space-y-6">
        {/* Stats Section */}
        <div className="space-y-3">
          <h3 className="font-bold text-gray-900">Player Stats</h3>
          <StatBar stat="Pace" value={card.stats.pace} max={config.maxStats} />
          <StatBar stat="Shooting" value={card.stats.shooting} max={config.maxStats} />
          <StatBar stat="Defense" value={card.stats.defense} max={config.maxStats} />
        </div>

        {/* Upgrade Info */}
        <div className="bg-gray-100 rounded-lg p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700">Upgrades Used</span>
            <span className="font-bold">
              {card.upgradesUsed} / {card.maxUpgrades}
            </span>
          </div>
          <div className="mt-2 h-2 bg-gray-300 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all"
              style={{ width: `${(card.upgradesUsed / card.maxUpgrades) * 100}%` }}
            />
          </div>
          {card.nextUpgradeCost && (
            <p className="text-xs text-gray-600 mt-2">
              Next upgrade cost: {card.nextUpgradeCost} credits
            </p>
          )}
        </div>

        {/* Ownership Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-100 rounded-lg p-3">
            <p className="text-gray-600">Owner</p>
            <p className="font-mono text-xs truncate text-gray-900">
              {card.owner.slice(0, 10)}...
            </p>
          </div>
          <div className="bg-gray-100 rounded-lg p-3">
            <p className="text-gray-600">Token ID</p>
            <p className="font-mono text-xs truncate text-gray-900">
              {card.tokenId.slice(0, 10)}...
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                card.isTransferable ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-gray-700">
              {card.isTransferable ? 'Transferable' : 'Locked'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                card.upgradeable ? 'bg-green-500' : 'bg-gray-400'
              }`}
            />
            <span className="text-gray-700">
              {card.upgradeable ? 'Upgradeable' : 'Maxed'}
            </span>
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="space-y-3 pt-4 border-t border-gray-200">
            {card.upgradeable && card.upgradesUsed < card.maxUpgrades && (
              <div className="space-y-2">
                {!isUpgrading ? (
                  <button
                    onClick={() => setIsUpgrading(true)}
                    className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Upgrade Stat
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Select stat to upgrade:</p>
                    {(['pace', 'shooting', 'defense'] as const).map((stat) => {
                      const config = manager.getRarityConfig(card.rarity);
                      const isMaxed = card.stats[stat] >= config.maxStats;

                      return (
                        <button
                          key={stat}
                          onClick={() => handleUpgradeStat(stat)}
                          disabled={isMaxed}
                          className={`w-full px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                            isMaxed
                              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                          }`}
                        >
                          {stat.charAt(0).toUpperCase() + stat.slice(1)} ({card.stats[stat]})
                          {!isMaxed && ` → ${card.stats[stat] + 1}`}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setIsUpgrading(false)}
                      className="w-full px-3 py-2 rounded-lg text-sm font-semibold bg-gray-300 text-gray-900 hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}

            {card.isTransferable && (
              <div className="space-y-2">
                {!isTransferring ? (
                  <button
                    onClick={() => setIsTransferring(true)}
                    className="w-full px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
                  >
                    Transfer Card
                  </button>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Enter wallet address"
                      value={transferTo}
                      onChange={(e) => setTransferTo(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleTransfer}
                        disabled={!transferTo.trim()}
                        className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setIsTransferring(false)}
                        className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold bg-gray-300 text-gray-900 hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                    {card.transferFee && (
                      <p className="text-xs text-gray-600 text-center">
                        Transfer fee: {card.transferFee}%
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upgrade History */}
      {card.upgradeHistory.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <h4 className="text-sm font-bold text-gray-900 mb-2">Upgrade History</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {card.upgradeHistory.slice(-5).map((upgrade, idx) => (
              <div key={idx} className="text-xs bg-white rounded p-2 border border-gray-200">
                <div className="flex justify-between">
                  <span className="font-semibold">
                    {upgrade.stat.charAt(0).toUpperCase() + upgrade.stat.slice(1)}
                  </span>
                  <span className="text-blue-600">
                    {upgrade.previousValue} → {upgrade.newValue}
                  </span>
                </div>
                <div className="text-gray-600">
                  {new Date(upgrade.timestamp * 1000).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * NFTPlayerCardCollection Component - Display multiple cards
 */
export function NFTPlayerCardCollection({ cards }: { cards: NFTPlayerCard[] }) {
  const [sortBy, setSortBy] = useState<'rating' | 'rarity' | 'name'>('rating');
  const manager = NFTPlayerCardManager.getInstance();

  const sortedCards = [...cards].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return manager.calculateCardRating(b) - manager.calculateCardRating(a);
      case 'rarity': {
        const rarityOrder = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };
        return (
          (rarityOrder[b.rarity as keyof typeof rarityOrder] || 0) -
          (rarityOrder[a.rarity as keyof typeof rarityOrder] || 0)
        );
      }
      case 'name':
        return a.playerName.localeCompare(b.playerName);
      default:
        return 0;
    }
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">NFT Player Cards ({cards.length})</h2>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'rating' | 'rarity' | 'name')}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-semibold"
        >
          <option value="rating">Sort by Rating</option>
          <option value="rarity">Sort by Rarity</option>
          <option value="name">Sort by Name</option>
        </select>
      </div>

      {cards.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          No cards in collection
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedCards.map((card) => (
            <NFTPlayerCardDisplay key={card.tokenId} card={card} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * NFTPlayerCardMarketplace Component - Buy/Sell/Trade cards
 */
export function NFTPlayerCardMarketplace() {
  const manager = NFTPlayerCardManager.getInstance();
  const [allCards] = useState<NFTPlayerCard[]>(manager.getAllCards());
  const [filterRarity, setFilterRarity] = useState('all');

  const filtered =
    filterRarity === 'all'
      ? allCards
      : allCards.filter((c) => c.rarity === filterRarity);

  const byRarity = {
    common: filtered.filter((c) => c.rarity === 'common').length,
    uncommon: filtered.filter((c) => c.rarity === 'uncommon').length,
    rare: filtered.filter((c) => c.rarity === 'rare').length,
    epic: filtered.filter((c) => c.rarity === 'epic').length,
    legendary: filtered.filter((c) => c.rarity === 'legendary').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {(Object.keys(byRarity) as Array<keyof typeof byRarity>).map((rarity) => (
          <div
            key={rarity}
            className="bg-white rounded-lg border border-gray-200 p-4 text-center cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setFilterRarity(filterRarity === rarity ? 'all' : rarity)}
          >
            <div className="text-2xl font-bold text-gray-900">{byRarity[rarity]}</div>
            <div className="text-sm font-semibold text-gray-600 capitalize">{rarity}</div>
          </div>
        ))}
      </div>

      {/* Card Grid */}
      <NFTPlayerCardCollection cards={filtered} />
    </div>
  );
}

export default NFTPlayerCardDisplay;
