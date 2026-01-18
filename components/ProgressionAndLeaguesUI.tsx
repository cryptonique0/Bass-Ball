/**
 * Progression & Leagues UI Components
 * React components for displaying progression, levels, tiers, badges, and league standings
 */

import React, { useMemo } from 'react';
import { PlayerProgression, ProgressionBadge, ProgressionManager } from '@/lib/progressionSystem';
import {
  DivisionStanding,
  Division,
  LeagueManager,
  League,
} from '@/lib/leaguesAndDivisions';

/**
 * Progress bar component
 */
interface ProgressBarProps {
  current: number;
  target: number;
  color?: string;
  height?: string;
  showLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  target,
  color = 'bg-blue-500',
  height = 'h-2',
  showLabel = false,
}) => {
  const percentage = Math.min(100, (current / target) * 100);

  return (
    <div className="w-full">
      <div className={`w-full bg-gray-700 rounded-full overflow-hidden ${height}`}>
        <div
          className={`${color} h-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="text-xs text-gray-400 mt-1">
          {current} / {target}
        </div>
      )}
    </div>
  );
};

/**
 * Level badge component
 */
interface LevelBadgeProps {
  level: number;
  tier: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LevelBadge: React.FC<LevelBadgeProps> = ({ level, tier, size = 'md' }) => {
  const tierColors: Record<string, string> = {
    bronze: 'from-amber-900 to-amber-700',
    silver: 'from-gray-400 to-gray-300',
    gold: 'from-yellow-500 to-yellow-400',
    platinum: 'from-cyan-400 to-blue-300',
    diamond: 'from-pink-400 to-purple-400',
    master: 'from-red-500 to-orange-500',
  };

  const sizeClasses = {
    sm: 'w-12 h-12 text-xs',
    md: 'w-16 h-16 text-sm',
    lg: 'w-24 h-24 text-lg',
  };

  const bgGradient = tierColors[tier] || tierColors.bronze;

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${bgGradient} flex items-center justify-center flex-col font-bold text-white shadow-lg`}
    >
      <div>Lvl</div>
      <div className="text-lg">{level}</div>
    </div>
  );
};

/**
 * Achievement badge component
 */
interface AchievementBadgeProps {
  badge: ProgressionBadge;
  unlocked?: boolean;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  badge,
  unlocked = true,
}) => {
  const rarityColors: Record<string, string> = {
    common: 'border-gray-400',
    uncommon: 'border-green-400',
    rare: 'border-blue-400',
    epic: 'border-purple-500',
    legendary: 'border-yellow-400',
  };

  return (
    <div
      className={`flex flex-col items-center gap-1 p-2 rounded-lg ${
        unlocked
          ? `bg-gray-700 border-2 ${rarityColors[badge.rarity]}`
          : 'bg-gray-900 border-2 border-gray-600 opacity-50'
      }`}
      title={badge.description}
    >
      <div className="text-3xl">{badge.icon}</div>
      <div className="text-xs font-bold text-center text-white max-w-12 truncate">
        {badge.name}
      </div>
    </div>
  );
};

/**
 * Progression card - main display for player progression
 */
interface ProgressionCardProps {
  progression: PlayerProgression;
}

