/**
 * Progression System
 * Player/Team level progression with XP, tiers, milestones, and achievement tracking
 */

/**
 * Player/Team progression record
 */
export interface PlayerProgression {
  // Identifiers
  progressionId: string;
  entityId: string; // Player or Team ID
  entityType: 'player' | 'team';
  entityName: string;
  owner: string;

  // Level & Experience
  currentLevel: number; // 1-100
  currentXP: number; // XP towards next level
  totalXP: number; // Lifetime XP earned
  xpToNextLevel: number; // XP needed for next level

  // Tier System
  currentTier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master';
  tierXP: number; // XP within current tier
  tierProgress: number; // 0-100%
  maxTierReached: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master';

  // Progression Milestones
  milestonesCompleted: string[]; // Achievement milestone IDs
  currentMilestoneProgress: {
    milestoneId: string;
    category: string; // 'wins', 'goals', 'assists', 'consistency', 'versatility'
    progress: number; // Current progress
    target: number; // Target to complete
    completed: boolean;
  }[];

  // Stats Tracking
  matchesPlayed: number;
  matchesWon: number;
  winRate: number; // 0-100%
  goalsScored: number;
  assists: number;
  cleanSheets: number;
  averageRating: number;
  consistencyScore: number; // 0-100 based on rating variance

  // Badges & Achievements
  achievedBadges: {
    badgeId: string;
    name: string;
    description: string;
    category: 'performance' | 'consistency' | 'milestone' | 'seasonal';
    unlockedDate: number;
  }[];

  // Rewards
  rewardsEarned: {
    type: 'xp' | 'token' | 'nft' | 'cosmetic' | 'utility';
    amount: number;
    description: string;
    claimedDate: number;
  }[];

  // Timeline
  joinedDate: number;
  lastUpdated: number;
  lastLevelUp?: number;
  lastTierUp?: number;

  // Metadata
  streak: number; // Current win streak
  longestStreak: number; // Best win streak
  versatilityScore: number; // Plays multiple positions/roles
  leaderboardRank?: number;
}

/**
 * Progression milestone definition
 */
export interface ProgressionMilestone {
  milestoneId: string;
  name: string;
  description: string;
  category: 'wins' | 'goals' | 'assists' | 'consistency' | 'versatility' | 'seasonal';
  targetValue: number;
  xpReward: number;
  badgeReward?: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master';
  isRepeatable: boolean;
}

/**
 * Achievement badge definition
 */
export interface ProgressionBadge {
  badgeId: string;
  name: string;
  description: string;
  category: 'performance' | 'consistency' | 'milestone' | 'seasonal';
  icon: string; // Emoji or asset path
  color: string; // Hex color
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  unlockCondition: string;
}

/**
 * Progression tier configuration
 */
export interface ProgressionTierConfig {
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master';
  minLevel: number;
  minTotalXP: number;
  xpMultiplier: number; // XP gain multiplier at this tier
  unlockBenefits: {
    nftReward?: boolean;
    tokenReward?: number;
    badgeReward?: string;
    cosmetics?: string[];
    utilityBonus?: string;
  };
}

/**
 * Progression level configuration
 */
export interface ProgressionLevelConfig {
  level: number;
  xpRequired: number; // XP needed to reach this level from previous
  rewards: {
    type: 'xp' | 'token' | 'nft' | 'cosmetic';
    amount: number;
  }[];
}

/**
 * Progression System Manager
 * Singleton for managing all progression-related logic
 */
export class ProgressionManager {
  private static instance: ProgressionManager;
  private progressions: Map<string, PlayerProgression> = new Map();
  private milestones: Map<string, ProgressionMilestone> = new Map();
  private badges: Map<string, ProgressionBadge> = new Map();

