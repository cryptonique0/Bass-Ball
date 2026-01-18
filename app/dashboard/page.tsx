'use client';

import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { WalletLogin } from '@/components/WalletLogin';
import { RainbowConnectButton } from '@/components/WalletConnector';
import { useUserIdentity } from '@/hooks/useUserIdentity';
import Link from 'next/link';

/**
 * Dashboard - Main game hub
 * Requires wallet connection and Base network
 */
export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const { isOnBase, formattedAddress, balance } = useUserIdentity();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Show login screen if not connected
  if (!isConnected || !isOnBase || !address) {
    return <WalletLogin onLoginSuccess={() => router.refresh()} />;
  }

  // User is connected - show dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header with Wallet Info */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 border-b border-blue-500/30 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">⚽ Bass Ball</h1>
            <p className="text-blue-100 text-sm">Play Football on Base Chain</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Wallet Info */}
            <div className="hidden sm:block text-right bg-blue-700/30 px-4 py-2 rounded-lg border border-blue-500/30">
              <div className="text-xs text-blue-200">Wallet</div>
              <div className="text-white font-mono text-sm">{formattedAddress}</div>
              <div className="text-xs text-blue-200 mt-1">{balance} ETH</div>
            </div>

            {/* Disconnect Button */}
            <RainbowConnectButton />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Welcome to Bass Ball, {formattedAddress}! 🎮
          </h2>
          <p className="text-gray-300 text-lg">
            Choose your game mode and start playing football on Base Chain
          </p>
        </div>

        {/* Game Modes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Play vs AI */}
          <Link href="/match?mode=ai">
            <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 border-2 border-purple-500/30 rounded-2xl p-8 hover:border-purple-400/60 hover:shadow-2xl transition-all cursor-pointer group">
              <div className="text-6xl mb-4 group-hover:scale-125 transition-transform">🤖</div>
              <h3 className="text-2xl font-bold text-white mb-2">Play vs AI</h3>
              <p className="text-gray-300 mb-4">
                Challenge our intelligent AI opponent at various difficulty levels
              </p>
              <div className="text-sm text-purple-300">
                ✓ Adjustable difficulty
                <br />✓ Practice mode
                <br />✓ Earn rewards
              </div>
              <div className="mt-4 text-blue-400 font-semibold group-hover:translate-x-2 transition-transform">
                Start Game →
              </div>
            </div>
          </Link>

          {/* Play vs Player */}
          <Link href="/match?mode=pvp">
            <div className="bg-gradient-to-br from-orange-900/50 to-red-900/50 border-2 border-orange-500/30 rounded-2xl p-8 hover:border-orange-400/60 hover:shadow-2xl transition-all cursor-pointer group">
              <div className="text-6xl mb-4 group-hover:scale-125 transition-transform">👥</div>
              <h3 className="text-2xl font-bold text-white mb-2">Play vs Player</h3>
              <p className="text-gray-300 mb-4">
                Challenge another player in a real-time multiplayer match
              </p>
              <div className="text-sm text-orange-300">
                ✓ Competitive gameplay
                <br />✓ Ranked matches
                <br />✓ Multiplayer rewards
              </div>
              <div className="mt-4 text-orange-400 font-semibold group-hover:translate-x-2 transition-transform">
                Find Opponent →
              </div>
            </div>
          </Link>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <Link href="/team-builder" className="group">
            <div className="bg-slate-800/50 border border-slate-600 hover:border-blue-500 rounded-xl p-6 text-center transition-all hover:shadow-lg">
              <div className="text-4xl mb-2">⚡</div>
              <h4 className="text-white font-bold mb-1">Build Team</h4>
              <p className="text-xs text-gray-400">Create your lineup</p>
            </div>
          </Link>

          <Link href="/myclub" className="group">
            <div className="bg-slate-800/50 border border-slate-600 hover:border-blue-500 rounded-xl p-6 text-center transition-all hover:shadow-lg">
              <div className="text-4xl mb-2">👨‍💼</div>
              <h4 className="text-white font-bold mb-1">My Club</h4>
              <p className="text-xs text-gray-400">Manage your team</p>
            </div>
          </Link>

          <Link href="/master-league" className="group">
            <div className="bg-slate-800/50 border border-slate-600 hover:border-blue-500 rounded-xl p-6 text-center transition-all hover:shadow-lg">
              <div className="text-4xl mb-2">🏆</div>
              <h4 className="text-white font-bold mb-1">League</h4>
              <p className="text-xs text-gray-400">Compete online</p>
            </div>
          </Link>

          <Link href="/modes" className="group">
            <div className="bg-slate-800/50 border border-slate-600 hover:border-blue-500 rounded-xl p-6 text-center transition-all hover:shadow-lg">
              <div className="text-4xl mb-2">🎮</div>
              <h4 className="text-white font-bold mb-1">More Modes</h4>
              <p className="text-xs text-gray-400">All game modes</p>
            </div>
          </Link>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-slate-800/50 border border-slate-600 rounded-xl p-6">
            <div className="text-3xl font-bold text-blue-400 mb-2">0</div>
            <p className="text-gray-300">Matches Played</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-600 rounded-xl p-6">
            <div className="text-3xl font-bold text-green-400 mb-2">0%</div>
            <p className="text-gray-300">Win Rate</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-600 rounded-xl p-6">
            <div className="text-3xl font-bold text-yellow-400 mb-2">0</div>
            <p className="text-gray-300">Total Rewards</p>
          </div>
        </div>

        {/* Network Info */}
        <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/30 rounded-xl p-6 text-center">
          <p className="text-cyan-300 mb-2">🌐 Connected to Base Chain</p>
          <p className="text-gray-400 text-sm">
            Your wallet is connected and ready to play. All matches and rewards are recorded on the blockchain.
          </p>
        </div>
      </div>
    </div>
  );
}
