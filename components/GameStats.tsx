'use client';

import React from 'react';
import { GameState } from '@/lib/gameEngine';

interface GameStatsProps {
  gameState: GameState | null;
  gameTime: number;
}

export function GameStats({ gameState, gameTime }: GameStatsProps) {
  if (!gameState) return null;

  const minutes = Math.floor(gameTime / 60);
  const seconds = gameTime % 60;

  return (
    <div className="bg-black bg-opacity-70 border border-gray-600 rounded-lg p-6 text-white">
      <div className="grid grid-cols-3 gap-4">
        {/* Home Team */}
        <div className="text-center">
          <h3 className="text-lg font-bold mb-2">{gameState.homeTeam.name}</h3>
          <div className="text-4xl font-bold text-red-500">{gameState.homeTeam.score}</div>
          <p className="text-sm text-gray-400 mt-2">
            Possession: {Math.round(gameState.homeTeam.possession)}%
          </p>
        </div>

        {/* Match Time */}
        <div className="flex flex-col items-center justify-center">
          <div className="text-3xl font-mono font-bold mb-2">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <div className="text-xs text-gray-400">LIVE</div>
        </div>

        {/* Away Team */}
        <div className="text-center">
          <h3 className="text-lg font-bold mb-2">{gameState.awayTeam.name}</h3>
          <div className="text-4xl font-bold text-blue-500">{gameState.awayTeam.score}</div>
          <p className="text-sm text-gray-400 mt-2">
            Possession: {Math.round(gameState.awayTeam.possession)}%
          </p>
        </div>
      </div>
    </div>
  );
}
