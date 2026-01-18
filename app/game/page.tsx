'use client';

import { useState, useEffect } from 'react';
import { FootballPitch } from '@/components/FootballPitch';
import { GameStats } from '@/components/GameStats';
import { MatchControls } from '@/components/MatchControls';
import { PlayerCard } from '@/components/PlayerCard';
import { useGameEngine } from '@/hooks/useGameEngine';

export default function GamePage() {
  const {
    gameState,
    gameRunning,
    initializeGame,
    startMatch,
    pauseMatch,
    resumeMatch,
    endMatch,
    selectPlayer,
    passToPlayer,
    shoot,
  } = useGameEngine();

  const [gameTime, setGameTime] = useState(0);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  useEffect(() => {
    if (!gameRunning) return;
    const timer = setInterval(() => {
      setGameTime((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [gameRunning]);

  const handlePassClick = () => {
    if (gameState?.selectedPlayer) {
      // Auto-pass to nearest teammate
      const teammates = gameState.selectedPlayer.id.includes('Home')
        ? gameState.homeTeam.players
        : gameState.awayTeam.players;

      let nearestTeammate = null;
      let minDist = Infinity;

      teammates.forEach((player) => {
        if (player.id === gameState.selectedPlayer?.id) return;
        const dist = Math.hypot(
          player.x - gameState.selectedPlayer.x,
          player.y - gameState.selectedPlayer.y
        );
        if (dist < minDist) {
          minDist = dist;
          nearestTeammate = player;
        }
      });

      if (nearestTeammate) {
        passToPlayer(nearestTeammate);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">⚽ Bass Ball Football</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Game Area */}
          <div className="lg:col-span-2">
            <div className="bg-black rounded-lg overflow-hidden shadow-2xl">
              {gameState && <FootballPitch />}
            </div>

            {/* Game Stats */}
            <div className="mt-6">
              <GameStats gameState={gameState} gameTime={gameTime} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Match Controls */}
            <MatchControls
              gameRunning={gameRunning}
              onStart={startMatch}
              onPause={pauseMatch}
              onResume={resumeMatch}
              onEnd={endMatch}
              onPass={handlePassClick}
              onShoot={shoot}
              hasSelectedPlayer={!!gameState?.selectedPlayer}
            />

            {/* Selected Player Info */}
            {gameState?.selectedPlayer && (
              <div>
                <h3 className="text-white font-bold mb-3">Selected Player</h3>
                <PlayerCard
                  player={gameState.selectedPlayer}
                  selected={true}
                />
              </div>
            )}

            {/* Team Info */}
            <div className="card">
              <h3 className="text-white font-bold mb-3">Team Lineup</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                <div>
                  <p className="text-red-500 font-bold text-sm mb-2">Home Team</p>
                  {gameState?.homeTeam.players.slice(0, 5).map((player) => (
                    <div
                      key={player.id}
                      onClick={() => selectPlayer(player)}
                      className="text-xs text-gray-400 hover:text-white cursor-pointer p-1"
                    >
                      {player.name} ({player.position})
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-600 pt-2 mt-2">
                  <p className="text-blue-500 font-bold text-sm mb-2">Away Team</p>
                  {gameState?.awayTeam.players.slice(0, 5).map((player) => (
                    <div
                      key={player.id}
                      onClick={() => selectPlayer(player)}
                      className="text-xs text-gray-400 hover:text-white cursor-pointer p-1"
                    >
                      {player.name} ({player.position})
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
