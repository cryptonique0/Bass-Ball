'use client';

import React, { useState } from 'react';

interface PlayerStats {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defense: number;
  physical: number;
}

interface PlayerDevelopmentProps {
  playerName: string;
  position: string;
  currentStats: PlayerStats;
  onTrainStat: (stat: keyof PlayerStats) => void;
}

export function PlayerDevelopmentCard({ playerName, position, currentStats, onTrainStat }: PlayerDevelopmentProps) {
  const [selectedStat, setSelectedStat] = useState<keyof PlayerStats>('shooting');
  const stats = Object.keys(currentStats) as Array<keyof PlayerStats>;

  const statDescriptions: Record<keyof PlayerStats, { icon: string; label: string; description: string }> = {
    pace: {
      icon: '⚡',
      label: 'Pace',
      description: 'Sprint speed and acceleration',
    },
    shooting: {
      icon: '🎯',
      label: 'Shooting',
      description: 'Shooting accuracy and power',
    },
    passing: {
      icon: '➡️',
      label: 'Passing',
      description: 'Pass accuracy and vision',
    },
    dribbling: {
      icon: '🎾',
      label: 'Dribbling',
      description: 'Ball control and agility',
    },
    defense: {
      icon: '🛡️',
      label: 'Defense',
      description: 'Defensive prowess',
    },
    physical: {
      icon: '💪',
      label: 'Physical',
      description: 'Strength and stamina',
    },
  };

  const getStatColor = (value: number): string => {
    if (value >= 85) return 'bg-green-600';
    if (value >= 75) return 'bg-blue-600';
    if (value >= 65) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  return (
    <div className="card p-6">
      <div className="mb-4">
        <h3 className="text-xl font-bold">{playerName}</h3>
        <p className="text-sm text-gray-400">{position}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {stats.map((stat) => (
          <div key={stat} className="bg-gray-800 p-3 rounded">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold">
                {statDescriptions[stat].icon} {statDescriptions[stat].label}
              </span>
              <span className={`font-bold px-2 py-1 rounded text-sm text-white ${getStatColor(currentStats[stat])}`}>
                {currentStats[stat]}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded h-2">
              <div
                className={`h-full rounded transition-all ${getStatColor(currentStats[stat])}`}
                style={{ width: `${(currentStats[stat] / 99) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Overall Rating */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 p-4 rounded mb-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold">Overall Rating</span>
          <span className="text-3xl font-bold">
            {Math.round(
              (stats.reduce((sum, stat) => sum + currentStats[stat], 0) / stats.length)
            )}
          </span>
        </div>
      </div>

      {/* Training Available */}
      <div className="border-t border-gray-700 pt-4">
        <p className="text-sm font-bold mb-3">Available Training</p>
        <p className="text-xs text-gray-400 mb-3">Focus on developing key attributes</p>

        <div className="grid grid-cols-2 gap-2">
          {stats.map((stat) => (
            <button
              key={stat}
              onClick={() => {
                setSelectedStat(stat);
                onTrainStat(stat);
              }}
              className="btn btn-secondary text-xs py-2"
            >
              {statDescriptions[stat].icon} Train {statDescriptions[stat].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Training Session Component
interface TrainingSessionProps {
  playerName: string;
  trainingType: string;
  duration: number; // in minutes
  effectiveness: number; // 0-100
  onComplete: () => void;
}

export function TrainingSessionDisplay({
  playerName,
  trainingType,
  duration,
  effectiveness,
  onComplete,
}: TrainingSessionProps) {
  const [sessionProgress, setSessionProgress] = useState(0);

  React.useEffect(() => {
    if (sessionProgress >= 100) return;

    const timer = setInterval(() => {
      setSessionProgress((prev) => Math.min(prev + 5, 100));
    }, 500);

    return () => clearInterval(timer);
  }, [sessionProgress]);

  const trainingIcons: Record<string, string> = {
    'Shooting Training': '🎯',
    'Passing Drills': '➡️',
    'Dribbling': '🎾',
    'Defensive Training': '🛡️',
    'Physical Training': '💪',
    'Speed Work': '⚡',
  };

  return (
    <div className="card p-6 border-2 border-blue-500">
      <h3 className="text-xl font-bold mb-4">
        {trainingIcons[trainingType] || '🏋️'} {trainingType}
      </h3>

      <div className="space-y-4">
        {/* Player Name */}
        <div>
          <p className="text-sm text-gray-400">Player</p>
          <p className="text-lg font-bold">{playerName}</p>
        </div>

        {/* Session Progress */}
        <div>
          <p className="text-sm text-gray-400 mb-2">Session Progress</p>
          <div className="w-full bg-gray-800 rounded-lg h-6 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center transition-all"
              style={{ width: `${sessionProgress}%` }}
            >
              {sessionProgress > 20 && <span className="text-xs font-bold">{sessionProgress}%</span>}
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {duration * (sessionProgress / 100)} / {duration} minutes
          </p>
        </div>

        {/* Effectiveness */}
        <div className="bg-gray-800 p-3 rounded">
          <p className="text-xs text-gray-400">Effectiveness</p>
          <div className="flex items-center gap-3 mt-1">
            <div className="w-full bg-gray-700 rounded h-3">
              <div
                className="h-full bg-green-500 rounded transition-all"
                style={{ width: `${effectiveness}%` }}
              ></div>
            </div>
            <span className="font-bold text-green-500">{effectiveness}%</span>
          </div>
        </div>

        {/* Training Stats */}
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="bg-gray-800 p-2 rounded">
            <p className="text-gray-400 text-xs">Stat Gain</p>
            <p className="font-bold text-green-500">+{Math.round(effectiveness * 0.05)}</p>
          </div>
          <div className="bg-gray-800 p-2 rounded">
            <p className="text-gray-400 text-xs">Recovery</p>
            <p className="font-bold">{Math.round(100 - effectiveness / 2)}%</p>
          </div>
          <div className="bg-gray-800 p-2 rounded">
            <p className="text-gray-400 text-xs">Morale</p>
            <p className="font-bold text-blue-500">+{Math.round(effectiveness * 0.02)}</p>
          </div>
        </div>

        {/* Status */}
        <div className="text-center">
          {sessionProgress < 100 ? (
            <p className="text-sm text-yellow-500 animate-pulse">Training in progress...</p>
          ) : (
            <button onClick={onComplete} className="btn btn-primary w-full">
              ✓ Training Complete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Squad Training Overview
interface SquadTrainingProps {
  players: Array<{ name: string; position: string; stamina: number }>;
  onSelectPlayerTraining: (playerName: string) => void;
}

export function SquadTrainingOverview({ players, onSelectPlayerTraining }: SquadTrainingProps) {
  const trainingTypes = [
    'Shooting Training',
    'Passing Drills',
    'Dribbling',
    'Defensive Training',
    'Physical Training',
    'Speed Work',
  ];

  return (
    <div className="card p-6">
      <h3 className="text-xl font-bold mb-4">🏋️ Squad Training</h3>

      {/* Squad Status */}
      <div className="mb-6">
        <p className="text-sm text-gray-400 mb-2">Squad Status</p>
        <div className="space-y-2">
          {players.map((player) => (
            <div key={player.name} className="flex items-center justify-between bg-gray-800 p-2 rounded">
              <div>
                <p className="text-sm font-bold">{player.name}</p>
                <p className="text-xs text-gray-400">{player.position}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-16 bg-gray-700 rounded h-2">
                  <div
                    className={`h-full rounded transition-all ${
                      player.stamina > 75
                        ? 'bg-green-500'
                        : player.stamina > 50
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${player.stamina}%` }}
                  ></div>
                </div>
                <span className="text-xs font-bold w-8 text-right">{player.stamina}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Training Selection */}
      <div className="border-t border-gray-700 pt-4">
        <p className="text-sm font-bold mb-3">Start Training Session</p>
        <p className="text-xs text-gray-400 mb-3">Select a training type to improve squad attributes</p>
        <div className="grid grid-cols-1 gap-2">
          {trainingTypes.map((type) => (
            <button
              key={type}
              onClick={() => onSelectPlayerTraining(type)}
              className="btn btn-secondary text-sm py-3 text-left flex items-center justify-between"
            >
              <span>{type}</span>
              <span className="text-xs text-gray-400">30 min</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
