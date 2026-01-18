'use client';

import React, { useMemo } from 'react';
import { Team } from '@/lib/gameEngine';
import { MatchStats } from '@/lib/matchEngine';

interface TeamStatsComparisonProps {
  homeTeam: Team;
  awayTeam: Team;
  matchStats: MatchStats;
  onClose?: () => void;
}

/**
 * Team Statistics Comparison Component
 * Displays comprehensive statistics comparison between home and away teams
 */
export function TeamStatsComparison({
  homeTeam,
  awayTeam,
  matchStats,
  onClose,
}: TeamStatsComparisonProps) {
  const stats = useMemo(() => {
    return [
      {
        label: 'Goals',
        home: matchStats.homeTeam.goals,
        away: matchStats.awayTeam.goals,
        icon: '⚽',
      },
      {
        label: 'Shots',
        home: matchStats.homeTeam.shots,
        away: matchStats.awayTeam.shots,
        icon: '🎯',
      },
      {
        label: 'Shots on Target',
        home: matchStats.homeTeam.shotsOnTarget,
        away: matchStats.awayTeam.shotsOnTarget,
        icon: '🎪',
      },
      {
        label: 'Possession %',
        home: Math.round(matchStats.homeTeam.possession),
        away: Math.round(matchStats.awayTeam.possession),
        icon: '🔵',
        max: 100,
      },
      {
        label: 'Passes',
        home: matchStats.homeTeam.passes,
        away: matchStats.awayTeam.passes,
        icon: '🔀',
      },
      {
        label: 'Pass Accuracy %',
        home: Math.round(matchStats.homeTeam.passAccuracy),
        away: Math.round(matchStats.awayTeam.passAccuracy),
        icon: '✓',
        max: 100,
      },
      {
        label: 'Tackles',
        home: matchStats.homeTeam.tackles,
        away: matchStats.awayTeam.tackles,
        icon: '🛡️',
      },
      {
        label: 'Fouls',
        home: matchStats.homeTeam.fouls,
        away: matchStats.awayTeam.fouls,
        icon: '⚠️',
      },
      {
        label: 'Yellow Cards',
        home: matchStats.homeTeam.yellowCards,
        away: matchStats.awayTeam.yellowCards,
        icon: '🟨',
      },
      {
        label: 'Red Cards',
        home: matchStats.homeTeam.redCards,
        away: matchStats.awayTeam.redCards,
        icon: '🟥',
      },
      {
        label: 'Assists',
        home: matchStats.homeTeam.assists,
        away: matchStats.awayTeam.assists,
        icon: '🤝',
      },
    ];
  }, [matchStats]);

  const teamStrengths = useMemo(() => {
    const homeStrength = calculateTeamStrength(homeTeam);
    const awayStrength = calculateTeamStrength(awayTeam);
    return { home: homeStrength, away: awayStrength };
  }, [homeTeam, awayTeam]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-gray-900 rounded-xl max-w-6xl w-full border-2 border-yellow-500 my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-600 via-yellow-500 to-orange-600 p-6 flex items-center justify-between sticky top-0 rounded-t-lg">
          <div>
            <h2 className="text-3xl font-bold text-white">Team Statistics Comparison</h2>
            <p className="text-yellow-100 mt-1">Detailed match analytics and team performance metrics</p>
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

        <div className="p-6">
          {/* Team Headers */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-1">{homeTeam.name}</h3>
              <div className="text-sm text-gray-400 mb-2">{homeTeam.formation}</div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-900 bg-opacity-50 rounded-full">
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <span className="text-yellow-300 text-sm font-semibold">Home</span>
              </div>
            </div>

            <div className="text-center flex flex-col items-center justify-center">
              <div className="text-sm text-gray-500 mb-2">Overall Strength</div>
              <div className="inline-block px-4 py-2 bg-gray-800 rounded-lg">
                <span className="text-gray-300">Avg Rating: </span>
                <span className="text-xl font-bold text-white">
                  {(
                    (teamStrengths.home + teamStrengths.away) /
                    2
                  ).toFixed(1)}
                </span>
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-1">{awayTeam.name}</h3>
              <div className="text-sm text-gray-400 mb-2">{awayTeam.formation}</div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-900 bg-opacity-50 rounded-full">
                <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                <span className="text-cyan-300 text-sm font-semibold">Away</span>
              </div>
            </div>
          </div>

          {/* Squad Overview */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <SquadOverview team={homeTeam} isHome={true} />
            <div></div>
            <SquadOverview team={awayTeam} isHome={false} />
          </div>

          {/* Statistics Grid */}
          <div className="space-y-4 mb-8">
            <h3 className="text-xl font-bold text-white">Match Statistics</h3>

            <div className="grid gap-4">
              {stats.map((stat, index) => (
                <StatComparison
                  key={index}
                  label={stat.label}
                  home={stat.home}
                  away={stat.away}
                  icon={stat.icon}
                  max={stat.max}
                />
              ))}
            </div>
          </div>

          {/* Performance Categories */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <PerformanceCategory
              title="Attacking"
              stats={[
                { label: 'Goals', home: matchStats.homeTeam.goals, away: matchStats.awayTeam.goals },
                { label: 'Shots', home: matchStats.homeTeam.shots, away: matchStats.awayTeam.shots },
                { label: 'On Target', home: matchStats.homeTeam.shotsOnTarget, away: matchStats.awayTeam.shotsOnTarget },
                { label: 'Assists', home: matchStats.homeTeam.assists, away: matchStats.awayTeam.assists },
              ]}
              color="red"
            />

            <PerformanceCategory
              title="Possession"
              stats={[
                { label: 'Possession %', home: Math.round(matchStats.homeTeam.possession), away: Math.round(matchStats.awayTeam.possession) },
                { label: 'Passes', home: matchStats.homeTeam.passes, away: matchStats.awayTeam.passes },
                { label: 'Pass Accuracy %', home: Math.round(matchStats.homeTeam.passAccuracy), away: Math.round(matchStats.awayTeam.passAccuracy) },
              ]}
              color="blue"
            />

            <PerformanceCategory
              title="Defending"
              stats={[
                { label: 'Tackles', home: matchStats.homeTeam.tackles, away: matchStats.awayTeam.tackles },
                { label: 'Fouls', home: matchStats.homeTeam.fouls, away: matchStats.awayTeam.fouls },
                { label: 'Yellow Cards', home: matchStats.homeTeam.yellowCards, away: matchStats.awayTeam.yellowCards },
                { label: 'Red Cards', home: matchStats.homeTeam.redCards, away: matchStats.awayTeam.redCards },
              ]}
              color="green"
            />
          </div>

          {/* Team Strength Analysis */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-lg border border-gray-700 mb-8">
            <h3 className="text-lg font-bold text-white mb-4">Team Strength Analysis</h3>

            <div className="grid grid-cols-2 gap-6">
              <TeamStrengthBar
                label={homeTeam.name}
                strength={teamStrengths.home}
                color="from-yellow-400 to-yellow-600"
                position="left"
              />
              <TeamStrengthBar
                label={awayTeam.name}
                strength={teamStrengths.away}
                color="from-cyan-400 to-cyan-600"
                position="right"
              />
            </div>

            <div className="mt-4 text-xs text-gray-400">
              <p>
                Strength calculated from average player attributes: pace, shooting, passing, dribbling, defense, and physical.
              </p>
            </div>
          </div>

          {/* Key Insights */}
          <KeyInsights
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            matchStats={matchStats}
          />

          {/* Close Button */}
          {onClose && (
            <div className="flex justify-center gap-4 mt-8 pt-6 border-t border-gray-700">
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
    </div>
  );
}

/**
 * Squad Overview Component
 */
function SquadOverview({ team, isHome }: { team: Team; isHome: boolean }) {
  const positions = useMemo(() => {
    return {
      GK: team.players.filter(p => p.position === 'GK').length,
      DEF: team.players.filter(p => p.position === 'DEF').length,
      MID: team.players.filter(p => p.position === 'MID').length,
      FWD: team.players.filter(p => p.position === 'FWD').length,
    };
  }, [team]);

  const borderColor = isHome ? 'border-yellow-600' : 'border-cyan-600';
  const bgColor = isHome ? 'bg-yellow-900 bg-opacity-20' : 'bg-cyan-900 bg-opacity-20';

  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg p-4`}>
      <h4 className="font-bold text-white mb-3 text-sm">Squad Composition</h4>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-gray-800 p-2 rounded text-center">
          <div className="text-gray-400 text-xs">GK</div>
          <div className="text-lg font-bold text-yellow-400">{positions.GK}</div>
        </div>
        <div className="bg-gray-800 p-2 rounded text-center">
          <div className="text-gray-400 text-xs">DEF</div>
          <div className="text-lg font-bold text-red-400">{positions.DEF}</div>
        </div>
        <div className="bg-gray-800 p-2 rounded text-center">
          <div className="text-gray-400 text-xs">MID</div>
          <div className="text-lg font-bold text-blue-400">{positions.MID}</div>
        </div>
        <div className="bg-gray-800 p-2 rounded text-center">
          <div className="text-gray-400 text-xs">FWD</div>
          <div className="text-lg font-bold text-green-400">{positions.FWD}</div>
        </div>
      </div>
      <div className="mt-3 text-xs text-gray-400 text-center">
        Total: {team.players.length} players
      </div>
    </div>
  );
}

/**
 * Stat Comparison Bar Component
 */
function StatComparison({
  label,
  home,
  away,
  icon,
  max = undefined,
}: {
  label: string;
  home: number;
  away: number;
  icon: string;
  max?: number;
}) {
  const maxValue = max || Math.max(home, away, 1);
  const homePercent = (home / maxValue) * 100;
  const awayPercent = (away / maxValue) * 100;
  const winner = home > away ? 'home' : away > home ? 'away' : 'draw';

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-white font-semibold text-sm">{label}</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className={`font-bold px-2 py-1 rounded ${winner === 'home' ? 'bg-yellow-900 text-yellow-300' : 'text-gray-400'}`}>
            {home}
          </span>
          <span className="text-gray-500">—</span>
          <span className={`font-bold px-2 py-1 rounded ${winner === 'away' ? 'bg-cyan-900 text-cyan-300' : 'text-gray-400'}`}>
            {away}
          </span>
        </div>
      </div>

      {/* Comparison Bars */}
      <div className="flex gap-2 items-center h-6">
        {/* Home Bar */}
        <div className="flex-1 bg-gray-900 rounded-full overflow-hidden h-full">
          <div
            className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-full transition-all duration-500 flex items-center justify-end pr-2"
            style={{ width: `${homePercent}%` }}
          >
            {homePercent > 20 && <span className="text-black text-xs font-bold">{homePercent.toFixed(0)}%</span>}
          </div>
        </div>

        {/* Away Bar */}
        <div className="flex-1 bg-gray-900 rounded-full overflow-hidden h-full">
          <div
            className="bg-gradient-to-l from-cyan-400 to-cyan-600 h-full transition-all duration-500 flex items-center justify-start pl-2"
            style={{ width: `${awayPercent}%` }}
          >
            {awayPercent > 20 && <span className="text-black text-xs font-bold">{awayPercent.toFixed(0)}%</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Performance Category Component
 */
function PerformanceCategory({
  title,
  stats,
  color,
}: {
  title: string;
  stats: Array<{ label: string; home: number; away: number }>;
  color: 'red' | 'blue' | 'green';
}) {
  const colorMap = {
    red: {
      bg: 'bg-red-900 bg-opacity-20',
      border: 'border-red-700',
      text: 'text-red-400',
      header: 'bg-red-900 bg-opacity-30',
    },
    blue: {
      bg: 'bg-blue-900 bg-opacity-20',
      border: 'border-blue-700',
      text: 'text-blue-400',
      header: 'bg-blue-900 bg-opacity-30',
    },
    green: {
      bg: 'bg-green-900 bg-opacity-20',
      border: 'border-green-700',
      text: 'text-green-400',
      header: 'bg-green-900 bg-opacity-30',
    },
  };

  const c = colorMap[color];

  return (
    <div className={`border ${c.border} ${c.bg} rounded-lg overflow-hidden`}>
      <div className={`${c.header} p-3 border-b ${c.border}`}>
        <h4 className={`font-bold ${c.text}`}>{title}</h4>
      </div>
      <div className="p-4 space-y-3">
        {stats.map((stat, idx) => (
          <div key={idx} className="text-sm">
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-300 text-xs">{stat.label}</span>
              <div className="flex gap-2">
                <span className="text-yellow-300 font-semibold">{stat.home}</span>
                <span className="text-gray-600">·</span>
                <span className="text-cyan-300 font-semibold">{stat.away}</span>
              </div>
            </div>
            <div className="flex gap-1 h-2">
              <div
                className="bg-yellow-500 rounded-full"
                style={{ flex: Math.max(stat.home, 1) }}
              ></div>
              <div
                className="bg-cyan-500 rounded-full"
                style={{ flex: Math.max(stat.away, 1) }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Team Strength Bar Component
 */
function TeamStrengthBar({
  label,
  strength,
  color,
  position,
}: {
  label: string;
  strength: number;
  color: string;
  position: 'left' | 'right';
}) {
  const maxStrength = 100;
  const percent = (strength / maxStrength) * 100;

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-white font-semibold text-sm">{label}</span>
        <span className="text-lg font-bold text-white">{strength.toFixed(1)}</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden border border-gray-700">
        <div
          className={`bg-gradient-to-r ${color} h-full transition-all duration-700`}
          style={{ width: `${percent}%` }}
        ></div>
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>0</span>
        <span>{maxStrength}</span>
      </div>
    </div>
  );
}

/**
 * Key Insights Component
 */
function KeyInsights({
  homeTeam,
  awayTeam,
  matchStats,
}: {
  homeTeam: Team;
  awayTeam: Team;
  matchStats: MatchStats;
}) {
  const insights = useMemo(() => {
    const result = [];

    // Possession insight
    const homePoss = matchStats.homeTeam.possession;
    const awayPoss = matchStats.awayTeam.possession;
    if (homePoss > awayPoss + 15) {
      result.push({
        icon: '🔵',
        text: `${homeTeam.name} dominates possession with ${Math.round(homePoss)}%`,
        team: 'home',
      });
    } else if (awayPoss > homePoss + 15) {
      result.push({
        icon: '🔵',
        text: `${awayTeam.name} dominates possession with ${Math.round(awayPoss)}%`,
        team: 'away',
      });
    }

    // Shots efficiency
    const homeSOT = matchStats.homeTeam.shotsOnTarget;
    const homeShots = matchStats.homeTeam.shots || 1;
    const homeEff = (homeSOT / homeShots) * 100;
    const awaySOT = matchStats.awayTeam.shotsOnTarget;
    const awayShots = matchStats.awayTeam.shots || 1;
    const awayEff = (awaySOT / awayShots) * 100;

    if (homeEff > awayEff + 20) {
      result.push({
        icon: '🎯',
        text: `${homeTeam.name} has superior shot accuracy (${homeEff.toFixed(0)}%)`,
        team: 'home',
      });
    } else if (awayEff > homeEff + 20) {
      result.push({
        icon: '🎯',
        text: `${awayTeam.name} has superior shot accuracy (${awayEff.toFixed(0)}%)`,
        team: 'away',
      });
    }

    // Defensive performance
    const homeTackles = matchStats.homeTeam.tackles;
    const awayTackles = matchStats.awayTeam.tackles;
    if (homeTackles > awayTackles + 5) {
      result.push({
        icon: '🛡️',
        text: `${homeTeam.name} has stronger defensive presence (${homeTackles} tackles)`,
        team: 'home',
      });
    } else if (awayTackles > homeTackles + 5) {
      result.push({
        icon: '🛡️',
        text: `${awayTeam.name} has stronger defensive presence (${awayTackles} tackles)`,
        team: 'away',
      });
    }

    // Discipline
    const homeCards = matchStats.homeTeam.yellowCards + matchStats.homeTeam.redCards;
    const awayCards = matchStats.awayTeam.yellowCards + matchStats.awayTeam.redCards;
    if (homeCards > awayCards + 2) {
      result.push({
        icon: '🟨',
        text: `${homeTeam.name} has received more disciplinary action (${homeCards} cards)`,
        team: 'home',
      });
    } else if (awayCards > homeCards + 2) {
      result.push({
        icon: '🟨',
        text: `${awayTeam.name} has received more disciplinary action (${awayCards} cards)`,
        team: 'away',
      });
    }

    return result.length > 0 ? result : [{ icon: '⚽', text: 'Match is evenly balanced', team: 'draw' as const }];
  }, [homeTeam, awayTeam, matchStats]);

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <h3 className="text-lg font-bold text-white mb-4">Key Insights</h3>
      <div className="space-y-3">
        {insights.map((insight, idx) => (
          <div key={idx} className="flex items-start gap-3 p-3 bg-gray-900 rounded-lg">
            <span className="text-xl flex-shrink-0">{insight.icon}</span>
            <div>
              <p className="text-gray-200 text-sm">
                {insight.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Calculate overall team strength based on player attributes
 */
function calculateTeamStrength(team: Team): number {
  if (team.players.length === 0) return 0;

  const totalStrength = team.players.reduce((sum, player) => {
    const strength =
      (player.pace +
        player.shooting +
        player.passing +
        player.dribbling +
        player.defense +
        player.physical) /
      6;
    return sum + strength;
  }, 0);

  return totalStrength / team.players.length;
}
