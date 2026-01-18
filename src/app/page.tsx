'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useMatchStore } from '@/store/useMatchStore';
import Link from 'next/link';
import WalletButton from '@/components/WalletButton';
import { useState } from 'react';

const HomePage = () => {
  const { user } = usePrivy();
  const { playerId, isGuest } = useMatchStore();
  const [showFeatures, setShowFeatures] = useState(false);

  const isReady = playerId || isGuest;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Navigation */}
      <nav className="bg-black/50 backdrop-blur-md border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-3xl">⚽</span>
            <h1 className="text-2xl font-bold text-white">Bass Ball</h1>
          </div>
          <div className="flex gap-4 items-center">
            {isReady && (
              <>
                <Link href="/game" className="text-gray-300 hover:text-white transition-colors">
                  Play
                </Link>
                <Link href="/profile" className="text-gray-300 hover:text-white transition-colors">
                  Profile
                </Link>
              </>
            )}
            <WalletButton />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="mb-8">
          <h2 className="text-6xl font-bold text-white mb-4 leading-tight">
            The Web3 Football Game
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Play competitive football matches on Base chain. Earn NFT rewards, prove your skill, and
            build your legacy in a trustless, fair-play ecosystem.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-4 justify-center mb-12">
          {isReady ? (
            <Link
              href="/game"
              className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-lg transition-colors shadow-lg hover:shadow-xl"
            >
              🎮 Play Now
            </Link>
          ) : (
            <>
              <button
                onClick={() => document.querySelector('[data-privy-login]')?.click()}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-lg transition-colors shadow-lg hover:shadow-xl"
              >
                🔐 Connect Wallet
              </button>
              <button
                onClick={() => {
                  useMatchStore.setState({
                    playerId: `guest-${Date.now()}`,
                    isGuest: true,
                    playerProfile: {
                      id: `guest-${Date.now()}`,
                      username: 'Guest Player',
                      stats: {
                        wins: 0,
                        losses: 0,
                        goalsScored: 0,
                        goalsConceded: 0,
                        assists: 0,
                      },
                      ranking: { rating: 1000, position: 0 },
                      nfts: [],
                      matchHistory: [],
                    },
                  });
                }}
                className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-lg transition-colors shadow-lg hover:shadow-xl"
              >
                🏃 Play as Guest
              </button>
            </>
          )}
        </div>

        {/* Trustless Badge */}
        <div className="inline-block bg-gradient-to-r from-green-600/20 to-blue-600/20 border border-green-600/50 rounded-lg px-6 py-3 mb-12">
          <p className="text-green-400 font-semibold">✅ Trustless Verification • Fair Play Guaranteed • Gasless NFTs</p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h3 className="text-3xl font-bold text-white text-center mb-12">Why Bass Ball?</h3>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Feature 1 */}
          <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 border border-blue-700/50 rounded-lg p-6 hover:border-blue-600 transition-colors">
            <div className="text-4xl mb-4">🔒</div>
            <h4 className="text-xl font-bold text-white mb-2">Trustless Verification</h4>
            <p className="text-gray-300">
              All match results are recorded on-chain and cryptographically verified. No server can manipulate your score.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 border border-green-700/50 rounded-lg p-6 hover:border-green-600 transition-colors">
            <div className="text-4xl mb-4">⚖️</div>
            <h4 className="text-xl font-bold text-white mb-2">Pure Skill, No Pay-to-Win</h4>
            <p className="text-gray-300">
              Your wallet size doesn't determine your power. Win or lose based on your skill alone. Cosmetics only.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-700/50 rounded-lg p-6 hover:border-purple-600 transition-colors">
            <div className="text-4xl mb-4">🎁</div>
            <h4 className="text-xl font-bold text-white mb-2">Gasless NFT Rewards</h4>
            <p className="text-gray-300">
              Earn NFT rewards for wins. Minting is completely gasless thanks to Base's Paymaster integration.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-gradient-to-br from-yellow-900/40 to-yellow-800/20 border border-yellow-700/50 rounded-lg p-6 hover:border-yellow-600 transition-colors">
            <div className="text-4xl mb-4">🎮</div>
            <h4 className="text-xl font-bold text-white mb-2">Real-Time PvP</h4>
            <p className="text-gray-300">
              Play against real opponents in 60Hz server-authoritative matches. Experience competitive football instantly.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-gradient-to-br from-red-900/40 to-red-800/20 border border-red-700/50 rounded-lg p-6 hover:border-red-600 transition-colors">
            <div className="text-4xl mb-4">📊</div>
            <h4 className="text-xl font-bold text-white mb-2">ELO Rating System</h4>
            <p className="text-gray-300">
              Fair rating system that rewards wins against strong opponents. Climb the leaderboard and earn recognition.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-gradient-to-br from-orange-900/40 to-orange-800/20 border border-orange-700/50 rounded-lg p-6 hover:border-orange-600 transition-colors">
            <div className="text-4xl mb-4">🛡️</div>
            <h4 className="text-xl font-bold text-white mb-2">11-Layer Anti-Cheat</h4>
            <p className="text-gray-300">
              Advanced fraud detection system that analyzes match inputs, timing, and patterns to catch cheaters.
            </p>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-lg p-8 text-center">
          <h4 className="text-2xl font-bold text-white mb-4">Built on Base 🔵</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="text-gray-300">
              <p className="font-semibold text-white">Frontend</p>
              <p className="text-sm">Next.js 14 + Phaser.js</p>
            </div>
            <div className="text-gray-300">
              <p className="font-semibold text-white">Blockchain</p>
              <p className="text-sm">Viem + Wagmi</p>
            </div>
            <div className="text-gray-300">
              <p className="font-semibold text-white">Auth</p>
              <p className="text-sm">Privy + RainbowKit</p>
            </div>
            <div className="text-gray-300">
              <p className="font-semibold text-white">Real-Time</p>
              <p className="text-sm">Socket.IO 60Hz</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 py-12 mt-12">
        <h3 className="text-3xl font-bold text-white text-center mb-12">How It Works</h3>

        <div className="space-y-6">
          {[
            {
              step: 1,
              title: 'Connect or Play as Guest',
              desc: 'Link your wallet via Privy or jump in as a guest player immediately.',
            },
            {
              step: 2,
              title: 'Find an Opponent',
              desc: 'Matchmaking finds players at your skill level based on ELO rating.',
            },
            {
              step: 3,
              title: 'Play 30-Minute Match',
              desc: 'Real-time football with server authority and 60Hz tick rate. Pure skill competition.',
            },
            {
              step: 4,
              title: 'Verify Results On-Chain',
              desc: 'All match data stored on Base. Results cryptographically verified and impossible to manipulate.',
            },
            {
              step: 5,
              title: 'Earn NFT Rewards',
              desc: 'First win? Mint an exclusive NFT reward. Completely gasless thanks to Paymaster.',
            },
            {
              step: 6,
              title: 'Climb Leaderboards',
              desc: 'ELO rating increases with wins. Compete for top positions and tournament invitations.',
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-600 text-white font-bold">
                  {item.step}
                </div>
              </div>
              <div>
                <h4 className="text-xl font-semibold text-white mb-1">{item.title}</h4>
                <p className="text-gray-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 py-16 text-center border-t border-gray-800 mt-16">
        <h3 className="text-4xl font-bold text-white mb-6">Ready to Play?</h3>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Start your football journey today. No boring tutorials. No pay-to-win mechanics. Just pure, skill-based competition.
        </p>

        <div className="flex gap-4 justify-center">
          {isReady ? (
            <Link
              href="/game"
              className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-lg transition-colors shadow-lg hover:shadow-xl"
            >
              ⚽ Play Now
            </Link>
          ) : (
            <>
              <button
                onClick={() => document.querySelector('[data-privy-login]')?.click()}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-lg transition-colors shadow-lg hover:shadow-xl"
              >
                🔐 Connect Wallet
              </button>
              <Link
                href="/game"
                className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-lg transition-colors shadow-lg hover:shadow-xl"
                onClick={() => {
                  const guestId = `guest-${Date.now()}`;
                  useMatchStore.setState({
                    playerId: guestId,
                    isGuest: true,
                    playerProfile: {
                      id: guestId,
                      username: 'Guest Player',
                      stats: {
                        wins: 0,
                        losses: 0,
                        goalsScored: 0,
                        goalsConceded: 0,
                        assists: 0,
                      },
                      ranking: { rating: 1000, position: 0 },
                      nfts: [],
                      matchHistory: [],
                    },
                  });
                }}
              >
                🏃 Play as Guest
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-black/30 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-400">
          <p>
            Bass Ball © 2024 • Built with Next.js, Phaser, and love ❤️ on Base
          </p>
          <div className="flex gap-6 justify-center mt-4">
            <a href="#" className="hover:text-gray-300 transition-colors">
              Docs
            </a>
            <a href="#" className="hover:text-gray-300 transition-colors">
              GitHub
            </a>
            <a href="#" className="hover:text-gray-300 transition-colors">
              Twitter
            </a>
            <a href="#" className="hover:text-gray-300 transition-colors">
              Discord
            </a>
          </div>
        </div>
      </footer>

      {/* Privy Login Button (hidden) */}
      <div data-privy-login style={{ display: 'none' }} />
    </div>
  );
};

export default HomePage;
