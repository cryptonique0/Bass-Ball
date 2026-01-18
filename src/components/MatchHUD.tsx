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
    <div className="fixed inset-0 pointer-events-none z-10 font-sans">
      {/* Top Score Bar - Mobile First */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 via-black/50 to-transparent p-3 md:p-4 pointer-events-auto transition-all duration-200">
        <div className="max-w-7xl mx-auto">
          {/* Score Display */}
          <div className="flex justify-between items-center mb-3 md:mb-4 gap-2">
            <div className="text-white flex-1">
              <h3 className="text-xs md:text-sm font-semibold text-gray-300">Home</h3>
              <p className="text-3xl md:text-4xl font-bold text-white">{homeScore}</p>
            </div>

            <div className="text-center">
              <p className="text-xl md:text-2xl font-bold text-white tracking-wider">
                {minutes}:{seconds.toString().padStart(2, '0')}
              </p>
              <p className="text-xs text-gray-300">Match Time</p>
            </div>

            <div className="text-right text-white flex-1">
              <h3 className="text-xs md:text-sm font-semibold text-gray-300">Away</h3>
              <p className="text-3xl md:text-4xl font-bold text-white">{awayScore}</p>
            </div>
          </div>

          {/* Player Stats - Responsive */}
          {playerProfile && (
            <div className="bg-black/40 rounded p-2 text-xs md:text-sm text-gray-300 backdrop-blur-sm transition-all duration-200">
              <span className="mr-2 md:mr-4">
                <span className="text-white font-semibold">{playerProfile.stats.wins}</span>W
              </span>
              <span className="mr-2 md:mr-4">
                <span className="text-white font-semibold">{playerProfile.stats.losses}</span>L
              </span>
              <span className="hidden md:inline">
                Rating: <span className="text-white font-semibold">{playerProfile.ranking.rating.toFixed(0)}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Control Panel - Mobile Optimized */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-2 md:p-4 pointer-events-auto transition-all duration-200">
        <div className="max-w-7xl mx-auto">
          {/* Control Grid - Mobile First (2 cols) */}
          <div className="grid grid-cols-2 gap-1.5 md:grid-cols-6 md:gap-2 mb-3 md:mb-4">
            {/* Move Controls */}
            <button
              onClick={() => handleAction('MOVE', { x: 0, y: -1 })}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-2 md:py-3 px-2 md:px-4 rounded font-semibold text-xs md:text-sm cursor-pointer transition-all duration-150 transform hover:scale-105 active:scale-95"
            >
              <span className="hidden md:inline">↑ Move</span>
              <span className="md:hidden">↑</span>
            </button>

            {/* Pass */}
            <button
              onClick={() => handleAction('PASS', { power: 70, angle: 0 })}
              className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white py-2 md:py-3 px-2 md:px-4 rounded font-semibold text-xs md:text-sm cursor-pointer transition-all duration-150 transform hover:scale-105 active:scale-95"
            >
              <span className="hidden md:inline">Pass (P)</span>
              <span className="md:hidden">Pass</span>
            </button>

            {/* Shoot */}
            <button
              onClick={() => handleAction('SHOOT', { power: 85, angle: 0 })}
              className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white py-2 md:py-3 px-2 md:px-4 rounded font-semibold text-xs md:text-sm cursor-pointer transition-all duration-150 transform hover:scale-105 active:scale-95"
            >
              <span className="hidden md:inline">Shoot (⎵)</span>
              <span className="md:hidden">⚽</span>
            </button>

            {/* Tackle */}
            <button
              onClick={() => handleAction('TACKLE', { targetId: '' })}
              className="bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800 text-white py-2 md:py-3 px-2 md:px-4 rounded font-semibold text-xs md:text-sm cursor-pointer transition-all duration-150 transform hover:scale-105 active:scale-95"
            >
              <span className="hidden md:inline">Tackle (T)</span>
              <span className="md:hidden">🛡️</span>
            </button>

            {/* Sprint */}
            <button
              onClick={() => handleAction('SPRINT', {})}
              className="bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white py-2 md:py-3 px-2 md:px-4 rounded font-semibold text-xs md:text-sm cursor-pointer transition-all duration-150 transform hover:scale-105 active:scale-95"
            >
              <span className="hidden md:inline">Sprint (⇧)</span>
              <span className="md:hidden">💨</span>
            </button>

            {/* Skill Move */}
            <button
              onClick={() => handleAction('SKILL', { skillId: 'default' })}
              className="bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white py-2 md:py-3 px-2 md:px-4 rounded font-semibold text-xs md:text-sm cursor-pointer transition-all duration-150 transform hover:scale-105 active:scale-95"
            >
              <span className="hidden md:inline">Skill</span>
              <span className="md:hidden">✨</span>
            </button>
          </div>

          {/* Stamina Bar - Mobile Optimized */}
          <div className="mb-2 md:mb-3 transition-all duration-200">
            <div className="flex justify-between text-xs text-gray-300 mb-1">
              <span>Stamina</span>
              <span>100%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5 md:h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-green-400 to-green-500 h-full rounded-full transition-all duration-300 ease-out" style={{ width: '100%' }} />
            </div>
          </div>

          {/* Possession Indicator - Mobile Optimized */}
          <div className="text-center transition-all duration-200">
            <p className="text-xs md:text-sm text-gray-400">
              Possession:{' '}
              <span className="font-semibold text-white animate-pulse">
                {currentMatch.possession === 'home' ? '🏠 Home' : '🏁 Away'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Help (Hidden on Mobile) */}
      <div className="absolute bottom-48 md:bottom-32 right-2 md:right-4 bg-black/70 backdrop-blur-sm rounded p-2 text-xs text-gray-400 hidden lg:block max-w-48 transition-all duration-200 hover:bg-black/80">
        <p className="font-semibold text-gray-300 mb-1">Controls:</p>
        <ul className="text-gray-400 space-y-0.5">
          <li>WASD - Move</li>
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
