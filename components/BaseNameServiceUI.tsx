/**
 * Base Name Service UI Component
 * Register and manage .base domains for player profiles
 */

'use client';

import React, { useState, useEffect } from 'react';
import { BaseNameService } from '@/lib/baseNameService';
import type { BaseDomainRecord, DomainAuction } from '@/lib/baseNameService';

interface SearchResult {
  name: string;
  available: boolean;
  price: string;
  tier: string;
}

interface AuctionBid {
  bidder: string;
  amount: string;
  timestamp: number;
}

export const BaseNameServiceUI: React.FC<{ walletAddress: string; email: string }> = ({
  walletAddress,
  email,
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'manage' | 'auction' | 'stats'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<BaseDomainRecord | null>(null);
  const [userDomains, setUserDomains] = useState<BaseDomainRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const service = BaseNameService.getInstance();

  // Load user domains
  useEffect(() => {
    const domains = service.getOwnerDomains(walletAddress);
    setUserDomains(domains);
  }, [walletAddress]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const query = searchQuery.trim().toLowerCase();

      if (!query) {
        setError('Please enter a domain name');
        setLoading(false);
        return;
      }

      // Check if available
      const fullName = query.endsWith('.base') ? query : `${query}.base`;
      const existing = service.getDomain(fullName);

      if (existing) {
        const result: SearchResult = {
          name: fullName,
          available: false,
          price: '0',
          tier: existing.profile.tier,
        };
        setSearchResults([result]);
      } else {
        const price = service.getDomainPrice(query);
        let tier = 'economy';
        if (query.length > 5) tier = 'elite';
        else if (query.length > 4) tier = 'premium';
        else if (query.length > 3) tier = 'standard';

        const result: SearchResult = {
          name: fullName,
          available: true,
          price,
          tier,
        };
        setSearchResults([result]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (name: string) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const cleanName = name.replace('.base', '');

      const newDomain = service.registerDomain(
        cleanName,
        walletAddress,
        email,
        {
          displayName: 'Player',
          avatar: '',
          bio: '',
          tier: 'free',
          verified: true,
          stats: {
            level: 1,
            rating: 0,
            matchesPlayed: 0,
            winRate: 0,
          },
        }
      );

      setSuccess(`Domain ${name} registered successfully!`);
      setUserDomains([...userDomains, newDomain]);
      setSearchResults([]);
      setSearchQuery('');

      setTimeout(() => {
        setActiveTab('manage');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (domainName: string, updates: any) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const updated = service.updateDomainProfile(domainName, updates);
      if (updated) {
        setSuccess('Profile updated successfully!');
        setSelectedDomain(updated);
        setUserDomains(userDomains.map(d => d.name === domainName ? updated : d));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async (domainName: string) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const renewal = service.renewDomain(domainName, walletAddress);
      const completed = service.completeRenewal(renewal.renewalId);

      if (completed) {
        setSuccess(`Domain renewed until ${new Date(completed.newExpiresAt).toLocaleDateString()}`);
        const updated = service.getDomain(domainName);
        if (updated) {
          setSelectedDomain(updated);
          setUserDomains(userDomains.map(d => d.name === domainName ? updated : d));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Renewal failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Base Name Service</h1>
          <p className="text-slate-400">Register and manage your .base domain</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-slate-700">
          {(['search', 'manage', 'auction', 'stats'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-blue-500 text-blue-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-900/30 border border-red-500 text-red-300 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-900/30 border border-green-500 text-green-300 rounded-lg">
            {success}
          </div>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="bg-slate-800 rounded-xl p-8 border border-slate-700">
            <form onSubmit={handleSearch} className="mb-8">
              <div className="flex gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Search domain (e.g., playerName)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </form>

            {/* Results */}
            {searchResults.map((result, idx) => (
              <div key={idx} className="bg-slate-700 rounded-lg p-6 border border-slate-600">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{result.name}</h3>
                    <div className="space-y-1">
                      <p className="text-slate-300">
                        Status: <span className={result.available ? 'text-green-400' : 'text-red-400'}>
                          {result.available ? '✓ Available' : '✗ Taken'}
                        </span>
                      </p>
                      {result.available && (
                        <>
                          <p className="text-slate-300">Price: <span className="text-yellow-400">{result.price} ETH/year</span></p>
                          <p className="text-slate-300">Tier: <span className="text-blue-400 capitalize">{result.tier}</span></p>
                        </>
                      )}
                    </div>
                  </div>

                  {result.available && (
                    <button
                      onClick={() => handleRegister(result.name)}
                      disabled={loading}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                    >
                      {loading ? 'Registering...' : 'Register'}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Pricing Info */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
              {['economy', 'standard', 'premium', 'elite'].map(tier => {
                const tierInfo = service.getPricingTier(tier);
                return tierInfo ? (
                  <div key={tier} className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                    <h4 className="text-lg font-bold text-white capitalize mb-2">{tier}</h4>
                    <p className="text-yellow-400 font-semibold text-lg mb-3">{tierInfo.yearlyPrice} ETH</p>
                    <ul className="text-sm text-slate-300 space-y-1">
                      {tierInfo.features.slice(0, 3).map((f, i) => (
                        <li key={i}>• {f}</li>
                      ))}
                    </ul>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Manage Tab */}
        {activeTab === 'manage' && (
          <div className="space-y-6">
            {userDomains.length === 0 ? (
              <div className="bg-slate-800 rounded-xl p-12 text-center border border-slate-700">
                <p className="text-slate-400 text-lg">No domains registered yet</p>
                <button
                  onClick={() => setActiveTab('search')}
                  className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
                >
                  Register a Domain
                </button>
              </div>
            ) : (
              userDomains.map(domain => (
                <div
                  key={domain.name}
                  className="bg-slate-800 rounded-xl p-6 border border-slate-700 cursor-pointer hover:border-blue-500 transition-colors"
                  onClick={() => setSelectedDomain(domain)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white">{domain.name}</h3>
                      <p className="text-slate-400">
                        Expires: {new Date(domain.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRenew(domain.name);
                      }}
                      disabled={loading}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white font-semibold rounded-lg"
                    >
                      Renew
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-slate-500 text-sm">Display Name</p>
                      <p className="text-white font-semibold">{domain.profile.displayName}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-sm">Level</p>
                      <p className="text-white font-semibold">{domain.profile.stats.level}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-sm">Rating</p>
                      <p className="text-white font-semibold">{domain.profile.stats.rating}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-sm">Matches</p>
                      <p className="text-white font-semibold">{domain.profile.stats.matchesPlayed}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Auction Tab */}
        {activeTab === 'auction' && (
          <div className="bg-slate-800 rounded-xl p-8 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6">Domain Auctions</h2>
            <p className="text-slate-400">Coming soon: Auction your domains to other players</p>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="bg-slate-800 rounded-xl p-8 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6">Registry Statistics</h2>
            {service.getStats() && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-700 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-1">Total Domains</p>
                  <p className="text-3xl font-bold text-white">
                    {service.getStats()?.totalDomainsRegistered}
                  </p>
                </div>
                <div className="bg-slate-700 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-1">Revenue Collected</p>
                  <p className="text-3xl font-bold text-yellow-400">
                    {service.getStats()?.revenueCollected} ETH
                  </p>
                </div>
                <div className="bg-slate-700 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-1">Avg Domain Price</p>
                  <p className="text-3xl font-bold text-blue-400">
                    {service.getStats()?.averagePrice} ETH
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BaseNameServiceUI;
