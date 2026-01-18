'use client';

import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useMatchStore } from '@/store/useMatchStore';
import { initializeSocket } from '@/lib/socket';
import GameCanvas from '@/components/GameCanvas';
import MatchHUD from '@/components/MatchHUD';
import MatchResultModal from '@/components/MatchResultModal';

const GamePage = () => {
  const { user } = usePrivy();
  const {
    currentMatch,
    playerId,
    playerProfile,
    isConnected,
    isMatchStarted,
    isMatchEnded,
    setCurrentMatch,
    setPlayerId,
    setPlayerProfile,
    setMatchStarted,
    setMatchEnded,
  } = useMatchStore();

  const [showResultModal, setShowResultModal] = useState(false);
  const [matchId, setMatchId] = useState<string>('');

  // Initialize match when component mounts
  useEffect(() => {
    // Check if user is authenticated
    if (!playerId) {
      // Redirect to home if not authenticated
      window.location.href = '/';
      return;
    }

    // Initialize Socket.IO connection
    if (!isConnected) {
      initializeSocket(playerId, playerProfile?.username || 'Guest');
    }

    // Create a mock match for demo
    if (!currentMatch) {
      const mockMatchId = `match-${Date.now()}`;
      setMatchId(mockMatchId);

      const mockMatch = {
        matchId: mockMatchId,
        status: 'active' as const,
        tick: 0,
        homeTeam: {
          players: [
            {
              id: playerId,
              position: { x: 200, y: 288 },
              stamina: 100,
              stats: { wins: 0, losses: 0, goalsScored: 0, goalsConceded: 0, assists: 0 },
            },
            {
              id: 'player2',
              position: { x: 300, y: 200 },
              stamina: 100,
              stats: { wins: 0, losses: 0, goalsScored: 0, goalsConceded: 0, assists: 0 },
            },
            {
              id: 'player3',
              position: { x: 300, y: 376 },
              stamina: 100,
              stats: { wins: 0, losses: 0, goalsScored: 0, goalsConceded: 0, assists: 0 },
            },
            {
              id: 'player4',
              position: { x: 400, y: 288 },
              stamina: 100,
              stats: { wins: 0, losses: 0, goalsScored: 0, goalsConceded: 0, assists: 0 },
            },
            {
              id: 'player5',
              position: { x: 500, y: 288 },
              stamina: 100,
              stats: { wins: 0, losses: 0, goalsScored: 0, goalsConceded: 0, assists: 0 },
            },
          ],
          stats: { goals: 0, possession: 50, offsides: 0, fouls: 0 },
          formation: 1,
        },
        awayTeam: {
          players: [
            {
              id: 'opponent1',
              position: { x: 824, y: 288 },
              stamina: 100,
              stats: { wins: 0, losses: 0, goalsScored: 0, goalsConceded: 0, assists: 0 },
            },
            {
              id: 'opponent2',
              position: { x: 724, y: 200 },
              stamina: 100,
              stats: { wins: 0, losses: 0, goalsScored: 0, goalsConceded: 0, assists: 0 },
            },
            {
              id: 'opponent3',
              position: { x: 724, y: 376 },
              stamina: 100,
              stats: { wins: 0, losses: 0, goalsScored: 0, goalsConceded: 0, assists: 0 },
            },
            {
              id: 'opponent4',
              position: { x: 624, y: 288 },
              stamina: 100,
              stats: { wins: 0, losses: 0, goalsScored: 0, goalsConceded: 0, assists: 0 },
            },
            {
              id: 'opponent5',
              position: { x: 524, y: 288 },
              stamina: 100,
              stats: { wins: 0, losses: 0, goalsScored: 0, goalsConceded: 0, assists: 0 },
            },
          ],
          stats: { goals: 0, possession: 50, offsides: 0, fouls: 0 },
          formation: 1,
        },
        ball: { x: 512, y: 288, vx: 0, vy: 0 },
        possession: 'home',
        duration: 1800000, // 30 minutes in ms
        seed: 12345,
      };

      setCurrentMatch(mockMatch);
      setMatchStarted(true);
    }
  }, [playerId, currentMatch, isConnected, playerProfile?.username]);

  // Handle match end (demo: after 5 minutes)
  useEffect(() => {
    if (!isMatchStarted || isMatchEnded || !currentMatch) return;

    const timer = setTimeout(() => {
      // Create mock match result
      const matchResult = {
        matchId: currentMatch.matchId,
        homeTeam: currentMatch.homeTeam,
        awayTeam: currentMatch.awayTeam,
        result: { home: 2, away: 1 },
        duration: currentMatch.duration,
        inputs: [],
        resultHash: `0x${Array(64)
          .fill(0)
          .map(() => Math.floor(Math.random() * 16).toString(16))
          .join('')}`,
        timestamp: Date.now(),
      };

      // Update store with result
      useMatchStore.setState({ matchResult });
      setMatchEnded(true);
      setShowResultModal(true);
    }, 60000); // 1 minute for demo

    return () => clearTimeout(timer);
  }, [isMatchStarted, isMatchEnded, currentMatch]);

  if (!isConnected || !currentMatch) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="text-center">
          <p className="text-white text-2xl font-bold mb-4">Initializing match...</p>
          <div className="animate-spin text-white text-4xl">⚽</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col">
      {/* Main game area */}
      <div className="flex-1 flex flex-col relative">
        {/* Game canvas */}
        <GameCanvas matchId={matchId} />

        {/* Game HUD overlay */}
        {isMatchStarted && <MatchHUD />}

        {/* Match result modal */}
        <MatchResultModal isOpen={showResultModal} onClose={() => setShowResultModal(false)} />
      </div>

      {/* Footer with quick stats */}
      {playerProfile && (
        <div className="bg-gray-800 border-t border-gray-700 p-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center text-gray-300">
            <div>
              <span className="font-semibold">{playerProfile.username}</span>
              <span className="mx-2">•</span>
              <span>Rating: {playerProfile.ranking.rating.toFixed(0)}</span>
            </div>
            <div className="flex gap-6">
              <div>
                <span className="text-gray-500">Wins</span>
                <span className="ml-2 font-semibold text-green-400">{playerProfile.stats.wins}</span>
              </div>
              <div>
                <span className="text-gray-500">Losses</span>
                <span className="ml-2 font-semibold text-red-400">{playerProfile.stats.losses}</span>
              </div>
              <div>
                <span className="text-gray-500">Goals</span>
                <span className="ml-2 font-semibold text-blue-400">{playerProfile.stats.goalsScored}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamePage;
