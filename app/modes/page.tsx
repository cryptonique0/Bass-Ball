'use client';

import React, { useState } from 'react';

type GameMode = 'quickmatch' | 'myclub' | 'master-league' | 'tournament' | 'online' | 'training';

interface ModeCard {
  id: GameMode;
  title: string;
  description: string;
  icon: string;
  features: string[];
  enabled: boolean;
}

export default function GameModesPage() {
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);

  const modes: ModeCard[] = [
    {
      id: 'quickmatch',
      title: 'Quick Match',
      description: 'Play a single match instantly',
      icon: '⚡',
      features: [
        'Choose team & opponent',
        'Custom difficulty',
        'Multiple stadiums',
        'Dynamic weather',
      ],
      enabled: true,
    },
    {
      id: 'myclub',
      title: 'MyClub',
      description: 'Build your dream team with player cards',
      icon: '🃏',
      features: [
        'Collect player cards',
        'Build squads',
        'Squad battles',
        'Live events',
        'Player contracts',
        'Training system',
      ],
      enabled: true,
    },
    {
      id: 'master-league',
      title: 'Master League',
      description: 'Manage a team through a complete season',
      icon: '🏆',
      features: [
        'Season-long campaign',
        'Team management',
        'Transfer market',
        'Contract negotiations',
        'Stadium upgrades',
        'Youth academy',
        'Sponsorships',
      ],
      enabled: true,
    },
    {
      id: 'tournament',
      title: 'Tournaments',
      description: 'Compete in various tournaments',
      icon: '🥇',
      features: [
        'League tournaments',
        'Cup competitions',
        'Champions League',
        'Knockout stages',
        'Final matches',
        'Prizes & rewards',
      ],
      enabled: true,
    },
    {
      id: 'online',
      title: 'Online Divisions',
      description: 'Play against other players online',
      icon: '🌐',
      features: [
        'Ranked matches',
        'Leaderboards',
        'Seasonal rewards',
        'Cross-platform',
        'Live matchmaking',
        'Chat system',
      ],
      enabled: false, // Coming soon
    },
    {
      id: 'training',
      title: 'Training',
      description: 'Improve your players\' skills',
      icon: '⚽',
      features: [
        'Skill training',
        'Position coaching',
        'Tactical drills',
        'Fitness training',
        'Mental coaching',
        'Match preparation',
      ],
      enabled: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold text-white mb-2">Game Modes</h1>
        <p className="text-gray-400 mb-12">Choose your experience and start playing</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modes.map((mode) => (
            <div
              key={mode.id}
              className={`card p-6 cursor-pointer transition-all ${
                !mode.enabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500'
              }`}
              onClick={() => mode.enabled && setSelectedMode(mode.id)}
            >
              <div className="text-5xl mb-4">{mode.icon}</div>
              <h2 className="text-2xl font-bold mb-2">{mode.title}</h2>
              <p className="text-gray-400 mb-4">{mode.description}</p>

              <div className="space-y-1 mb-6">
                {mode.features.map((feature, idx) => (
                  <div key={idx} className="text-sm text-gray-400 flex items-center">
                    <span className="mr-2">✓</span>
                    {feature}
                  </div>
                ))}
              </div>

              <button
                disabled={!mode.enabled}
                className={`w-full py-2 rounded font-bold ${
                  mode.enabled
                    ? 'btn btn-primary'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {mode.enabled ? 'Play' : 'Coming Soon'}
              </button>
            </div>
          ))}
        </div>

        {selectedMode && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">
                Start {modes.find((m) => m.id === selectedMode)?.title}?
              </h2>
              <p className="text-gray-400 mb-6">
                Choose your difficulty level and click Start
              </p>

              <div className="space-y-2 mb-6">
                {['Amateur', 'Professional', 'Legendary'].map((level) => (
                  <button key={level} className="w-full btn btn-secondary text-left">
                    {level}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  className="flex-1 btn btn-secondary"
                  onClick={() => setSelectedMode(null)}
                >
                  Cancel
                </button>
                <button className="flex-1 btn btn-primary">Start Game</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
