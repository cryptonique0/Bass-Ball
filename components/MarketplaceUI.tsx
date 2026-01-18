'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { MarketplaceManager, Listing, MarketplaceStats, CurrencyType } from '@/lib/marketplaceSystem';
import { EconomyManager } from '@/lib/economySystem';
import { Search, Filter, TrendingUp, Zap, Home, X } from 'lucide-react';

/**
 * Marketplace UI Component
 * Main interface for trading NFTs
 */
export function MarketplaceUI() {
  const marketplaceMgr = MarketplaceManager.getInstance();
  const economyMgr = EconomyManager.getInstance();

  const [activeTab, setActiveTab] = useState<'browse' | 'my-listings' | 'stats'>('browse');
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [filter, setFilter] = useState<{
    currency?: CurrencyType;
    minPrice?: number;
    maxPrice?: number;
    rarity?: string;
  }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userBalance, setUserBalance] = useState({ softBalance: 0, hardBalance: 0 });
  const [userId] = useState('player_1'); // Replace with actual user ID

  // Load marketplace data
  useEffect(() => {
    const loadData = () => {
      setListings(marketplaceMgr.getActiveListings(100));
      setStats(marketplaceMgr.getMarketplaceStats());
      const balance = economyMgr.getBalance(userId, 'player', 'Player');
      setUserBalance(balance);
    };

    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Filter listings
  const filteredListings = useMemo(() => {
    let result = listings;

    if (searchQuery) {
      result = marketplaceMgr.searchListings(searchQuery);
    } else if (Object.keys(filter).length > 0) {
      result = marketplaceMgr.filterListings(
        filter.currency,
        filter.minPrice,
        filter.maxPrice,
        filter.rarity
      );
    }

    return result;
  }, [listings, searchQuery, filter]);

  const handlePurchase = async () => {
    if (!selectedListing) return;

    setLoading(true);
    try {
      // Deduct from buyer balance
      if (selectedListing.currencyType === 'soft') {
        economyMgr.subtractSoftCurrency(userId, selectedListing.price, `Marketplace purchase: ${selectedListing.nft.playerName}`);
      } else {
        economyMgr.subtractHardCurrency(userId, selectedListing.price, `Marketplace purchase: ${selectedListing.nft.playerName}`);
      }

      // Process purchase
      const result = marketplaceMgr.purchaseListing(
        selectedListing.listingId,
        userId,
        'Player',
        selectedListing.price
      );

      if (result.success) {
        // Add reward to seller
        const seller = selectedListing.seller;
        if (selectedListing.currencyType === 'soft') {
          economyMgr.addSoftCurrency(seller, result.total, `Marketplace sale: ${selectedListing.nft.playerName}`);
        } else {
          economyMgr.addHardCurrency(seller, result.total, `Marketplace sale: ${selectedListing.nft.playerName}`);
        }

        // Refresh data
        setListings(marketplaceMgr.getActiveListings(100));
        setShowPurchaseModal(false);
        setSelectedListing(null);
      }
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'browse', label: 'Browse Market', icon: Home },
    { id: 'my-listings', label: 'My Listings', icon: TrendingUp },
    { id: 'stats', label: 'Statistics', icon: Zap },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">NFT Marketplace</h1>
            <p className="text-slate-400">Trade player NFTs and build your collection</p>
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
        {/* Browse Tab */}
        {activeTab === 'browse' && (
          <div>
            {/* Search and Filter */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-8">
              <div className="flex gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 text-slate-500" size={20} />
                  <input
                    type="text"
                    placeholder="Search by player name, NFT ID..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <button className="bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg px-4 py-2 text-white flex items-center gap-2 transition">
                  <Filter size={20} />
                  Filter
                </button>
              </div>

              {/* Quick Filters */}
              <div className="flex gap-2 flex-wrap">
                {(['soft', 'hard'] as CurrencyType[]).map(curr => (
                  <button
                    key={curr}
                    onClick={() => setFilter(f => ({ ...f, currency: f.currency === curr ? undefined : curr }))}
                    className={`px-4 py-2 rounded-lg transition ${
                      filter.currency === curr
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {curr === 'soft' ? '💰 Soft' : '⚡ Hard'}
                  </button>
                ))}
              </div>
            </div>

            {/* Listings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-slate-400 text-lg">No listings found</p>
                </div>
              ) : (
                filteredListings.map(listing => (
                  <ListingCard
                    key={listing.listingId}
                    listing={listing}
                    onSelect={() => {
                      setSelectedListing(listing);
                      setShowPurchaseModal(true);
                    }}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* My Listings Tab */}
        {activeTab === 'my-listings' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Your Active Listings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {marketplaceMgr.getSellerListings(userId).length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-slate-400 text-lg">No active listings</p>
                </div>
              ) : (
                marketplaceMgr.getSellerListings(userId).map(listing => (
                  <ListingCard key={listing.listingId} listing={listing} isOwned={true} />
                ))
              )}
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard label="Active Listings" value={stats.activeListing} icon={TrendingUp} />
            <StatCard label="Total Transactions" value={stats.totalTransactions} icon={Zap} />
            <StatCard label="Total Volume" value={`${stats.totalVolume.toLocaleString()}`} icon={Home} />
            <StatCard label="Unique Players" value={stats.uniquePlayers} />
            <StatCard label="Floor Price" value={`${stats.floorPrice.toLocaleString()}`} />
            <StatCard label="Avg Price" value={`${stats.avgPrice.toFixed(0)}`} />
          </div>
        )}
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && selectedListing && (
        <PurchaseModal
          listing={selectedListing}
          onClose={() => setShowPurchaseModal(false)}
          onPurchase={handlePurchase}
          loading={loading}
          userBalance={userBalance}
        />
      )}
    </div>
  );
}

/**
 * Listing Card Component
 */
function ListingCard({
  listing,
  onSelect,
  isOwned = false,
}: {
  listing: Listing;
  onSelect?: () => void;
  isOwned?: boolean;
}) {
  const rarityColors: Record<string, string> = {
    common: 'from-gray-400 to-gray-600',
    uncommon: 'from-green-400 to-green-600',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-yellow-400 to-yellow-600',
  };

  return (
    <div className={`bg-slate-800 border border-slate-700 rounded-lg overflow-hidden hover:border-slate-600 transition ${
      !isOwned ? 'cursor-pointer' : ''
    }`} onClick={!isOwned ? onSelect : undefined}>
      {/* Image placeholder */}
      <div className={`h-48 bg-gradient-to-br ${rarityColors[listing.nft.rarity] || rarityColors.common} flex items-center justify-center`}>
        <div className="text-4xl opacity-50">👤</div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-white mb-1">{listing.nft.playerName}</h3>
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs px-2 py-1 rounded-full ${
            listing.nft.rarity === 'legendary' ? 'bg-yellow-500/20 text-yellow-300' :
            listing.nft.rarity === 'epic' ? 'bg-purple-500/20 text-purple-300' :
            listing.nft.rarity === 'rare' ? 'bg-blue-500/20 text-blue-300' :
            'bg-slate-700 text-slate-300'
          }`}>
            {listing.nft.rarity}
          </span>
        </div>

        {/* Seller info */}
        <div className="text-sm text-slate-400 mb-3">
          Listed by <span className="text-slate-300 font-semibold">{listing.sellerName}</span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Price</div>
            <div className="text-lg font-bold text-white">
              {listing.currencyType === 'soft' ? '💰' : '⚡'} {listing.price.toLocaleString()}
            </div>
          </div>
          {!isOwned && (
            <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
              Buy
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Purchase Modal Component
 */
function PurchaseModal({
  listing,
  onClose,
  onPurchase,
  loading,
  userBalance,
}: {
  listing: Listing;
  onClose: () => void;
  onPurchase: () => void;
  loading: boolean;
  userBalance: { softBalance: number; hardBalance: number };
}) {
  const canAfford = listing.currencyType === 'soft' 
    ? userBalance.softBalance >= listing.price
    : userBalance.hardBalance >= listing.price;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Confirm Purchase</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-300">
            <X size={24} />
          </button>
        </div>

        {/* NFT Preview */}
        <div className="mb-6">
          <div className="h-40 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center mb-4">
            <div className="text-6xl">👤</div>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">{listing.nft.playerName}</h3>
          <p className="text-slate-400">Rarity: <span className="text-slate-300 font-semibold">{listing.nft.rarity}</span></p>
        </div>

        {/* Price */}
        <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-400">Asking Price</div>
              <div className="text-3xl font-bold text-white">
                {listing.currencyType === 'soft' ? '💰' : '⚡'} {listing.price.toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400">Your Balance</div>
              <div className={`text-2xl font-bold ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                {listing.currencyType === 'soft' ? userBalance.softBalance : userBalance.hardBalance.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Warning if insufficient funds */}
        {!canAfford && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-6">
            <p className="text-red-300 text-sm">Insufficient balance to complete this purchase</p>
          </div>
        )}

        {/* Buttons */}
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
            {loading ? 'Processing...' : 'Confirm Purchase'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Stat Card Component
 */
function StatCard({ label, value, icon: Icon }: { label: string; value: any; icon?: any }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-sm text-slate-400 mb-1">{label}</div>
          <div className="text-3xl font-bold text-white">{value}</div>
        </div>
        {Icon && <Icon className="text-emerald-500" size={24} />}
      </div>
    </div>
  );
}
