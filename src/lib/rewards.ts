/**
 * Reward distribution and prize pool management
 */

export interface RewardPool {
  id: string;
  totalAmount: bigint;
  distribution: Array<{
    rank: number;
    percentage: number;
    amount: bigint;
  }>;
  currency: string; // ETH, USDC, etc.
  chainId: number;
}

export interface PlayerReward {
  playerId: string;
  rewardAmount: bigint;
  currency: string;
  sourceId: string; // Tournament or match ID
  timestamp: number;
  claimed: boolean;
  claimedAt?: number;
}

export class RewardManager {
  private pools: Map<string, RewardPool> = new Map();
  private rewards: Map<string, PlayerReward[]> = new Map();

  /**
   * Create reward pool
   */
  createPool(
    poolId: string,
    totalAmount: bigint,
    ranks: number,
    currency: string = 'ETH',
    chainId: number = 8453
  ): RewardPool {
    // Calculate distribution (typical: 40%, 25%, 15%, 10%, 10%)
    const distributions: number[] = [];
    let remaining = 100;

    for (let i = 0; i < ranks; i++) {
      if (i === 0) {
        distributions.push(40);
        remaining -= 40;
      } else if (i === 1) {
        distributions.push(25);
        remaining -= 25;
      } else if (i === 2) {
        distributions.push(15);
        remaining -= 15;
      } else if (i === 3) {
        distributions.push(10);
        remaining -= 10;
      } else {
        distributions.push(remaining / (ranks - i));
        remaining = 0;
      }
    }

    const distribution = distributions.map((percentage, index) => ({
      rank: index + 1,
      percentage,
      amount: (totalAmount * BigInt(Math.floor(percentage * 100))) / BigInt(10000),
    }));

    const pool: RewardPool = {
      id: poolId,
      totalAmount,
      distribution,
      currency,
      chainId,
    };

    this.pools.set(poolId, pool);
    return pool;
  }

  /**
   * Get reward for rank
   */
  getRewardForRank(poolId: string, rank: number): bigint {
    const pool = this.pools.get(poolId);
    if (!pool) return BigInt(0);

    const dist = pool.distribution.find((d) => d.rank === rank);
    return dist ? dist.amount : BigInt(0);
  }

  /**
   * Award player
   */
  awardPlayer(
    playerId: string,
    amount: bigint,
    sourceId: string,
    currency: string = 'ETH'
  ): void {
    if (!this.rewards.has(playerId)) {
      this.rewards.set(playerId, []);
    }

    const reward: PlayerReward = {
      playerId,
      rewardAmount: amount,
      currency,
      sourceId,
      timestamp: Date.now(),
      claimed: false,
    };

    this.rewards.get(playerId)!.push(reward);
  }

  /**
   * Get player rewards
   */
  getPlayerRewards(playerId: string): PlayerReward[] {
    return this.rewards.get(playerId) || [];
  }

  /**
   * Get unclaimed rewards
   */
  getUnclaimedRewards(playerId: string): PlayerReward[] {
    return (this.rewards.get(playerId) || []).filter((r) => !r.claimed);
  }

  /**
   * Get total unclaimed amount
   */
  getTotalUnclaimed(playerId: string): bigint {
    return (this.rewards.get(playerId) || [])
      .filter((r) => !r.claimed)
      .reduce((sum, r) => sum + r.rewardAmount, BigInt(0));
  }

  /**
   * Claim reward
   */
  claimReward(playerId: string, rewardIndex: number): boolean {
    const playerRewards = this.rewards.get(playerId);
    if (!playerRewards || !playerRewards[rewardIndex]) return false;

    const reward = playerRewards[rewardIndex];
    if (reward.claimed) return false;

    reward.claimed = true;
    reward.claimedAt = Date.now();
    return true;
  }

  /**
   * Claim all rewards
   */
  claimAllRewards(playerId: string): bigint {
    const playerRewards = this.rewards.get(playerId) || [];
    let total = BigInt(0);

    playerRewards.forEach((reward) => {
      if (!reward.claimed) {
        reward.claimed = true;
        reward.claimedAt = Date.now();
        total += reward.rewardAmount;
      }
    });

    return total;
  }

  /**
   * Distribute rewards from tournament
   */
  distributeTournamentRewards(
    poolId: string,
    standings: Array<{ teamId: string; rank: number }>
  ): void {
    const pool = this.pools.get(poolId);
    if (!pool) return;

    standings.forEach(({ teamId, rank }) => {
      const amount = this.getRewardForRank(poolId, rank);
      if (amount > BigInt(0)) {
        this.awardPlayer(teamId, amount, poolId, pool.currency);
      }
    });
  }

  /**
   * Get reward statistics
   */
  getStatistics(playerId?: string) {
    if (playerId) {
      const playerRewards = this.rewards.get(playerId) || [];
      return {
        totalRewards: playerRewards.length,
        claimedRewards: playerRewards.filter((r) => r.claimed).length,
        unclaimedRewards: playerRewards.filter((r) => !r.claimed).length,
        totalAmount: playerRewards.reduce((sum, r) => sum + r.rewardAmount, BigInt(0)),
        totalClaimed: playerRewards
          .filter((r) => r.claimed)
          .reduce((sum, r) => sum + r.rewardAmount, BigInt(0)),
      };
    }

    let totalRewards = 0;
    let totalAmount = BigInt(0);

    this.rewards.forEach((rewards) => {
      totalRewards += rewards.length;
      rewards.forEach((r) => {
        totalAmount += r.rewardAmount;
      });
    });

    return {
      totalPlayers: this.rewards.size,
      totalRewards,
      totalAmount,
      totalPools: this.pools.size,
    };
  }
}
