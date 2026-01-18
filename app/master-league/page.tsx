'use client';

import React, { useState } from 'react';

interface SeasonMatch {
  id: string;
  week: number;
  homeTeam: string;
  awayTeam: string;
  date: string;
  played: boolean;
  result?: { home: number; away: number };
}

export default function MasterLeaguePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'fixtures' | 'standings' | 'transfers' | 'stadium'>('overview');

  const matches: SeasonMatch[] = [
    { id: '1', week: 1, homeTeam: 'Your Team', awayTeam: 'Rivals FC', date: 'Jan 20', played: true, result: { home: 2, away: 1 } },
    { id: '2', week: 2, homeTeam: 'United City', awayTeam: 'Your Team', date: 'Jan 27', played: true, result: { home: 1, away: 3 } },
    { id: '3', week: 3, homeTeam: 'Your Team', awayTeam: 'Champions', date: 'Feb 3', played: false },
    { id: '4', week: 4, homeTeam: 'Stars United', awayTeam: 'Your Team', date: 'Feb 10', played: false },
  ];

  const standings = [
    { position: 1, team: 'Your Team', played: 2, wins: 2, draws: 0, losses: 0, gf: 5, ga: 2, points: 6 },
    { position: 2, team: 'Champions', played: 2, wins: 2, draws: 0, losses: 0, gf: 4, ga: 1, points: 6 },
    { position: 3, team: 'United City', played: 2, wins: 1, draws: 1, losses: 0, gf: 3, ga: 2, points: 4 },
    { position: 4, team: 'Rivals FC', played: 2, wins: 1, draws: 0, losses: 1, gf: 2, ga: 3, points: 3 },
    { position: 5, team: 'Stars United', played: 2, wins: 0, draws: 0, losses: 2, gf: 1, ga: 7, points: 0 },
  ];

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">Master League</h1>
        <p className="text-gray-400 mb-8">Season 2025-26 | Week 3 of 38</p>

        {/* Season Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-4">
            <p className="text-gray-400">Points</p>
            <p className="text-3xl font-bold text-blue-500">6</p>
          </div>
          <div className="card p-4">
            <p className="text-gray-400">Goal Difference</p>
            <p className="text-3xl font-bold text-green-500">+3</p>
          </div>
          <div className="card p-4">
            <p className="text-gray-400">Prize Money</p>
            <p className="text-3xl font-bold text-yellow-500">$120K</p>
          </div>
          <div className="card p-4">
            <p className="text-gray-400">Budget</p>
            <p className="text-3xl font-bold text-purple-500">$2.5M</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-700 overflow-x-auto">
          {(['overview', 'fixtures', 'standings', 'transfers', 'stadium'] as const).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-4 font-bold transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'text-blue-500 border-b-2 border-blue-500'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab === 'overview' && '📊 Overview'}
                {tab === 'fixtures' && '📅 Fixtures'}
                {tab === 'standings' && '🏆 Standings'}
                {tab === 'transfers' && '🔄 Transfers'}
                {tab === 'stadium' && '🏟️ Stadium'}
              </button>
            )
          )}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-2xl font-bold mb-4">Season Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-gray-400">Matches Played</p>
                  <p className="text-2xl font-bold">2/38</p>
                </div>
                <div>
                  <p className="text-gray-400">Wins</p>
                  <p className="text-2xl font-bold text-green-500">2</p>
                </div>
                <div>
                  <p className="text-gray-400">Goals For</p>
                  <p className="text-2xl font-bold">5</p>
                </div>
                <div>
                  <p className="text-gray-400">Goals Against</p>
                  <p className="text-2xl font-bold">2</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-2xl font-bold mb-4">Recent Matches</h2>
              <div className="space-y-2">
                {matches.slice(0, 2).map((match) => (
                  <div key={match.id} className="flex justify-between items-center p-3 bg-gray-800 rounded">
                    <div>
                      <p className="font-bold">{match.homeTeam} vs {match.awayTeam}</p>
                      <p className="text-sm text-gray-400">{match.date}</p>
                    </div>
                    {match.played && (
                      <div className="text-2xl font-bold">
                        {match.result!.home}-{match.result!.away}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Fixtures Tab */}
        {activeTab === 'fixtures' && (
          <div className="card p-6">
            <h2 className="text-2xl font-bold mb-4">Fixtures</h2>
            <div className="space-y-3">
              {matches.map((match) => (
                <div
                  key={match.id}
                  className="border border-gray-600 p-4 rounded flex justify-between items-center"
                >
                  <div>
                    <p className="font-bold">Week {match.week}</p>
                    <p className="text-gray-400">{match.homeTeam} vs {match.awayTeam}</p>
                    <p className="text-sm text-gray-500">{match.date}</p>
                  </div>
                  {match.played ? (
                    <div className="text-2xl font-bold text-green-500">
                      {match.result!.home}-{match.result!.away}
                    </div>
                  ) : (
                    <button className="btn btn-secondary text-sm">Play</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Standings Tab */}
        {activeTab === 'standings' && (
          <div className="card p-6 overflow-x-auto">
            <h2 className="text-2xl font-bold mb-4">League Standings</h2>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left py-2">Pos</th>
                  <th className="text-left py-2">Team</th>
                  <th className="text-center py-2">P</th>
                  <th className="text-center py-2">W</th>
                  <th className="text-center py-2">D</th>
                  <th className="text-center py-2">L</th>
                  <th className="text-center py-2">GF</th>
                  <th className="text-center py-2">GA</th>
                  <th className="text-center py-2">Pts</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row) => (
                  <tr
                    key={row.position}
                    className={`border-b border-gray-700 ${
                      row.team === 'Your Team' ? 'bg-blue-900 bg-opacity-30' : ''
                    }`}
                  >
                    <td className="py-2">{row.position}</td>
                    <td className="py-2 font-bold">{row.team}</td>
                    <td className="text-center py-2">{row.played}</td>
                    <td className="text-center py-2 text-green-500">{row.wins}</td>
                    <td className="text-center py-2 text-yellow-500">{row.draws}</td>
                    <td className="text-center py-2 text-red-500">{row.losses}</td>
                    <td className="text-center py-2">{row.gf}</td>
                    <td className="text-center py-2">{row.ga}</td>
                    <td className="text-center py-2 font-bold">{row.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Transfers Tab */}
        {activeTab === 'transfers' && (
          <div className="card p-6">
            <h2 className="text-2xl font-bold mb-4">Transfer Market</h2>
            <p className="text-gray-400 mb-4">Available Budget: $500,000</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-gray-600 p-4 rounded">
                  <h3 className="font-bold mb-2">Transfer Target {i}</h3>
                  <p className="text-sm text-gray-400 mb-2">Rating: 82</p>
                  <p className="text-yellow-500 font-bold mb-3">$350K</p>
                  <button className="w-full btn btn-primary text-sm">Make Offer</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stadium Tab */}
        {activeTab === 'stadium' && (
          <div className="space-y-4">
            <div className="card p-6">
              <h2 className="text-2xl font-bold mb-4">Stadium Upgrades</h2>
              <p className="text-gray-400 mb-4">Current Capacity: 45,000</p>
              <div className="space-y-3">
                {['Expand Capacity', 'Improve Pitch', 'Upgrade Facilities', 'New Lights'].map(
                  (upgrade) => (
                    <div key={upgrade} className="border border-gray-600 p-4 rounded flex justify-between items-center">
                      <div>
                        <p className="font-bold">{upgrade}</p>
                        <p className="text-sm text-gray-400">Cost: $200,000</p>
                      </div>
                      <button className="btn btn-primary text-sm">Upgrade</button>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
