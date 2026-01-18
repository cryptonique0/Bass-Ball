import type { NextPage } from 'next';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';
import Head from 'next/head';
import { useState, useEffect } from 'react';

interface PlayerStats {
  address: string;
  name: string;
  rating: number;
  gamesPlayed: number;
  wins: number;
  badges: number;
}

const Home: NextPage = () => {
  const { user, login, logout, isReady } = usePrivy();
  const { address } = useAccount();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (address) {
      fetchPlayerStats(address);
    }
  }, [address]);

  const fetchPlayerStats = async (playerAddress: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/player/${playerAddress}/stats`);
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Bass Ball - Web3 Gaming</title>
        <meta name="description" content="Play PvP matches, earn NFTs on Base" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Header */}
        <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              🎮 Bass Ball
            </h1>
            <div className="flex gap-4">
              {isReady && !user ? (
                <button
                  onClick={() => login()}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold text-white transition"
                >
                  Login
                </button>
              ) : user ? (
                <button
                  onClick={logout}
                  className="px-6 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-semibold text-white transition"
                >
                  Logout
                </button>
              ) : null}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {!user ? (
            // Landing
            <div className="text-center space-y-8">
              <div className="space-y-4">
                <h2 className="text-5xl font-bold text-white">Welcome to Bass Ball</h2>
                <p className="text-xl text-slate-300">
                  Play PvP matches, earn NFT badges, climb the leaderboard
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12">
                <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-lg">
                  <h3 className="text-xl font-bold text-blue-400 mb-2">⚡ Quick Matches</h3>
                  <p className="text-slate-300">Jump into instant PvP matches</p>
                </div>
                <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-lg">
                  <h3 className="text-xl font-bold text-purple-400 mb-2">💎 Earn NFTs</h3>
                  <p className="text-slate-300">Win badges and collectible NFTs on Base</p>
                </div>
                <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-lg">
                  <h3 className="text-xl font-bold text-pink-400 mb-2">🏆 Rankings</h3>
                  <p className="text-slate-300">Compete for top positions globally</p>
                </div>
              </div>

              <button
                onClick={() => login()}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg font-bold text-white text-lg transition transform hover:scale-105"
              >
                Get Started
              </button>
            </div>
          ) : (
            // Dashboard
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Player Stats */}
                <div className="lg:col-span-2 p-6 bg-slate-800/50 border border-slate-700 rounded-lg">
                  <h2 className="text-2xl font-bold text-white mb-6">Your Stats</h2>
                  {loading ? (
                    <p className="text-slate-400">Loading...</p>
                  ) : stats ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-slate-400 text-sm">Rating</p>
                        <p className="text-3xl font-bold text-blue-400">{stats.rating}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">Matches</p>
                        <p className="text-3xl font-bold text-purple-400">{stats.gamesPlayed}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">Wins</p>
                        <p className="text-3xl font-bold text-green-400">{stats.wins}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">Badges</p>
                        <p className="text-3xl font-bold text-yellow-400">{stats.badges}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400">No stats yet. Play your first match!</p>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-lg h-fit">
                  <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <Link
                      href="/match"
                      className="block p-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold text-white text-center transition"
                    >
                      Find Match
                    </Link>
                    <Link
                      href={`/profile/${address}`}
                      className="block p-3 bg-purple-500 hover:bg-purple-600 rounded-lg font-semibold text-white text-center transition"
                    >
                      My Profile
                    </Link>
                    <Link
                      href="/leaderboard"
                      className="block p-3 bg-pink-500 hover:bg-pink-600 rounded-lg font-semibold text-white text-center transition"
                    >
                      Leaderboard
                    </Link>
                  </div>
                </div>
              </div>

              {/* Recent Matches */}
              <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-lg">
                <h2 className="text-2xl font-bold text-white mb-4">Recent Matches</h2>
                <p className="text-slate-400">No matches yet. Start playing to see your history.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default Home;
