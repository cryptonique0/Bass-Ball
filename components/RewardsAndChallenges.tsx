'use client';

import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Target,
  Zap,
  Gift,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Award,
} from 'lucide-react';
import { RewardManager } from '@/lib/rewardSystem';
import { ChallengeManager } from '@/lib/challengeSystem';
import { ProgressionManager } from '@/lib/progressionSystem';
import { Reward, CosmeticNFT } from '@/lib/rewardSystem';
import { Challenge, ChallengeProgress } from '@/lib/challengeSystem';

interface Props {
  entityId: string;
  entityType: 'player' | 'team';
  entityName: string;
  season: string;
}

/**
 * Rewards and Challenges UI Component
 * Displays pending rewards, claimed rewards, and daily/weekly challenges
 */
export function RewardsAndChallenges({
  entityId,
  entityType,
  entityName,
  season,
}: Props) {
  const [activeTab, setActiveTab] = useState<'rewards' | 'challenges'>('rewards');
  const [pendingRewards, setPendingRewards] = useState<Reward[]>([]);
  const [claimedRewards, setClaimedRewards] = useState<Reward[]>([]);
  const [cosmetics, setCosmetics] = useState<CosmeticNFT[]>([]);
  const [dailyChallenges, setDailyChallenges] = useState<ChallengeProgress[]>([]);
  const [weeklyChallenges, setWeeklyChallenges] = useState<ChallengeProgress[]>([]);
  const [completionStats, setCompletionStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const rewardMgr = RewardManager.getInstance();
  const challengeMgr = ChallengeManager.getInstance();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [season]);

  const loadData = () => {
    setLoading(true);

    // Load rewards
    const pending = rewardMgr.getPendingClaims(entityId);
    setPendingRewards(pending);

    const claimed = rewardMgr.getClaimedRewards(entityId);
    setClaimedRewards(claimed);

    // Load cosmetics
    const inventory = rewardMgr.getInventory(entityId);
    setCosmetics(inventory);

    // Load challenges
    const daily = challengeMgr.getActiveChallengesForPlayer(entityId, season, 'daily');
    const weekly = challengeMgr.getActiveChallengesForPlayer(entityId, season, 'weekly');

    setDailyChallenges(daily);
    setWeeklyChallenges(weekly);

    // Load stats
    const stats = challengeMgr.getCompletionStats(entityId, season);
    setCompletionStats(stats);

    setLoading(false);
  };

  const handleClaimReward = (rewardId: string) => {
    // This would integrate with RewardManager's claimReward method
    console.log('Claiming reward:', rewardId);
    loadData();
  };

  const handleCompleteChallenge = (progressId: string, delta: number) => {
    challengeMgr.updateProgress(progressId, delta);
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-b from-slate-900 to-slate-950 rounded-lg border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-blue-900 px-6 py-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <h2 className="text-xl font-bold text-white">Rewards & Challenges</h2>
          </div>
          {completionStats && (
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <div className="text-gray-400">Total Completed</div>
                <div className="text-lg font-bold text-yellow-400">
                  {completionStats.totalCompleted}
                </div>
              </div>
              {completionStats.streakDays > 0 && (
                <div className="flex items-center gap-1 text-orange-400">
                  <Flame className="w-4 h-4" />
                  <span className="text-sm font-bold">{completionStats.streakDays} day streak</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        <button
          onClick={() => setActiveTab('rewards')}
          className={`flex-1 px-6 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'rewards'
              ? 'border-b-2 border-purple-500 text-purple-400 bg-slate-800/50'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Gift className="w-4 h-4" />
            Rewards
            {pendingRewards.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full font-bold">
                {pendingRewards.length}
              </span>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('challenges')}
          className={`flex-1 px-6 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'challenges'
              ? 'border-b-2 border-blue-500 text-blue-400 bg-slate-800/50'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Target className="w-4 h-4" />
            Challenges
            {dailyChallenges.length + weeklyChallenges.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full font-bold">
                {dailyChallenges.length + weeklyChallenges.length}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="p-6 min-h-96">
        {activeTab === 'rewards' ? (
          <RewardsTab
            pendingRewards={pendingRewards}
            claimedRewards={claimedRewards}
            cosmetics={cosmetics}
            onClaim={handleClaimReward}
          />
        ) : (
          <ChallengesTab
            dailyChallenges={dailyChallenges}
            weeklyChallenges={weeklyChallenges}
            challengeMgr={challengeMgr}
            onUpdate={handleCompleteChallenge}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Rewards Tab Component
 */
function RewardsTab({
  pendingRewards,
  claimedRewards,
  cosmetics,
  onClaim,
}: {
  pendingRewards: Reward[];
  claimedRewards: Reward[];
  cosmetics: CosmeticNFT[];
  onClaim: (rewardId: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Pending Rewards */}
      {pendingRewards.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-yellow-400 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pending Rewards ({pendingRewards.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingRewards.map((reward) => (
              <RewardCard
                key={reward.rewardId}
                reward={reward}
                onClaim={() => onClaim(reward.rewardId)}
                isPending={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Cosmetics Inventory */}
      {cosmetics.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-purple-400 mb-3 flex items-center gap-2">
            <Award className="w-4 h-4" />
            Cosmetics ({cosmetics.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {cosmetics.slice(0, 8).map((cosmetic) => (
              <CosmeticCard key={cosmetic.cosmeticId} cosmetic={cosmetic} />
            ))}
          </div>
          {cosmetics.length > 8 && (
            <p className="text-xs text-gray-500 mt-2">
              +{cosmetics.length - 8} more cosmetics
            </p>
          )}
        </div>
      )}

      {/* Claimed Rewards History */}
      {claimedRewards.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-green-400 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Claimed Rewards (Recent)
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {claimedRewards.slice(0, 5).map((reward) => (
              <div
                key={reward.rewardId}
                className="flex items-center justify-between p-2 bg-slate-800/50 rounded border border-slate-700/50 text-sm"
              >
                <span className="text-gray-300">{reward.description}</span>
                <span className="text-green-400 font-semibold">✓ Claimed</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingRewards.length === 0 && claimedRewards.length === 0 && cosmetics.length === 0 && (
        <div className="text-center py-12">
          <Gift className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No rewards yet. Complete challenges and win matches!</p>
        </div>
      )}
    </div>
  );
}

/**
 * Challenges Tab Component
 */
function ChallengesTab({
  dailyChallenges,
  weeklyChallenges,
  challengeMgr,
  onUpdate,
}: {
  dailyChallenges: ChallengeProgress[];
  weeklyChallenges: ChallengeProgress[];
  challengeMgr: any;
  onUpdate: (progressId: string, delta: number) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Daily Challenges */}
      {dailyChallenges.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-blue-400 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Daily Challenges
          </h3>
          <div className="space-y-3">
            {dailyChallenges.map((progress) => {
              const challenge = challengeMgr.getChallenge(progress.challengeId);
              return (
                challenge && (
                  <ChallengeCard
                    key={progress.progressId}
                    progress={progress}
                    challenge={challenge}
                    onUpdate={onUpdate}
                  />
                )
              );
            })}
          </div>
        </div>
      )}

      {/* Weekly Challenges */}
      {weeklyChallenges.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-indigo-400 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Weekly Challenges
          </h3>
          <div className="space-y-3">
            {weeklyChallenges.map((progress) => {
              const challenge = challengeMgr.getChallenge(progress.challengeId);
              return (
                challenge && (
                  <ChallengeCard
                    key={progress.progressId}
                    progress={progress}
                    challenge={challenge}
                    onUpdate={onUpdate}
                  />
                )
              );
            })}
          </div>
        </div>
      )}

      {dailyChallenges.length === 0 && weeklyChallenges.length === 0 && (
        <div className="text-center py-12">
          <Target className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No active challenges. Come back tomorrow!</p>
        </div>
      )}
    </div>
  );
}

/**
 * Individual Reward Card
 */
function RewardCard({
  reward,
  onClaim,
  isPending,
}: {
  reward: Reward;
  onClaim: () => void;
  isPending: boolean;
}) {
  const getRewardIcon = () => {
    switch (reward.type) {
      case 'xp':
        return <Zap className="w-4 h-4 text-yellow-400" />;
      case 'token':
        return <Zap className="w-4 h-4 text-blue-400" />;
      case 'cosmetic_nft':
      case 'cosmetic':
        return <Award className="w-4 h-4 text-purple-400" />;
      default:
        return <Gift className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRewardColor = () => {
    switch (reward.type) {
      case 'xp':
        return 'from-yellow-900/30 to-yellow-800/20 border-yellow-700/30';
      case 'token':
        return 'from-blue-900/30 to-blue-800/20 border-blue-700/30';
      case 'cosmetic_nft':
      case 'cosmetic':
        return 'from-purple-900/30 to-purple-800/20 border-purple-700/30';
      default:
        return 'from-gray-800/30 to-gray-700/20 border-gray-700/30';
    }
  };

  return (
    <div
      className={`bg-gradient-to-r ${getRewardColor()} rounded-lg border p-4 flex items-start justify-between`}
    >
      <div className="flex items-start gap-3 flex-1">
        <div className="mt-1">{getRewardIcon()}</div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">{reward.description}</p>
          <p className="text-xs text-gray-400">
            {reward.type === 'xp' && `${reward.amount} XP`}
            {reward.type === 'token' && `${reward.amount} Tokens`}
            {(reward.type === 'cosmetic' || reward.type === 'cosmetic_nft') &&
              `${reward.rarity || 'rare'} Cosmetic`}
          </p>
        </div>
      </div>
      {isPending && (
        <button
          onClick={onClaim}
          className="ml-2 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold rounded transition-colors"
        >
          Claim
        </button>
      )}
    </div>
  );
}

/**
 * Individual Challenge Card
 */
function ChallengeCard({
  progress,
  challenge,
  onUpdate,
}: {
  progress: ChallengeProgress;
  challenge: Challenge;
  onUpdate: (progressId: string, delta: number) => void;
}) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-400 bg-green-900/30';
      case 'medium':
        return 'text-yellow-400 bg-yellow-900/30';
      case 'hard':
        return 'text-red-400 bg-red-900/30';
      default:
        return 'text-gray-400 bg-gray-900/30';
    }
  };

  const progressPercent = (progress.currentProgress / progress.targetProgress) * 100;
  const isCompleted = progress.completed;

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-white text-sm">{challenge.title}</h4>
          <p className="text-xs text-gray-400 mt-1">{challenge.description}</p>
        </div>
        <span
          className={`px-2 py-1 rounded text-xs font-semibold ${getDifficultyColor(
            challenge.difficulty
          )}`}
        >
          {challenge.difficulty}
        </span>
      </div>

      <div className="space-y-2">
        {/* Progress Bar */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">
            Progress: {progress.currentProgress} / {progress.targetProgress}
          </span>
          <span className="text-gray-500">{Math.round(progressPercent)}%</span>
        </div>
        <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isCompleted ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Rewards */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1 text-yellow-400">
            <Zap className="w-3 h-3" />
            {challenge.reward.xp} XP
          </span>
          <span className="flex items-center gap-1 text-blue-400">
            <Zap className="w-3 h-3" />
            {challenge.reward.tokens} Tokens
          </span>
        </div>
        {isCompleted && (
          <span className="text-green-400 font-semibold text-xs flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        )}
      </div>

      {/* Quick Action (if not completed) */}
      {!isCompleted && (
        <button
          onClick={() => onUpdate(progress.progressId, 1)}
          className="w-full py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 rounded text-blue-400 text-xs font-semibold transition-colors"
        >
          Mark Progress +1
        </button>
      )}
    </div>
  );
}

/**
 * Individual Cosmetic Card
 */
function CosmeticCard({ cosmetic }: { cosmetic: CosmeticNFT }) {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'from-yellow-600 to-yellow-700 text-yellow-100';
      case 'epic':
        return 'from-purple-600 to-purple-700 text-purple-100';
      case 'rare':
        return 'from-blue-600 to-blue-700 text-blue-100';
      case 'uncommon':
        return 'from-green-600 to-green-700 text-green-100';
      default:
        return 'from-gray-600 to-gray-700 text-gray-100';
    }
  };

  return (
    <div
      className={`bg-gradient-to-b ${getRarityColor(
        cosmetic.rarity
      )} rounded-lg p-3 text-center text-xs font-semibold cursor-pointer hover:shadow-lg transition-shadow`}
    >
      <div className="mb-2 text-lg">✨</div>
      <p className="line-clamp-2">{cosmetic.name}</p>
      <p className="text-opacity-70 text-xs mt-1">{cosmetic.type}</p>
    </div>
  );
}
