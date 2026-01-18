'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { GuestModeManager, GuestPlayer, MatchRecord } from '@/lib/guestMode';

interface PlayerProfileProps {
  player: GuestPlayer;
  onClose?: () => void;
  onUsernameChange?: (newUsername: string) => void;
}

/**
 * Player Profile Component
 * Displays player stats, match history, and profile settings
 */
export function PlayerProfile({ player: initialPlayer, onClose, onUsernameChange }: PlayerProfileProps) {
  const [player, setPlayer] = useState(initialPlayer);
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(player.username);
  const [usernameError, setUsernameError] = useState('');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'history' | 'settings'>('overview');

  const stats = useMemo(() => {
    return {
      winRatio: player.stats.matchesPlayed > 0 
        ? ((player.stats.wins / player.stats.matchesPlayed) * 100).toFixed(1)
        : 0,
      goalsPerMatch: player.stats.matchesPlayed > 0 
        ? (player.stats.totalGoals / player.stats.matchesPlayed).toFixed(2)
        : 0,
      assistsPerMatch: player.stats.matchesPlayed > 0 
        ? (player.stats.totalAssists / player.stats.matchesPlayed).toFixed(2)
        : 0,
      joinedDate: new Date(player.createdAt).toLocaleDateString(),
    };
  }, [player.stats]);

  const handleUsernameChange = () => {
    if (!newUsername.trim()) {
      setUsernameError('Username cannot be empty');
      return;
    }

    if (newUsername.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return;
    }

    if (newUsername.length > 20) {
      setUsernameError('Username must be at most 20 characters');
      return;
    }

    if (newUsername === player.username) {
      setEditingUsername(false);
      return;
    }

    const updated = GuestModeManager.updateUsername(newUsername.trim());
    if (updated) {
      setPlayer(updated);
      setEditingUsername(false);
      onUsernameChange?.(newUsername);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-gray-900 rounded-xl max-w-3xl w-full border-2 border-yellow-500 my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-600 via-yellow-500 to-orange-600 p-6 flex items-center justify-between rounded-t-lg sticky top-0">
          <div>
            <h2 className="text-3xl font-bold text-white">👤 Player Profile</h2>
            <p className="text-yellow-100 mt-1">Your gaming statistics and match history</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white hover:text-yellow-200 text-2xl font-bold w-10 h-10 flex items-center justify-center hover:bg-black hover:bg-opacity-30 rounded"
            >
              ✕
            </button>
          )}
        </div>

        {/* Player Name Section */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Player Name</p>
              {editingUsername ? (
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => {
                      setNewUsername(e.target.value);
                      setUsernameError('');
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleUsernameChange()}
                    className="px-3 py-2 bg-gray-800 border border-yellow-500 text-white rounded-lg focus:outline-none"
                    maxLength={20}
                    autoFocus
                  />
                  <button
                    onClick={handleUsernameChange}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => {
                      setEditingUsername(false);
                      setNewUsername(player.username);
                      setUsernameError('');
                    }}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-2">
                  <h3 className="text-3xl font-bold text-white">{player.username}</h3>
                  <button
                    onClick={() => setEditingUsername(true)}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg"
                  >
                    Edit
                  </button>
                </div>
              )}
              {usernameError && (
                <p className="text-red-400 text-sm mt-2">{usernameError}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm">Player ID</p>
              <p className="text-gray-400 text-xs font-mono mt-1">{player.id.substring(0, 16)}...</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700 bg-gray-800">
          <button
            onClick={() => setSelectedTab('overview')}
            className={`flex-1 py-4 font-bold transition-colors ${
              selectedTab === 'overview'
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📊 Overview
          </button>
          <button
            onClick={() => setSelectedTab('history')}
            className={`flex-1 py-4 font-bold transition-colors ${
              selectedTab === 'history'
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📜 History ({player.stats.matchesPlayed})
          </button>
          <button
            onClick={() => setSelectedTab('settings')}
            className={`flex-1 py-4 font-bold transition-colors ${
              selectedTab === 'settings'
                ? 'text-yellow-400 border-b-2 border-yellow-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            ⚙️ Settings
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-[500px] overflow-y-auto">
          {selectedTab === 'overview' && (
            <OverviewTab player={player} stats={stats} />
          )}

          {selectedTab === 'history' && (
            <HistoryTab player={player} />
          )}

          {selectedTab === 'settings' && (
            <SettingsTab player={player} onClose={onClose} />
          )}
        </div>

        {/* Footer */}
        {onClose && (
          <div className="flex justify-center gap-4 p-6 border-t border-gray-700 bg-gray-800">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors"
            >
              ← Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Overview Tab - Display main statistics
 */
function OverviewTab({
  player,
  stats,
}: {
  player: GuestPlayer;
  stats: Record<string, any>;
}) {
  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon="⚽"
          label="Matches Played"
          value={player.stats.matchesPlayed}
          color="blue"
        />
        <StatCard
          icon="🏆"
          label="Wins"
          value={player.stats.wins}
          color="gold"
        />
        <StatCard
          icon="😢"
          label="Losses"
          value={player.stats.losses}
          color="red"
        />
        <StatCard
          icon="🤝"
          label="Draws"
          value={player.stats.draws}
          color="gray"
        />
      </div>

      {/* Win Ratio Section */}
      <div className="bg-gradient-to-r from-yellow-900 to-orange-900 p-6 rounded-lg border border-yellow-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-yellow-200 text-sm">Win Ratio</p>
            <p className="text-4xl font-bold text-yellow-300">{stats.winRatio}%</p>
          </div>
          <div className="text-6xl">🎯</div>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden border border-yellow-700">
          <div
            className="bg-gradient-to-r from-yellow-400 to-orange-500 h-full transition-all duration-700"
            style={{ width: `${stats.winRatio}%` }}
          ></div>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <p className="text-gray-400 text-sm">Goals (Per Match)</p>
          <p className="text-2xl font-bold text-red-400 mt-2">{stats.goalsPerMatch}</p>
          <p className="text-gray-500 text-xs mt-1">Total: {player.stats.totalGoals}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <p className="text-gray-400 text-sm">Assists (Per Match)</p>
          <p className="text-2xl font-bold text-green-400 mt-2">{stats.assistsPerMatch}</p>
          <p className="text-gray-500 text-xs mt-1">Total: {player.stats.totalAssists}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <p className="text-gray-400 text-sm">Member Since</p>
          <p className="text-xl font-bold text-blue-400 mt-2">{stats.joinedDate}</p>
        </div>
      </div>

      {/* Level Progress */}
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
        <p className="text-gray-400 text-sm mb-3">Level Progress</p>
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-white">Level 5 Player</span>
          <span className="text-gray-400 text-sm">75%</span>
        </div>
        <div className="w-full bg-gray-900 rounded-full h-3 overflow-hidden border border-gray-700">
          <div
            className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full"
            style={{ width: '75%' }}
          ></div>
        </div>
        <p className="text-gray-500 text-xs mt-2">
          Unlocked: Profile customization, Match analysis
        </p>
      </div>
    </div>
  );
}

/**
 * History Tab - Display match history
 */
function HistoryTab({ player }: { player: GuestPlayer }) {
  if (player.matchHistory.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-3">📭</div>
        <p className="text-gray-400">No matches yet</p>
        <p className="text-gray-500 text-sm mt-1">Play your first match to see it here!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {player.matchHistory.map((match) => (
        <MatchHistoryCard key={match.id} match={match} />
      ))}
    </div>
  );
}

/**
 * Settings Tab - Player settings
 */
function SettingsTab({ player, onClose }: { player: GuestPlayer; onClose?: () => void }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteAccount = () => {
    GuestModeManager.deleteGuestPlayer();
    onClose?.();
  };

  return (
    <div className="space-y-6">
      {/* Account Info */}
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
        <h3 className="font-bold text-white mb-3">Account Information</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Player ID:</span>
            <span className="text-gray-300 font-mono text-xs">{player.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Account Type:</span>
            <span className="text-yellow-400 font-bold">Guest Account</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Joined:</span>
            <span className="text-gray-300">{new Date(player.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
        <h3 className="font-bold text-white mb-3">Data Management</h3>
        <button className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold mb-2">
          📥 Export Profile Data
        </button>
        <button className="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-bold">
          🔄 Backup to Cloud (Coming Soon)
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-900 bg-opacity-20 p-4 rounded-lg border border-red-700">
        <h3 className="font-bold text-red-300 mb-3">⚠️ Danger Zone</h3>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold"
          >
            Delete Account
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-red-300 text-sm">
              Are you sure? This will delete your profile and all match history. This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAccount}
                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Features Info */}
      <div className="bg-blue-900 bg-opacity-20 p-4 rounded-lg border border-blue-700">
        <h3 className="font-bold text-blue-300 mb-3">💡 Pro Tips</h3>
        <ul className="text-blue-300 text-sm space-y-1">
          <li>✓ Your data is saved locally on this device</li>
          <li>✓ Clear your browser cache to reset your profile</li>
          <li>✓ Create an account for cloud backup (coming soon)</li>
          <li>✓ Share your profile stats with friends!</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Stat Card Component
 */
function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: number;
  color: 'blue' | 'gold' | 'red' | 'gray';
}) {
  const colors = {
    blue: 'bg-blue-900 border-blue-700',
    gold: 'bg-yellow-900 border-yellow-700',
    red: 'bg-red-900 border-red-700',
    gray: 'bg-gray-700 border-gray-600',
  };

  const valueColors = {
    blue: 'text-blue-400',
    gold: 'text-yellow-400',
    red: 'text-red-400',
    gray: 'text-gray-300',
  };

  return (
    <div className={`${colors[color]} border rounded-lg p-4`}>
      <div className="text-3xl mb-2">{icon}</div>
      <p className="text-gray-400 text-xs">{label}</p>
      <p className={`text-2xl font-bold ${valueColors[color]} mt-1`}>{value}</p>
    </div>
  );
}

/**
 * Match History Card Component
 */
function MatchHistoryCard({ match }: { match: MatchRecord }) {
  const resultColors = {
    win: 'bg-green-900 border-green-700 text-green-300',
    loss: 'bg-red-900 border-red-700 text-red-300',
    draw: 'bg-gray-700 border-gray-600 text-gray-300',
  };

  const resultIcons = {
    win: '🏆',
    loss: '😢',
    draw: '🤝',
  };

  const resultText = {
    win: 'Win',
    loss: 'Loss',
    draw: 'Draw',
  };

  const playerTeamName = match.playerTeam === 'home' ? match.homeTeam : match.awayTeam;
  const opponentTeamName = match.playerTeam === 'home' ? match.awayTeam : match.homeTeam;
  const playerScore = match.playerTeam === 'home' ? match.homeScore : match.awayScore;
  const opponentScore = match.playerTeam === 'home' ? match.awayScore : match.homeScore;

  return (
    <div className={`${resultColors[match.result]} border rounded-lg p-4`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{resultIcons[match.result]}</span>
            <span className="font-bold">{resultText[match.result]}</span>
            <span className="text-xs opacity-75">
              {new Date(match.date).toLocaleDateString()} {new Date(match.date).toLocaleTimeString()}
            </span>
          </div>
          <div className="text-sm">
            <span className="font-bold">{playerTeamName}</span>
            <span className="mx-2">vs</span>
            <span className="font-bold">{opponentTeamName}</span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold mb-1">
            {playerScore} - {opponentScore}
          </div>
          <div className="text-xs">
            ⚽ {match.playerGoals} · 🤝 {match.playerAssists} · ⏱️ {match.duration}'
          </div>
        </div>
      </div>
    </div>
  );
}
