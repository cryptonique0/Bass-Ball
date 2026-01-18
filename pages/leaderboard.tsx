import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface LeaderboardEntry {
  rank: number;
  address: string;
  name: string;
  rating: number;
  wins: number;
  gamesPlayed: number;
  badges: number;
}

const LeaderboardPage: NextPage = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('month');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/leaderboard?period=${period}`);
        const data = await res.json();
        setLeaderboard(data);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [period]);

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <>
      <Head>
        <title>Leaderboard - Bass Ball</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-blue-400">
              ← Bass Ball
            </Link>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-6">Global Leaderboard</h1>

            {/* Period Filter */}
            <div className="flex gap-3">
              {(['week', 'month', 'all'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    period === p
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'All Time'}
                </button>
              ))}
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="overflow-hidden border border-slate-700 rounded-lg bg-slate-800/50">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Rank</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Player</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">Rating</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">Matches</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">Wins</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">Badges</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-slate-400">
                        Loading...
                      </td>
                    </tr>
                  ) : leaderboard.length > 0 ? (
                    leaderboard.map((entry) => (
                      <tr
                        key={entry.address}
                        className="hover:bg-slate-700/50 transition cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{getMedalEmoji(entry.rank)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/profile/${entry.address}`}
                            className="text-white hover:text-blue-400 font-semibold"
                          >
                            {entry.name}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-yellow-400 font-bold text-lg">{entry.rating}</span>
                        </td>
                        <td className="px-6 py-4 text-right text-slate-300">{entry.gamesPlayed}</td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-green-400 font-semibold">{entry.wins}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-sm font-semibold">
                            {entry.badges}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-slate-400">
                        No players found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top 3 Highlight */}
          {leaderboard.length >= 3 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-white mb-6">🏆 Top Players</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {leaderboard.slice(0, 3).map((entry) => (
                  <Link
                    key={entry.address}
                    href={`/profile/${entry.address}`}
                    className={`p-6 rounded-lg border transition transform hover:scale-105 cursor-pointer ${
                      entry.rank === 1
                        ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-yellow-500/50'
                        : entry.rank === 2
                          ? 'bg-gradient-to-br from-slate-400/20 to-slate-500/20 border-slate-400/50'
                          : 'bg-gradient-to-br from-orange-500/20 to-orange-600/20 border-orange-500/50'
                    }`}
                  >
                    <div className="text-center">
                      <p className="text-4xl mb-2">{getMedalEmoji(entry.rank)}</p>
                      <h3 className="text-xl font-bold text-white mb-2">{entry.name}</h3>
                      <p className="text-3xl font-bold text-yellow-400 mb-2">{entry.rating}</p>
                      <p className="text-slate-300 text-sm">{entry.wins}W - {entry.gamesPlayed - entry.wins}L</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default LeaderboardPage;
