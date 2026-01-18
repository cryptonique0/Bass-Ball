/**
 * Free Matches Provider System
 * Manages free match allocation and distribution on Base network
 */

interface FreeMatchAllocation {
  allocationId: string;
  userAddress: string;
  matchCount: number;
  matchesRemaining: number;
  allocatedAt: number;
  expiresAt: number;
  reason: 'daily_reward' | 'achievement' | 'referral' | 'promotional' | 'seasonal' | 'tier_bonus';
  tier: string;
  used: number;
}

interface FreeMatchPool {
  poolId: string;
  name: string;
  totalMatches: number;
  remainingMatches: number;
  dailyRefill: number;
  eligibility: {
    minLevel: number;
    maxLevel: number;
    requiresVerification: boolean;
  };
  schedule: {
    startTime: number; // Unix timestamp
    endTime: number;
    timezone: string;
  };
  rewards: {
    winReward: number; // Base amount
    lossMinimum: number;
    baseRewardMultiplier: number; // 1.0 = normal, 1.5 = 1.5x
  };
  active: boolean;
  timestamp: number;
}

interface UserMatchQuota {
  quotaId: string;
  userAddress: string;
  dailyFreeMatches: number;
  weeklyFreeMatches: number;
  monthlyFreeMatches: number;
  
  dailyUsed: number;
  weeklyUsed: number;
  monthlyUsed: number;
  
  dailyResetTime: number;
  weeklyResetTime: number;
  monthlyResetTime: number;
  
  lastActivity: number;
  streak: number; // Consecutive days played
  totalFreeMatches: number; // All time
}

interface FreeMatchSession {
  sessionId: string;
  userAddress: string;
  matchId: string;
  poolId: string;
  
  startTime: number;
  endTime?: number;
  duration: number;
  
  result: 'pending' | 'win' | 'loss' | 'draw' | 'abandoned';
  
  earnedRewards: {
    experience: number;
    coins: number;
    status: string; // NFT or cosmetic
  };
  
  isDoubleRewardEligible: boolean;
  multiplier: number;
  
  timestamp: number;
}

interface StreakBonus {
  streakId: string;
  userAddress: string;
  currentStreak: number; // consecutive days
  maxStreak: number;
  bonusMultiplier: number; // 1.0 + (streak * 0.05)
  lastClaimTime: number;
  rewards: {
    extraMatches: number;
    coinBonus: number;
    xpBonus: number;
  };
}

interface FreeMatchPromo {
  promoId: string;
  name: string;
  description: string;
  type: 'free_matches' | 'double_rewards' | 'weekend_special' | 'new_player' | 'seasonal';
  
  startTime: number;
  endTime: number;
  
  matchGrant: number; // number of free matches
  rewardMultiplier: number; // 1.0 to 5.0
  
  conditions: {
    minLevel: number;
    maxLevel: number;
    requiresWallet: boolean;
    requiresNFT: boolean;
  };
  
  active: boolean;
  participantCount: number;
  redeemedCount: number;
  
  timestamp: number;
}

export class FreeMatchesProvider {
  private static instance: FreeMatchesProvider;
  private allocations: Map<string, FreeMatchAllocation> = new Map();
  private matchPools: Map<string, FreeMatchPool> = new Map();
  private userQuotas: Map<string, UserMatchQuota> = new Map();
  private sessions: Map<string, FreeMatchSession> = new Map();
  private streakBonuses: Map<string, StreakBonus> = new Map();
  private promotions: Map<string, FreeMatchPromo> = new Map();

  private constructor() {
    this.loadFromStorage();
    this.initializePools();
    this.initializePromotions();
  }

  static getInstance(): FreeMatchesProvider {
    if (!FreeMatchesProvider.instance) {
      FreeMatchesProvider.instance = new FreeMatchesProvider();
    }
    return FreeMatchesProvider.instance;
  }

