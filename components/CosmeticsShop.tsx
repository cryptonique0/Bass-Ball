'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { CosmeticsManager, Cosmetic, Upgrade, PlayerCosmetic } from '@/lib/cosmeticsSystem';
import { EconomyManager } from '@/lib/economySystem';
import { BurnSinkManager } from '@/lib/burnSystem';
import { Sparkles, Zap, Star, Lock, Check, ShoppingCart, Flame } from 'lucide-react';

/**
 * Cosmetics Shop Component
 * Browse and purchase cosmetics and upgrades
 */
export function CosmeticsShop() {
  const cosmeticsMgr = CosmeticsManager.getInstance();
  const economyMgr = EconomyManager.getInstance();
  const burnSinkMgr = BurnSinkManager.getInstance();

  const [activeTab, setActiveTab] = useState<'cosmetics' | 'upgrades' | 'owned'>('cosmetics');
  const [cosmetics, setCosmetics] = useState<Cosmetic[]>([]);
  const [upgrades, setUpgrades] = useState<Upgrade[]>([]);
  const [playerCosmetics, setPlayerCosmetics] = useState<PlayerCosmetic[]>([]);
  const [cosmeticType, setCosmeticType] = useState<any>(undefined);
  const [rarityFilter, setRarityFilter] = useState<any>(undefined);
  const [userBalance, setUserBalance] = useState({ softBalance: 0, hardBalance: 0 });
  const [selectedCosmetic, setSelectedCosmetic] = useState<Cosmetic | null>(null);
  const [selectedUpgrade, setSelectedUpgrade] = useState<Upgrade | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId] = useState('player_1');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    setCosmetics(cosmeticsMgr.getCosmetics());
    setUpgrades(cosmeticsMgr.getUpgrades());
    setPlayerCosmetics(cosmeticsMgr.getPlayerCosmetics(userId));
    const balance = economyMgr.getBalance(userId, 'player', 'Player');
    setUserBalance(balance);
  };

  const filteredCosmetics = useMemo(() => {
    return cosmetics.filter(c => {
      if (cosmeticType && c.type !== cosmeticType) return false;
      if (rarityFilter && c.rarity !== rarityFilter) return false;
      return true;
    });
  }, [cosmetics, cosmeticType, rarityFilter]);

  const handlePurchaseCosmetic = async () => {
    if (!selectedCosmetic) return;

    setLoading(true);
    try {
      // Deduct cost
      if (selectedCosmetic.currencyType === 'soft') {
        economyMgr.subtractSoftCurrency(userId, selectedCosmetic.cost, `Cosmetic purchase: ${selectedCosmetic.name}`);
      } else {
        economyMgr.subtractHardCurrency(userId, selectedCosmetic.cost, `Cosmetic purchase: ${selectedCosmetic.name}`);
      }

      // Unlock cosmetic
      cosmeticsMgr.unlockCosmetic(userId, selectedCosmetic.cosmeticId);

      // Refresh
      loadData();
      setShowPurchaseModal(false);
      setSelectedCosmetic(null);
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseUpgrade = async () => {
    if (!selectedUpgrade) return;

    setLoading(true);
    try {
      // Deduct cost
      if (selectedUpgrade.currencyType === 'soft') {
        economyMgr.subtractSoftCurrency(userId, selectedUpgrade.cost, `Upgrade: ${selectedUpgrade.name}`);
      } else {
        economyMgr.subtractHardCurrency(userId, selectedUpgrade.cost, `Upgrade: ${selectedUpgrade.name}`);
      }

      // Unlock upgrade
      cosmeticsMgr.unlockUpgrade(userId, selectedUpgrade.upgradeId);

      // Refresh
      loadData();
      setShowUpgradeModal(false);
      setSelectedUpgrade(null);
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEquipCosmetic = (cosmeticId: string) => {
    cosmeticsMgr.equipCosmetic(userId, cosmeticId);
    loadData();
  };

  const tabs = [
    { id: 'cosmetics', label: 'Cosmetics Shop', icon: Sparkles },
    { id: 'upgrades', label: 'Upgrades', icon: Zap },
    { id: 'owned', label: 'My Collection', icon: Star },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Cosmetics & Upgrades</h1>
            <p className="text-slate-400">Customize your player and unlock powerful upgrades</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-400 mb-2">Your Balance</div>
            <div className="flex gap-4">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-2">
                <div className="text-sm text-yellow-400">Soft</div>
                <div className="text-2xl font-bold text-yellow-300">{userBalance.softBalance.toLocaleString()}</div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg px-4 py-2">
                <div className="text-sm text-blue-400">Hard</div>
                <div className="text-2xl font-bold text-blue-300">{userBalance.hardBalance.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 border-b border-slate-700">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                <Icon size={20} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Cosmetics Shop Tab */}
        {activeTab === 'cosmetics' && (
          <div>
            {/* Filters */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-white mb-4">Filter</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(['skin', 'effect', 'accessory', 'emote'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setCosmeticType(cosmeticType === type ? undefined : type)}
                    className={`px-4 py-2 rounded-lg transition text-sm ${
                      cosmeticType === type
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {type === 'skin' && '👕'} {type === 'effect' && '✨'} {type === 'accessory' && '💎'} {type === 'emote' && '😊'} {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>

              <div className="mt-4">
                <h4 className="text-sm text-slate-400 mb-2">Rarity</h4>
                <div className="flex gap-2 flex-wrap">
                  {(['common', 'uncommon', 'rare', 'epic', 'legendary'] as const).map(rarity => (
                    <button
                      key={rarity}
                      onClick={() => setRarityFilter(rarityFilter === rarity ? undefined : rarity)}
                      className={`px-3 py-1 rounded-lg transition text-xs font-semibold ${
                        rarityFilter === rarity
                          ? 'bg-emerald-600 text-white'
                          : `${
                              rarity === 'legendary'
                                ? 'bg-yellow-500/20 text-yellow-300'
                                : rarity === 'epic'
                                  ? 'bg-purple-500/20 text-purple-300'
                                  : rarity === 'rare'
                                    ? 'bg-blue-500/20 text-blue-300'
                                    : 'bg-slate-700 text-slate-300'
                            } hover:bg-slate-600`
                      }`}
                    >
                      {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Cosmetics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCosmetics.map(cosmetic => (
                <CosmeticCard
                  key={cosmetic.cosmeticId}
                  cosmetic={cosmetic}
                  isOwned={playerCosmetics.some(pc => pc.cosmeticId === cosmetic.cosmeticId)}
                  onPurchase={() => {
                    setSelectedCosmetic(cosmetic);
                    setShowPurchaseModal(true);
                  }}
                  canAfford={
                    cosmetic.currencyType === 'soft'
                      ? userBalance.softBalance >= cosmetic.cost
                      : userBalance.hardBalance >= cosmetic.cost
                  }
                />
              ))}
            </div>
          </div>
        )}

        {/* Upgrades Tab */}
        {activeTab === 'upgrades' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upgrades.map(upgrade => (
                <UpgradeCard
                  key={upgrade.upgradeId}
                  upgrade={upgrade}
                  isOwned={cosmeticsMgr.getPlayerUpgrades(userId).some(pu => pu.upgradeId === upgrade.upgradeId)}
                  onPurchase={() => {
                    setSelectedUpgrade(upgrade);
                    setShowUpgradeModal(true);
                  }}
                  canAfford={
                    upgrade.currencyType === 'soft'
                      ? userBalance.softBalance >= upgrade.cost
                      : userBalance.hardBalance >= upgrade.cost
                  }
                />
              ))}
            </div>
          </div>
        )}

        {/* Owned Tab */}
        {activeTab === 'owned' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">My Collection</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {playerCosmetics.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-slate-400 text-lg">No cosmetics yet. Visit the shop to get started!</p>
                </div>
              ) : (
                playerCosmetics.map(pc => {
                  const cosmetic = cosmetics.find(c => c.cosmeticId === pc.cosmeticId);
                  if (!cosmetic) return null;
                  return (
                    <OwnedCosmeticCard
                      key={pc.cosmeticId}
                      cosmetic={cosmetic}
                      playerCosmetic={pc}
                      onEquip={() => handleEquipCosmetic(pc.cosmeticId)}
                    />
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && selectedCosmetic && (
        <CosmeticPurchaseModal
          cosmetic={selectedCosmetic}
          onClose={() => setShowPurchaseModal(false)}
          onPurchase={handlePurchaseCosmetic}
          loading={loading}
          userBalance={userBalance}
        />
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && selectedUpgrade && (
        <UpgradePurchaseModal
          upgrade={selectedUpgrade}
          onClose={() => setShowUpgradeModal(false)}
          onPurchase={handlePurchaseUpgrade}
          loading={loading}
          userBalance={userBalance}
        />
      )}
    </div>
  );
}

/**
 * Cosmetic Card Component
 */
function CosmeticCard({
  cosmetic,
  isOwned,
  onPurchase,
  canAfford,
}: {
  cosmetic: Cosmetic;
  isOwned: boolean;
  onPurchase: () => void;
  canAfford: boolean;
}) {
  const rarityColors: Record<string, string> = {
    common: 'from-gray-400 to-gray-600',
    uncommon: 'from-green-400 to-green-600',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-yellow-400 to-yellow-600',
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden hover:border-slate-600 transition">
      {/* Preview */}
      <div className={`h-40 bg-gradient-to-br ${rarityColors[cosmetic.rarity]} flex items-center justify-center relative`}>
        <div className="text-5xl opacity-70">✨</div>
        {isOwned && (
          <div className="absolute top-2 right-2 bg-green-600 rounded-full p-1">
            <Check size={16} className="text-white" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-white mb-1">{cosmetic.name}</h3>
        <p className="text-sm text-slate-400 mb-3">{cosmetic.description}</p>

        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs px-2 py-1 rounded-full ${
            cosmetic.rarity === 'legendary' ? 'bg-yellow-500/20 text-yellow-300' :
            cosmetic.rarity === 'epic' ? 'bg-purple-500/20 text-purple-300' :
            cosmetic.rarity === 'rare' ? 'bg-blue-500/20 text-blue-300' :
            'bg-slate-700 text-slate-300'
          }`}>
            {cosmetic.rarity}
          </span>
          <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-full">
            {cosmetic.type === 'skin' && '👕'}
            {cosmetic.type === 'effect' && '✨'}
            {cosmetic.type === 'accessory' && '💎'}
            {cosmetic.type === 'emote' && '😊'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Cost</div>
            <div className="text-lg font-bold text-white">
              {cosmetic.currencyType === 'soft' ? '💰' : '⚡'} {cosmetic.cost.toLocaleString()}
            </div>
          </div>
          {!isOwned ? (
            <button
              onClick={onPurchase}
              disabled={!canAfford}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                canAfford
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-600 text-slate-400 cursor-not-allowed'
              }`}
            >
              <ShoppingCart size={16} />
              Buy
            </button>
          ) : (
            <div className="bg-green-600/20 text-green-300 px-3 py-2 rounded-lg text-sm font-semibold">
              ✓ Owned
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Upgrade Card Component
 */
function UpgradeCard({
  upgrade,
  isOwned,
  onPurchase,
  canAfford,
}: {
  upgrade: Upgrade;
  isOwned: boolean;
  onPurchase: () => void;
  canAfford: boolean;
}) {
  const typeIcons: Record<string, string> = {
    power: '💪',
    speed: '⚡',
    defense: '🛡️',
    special: '✨',
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-3xl mb-2">{typeIcons[upgrade.type]}</div>
          <h3 className="font-bold text-white mb-1">{upgrade.name}</h3>
          <p className="text-sm text-slate-400">{upgrade.description}</p>
        </div>
        {isOwned && (
          <div className="bg-green-600 rounded-full p-1">
            <Check size={20} className="text-white" />
          </div>
        )}
      </div>

      <div className="bg-slate-700/50 rounded-lg p-3 mb-4">
        <div className="text-xs text-slate-400 mb-1">Effect</div>
        <div className="text-lg font-bold text-white">+{(upgrade.effect * 100).toFixed(0)}% per level (Max: Level {upgrade.maxLevel})</div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-400">Cost</div>
          <div className="text-lg font-bold text-white">
            {upgrade.currencyType === 'soft' ? '💰' : '⚡'} {upgrade.cost.toLocaleString()}
          </div>
        </div>
        {!isOwned ? (
          <button
            onClick={onPurchase}
            disabled={!canAfford}
            className={`flex items-center gap-1 px-4 py-2 rounded-lg font-semibold transition ${
              canAfford
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-slate-600 text-slate-400 cursor-not-allowed'
            }`}
          >
            <ShoppingCart size={16} />
            Unlock
          </button>
        ) : (
          <div className="bg-green-600/20 text-green-300 px-4 py-2 rounded-lg font-semibold flex items-center gap-1">
            <Check size={16} />
            Owned
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Owned Cosmetic Card Component
 */
function OwnedCosmeticCard({
  cosmetic,
  playerCosmetic,
  onEquip,
}: {
  cosmetic: Cosmetic;
  playerCosmetic: PlayerCosmetic;
  onEquip: () => void;
}) {
  const rarityColors: Record<string, string> = {
    common: 'from-gray-400 to-gray-600',
    uncommon: 'from-green-400 to-green-600',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-yellow-400 to-yellow-600',
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      <div className={`h-40 bg-gradient-to-br ${rarityColors[cosmetic.rarity]} flex items-center justify-center relative`}>
        <div className="text-5xl">✨</div>
        {playerCosmetic.equipped && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <span className="text-white font-bold text-lg">EQUIPPED</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-white mb-3">{cosmetic.name}</h3>
        <button
          onClick={onEquip}
          className={`w-full py-2 rounded-lg font-semibold transition ${
            playerCosmetic.equipped
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {playerCosmetic.equipped ? '✓ Equipped' : 'Equip'}
        </button>
      </div>
    </div>
  );
}

/**
 * Purchase Modal Components
 */
function CosmeticPurchaseModal({
  cosmetic,
  onClose,
  onPurchase,
  loading,
  userBalance,
}: {
  cosmetic: Cosmetic;
  onClose: () => void;
  onPurchase: () => void;
  loading: boolean;
  userBalance: { softBalance: number; hardBalance: number };
}) {
  const canAfford = cosmetic.currencyType === 'soft' 
    ? userBalance.softBalance >= cosmetic.cost
    : userBalance.hardBalance >= cosmetic.cost;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-white mb-6">{cosmetic.name}</h2>

        <div className="bg-gradient-to-br from-purple-500 to-purple-700 h-48 rounded-lg flex items-center justify-center mb-6">
          <div className="text-6xl">✨</div>
        </div>

        <p className="text-slate-400 mb-6">{cosmetic.description}</p>

        <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-400">Cost</div>
              <div className="text-3xl font-bold text-white">
                {cosmetic.currencyType === 'soft' ? '💰' : '⚡'} {cosmetic.cost.toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400">Your Balance</div>
              <div className={`text-2xl font-bold ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                {cosmetic.currencyType === 'soft' ? userBalance.softBalance : userBalance.hardBalance.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {!canAfford && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-6">
            <p className="text-red-300 text-sm">Insufficient balance</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={onPurchase}
            disabled={loading || !canAfford}
            className={`flex-1 font-semibold py-2 rounded-lg transition ${
              canAfford && !loading
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-slate-600 text-slate-400 cursor-not-allowed'
            }`}
          >
            {loading ? 'Processing...' : 'Purchase'}
          </button>
        </div>
      </div>
    </div>
  );
}

function UpgradePurchaseModal({
  upgrade,
  onClose,
  onPurchase,
  loading,
  userBalance,
}: {
  upgrade: Upgrade;
  onClose: () => void;
  onPurchase: () => void;
  loading: boolean;
  userBalance: { softBalance: number; hardBalance: number };
}) {
  const canAfford = upgrade.currencyType === 'soft' 
    ? userBalance.softBalance >= upgrade.cost
    : userBalance.hardBalance >= upgrade.cost;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-white mb-6">{upgrade.name}</h2>

        <div className="bg-gradient-to-br from-blue-500 to-blue-700 h-48 rounded-lg flex items-center justify-center mb-6">
          <div className="text-6xl">⚡</div>
        </div>

        <p className="text-slate-400 mb-6">{upgrade.description}</p>

        <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-xs text-slate-400">Cost</div>
              <div className="text-2xl font-bold text-white">
                {upgrade.currencyType === 'soft' ? '💰' : '⚡'} {upgrade.cost.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Effect</div>
              <div className="text-2xl font-bold text-green-400">+{(upgrade.effect * 100).toFixed(0)}%</div>
            </div>
          </div>
          <div className="text-xs text-slate-400">Max Level: {upgrade.maxLevel}</div>
        </div>

        {!canAfford && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-6">
            <p className="text-red-300 text-sm">Insufficient balance</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={onPurchase}
            disabled={loading || !canAfford}
            className={`flex-1 font-semibold py-2 rounded-lg transition ${
              canAfford && !loading
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-slate-600 text-slate-400 cursor-not-allowed'
            }`}
          >
            {loading ? 'Processing...' : 'Unlock'}
          </button>
        </div>
      </div>
    </div>
  );
}
