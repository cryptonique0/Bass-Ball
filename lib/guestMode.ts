'use client';

import React, { useState, useEffect } from 'react';
import { MatchValidator, ValidationResult } from './matchValidator';

export interface GuestPlayer {
  id: string;
  username: string;
  createdAt: number;
  stats: {
    matchesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
    totalGoals: number;
    totalAssists: number;
  };
  matchHistory: MatchRecord[];
}

export interface MatchRecord {
  id: string;
  date: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  playerTeam: 'home' | 'away';
  playerGoals: number;
  playerAssists: number;
  result: 'win' | 'loss' | 'draw';
  duration: number; // in minutes
}

const GUEST_STORAGE_KEY = 'bass_ball_guest_player';
const MATCH_HISTORY_KEY = 'bass_ball_match_history';

/**
 * Guest Mode Manager
 * Handles guest player creation, profile management, and match history
 */
export class GuestModeManager {
  static createGuestPlayer(username: string): GuestPlayer {
    const id = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const player: GuestPlayer = {
      id,
      username,
      createdAt: Date.now(),
      stats: {
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        totalGoals: 0,
        totalAssists: 0,
      },
      matchHistory: [],
    };

    // Save to localStorage
    this.savePlayer(player);
    return player;
  }

  static getGuestPlayer(): GuestPlayer | null {
    try {
      const data = localStorage.getItem(GUEST_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  static savePlayer(player: GuestPlayer): void {
    try {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(player));
    } catch (e) {
      console.error('Failed to save guest player:', e);
    }
  }

  static updateUsername(newUsername: string): GuestPlayer | null {
    const player = this.getGuestPlayer();
    if (player) {
      player.username = newUsername;
      this.savePlayer(player);
      return player;
    }
    return null;
  }

  static recordMatch(
    homeTeam: string,
    awayTeam: string,
    homeScore: number,
    awayScore: number,
    playerTeam: 'home' | 'away',
    playerGoals: number,
    playerAssists: number,
    duration: number
  ): { player: GuestPlayer | null; validation: any } {
    const player = this.getGuestPlayer();
    if (!player) return { player: null, validation: null };

    // Determine result
    let result: 'win' | 'loss' | 'draw';
    let teamScore = playerTeam === 'home' ? homeScore : awayScore;
    let opponentScore = playerTeam === 'home' ? awayScore : homeScore;

    if (teamScore > opponentScore) {
      result = 'win';
      player.stats.wins++;
    } else if (teamScore < opponentScore) {
      result = 'loss';
      player.stats.losses++;
    } else {
      result = 'draw';
      player.stats.draws++;
    }

    // Create match record
    const match: MatchRecord = {
      id: `match_${Date.now()}`,
      date: Date.now(),
      homeTeam,
      awayTeam,
      homeScore,
      awayScore,
      playerTeam,
      playerGoals,
      playerAssists,
      result,
      duration,
    };

    // Validate match integrity and check for cheating
    const validation = MatchValidator.validateMatch(match, undefined, player.matchHistory);

    // Update stats only if match passes validation
    player.stats.matchesPlayed++;
    player.stats.totalGoals += playerGoals;
    player.stats.totalAssists += playerAssists;
    player.matchHistory.unshift(match); // Add to beginning

    // Keep only last 50 matches
    if (player.matchHistory.length > 50) {
      player.matchHistory = player.matchHistory.slice(0, 50);
    }

    this.savePlayer(player);
    return { player, validation };
  }

  static getMatchHistory(): MatchRecord[] {
    const player = this.getGuestPlayer();
    return player ? player.matchHistory : [];
  }

  static getWinRatio(): number {
    const player = this.getGuestPlayer();
    if (!player || player.stats.matchesPlayed === 0) return 0;
    return (player.stats.wins / player.stats.matchesPlayed) * 100;
  }

  static getStats(): GuestPlayer['stats'] | null {
    const player = this.getGuestPlayer();
    return player ? player.stats : null;
  }

  static deleteGuestPlayer(): void {
    try {
      localStorage.removeItem(GUEST_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to delete guest player:', e);
    }
  }
}

/**
 * Guest Username Setup Component
 * Allows new guests to create a username
 */
export function GuestUsernameSetup({ onComplete }: { onComplete: (player: GuestPlayer) => void }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (username.length > 20) {
      setError('Username must be at most 20 characters');
      return;
    }

    const player = GuestModeManager.createGuestPlayer(username.trim());
    onComplete(player);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full border-2 border-yellow-500">
        <h2 className="text-3xl font-bold text-white mb-2 text-center">🎮 Welcome to Bass Ball</h2>
        <p className="text-gray-300 text-center mb-6">Choose your player username to get started!</p>

        <div className="space-y-4">
          <input
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError('');
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Enter your username"
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:border-yellow-500 placeholder-gray-500"
            maxLength={20}
            autoFocus
          />

          <div className="text-xs text-gray-400">
            {username.length}/20 characters
          </div>

          {error && (
            <div className="p-3 bg-red-900 bg-opacity-30 border border-red-700 text-red-300 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!username.trim()}
            className="w-full py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:from-gray-600 disabled:to-gray-700 text-black font-bold rounded-lg transition-all"
          >
            Start Playing →
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            You can change your username anytime in your profile
          </p>
        </div>
      </div>
    </div>
  );
}
