'use client';

import React, { useState } from 'react';
import { Team } from '@/lib/gameEngine';
import { FormationType, FORMATIONS, applyFormation } from '@/lib/formations';

interface TeamSelectorProps {
  teams: { home: Team; away: Team };
  onSelect: (formation: FormationType, team: 'home' | 'away') => void;
  onCancel: () => void;
}

export function TeamSelector({ teams, onSelect, onCancel }: TeamSelectorProps) {
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('home');
  const [selectedFormation, setSelectedFormation] = useState<FormationType>('4-3-3');

  const currentTeam = selectedTeam === 'home' ? teams.home : teams.away;
  const currentFormation = FORMATIONS[selectedFormation];

  const handleConfirm = () => {
    onSelect(selectedFormation, selectedTeam);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border-2 border-blue-500">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 sticky top-0">
          <h2 className="text-3xl font-bold text-white">Select Formation</h2>
          <p className="text-blue-100 mt-2">Choose your tactical setup for the match</p>
        </div>

        <div className="p-6">
          {/* Team Selection */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-white mb-4">Select Team</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedTeam('home')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedTeam === 'home'
                    ? 'border-red-500 bg-red-900 bg-opacity-30'
                    : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                }`}
              >
                <div className="text-red-400 text-lg font-bold">🔴 {teams.home.name}</div>
                <div className="text-sm text-gray-300 mt-1">{teams.home.players.length} players</div>
              </button>

              <button
                onClick={() => setSelectedTeam('away')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedTeam === 'away'
                    ? 'border-blue-500 bg-blue-900 bg-opacity-30'
                    : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                }`}
              >
                <div className="text-blue-400 text-lg font-bold">🔵 {teams.away.name}</div>
                <div className="text-sm text-gray-300 mt-1">{teams.away.players.length} players</div>
              </button>
            </div>
          </div>

          {/* Formation Selection */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-white mb-4">Select Formation</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              {Object.entries(FORMATIONS).map(([formationType, config]) => (
                <button
                  key={formationType}
                  onClick={() => setSelectedFormation(formationType as FormationType)}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    selectedFormation === formationType
                      ? 'border-yellow-400 bg-yellow-900 bg-opacity-30'
                      : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                  }`}
                >
                  <div className="text-lg font-bold text-white">{formationType}</div>
                  <div className="text-xs text-gray-300 mt-1">
                    {config.positions.DEF}-{config.positions.MID}-{config.positions.FWD}
                  </div>
                </button>
              ))}
            </div>

            {/* Formation Details */}
            <div className="bg-gray-700 p-4 rounded-lg mb-6">
              <h4 className="font-bold text-white mb-2">{currentFormation.name}</h4>
              <p className="text-sm text-gray-300 mb-3">{currentFormation.description}</p>

              <div className="grid grid-cols-4 gap-3 text-sm">
                <div className="bg-gray-800 p-2 rounded text-center">
                  <div className="text-green-400 font-bold">GK</div>
                  <div className="text-white text-lg">{currentFormation.positions.GK}</div>
                </div>
                <div className="bg-gray-800 p-2 rounded text-center">
                  <div className="text-red-400 font-bold">DEF</div>
                  <div className="text-white text-lg">{currentFormation.positions.DEF}</div>
                </div>
                <div className="bg-gray-800 p-2 rounded text-center">
                  <div className="text-yellow-400 font-bold">MID</div>
                  <div className="text-white text-lg">{currentFormation.positions.MID}</div>
                </div>
                <div className="bg-gray-800 p-2 rounded text-center">
                  <div className="text-blue-400 font-bold">FWD</div>
                  <div className="text-white text-lg">{currentFormation.positions.FWD}</div>
                </div>
              </div>
            </div>

            {/* Formation Visualization */}
            <div className="bg-gray-900 p-4 rounded-lg mb-6 overflow-x-auto">
              <FormationPreview
                team={currentTeam}
                formation={selectedFormation}
                isHome={selectedTeam === 'home'}
              />
            </div>

            {/* Team Squad Info */}
            <div className="bg-gray-700 p-4 rounded-lg mb-6">
              <h4 className="font-bold text-white mb-3">Squad Overview</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {['GK', 'DEF', 'MID', 'FWD'].map((pos) => {
                  const count = currentTeam.players.filter(p => p.position === pos).length;
                  const needed = currentFormation.positions[pos as keyof typeof currentFormation.positions];
                  const isValid = count >= needed;

                  return (
                    <div key={pos} className={`p-2 rounded ${isValid ? 'bg-green-900' : 'bg-red-900'}`}>
                      <div className="text-xs font-bold text-gray-300">{pos}</div>
                      <div className={`text-lg font-bold ${isValid ? 'text-green-400' : 'text-red-400'}`}>
                        {count}/{needed}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {currentTeam.players.length} total players available
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onCancel}
              className="flex-1 btn btn-secondary"
            >
              ← Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 btn btn-primary text-lg"
            >
              ✓ Apply Formation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Formation preview visualization
 */
function FormationPreview({
  team,
  formation,
  isHome,
}: {
  team: Team;
  formation: FormationType;
  isHome: boolean;
}) {
  const config = FORMATIONS[formation];

  return (
    <div className="text-center">
      <div className="text-white font-bold mb-3">Pitch Layout</div>

      {/* Mini pitch representation */}
      <div className="inline-block">
        {/* Field */}
        <div className="bg-green-900 border-2 border-white p-4 rounded" style={{ width: '300px' }}>
          {/* Formation rows */}
          <div className="space-y-3">
            {/* GK */}
            <div className="flex justify-center gap-2 h-8">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-xs font-bold text-black border border-white">
                G
              </div>
            </div>

            {/* DEF */}
            {config.positions.DEF > 0 && (
              <div className="flex justify-center gap-1 h-8">
                {Array(config.positions.DEF)
                  .fill(0)
                  .map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 max-w-12 h-8 bg-red-600 rounded-full flex items-center justify-center text-xs font-bold text-white border border-red-400"
                    >
                      D
                    </div>
                  ))}
              </div>
            )}

            {/* MID */}
            {config.positions.MID > 0 && (
              <div className="flex justify-center gap-1 h-8">
                {Array(config.positions.MID)
                  .fill(0)
                  .map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 max-w-12 h-8 bg-yellow-600 rounded-full flex items-center justify-center text-xs font-bold text-white border border-yellow-400"
                    >
                      M
                    </div>
                  ))}
              </div>
            )}

            {/* FWD */}
            {config.positions.FWD > 0 && (
              <div className="flex justify-center gap-1 h-8">
                {Array(config.positions.FWD)
                  .fill(0)
                  .map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 max-w-12 h-8 bg-cyan-600 rounded-full flex items-center justify-center text-xs font-bold text-white border border-cyan-400"
                    >
                      F
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Field label */}
          <div className="text-white text-xs mt-2 opacity-60">
            {isHome ? '← Defending' : 'Defending →'}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
          <span className="text-gray-300">GK</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-red-600 rounded-full"></div>
          <span className="text-gray-300">Defense</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-yellow-600 rounded-full"></div>
          <span className="text-gray-300">Midfield</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-cyan-600 rounded-full"></div>
          <span className="text-gray-300">Forward</span>
        </div>
      </div>
    </div>
  );
}
