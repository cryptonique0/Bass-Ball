'use client';

import { useState } from 'react';
import { GuestPlayer } from '@/lib/guestMode';
import { MatchValidator, ValidationResult } from '@/lib/matchValidator';

interface FairnessValidatorProps {
  player: GuestPlayer;
  onClose: () => void;
}

export function FairnessValidator({ player, onClose }: FairnessValidatorProps) {
  const [selectedMatch, setSelectedMatch] = useState(0);

  // Calculate fairness for all matches
  const validations = player.matchHistory.map((match, idx) => ({
    index: idx,
    match,
    validation: MatchValidator.validateMatch(
      match,
      undefined,
      player.matchHistory
    ),
  }));

  const avgScore = Math.round(
    validations.reduce((s, v) => s + v.validation.score, 0) / validations.length
  );
  const suspiciousCount = validations.filter(v =>
    MatchValidator.isSuspicious(v.validation)
  ).length;

  const selectedValidation = validations[selectedMatch]?.validation;
  const selectedMatch_data = validations[selectedMatch]?.match;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">🛡️ Fairness Report</h2>
            <p className="text-gray-400 mt-1">
              {player.username} • {player.matchHistory.length} matches
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Overall Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-blue-900 bg-opacity-50 border border-blue-700 p-4 rounded-lg">
              <p className="text-blue-300 text-sm">Total Matches</p>
              <p className="text-3xl font-bold text-white mt-2">
                {player.matchHistory.length}
              </p>
            </div>

            <div
              className={`p-4 rounded-lg border ${
                avgScore >= 90
                  ? 'bg-green-900 bg-opacity-50 border-green-700'
                  : avgScore >= 70
                  ? 'bg-blue-900 bg-opacity-50 border-blue-700'
                  : 'bg-red-900 bg-opacity-50 border-red-700'
              }`}
            >
              <p
                className={`text-sm ${
                  avgScore >= 90
                    ? 'text-green-300'
                    : avgScore >= 70
                    ? 'text-blue-300'
                    : 'text-red-300'
                }`}
              >
                Average Fairness
              </p>
              <p className="text-3xl font-bold text-white mt-2">{avgScore}</p>
            </div>

            <div className="bg-yellow-900 bg-opacity-50 border border-yellow-700 p-4 rounded-lg">
              <p className="text-yellow-300 text-sm">Win Rate</p>
              <p className="text-3xl font-bold text-white mt-2">
                {Math.round(
                  (player.matchHistory.filter(m => m.result === 'win').length /
                    player.matchHistory.length) *
                    100
                )}
                %
              </p>
            </div>

            <div className="bg-red-900 bg-opacity-50 border border-red-700 p-4 rounded-lg">
              <p className="text-red-300 text-sm">Flagged Matches</p>
              <p className="text-3xl font-bold text-white mt-2">
                {suspiciousCount}
              </p>
            </div>
          </div>

          {/* Match List & Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Match List */}
            <div className="lg:col-span-1">
              <h3 className="font-bold text-white mb-3 text-lg">Matches</h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {validations.map((v, idx) => {
                  const isSuspicious = MatchValidator.isSuspicious(v.validation);
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedMatch(idx)}
                      className={`w-full p-3 rounded text-left transition-colors ${
                        selectedMatch === idx
                          ? 'bg-blue-600 border border-blue-400'
                          : isSuspicious
                          ? 'bg-red-900 bg-opacity-30 hover:bg-opacity-50 border border-red-700'
                          : 'bg-gray-800 hover:bg-gray-700 border border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-white text-sm">
                            {v.match.homeTeam} {v.match.homeScore} -{' '}
                            {v.match.awayScore} {v.match.awayTeam}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {v.match.playerGoals}G {v.match.playerAssists}A •{' '}
                            {v.match.duration}min
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-bold text-lg ${
                              v.validation.score >= 90
                                ? 'text-green-400'
                                : v.validation.score >= 70
                                ? 'text-blue-400'
                                : 'text-red-400'
                            }`}
                          >
                            {v.validation.score}
                          </p>
                          {isSuspicious && (
                            <p className="text-xs text-red-400">⚠️</p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Match Details */}
            {selectedValidation && selectedMatch_data && (
              <div className="lg:col-span-2">
                <h3 className="font-bold text-white mb-3 text-lg">
                  Match #{player.matchHistory.length - selectedMatch}
                </h3>

                {/* Score Card */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-center flex-1">
                      <p className="text-gray-400 text-sm">
                        {selectedMatch_data.homeTeam}
                      </p>
                      <p className="text-3xl font-bold text-white mt-1">
                        {selectedMatch_data.homeScore}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500 text-sm">
                        {selectedMatch_data.duration}'
                      </p>
                    </div>
                    <div className="text-center flex-1">
                      <p className="text-gray-400 text-sm">
                        {selectedMatch_data.awayTeam}
                      </p>
                      <p className="text-3xl font-bold text-white mt-1">
                        {selectedMatch_data.awayScore}
                      </p>
                    </div>
                  </div>

                  {/* Result Badge */}
                  <div className="text-center">
                    <span
                      className={`inline-block px-3 py-1 rounded font-bold text-sm ${
                        selectedMatch_data.result === 'win'
                          ? 'bg-green-600'
                          : selectedMatch_data.result === 'loss'
                          ? 'bg-red-600'
                          : 'bg-yellow-600'
                      }`}
                    >
                      {selectedMatch_data.result === 'win' && '🏆 WIN'}
                      {selectedMatch_data.result === 'loss' && '😢 LOSS'}
                      {selectedMatch_data.result === 'draw' && '🤝 DRAW'}
                    </span>
                  </div>
                </div>

                {/* Player Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-gray-800 border border-gray-700 rounded p-3">
                    <p className="text-gray-400 text-xs">Goals</p>
                    <p className="text-2xl font-bold text-white">
                      {selectedMatch_data.playerGoals}
                    </p>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded p-3">
                    <p className="text-gray-400 text-xs">Assists</p>
                    <p className="text-2xl font-bold text-white">
                      {selectedMatch_data.playerAssists}
                    </p>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded p-3">
                    <p className="text-gray-400 text-xs">Contribution</p>
                    <p className="text-2xl font-bold text-white">
                      {selectedMatch_data.playerGoals +
                        selectedMatch_data.playerAssists}
                    </p>
                  </div>
                </div>

                {/* Validation Score */}
                <div
                  className={`rounded-lg p-4 border mb-4 ${
                    selectedValidation.score >= 90
                      ? 'bg-green-900 bg-opacity-30 border-green-700'
                      : selectedValidation.score >= 70
                      ? 'bg-blue-900 bg-opacity-30 border-blue-700'
                      : 'bg-red-900 bg-opacity-30 border-red-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-white">Validation Score</p>
                    <p
                      className={`text-2xl font-bold ${
                        selectedValidation.score >= 90
                          ? 'text-green-400'
                          : selectedValidation.score >= 70
                          ? 'text-blue-400'
                          : 'text-red-400'
                      }`}
                    >
                      {selectedValidation.score}
                    </p>
                  </div>

                  {/* Checks Summary */}
                  <div className="space-y-1 text-sm">
                    <p
                      className={`${
                        selectedValidation.checksSummary.reasonableness
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}
                    >
                      {selectedValidation.checksSummary.reasonableness
                        ? '✓'
                        : '✗'}{' '}
                      Reasonableness Check
                    </p>
                    <p
                      className={`${
                        selectedValidation.checksSummary.consistency
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}
                    >
                      {selectedValidation.checksSummary.consistency ? '✓' : '✗'}{' '}
                      Consistency Check
                    </p>
                    <p
                      className={`${
                        selectedValidation.checksSummary.anomaly
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}
                    >
                      {selectedValidation.checksSummary.anomaly ? '✓' : '✗'} Anomaly
                      Detection
                    </p>
                    <p
                      className={`${
                        selectedValidation.checksSummary.comparison
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}
                    >
                      {selectedValidation.checksSummary.comparison ? '✓' : '✗'}{' '}
                      Comparative Analysis
                    </p>
                  </div>
                </div>

                {/* Issues & Warnings */}
                {(selectedValidation.issues.length > 0 ||
                  selectedValidation.warnings.length > 0) && (
                  <div className="space-y-3">
                    {selectedValidation.issues.length > 0 && (
                      <div className="bg-red-900 bg-opacity-30 border border-red-700 rounded p-3">
                        <p className="font-bold text-red-400 mb-2">
                          Issues ({selectedValidation.issues.length})
                        </p>
                        <div className="space-y-1 text-sm">
                          {selectedValidation.issues.map((issue, idx) => (
                            <p key={idx} className="text-red-300">
                              • {issue.message}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedValidation.warnings.length > 0 && (
                      <div className="bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded p-3">
                        <p className="font-bold text-yellow-400 mb-2">
                          Warnings ({selectedValidation.warnings.length})
                        </p>
                        <div className="space-y-1 text-sm">
                          {selectedValidation.warnings.map((warning, idx) => (
                            <p key={idx} className="text-yellow-300">
                              • {warning.message}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="border-t border-gray-700 pt-4">
            <button
              onClick={onClose}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition-colors"
            >
              Close Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
