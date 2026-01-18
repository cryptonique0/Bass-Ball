'use client';

import React, { useState } from 'react';
import LiveMatch from '@/components/LiveMatch';
import { TeamSelector } from '@/components/TeamSelector';
import { applyFormation, FormationType } from '@/lib/formations';
import { Team } from '@/lib/gameEngine';

// Sample teams for testing
const SAMPLE_TEAMS = {
  HOME: {
    id: 'home-1',
    name: 'Home United',
    formation: '4-3-3',
    score: 0,
    possession: 0,
    players: [
      {
        id: 'home-gk',
        name: 'Goalkeeper',
        position: 'GK' as const,
        pace: 70,
        shooting: 30,
        passing: 60,
        dribbling: 40,
        defense: 50,
        physical: 80,
        x: 50,
        y: 340,
        vx: 0,
        vy: 0,
        stamina: 100,
        selected: false,
      },
      {
        id: 'home-def1',
        name: 'Defender 1',
        position: 'DEF' as const,
        pace: 75,
        shooting: 40,
        passing: 70,
        dribbling: 50,
        defense: 85,
        physical: 82,
        x: 200,
        y: 170,
        vx: 0,
        vy: 0,
        stamina: 100,
        selected: false,
      },
      {
        id: 'home-def2',
        name: 'Defender 2',
        position: 'DEF' as const,
        pace: 76,
        shooting: 38,
        passing: 72,
        dribbling: 48,
        defense: 87,
        physical: 84,
        x: 200,
        y: 340,
        vx: 0,
        vy: 0,
        stamina: 100,
        selected: false,
      },
      {
        id: 'home-def3',
        name: 'Defender 3',
        position: 'DEF' as const,
        pace: 74,
        shooting: 42,
        passing: 68,
        dribbling: 52,
        defense: 84,
        physical: 80,
        x: 200,
        y: 510,
        vx: 0,
        vy: 0,
        stamina: 100,
        selected: false,
      },
      {
        id: 'home-mid1',
        name: 'Midfielder 1',
        position: 'MID' as const,
        pace: 80,
        shooting: 65,
        passing: 82,
        dribbling: 75,
        defense: 70,
        physical: 78,
        x: 400,
        y: 200,
        vx: 0,
        vy: 0,
        stamina: 100,
        selected: false,
      },
      {
        id: 'home-mid2',
        name: 'Midfielder 2',
        position: 'MID' as const,
        pace: 82,
        shooting: 68,
        passing: 85,
        dribbling: 78,
        defense: 72,
        physical: 80,
        x: 400,
        y: 340,
        vx: 0,
        vy: 0,
        stamina: 100,
        selected: false,
      },
      {
        id: 'home-mid3',
        name: 'Midfielder 3',
        position: 'MID' as const,
        pace: 79,
        shooting: 64,
        passing: 80,
        dribbling: 76,
        defense: 68,
        physical: 76,
        x: 400,
        y: 480,
        vx: 0,
        vy: 0,
        stamina: 100,
        selected: false,
      },
      {
        id: 'home-fwd1',
        name: 'Striker 1',
        position: 'FWD' as const,
        pace: 88,
        shooting: 88,
        passing: 75,
        dribbling: 85,
        defense: 45,
        physical: 82,
        x: 650,
        y: 250,
        vx: 0,
        vy: 0,
        stamina: 100,
        selected: false,
      },
      {
        id: 'home-fwd2',
        name: 'Striker 2',
        position: 'FWD' as const,
        pace: 86,
        shooting: 86,
        passing: 73,
        dribbling: 83,
        defense: 43,
        physical: 80,
        x: 650,
        y: 430,
        vx: 0,
        vy: 0,
        stamina: 100,
        selected: false,
      },
      {
        id: 'home-fwd3',
        name: 'Winger',
        position: 'FWD' as const,
        pace: 90,
        shooting: 80,
        passing: 78,
        dribbling: 87,
        defense: 50,
        physical: 78,
        x: 600,
        y: 340,
        vx: 0,
        vy: 0,
        stamina: 100,
        selected: false,
      },
    ],
  },
  AWAY: {
    id: 'away-1',
    name: 'Away City',
    formation: '4-2-3-1',
    score: 0,
    possession: 0,
    players: [
      {
        id: 'away-gk',
        name: 'Goalkeeper',
        position: 'GK' as const,
        pace: 72,
        shooting: 28,
        passing: 62,
        dribbling: 38,
        defense: 52,
        physical: 82,
        x: 1000,
        y: 340,
        vx: 0,
        vy: 0,
        stamina: 100,
        selected: false,
      },
      {
        id: 'away-def1',
        name: 'Defender 1',
        position: 'DEF' as const,
        pace: 77,
        shooting: 39,
        passing: 71,
        dribbling: 49,
        defense: 86,
        physical: 83,
        x: 850,
        y: 170,
        vx: 0,
        vy: 0,
        stamina: 100,
        selected: false,
      },
      {
        id: 'away-def2',
        name: 'Defender 2',
        position: 'DEF' as const,
        pace: 75,
        shooting: 41,
        passing: 69,
        dribbling: 51,
        defense: 85,
        physical: 81,
        x: 850,
        y: 340,
        vx: 0,
        vy: 0,
        stamina: 100,
        selected: false,
      },
      {
        id: 'away-def3',
        name: 'Defender 3',
        position: 'DEF' as const,
        pace: 76,
        shooting: 40,
        passing: 70,
        dribbling: 50,
        defense: 87,
        physical: 82,
        x: 850,
        y: 510,
        vx: 0,
        vy: 0,
        stamina: 100,
        selected: false,
      },
      {
        id: 'away-mid1',
        name: 'Defensive Mid',
        position: 'MID' as const,
        pace: 78,
        shooting: 62,
        passing: 80,
        dribbling: 72,
        defense: 78,
        physical: 82,
        x: 650,
        y: 270,
        vx: 0,
        vy: 0,
        stamina: 100,
        selected: false,
      },
      {
        id: 'away-mid2',
        name: 'Defensive Mid',
        position: 'MID' as const,
        pace: 79,
        shooting: 63,
        passing: 81,
        dribbling: 73,
        defense: 79,
        physical: 83,
        x: 650,
        y: 410,
        vx: 0,
        vy: 0,
        stamina: 100,
        selected: false,
      },
      {
        id: 'away-mid3',
        name: 'Attacking Mid',
        position: 'MID' as const,
        pace: 84,
        shooting: 75,
        passing: 84,
        dribbling: 80,
        defense: 60,
        physical: 76,
        x: 550,
        y: 340,
        vx: 0,
        vy: 0,
        stamina: 100,
        selected: false,
      },
      {
        id: 'away-fwd1',
        name: 'Striker',
        position: 'FWD' as const,
        pace: 87,
        shooting: 87,
        passing: 74,
        dribbling: 84,
        defense: 44,
        physical: 81,
        x: 400,
        y: 340,
        vx: 0,
        vy: 0,
        stamina: 100,
        selected: false,
      },
      {
        id: 'away-fwd2',
        name: 'Winger',
        position: 'FWD' as const,
        pace: 89,
        shooting: 81,
        passing: 77,
        dribbling: 86,
        defense: 49,
        physical: 77,
        x: 450,
        y: 200,
        vx: 0,
        vy: 0,
        stamina: 100,
        selected: false,
      },
      {
        id: 'away-fwd3',
        name: 'Winger',
        position: 'FWD' as const,
        pace: 88,
        shooting: 80,
        passing: 76,
        dribbling: 85,
        defense: 48,
        physical: 76,
        x: 450,
        y: 480,
        vx: 0,
        vy: 0,
        stamina: 100,
        selected: false,
      },
    ],
  },
};

