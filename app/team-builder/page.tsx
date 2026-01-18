'use client';

import React from 'react';

export default function TeamBuilder() {
  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Team Builder</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Formation Selection */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Formations</h2>
            <div className="space-y-2">
              {['4-4-2', '4-3-3', '3-5-2', '5-3-2'].map((formation) => (
                <button
                  key={formation}
                  className="w-full btn btn-secondary text-left text-sm"
                >
                  {formation}
                </button>
              ))}
            </div>
          </div>

          {/* Player Selection */}
          <div className="lg:col-span-2 card">
            <h2 className="text-xl font-bold mb-4">Select Players</h2>
            <p className="text-gray-400">
              Connect your wallet to see your NFT player cards. You can drag them to the pitch to
              build your team.
            </p>
            <div className="mt-4 text-center">
              <p className="text-sm text-yellow-500">No players found. Mint or purchase player NFTs to get started.</p>
            </div>
          </div>

          {/* Team Summary */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Team Summary</h2>
            <div className="text-sm text-gray-400 space-y-2">
              <div className="flex justify-between">
                <span>Formation:</span>
                <span className="text-white">Not Selected</span>
              </div>
              <div className="flex justify-between">
                <span>Players:</span>
                <span className="text-white">0/11</span>
              </div>
              <div className="flex justify-between">
                <span>Average Rating:</span>
                <span className="text-white">-</span>
              </div>
            </div>
            <button className="w-full btn btn-primary mt-4">Save Team</button>
          </div>
        </div>
      </div>
    </div>
  );
}