  // Tier configurations
  private tierConfigs: Map<string, ProgressionTierConfig> = new Map([
    [
      'bronze',
      {
        tier: 'bronze',
        minLevel: 1,
        minTotalXP: 0,
        xpMultiplier: 1.0,
        unlockBenefits: { cosmetics: ['bronze-frame'] },
      },
    ],
    [
      'silver',
      {
        tier: 'silver',
        minLevel: 20,
        minTotalXP: 5000,
        xpMultiplier: 1.1,
        unlockBenefits: { badgeReward: 'silver-badge', cosmetics: ['silver-frame'] },
      },
    ],
    [
      'gold',
      {
        tier: 'gold',
        minLevel: 40,
        minTotalXP: 15000,
        xpMultiplier: 1.2,
        unlockBenefits: { nftReward: true, tokenReward: 100, cosmetics: ['gold-frame'] },
      },
    ],
    [
      'platinum',
      {
        tier: 'platinum',
        minLevel: 60,
        minTotalXP: 30000,
        xpMultiplier: 1.35,
        unlockBenefits: { nftReward: true, tokenReward: 250, cosmetics: ['platinum-frame', 'glow'] },
      },
    ],
    [
      'diamond',
      {
        tier: 'diamond',
        minLevel: 80,
        minTotalXP: 50000,
        xpMultiplier: 1.5,
        unlockBenefits: { nftReward: true, tokenReward: 500, cosmetics: ['diamond-frame', 'glow', 'effects'] },
      },
    ],
    [
      'master',
      {
        tier: 'master',
        minLevel: 100,
        minTotalXP: 75000,
        xpMultiplier: 2.0,
        unlockBenefits: {
          nftReward: true,
          tokenReward: 1000,
          cosmetics: ['master-frame', 'glow', 'effects', 'aura'],
          utilityBonus: 'priority-matchmaking',
        },
      },
    ],
  ]);

  // Level configurations (simplified - levels 1-100)
  private levelConfigs: Map<number, ProgressionLevelConfig> = this.generateLevelConfigs();

