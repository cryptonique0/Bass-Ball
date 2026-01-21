'use client';

import React, { useState } from 'react';
import { TacticsEditor, WeatherDisplay, TacticsPresets } from '@/components/Tactics';
import { PlayerDevelopmentCard, SquadTrainingOverview } from '@/components/PlayerDevelopment';
import { OnlineDivisionsLeaderboard, OnlineMatchmaking, SeasonRewardsPreview } from '@/components/OnlineDivisions';
import { StadiumManagement, StadiumSelection } from '@/components/StadiumManagement';
import { ScoutReport, TransferMarket, YouthAcademy } from '@/components/TransferMarket';
import { ChallengesDisplay, EventCalendar, BattlePassProgression } from '@/components/ChallengesAndEvents';

export default function KonamiFeaturesPage() {
  const [activeTab, setActiveTab] = useState('home');
  const [isMatchSearching, setIsMatchSearching] = useState(false);

  // Mock data
  const mockTactics = {
    defensiveStyle: 'balanced' as const,
    buildUpPlay: 'balanced' as const,
    pressureMode: 'medium' as const,
    width: 6,
    depth: 5,
  };

  const mockWeather = {
    type: 'clear' as const,
    intensity: 0.3,
    windSpeed: 5,
    temperature: 22,
    affectsBallControl: false,
    affectsPassing: false,
    affectsShot: false,
  };

  const mockPlayers = [
    {
      name: 'John Striker',
      position: 'ST',
      stamina: 85,
      stats: { pace: 92, shooting: 88, passing: 75, dribbling: 85, defense: 45, physical: 82 },
    },
    {
      name: 'Mike Defender',
      position: 'CB',
      stamina: 78,
      stats: { pace: 78, shooting: 45, passing: 70, dribbling: 60, defense: 89, physical: 87 },
    },
    {
      name: 'David Midfield',
      position: 'CM',
      stamina: 92,
      stats: { pace: 82, shooting: 75, passing: 88, dribbling: 82, defense: 75, physical: 80 },
    },
  ];

  const mockScoutedPlayers = [
    {
      id: '1',
      name: 'Carlos Ronaldo',
      age: 22,
      position: 'RW',
      nationality: 'Portuguese',
      club: 'Real Madrid',
      overall: 87,
      potential: 92,
      wage: 8500,
      contract: 2,
      stats: {
        pace: 89,
        shooting: 85,
        passing: 78,
        dribbling: 88,
        defense: 48,
        physical: 81,
      },
      traits: ['Speedster', 'Finesse Shot'],
    },
    {
      id: '2',
      name: 'Luis Mendy',
      age: 19,
      position: 'LB',
      nationality: 'French',
      club: 'Monaco',
      overall: 78,
      potential: 89,
      wage: 4200,
      contract: 3,
      stats: {
        pace: 87,
        shooting: 52,
        passing: 75,
        dribbling: 76,
        defense: 80,
        physical: 84,
      },
      traits: ['Explosive', 'Crosses'],
    },
  ];

  const mockChallenges = [
    {
      id: '1',
      title: 'Goal Scorer',
      description: 'Score 5 goals in any match',
      icon: '⚽',
      category: 'daily' as const,
      progress: 3,
      target: 5,
      reward: { coins: 5000, packs: 1 },
      completed: false,
      expires: '23:45:30',
    },
    {
      id: '2',
      title: 'Clean Sheet',
      description: 'Win a match without conceding',
      icon: '🛡️',
      category: 'daily' as const,
      progress: 1,
      target: 1,
      reward: { coins: 3000 },
      completed: true,
      expires: '23:45:30',
    },
  ];

  const mockEvents = [
    { date: '5', title: 'Lightning Cup', description: 'Tournament starts', type: 'tournament' as const, icon: '⚡' },
    { date: '12', title: 'TOTY Release', description: 'Team of the Year cards', type: 'event' as const, icon: '⭐' },
    { date: '20', title: 'Reward Reset', description: 'Weekly rewards', type: 'reward' as const, icon: '🎁' },
  ];

  const tabs = [
    { id: 'home', label: '🏠 Home', icon: '🏠' },
    { id: 'tactics', label: '🎯 Tactics', icon: '🎯' },
    { id: 'training', label: '🏋️ Training', icon: '🏋️' },
    { id: 'online', label: '🎮 Online', icon: '🎮' },
    { id: 'stadium', label: '🏟️ Stadium', icon: '🏟️' },
    { id: 'market', label: '🏪 Market', icon: '🏪' },
    { id: 'challenges', label: '📋 Challenges', icon: '📋' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black mb-2">⚽ Bass Ball - Konami Features</h1>
        <p className="text-gray-400">Complete football management and online competition</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 rounded-lg font-bold whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-8">
        {/* HOME TAB */}
        {activeTab === 'home' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: '🏆', title: 'Division', value: 'Professional II', color: 'from-yellow-600' },
                { icon: '⭐', title: 'Overall Team Rating', value: '85', color: 'from-blue-600' },
                { icon: '💰', title: 'Budget', value: '500K', color: 'from-green-600' },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className={`card p-6 bg-gradient-to-br ${stat.color} to-gray-900`}
                >
                  <p className="text-gray-300 text-sm">{stat.icon} {stat.title}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <OnlineMatchmaking
                onFindMatch={() => setIsMatchSearching(!isMatchSearching)}
                isSearching={isMatchSearching}
                estimatedWaitTime={45}
              />
              <SeasonRewardsPreview />
            </div>

            <BattlePassProgression />
          </>
        )}

        {/* TACTICS TAB */}
        {activeTab === 'tactics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TacticsEditor tactics={mockTactics} onUpdate={() => {}} />
            <div>
              <WeatherDisplay weather={mockWeather} />
              <div className="mt-6">
                <TacticsPresets onSelectTactics={() => {}} />
              </div>
            </div>
          </div>
        )}

        {/* TRAINING TAB */}
        {activeTab === 'training' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SquadTrainingOverview
              players={mockPlayers}
              onSelectPlayerTraining={() => {}}
            />
            <div className="space-y-6">
              {mockPlayers.slice(0, 2).map((player) => (
                <PlayerDevelopmentCard
                  key={player.name}
                  playerName={player.name}
                  position={player.position}
                  currentStats={player.stats}
                  onTrainStat={() => {}}
                />
              ))}
            </div>
          </div>
        )}

        {/* ONLINE TAB */}
        {activeTab === 'online' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <OnlineDivisionsLeaderboard
              currentPlayer={{
                name: 'Your Username',
                division: 'Professional II',
                points: 2450,
                rank: 342,
              }}
              rankings={[
                {
                  rank: 1,
                  name: 'ProPlayer123',
                  division: 'Professional',
                  points: 3200,
                  wins: 156,
                  draws: 23,
                  losses: 21,
                  goalsFor: 542,
                  goalsAgainst: 198,
                  winRate: 85,
                },
                {
                  rank: 2,
                  name: 'SkillMaster',
                  division: 'Professional',
                  points: 3050,
                  wins: 148,
                  draws: 28,
                  losses: 24,
                  goalsFor: 501,
                  goalsAgainst: 215,
                  winRate: 82,
                },
              ]}
            />
            <div className="space-y-6">
              <OnlineMatchmaking
                onFindMatch={() => setIsMatchSearching(!isMatchSearching)}
                isSearching={isMatchSearching}
                estimatedWaitTime={32}
              />
            </div>
          </div>
        )}

        {/* STADIUM TAB */}
        {activeTab === 'stadium' && (
          <>
            <StadiumManagement
              name="Metropolitan Arena"
              capacity={65000}
              maxCapacity={80000}
              atmosphere={78}
              fame={85}
              facilities={3}
            />
          </>
        )}

        {/* MARKET TAB */}
        {activeTab === 'market' && (
          <div className="space-y-6">
            <ScoutReport
              players={mockScoutedPlayers}
              onMakeOffer={() => {}}
              budget={500000}
            />
          </div>
        )}

        {/* CHALLENGES TAB */}
        {activeTab === 'challenges' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ChallengesDisplay challenges={mockChallenges} />
            </div>
            <div>
              <EventCalendar events={mockEvents} />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-16 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
        <p>🏆 Bass Ball • Web3 Football Management on Base Chain</p>
        <p className="mt-2">Connect your wallet to start playing and earn rewards</p>
      </div>
    </div>
  );
}
