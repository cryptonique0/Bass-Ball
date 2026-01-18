'use client';

import React, { useMemo } from 'react';
import { GuestPlayer, MatchRecord } from '@/lib/guestMode';
import { MatchValidator, ValidationResult } from '@/lib/matchValidator';

interface FairnessValidatorProps {
  player: GuestPlayer;
  onClose?: () => void;
}

/**
 * Fairness & Integrity Validator
 * Displays anti-cheat analysis and match validation results
 */
export function FairnessValidator({ player, onClose }: FairnessValidatorProps) {
  const analysis = useMemo(() => {
    const validations = player.matchHistory.map(match => ({
      match,
      validation: MatchValidator.validateMatch(match, undefined, player.matchHistory),
    }));

    const suspiciousMatches = validations.filter(v => MatchValidator.isSuspicious(v.validation));
    const averageScore = validations.length > 0
      ? validations.reduce((sum, v) => sum + v.validation.score, 0) / validations.length
      : 100;

    const playerProfile = MatchValidator.buildPlayerProfile(player.matchHistory);

    return {
      validations,
      suspiciousMatches,
      averageScore: Math.round(averageScore),
      playerProfile,
      fairnessRating: calculateFairnessRating(averageScore, suspiciousMatches.length, player.matchHistory.length),
    };
  }, [player]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-gray-900 rounded-xl max-w-4xl w-full border-2 border-blue-500 my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-600 p-6 flex items-center justify-between rounded-t-lg sticky top-0">
          <div>
            <h2 className="text-3xl font-bold text-white">🛡️ Fairness & Integrity</h2>
            <p className="text-blue-100 mt-1">Anti-cheat analysis and match validation</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 text-2xl font-bold w-10 h-10 flex items-center justify-center hover:bg-black hover:bg-opacity-30 rounded"
            >
              ✕
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
          {/* Fairness Score */}
          <FairnessScoreCard
            score={analysis.averageScore}
            rating={analysis.fairnessRating}
            totalMatches={player.matchHistory.length}
            suspiciousMatches={analysis.suspiciousMatches.length}
          />

          {/* Player Stats Profile */}
          <PlayerStatsProfile profile={analysis.playerProfile} />

          {/* Match Validations */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">📊 Match Validations</h3>
            {analysis.validations.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No matches recorded yet
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {analysis.validations.map((v, idx) => (
                  <MatchValidationRow
                    key={idx}
                    match={v.match}
                    validation={v.validation}
                    isSuspicious={MatchValidator.isSuspicious(v.validation)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Suspicious Matches Alert */}
          {analysis.suspiciousMatches.length > 0 && (
            <SuspiciousMatchesAlert matches={analysis.suspiciousMatches} />
          )}

          {/* Anti-Cheat Checks */}
          <AntiCheatChecklist />
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
 * Fairness Score Card Component
 */
function FairnessScoreCard({
  score,
  rating,
  totalMatches,
  suspiciousMatches,
}: {
  score: number;
  rating: string;
  totalMatches: number;
  suspiciousMatches: number;
}) {
  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'Excellent':
        return 'from-green-600 to-emerald-600';
      case 'Good':
        return 'from-blue-600 to-cyan-600';
      case 'Fair':
        return 'from-yellow-600 to-orange-600';
      case 'Poor':
        return 'from-red-600 to-orange-600';
      default:
        return 'from-gray-600 to-gray-700';
    }
  };

  const getRatingIcon = (rating: string) => {
    switch (rating) {
      case 'Excellent':
        return '⭐⭐⭐⭐⭐';
      case 'Good':
        return '⭐⭐⭐⭐';
      case 'Fair':
        return '⭐⭐⭐';
      case 'Poor':
        return '⭐⭐';
      default:
        return '⭐';
    }
  };

  return (
    <div className={`bg-gradient-to-r ${getRatingColor(rating)} p-6 rounded-lg border border-opacity-50 border-white`}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-white text-sm opacity-90">Fairness Score</p>
          <p className="text-4xl font-bold text-white mt-2">{score}</p>
          <p className="text-xs text-white opacity-75">/100</p>
        </div>
        <div className="text-center">
          <p className="text-white text-sm opacity-90">Rating</p>
          <p className="text-2xl mt-2">{getRatingIcon(rating)}</p>
          <p className="text-white font-bold text-sm">{rating}</p>
        </div>
        <div className="text-center">
          <p className="text-white text-sm opacity-90">Matches</p>
          <p className="text-3xl font-bold text-white mt-2">{totalMatches}</p>
          <p className="text-xs text-white opacity-75">recorded</p>
        </div>
        <div className="text-center">
          <p className="text-white text-sm opacity-90">Flagged</p>
          <p className={`text-3xl font-bold mt-2 ${suspiciousMatches > 0 ? 'text-red-300' : 'text-green-300'}`}>
            {suspiciousMatches}
          </p>
          <p className="text-xs text-white opacity-75">suspicious</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-white font-bold text-sm">Validation Consistency</p>
          <p className="text-white text-sm">{score}%</p>
        </div>
        <div className="w-full bg-black bg-opacity-30 rounded-full h-3 overflow-hidden">
          <div
            className="bg-white h-full transition-all duration-700"
            style={{ width: `${score}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}

/**
 * Player Stats Profile Component
 */
function PlayerStatsProfile({ profile }: any) {
  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
      <h3 className="font-bold text-white mb-4">📈 Performance Profile</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 p-3 rounded-lg">
          <p className="text-gray-400 text-xs">Avg Goals/Match</p>
          <p className="text-2xl font-bold text-red-400 mt-1">
            {profile.avgGoalsPerMatch.toFixed(2)}
          </p>
        </div>
        <div className="bg-gray-900 p-3 rounded-lg">
          <p className="text-gray-400 text-xs">Avg Assists/Match</p>
          <p className="text-2xl font-bold text-green-400 mt-1">
            {profile.avgAssistsPerMatch.toFixed(2)}
          </p>
        </div>
        <div className="bg-gray-900 p-3 rounded-lg">
          <p className="text-gray-400 text-xs">Avg Match Duration</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">
            {Math.round(profile.avgMatchDuration)}'
          </p>
        </div>
        <div className="bg-gray-900 p-3 rounded-lg">
          <p className="text-gray-400 text-xs">Total Matches</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">
            {profile.totalMatches}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Match Validation Row Component
 */
function MatchValidationRow({
  match,
  validation,
  isSuspicious,
}: {
  match: MatchRecord;
  validation: ValidationResult;
  isSuspicious: boolean;
}) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className={`border rounded-lg overflow-hidden ${
      isSuspicious ? 'bg-red-900 bg-opacity-20 border-red-700' : 'bg-gray-800 border-gray-700'
    }`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-black hover:bg-opacity-20 transition"
      >
        <div className="flex items-center gap-3 flex-1 text-left">
          <span className="text-lg">
            {isSuspicious ? '⚠️' : '✓'}
          </span>
          <div className="flex-1">
            <p className="font-bold text-white">
              {match.homeTeam} vs {match.awayTeam}
            </p>
            <p className="text-sm text-gray-400">
              {new Date(match.date).toLocaleDateString()} • {match.playerGoals}G {match.playerAssists}A
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`font-bold text-lg ${
            isSuspicious ? 'text-red-300' : 'text-green-300'
          }`}>
            {validation.score}
          </p>
          <p className="text-xs text-gray-400">{validation.isValid ? 'Valid' : 'Invalid'}</p>
        </div>
      </button>

      {expanded && (
        <div className="p-3 border-t border-gray-700 bg-black bg-opacity-30 text-sm space-y-2">
          {validation.issues.length > 0 && (
            <div>
              <p className="font-bold text-red-300 mb-1">Issues:</p>
              {validation.issues.map((issue, idx) => (
                <p key={idx} className="text-red-300 text-xs ml-2">
                  • {issue.message}
                </p>
              ))}
            </div>
          )}
          {validation.warnings.length > 0 && (
            <div>
              <p className="font-bold text-yellow-300 mb-1">Warnings:</p>
              {validation.warnings.map((warning, idx) => (
                <p key={idx} className="text-yellow-300 text-xs ml-2">
                  • {warning.message}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Suspicious Matches Alert Component
 */
function SuspiciousMatchesAlert({ matches }: { matches: any[] }) {
  return (
    <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl">⚠️</span>
        <div className="flex-1">
          <h4 className="font-bold text-red-300 mb-2">
            {matches.length} Suspicious Match{matches.length !== 1 ? 'es' : ''} Detected
          </h4>
          <p className="text-red-200 text-sm mb-3">
            These matches have issues that suggest possible data tampering or errors.
          </p>
          <div className="space-y-1 text-sm">
            {matches.slice(0, 3).map((m, idx) => (
              <p key={idx} className="text-red-300">
                • {m.match.homeTeam} vs {m.match.awayTeam} ({new Date(m.match.date).toLocaleDateString()})
              </p>
            ))}
            {matches.length > 3 && (
              <p className="text-red-400">+ {matches.length - 3} more</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Anti-Cheat Checklist Component
 */
function AntiCheatChecklist() {
  const checks = [
    {
      icon: '🔍',
      title: 'Match Data Validation',
      description: 'Scores, goals, and assists are verified for consistency',
      status: 'active',
    },
    {
      icon: '📊',
      title: 'Statistical Anomaly Detection',
      description: 'Performance compared against player history (3σ analysis)',
      status: 'active',
    },
    {
      icon: '⏱️',
      title: 'Timing Validation',
      description: 'Match duration, date, and sequence checks',
      status: 'active',
    },
    {
      icon: '🏀',
      title: 'Physical Plausibility',
      description: 'Goal rates, participation ratios checked against realistic limits',
      status: 'active',
    },
    {
      icon: '📈',
      title: 'Pattern Recognition',
      description: 'Detects unusual win/loss streaks and form reversals',
      status: 'active',
    },
    {
      icon: '🔐',
      title: 'Integrity Hashing',
      description: 'Match data fingerprinting against tampering (Coming Soon)',
      status: 'coming-soon',
    },
  ];

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
      <h3 className="font-bold text-white mb-4">🛡️ Active Anti-Cheat Measures</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {checks.map((check, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg border ${
              check.status === 'active'
                ? 'bg-green-900 bg-opacity-20 border-green-700'
                : 'bg-gray-700 bg-opacity-50 border-gray-600'
            }`}
          >
            <div className="flex items-start gap-2">
              <span className="text-lg">{check.icon}</span>
              <div className="flex-1">
                <p className="font-bold text-white text-sm">{check.title}</p>
                <p className="text-gray-400 text-xs mt-1">{check.description}</p>
                {check.status === 'coming-soon' && (
                  <p className="text-gray-500 text-xs mt-1 italic">Coming soon...</p>
                )}
              </div>
              {check.status === 'active' && (
                <span className="text-green-400 text-xs font-bold">✓</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Calculate fairness rating based on validation score
 */
function calculateFairnessRating(
  score: number,
  suspiciousCount: number,
  totalMatches: number
): string {
  if (score >= 95 && suspiciousCount === 0) {
    return 'Excellent';
  } else if (score >= 80 && suspiciousCount <= 1) {
    return 'Good';
  } else if (score >= 60 && suspiciousCount <= Math.ceil(totalMatches * 0.1)) {
    return 'Fair';
  } else {
    return 'Poor';
  }
}