export const ProgressionCard: React.FC<ProgressionCardProps> = ({ progression }) => {
  const progressionMgr = ProgressionManager.getInstance();
  const allBadges = useMemo(() => progressionMgr.getAllBadges(), [progressionMgr]);

  const xpPercentage = Math.min(100, (progression.currentXP / progression.xpToNextLevel) * 100);
  const nextTier = useMemo(
    () => progressionMgr.getNextTierRequirements(progression.progressionId),
    [progressionMgr, progression.progressionId]
  );

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-4">
      {/* Header with level and tier */}
      <div className="flex items-center gap-4">
        <LevelBadge level={progression.currentLevel} tier={progression.currentTier} size="lg" />
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-white">{progression.entityName}</h3>
          <p className="text-gray-400 text-sm">
            {progression.entityType === 'player' ? 'Player' : 'Team'} Progression
          </p>
          <div className="text-sm text-gray-300 mt-2">
            <span className="font-bold text-yellow-400">{progression.totalXP.toLocaleString()}</span>{' '}
            Total XP
          </div>
        </div>
      </div>

      {/* XP Bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>XP to Next Level</span>
          <span>
            {progression.currentXP} / {progression.xpToNextLevel}
          </span>
        </div>
        <ProgressBar
          current={progression.currentXP}
          target={progression.xpToNextLevel}
          color="bg-blue-500"
        />
      </div>

      {/* Tier Progress */}
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Tier Progress</span>
          <span>{Math.round(progression.tierProgress)}%</span>
        </div>
        <ProgressBar
          current={Math.round(progression.tierProgress)}
          target={100}
          color="bg-purple-500"
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-700 rounded p-3">
          <div className="text-gray-400 text-xs mb-1">Win Rate</div>
          <div className="text-xl font-bold text-blue-400">
            {Math.round(progression.winRate)}%
          </div>
        </div>
        <div className="bg-gray-700 rounded p-3">
          <div className="text-gray-400 text-xs mb-1">Consistency</div>
          <div className="text-xl font-bold text-green-400">
            {Math.round(progression.consistencyScore)}%
          </div>
        </div>
        <div className="bg-gray-700 rounded p-3">
          <div className="text-gray-400 text-xs mb-1">Goals / Assists</div>
          <div className="text-xl font-bold text-red-400">
            {progression.goalsScored} / {progression.assists}
          </div>
        </div>
        <div className="bg-gray-700 rounded p-3">
          <div className="text-gray-400 text-xs mb-1">Current Streak</div>
          <div className="text-xl font-bold text-yellow-400">
            {progression.streak}
            {progression.streak > 0 ? ' 🔥' : ''}
          </div>
        </div>
      </div>

      {/* Next tier info */}
      {nextTier && (
        <div className="bg-purple-900 bg-opacity-30 border border-purple-500 rounded p-3">
          <div className="text-sm text-purple-300">
            <span className="font-bold">Next Tier: {nextTier.tier.toUpperCase()}</span>
            <div className="text-xs text-purple-400 mt-1">
              Requires Level {nextTier.minLevel} ({progression.currentLevel} / {nextTier.minLevel})
            </div>
          </div>
        </div>
      )}

      {/* Achievements */}
      {progression.achievedBadges.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-white mb-3">Achievements</h4>
          <div className="flex flex-wrap gap-3">
            {progression.achievedBadges.map((badgeId) => {
              const badge = allBadges.find((b) => b.badgeId === badgeId);
              return badge ? (
                <AchievementBadge key={badgeId} badge={badge} unlocked={true} />
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Leaderboard - display top progressions
 */
interface LeaderboardProps {
  progressions: PlayerProgression[];
  limit?: number;
}

export const ProgressionLeaderboard: React.FC<LeaderboardProps> = ({
  progressions,
  limit = 10,
}) => {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
      <div className="bg-gray-900 px-6 py-4 border-b border-gray-700">
        <h3 className="text-xl font-bold text-white">🏆 Top Progressions</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-700 text-gray-300 text-sm">
            <tr>
              <th className="px-6 py-3 text-left">Rank</th>
              <th className="px-6 py-3 text-left">Entity</th>
              <th className="px-6 py-3 text-center">Level</th>
              <th className="px-6 py-3 text-center">Tier</th>
              <th className="px-6 py-3 text-right">Total XP</th>
              <th className="px-6 py-3 text-center">Matches</th>
              <th className="px-6 py-3 text-center">Win Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {progressions.slice(0, limit).map((prog, index) => (
              <tr key={prog.progressionId} className="hover:bg-gray-700 transition">
                <td className="px-6 py-4">
                  <span className="font-bold text-lg">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-white">{prog.entityName}</div>
                  <div className="text-xs text-gray-400">
                    {prog.entityType === 'player' ? '👤 Player' : '⚽ Team'}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-lg font-bold text-blue-400">{prog.currentLevel}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-xs font-bold uppercase px-2 py-1 bg-gray-700 rounded">
                    {prog.currentTier}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="font-bold text-yellow-400">
                    {prog.totalXP.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-gray-300">{prog.matchesPlayed}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-green-400 font-bold">
                    {Math.round(prog.winRate)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * Division standings component
 */
interface DivisionStandingsProps {
  standings: DivisionStanding[];
  division?: Division;
}

export const DivisionStandings: React.FC<DivisionStandingsProps> = ({
  standings,
  division,
}) => {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
      <div className="bg-gray-900 px-6 py-4 border-b border-gray-700">
        <h3 className="text-xl font-bold text-white">
          {division?.name || 'Division'} Standings
        </h3>
        {division && (
          <p className="text-sm text-gray-400">
            {division.level} level • Tier {division.tier}
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-700 text-gray-300 text-sm">
            <tr>
              <th className="px-6 py-3 text-left">Pos</th>
              <th className="px-6 py-3 text-left">Team</th>
              <th className="px-6 py-3 text-center">P</th>
              <th className="px-6 py-3 text-center">W</th>
              <th className="px-6 py-3 text-center">D</th>
              <th className="px-6 py-3 text-center">L</th>
              <th className="px-6 py-3 text-center">GF</th>
              <th className="px-6 py-3 text-center">GA</th>
              <th className="px-6 py-3 text-center">GD</th>
              <th className="px-6 py-3 text-right">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {standings.map((standing) => (
              <tr
                key={standing.standingId}
                className={`hover:bg-gray-700 transition ${
                  standing.position === 1 ? 'bg-green-900 bg-opacity-20' : ''
                } ${
                  division &&
                  standing.position >
                    standings.length - division.relegationPlaces
                    ? 'bg-red-900 bg-opacity-20'
                    : ''
                }`}
              >
                <td className="px-6 py-4">
                  <span className="font-bold text-lg">{standing.position}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-white">{standing.teamName}</div>
                  <div className="text-xs text-gray-400">
                    {standing.currentForm.join('')}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">{standing.matchesPlayed}</td>
                <td className="px-6 py-4 text-center">
                  <span className="text-green-400 font-bold">{standing.wins}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-blue-400 font-bold">{standing.draws}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-red-400 font-bold">{standing.losses}</span>
                </td>
                <td className="px-6 py-4 text-center">{standing.goalsFor}</td>
                <td className="px-6 py-4 text-center">{standing.goalsAgainst}</td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={
                      standing.goalDifference > 0
                        ? 'text-green-400 font-bold'
                        : standing.goalDifference < 0
                          ? 'text-red-400 font-bold'
                          : 'text-gray-400'
                    }
                  >
                    {standing.goalDifference > 0 ? '+' : ''}
                    {standing.goalDifference}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="font-bold text-lg text-yellow-400">
                    {standing.points}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {division && (
        <div className="px-6 py-4 bg-gray-700 text-xs text-gray-300">
          🟢 {division.promotionPlaces} teams promoted • 🔴 {division.relegationPlaces} teams
          relegated
        </div>
      )}
    </div>
  );
};

/**
 * League selector component
 */
interface LeagueSelectorProps {
  leagues: League[];
  selectedLeagueId?: string;
  onSelectLeague?: (leagueId: string) => void;
}

export const LeagueSelector: React.FC<LeagueSelectorProps> = ({
  leagues,
  selectedLeagueId,
  onSelectLeague,
}) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 space-y-3">
      <h3 className="text-lg font-bold text-white">⚽ Leagues</h3>
      <div className="space-y-2">
        {leagues.map((league) => (
          <button
            key={league.leagueId}
            onClick={() => onSelectLeague?.(league.leagueId)}
            className={`w-full p-3 rounded-lg text-left transition ${
              selectedLeagueId === league.leagueId
                ? 'bg-blue-600 border border-blue-500'
                : 'bg-gray-700 hover:bg-gray-600 border border-gray-600'
            }`}
          >
            <div className="font-bold text-white">{league.name}</div>
            <div className="text-sm text-gray-300">
              {league.divisions.length} divisions • {league.totalTeams} teams
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {league.status.charAt(0).toUpperCase() + league.status.slice(1)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
