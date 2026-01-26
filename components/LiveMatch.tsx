'use client';

import React, { useState } from 'react';
import { useAIMatch, usePvPMatch } from '@/hooks/useMatchEngine';
import { Team } from '@/lib/gameEngine';
import { MatchStats } from '@/lib/matchEngine';
import MatchControls from './MatchControls';
import { MatchResults } from './MatchResults';
import { MatchSummary } from './MatchSummary';

interface LiveMatchProps {
  homeTeam: Team;
  awayTeam: Team;
  mode: 'ai' | 'pvp';
  difficulty?: 'easy' | 'normal' | 'hard';
}

export function LiveMatch({ homeTeam, awayTeam, mode, difficulty = 'normal' }: LiveMatchProps) {
  const [ballHover, setBallHover] = useState<{ x: number; y: number } | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const matchHook = mode === 'ai' ? useAIMatch(homeTeam, awayTeam) : usePvPMatch(homeTeam, awayTeam);

  const { gameState, matchStats, isPaused, pause, resume, togglePause, selectPlayer, shoot, pass, sprint, tackle, resetMatch } = matchHook;

  // Check if match is over
  const isMatchOver = gameState.gameTime >= 90;

  if (isMatchOver && matchStats) {
    return (
      <MatchSummary
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        matchStats={matchStats}
        matchEngine={null as any}
        gameTime={gameState.gameTime}
        onRestart={resetMatch}
      />
    );
  }

  const handlePitchClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 1050;
    const y = ((e.clientY - rect.top) / rect.height) * 680;

    if (selectedPlayerId && gameState.selectedPlayer) {
      // Shoot if near goal, pass otherwise
      const team = homeTeam.players.some((p) => p.id === selectedPlayerId) ? 'home' : 'away';
      const isNearGoal = team === 'home' ? x > 850 : x < 200;

      if (isNearGoal) {
        const strength = Math.sqrt((x - gameState.selectedPlayer.x) ** 2 + (y - gameState.selectedPlayer.y) ** 2) / 30;
        shoot(Math.min(strength, 15));
      } else {
        pass(x, y);
      }

      setSelectedPlayerId(null);
    }
  };

  const handlePlayerClick = (player: any) => {
    setSelectedPlayerId(player.id);
    selectPlayer(player);
  };

  return (
    <div className="space-y-6">
      {/* Match Header */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center">
            <h3 className="text-lg font-bold">{homeTeam.name}</h3>
            <p className="text-4xl font-black text-yellow-400">{gameState.homeTeam.score}</p>
          </div>

          <div className="flex-1 text-center mx-4">
            <p className="text-gray-400">
              {Math.floor(gameState.gameTime)}' / 90'
            </p>
            <button
              onClick={togglePause}
              className={`mt-2 px-6 py-2 rounded font-bold transition-colors ${
                isPaused ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isPaused ? '▶ Resume' : '⏸ Pause'}
            </button>
          </div>

          <div className="flex-1 text-center">
            <h3 className="text-lg font-bold">{awayTeam.name}</h3>
            <p className="text-4xl font-black text-yellow-400">{gameState.awayTeam.score}</p>
          </div>
        </div>
      </div>

      {/* Pitch */}
      <div className="card p-4 flex justify-center">
        <svg
          width="600"
          height="400"
          viewBox="0 0 1050 680"
          className="border-2 border-white cursor-crosshair bg-gradient-to-b from-green-700 to-green-800"
          onClick={handlePitchClick}
          onMouseMove={(e) => {
            const svg = e.currentTarget;
            const rect = svg.getBoundingClientRect();
            setBallHover({
              x: ((e.clientX - rect.left) / rect.width) * 1050,
              y: ((e.clientY - rect.top) / rect.height) * 680,
            });
          }}
          onMouseLeave={() => setBallHover(null)}
        >
          {/* Pitch Lines */}
          <line x1="0" y1="0" x2="1050" y2="0" stroke="white" strokeWidth="2" />
          <line x1="0" y1="680" x2="1050" y2="680" stroke="white" strokeWidth="2" />
          <line x1="0" y1="0" x2="0" y2="680" stroke="white" strokeWidth="2" />
          <line x1="1050" y1="0" x2="1050" y2="680" stroke="white" strokeWidth="2" />
          <line x1="525" y1="0" x2="525" y2="680" stroke="white" strokeWidth="2" />
          <circle cx="525" cy="340" r="100" fill="none" stroke="white" strokeWidth="2" />
          <circle cx="525" cy="340" r="5" fill="white" />

          {/* Goals */}
          <rect x="0" y="250" width="30" height="180" fill="none" stroke="red" strokeWidth="2" />
          <rect x="1020" y="250" width="30" height="180" fill="none" stroke="blue" strokeWidth="2" />

          {/* Home Players */}
          {gameState.homeTeam.players.map((player, idx) => (
            <g
              key={`home-${idx}`}
              onClick={() => handlePlayerClick(player)}
              className="cursor-pointer"
            >
              <circle
                cx={player.x}
                cy={player.y}
                r="20"
                fill={selectedPlayerId === player.id ? '#FFD700' : '#FF6B6B'}
                stroke={selectedPlayerId === player.id ? '#000' : '#fff'}
                strokeWidth="2"
              />
              <text
                x={player.x}
                y={player.y + 5}
                textAnchor="middle"
                fill="white"
                fontSize="12"
                fontWeight="bold"
              >
                {idx + 1}
              </text>
            </g>
          ))}

          {/* Away Players */}
          {gameState.awayTeam.players.map((player, idx) => (
            <g key={`away-${idx}`} onClick={() => handlePlayerClick(player)} className="cursor-pointer">
              <circle
                cx={player.x}
                cy={player.y}
                r="20"
                fill={selectedPlayerId === player.id ? '#FFD700' : '#4A90E2'}
                stroke={selectedPlayerId === player.id ? '#000' : '#fff'}
                strokeWidth="2"
              />
              <text
                x={player.x}
                y={player.y + 5}
                textAnchor="middle"
                fill="white"
                fontSize="12"
                fontWeight="bold"
              >
                {idx + 1}
              </text>
            </g>
          ))}

          {/* Ball */}
          <circle cx={gameState.ballX} cy={gameState.ballY} r="8" fill="white" />
          {ballHover && (
            <circle cx={ballHover.x} cy={ballHover.y} r="15" fill="none" stroke="yellow" strokeWidth="2" strokeDasharray="5,5" />
          )}

          {/* Possession Indicator */}
          {gameState.possession === 'home' && (
            <text x="50" y="30" fill="white" fontSize="16" fontWeight="bold">
              🔴 HOME
            </text>
          )}
          {gameState.possession === 'away' && (
            <text x="950" y="30" fill="white" fontSize="16" fontWeight="bold">
              AWAY 🔵
            </text>
          )}
        </svg>
      </div>

      {/* Match Stats */}
      <div className="grid grid-cols-2 gap-4">
        <MatchStatsCard stats={matchStats} team="home" teamName={homeTeam.name} />
        <MatchStatsCard stats={matchStats} team="away" teamName={awayTeam.name} />
      </div>

      {/* Match Events */}
      <MatchEventsLog stats={matchStats} />

      {/* Controls Panel */}
      <MatchControls
        selectedPlayer={gameState.selectedPlayer || null}
        gameTime={gameState.gameTime}
        isPaused={isPaused}
        onShoot={shoot}
        onPass={pass}
        onTackle={tackle}
        onSprint={() => selectedPlayerId && sprint(selectedPlayerId)}
        canSprint={selectedPlayerId ? (gameState.selectedPlayer?.stamina || 0) > 15 : false}
        ballX={gameState.ballX}
        ballY={gameState.ballY}
        team={homeTeam.players.some((p) => p.id === selectedPlayerId) ? 'home' : 'away'}
      />

      {/* Reset & Pause Controls */}
      <div className="card p-4 flex gap-3">
        <button onClick={resetMatch} className="btn btn-secondary">
          🔄 Reset Match
        </button>
        <button onClick={togglePause} className="btn btn-primary flex-1">
          {isPaused ? '▶ Resume' : '⏸ Pause'}
        </button>
      </div>
    </div>
  );
}

interface MatchStatsCardProps {
  stats: MatchStats | null;
  team: 'home' | 'away';
  teamName: string;
}

function MatchStatsCard({ stats, team, teamName }: MatchStatsCardProps) {
  if (!stats) return null;

  const teamStats = stats[team === 'home' ? 'homeTeam' : 'awayTeam'];

  return (
    <div className="card p-4">
      <h3 className="font-bold mb-3">{teamName}</h3>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Shots</span>
          <span className="font-bold">{teamStats.shots}</span>
        </div>
        <div className="flex justify-between">
          <span>On Target</span>
          <span className="font-bold text-yellow-400">{teamStats.shotsOnTarget}</span>
        </div>
        <div className="flex justify-between">
          <span>Passes</span>
          <span className="font-bold">{teamStats.passes}</span>
        </div>
        <div className="flex justify-between">
          <span>Tackles</span>
          <span className="font-bold text-green-400">{teamStats.tackles}</span>
        </div>
        <div className="flex justify-between">
          <span>Fouls</span>
          <span className="font-bold text-red-400">{teamStats.fouls}</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-gray-700">
          <span>Possession</span>
          <span className="font-bold text-blue-400">{teamStats.possession}%</span>
        </div>
      </div>
    </div>
  );
}

function MatchEventsLog({ stats }: { stats: MatchStats | null }) {
  if (!stats || stats.events.length === 0) return null;

  const getEventIcon = (type: string): string => {
    const icons: Record<string, string> = {
      goal: '⚽',
      shot: '🎯',
      tackle: '🤝',
      foul: '⚠️',
      yellow_card: '🟨',
      red_card: '🔴',
      injury: '🚑',
      pass: '➡️',
      possession_change: '🔄',
    };
    return icons[type] || '•';
  };

  return (
    <div className="card p-4">
      <h3 className="font-bold mb-3">Match Events</h3>

      <div className="space-y-1 max-h-48 overflow-y-auto text-sm">
        {[...stats.events].reverse().slice(0, 10).map((event, idx) => (
          <div
            key={idx}
            className={`p-2 rounded ${
              event.type === 'goal'
                ? 'bg-yellow-900 text-yellow-100 font-bold'
                : event.type === 'red_card'
                ? 'bg-red-900 text-red-100'
                : event.type === 'yellow_card'
                ? 'bg-yellow-800 text-yellow-100'
                : 'bg-gray-800 text-gray-300'
            }`}
          >
            <span className="mr-2">{getEventIcon(event.type)}</span>
            <span className="font-bold">{Math.floor(event.time)}'</span>
            <span className="ml-2">{event.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LiveMatch;
