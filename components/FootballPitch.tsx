'use client';

import React from 'react';
import { useGameEngine } from '@/hooks/useGameEngine';

export function FootballPitch() {
  const { gameState, selectPlayer } = useGameEngine();

  if (!gameState) return null;

  const allPlayers = [...gameState.homeTeam.players, ...gameState.awayTeam.players];

  return (
    <div className="relative w-full h-full bg-grass border-4 border-pitch-line rounded-lg overflow-hidden shadow-2xl" 
         style={{ aspectRatio: '105/68' }}>
      {/* Center line */}
      <div className="absolute top-0 left-1/2 w-1 h-full border-r-2 border-pitch-line" />

      {/* Center circle */}
      <div className="pitch-center-circle" />
      <div className="pitch-center-spot" />

      {/* Goal areas */}
      <div className="absolute top-1/4 left-0 w-1/6 h-1/2 border-2 border-pitch-line" />
      <div className="absolute top-1/4 right-0 w-1/6 h-1/2 border-2 border-pitch-line" />

      {/* Penalty areas */}
      <div className="absolute top-1/3 left-0 w-1/4 h-1/3 border-2 border-pitch-line" />
      <div className="absolute top-1/3 right-0 w-1/4 h-1/3 border-2 border-pitch-line" />

      {/* Corner arcs */}
      <div className="absolute top-0 left-0 w-8 h-8 border-2 border-pitch-line rounded-br-full" />
      <div className="absolute top-0 right-0 w-8 h-8 border-2 border-pitch-line rounded-bl-full" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-2 border-pitch-line rounded-tr-full" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-2 border-pitch-line rounded-tl-full" />

      {/* Ball */}
      <div
        className="ball"
        style={{
          left: `${(gameState.ballX / 1050) * 100}%`,
          top: `${(gameState.ballY / 680) * 100}%`,
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Players */}
      {allPlayers.map((player) => (
        <div
          key={player.id}
          className={`player ${
            player.id.includes('Home') ? 'team-home' : 'team-away'
          } ${player.selected ? 'selected' : ''}`}
          style={{
            left: `${(player.x / 1050) * 100}%`,
            top: `${(player.y / 680) * 100}%`,
            transform: 'translate(-50%, -50%)',
            cursor: 'pointer',
          }}
          onClick={() => selectPlayer(player)}
        >
          <span>{player.name.split('-')[1]}</span>
        </div>
      ))}
    </div>
  );
}
