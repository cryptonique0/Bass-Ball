'use client';

import React, { useMemo } from 'react';
import { MatchStats, MatchEngine } from '@/lib/matchEngine';
import { Team } from '@/lib/gameEngine';

interface MatchSummaryProps {
  homeTeam: Team;
  awayTeam: Team;
  matchStats: MatchStats;
  matchEngine: MatchEngine;
  gameTime: number;
  onRestart?: () => void;
}

interface MatchHighlight {
  minute: number;
  type: 'goal' | 'card' | 'key_play';
  description: string;
  team: 'home' | 'away';
}

/**
 * Comprehensive match summary component
 * Shows: final score, statistics, player ratings, highlights, comparisons
 */
export const MatchSummary: React.FC<MatchSummaryProps> = ({
  homeTeam,
  awayTeam,
  matchStats,
  matchEngine,
  gameTime,
  onRestart,
}) => {
  // Determine winner
  const homeScore = homeTeam.score;
  const awayScore = awayTeam.score;
  const winner = homeScore > awayScore ? 'home' : awayScore > homeScore ? 'away' : 'draw';

  // Get top scorers
  const topScorers = useMemo(() => {
    return [
      ...homeTeam.players.map((p: any) => ({
        ...matchEngine.getPlayerStats(p.id),
        team: 'home' as const,
      })),
      ...awayTeam.players.map((p: any) => ({
        ...matchEngine.getPlayerStats(p.id),
        team: 'away' as const,
      })),
    ]
      .filter((p) => p !== null && p.goals! > 0)
      .sort((a, b) => (b.goals || 0) - (a.goals || 0))
      .slice(0, 6);
  }, [homeTeam, awayTeam, matchEngine]);

  // Get top playmakers
  const topPlaymakers = useMemo(() => {
    const homeAssists = matchEngine.getTopAssists('home', 5);
    const awayAssists = matchEngine.getTopAssists('away', 5);
    return [...homeAssists, ...awayAssists].slice(0, 6);
  }, [matchEngine]);

  // Get key highlights
  const highlights = useMemo((): MatchHighlight[] => {
    return matchStats.events
      .filter((e: any) => ['goal', 'yellow_card', 'red_card'].includes(e.type))
      .map((e: any) => ({
        minute: Math.floor(e.time),
        type: e.type === 'goal' ? 'goal' : 'card',
        description: e.description,
        team: e.team,
      }))
      .sort((a: MatchHighlight, b: MatchHighlight) => a.minute - b.minute);
  }, [matchStats]);

  // Get MVP
  const mvp = useMemo(() => {
    const allPlayers = [
      ...homeTeam.players.map((p: any) => ({
        ...matchEngine.getPlayerStats(p.id),
        team: 'home' as const,
      })),
      ...awayTeam.players.map((p: any) => ({
        ...matchEngine.getPlayerStats(p.id),
        team: 'away' as const,
      })),
    ].filter((p) => p !== null);

    return allPlayers.sort((a, b) => {
      const aScore = (a.goals || 0) * 3 + (a.assists || 0) * 1.5 + (a.shots || 0) * 0.5;
      const bScore = (b.goals || 0) * 3 + (b.assists || 0) * 1.5 + (b.shots || 0) * 0.5;
      return bScore - aScore;
    })[0];
  }, [homeTeam, awayTeam, matchEngine]);

  // Calculate match rating
  const matchIntensity = useMemo(() => {
    const totalGoals = homeScore + awayScore;
    const totalCards = matchStats.homeTeam.yellowCards + matchStats.homeTeam.redCards +
                      matchStats.awayTeam.yellowCards + matchStats.awayTeam.redCards;
    const totalShots = matchStats.homeTeam.shots + matchStats.awayTeam.shots;
    return Math.min(5, 1 + (totalGoals * 0.5) + (totalCards * 0.1) + (totalShots * 0.05));
  }, [homeScore, awayScore, matchStats]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-2">
          FULL TIME
        </h1>
        <p className="text-gray-300 text-lg">
          {Math.floor(gameTime)} minutes • Match Complete
        </p>
      </div>

      {/* Final Score Section */}
      <ScoreDisplay
        homeTeamName={homeTeam.name}
        awayTeamName={awayTeam.name}
        homeScore={homeScore}
        awayScore={awayScore}
        winner={winner}
      />

      {/* Match Rating */}
      <MatchRating intensity={matchIntensity} />

      {/* MVP Section */}
      {mvp && <MVPCard mvp={mvp} />}

      {/* Top Scorers & Playmakers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <TopScorersCard scorers={topScorers} />
        <TopPlaymakersCard playmakers={topPlaymakers} />
      </div>

      {/* Team Comparison */}
      <TeamComparison homeStats={matchStats.homeTeam} awayStats={matchStats.awayTeam} />

      {/* Match Highlights */}
      {highlights.length > 0 && <MatchHighlights highlights={highlights} />}

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <DetailedStatsPanel
          teamName={homeTeam.name}
          teamColor="from-yellow-600/30 to-yellow-800/20"
          stats={matchStats.homeTeam}
          isWinner={winner === 'home'}
        />
        <DetailedStatsPanel
          teamName={awayTeam.name}
          teamColor="from-cyan-600/30 to-cyan-800/20"
          stats={matchStats.awayTeam}
          isWinner={winner === 'away'}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {onRestart && (
          <button
            onClick={onRestart}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold transition-all duration-300 shadow-lg"
          >
            🔄 Return to Menu
          </button>
        )}
        <button
          className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-semibold transition-all duration-300 shadow-lg"
        >
          📊 View Full Stats
        </button>
      </div>
    </div>
  );
};