export default function MatchPage() {
  const [pageState, setPageState] = useState<'menu' | 'formation-home' | 'formation-away' | 'playing'>('menu');
  const [selectedMode, setSelectedMode] = useState<'ai' | 'pvp'>('ai');
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
  const [homeTeam, setHomeTeam] = useState<Team>(SAMPLE_TEAMS.HOME as Team);
  const [awayTeam, setAwayTeam] = useState<Team>(SAMPLE_TEAMS.AWAY as Team);

  const handleStartMatch = (mode: 'ai' | 'pvp') => {
    setSelectedMode(mode);
    setPageState('formation-home');
  };

  const handleFormationSelect = (formation: FormationType, team: 'home' | 'away') => {
    if (team === 'home') {
      const updatedHome = {
        ...homeTeam,
        players: applyFormation(homeTeam.players, formation, true),
        formation,
      };
      setHomeTeam(updatedHome);
      setPageState('formation-away');
    } else {
      const updatedAway = {
        ...awayTeam,
        players: applyFormation(awayTeam.players, formation, false),
        formation,
      };
      setAwayTeam(updatedAway);
      setPageState('playing');
    }
  };

  const handleBackToMenu = () => {
    setPageState('menu');
  };

  // Formation selection for home team
  if (pageState === 'formation-home') {
    return (
      <TeamSelector
        teams={{ home: homeTeam, away: awayTeam }}
        onSelect={handleFormationSelect}
        onCancel={handleBackToMenu}
      />
    );
  }

  // Formation selection for away team (only for PvP)
  if (pageState === 'formation-away' && selectedMode === 'pvp') {
    return (
      <TeamSelector
        teams={{ home: homeTeam, away: awayTeam }}
        onSelect={handleFormationSelect}
        onCancel={handleBackToMenu}
      />
    );
  }

  // Playing the match
  if (pageState === 'playing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={handleBackToMenu}
            className="mb-6 btn btn-secondary"
          >
            ← Back to Menu
          </button>

          <LiveMatch
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            mode={selectedMode}
            difficulty={difficulty}
          />
        </div>
      </div>
    );
  }

  // Menu screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-black mb-4">⚽ Match Center</h1>
          <p className="text-gray-400 text-lg">Play Player vs AI or Player vs Player with Custom Formations</p>
        </div>

        {/* Match Mode Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Player vs AI */}
          <div className="card p-8 border-2 border-blue-600 hover:border-blue-400 transition-colors cursor-pointer">
            <h2 className="text-2xl font-bold mb-4">🤖 Player vs AI</h2>
            <p className="text-gray-400 mb-6">
              Test your skills against an intelligent opponent. The AI will adapt to your tactics.
            </p>

            <div className="space-y-4 mb-8">
              <div>
                <h3 className="font-bold mb-3">Difficulty</h3>
                <div className="grid grid-cols-3 gap-2">
                  {(['easy', 'normal', 'hard'] as const).map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setDifficulty(diff)}
                      className={`py-2 px-3 rounded text-sm font-bold transition-colors ${
                        difficulty === diff
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {diff === 'easy'
                        ? '⭐ Easy'
                        : diff === 'normal'
                        ? '⭐⭐ Normal'
                        : '⭐⭐⭐ Hard'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-gray-800 p-4 rounded">
                <h3 className="font-bold mb-2">Features:</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>✓ AI opponent that learns</li>
                  <li>✓ Dynamic difficulty</li>
                  <li>✓ Match statistics tracking</li>
                  <li>✓ Full 90-minute match</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => handleStartMatch('ai')}
              className="w-full btn btn-primary text-lg font-bold py-3"
            >
              🎮 Start Match vs AI
            </button>
          </div>

          {/* Player vs Player */}
          <div className="card p-8 border-2 border-purple-600 hover:border-purple-400 transition-colors cursor-pointer">
            <h2 className="text-2xl font-bold mb-4">👥 Player vs Player</h2>
            <p className="text-gray-400 mb-6">
              Compete against another player in real-time. Perfect for local multiplayer or pass-and-play matches.
            </p>

            <div className="space-y-4 mb-8">
              <div className="bg-gray-800 p-4 rounded">
                <h3 className="font-bold mb-2">How to Play:</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>1. Click a player to select them</li>
                  <li>2. Click on the pitch to pass or shoot</li>
                  <li>3. Use tactics to control possession</li>
                  <li>4. Score more goals than your opponent</li>
                </ul>
              </div>

              <div className="bg-gray-800 p-4 rounded">
                <h3 className="font-bold mb-2">Features:</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>✓ Two-player gameplay</li>
                  <li>✓ Full manual control</li>
                  <li>✓ Tactical depth</li>
                  <li>✓ Real match mechanics</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => handleStartMatch('pvp')}
              className="w-full btn btn-primary text-lg font-bold py-3"
            >
              👥 Start PvP Match
            </button>
          </div>
        </div>

        {/* Match Mechanics Info */}
        <div className="card p-6">
          <h2 className="text-2xl font-bold mb-4">⚙️ Match Mechanics</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-green-400 mb-2">✓ Goals & Shooting</h3>
              <p className="text-sm text-gray-300">
                Calculate shot success based on player stats, distance from goal, and RNG. Goals awarded when ball crosses goal line.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-yellow-400 mb-2">🟨 Fouls & Cards</h3>
              <p className="text-sm text-gray-300">
                Defenders risk committing fouls when challenging for the ball. Yellow cards lead to red cards. Players sent off early.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-blue-400 mb-2">💪 Stamina System</h3>
              <p className="text-sm text-gray-300">
                Player stamina depletes during match. Low stamina reduces pace, defense, and dribbling abilities.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-purple-400 mb-2">🔄 Possession</h3>
              <p className="text-sm text-gray-300">
                Possession tracked per team and shown as percentage. Ball automatically moves to closest player with possession effects.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-red-400 mb-2">⚡ Physics & RNG</h3>
              <p className="text-sm text-gray-300">
                Simple physics simulation with friction, gravity, and boundary collision. RNG used for shot accuracy and event probability.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-cyan-400 mb-2">🤖 AI Intelligence</h3>
              <p className="text-sm text-gray-300">
                AI makes tactical decisions: shoot when near goal, pass for possession, adapt based on match situation.
              </p>
            </div>
          </div>
        </div>

        {/* Team Info */}
        <div className="mt-8 card p-6">
          <h2 className="text-2xl font-bold mb-4">⚽ Teams</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Home Team */}
            <div>
              <h3 className="font-bold text-lg mb-3 text-red-400">
                🔴 {SAMPLE_TEAMS.HOME.name}
              </h3>
              <div className="space-y-2 text-sm">
                {SAMPLE_TEAMS.HOME.players.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex justify-between text-gray-300">
                    <span>{p.name}</span>
                    <span className="text-gray-400">{p.position}</span>
                  </div>
                ))}
                <p className="text-xs text-gray-500 mt-2">+ 5 more players...</p>
              </div>
            </div>

            {/* Away Team */}
            <div>
              <h3 className="font-bold text-lg mb-3 text-blue-400">
                🔵 {SAMPLE_TEAMS.AWAY.name}
              </h3>
              <div className="space-y-2 text-sm">
                {SAMPLE_TEAMS.AWAY.players.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex justify-between text-gray-300">
                    <span>{p.name}</span>
                    <span className="text-gray-400">{p.position}</span>
                  </div>
                ))}
                <p className="text-xs text-gray-500 mt-2">+ 5 more players...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