  /**
   * Match Pools
   */
  private initializePools(): void {
    const pools: FreeMatchPool[] = [
      {
        poolId: 'pool_daily',
        name: 'Daily Free Matches',
        totalMatches: 1000,
        remainingMatches: 1000,
        dailyRefill: 200,
        eligibility: {
          minLevel: 1,
          maxLevel: 999,
          requiresVerification: false,
        },
        schedule: {
          startTime: 0,
          endTime: 24 * 60 * 60 * 1000,
          timezone: 'UTC',
        },
        rewards: {
          winReward: 100,
          lossMinimum: 10,
          baseRewardMultiplier: 1.0,
        },
        active: true,
        timestamp: Date.now(),
      },
      {
        poolId: 'pool_weekend',
        name: 'Weekend Matches',
        totalMatches: 2000,
        remainingMatches: 2000,
        dailyRefill: 300,
        eligibility: {
          minLevel: 5,
          maxLevel: 999,
          requiresVerification: false,
        },
        schedule: {
          startTime: 5 * 24 * 60 * 60 * 1000, // Friday
          endTime: 7 * 24 * 60 * 60 * 1000, // Sunday
          timezone: 'UTC',
        },
        rewards: {
          winReward: 150,
          lossMinimum: 20,
          baseRewardMultiplier: 1.5,
        },
        active: true,
        timestamp: Date.now(),
      },
      {
        poolId: 'pool_new_player',
        name: 'New Player Welcome',
        totalMatches: 500,
        remainingMatches: 500,
        dailyRefill: 50,
        eligibility: {
          minLevel: 1,
          maxLevel: 10,
          requiresVerification: true,
        },
        schedule: {
          startTime: 0,
          endTime: 30 * 24 * 60 * 60 * 1000, // 30 days
          timezone: 'UTC',
        },
        rewards: {
          winReward: 200,
          lossMinimum: 50,
          baseRewardMultiplier: 2.0,
        },
        active: true,
        timestamp: Date.now(),
      },
    ];

    pools.forEach(pool => this.matchPools.set(pool.poolId, pool));
  }

  getPool(poolId: string): FreeMatchPool | null {
    return this.matchPools.get(poolId) || null;
  }

  getAllPools(): FreeMatchPool[] {
    return Array.from(this.matchPools.values());
  }

  getActivePools(): FreeMatchPool[] {
    return Array.from(this.matchPools.values()).filter(pool => pool.active && pool.remainingMatches > 0);
  }

