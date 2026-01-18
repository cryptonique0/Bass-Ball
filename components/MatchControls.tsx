'use client';

import React, { useState } from 'react';
import { Player } from '@/lib/gameEngine';

interface MatchControlsProps {
  selectedPlayer: Player | null;
  gameTime: number;
  isPaused: boolean;
  onShoot: (strength: number) => void;
  onPass: (targetX: number, targetY: number) => void;
  onTackle: (targetPlayerId: string) => void;
  onSprint: () => void;
  canSprint: boolean;
  ballX: number;
  ballY: number;
  team: 'home' | 'away';
}

export function MatchControls({
  selectedPlayer,
  gameTime,
  isPaused,
  onShoot,
  onPass,
  onTackle,
  onSprint,
  canSprint,
  ballX,
  ballY,
  team,
}: MatchControlsProps) {
  const [showShootDialog, setShowShootDialog] = useState(false);
  const [shootStrength, setShootStrength] = useState(10);
  const [showPassDialog, setShowPassDialog] = useState(false);

  if (!selectedPlayer) {
    return (
      <div className="card p-4 text-center text-gray-400">
        <p>👈 Click a player to select them and see controls</p>
      </div>
    );
  }

  const distanceToGoal = team === 'home' ? 1050 - ballX : ballX;
  const nearGoal = distanceToGoal < 300;

  const handleShoot = () => {
    onShoot(shootStrength);
    setShowShootDialog(false);
  };

  const handlePassClick = () => {
    setShowPassDialog(true);
  };

  const handlePitch = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 1050;
    const y = ((e.clientY - rect.top) / rect.height) * 680;
    onPass(x, y);
    setShowPassDialog(false);
  };

  return (
    <div className="space-y-4">
      {/* Selected Player Info */}
      <div className="card p-4 bg-opacity-50 border-2 border-blue-500">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">{selectedPlayer.name}</h3>
            <p className="text-sm text-gray-400">{selectedPlayer.position} • Stamina: {Math.round(selectedPlayer.stamina)}%</p>
          </div>
          <div className="text-right text-sm">
            <div className="flex gap-2">
              <div className="text-center">
                <p className="text-xs text-gray-400">Pace</p>
                <p className="font-bold text-blue-400">{selectedPlayer.pace}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Shoot</p>
                <p className="font-bold text-yellow-400">{selectedPlayer.shooting}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Pass</p>
                <p className="font-bold text-green-400">{selectedPlayer.passing}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Controls Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* SHOOT Button */}
        <button
          onClick={() => setShowShootDialog(!showShootDialog)}
          disabled={isPaused || !nearGoal}
          className={`p-3 rounded-lg font-bold transition-all flex flex-col items-center gap-1 ${
            !nearGoal
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
              : showShootDialog
              ? 'bg-yellow-600 text-white scale-105'
              : 'bg-yellow-500 hover:bg-yellow-600 text-white active:scale-95'
          }`}
        >
          <span className="text-2xl">⚽</span>
          <span className="text-sm font-bold">Shoot</span>
          {!nearGoal && <span className="text-xs">Too far</span>}
        </button>

        {/* PASS Button */}
        <button
          onClick={handlePassClick}
          disabled={isPaused}
          className={`p-3 rounded-lg font-bold transition-all flex flex-col items-center gap-1 ${
            showPassDialog ? 'bg-blue-600 text-white scale-105' : 'bg-blue-500 hover:bg-blue-600 text-white active:scale-95'
          }`}
        >
          <span className="text-2xl">🎯</span>
          <span className="text-sm font-bold">Pass</span>
        </button>

        {/* TACKLE Button */}
        <button
          onClick={() => onTackle(selectedPlayer.id)}
          disabled={isPaused}
          className="p-3 rounded-lg font-bold transition-all flex flex-col items-center gap-1 bg-red-500 hover:bg-red-600 text-white active:scale-95"
        >
          <span className="text-2xl">🛡️</span>
          <span className="text-sm font-bold">Tackle</span>
        </button>

        {/* SPRINT Button */}
        <button
          onClick={onSprint}
          disabled={!canSprint || isPaused}
          className={`p-3 rounded-lg font-bold transition-all flex flex-col items-center gap-1 ${
            !canSprint ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50' : 'bg-cyan-500 hover:bg-cyan-600 text-white active:scale-95'
          }`}
        >
          <span className="text-2xl">⚡</span>
          <span className="text-sm font-bold">Sprint</span>
          {!canSprint && <span className="text-xs">No stamina</span>}
        </button>
      </div>

      {/* SHOOT Dialog */}
      {showShootDialog && nearGoal && (
        <div className="card p-4 bg-yellow-900 bg-opacity-50 border-2 border-yellow-600 space-y-3">
          <h4 className="font-bold text-white">⚽ Shoot Power</h4>
          <div className="space-y-2">
            <input
              type="range"
              min="1"
              max="20"
              value={shootStrength}
              onChange={(e) => setShootStrength(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-300">
              <span>Weak</span>
              <span className="font-bold text-yellow-400">{shootStrength}</span>
              <span>Powerful</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowShootDialog(false)}
              className="py-2 px-3 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-bold"
            >
              Cancel
            </button>
            <button onClick={handleShoot} className="py-2 px-3 rounded bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-bold">
              🎯 Shoot!
            </button>
          </div>
        </div>
      )}

      {/* PASS Dialog */}
      {showPassDialog && (
        <div className="card p-4 bg-blue-900 bg-opacity-50 border-2 border-blue-600 space-y-3">
          <h4 className="font-bold text-white">🎯 Click target on pitch to pass</h4>
          <svg
            onClick={handlePitch}
            className="w-full bg-green-800 rounded cursor-crosshair border-2 border-blue-400"
            viewBox="0 0 1050 680"
            style={{ aspectRatio: '1050/680' }}
          >
            {/* Pitch lines */}
            <line x1="0" y1="0" x2="1050" y2="0" stroke="white" strokeWidth="2" />
            <line x1="0" y1="680" x2="1050" y2="680" stroke="white" strokeWidth="2" />
            <line x1="0" y1="0" x2="0" y2="680" stroke="white" strokeWidth="2" />
            <line x1="1050" y1="0" x2="1050" y2="680" stroke="white" strokeWidth="2" />
            <line x1="525" y1="0" x2="525" y2="680" stroke="white" strokeWidth="1" opacity="0.5" />

            {/* Player position */}
            <circle cx={selectedPlayer.x} cy={selectedPlayer.y} r="20" fill="gold" opacity="0.7" />
            <text x={selectedPlayer.x} y={selectedPlayer.y} textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="bold">
              P
            </text>
          </svg>

          <button
            onClick={() => setShowPassDialog(false)}
            className="w-full py-2 px-3 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-bold"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Control Tips */}
      <div className="card p-3 bg-gray-800 text-xs text-gray-300 space-y-1">
        <p>
          <span className="font-bold">⚽ Shoot:</span> Available when near opponent goal
        </p>
        <p>
          <span className="font-bold">🎯 Pass:</span> Click target area on the pitch
        </p>
        <p>
          <span className="font-bold">🛡️ Tackle:</span> Attempt to win the ball back
        </p>
        <p>
          <span className="font-bold">⚡ Sprint:</span> Boost speed (consumes stamina)
        </p>
      </div>
    </div>
  );
}

export default MatchControls;
