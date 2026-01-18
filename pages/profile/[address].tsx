import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

interface PlayerProfile {
  address: string;
  name: string;
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  badges: string[];
  joinedDate: string;
  topGame: string;
}

const ProfilePage: NextPage = () => {
  const router = useRouter();
  const { address } = router.query;
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/player/${address}/profile`);
        const data = await res.json();
        setProfile(data);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [address]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <p className="text-white mb-4">Player not found</p>
          <Link href="/" className="text-blue-400 hover:text-blue-300">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{profile.name} - Bass Ball</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-blue-400">
              ← Bass Ball
            </Link>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-12">
          {/* Profile Header */}
          <div className="mb-8 p-8 bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{profile.name}</h1>
                <p className="text-slate-400 text-sm font-mono">{address}</p>
                <p className="text-slate-400 text-sm mt-1">Joined {profile.joinedDate}</p>
              </div>
              <div className="text-right">
                <p className="text-5xl font-bold text-yellow-400">{profile.rating}</p>
                <p className="text-slate-400">Rating</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-lg">
              <p className="text-slate-400 text-sm">Matches</p>
              <p className="text-3xl font-bold text-blue-400">{profile.gamesPlayed}</p>
            </div>
            <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-lg">
              <p className="text-slate-400 text-sm">Wins</p>
              <p className="text-3xl font-bold text-green-400">{profile.wins}</p>
            </div>
            <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-lg">
              <p className="text-slate-400 text-sm">Losses</p>
              <p className="text-3xl font-bold text-red-400">{profile.losses}</p>
            </div>
            <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-lg">
              <p className="text-slate-400 text-sm">Win Rate</p>
              <p className="text-3xl font-bold text-purple-400">{profile.winRate.toFixed(1)}%</p>
            </div>
          </div>

          {/* Badges Section */}
          <div className="mb-8 p-6 bg-slate-800/50 border border-slate-700 rounded-lg">
            <h2 className="text-2xl font-bold text-white mb-6">NFT Badges ({profile.badges.length})</h2>
            {profile.badges.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {profile.badges.map((badge, i) => (
                  <div
                    key={i}
                    className="p-4 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/50 rounded-lg text-center"
                  >
                    <p className="text-3xl mb-2">🏆</p>
                    <p className="text-sm text-white font-semibold">{badge}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400">No badges earned yet</p>
            )}
          </div>

          {/* Top Game */}
          <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-lg">
            <h2 className="text-2xl font-bold text-white mb-4">Best Game Mode</h2>
            <p className="text-slate-300">{profile.topGame}</p>
          </div>
        </main>
      </div>
    </>
  );
};

export default ProfilePage;
