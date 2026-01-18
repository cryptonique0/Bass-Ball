'use client';

import React from 'react';
import { useMatchStore } from '@/store/useMatchStore';
import { sendPlayerInput } from '@/lib/socket';
import { PlayerInput } from '@/types/match';

export const MatchHUD: React.FC = () => {
  const { currentMatch, playerProfile } = useMatchStore();

  if (!currentMatch) {
    return null;
  }

  const homeScore = currentMatch.homeTeam.stats.goals;
  const awayScore = currentMatch.awayTeam.stats.goals;
  const timeLeft = Math.max(0, currentMatch.duration - currentMatch.tick * (1000 / 60));
  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  const handleAction = (action: 'MOVE' | 'PASS' | 'SHOOT' | 'TACKLE' | 'SPRINT' | 'SKILL', params: Record<string, any>) => {
    if (!currentMatch) return;

    const input: PlayerInput = {
      tick: currentMatch.tick,
      action,
      params,
      timestamp: Date.now(),
    };

    sendPlayerInput(input);
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-10">
      {/* Top Score Bar */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-4 pointer-events-auto">
        <div className="max-w-7xl mx-auto">
          {/* Score Display */}
          <div className="flex justify-between items-center mb-4">
            <div className="text-white">
              <h3 className="text-sm font-semibold text-gray-300">Home</h3>
              <p className="text-4xl font-bold text-white">{homeScore}</p>
            </div>

            <div className="text-center">
              <p className="text-2xl font-bold text-white">
                {minutes}:{seconds.toString().padStart(2, '0')}
              </p>
              <p className="text-xs text-gray-300">Match Time</p>
            </div>

            <div className="text-right text-white">
              <h3 className="text-sm font-semibold text-gray-300">Away</h3>
              <p className="text-4xl font-bold text-white">{awayScore}</p>
            </div>
          </div>

          {/* Player Stats */}
          {playerProfile && (
            <div className="bg-black/40 rounded p-2 text-xs text-gray-300">
              <span className="mr-4">
                <span className="text-white font-semibold">{playerProfile.stats.wins}</span>W -{' '}
                <span className="text-white font-semibold">{playerProfile.stats.losses}</span>L
              </span>
              <span>
                Rating: <span className="text-white font-semibold">{playerProfile.ranking.rating.toFixed(0)}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Control Panel */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pointer-events-auto">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-6">
            {/* Move Controls */}
            <div className="bg-blue-600/80 hover:bg-blue-700 text-white py-3 px-4 rounded font-semibold text-sm cursor-pointer transition-colors flex items-center justify-center gap-2" onClick={() => handleAction('MOVE', { x: 0, y: -1 })}>
              <span>↑ Move</span>
            </div>

            {/* Pass */}
            <div className="bg-green-600/80 hover:bg-green-700 text-white py-3 px-4 rounded font-semibold text-sm cursor-pointer transition-colors flex items-center justify-center" onClick={() => handleAction('PASS', { power: 70, angle: 0 })}>
              <span>Pass (P)</span>
            </div>

            {/* Shoot */}
            <div className="bg-red-600/80 hover:bg-red-700 text-white py-3 px-4 rounded font-semibold text-sm cursor-pointer transition-colors flex items-center justify-center" onClick={() => handleAction('SHOOT', { power: 85, angle: 0 })}>
              <span>Shoot (⎵)</span>
            </div>

            {/* Tackle */}
            <div className="bg-yellow-600/80 hover:bg-yellow-700 text-white py-3 px-4 rounded font-semibold text-sm cursor-pointer transition-colors flex items-center justify-center" onClick={() => handleAction('TACKLE', { targetId: '' })}>
              <span>Tackle (T)</span>
            </div>

            {/* Sprint */}
            <div className="bg-purple-600/80 hover:bg-purple-700 text-white py-3 px-4 rounded font-semibold text-sm cursor-pointer transition-colors flex items-center justify-center" onClick={() => handleAction('SPRINT', {})}>
              <span>Sprint (⇧)</span>
            </div>

            {/* Skill Move */}
            <div className="bg-orange-600/80 hover:bg-orange-700 text-white py-3 px-4 rounded font-semibold text-sm cursor-pointer transition-colors flex items-center justify-center" onClick={() => handleAction('SKILL', { skillId: 'default' })}>
              <span>Skill</span>
            </div>
          </div>

          {/* Stamina Bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-300 mb-1">
              <span>Stamina</span>
              <span>100%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }} />
            </div>
          </div>

          {/* Possession Indicator */}
          <div className="mt-3 text-center">
            <p className="text-xs text-gray-400">
              Possession:{' '}
              <span className="font-semibold text-white">
                {currentMatch.possession === 'home' ? 'Home' : 'Away'} Team
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Help (Mobile Hidden) */}
      <div className="absolute bottom-32 right-4 bg-black/60 rounded p-2 text-xs text-gray-400 hidden lg:block max-w-48">
        <p className="font-semibold text-gray-300 mb-1">Controls:</p>
        <ul className="text-gray-400 space-y-1">
          <li>WASD / Arrows - Move</li>
          <li>P - Pass</li>
          <li>Space - Shoot</li>
          <li>T - Tackle</li>
          <li>Shift - Sprint</li>
        </ul>
      </div>
    </div>
  );
};

export default MatchHUD;
