'use client';

import React from 'react';
import { Player } from '@/lib/gameEngine';

interface PlayerCardProps {
  player: Player;
  selected?: boolean;
  onClick?: () => void;
}

export function PlayerCard({ player, selected = false, onClick }: PlayerCardProps) {
  const overall = Math.round((player.pace + player.shooting + player.passing + player.dribbling + player.defense + player.physical) / 6);

  return (
    <div
      onClick={onClick}
      className={`card cursor-pointer transition-all ${
        selected
          ? 'border-yellow-500 shadow-lg shadow-yellow-500/50 scale-105'
          : 'hover:border-gray-400'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-bold text-white">{player.name}</h4>
          <p className="text-xs text-gray-400">{player.position}</p>
        </div>
        <div className="text-2xl font-bold text-purple-400">{overall}</div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-gray-800 p-2 rounded">
          <p className="text-gray-400">Pace</p>
          <p className="text-white font-bold">{Math.round(player.pace)}</p>
        </div>
        <div className="bg-gray-800 p-2 rounded">
          <p className="text-gray-400">Shooting</p>
          <p className="text-white font-bold">{Math.round(player.shooting)}</p>
        </div>
        <div className="bg-gray-800 p-2 rounded">
          <p className="text-gray-400">Passing</p>
          <p className="text-white font-bold">{Math.round(player.passing)}</p>
        </div>
        <div className="bg-gray-800 p-2 rounded">
          <p className="text-gray-400">Dribbling</p>
          <p className="text-white font-bold">{Math.round(player.dribbling)}</p>
        </div>
        <div className="bg-gray-800 p-2 rounded">
          <p className="text-gray-400">Defense</p>
          <p className="text-white font-bold">{Math.round(player.defense)}</p>
        </div>
        <div className="bg-gray-800 p-2 rounded">
          <p className="text-gray-400">Physical</p>
          <p className="text-white font-bold">{Math.round(player.physical)}</p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-700">
        <p className="text-xs text-gray-400">Stamina: <span className="text-white font-bold">{Math.round(player.stamina)}%</span></p>
        <div className="w-full bg-gray-800 h-2 rounded mt-1">
          <div
            className="bg-green-500 h-full rounded transition-all"
            style={{ width: `${player.stamina}%` }}
          />
        </div>
      </div>
    </div>
  );
}
