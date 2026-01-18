'use client';

import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        <div className="mb-8">
          <h1 className="text-6xl md:text-7xl font-bold mb-4">
            <span className="bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent">
              ⚽ Bass Ball
            </span>
          </h1>
          <p className="text-xl text-gray-400">Football Game on Base Chain</p>
        </div>

        <p className="text-gray-300 mb-8 leading-relaxed">
          Experience the thrill of football with blockchain-powered player NFTs, earn rewards,
          and compete with players worldwide on the Base Chain.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="card p-6">
            <div className="text-3xl mb-3">🏆</div>
            <h3 className="font-bold mb-2">Play & Earn</h3>
            <p className="text-sm text-gray-400">Earn tokens and rewards by winning matches</p>
          </div>

          <div className="card p-6">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-bold mb-2">NFT Players</h3>
            <p className="text-sm text-gray-400">Own unique player cards as NFTs on Base Chain</p>
          </div>

          <div className="card p-6">
            <div className="text-3xl mb-3">🌍</div>
            <h3 className="font-bold mb-2">Multiplayer</h3>
            <p className="text-sm text-gray-400">Challenge players worldwide</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/game" className="btn btn-primary">
            Start Playing
          </Link>
          <Link href="/team-builder" className="btn btn-secondary">
            Build Your Team
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-700">
          <p className="text-sm text-gray-500">
            Connect your wallet to start playing on Base Chain
          </p>
        </div>
      </div>
    </div>
  );
}