/**
 * Final score display component
 */
interface ScoreDisplayProps {
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  winner: 'home' | 'away' | 'draw';
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  homeTeamName,
  awayTeamName,
  homeScore,
  awayScore,
  winner,
}) => {
  return (
    <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-8 mb-8 border border-blue-500/30 shadow-xl">
      <div className="flex justify-between items-center mb-6">
        {/* Home Team */}
        <div className="flex-1 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {homeTeamName}
          </h2>
          <p className="text-gray-400">HOME</p>
        </div>

        {/* Score */}
        <div className="flex-1 text-center px-4">
          <div className="flex justify-center items-center gap-2">
            <div className="text-6xl md:text-7xl font-bold text-yellow-400">
              {homeScore}
            </div>
            <div className="text-3xl text-gray-400">:</div>
            <div className="text-6xl md:text-7xl font-bold text-cyan-400">
              {awayScore}
            </div>
          </div>
          <div className="mt-4">
            <span className={`inline-block px-6 py-2 rounded-full text-lg font-bold ${
              winner === 'draw' ? 'bg-gray-600/40 text-gray-200' :
              winner === 'home' ? 'bg-yellow-500/30 text-yellow-200' :
              'bg-cyan-500/30 text-cyan-200'
            }`}>
              {winner === 'draw' ? '🤝 DRAW' : `${winner === 'home' ? '🏆 HOME WINS' : '🏆 AWAY WINS'}`}
            </span>
          </div>
        </div>

        {/* Away Team */}
        <div className="flex-1 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {awayTeamName}
          </h2>
          <p className="text-gray-400">AWAY</p>
        </div>
      </div>
    </div>
  );
};

/**
 * Match intensity rating
 */
interface MatchRatingProps {
  intensity: number;
}

const MatchRating: React.FC<MatchRatingProps> = ({ intensity }) => {
  const stars = Math.round(intensity);
  return (
    <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-xl p-6 mb-8 border border-purple-500/30 text-center">
      <p className="text-purple-200 text-sm font-semibold mb-2">MATCH INTENSITY</p>
      <div className="flex justify-center gap-1">
        {Array(5).fill(0).map((_, i) => (
          <span key={i} className={`text-3xl ${i < stars ? '⭐' : '☆'}`}>
            {i < stars ? '⭐' : '☆'}
          </span>
        ))}
      </div>
      <p className="text-gray-300 text-sm mt-2">{intensity.toFixed(1)} / 5.0</p>
    </div>
  );
};

