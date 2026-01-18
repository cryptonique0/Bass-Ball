'use client';

import React from 'react';

interface MatchControlsProps {
  gameRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  onPass: () => void;
  onShoot: () => void;
  hasSelectedPlayer: boolean;
}

export function MatchControls({
  gameRunning,
  onStart,
  onPause,
  onResume,
  onEnd,
  onPass,
  onShoot,
  hasSelectedPlayer,
}: MatchControlsProps) {
  return (
    <div className="bg-black bg-opacity-70 border border-gray-600 rounded-lg p-4 space-y-3">
      <div className="flex gap-2 flex-wrap">
        {!gameRunning ? (
          <button
            onClick={onStart}
            className="btn btn-primary flex-1"
          >
            ▶ Start Match
          </button>
        ) : (
          <>
            <button
              onClick={onPause}
              className="btn btn-secondary flex-1"
            >
              ⏸ Pause
            </button>
            <button
              onClick={onEnd}
              className="btn btn-secondary flex-1"
            >
              ⏹ End Match
            </button>
          </>
        )}
      </div>

      <div className="border-t border-gray-600 pt-3">
        <p className="text-sm text-gray-400 mb-2">Player Controls</p>
        <div className="flex gap-2">
          <button
            onClick={onPass}
            disabled={!hasSelectedPlayer}
            className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🎯 Pass
          </button>
          <button
            onClick={onShoot}
            disabled={!hasSelectedPlayer}
            className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ⚽ Shoot
          </button>
        </div>
        {!hasSelectedPlayer && (
          <p className="text-xs text-yellow-500 mt-2">Click a player to select</p>
        )}
      </div>
    </div>
  );
}
