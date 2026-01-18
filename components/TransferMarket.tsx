'use client';

import React, { useState } from 'react';

interface ScoutedPlayer {
  id: string;
  name: string;
  age: number;
  position: string;
  nationality: string;
  club: string;
  overall: number;
  potential: number;
  wage: number;
  contract: number; // years remaining
  stats: {
    pace: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defense: number;
    physical: number;
  };
  traits: string[];
}

interface ScoutReportProps {
  players: ScoutedPlayer[];
  onMakeOffer: (player: ScoutedPlayer) => void;
  budget: number;
}

export function ScoutReport({ players, onMakeOffer, budget }: ScoutReportProps) {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('overall');

  const positions = ['all', 'ST', 'CF', 'RW', 'LW', 'CAM', 'CM', 'CDM', 'LB', 'RB', 'CB', 'GK'];

  const filteredPlayers = players
    .filter((p) => (filter === 'all' ? true : p.position === filter))
    .sort((a, b) => {
      if (sortBy === 'overall') return b.overall - a.overall;
      if (sortBy === 'potential') return b.potential - a.potential;
      if (sortBy === 'age') return a.age - b.age;
      return 0;
    });

  const getOverallColor = (overall: number): string => {
    if (overall >= 85) return 'text-yellow-400';
    if (overall >= 75) return 'text-green-400';
    if (overall >= 65) return 'text-blue-400';
    return 'text-gray-400';
  };

  return (
    <div className="space-y-6">
      {/* Scout Controls */}
      <div className="card p-6">
        <h3 className="text-xl font-bold mb-4">🔍 Scout Report</h3>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm text-gray-400 block mb-2">Position</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
            >
              {positions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos === 'all' ? 'All Positions' : pos}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
            >
              <option value="overall">Overall Rating</option>
              <option value="potential">Potential</option>
              <option value="age">Age (Youngest First)</option>
            </select>
          </div>
        </div>

        <p className="text-sm text-gray-400">
          Found {filteredPlayers.length} player(s) • Budget: {budget.toLocaleString()} coins
        </p>
      </div>

      {/* Players List */}
      <div className="space-y-3">
        {filteredPlayers.map((player) => (
          <div key={player.id} className="card p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-bold">{player.name}</h4>
                <p className="text-sm text-gray-400">{player.club}</p>
              </div>
              <div className="text-right">
                <p className={`text-3xl font-bold ${getOverallColor(player.overall)}`}>
                  {player.overall}
                </p>
                <p className="text-sm text-gray-400">Overall</p>
              </div>
            </div>

            {/* Player Info */}
            <div className="grid grid-cols-4 gap-2 mb-4 text-sm">
              <div className="bg-gray-800 p-2 rounded text-center">
                <p className="text-gray-400">Position</p>
                <p className="font-bold">{player.position}</p>
              </div>
              <div className="bg-gray-800 p-2 rounded text-center">
                <p className="text-gray-400">Age</p>
                <p className="font-bold">{player.age}</p>
              </div>
              <div className="bg-gray-800 p-2 rounded text-center">
                <p className="text-gray-400">Potential</p>
                <p className="font-bold text-green-400">{player.potential}</p>
              </div>
              <div className="bg-gray-800 p-2 rounded text-center">
                <p className="text-gray-400">Contract</p>
                <p className="font-bold">{player.contract} yrs</p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { name: 'Pace', value: player.stats.pace, icon: '⚡' },
                { name: 'Shooting', value: player.stats.shooting, icon: '🎯' },
                { name: 'Passing', value: player.stats.passing, icon: '➡️' },
                { name: 'Dribbling', value: player.stats.dribbling, icon: '🎾' },
                { name: 'Defense', value: player.stats.defense, icon: '🛡️' },
                { name: 'Physical', value: player.stats.physical, icon: '💪' },
              ].map((stat) => (
                <div key={stat.name} className="text-center text-sm">
                  <p className="text-gray-400 mb-1">{stat.icon}</p>
                  <div className="w-full bg-gray-800 rounded h-2">
                    <div
                      className="h-full bg-blue-500 rounded"
                      style={{ width: `${(stat.value / 99) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs font-bold mt-1">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Traits */}
            {player.traits.length > 0 && (
              <div className="mb-4 flex gap-2 flex-wrap">
                {player.traits.map((trait) => (
                  <span key={trait} className="bg-blue-900 text-blue-300 text-xs px-2 py-1 rounded">
                    {trait}
                  </span>
                ))}
              </div>
            )}

            {/* Contract & Wage */}
            <div className="grid grid-cols-2 gap-2 mb-4 text-sm border-t border-gray-700 pt-3">
              <div>
                <p className="text-gray-400">Weekly Wage</p>
                <p className="font-bold text-yellow-400">{player.wage.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-400">Transfer Value</p>
                <p className="font-bold text-green-400">{(player.wage * 200).toLocaleString()}</p>
              </div>
            </div>

            {/* Action */}
            <button
              onClick={() => onMakeOffer(player)}
              disabled={budget < player.wage * 200}
              className={`w-full py-2 rounded font-bold transition-colors ${
                budget >= player.wage * 200
                  ? 'btn btn-primary'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {budget >= player.wage * 200 ? 'Make Offer' : 'Insufficient Budget'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Transfer Market Component
interface TransferListing {
  id: string;
  playerName: string;
  position: string;
  club: string;
  askingPrice: number;
  lowestOffer: number | null;
  offers: number;
  timeLeft: string;
}

export function TransferMarket({ listings }: { listings: TransferListing[] }) {
  const [view, setView] = useState<'available' | 'myOffers'>('available');

  return (
    <div className="card p-6">
      <h3 className="text-xl font-bold mb-4">🏪 Transfer Market</h3>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-700">
        <button
          onClick={() => setView('available')}
          className={`pb-2 px-4 font-bold transition-colors ${
            view === 'available' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Available Players
        </button>
        <button
          onClick={() => setView('myOffers')}
          className={`pb-2 px-4 font-bold transition-colors ${
            view === 'myOffers' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          My Offers
        </button>
      </div>

      {/* Market List */}
      <div className="space-y-3">
        {listings.slice(0, 5).map((listing) => (
          <div key={listing.id} className="bg-gray-800 p-4 rounded">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-bold">{listing.playerName}</h4>
                <p className="text-sm text-gray-400">
                  {listing.position} • {listing.club}
                </p>
              </div>
              <span className="text-xs bg-gray-700 px-2 py-1 rounded">{listing.timeLeft}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-sm mb-2">
              <div>
                <p className="text-gray-400">Asking Price</p>
                <p className="font-bold text-yellow-400">{listing.askingPrice.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-400">Best Offer</p>
                <p className="font-bold">{listing.lowestOffer?.toLocaleString() || 'None'}</p>
              </div>
              <div>
                <p className="text-gray-400">Offers</p>
                <p className="font-bold">{listing.offers}</p>
              </div>
            </div>

            <button className="w-full btn btn-secondary text-sm py-2">Make Offer</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Youth Academy Component
interface YouthPlayer {
  id: string;
  name: string;
  age: number;
  position: string;
  potential: number;
  developmentRate: number;
  injuryRisk: number;
}

export function YouthAcademy({ players }: { players: YouthPlayer[] }) {
  return (
    <div className="card p-6">
      <h3 className="text-xl font-bold mb-4">🎓 Youth Academy</h3>

      <div className="space-y-3">
        {players.map((player) => (
          <div key={player.id} className="bg-gray-800 p-3 rounded">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-bold">{player.name}</p>
                <p className="text-xs text-gray-400">{player.position} • Age {player.age}</p>
              </div>
              <span className="text-2xl font-bold text-green-400">{player.potential}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-gray-400">Development</p>
                <div className="w-full bg-gray-700 rounded h-2 mt-1">
                  <div
                    className="h-full bg-green-500 rounded"
                    style={{ width: `${player.developmentRate}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <p className="text-gray-400">Injury Risk</p>
                <div className="w-full bg-gray-700 rounded h-2 mt-1">
                  <div
                    className="h-full bg-red-500 rounded"
                    style={{ width: `${player.injuryRisk}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