/**
 * MVP Card
 */
interface MVPCardProps {
  mvp: any;
}

const MVPCard: React.FC<MVPCardProps> = ({ mvp }) => {
  return (
    <div className="bg-gradient-to-r from-amber-900/50 to-yellow-900/50 rounded-2xl p-8 mb-8 border-2 border-yellow-500/50 shadow-xl">
      <div className="text-center">
        <p className="text-yellow-200 text-sm font-bold uppercase tracking-wider mb-2">
          👑 Player of the Match
        </p>
        <h3 className="text-4xl md:text-5xl font-bold text-white mb-2">
          {mvp.playerName}
        </h3>
        <p className="text-yellow-200 text-lg font-semibold mb-4">
          {mvp.position}
        </p>
        <div className="flex justify-center gap-6 text-center">
          <div>
            <p className="text-yellow-400 text-2xl font-bold">{mvp.goals}</p>
            <p className="text-gray-300 text-sm">Goals</p>
          </div>
          <div className="w-px bg-yellow-500/30"></div>
          <div>
            <p className="text-yellow-400 text-2xl font-bold">{mvp.assists}</p>
            <p className="text-gray-300 text-sm">Assists</p>
          </div>
          <div className="w-px bg-yellow-500/30"></div>
          <div>
            <p className="text-yellow-400 text-2xl font-bold">{mvp.shots}</p>
            <p className="text-gray-300 text-sm">Shots</p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Top Scorers Card
 */
interface TopScorersProps {
  scorers: any[];
}

const TopScorersCard: React.FC<TopScorersProps> = ({ scorers }) => {
  return (
    <div className="bg-gradient-to-br from-red-900/30 to-orange-900/30 rounded-xl border border-red-500/30 p-6">
      <h3 className="text-xl font-bold text-red-200 mb-4 flex items-center gap-2">
        <span>⚽</span> Top Scorers
      </h3>
      <div className="space-y-3">
        {scorers.length > 0 ? (
          scorers.map((scorer, idx) => (
            <div key={idx} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-gray-400">#{idx + 1}</span>
                <div>
                  <p className="text-white font-semibold">{scorer.playerName}</p>
                  <p className="text-xs text-gray-400">{scorer.position}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-red-400 font-bold text-lg">{scorer.goals}⚽</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-center py-4">No goals scored</p>
        )}
      </div>
    </div>
  );
};

/**
 * Top Playmakers Card
 */
interface TopPlaymakersProps {
  playmakers: Array<{ player: string; assists: number }>;
}

const TopPlaymakersCard: React.FC<TopPlaymakersProps> = ({ playmakers }) => {
  return (
    <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-xl border border-green-500/30 p-6">
      <h3 className="text-xl font-bold text-green-200 mb-4 flex items-center gap-2">
        <span>🎯</span> Top Playmakers
      </h3>
      <div className="space-y-3">
        {playmakers.length > 0 ? (
          playmakers.map((maker, idx) => (
            <div key={idx} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-gray-400">#{idx + 1}</span>
                <p className="text-white font-semibold">{maker.player}</p>
              </div>
              <div className="text-right">
                <p className="text-green-400 font-bold text-lg">{maker.assists}⭐</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-center py-4">No assists recorded</p>
        )}
      </div>
    </div>
  );
};

/**
 * Team Comparison
 */
interface TeamComparisonProps {
  homeStats: MatchStats['homeTeam'];
  awayStats: MatchStats['awayTeam'];
}

const TeamComparison: React.FC<TeamComparisonProps> = ({ homeStats, awayStats }) => {
  const stats = [
    { label: 'Possession', home: homeStats.possession, away: awayStats.possession, unit: '%' },
    { label: 'Shots', home: homeStats.shots, away: awayStats.shots, unit: '' },
    { label: 'On Target', home: homeStats.shotsOnTarget, away: awayStats.shotsOnTarget, unit: '' },
    { label: 'Passes', home: homeStats.passes, away: awayStats.passes, unit: '' },
    { label: 'Tackles', home: homeStats.tackles, away: awayStats.tackles, unit: '' },
    { label: 'Fouls', home: homeStats.fouls, away: awayStats.fouls, unit: '' },
  ];

  return (
    <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl border border-blue-500/30 p-6 mb-8">
      <h3 className="text-xl font-bold text-white mb-6">Team Comparison</h3>
      <div className="space-y-4">
        {stats.map((stat, idx) => {
          const max = Math.max(stat.home, stat.away);
          const homePercent = (stat.home / max) * 100;
          const awayPercent = (stat.away / max) * 100;
          return (
            <div key={idx}>
              <div className="flex justify-between text-sm text-gray-300 mb-1">
                <span className="text-yellow-300">{stat.home}{stat.unit}</span>
                <span className="text-gray-400">{stat.label}</span>
                <span className="text-cyan-300">{stat.away}{stat.unit}</span>
              </div>
              <div className="flex gap-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="bg-yellow-500 transition-all"
                  style={{ width: `${homePercent}%` }}
                ></div>
                <div
                  className="bg-cyan-500 transition-all"
                  style={{ width: `${awayPercent}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Match Highlights Timeline
 */
interface MatchHighlightsProps {
  highlights: MatchHighlight[];
}

const MatchHighlights: React.FC<MatchHighlightsProps> = ({ highlights }) => {
  return (
    <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl border border-blue-500/30 p-6 mb-8">
      <h3 className="text-xl font-bold text-white mb-6">⏱️ Match Timeline</h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {highlights.map((highlight, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-4 p-3 rounded-lg ${
              highlight.team === 'home'
                ? 'bg-yellow-900/20 border-l-2 border-yellow-500'
                : 'bg-cyan-900/20 border-l-2 border-cyan-500'
            }`}
          >
            <div className="text-white font-bold text-sm min-w-12">{highlight.minute}'</div>
            <div className="flex-1">
              <p className="text-white text-sm font-medium">{highlight.description}</p>
            </div>
            <div className="text-lg">
              {highlight.type === 'goal' && '⚽'}
              {highlight.type === 'card' && '🟨'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Detailed Stats Panel
 */
interface DetailedStatsPanelProps {
  teamName: string;
  teamColor: string;
  stats: MatchStats['homeTeam'];
  isWinner: boolean;
}

const DetailedStatsPanel: React.FC<DetailedStatsPanelProps> = ({
  teamName,
  teamColor,
  stats,
  isWinner,
}) => {
  const statGroups = [
    {
      title: 'Attacking',
      stats: [
        { label: 'Goals', value: stats.goals },
        { label: 'Assists', value: stats.assists },
        { label: 'Shots', value: stats.shots },
        { label: 'On Target', value: stats.shotsOnTarget },
      ],
    },
    {
      title: 'Possession',
      stats: [
        { label: 'Possession', value: `${stats.possession}%` },
        { label: 'Passes', value: stats.passes },
        { label: 'Accuracy', value: `${stats.passAccuracy}%` },
      ],
    },
    {
      title: 'Defending',
      stats: [
        { label: 'Tackles', value: stats.tackles },
        { label: 'Fouls', value: stats.fouls },
        { label: 'Yellow Cards', value: stats.yellowCards },
        { label: 'Red Cards', value: stats.redCards },
      ],
    },
  ];

  return (
    <div className={`bg-gradient-to-br ${teamColor} rounded-xl border border-white/20 p-6`}>
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        {isWinner && <span className="text-2xl">👑</span>}
        {teamName}
      </h3>
      <div className="space-y-6">
        {statGroups.map((group, groupIdx) => (
          <div key={groupIdx}>
            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
              {group.title}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {group.stats.map((stat, idx) => (
                <div key={idx} className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
