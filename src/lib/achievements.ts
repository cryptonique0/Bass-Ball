/**
 * Achievements and badge system
 * 
 * Tracks player progress toward various milestones and awards badges
 * for accomplishments in different categories.
 */

export type AchievementCategory = 'goals' | 'defense' | 'teamwork' | 'progression' | 'milestones' | 'special';

/** Achievement rarity levels */
export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

/** Achievement definition */
export interface Achievement {
  /** Unique achievement identifier */
  id: string;
  /** Display name */
  name: string;
  /** Description of what is required */
  description: string;
  /** Category for organization */
  category: AchievementCategory;
  /** Icon or emoji */
  icon: string;
  /** Points awarded when unlocked */
  points: number;
  /** Requirement to unlock */
  requirement: {
    /** Type of requirement */
    type: string;
    /** Target value */
    value: number;
  };
  /** Rarity level */
  rarity: AchievementRarity;
  /** Hidden achievement (not shown until unlocked) */
  hidden?: boolean;
}

/** Player's progress toward an achievement */
export interface PlayerAchievement {
  playerId: string;
  achievementId: string;
  unlockedAt: number;
  progress: number; // 0-100
}

const ACHIEVEMENTS: Record<string, Achievement> = {
  'first-goal': {
    id: 'first-goal',
    name: 'First Blood',
    description: 'Score your first goal',
    category: 'goals',
    icon: '⚽',
    points: 10,
    requirement: { type: 'goals', value: 1 },
    rarity: 'common',
  },
  'hat-trick': {
    id: 'hat-trick',
    name: 'Hat Trick',
    description: 'Score 3 goals in a single match',
    category: 'goals',
    icon: '⚽⚽⚽',
    points: 50,
    requirement: { type: 'goals-match', value: 3 },
    rarity: 'rare',
  },
  'clean-sheet': {
    id: 'clean-sheet',
    name: 'Clean Sheet',
    description: 'Prevent any goals while playing as defender',
    category: 'defense',
    icon: '🛡️',
    points: 25,
    requirement: { type: 'clean-sheets', value: 1 },
    rarity: 'uncommon',
  },
  'perfect-pass': {
    id: 'perfect-pass',
    name: 'Perfect Passes',
    description: 'Achieve 100% pass accuracy in a match',
    category: 'teamwork',
    icon: '🎯',
    points: 30,
    requirement: { type: 'pass-accuracy', value: 100 },
    rarity: 'rare',
  },
  'level-10': {
    id: 'level-10',
    name: 'Experienced',
    description: 'Reach level 10',
    category: 'progression',
    icon: '📈',
    points: 40,
    requirement: { type: 'level', value: 10 },
    rarity: 'uncommon',
  },
  'legend': {
    id: 'legend',
    name: 'Living Legend',
    description: 'Reach level 50',
    category: 'progression',
    icon: '👑',
    points: 200,
    requirement: { type: 'level', value: 50 },
    rarity: 'legendary',
  },
  '100-matches': {
    id: '100-matches',
    name: 'Century Club',
    description: 'Play 100 matches',
    category: 'milestones',
    icon: '💯',
    points: 100,
    requirement: { type: 'matches', value: 100 },
    rarity: 'rare',
  },
  'tournament-winner': {
    id: 'tournament-winner',
    name: 'Champion',
    description: 'Win a tournament',
    category: 'special',
    icon: '🏆',
    points: 150,
    requirement: { type: 'tournaments-won', value: 1 },
    rarity: 'epic',
  },
};

/**
 * Achievement tracking and management service
 */
export class AchievementService {
  private playerAchievements: Map<string, PlayerAchievement[]> = new Map();
  private listeners: Map<string, Array<(achievement: Achievement) => void>> = new Map();

  /**
   * Get all available achievements
   */
  getAllAchievements(): Achievement[] {
    return Object.values(ACHIEVEMENTS);
  }

