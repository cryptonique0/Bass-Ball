/**
 * Challenge System
 * Daily and weekly challenges with tracking and rewards
 */

/**
 * Challenge definition
 */
export interface Challenge {
  challengeId: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly';
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'wins' | 'goals' | 'assists' | 'rating' | 'clean_sheets' | 'variety' | 'consistency';
  target: number;
  reward: {
    xp: number;
    tokens: number;
  };
  season?: string;
  createdDate: number;
}

/**
 * Challenge progress
 */
export interface ChallengeProgress {
  progressId: string;
  challengeId: string;
  entityId: string;
  entityType: 'player' | 'team';
  entityName: string;
  
  currentProgress: number;
  targetProgress: number;
  completed: boolean;
  completedDate?: number;
  
  claimed: boolean;
  claimedDate?: number;
  
  season: string;
  startDate: number;
  expiryDate: number;
}

/**
 * Challenge Manager
 * Singleton for managing challenges
 */
export class ChallengeManager {
  private static instance: ChallengeManager;
  private challenges: Map<string, Challenge> = new Map();
  private progress: Map<string, ChallengeProgress> = new Map();
  private completedChallenges: Map<string, string[]> = new Map(); // entityId -> challengeIds

  private constructor() {
    this.loadFromStorage();
    this.initializeDefaultChallenges();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ChallengeManager {
    if (!ChallengeManager.instance) {
      ChallengeManager.instance = new ChallengeManager();
    }
    return ChallengeManager.instance;
  }

  /**
   * Create challenge
   */
  createChallenge(
    title: string,
    description: string,
    type: 'daily' | 'weekly',
    difficulty: 'easy' | 'medium' | 'hard',
    category: Challenge['category'],
    target: number,
    xpReward: number,
    tokenReward: number,
    season?: string
  ): Challenge {
    const challengeId = `challenge_${Date.now()}`;

    const challenge: Challenge = {
      challengeId,
      title,
      description,
      type,
      difficulty,
      category,
      target,
      reward: { xp: xpReward, tokens: tokenReward },
      season,
      createdDate: Date.now(),
    };

    this.challenges.set(challengeId, challenge);
    this.saveToStorage();

    return challenge;
  }

  /**
   * Assign challenge to player
   */
  assignChallenge(
    challengeId: string,
    entityId: string,
    entityType: 'player' | 'team',
    entityName: string,
    season: string
  ): ChallengeProgress | null {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) return null;

    const progressId = `prog_${challengeId}_${entityId}`;

    // Calculate expiry date
    const now = Date.now();
    const expiryDate =
      challenge.type === 'daily'
        ? now + 24 * 60 * 60 * 1000 // 24 hours
        : now + 7 * 24 * 60 * 60 * 1000; // 7 days

    const progress: ChallengeProgress = {
      progressId,
      challengeId,
      entityId,
      entityType,
      entityName,
      currentProgress: 0,
      targetProgress: challenge.target,
      completed: false,
      claimed: false,
      season,
      startDate: now,
      expiryDate,
    };

    this.progress.set(progressId, progress);
    this.saveToStorage();

    return progress;
  }

  /**
   * Update challenge progress
   */
  updateProgress(
    progressId: string,
    delta: number
  ): ChallengeProgress | null {
    const prog = this.progress.get(progressId);
    if (!prog || prog.completed) return null;

    prog.currentProgress += delta;

    // Check if completed
    if (prog.currentProgress >= prog.targetProgress) {
      prog.currentProgress = prog.targetProgress;
      prog.completed = true;
      prog.completedDate = Date.now();

      // Track completion
      if (!this.completedChallenges.has(prog.entityId)) {
        this.completedChallenges.set(prog.entityId, []);
      }
      this.completedChallenges.get(prog.entityId)!.push(prog.challengeId);
    }

    this.saveToStorage();
    return prog;
  }

  /**
   * Claim challenge reward
   */
  claimChallenge(progressId: string): ChallengeProgress | null {
    const prog = this.progress.get(progressId);
    if (!prog || !prog.completed || prog.claimed) return null;

    prog.claimed = true;
    prog.claimedDate = Date.now();

    this.saveToStorage();
    return prog;
  }

  /**
   * Get challenge
   */
  getChallenge(challengeId: string): Challenge | undefined {
    return this.challenges.get(challengeId);
  }

  /**
   * Get all challenges
   */
  getAllChallenges(type?: 'daily' | 'weekly'): Challenge[] {
    let challenges = Array.from(this.challenges.values());

    if (type) {
      challenges = challenges.filter((c) => c.type === type);
    }

    return challenges.sort((a, b) => b.createdDate - a.createdDate);
  }