  /**
   * Allocations
   */
  allocateFreeMatches(
    userAddress: string,
    matchCount: number,
    reason: FreeMatchAllocation['reason'],
    tier: string = 'free'
  ): FreeMatchAllocation {
    const allocation: FreeMatchAllocation = {
      allocationId: `alloc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userAddress,
      matchCount,
      matchesRemaining: matchCount,
      allocatedAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
      reason,
      tier,
      used: 0,
    };

    this.allocations.set(allocation.allocationId, allocation);
    
    // Update user quota
    this.updateUserQuota(userAddress, matchCount);
    
    this.saveToStorage();
    return allocation;
  }

  getUserAllocations(userAddress: string): FreeMatchAllocation[] {
    return Array.from(this.allocations.values())
      .filter(a => a.userAddress === userAddress && a.matchesRemaining > 0)
      .sort((a, b) => a.expiresAt - b.expiresAt);
  }

  claimFreeMatch(
    userAddress: string,
    poolId: string
  ): FreeMatchAllocation | null {
    // Get active allocations for user
    const allocations = this.getUserAllocations(userAddress);
    
    if (allocations.length === 0) {
      console.log('No active allocations for user');
      return null;
    }

    // Use first non-expired allocation
    const allocation = allocations[0];
    
    // Verify pool has matches
    const pool = this.getPool(poolId);
    if (!pool || pool.remainingMatches <= 0) {
      console.log('Pool exhausted');
      return null;
    }

    // Claim match
    allocation.matchesRemaining--;
    allocation.used++;
    pool.remainingMatches--;

    this.saveToStorage();
    return allocation;
  }

  /**
   * User Quotas
   */
  private updateUserQuota(userAddress: string, matchCount: number): void {
    let quota = this.userQuotas.get(userAddress);
    
    if (!quota) {
      quota = {
        quotaId: `quota_${userAddress}_${Date.now()}`,
        userAddress,
        dailyFreeMatches: 3,
        weeklyFreeMatches: 15,
        monthlyFreeMatches: 60,
        dailyUsed: 0,
        weeklyUsed: 0,
        monthlyUsed: 0,
        dailyResetTime: Date.now() + 24 * 60 * 60 * 1000,
        weeklyResetTime: Date.now() + 7 * 24 * 60 * 60 * 1000,
        monthlyResetTime: Date.now() + 30 * 24 * 60 * 60 * 1000,
        lastActivity: Date.now(),
        streak: 0,
        totalFreeMatches: 0,
      };
    }

    quota.totalFreeMatches += matchCount;
    quota.lastActivity = Date.now();

    this.userQuotas.set(userAddress, quota);
  }

  getUserQuota(userAddress: string): UserMatchQuota {
    let quota = this.userQuotas.get(userAddress);

    if (!quota) {
      quota = {
        quotaId: `quota_${userAddress}_${Date.now()}`,
        userAddress,
        dailyFreeMatches: 3,
        weeklyFreeMatches: 15,
        monthlyFreeMatches: 60,
        dailyUsed: 0,
        weeklyUsed: 0,
        monthlyUsed: 0,
        dailyResetTime: Date.now() + 24 * 60 * 60 * 1000,
        weeklyResetTime: Date.now() + 7 * 24 * 60 * 60 * 1000,
        monthlyResetTime: Date.now() + 30 * 24 * 60 * 60 * 1000,
        lastActivity: Date.now(),
        streak: 0,
        totalFreeMatches: 0,
      };
      this.userQuotas.set(userAddress, quota);
    }

    // Reset quotas if needed
    const now = Date.now();
    if (now >= quota.dailyResetTime) {
      quota.dailyUsed = 0;
      quota.dailyResetTime = now + 24 * 60 * 60 * 1000;
    }
    if (now >= quota.weeklyResetTime) {
      quota.weeklyUsed = 0;
      quota.weeklyResetTime = now + 7 * 24 * 60 * 60 * 1000;
    }
    if (now >= quota.monthlyResetTime) {
      quota.monthlyUsed = 0;
      quota.monthlyResetTime = now + 30 * 24 * 60 * 60 * 1000;
    }

    return quota;
  }

  getAvailableFreeMatches(userAddress: string): number {
    const quota = this.getUserQuota(userAddress);
    const daily = quota.dailyFreeMatches - quota.dailyUsed;
    const weekly = quota.weeklyFreeMatches - quota.weeklyUsed;
    const monthly = quota.monthlyFreeMatches - quota.monthlyUsed;
    
    return Math.min(daily, weekly, monthly);
  }

  /**
   * Sessions
   */
  createFreeMatchSession(
    userAddress: string,
    matchId: string,
    poolId: string
  ): FreeMatchSession {
    const session: FreeMatchSession = {
      sessionId: `session_${matchId}_${Date.now()}`,
      userAddress,
      matchId,
      poolId,
      startTime: Date.now(),
      duration: 0,
      result: 'pending',
      earnedRewards: {
        experience: 0,
        coins: 0,
        status: 'pending',
      },
      isDoubleRewardEligible: Math.random() > 0.7, // 30% chance
      multiplier: 1.0,
      timestamp: Date.now(),
    };

    this.sessions.set(session.sessionId, session);
    this.saveToStorage();
    return session;
  }

  completeFreeMatchSession(
    sessionId: string,
    result: 'win' | 'loss' | 'draw',
    duration: number,
    earnedRewards: { experience: number; coins: number }
  ): FreeMatchSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const pool = this.getPool(session.poolId);
    if (!pool) return null;

    session.endTime = Date.now();
    session.duration = duration;
    session.result = result;

    // Calculate rewards
    const baseReward = result === 'win' ? pool.rewards.winReward : pool.rewards.lossMinimum;
    const multiplier = this.isDoubleRewardTime() ? 2.0 : 1.0;
    
    session.earnedRewards = {
      experience: earnedRewards.experience * multiplier,
      coins: (baseReward * multiplier) | 0,
      status: 'completed',
    };

    // Apply streak bonus if applicable
    const streak = this.getStreakBonus(session.userAddress);
    if (streak) {
      session.multiplier = streak.bonusMultiplier;
      session.earnedRewards.coins = (session.earnedRewards.coins * streak.bonusMultiplier) | 0;
    }

    // Update quota
    const quota = this.getUserQuota(session.userAddress);
    quota.dailyUsed++;
    quota.weeklyUsed++;
    quota.monthlyUsed++;

    this.saveToStorage();
    return session;
  }

  getSession(sessionId: string): FreeMatchSession | null {
    return this.sessions.get(sessionId) || null;
  }

  getUserSessions(userAddress: string): FreeMatchSession[] {
    return Array.from(this.sessions.values())
      .filter(s => s.userAddress === userAddress)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Streak Bonuses
   */
  updateStreak(userAddress: string): StreakBonus {
    let streak = this.streakBonuses.get(userAddress);
    
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    if (!streak) {
      streak = {
        streakId: `streak_${userAddress}`,
        userAddress,
        currentStreak: 1,
        maxStreak: 1,
        bonusMultiplier: 1.05,
        lastClaimTime: now,
        rewards: {
          extraMatches: 1,
          coinBonus: 50,
          xpBonus: 100,
        },
      };
    } else {
      // Check if claim is within 48 hours (allow 1 day missed)
      const timeSinceLastClaim = now - streak.lastClaimTime;
      const daysSinceLastClaim = timeSinceLastClaim / oneDayMs;

      if (daysSinceLastClaim < 2) {
        // Streak continues
        streak.currentStreak++;
        if (streak.currentStreak > streak.maxStreak) {
          streak.maxStreak = streak.currentStreak;
        }
      } else {
        // Streak broken
        streak.currentStreak = 1;
      }

      streak.lastClaimTime = now;
      
      // Update multiplier (1.0 + 0.05 per day, max 2.5)
      streak.bonusMultiplier = Math.min(1.0 + (streak.currentStreak * 0.05), 2.5);
      
      // Update rewards based on streak
      streak.rewards = {
        extraMatches: Math.min(1 + Math.floor(streak.currentStreak / 5), 3),
        coinBonus: 50 * streak.currentStreak,
        xpBonus: 100 * streak.currentStreak,
      };
    }

    this.streakBonuses.set(userAddress, streak);
    this.saveToStorage();
    return streak;
  }

  getStreakBonus(userAddress: string): StreakBonus | null {
    return this.streakBonuses.get(userAddress) || null;
  }

  /**
   * Promotions
   */
  private initializePromotions(): void {
    const now = Date.now();
    const promos: FreeMatchPromo[] = [
      {
        promoId: 'promo_welcome',
        name: 'Welcome to Base',
        description: 'Get 5 free matches when you first play',
        type: 'new_player',
        startTime: now,
        endTime: now + 365 * 24 * 60 * 60 * 1000,
        matchGrant: 5,
        rewardMultiplier: 1.5,
        conditions: {
          minLevel: 1,
          maxLevel: 5,
          requiresWallet: true,
          requiresNFT: false,
        },
        active: true,
        participantCount: 0,
        redeemedCount: 0,
        timestamp: now,
      },
      {
        promoId: 'promo_weekend',
        name: 'Weekend Bonanza',
        description: '2x rewards on all matches Friday-Sunday',
        type: 'weekend_special',
        startTime: now,
        endTime: now + 7 * 24 * 60 * 60 * 1000,
        matchGrant: 0,
        rewardMultiplier: 2.0,
        conditions: {
          minLevel: 1,
          maxLevel: 999,
          requiresWallet: false,
          requiresNFT: false,
        },
        active: true,
        participantCount: 0,
        redeemedCount: 0,
        timestamp: now,
      },
    ];

    promos.forEach(promo => this.promotions.set(promo.promoId, promo));
  }

  getPromotion(promoId: string): FreeMatchPromo | null {
    return this.promotions.get(promoId) || null;
  }

  getActivePromotions(): FreeMatchPromo[] {
    const now = Date.now();
    return Array.from(this.promotions.values()).filter(
      p => p.active && p.startTime <= now && p.endTime >= now
    );
  }

  /**
   * Utility Methods
   */
  private isDoubleRewardTime(): boolean {
    const hour = new Date().getHours();
    // Double rewards during peak hours (6 PM - 9 PM)
    return hour >= 18 && hour < 21;
  }

  getPoolStatus(): { poolId: string; remaining: number; used: number; percentage: number }[] {
    return Array.from(this.matchPools.values()).map(pool => ({
      poolId: pool.poolId,
      remaining: pool.remainingMatches,
      used: pool.totalMatches - pool.remainingMatches,
      percentage: ((pool.totalMatches - pool.remainingMatches) / pool.totalMatches) * 100,
    }));
  }

  /**
   * Storage
   */
  private saveToStorage(): void {
    try {
      const data = {
        allocations: Array.from(this.allocations.entries()),
        matchPools: Array.from(this.matchPools.entries()),
        userQuotas: Array.from(this.userQuotas.entries()),
        sessions: Array.from(this.sessions.entries()),
        streakBonuses: Array.from(this.streakBonuses.entries()),
        promotions: Array.from(this.promotions.entries()),
      };
      localStorage['free_matches_provider'] = JSON.stringify(data);
    } catch (error) {
      console.error('Failed to save free matches provider:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = JSON.parse(localStorage['free_matches_provider'] || '{}');
      if (data.allocations) this.allocations = new Map(data.allocations);
      if (data.matchPools) this.matchPools = new Map(data.matchPools);
      if (data.userQuotas) this.userQuotas = new Map(data.userQuotas);
      if (data.sessions) this.sessions = new Map(data.sessions);
      if (data.streakBonuses) this.streakBonuses = new Map(data.streakBonuses);
      if (data.promotions) this.promotions = new Map(data.promotions);
    } catch (error) {
      console.error('Failed to load free matches provider:', error);
    }
  }
}

export type {
  FreeMatchAllocation,
  FreeMatchPool,
  UserMatchQuota,
  FreeMatchSession,
  StreakBonus,
  FreeMatchPromo,
};
