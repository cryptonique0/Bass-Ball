'use client';

/**
 * TeamSelector Enhancement Guide
 * 
 * This file shows how to integrate RewardsAndChallenges into an existing TeamSelector component.
 * Copy relevant sections into your TeamSelector component.
 */

import React, { useState } from 'react';
import { RewardManager } from '@/lib/rewardSystem';
import { ChallengeManager } from '@/lib/challengeSystem';
import { Gift, Target, AlertCircle } from 'lucide-react';

/**
 * Integration 1: Add Reward Badge to Team Card
 * 
 * Add this to your existing TeamCard component:
 */
export function TeamCardEnhancement({ teamId, teamName }: { teamId: string; teamName: string }) {
  const [pendingCount, setPendingCount] = React.useState(0);
  const rewardMgr = RewardManager.getInstance();

  React.useEffect(() => {
    const pending = rewardMgr.getPendingClaims(teamId);
    setPendingCount(pending.length);
  }, [teamId]);

  return (
    <div className="relative">
      {/* Existing team card content */}
      <div className="p-4 bg-gradient-to-br from-blue-900 to-blue-950 rounded-lg border border-blue-700">
        <h3 className="font-bold text-white">{teamName}</h3>
        
        {/* Add this reward badge */}
        {pendingCount > 0 && (
          <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded text-yellow-400 text-xs font-bold">
            <Gift className="w-3 h-3" />
            {pendingCount} Rewards
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Integration 2: Add Challenge Progress Preview
 * 
 * Add this to show active challenges summary:
 */
export function ChallengePreview({
  teamId,
  season,
}: {
  teamId: string;
  season: string;
}) {
  const [activeChallenges, setActiveChallenges] = React.useState(0);
  const challengeMgr = ChallengeManager.getInstance();

  React.useEffect(() => {
    const daily = challengeMgr.getActiveChallengesForPlayer(teamId, season, 'daily').length;
    const weekly = challengeMgr.getActiveChallengesForPlayer(teamId, season, 'weekly').length;
    setActiveChallenges(daily + weekly);
  }, [teamId, season]);

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-blue-900/40 rounded border border-blue-700/50">
      <Target className="w-4 h-4 text-blue-400" />
      <span className="text-sm text-blue-300">
        {activeChallenges} Active Challenge{activeChallenges !== 1 ? 's' : ''}
      </span>
    </div>
  );
}

/**
 * Integration 3: Add Cosmetic Inventory Preview
 * 
 * Show a preview of the team's cosmetics:
 */
export function CosmeticPreview({
  teamId,
}: {
  teamId: string;
}) {
  const [cosmetics, setCosmetics] = React.useState<any[]>([]);
  const rewardMgr = RewardManager.getInstance();

  React.useEffect(() => {
    const inventory = rewardMgr.getInventory(teamId);
    setCosmetics(inventory.slice(0, 3)); // Show first 3
  }, [teamId]);

  if (cosmetics.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-bold text-purple-400 uppercase">Cosmetics</h4>
      <div className="flex gap-2">
        {cosmetics.map((c) => (
          <div
            key={c.cosmeticId}
            className="px-2 py-1 bg-purple-900/30 rounded border border-purple-700/50 text-xs text-purple-300"
            title={c.name}
          >
            ✨ {c.type}
          </div>
        ))}
        {rewardMgr.getInventory(teamId).length > 3 && (
          <div className="px-2 py-1 bg-gray-700/30 rounded border border-gray-600/50 text-xs text-gray-400">
            +{rewardMgr.getInventory(teamId).length - 3} more
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Integration 4: Full Team Summary with Rewards/Challenges
 * 
 * Use this component to show complete team status:
 */
export function TeamSummaryWithRewards({
  teamId,
  teamName,
  season,
}: {
  teamId: string;
  teamName: string;
  season: string;
}) {
  const [rewardStats, setRewardStats] = React.useState<any>(null);
  const [challengeStats, setChallengeStats] = React.useState<any>(null);
  const rewardMgr = RewardManager.getInstance();
  const challengeMgr = ChallengeManager.getInstance();

  React.useEffect(() => {
    const rewards = rewardMgr.getTotalSeasonRewards(teamId, season);
    setRewardStats(rewards);

    const stats = challengeMgr.getCompletionStats(teamId, season);
    setChallengeStats(stats);
  }, [teamId, season]);

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-lg border border-slate-700 p-4 space-y-4">
      {/* Team Name */}
      <div>
        <h3 className="font-bold text-lg text-white">{teamName}</h3>
        <p className="text-xs text-gray-500">Season {season}</p>
      </div>

      {/* Reward Stats */}
      {rewardStats && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-yellow-900/30 rounded p-2 border border-yellow-700/50">
            <div className="text-xs text-yellow-400 font-bold">{rewardStats.totalXP}</div>
            <div className="text-xs text-yellow-600">XP</div>
          </div>
          <div className="bg-blue-900/30 rounded p-2 border border-blue-700/50">
            <div className="text-xs text-blue-400 font-bold">{rewardStats.totalTokens}</div>
            <div className="text-xs text-blue-600">Tokens</div>
          </div>
          <div className="bg-purple-900/30 rounded p-2 border border-purple-700/50">
            <div className="text-xs text-purple-400 font-bold">{rewardStats.totalCosmetics}</div>
            <div className="text-xs text-purple-600">Cosmetics</div>
          </div>
        </div>
      )}

      {/* Challenge Stats */}
      {challengeStats && (
        <div>
          <div className="text-xs font-bold text-gray-400 uppercase mb-2">Challenge Progress</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Completed</span>
              <span className="text-white font-bold">{challengeStats.totalCompleted}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Daily Completed</span>
              <span className="text-blue-400">{challengeStats.dailyCompleted}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Weekly Completed</span>
              <span className="text-indigo-400">{challengeStats.weeklyCompleted}</span>
            </div>
            {challengeStats.streakDays > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-400">Current Streak</span>
                <span className="text-orange-400">🔥 {challengeStats.streakDays} days</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700">
        <button className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 rounded text-blue-400 text-xs font-semibold transition-colors">
          View Rewards
        </button>
        <button className="px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/50 rounded text-indigo-400 text-xs font-semibold transition-colors">
          View Challenges
        </button>
      </div>
    </div>
  );
}

/**
 * Integration 5: Enhanced Team Selector with Tabs
 * 
 * Replace your current TeamSelector with this enhanced version:
 */
export function EnhancedTeamSelector({
  selectedTeamId,
  onSelectTeam,
  season,
}: {
  selectedTeamId?: string;
  onSelectTeam: (teamId: string) => void;
  season: string;
}) {
  const [showRewardsPanel, setShowRewardsPanel] = React.useState(false);
  const [teams] = React.useState<any[]>([
    { id: 'team_1', name: 'Team A' },
    { id: 'team_2', name: 'Team B' },
    // ... load from your data
  ]);

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Team List */}
      <div className="col-span-3 space-y-2">
        <h3 className="text-sm font-bold text-white">Teams</h3>
        {teams.map((team) => (
          <button
            key={team.id}
            onClick={() => {
              onSelectTeam(team.id);
              setShowRewardsPanel(true);
            }}
            className={`w-full p-3 rounded-lg border transition-colors ${
              selectedTeamId === team.id
                ? 'bg-blue-900/50 border-blue-500 text-white'
                : 'bg-slate-800/50 border-slate-700 text-gray-400 hover:text-gray-300'
            }`}
          >
            <div className="text-left">
              <div className="font-semibold">{team.name}</div>
              <RewardBadgeSmall teamId={team.id} />
            </div>
          </button>
        ))}
      </div>

      {/* Selected Team Details */}
      {selectedTeamId && (
        <div className="col-span-9">
          <TeamSummaryWithRewards
            teamId={selectedTeamId}
            teamName={teams.find((t) => t.id === selectedTeamId)?.name || 'Team'}
            season={season}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Integration 6: Small Reward Badge Component
 * 
 * Use this in list items for a compact reward indicator:
 */
export function RewardBadgeSmall({ teamId }: { teamId: string }) {
  const [pendingCount, setPendingCount] = React.useState(0);
  const rewardMgr = RewardManager.getInstance();

  React.useEffect(() => {
    const pending = rewardMgr.getPendingClaims(teamId);
    setPendingCount(pending.length);
  }, [teamId]);

  if (pendingCount === 0) return null;

  return (
    <div className="mt-1 inline-flex items-center gap-0.5 px-2 py-0.5 bg-red-500/20 border border-red-500/30 rounded text-red-400 text-xs font-bold">
      <Gift className="w-2.5 h-2.5" />
      {pendingCount}
    </div>
  );
}

/**
 * Integration 7: Season Status Banner
 * 
 * Show current season and upcoming reset:
 */
export function SeasonStatusBanner({
  season,
}: {
  season: string;
}) {
  const [info, setInfo] = React.useState<any>(null);
  const seasonMgr = React.useContext(SeasonManagerContext) as any; // Your context

  React.useEffect(() => {
    const s = seasonMgr?.getSeasonById(season);
    if (s) {
      setInfo({
        name: s.seasonName,
        resetDate: new Date(s.resetDate || 0),
        daysUntilReset: Math.ceil(
          (new Date(s.resetDate || 0).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        ),
      });
    }
  }, [season]);

  if (!info) return null;

  return (
    <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-700/50 rounded-lg p-3">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-bold text-white text-sm">{info.name}</h4>
          <p className="text-xs text-gray-400">
            {info.daysUntilReset > 0
              ? `Season resets in ${info.daysUntilReset} days`
              : 'Season ended'}
          </p>
        </div>
        {info.daysUntilReset <= 3 && info.daysUntilReset > 0 && (
          <div className="flex items-center gap-1 text-orange-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs font-bold">Final Days!</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * USAGE EXAMPLE:
 * 
 * In your TeamSelector page:
 * 
 * import { EnhancedTeamSelector } from '@/components/TeamSelectorEnhancements';
 * 
 * export function TeamsPage() {
 *   const [selectedTeamId, setSelectedTeamId] = useState('team_1');
 *   
 *   return (
 *     <div className="space-y-4">
 *       <SeasonStatusBanner season="season_1" />
 *       <EnhancedTeamSelector
 *         selectedTeamId={selectedTeamId}
 *         onSelectTeam={setSelectedTeamId}
 *         season="season_1"
 *       />
 *     </div>
 *   );
 * }
 */

// Placeholder for context - replace with your actual context
const SeasonManagerContext = React.createContext(null);
