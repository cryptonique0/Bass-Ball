import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { usePrivy } from '@privy-io/react-auth';
import { useState, useEffect } from 'react';

interface MatchResult {
  id: string;
  opponent: string;
  opponentRating: number;
  result: 'win' | 'loss';
  score: number;
  date: string;
  gameType: string;
}

const MatchPage: NextPage = () => {
  const { address } = useAccount();
  const { user } = usePrivy();
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [matchStatus, setMatchStatus] = useState<'idle' | 'finding' | 'playing' | 'result'>('idle');

  const findMatch = async () => {
    if (!address) return;

    setMatchStatus('finding');
    setLoading(true);

    try {
      const res = await fetch('/api/match/find', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerAddress: address,
          playerRating: 1000, // TODO: Fetch from player data
        }),
      });

      const data = await res.json();

      if (data.matchId) {
        setMatchStatus('playing');
        // Simulate match
        setTimeout(() => {
          setMatchStatus('result');
        }, 5000);
      }
    } catch (error) {
      console.error('Failed to find match:', error);
      setMatchStatus('idle');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentMatches = async () => {
    if (!address) return;
    try {
      const res = await fetch(`/api/match/history/${address}`);
      const data = await res.json();
      setMatches(data);
    } catch (error) {
      console.error('Failed to fetch matches:', error);
    }
  };

  useEffect(() => {
    if (address) {
      fetchRecentMatches();
    }
  }, [address]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white mb-4">Please log in to play matches</p>
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
        <title>Match - Bass Ball</title>
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
          {matchStatus === 'idle' && (
            <div className="text-center space-y-8">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Find a Match</h1>
                <p className="text-slate-300">Jump into a PvP battle</p>
              </div>

              <button
                onClick={findMatch}
                disabled={loading}
                className="px-12 py-4 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:from-slate-600 disabled:to-slate-600 rounded-lg font-bold text-white text-xl transition transform hover:scale-105 disabled:scale-100"
              >
                {loading ? 'Finding opponent...' : 'Find Match'}
              </button>

              {/* Match History */}
              <div className="mt-12 text-left">
                <h2 className="text-2xl font-bold text-white mb-6">Recent Matches</h2>
                <div className="space-y-3">
                  {matches.length > 0 ? (
                    matches.map((match) => (
                      <div
                        key={match.id}
                        className={`p-4 border rounded-lg ${
                          match.result === 'win'
                            ? 'bg-green-500/10 border-green-500/50'
                            : 'bg-red-500/10 border-red-500/50'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-white">
                              vs {match.opponent} ({match.opponentRating})
                            </p>
                            <p className="text-sm text-slate-400">{match.date}</p>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-lg font-bold ${
                                match.result === 'win' ? 'text-green-400' : 'text-red-400'
                              }`}
                            >
                              {match.result === 'win' ? 'WIN' : 'LOSS'}
                            </p>
                            <p className="text-slate-400">Score: {match.score}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400">No matches yet. Play your first match!</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {matchStatus === 'finding' && (
            <div className="text-center space-y-8">
              <h1 className="text-4xl font-bold text-white">Finding opponent...</h1>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400"></div>
              </div>
              <p className="text-slate-400">This usually takes 10-30 seconds</p>
            </div>
          )}

          {matchStatus === 'playing' && (
            <div className="text-center space-y-8">
              <h1 className="text-4xl font-bold text-white">Match in Progress</h1>
              <div className="p-8 bg-slate-800/50 border border-slate-700 rounded-lg">
                <p className="text-slate-300 text-lg">Game view would appear here</p>
                <p className="text-slate-400 mt-2">Phaser/Three.js game engine</p>
              </div>
            </div>
          )}

          {matchStatus === 'result' && (
            <div className="text-center space-y-8">
              <h1 className="text-4xl font-bold text-white">Match Complete!</h1>
              <div className="p-8 bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/50 rounded-lg">
                <p className="text-3xl font-bold text-green-400 mb-4">You Won! 🎉</p>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div>
                    <p className="text-slate-400">Rating</p>
                    <p className="text-xl font-bold text-white">+25</p>
                  </div>
                  <div>
                    <p className="text-slate-400">XP</p>
                    <p className="text-xl font-bold text-white">+100</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Prize</p>
                    <p className="text-xl font-bold text-yellow-400">Base earned</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setMatchStatus('idle')}
                className="px-8 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-bold text-white transition"
              >
                Play Again
              </button>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default MatchPage;
