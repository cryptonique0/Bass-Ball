'use client';

import React, { useState } from 'react';

interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'daily' | 'weekly' | 'seasonal';
  progress: number;
  target: number;
  reward: {
    coins: number;
    packs?: number;
    tokens?: number;
  };
  completed: boolean;
  expires: string;
}

interface ChallengesProps {
  challenges: Challenge[];
}

export function ChallengesDisplay({ challenges }: ChallengesProps) {
  const [selectedCategory, setSelectedCategory] = useState<'daily' | 'weekly' | 'seasonal'>('daily');

  const filteredChallenges = challenges.filter((c) => c.category === selectedCategory);
  const completedCount = filteredChallenges.filter((c) => c.completed).length;

  const categories = [
    { id: 'daily', label: 'Daily', icon: '☀️' },
    { id: 'weekly', label: 'Weekly', icon: '📅' },
    { id: 'seasonal', label: 'Seasonal', icon: '🏆' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Challenge Categories */}
      <div className="card p-6">
        <h3 className="text-xl font-bold mb-4">📋 Challenges & Objectives</h3>

        <div className="flex gap-3 mb-6">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex-1 py-3 px-4 rounded font-bold transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* Progress Summary */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-gray-800 p-3 rounded text-center">
            <p className="text-gray-400 text-sm">Active</p>
            <p className="text-2xl font-bold">{filteredChallenges.length}</p>
          </div>
          <div className="bg-gray-800 p-3 rounded text-center">
            <p className="text-gray-400 text-sm">Completed</p>
            <p className="text-2xl font-bold text-green-400">{completedCount}</p>
          </div>
          <div className="bg-gray-800 p-3 rounded text-center">
            <p className="text-gray-400 text-sm">Completion</p>
            <p className="text-2xl font-bold text-blue-400">
              {Math.round((completedCount / filteredChallenges.length) * 100)}%
            </p>
          </div>
        </div>
      </div>

      {/* Challenges List */}
      <div className="space-y-3">
        {filteredChallenges.map((challenge) => (
          <div
            key={challenge.id}
            className={`card p-4 border-l-4 ${
              challenge.completed ? 'border-l-green-500 opacity-75' : 'border-l-blue-500'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="text-lg font-bold flex items-center gap-2">
                  {challenge.icon} {challenge.title}
                  {challenge.completed && <span className="text-sm text-green-500">✓ Complete</span>}
                </h4>
                <p className="text-sm text-gray-400 mt-1">{challenge.description}</p>
              </div>
              <span className="text-xs bg-gray-800 px-2 py-1 rounded whitespace-nowrap">
                {challenge.expires}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold">
                  {challenge.progress} / {challenge.target}
                </span>
                <span className="text-xs text-gray-400">
                  {Math.round((challenge.progress / challenge.target) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-3">
                <div
                  className={`h-full rounded-full transition-all ${
                    challenge.completed ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min((challenge.progress / challenge.target) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Rewards */}
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="bg-gray-800 p-2 rounded text-center">
                <p className="text-yellow-400 font-bold">{challenge.reward.coins.toLocaleString()}</p>
                <p className="text-xs text-gray-400">Coins</p>
              </div>
              {challenge.reward.packs && (
                <div className="bg-gray-800 p-2 rounded text-center">
                  <p className="text-blue-400 font-bold">{challenge.reward.packs}</p>
                  <p className="text-xs text-gray-400">Packs</p>
                </div>
              )}
              {challenge.reward.tokens && (
                <div className="bg-gray-800 p-2 rounded text-center">
                  <p className="text-purple-400 font-bold">{challenge.reward.tokens}</p>
                  <p className="text-xs text-gray-400">Tokens</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Rewards Summary */}
      <div className="card p-6 bg-gradient-to-r from-purple-900 to-blue-900">
        <h4 className="text-lg font-bold mb-3">🎁 Available Rewards</h4>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-yellow-400 text-2xl font-bold">
              {filteredChallenges
                .filter((c) => c.completed)
                .reduce((sum, c) => sum + c.reward.coins, 0)
                .toLocaleString()}
            </p>
            <p className="text-sm text-gray-300">Coins Available</p>
          </div>
          <div className="text-center">
            <p className="text-blue-400 text-2xl font-bold">
              {filteredChallenges
                .filter((c) => c.completed && c.reward.packs)
                .reduce((sum, c) => sum + (c.reward.packs || 0), 0)}
            </p>
            <p className="text-sm text-gray-300">Packs Available</p>
          </div>
          <div className="text-center">
            <p className="text-green-400 text-2xl font-bold">
              {completedCount}/{filteredChallenges.length}
            </p>
            <p className="text-sm text-gray-300">Challenges Done</p>
          </div>
        </div>

        <button className="w-full btn btn-primary mt-4">Claim All Rewards</button>
      </div>
    </div>
  );
}

// Event Calendar Component
interface CalendarEvent {
  date: string;
  title: string;
  description: string;
  type: 'tournament' | 'special' | 'event' | 'reward';
  icon: string;
}

export function EventCalendar({ events }: { events: CalendarEvent[] }) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = 0; // January

  return (
    <div className="card p-6">
      <h3 className="text-xl font-bold mb-4">📅 Event Calendar</h3>

      {/* Month */}
      <div className="mb-6 text-center">
        <p className="text-2xl font-bold">{months[currentMonth]} 2024</p>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-xs font-bold text-gray-400 py-2">
            {day}
          </div>
        ))}

        {Array.from({ length: 31 }).map((_, i) => {
          const day = i + 1;
          const eventForDay = events.find((e) => e.date === `${day}`);

          return (
            <div
              key={day}
              className={`aspect-square flex items-center justify-center rounded border-2 text-sm font-bold cursor-pointer transition-colors ${
                eventForDay
                  ? 'border-blue-500 bg-blue-900 bg-opacity-30 hover:bg-opacity-50'
                  : 'border-gray-700 bg-gray-800 hover:border-gray-600'
              }`}
              title={eventForDay?.title}
            >
              {eventForDay ? eventForDay.icon : day}
            </div>
          );
        })}
      </div>

      {/* Upcoming Events */}
      <div className="border-t border-gray-700 pt-4">
        <h4 className="font-bold mb-3">Upcoming Events</h4>
        <div className="space-y-2">
          {events.slice(0, 5).map((event, idx) => (
            <div key={idx} className="flex items-start gap-3 p-2 bg-gray-800 rounded">
              <span className="text-xl">{event.icon}</span>
              <div className="flex-1">
                <p className="font-bold text-sm">{event.title}</p>
                <p className="text-xs text-gray-400">{event.description}</p>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap">Day {event.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Battle Pass / Progression System
export function BattlePassProgression() {
  const currentLevel = 42;
  const currentXP = 7650;
  const nextLevelXP = 10000;
  const totalLevels = 100;

  const rewards = [
    { level: 40, icon: '🎮', name: 'Pro Card Pack', type: 'free' },
    { level: 41, icon: '💰', name: '5,000 Coins', type: 'premium' },
    { level: 42, icon: '⭐', name: 'Silver Players', type: 'free' },
    { level: 43, icon: '🏆', name: 'Tournament Ticket', type: 'premium' },
    { level: 44, icon: '🎫', name: 'Elite Pack', type: 'premium' },
  ];

  return (
    <div className="card p-6">
      <h3 className="text-xl font-bold mb-4">🎯 Battle Pass</h3>

      {/* Level Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm text-gray-400">Level</p>
            <p className="text-3xl font-bold">{currentLevel}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Progress to Next</p>
            <p className="text-xl font-bold text-blue-400">
              {currentXP.toLocaleString()} / {nextLevelXP.toLocaleString()} XP
            </p>
          </div>
        </div>

        <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
            style={{ width: `${(currentXP / nextLevelXP) * 100}%` }}
          ></div>
        </div>

        <p className="text-xs text-gray-400 mt-2">
          {totalLevels - currentLevel} levels remaining
        </p>
      </div>

      {/* Upcoming Rewards */}
      <div>
        <h4 className="font-bold mb-3">Next Rewards</h4>
        <div className="space-y-2">
          {rewards.map((reward) => (
            <div
              key={reward.level}
              className={`flex items-center gap-3 p-3 rounded ${
                reward.level <= currentLevel
                  ? 'bg-green-900 bg-opacity-30 opacity-60'
                  : 'bg-gray-800 border-2 border-gray-700'
              }`}
            >
              <span className="text-2xl">{reward.icon}</span>
              <div className="flex-1">
                <p className="font-bold text-sm">{reward.name}</p>
                <p className="text-xs text-gray-400">Level {reward.level}</p>
              </div>
              <span
                className={`text-xs font-bold px-2 py-1 rounded ${
                  reward.type === 'premium'
                    ? 'bg-purple-600 text-purple-200'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                {reward.type === 'premium' ? 'Premium' : 'Free'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