  /**
   * Get active challenges for season
   */
  getActiveChallenges(season: string, type?: 'daily' | 'weekly'): Challenge[] {
    let challenges = Array.from(this.challenges.values()).filter((c) => c.season === season);

    if (type) {
      challenges = challenges.filter((c) => c.type === type);
    }

    return challenges;
  }

  /**
   * Get player progress
   */
  getProgress(progressId: string): ChallengeProgress | undefined {
    return this.progress.get(progressId);
  }

  /**
   * Get player's active challenges
   */
  getActiveChallengesForPlayer(
    entityId: string,
    season: string,
    type?: 'daily' | 'weekly'
  ): ChallengeProgress[] {
    const now = Date.now();

    let playerProgress = Array.from(this.progress.values()).filter(
      (p) =>
        p.entityId === entityId &&
        p.season === season &&
        !p.completed &&
        p.expiryDate > now
    );

    if (type) {
      const challenges = new Set(
        Array.from(this.challenges.values())
          .filter((c) => c.type === type)
          .map((c) => c.challengeId)
      );
      playerProgress = playerProgress.filter((p) => challenges.has(p.challengeId));
    }

    return playerProgress;
  }

  /**
   * Get player's completed challenges
   */
  getCompletedChallenges(entityId: string, season: string): ChallengeProgress[] {
    return Array.from(this.progress.values()).filter(
      (p) =>
        p.entityId === entityId &&
        p.season === season &&
        p.completed
    );
  }

  /**
   * Get player's claimable rewards
   */
  getClaimableChallenges(entityId: string, season: string): ChallengeProgress[] {
    return Array.from(this.progress.values()).filter(
      (p) =>
        p.entityId === entityId &&
        p.season === season &&
        p.completed &&
        !p.claimed
    );
  }

  /**
   * Get challenges by category
   */
  getChallengesByCategory(category: Challenge['category']): Challenge[] {
    return Array.from(this.challenges.values()).filter((c) => c.category === category);
  }

  /**
   * Get challenges by difficulty
   */
  getChallengesByDifficulty(difficulty: Challenge['difficulty']): Challenge[] {
    return Array.from(this.challenges.values()).filter((c) => c.difficulty === difficulty);
  }

  /**
   * Get player completion stats
   */
  getCompletionStats(entityId: string, season?: string): {
    totalCompleted: number;
    dailyCompleted: number;
    weeklyCompleted: number;
    totalRewards: { xp: number; tokens: number };
    streakDays: number;
  } {
    let completed = this.getCompletedChallenges(entityId, season || 'all');

    if (season === 'all') {
      completed = Array.from(this.progress.values()).filter(
        (p) => p.entityId === entityId && p.completed
      );
    }

    const dailyCompleted = completed.filter(
      (p) =>
        this.challenges.get(p.challengeId)?.type === 'daily'
    ).length;

    const weeklyCompleted = completed.filter(
      (p) =>
        this.challenges.get(p.challengeId)?.type === 'weekly'
    ).length;

    let totalXP = 0;
    let totalTokens = 0;

    for (const prog of completed) {
      const challenge = this.challenges.get(prog.challengeId);
      if (challenge) {
        totalXP += challenge.reward.xp;
        totalTokens += challenge.reward.tokens;
      }
    }

    // Calculate streak (simplified: how many days with daily challenges completed in last 7 days)
    const lastWeek = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentDaily = completed.filter(
      (p) =>
        this.challenges.get(p.challengeId)?.type === 'daily' &&
        p.completedDate &&
        p.completedDate > lastWeek
    );
    const uniqueDays = new Set(
      recentDaily.map((p) => {
        const date = new Date(p.completedDate || 0);
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      })
    );
    const streakDays = uniqueDays.size;

    return {
      totalCompleted: completed.length,
      dailyCompleted,
      weeklyCompleted,
      totalRewards: { xp: totalXP, tokens: totalTokens },
      streakDays,
    };
  }

  /**
   * Reset daily challenges
   */
  resetDailyChallenges(season: string): number {
    let reset = 0;
    const now = Date.now();

    // Expire old daily challenges
    for (const prog of this.progress.values()) {
      if (
        prog.season === season &&
        !prog.completed &&
        this.challenges.get(prog.challengeId)?.type === 'daily' &&
        prog.expiryDate <= now
      ) {
        // Mark as expired (don't delete, keep history)
        // User won't see it in active list due to expiry check
        reset++;
      }
    }

    return reset;
  }

