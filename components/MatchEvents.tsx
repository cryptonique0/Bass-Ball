'use client';

import React from 'react';
import { MatchEvent } from '@/lib/konamiFeatures';

interface MatchEventsProps {
  events: MatchEvent[];
  isLive: boolean;
}

export function MatchEventsList({ events, isLive }: MatchEventsProps) {
  return (
    <div className="card p-6">
      <h3 className="text-xl font-bold mb-4 flex items-center">
        📺 Match Events
        {isLive && <span className="ml-2 text-xs bg-red-600 px-2 py-1 rounded animate-pulse">LIVE</span>}
      </h3>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {events.length === 0 ? (
          <p className="text-gray-400">No events yet...</p>
        ) : (
          events.map((event, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 p-3 rounded border-l-4 ${getEventColor(
                event.type
              )}`}
            >
              <span className="text-2xl mt-1">{getEventIcon(event.type)}</span>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold">{event.player.name}</p>
                    <p className="text-sm text-gray-400">{event.description}</p>
                  </div>
                  <span className="text-sm text-gray-400 font-mono">{event.time}'</span>
                </div>
                {event.var_decision && (
                  <div className="text-xs text-yellow-500 mt-1">
                    ✓ VAR Review: {event.var_decision.toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function getEventIcon(type: string): string {
  const icons: Record<string, string> = {
    goal: '⚽',
    miss: '❌',
    save: '🧤',
    'yellow-card': '🟨',
    'red-card': '🔴',
    injury: '🚑',
    substitution: '🔄',
    'var-review': '📹',
    corner: '🚩',
    freekick: '🎯',
    penalty: '💀',
    offside: '📍',
  };
  return icons[type] || '📌';
}

function getEventColor(type: string): string {
  const colors: Record<string, string> = {
    goal: 'border-green-500 bg-green-900 bg-opacity-20',
    miss: 'border-orange-500 bg-orange-900 bg-opacity-20',
    save: 'border-blue-500 bg-blue-900 bg-opacity-20',
    'yellow-card': 'border-yellow-500 bg-yellow-900 bg-opacity-20',
    'red-card': 'border-red-500 bg-red-900 bg-opacity-20',
    injury: 'border-purple-500 bg-purple-900 bg-opacity-20',
    substitution: 'border-cyan-500 bg-cyan-900 bg-opacity-20',
    'var-review': 'border-yellow-500 bg-yellow-900 bg-opacity-20',
    corner: 'border-blue-500 bg-blue-900 bg-opacity-20',
    freekick: 'border-orange-500 bg-orange-900 bg-opacity-20',
    penalty: 'border-red-500 bg-red-900 bg-opacity-20',
    offside: 'border-gray-500 bg-gray-900 bg-opacity-20',
  };
  return colors[type] || 'border-gray-500 bg-gray-900 bg-opacity-20';
}

// Match Statistics Display
interface MatchStatisticsProps {
  stats: {
    homeTeam: {
      possession: number;
      shots: number;
      shotsOnTarget: number;
      passes: number;
      passAccuracy: number;
      tackles: number;
      fouls: number;
    };
    awayTeam: {
      possession: number;
      shots: number;
      shotsOnTarget: number;
      passes: number;
      passAccuracy: number;
      tackles: number;
      fouls: number;
    };
  };
}

export function MatchStatistics({ stats }: MatchStatisticsProps) {
  const statRows = [
    { label: 'Possession', key: 'possession', unit: '%' },
    { label: 'Shots', key: 'shots', unit: '' },
    { label: 'Shots on Target', key: 'shotsOnTarget', unit: '' },
    { label: 'Passes', key: 'passes', unit: '' },
    { label: 'Pass Accuracy', key: 'passAccuracy', unit: '%' },
    { label: 'Tackles', key: 'tackles', unit: '' },
    { label: 'Fouls', key: 'fouls', unit: '' },
  ];

  return (
    <div className="card p-6">
      <h3 className="text-xl font-bold mb-4">📊 Match Statistics</h3>

      <div className="space-y-4">
        {statRows.map((row) => (
          <div key={row.key}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">{row.label}</span>
              <span className="text-gray-400">{row.label}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold min-w-12 text-right">
                {stats.homeTeam[row.key as keyof typeof stats.homeTeam]}{row.unit}
              </span>
              <div className="flex-1 h-6 bg-gray-700 rounded overflow-hidden flex">
                <div
                  className="bg-red-500 transition-all"
                  style={{
                    width: `${(stats.homeTeam[row.key as keyof typeof stats.homeTeam] as number) / 2}%`,
                  }}
                />
                <div
                  className="bg-blue-500 transition-all ml-auto"
                  style={{
                    width: `${(stats.awayTeam[row.key as keyof typeof stats.awayTeam] as number) / 2}%`,
                  }}
                />
              </div>
              <span className="text-sm font-bold min-w-12">
                {stats.awayTeam[row.key as keyof typeof stats.awayTeam]}{row.unit}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Player Performance Card
interface PlayerPerfProps {
  playerName: string;
  position: string;
  rating: number;
  goals: number;
  assists: number;
  passes: number;
  passAccuracy: number;
}

export function PlayerPerformanceCard({
  playerName,
  position,
  rating,
  goals,
  assists,
  passes,
  passAccuracy,
}: PlayerPerfProps) {
  return (
    <div className="card p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-bold">{playerName}</h4>
          <p className="text-sm text-gray-400">{position}</p>
        </div>
        <div className="text-2xl font-bold text-yellow-500">{rating.toFixed(1)}</div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-gray-800 p-2 rounded">
          <p className="text-gray-400">Goals</p>
          <p className="font-bold">{goals}</p>
        </div>
        <div className="bg-gray-800 p-2 rounded">
          <p className="text-gray-400">Assists</p>
          <p className="font-bold">{assists}</p>
        </div>
        <div className="bg-gray-800 p-2 rounded col-span-2">
          <p className="text-gray-400">Passes: {passes} ({passAccuracy}%)</p>
        </div>
      </div>
    </div>
  );
}