  /**
   * Get achievements by category
   */
  getAchievementsByCategory(category: AchievementCategory): Achievement[] {
    return this.getAllAchievements().filter(a => a.category === category);
  }

  /**
   * Get achievements by rarity
   */
  getAchievementsByRarity(rarity: AchievementRarity): Achievement[] {
    return this.getAllAchievements().filter(a => a.rarity === rarity);
  }

  /**
   * Get achievement by ID
   * @throws {Error} If achievement ID is invalid
   */
  getAchievement(id: string): Achievement | undefined {
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid achievement ID');
    }
    return ACHIEVEMENTS[id];
  }

  /**
   * Check if player has unlocked an achievement
   */
  hasAchievement(playerId: string, achievementId: string): boolean {
    if (!playerId || !achievementId) return false;
    const achievements = this.playerAchievements.get(playerId) || [];
    return achievements.some((a) => a.achievementId === achievementId && a.progress === 100);
  }

  /**
   * Get player's progress toward an achievement (0-100)
   */
  getProgress(playerId: string, achievementId: string): number {
    const achievements = this.playerAchievements.get(playerId) || [];
    const achievement = achievements.find(a => a.achievementId === achievementId);
    return achievement?.progress ?? 0;
  }

  /**
   * Unlock achievement for a player
   * @returns True if achievement was newly unlocked, false otherwise
   */
  unlockAchievement(playerId: string, achievementId: string): boolean {
    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement) {
      console.warn(`[AchievementService] Unknown achievement: ${achievementId}`);
      return false;
    }

    if (!this.playerAchievements.has(playerId)) {
      this.playerAchievements.set(playerId, []);
    }

    const existing = (this.playerAchievements.get(playerId) || []).find(
      (a) => a.achievementId === achievementId
    );

    if (existing && existing.progress === 100) {
      return false; // Already unlocked
    }

    if (!existing) {
      this.playerAchievements.get(playerId)!.push({
        playerId,
        achievementId,
        unlockedAt: Date.now(),
        progress: 100,
      });
    } else {
      existing.progress = 100;
      existing.unlockedAt = Date.now();
    }

    return true;
  }

  /**
   * Update achievement progress
   */
  updateProgress(playerId: string, achievementId: string, progress: number): void {
    if (!this.playerAchievements.has(playerId)) {
      this.playerAchievements.set(playerId, []);
    }

    let playerAchievement = (this.playerAchievements.get(playerId) || []).find(
      (a) => a.achievementId === achievementId
    );

    if (!playerAchievement) {
      playerAchievement = {
        playerId,
        achievementId,
        unlockedAt: Date.now(),
        progress: 0,
      };
      this.playerAchievements.get(playerId)!.push(playerAchievement);
    }

    playerAchievement.progress = Math.min(100, progress);

    if (playerAchievement.progress === 100) {
      playerAchievement.unlockedAt = Date.now();
    }
  }

  /**
   * Get player achievements
   */
  getPlayerAchievements(playerId: string) {
    const achievements = this.playerAchievements.get(playerId) || [];

    return achievements.map((pa) => ({
      ...ACHIEVEMENTS[pa.achievementId],
      unlockedAt: pa.unlockedAt,
      progress: pa.progress,
    }));
  }

  /**
   * Get player stats
   */
  getPlayerStats(playerId: string) {
    const achievements = this.getPlayerAchievements(playerId);
    const unlockedCount = achievements.filter((a) => a.progress === 100).length;
    const totalPoints = achievements.filter((a) => a.progress === 100).reduce((sum, a) => sum + a.points, 0);

    return {
      playerId,
      totalAchievements: unlockedCount,
      totalPoints,
      byCategory: achievements.reduce(
        (acc, a) => {
          if (!acc[a.category]) acc[a.category] = 0;
          if (a.progress === 100) acc[a.category]++;
          return acc;
        },
        {} as Record<AchievementCategory, number>
      ),
    };
  }
}