  /**
   * Get leaderboard by challenge completions
   */
  getCompletionLeaderboard(
    season: string,
    type?: 'daily' | 'weekly',
    limit: number = 50
  ): Array<{
    entityId: string;
    entityName: string;
    entityType: 'player' | 'team';
    completions: number;
    totalRewards: { xp: number; tokens: number };
  }> {
    const entityStats: Map<
      string,
      {
        entityId: string;
        entityName: string;
        entityType: 'player' | 'team';
        completions: number;
        xp: number;
        tokens: number;
      }
    > = new Map();

    for (const prog of this.progress.values()) {
      if (prog.season === season && prog.completed) {
        const challenge = this.challenges.get(prog.challengeId);
        if (!challenge) continue;

        if (type && challenge.type !== type) continue;

        if (!entityStats.has(prog.entityId)) {
          entityStats.set(prog.entityId, {
            entityId: prog.entityId,
            entityName: prog.entityName,
            entityType: prog.entityType,
            completions: 0,
            xp: 0,
            tokens: 0,
          });
        }

        const stats = entityStats.get(prog.entityId)!;
        stats.completions++;
        stats.xp += challenge.reward.xp;
        stats.tokens += challenge.reward.tokens;
      }
    }

    return Array.from(entityStats.values())
      .sort((a, b) => b.completions - a.completions || b.xp - a.xp)
      .slice(0, limit)
      .map((s) => ({
        entityId: s.entityId,
        entityName: s.entityName,
        entityType: s.entityType,
        completions: s.completions,
        totalRewards: { xp: s.xp, tokens: s.tokens },
      }));
  }

  /**
   * Private helper: Initialize default challenges
   */
  private initializeDefaultChallenges(): void {
    if (this.challenges.size > 0) return;

    const defaults: Array<Omit<Challenge, 'challengeId' | 'createdDate'>> = [
      {
        title: 'First Win',
        description: 'Win 1 match',
        type: 'daily',
        difficulty: 'easy',
        category: 'wins',
        target: 1,
        reward: { xp: 50, tokens: 10 },
      },
      {
        title: 'Hat-trick',
        description: 'Score 3 goals in a match',
        type: 'daily',
        difficulty: 'hard',
        category: 'goals',
        target: 3,
        reward: { xp: 200, tokens: 50 },
      },
      {
        title: 'Playmaker',
        description: 'Record 2 assists in a match',
        type: 'daily',
        difficulty: 'medium',
        category: 'assists',
        target: 2,
        reward: { xp: 100, tokens: 25 },
      },
      {
        title: 'Rating Master',
        description: 'Achieve 8.5+ rating in a match',
        type: 'daily',
        difficulty: 'medium',
        category: 'rating',
        target: 1,
        reward: { xp: 100, tokens: 25 },
      },
      {
        title: 'Week Warrior',
        description: 'Win 5 matches in a week',
        type: 'weekly',
        difficulty: 'medium',
        category: 'wins',
        target: 5,
        reward: { xp: 500, tokens: 100 },
      },
      {
        title: 'Goal Scorer',
        description: 'Score 10 goals in a week',
        type: 'weekly',
        difficulty: 'medium',
        category: 'goals',
        target: 10,
        reward: { xp: 400, tokens: 80 },
      },
      {
        title: 'Goal Keeper',
        description: 'Achieve 3 clean sheets in a week',
        type: 'weekly',
        difficulty: 'hard',
        category: 'clean_sheets',
        target: 3,
        reward: { xp: 500, tokens: 100 },
      },
      {
        title: 'Consistency King',
        description: 'Play 7 matches with 7+ rating average',
        type: 'weekly',
        difficulty: 'hard',
        category: 'consistency',
        target: 7,
        reward: { xp: 600, tokens: 150 },
      },
    ];

    for (const def of defaults) {
      const challenge: Challenge = {
        challengeId: `challenge_default_${def.title.replace(/\s+/g, '_').toLowerCase()}`,
        ...def,
        createdDate: Date.now(),
      };
      this.challenges.set(challenge.challengeId, challenge);
    }

    this.saveToStorage();
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        challenges: Array.from(this.challenges.entries()),
        progress: Array.from(this.progress.entries()),
        completedChallenges: Array.from(this.completedChallenges.entries()),
      };
      localStorage.setItem('challenge_system', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving challenge data:', error);
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('challenge_system');
      if (stored) {
        const data = JSON.parse(stored);

        if (Array.isArray(data.challenges)) {
          for (const [key, value] of data.challenges) {
            this.challenges.set(key, value);
          }
        }

        if (Array.isArray(data.progress)) {
          for (const [key, value] of data.progress) {
            this.progress.set(key, value);
          }
        }

        if (Array.isArray(data.completedChallenges)) {
          for (const [key, value] of data.completedChallenges) {
            this.completedChallenges.set(key, value);
          }
        }
      }
    } catch (error) {
      console.error('Error loading challenge data:', error);
    }
  }
}