  private constructor() {
    this.loadFromStorage();
    this.initializeMilestones();
    this.initializeBadges();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ProgressionManager {
    if (!ProgressionManager.instance) {
      ProgressionManager.instance = new ProgressionManager();
    }
    return ProgressionManager.instance;
  }

  /**
   * Create new player/team progression
   */
  createProgression(
    entityId: string,
    entityType: 'player' | 'team',
    entityName: string,
    owner: string
  ): PlayerProgression {
    const progressionId = `prog_${entityId}_${Date.now()}`;

    const progression: PlayerProgression = {
      progressionId,
      entityId,
      entityType,
      entityName,
      owner,
      currentLevel: 1,
      currentXP: 0,
      totalXP: 0,
      xpToNextLevel: this.levelConfigs.get(1)?.xpRequired || 1000,
      currentTier: 'bronze',
      tierXP: 0,
      tierProgress: 0,
      maxTierReached: 'bronze',
      milestonesCompleted: [],
      currentMilestoneProgress: this.getInitialMilestones(),
      matchesPlayed: 0,
      matchesWon: 0,
      winRate: 0,
      goalsScored: 0,
      assists: 0,
      cleanSheets: 0,
      averageRating: 0,
      consistencyScore: 0,
      achievedBadges: [],
      rewardsEarned: [],
      joinedDate: Date.now(),
      lastUpdated: Date.now(),
      streak: 0,
      longestStreak: 0,
      versatilityScore: 0,
    };

    this.progressions.set(progressionId, progression);
    this.saveToStorage();

    return progression;
  }

  /**
   * Add XP to progression
   */
  addXP(progressionId: string, amount: number, source: string = 'match'): PlayerProgression | null {
    const progression = this.progressions.get(progressionId);
    if (!progression) return null;

    // Apply tier multiplier
    const tierConfig = this.tierConfigs.get(progression.currentTier);
    const multiplier = tierConfig?.xpMultiplier || 1.0;
    const actualXP = Math.floor(amount * multiplier);

    progression.currentXP += actualXP;
    progression.totalXP += actualXP;

    // Check for level up
    while (
      progression.currentXP >= progression.xpToNextLevel &&
      progression.currentLevel < 100
    ) {
      progression.currentXP -= progression.xpToNextLevel;
      progression.currentLevel++;
      progression.lastLevelUp = Date.now();

      // Get next level requirements
      const nextLevelConfig = this.levelConfigs.get(progression.currentLevel);
      progression.xpToNextLevel = nextLevelConfig?.xpRequired || 1000;

      // Check for tier up
      this.checkTierPromotion(progressionId);
    }

    // Update tier progress
    const tierConfig2 = this.tierConfigs.get(progression.currentTier);
    const tierXPRequired = this.getTierXPRequired(progression.currentTier);
    progression.tierProgress = Math.min(100, (progression.totalXP / tierXPRequired) * 100);

    this.checkMilestoneProgress(progressionId);
    progression.lastUpdated = Date.now();

    this.saveToStorage();
    return progression;
  }

  /**
   * Record match result
   */
  recordMatchResult(
    progressionId: string,
    won: boolean,
    stats: {
      goalsScored: number;
      assists: number;
      cleanSheets?: number;
      rating: number;
    }
  ): PlayerProgression | null {
    const progression = this.progressions.get(progressionId);
    if (!progression) return null;

    progression.matchesPlayed++;
    if (won) {
      progression.matchesWon++;
      progression.streak++;
      progression.longestStreak = Math.max(progression.longestStreak, progression.streak);

      // XP bonus for wins
      this.addXP(progressionId, 100 * progression.streak, 'match-win');
    } else {
      progression.streak = 0;
      this.addXP(progressionId, 50, 'match-loss');
    }

    // Update stats
    progression.goalsScored += stats.goalsScored;
    progression.assists += stats.assists;
    if (stats.cleanSheets) {
      progression.cleanSheets += stats.cleanSheets;
    }

    // Update average rating
    const oldRatingTotal = progression.averageRating * (progression.matchesPlayed - 1);
    progression.averageRating = (oldRatingTotal + stats.rating) / progression.matchesPlayed;

    // Calculate consistency (low variance = high consistency)
    this.updateConsistencyScore(progressionId);

    // Update win rate
    progression.winRate =
      (progression.matchesWon / progression.matchesPlayed) * 100;

    progression.lastUpdated = Date.now();
    this.saveToStorage();

    return progression;
  }

  /**
   * Award badge to progression
   */
  awardBadge(progressionId: string, badgeId: string): PlayerProgression | null {
    const progression = this.progressions.get(progressionId);
    const badge = this.badges.get(badgeId);

    if (!progression || !badge) return null;

    // Check if already earned
    if (progression.achievedBadges.some((b) => b.badgeId === badgeId)) {
      return progression;
    }

    progression.achievedBadges.push({
      badgeId,
      name: badge.name,
      description: badge.description,
      category: badge.category,
      unlockedDate: Date.now(),
    });

    this.saveToStorage();
    return progression;
  }

  /**
   * Complete milestone
   */
  completeMilestone(progressionId: string, milestoneId: string): PlayerProgression | null {
    const progression = this.progressions.get(progressionId);
    const milestone = this.milestones.get(milestoneId);

    if (!progression || !milestone) return null;

    // Mark milestone as completed
    if (!progression.milestonesCompleted.includes(milestoneId)) {
      progression.milestonesCompleted.push(milestoneId);

      // Award XP
      this.addXP(progressionId, milestone.xpReward, 'milestone');

      // Award badge if applicable
      if (milestone.badgeReward) {
        this.awardBadge(progressionId, milestone.badgeReward);
      }
    }

    // Update milestone progress
    const milestoneProgress = progression.currentMilestoneProgress.find(
      (m) => m.milestoneId === milestoneId
    );
    if (milestoneProgress) {
      milestoneProgress.completed = true;
      milestoneProgress.progress = milestoneProgress.target;
    }

    progression.lastUpdated = Date.now();
    this.saveToStorage();

    return progression;
  }

  /**
   * Get progression by ID
   */
  getProgression(progressionId: string): PlayerProgression | undefined {
    return this.progressions.get(progressionId);
  }

  /**
   * Get progression by entity
   */
  getProgressionByEntity(entityId: string): PlayerProgression | undefined {
    for (const progression of this.progressions.values()) {
      if (progression.entityId === entityId) {
        return progression;
      }
    }
    return undefined;
  }

  /**
   * Get all progressions for owner
   */
  getProgressionsForOwner(owner: string): PlayerProgression[] {
    return Array.from(this.progressions.values()).filter((p) => p.owner === owner);
  }

  /**
   * Get leaderboard for tier
   */
  getTierLeaderboard(tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master'): PlayerProgression[] {
    return Array.from(this.progressions.values())
      .filter((p) => p.currentTier === tier)
      .sort((a, b) => {
        // Sort by level desc, then XP desc, then name
        if (a.currentLevel !== b.currentLevel) {
          return b.currentLevel - a.currentLevel;
        }
        if (a.totalXP !== b.totalXP) {
          return b.totalXP - a.totalXP;
        }
        return a.entityName.localeCompare(b.entityName);
      })
      .map((p, index) => ({
        ...p,
        leaderboardRank: index + 1,
      }));
  }

  /**
   * Get overall leaderboard
   */
  getOverallLeaderboard(limit: number = 100): PlayerProgression[] {
    return Array.from(this.progressions.values())
      .sort((a, b) => {
        // Sort by level desc, then XP desc, then name
        if (a.currentLevel !== b.currentLevel) {
          return b.currentLevel - a.currentLevel;
        }
        if (a.totalXP !== b.totalXP) {
          return b.totalXP - a.totalXP;
        }
        return a.entityName.localeCompare(b.entityName);
      })
      .slice(0, limit)
      .map((p, index) => ({
        ...p,
        leaderboardRank: index + 1,
      }));
  }

  /**
   * Get next tier requirements
   */
  getNextTierRequirements(progressionId: string): ProgressionTierConfig | null {
    const progression = this.progressions.get(progressionId);
    if (!progression) return null;

    const tierOrder: ('bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master')[] = [
      'bronze',
      'silver',
      'gold',
      'platinum',
      'diamond',
      'master',
    ];

    const currentIndex = tierOrder.indexOf(progression.currentTier);
    if (currentIndex >= tierOrder.length - 1) {
      return null; // Already at max tier
    }

    const nextTier = tierOrder[currentIndex + 1];
    return this.tierConfigs.get(nextTier) || null;
  }

  /**
   * Get progression badge by ID
   */
  getBadge(badgeId: string): ProgressionBadge | undefined {
    return this.badges.get(badgeId);
  }

  /**
   * Get all badges
   */
  getAllBadges(): ProgressionBadge[] {
    return Array.from(this.badges.values());
  }

  /**
   * Get milestone by ID
   */
  getMilestone(milestoneId: string): ProgressionMilestone | undefined {
    return this.milestones.get(milestoneId);
  }

  /**
   * Get all milestones
   */
  getAllMilestones(): ProgressionMilestone[] {
    return Array.from(this.milestones.values());
  }

  /**
   * Generate ERC-721 metadata for NFT
   */
  generateMetadata(progressionId: string): Record<string, unknown> | null {
    const progression = this.progressions.get(progressionId);
    if (!progression) return null;

    return {
      name: `${progression.entityName} - Level ${progression.currentLevel} ${progression.currentTier.toUpperCase()}`,
      description: `${progression.entityType === 'player' ? 'Player' : 'Team'} progression achievement. ${progression.currentLevel} levels completed, ${progression.totalXP} total XP earned.`,
      image: `ipfs://progression/${progression.progressionId}`,
      attributes: [
        { trait_type: 'Entity Type', value: progression.entityType },
        { trait_type: 'Level', value: progression.currentLevel },
        { trait_type: 'Tier', value: progression.currentTier },
        { trait_type: 'Total XP', value: progression.totalXP },
        { trait_type: 'Matches Played', value: progression.matchesPlayed },
        { trait_type: 'Win Rate', value: Math.round(progression.winRate) },
        { trait_type: 'Average Rating', value: progression.averageRating.toFixed(2) },
        { trait_type: 'Goals Scored', value: progression.goalsScored },
        { trait_type: 'Assists', value: progression.assists },
        { trait_type: 'Badges Earned', value: progression.achievedBadges.length },
        { trait_type: 'Longest Streak', value: progression.longestStreak },
      ],
    };
  }

  /**
   * Private helper: Check for tier promotion
   */
  private checkTierPromotion(progressionId: string): void {
    const progression = this.progressions.get(progressionId);
    if (!progression) return;

    const tierOrder: ('bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master')[] = [
      'bronze',
      'silver',
      'gold',
      'platinum',
      'diamond',
      'master',
    ];

    const tierConfigs = Array.from(this.tierConfigs.values()).sort(
      (a, b) => a.minLevel - b.minLevel
    );

    for (const config of tierConfigs) {
      if (
        progression.currentLevel >= config.minLevel &&
        progression.totalXP >= config.minTotalXP &&
        tierOrder.indexOf(progression.currentTier) < tierOrder.indexOf(config.tier)
      ) {
        progression.currentTier = config.tier;
        progression.lastTierUp = Date.now();

        // Award tier-up benefits
        if (config.unlockBenefits.badgeReward) {
          this.awardBadge(progressionId, config.unlockBenefits.badgeReward);
        }
      }
    }
  }

  /**
   * Private helper: Check milestone progress
   */
  private checkMilestoneProgress(progressionId: string): void {
    const progression = this.progressions.get(progressionId);
    if (!progression) return;

    for (const milestone of progression.currentMilestoneProgress) {
      if (milestone.completed) continue;

      // Update progress based on category
      switch (milestone.category) {
        case 'wins':
          milestone.progress = progression.matchesWon;
          break;
        case 'goals':
          milestone.progress = progression.goalsScored;
          break;
        case 'assists':
          milestone.progress = progression.assists;
          break;
        case 'consistency':
          milestone.progress = Math.round(progression.consistencyScore);
          break;
        case 'versatility':
          milestone.progress = Math.round(progression.versatilityScore);
          break;
      }

      if (milestone.progress >= milestone.target && !milestone.completed) {
        this.completeMilestone(progressionId, milestone.milestoneId);
      }
    }
  }

  /**
   * Private helper: Update consistency score
   */
  private updateConsistencyScore(progressionId: string): void {
    const progression = this.progressions.get(progressionId);
    if (!progression || progression.matchesPlayed < 5) return;

    // Simplified: high average rating with low variance = high consistency
    // For now, we use average rating as proxy (real implementation would track variance)
    progression.consistencyScore = Math.min(100, (progression.averageRating / 10) * 100);
  }

  /**
   * Private helper: Get tier XP required
   */
  private getTierXPRequired(tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master'): number {
    const tierConfig = this.tierConfigs.get(tier);
    return tierConfig?.minTotalXP || 0;
  }

  /**
   * Private helper: Get initial milestones
   */
  private getInitialMilestones(): PlayerProgression['currentMilestoneProgress'] {
    return [
      { milestoneId: 'ms_wins_10', category: 'wins', progress: 0, target: 10, completed: false },
      { milestoneId: 'ms_goals_25', category: 'goals', progress: 0, target: 25, completed: false },
      { milestoneId: 'ms_assists_15', category: 'assists', progress: 0, target: 15, completed: false },
      { milestoneId: 'ms_consistency_50', category: 'consistency', progress: 0, target: 50, completed: false },
    ];
  }

  /**
   * Private helper: Initialize milestones
   */
  private initializeMilestones(): void {
    const milestones: ProgressionMilestone[] = [
      {
        milestoneId: 'ms_wins_10',
        name: 'First Steps',
        description: 'Win 10 matches',
        category: 'wins',
        targetValue: 10,
        xpReward: 500,
        tier: 'bronze',
        isRepeatable: false,
      },
      {
        milestoneId: 'ms_wins_50',
        name: 'Rising Star',
        description: 'Win 50 matches',
        category: 'wins',
        targetValue: 50,
        xpReward: 2000,
        badgeReward: 'star-badge',
        tier: 'silver',
        isRepeatable: false,
      },
      {
        milestoneId: 'ms_wins_100',
        name: 'Veteran',
        description: 'Win 100 matches',
        category: 'wins',
        targetValue: 100,
        xpReward: 5000,
        badgeReward: 'veteran-badge',
        tier: 'gold',
        isRepeatable: false,
      },
      {
        milestoneId: 'ms_goals_25',
        name: 'Marksman',
        description: 'Score 25 goals',
        category: 'goals',
        targetValue: 25,
        xpReward: 750,
        badgeReward: 'marksman-badge',
        tier: 'silver',
        isRepeatable: false,
      },
      {
        milestoneId: 'ms_assists_15',
        name: 'Playmaker',
        description: 'Record 15 assists',
        category: 'assists',
        targetValue: 15,
        xpReward: 500,
        badgeReward: 'playmaker-badge',
        tier: 'bronze',
        isRepeatable: false,
      },
      {
        milestoneId: 'ms_consistency_50',
        name: 'Reliable',
        description: 'Achieve 50% consistency score',
        category: 'consistency',
        targetValue: 50,
        xpReward: 1000,
        badgeReward: 'reliable-badge',
        tier: 'silver',
        isRepeatable: false,
      },
    ];

    for (const milestone of milestones) {
      this.milestones.set(milestone.milestoneId, milestone);
    }
  }

  /**
   * Private helper: Initialize badges
   */
  private initializeBadges(): void {
    const badges: ProgressionBadge[] = [
      {
        badgeId: 'star-badge',
        name: 'Rising Star',
        description: 'Achieved 50 wins',
        category: 'milestone',
        icon: '⭐',
        color: '#FFD700',
        rarity: 'rare',
        unlockCondition: 'Win 50 matches',
      },
      {
        badgeId: 'veteran-badge',
        name: 'Veteran',
        description: 'Achieved 100 wins',
        category: 'milestone',
        icon: '🏆',
        color: '#9370DB',
        rarity: 'epic',
        unlockCondition: 'Win 100 matches',
      },
      {
        badgeId: 'marksman-badge',
        name: 'Marksman',
        description: 'Scored 25 goals',
        category: 'performance',
        icon: '🎯',
        color: '#FF6B6B',
        rarity: 'rare',
        unlockCondition: 'Score 25 goals',
      },
      {
        badgeId: 'playmaker-badge',
        name: 'Playmaker',
        description: 'Recorded 15 assists',
        category: 'performance',
        icon: '🎪',
        color: '#4ECDC4',
        rarity: 'rare',
        unlockCondition: 'Record 15 assists',
      },
      {
        badgeId: 'reliable-badge',
        name: 'Reliable',
        description: 'Achieved 50% consistency',
        category: 'consistency',
        icon: '✅',
        color: '#00D26A',
        rarity: 'uncommon',
        unlockCondition: 'Maintain 50% consistency score',
      },
      {
        badgeId: 'silver-badge',
        name: 'Silver Tier',
        description: 'Reached Silver tier',
        category: 'seasonal',
        icon: '🥈',
        color: '#C0C0C0',
        rarity: 'uncommon',
        unlockCondition: 'Reach Silver tier',
      },
    ];

    for (const badge of badges) {
      this.badges.set(badge.badgeId, badge);
    }
  }

  /**
   * Private helper: Generate level configurations
   */
  private generateLevelConfigs(): Map<number, ProgressionLevelConfig> {
    const configs = new Map<number, ProgressionLevelConfig>();

    for (let level = 1; level <= 100; level++) {
      // XP requirements scale up: roughly 1000 + (level-1) * 100
      const xpRequired = Math.floor(1000 + (level - 1) * 100);

      configs.set(level, {
        level,
        xpRequired,
        rewards:
          level % 10 === 0
            ? [
                { type: 'token', amount: level * 10 },
                { type: 'cosmetic', amount: 1 },
              ]
            : [{ type: 'xp', amount: 50 }],
      });
    }

    return configs;
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        progressions: Array.from(this.progressions.entries()),
      };
      localStorage.setItem('progression_system', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving progression data:', error);
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('progression_system');
      if (stored) {
        const data = JSON.parse(stored);
        if (Array.isArray(data.progressions)) {
          for (const [key, value] of data.progressions) {
            this.progressions.set(key, value);
          }
        }
      }
    } catch (error) {
      console.error('Error loading progression data:', error);
    }
  }
}
