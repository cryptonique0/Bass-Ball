'use client';

import React, { useState, useEffect } from 'react';
import { GameplayDynamicsManager, PlayerSubstitution, BenchPlayer } from '@/lib/gameplayDynamicsSystem';
import { Users, AlertCircle, Clock, TrendingDown } from 'lucide-react';

/**
 * Substitution Panel Component
 * Manage live substitutions during matches
 */
export function SubstitutionPanel({ matchId = 'match_001', teamId = 'team_001', gameMinute = 45 }) {
  const dynamicsMgr = GameplayDynamicsManager.getInstance();
  const [slot, setSlot] = useState(dynamicsMgr.getSubstitutionSlot(matchId, teamId));
  const [substitutionHistory, setSubstitutionHistory] = useState<PlayerSubstitution[]>([]);
  const [selectedPlayerOut, setSelectedPlayerOut] = useState<string | null>(null);
  const [selectedPlayerIn, setSelectedPlayerIn] = useState<string | null>(null);
  const [substitutionReason, setSubstitutionReason] = useState<'injury' | 'tactics' | 'fatigue' | 'performance'>('tactics');

  useEffect(() => {
    const updated = dynamicsMgr.getSubstitutionSlot(matchId, teamId);
    setSlot(updated);
    setSubstitutionHistory(dynamicsMgr.getSubstitutionHistory(matchId));
  }, [matchId, teamId]);

  const handleSubstitute = () => {
    if (!selectedPlayerOut || !selectedPlayerIn || !slot) return;

    // For demo purposes - in real app would have player data
    const sub = dynamicsMgr.performSubstitution(
      matchId,
      teamId,
      selectedPlayerOut,
      'Player Out',
      'FW',
      selectedPlayerIn,
      'Player In',
      'MF',
      substitutionReason,
      gameMinute
    );

    if (sub) {
      setSubstitutionHistory([...substitutionHistory, sub]);
      setSelectedPlayerOut(null);
      setSelectedPlayerIn(null);
    }
  };

  if (!slot) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
        <AlertCircle size={32} className="mx-auto text-slate-600 mb-2" />
        <p className="text-slate-400">Match substitution data not available</p>
      </div>
    );
  }

  const canSubstitute = slot.usedSubstitutions < slot.maxSubstitutions;
  const availableBench = dynamicsMgr.getAvailableSubstitutes(matchId, teamId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
          <Users size={28} />
          Substitution Management
        </h2>
        <p className="text-blue-100">
          Used: <strong>{slot.usedSubstitutions}</strong> / <strong>{slot.maxSubstitutions}</strong> substitutions
        </p>
      </div>

      {/* Substitution Maker */}
      {canSubstitute ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">Make a Substitution</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Player Out */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Player Out</label>
              <select
                value={selectedPlayerOut || ''}
                onChange={e => setSelectedPlayerOut(e.target.value || null)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">Select player...</option>
                <option value="player_1">Cristiano Ronaldo</option>
                <option value="player_2">Luka Modrić</option>
                <option value="player_3">Thibaut Courtois</option>
                <option value="player_4">Sergio Ramos</option>
                <option value="player_5">Benzema</option>
              </select>
            </div>

            {/* Player In */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Player In (from bench: {availableBench.length})
              </label>
              <select
                value={selectedPlayerIn || ''}
                onChange={e => setSelectedPlayerIn(e.target.value || null)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">Select replacement...</option>
                {availableBench.map(player => (
                  <option key={player.playerId} value={player.playerId}>
                    {player.playerName} - {player.position} (Ready: {player.readiness}%)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Substitution Reason</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {['injury', 'tactics', 'fatigue', 'performance'].map(reason => (
                <button
                  key={reason}
                  onClick={() => setSubstitutionReason(reason as any)}
                  className={`py-2 rounded-lg font-semibold text-sm transition capitalize ${
                    substitutionReason === reason
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSubstitute}
              disabled={!selectedPlayerOut || !selectedPlayerIn}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition"
            >
              Confirm Substitution
            </button>
            <button
              onClick={() => {
                setSelectedPlayerOut(null);
                setSelectedPlayerIn(null);
              }}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition"
            >
              Clear
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-red-600/20 border border-red-600/50 rounded-lg p-6 text-center">
          <AlertCircle size={32} className="mx-auto text-red-400 mb-2" />
          <p className="text-red-300 font-semibold">No substitutions remaining</p>
          <p className="text-red-400 text-sm mt-1">You've used all {slot.maxSubstitutions} allowed substitutions</p>
        </div>
      )}

      {/* Bench Status */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Users size={20} />
          Squad Bench Status
        </h3>
        <div className="space-y-3">
          {slot.bench.length === 0 ? (
            <p className="text-slate-400 text-center py-4">No players available on bench</p>
          ) : (
            slot.bench.map(player => (
              <BenchPlayerCard key={player.playerId} player={player} />
            ))
          )}
        </div>
      </div>

      {/* Substitution History */}
      {substitutionHistory.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">Substitution History</h3>
          <div className="space-y-3">
            {substitutionHistory.map(sub => (
              <SubstitutionHistoryRow key={sub.substitutionId} sub={sub} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Bench Player Card Component
 */
function BenchPlayerCard({ player }: { player: BenchPlayer }) {
  const availabilityColor = {
    available: 'text-emerald-400 bg-emerald-500/20',
    injured: 'text-red-400 bg-red-500/20',
    suspended: 'text-yellow-400 bg-yellow-500/20',
    tired: 'text-orange-400 bg-orange-500/20',
  };

  return (
    <div className="bg-slate-700/50 rounded-lg p-4 flex items-center justify-between">
      <div className="flex-1">
        <h4 className="font-bold text-white">{player.playerName}</h4>
        <p className="text-sm text-slate-400">{player.position} • {player.playerName}</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-sm text-slate-400">Readiness</div>
          <div className="w-32 bg-slate-600 rounded-full h-2 mt-1">
            <div
              className="bg-cyan-500 h-2 rounded-full"
              style={{ width: `${player.readiness}%` }}
            />
          </div>
          <div className="text-xs text-slate-500 mt-1">{player.readiness}%</div>
        </div>

        <div className={`px-3 py-1 rounded-full text-sm font-bold ${availabilityColor[player.availability]}`}>
          {player.availability.charAt(0).toUpperCase() + player.availability.slice(1)}
        </div>
      </div>
    </div>
  );
}

/**
 * Substitution History Row Component
 */
function SubstitutionHistoryRow({ sub }: { sub: PlayerSubstitution }) {
  const reasonIcons = {
    injury: '🤕',
    tactics: '🎯',
    fatigue: '😴',
    performance: '📊',
  };

  return (
    <div className="bg-slate-700/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{reasonIcons[sub.reason]}</div>
          <div>
            <p className="text-white font-semibold">Minute {sub.time}</p>
            <p className="text-sm text-slate-400 capitalize">{sub.reason} substitution</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Exit</p>
          <p className="text-white font-semibold">{sub.playerOut.playerName}</p>
        </div>
      </div>

      <div className="border-t border-slate-600 pt-3 text-right">
        <p className="text-xs text-slate-400">Entry</p>
        <p className="text-emerald-400 font-semibold">{sub.playerIn.playerName}</p>
      </div>
    </div>
  );
}
