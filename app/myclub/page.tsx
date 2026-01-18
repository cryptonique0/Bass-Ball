'use client';

import React, { useState } from 'react';

export default function MyClubPage() {
  const [activeTab, setActiveTab] = useState<'squad' | 'market' | 'contracts' | 'training'>('squad');

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">MyClub</h1>
        <p className="text-gray-400 mb-8">Build and manage your dream team</p>

        {/* Club Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-4">
            <p className="text-gray-400">Overall Rating</p>
            <p className="text-3xl font-bold text-blue-500">84</p>
          </div>
          <div className="card p-4">
            <p className="text-gray-400">Total Players</p>
            <p className="text-3xl font-bold text-green-500">23</p>
          </div>
          <div className="card p-4">
            <p className="text-gray-400">Squad Value</p>
            <p className="text-3xl font-bold text-yellow-500">$2.5M</p>
          </div>
          <div className="card p-4">
            <p className="text-gray-400">Win Rate</p>
            <p className="text-3xl font-bold text-purple-500">68%</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-700">
          {(['squad', 'market', 'contracts', 'training'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-4 font-bold transition-colors ${
                activeTab === tab
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'squad' && '⚽ Squad'}
              {tab === 'market' && '💰 Market'}
              {tab === 'contracts' && '📋 Contracts'}
              {tab === 'training' && '🏋️ Training'}
            </button>
          ))}
        </div>

        {/* Squad Tab */}
        {activeTab === 'squad' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Your Squad (11/11)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
                <div key={i} className="card p-4">
                  <div className="bg-gray-700 h-40 rounded mb-3 flex items-center justify-center">
                    <span className="text-4xl">🎮</span>
                  </div>
                  <h3 className="font-bold">Player {i}</h3>
                  <p className="text-sm text-gray-400">Position: ST</p>
                  <p className="text-sm text-yellow-500">Rating: 85</p>
                  <div className="mt-3 flex gap-2">
                    <button className="flex-1 btn btn-secondary text-xs">Info</button>
                    <button className="flex-1 btn btn-secondary text-xs">Bench</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transfer Market Tab */}
        {activeTab === 'market' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Transfer Market</h2>
            <p className="text-gray-400 mb-4">Budget: $500,000</p>
            <div className="card p-6">
              <input
                type="text"
                placeholder="Search players..."
                className="w-full bg-gray-700 text-white px-4 py-2 rounded mb-4"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="border border-gray-600 p-4 rounded">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold">Premium Player {i}</h3>
                        <p className="text-sm text-gray-400">Rating: 87</p>
                      </div>
                      <span className="text-yellow-500 font-bold">$150K</span>
                    </div>
                    <button className="w-full btn btn-primary text-sm">Buy</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Contracts Tab */}
        {activeTab === 'contracts' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Player Contracts</h2>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="card p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold">Player {i}</h3>
                    <p className="text-sm text-gray-400">
                      Contract expires: Year {2026 + i}
                    </p>
                  </div>
                  <button className="btn btn-secondary text-sm">Renew</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Training Tab */}
        {activeTab === 'training' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Training Sessions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['Shooting', 'Passing', 'Defense', 'Dribbling', 'Pace', 'Strength'].map(
                (type) => (
                  <div key={type} className="card p-4">
                    <h3 className="font-bold mb-3">{type} Training</h3>
                    <p className="text-sm text-gray-400 mb-3">+2 to {type.toLowerCase()}</p>
                    <p className="text-sm text-gray-400 mb-4">Duration: 90 min</p>
                    <button className="w-full btn btn-primary text-sm">Start Training</button>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
