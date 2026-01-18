/**
 * Season Reset & Management System
 * Handles season transitions, stat preservation, progression resets, and seasonal tracking
 */

/**
 * Season configuration
 */
export interface SeasonConfig {
  seasonId: string;
  seasonNumber: number;
  seasonName: string; // e.g., "Winter 2026", "Summer 2026"
  theme?: string; // Optional theme/era
  startDate: number;
  endDate?: number;
  status: 'planning' | 'active' | 'concluded' | 'archived';
  resetRules: {
    resetLevel: boolean; // Reset to level 1?
    resetTier: boolean; // Reset to bronze?
    preserveXP: boolean; // Keep some XP?
    preserveXPPercentage?: number; // e.g., 10% carryover
    resetMatches: boolean; // Reset match count?
    preserveBadges: boolean; // Keep achievements?
    resetStreak: boolean; // Reset win streak?
  };
  resetDate: number;
}

/**
 * Player season stats (snapshot at end of season)
 */
export interface PlayerSeasonSnapshot {
  snapshotId: string;
  seasonId: string;
  entityId: string;
  entityName: string;
  entityType: 'player' | 'team';
  
  // Stats at end of season
  finalLevel: number;
  finalTier: string;
  finalXP: number;
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
  finalWinRate: number;
  goalsScored: number;
  assists: number;
  averageRating: number;
  
  // Achievements
  badgesEarned: string[];
  milestonesCompleted: string[];
  
  // Ranking
  finalRank: number;
  finalDivision?: string;
  finalPosition?: number;
  
  // Timeline
  snapshotDate: number;
  seasonStartDate: number;
  seasonEndDate: number;
}

/**
 * Season reset result
 */
export interface SeasonResetResult {
  resetId: string;
  seasonFrom: string;
  seasonTo: string;
  playersReset: number;
  teamsReset: number;
  totalRewardsIssued: number;
  resetDate: number;
  preservedData: {
    playersWithBadges: number;
    playersWithXPCarryover: number;
    playersWithLevelCarryover: number;
  };
}

/**
 * Season Manager
 * Singleton for managing season transitions and resets
 */
export class SeasonManager {
  private static instance: SeasonManager;
  private seasons: Map<string, SeasonConfig> = new Map();
  private snapshots: Map<string, PlayerSeasonSnapshot> = new Map();
  private resetHistory: Map<string, SeasonResetResult> = new Map();
  private currentSeason: string = '';

  private constructor() {
    this.loadFromStorage();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): SeasonManager {
    if (!SeasonManager.instance) {
      SeasonManager.instance = new SeasonManager();
    }
    return SeasonManager.instance;
  }

  /**
   * Create new season
   */
  createSeason(
    seasonNumber: number,
    seasonName: string,
    theme?: string,
    resetRules?: SeasonConfig['resetRules']
  ): SeasonConfig {
    const seasonId = `season_${Date.now()}`;

    const season: SeasonConfig = {
      seasonId,
      seasonNumber,
      seasonName,
      theme,
      startDate: Date.now(),
      status: 'planning',
      resetRules: resetRules || {
        resetLevel: false,
        resetTier: false,
        preserveXP: true,
        preserveXPPercentage: 10,
        resetMatches: true,
        preserveBadges: true,
        resetStreak: true,
      },
      resetDate: 0,
    };

    this.seasons.set(seasonId, season);
    this.currentSeason = seasonId;
    this.saveToStorage();

    return season;
  }

  /**
   * Activate season
   */
  activateSeason(seasonId: string): SeasonConfig | null {
    const season = this.seasons.get(seasonId);
    if (!season) return null;

    season.status = 'active';
    season.startDate = Date.now();
    this.currentSeason = seasonId;

    this.saveToStorage();
    return season;
  }

  /**
   * End season (prepare for reset)
   */
  endSeason(seasonId: string): SeasonConfig | null {
    const season = this.seasons.get(seasonId);
    if (!season) return null;

    season.status = 'concluded';
    season.endDate = Date.now();

    this.saveToStorage();
    return season;
  }

  /**
   * Take snapshot of player stats before reset
   */
  takeSnapshot(
    seasonId: string,
    entityId: string,
    entityName: string,
    entityType: 'player' | 'team',
    stats: {
      level: number;
      tier: string;
      totalXP: number;
      matchesPlayed: number;
      wins: number;
      losses: number;
      draws: number;
      winRate: number;
      goalsScored: number;
      assists: number;
      averageRating: number;
      badges: string[];
      milestones: string[];
      rank?: number;
      division?: string;
      position?: number;
    }
  ): PlayerSeasonSnapshot {
    const season = this.seasons.get(seasonId);
    if (!season) throw new Error(`Season ${seasonId} not found`);

    const snapshotId = `snap_${seasonId}_${entityId}`;

    const snapshot: PlayerSeasonSnapshot = {
      snapshotId,
      seasonId,
      entityId,
      entityName,
      entityType,
      finalLevel: stats.level,
      finalTier: stats.tier,
      finalXP: stats.totalXP,
      totalMatches: stats.matchesPlayed,
      totalWins: stats.wins,
      totalLosses: stats.losses,
      totalDraws: stats.draws,
      finalWinRate: stats.winRate,
      goalsScored: stats.goalsScored,
      assists: stats.assists,
      averageRating: stats.averageRating,
      badgesEarned: stats.badges,
      milestonesCompleted: stats.milestones,
      finalRank: stats.rank || 0,
      finalDivision: stats.division,
      finalPosition: stats.position,
      snapshotDate: Date.now(),
      seasonStartDate: season.startDate,
      seasonEndDate: season.endDate || Date.now(),
    };

    this.snapshots.set(snapshotId, snapshot);
    this.saveToStorage();

    return snapshot;
  }

  /**
   * Get season snapshot
   */
  getSnapshot(snapshotId: string): PlayerSeasonSnapshot | undefined {
    return this.snapshots.get(snapshotId);
  }

  /**
   * Get all snapshots for season
   */
  getSeasonSnapshots(seasonId: string): PlayerSeasonSnapshot[] {
    return Array.from(this.snapshots.values()).filter((s) => s.seasonId === seasonId);
  }

  /**
   * Get reset rules for season
   */
  getResetRules(seasonId: string): SeasonConfig['resetRules'] | null {
    const season = this.seasons.get(seasonId);
    return season?.resetRules || null;
  }

  /**
   * Calculate XP carryover
   */
  calculateXPCarryover(
    currentXP: number,
    resetRules: SeasonConfig['resetRules']
  ): number {
    if (!resetRules.preserveXP) return 0;

    const percentage = resetRules.preserveXPPercentage || 10;
    return Math.floor(currentXP * (percentage / 100));
  }

  /**
   * Calculate reset adjustments for progression
   */
  calculateResetAdjustments(
    currentLevel: number,
    currentTier: string,
    currentXP: number,
    resetRules: SeasonConfig['resetRules']
  ): {
    newLevel: number;
    newTier: string;
    newXP: number;
    xpCarriedOver: number;
  } {
    const xpCarryover = this.calculateXPCarryover(currentXP, resetRules);

    return {
      newLevel: resetRules.resetLevel ? 1 : currentLevel,
      newTier: resetRules.resetTier ? 'bronze' : currentTier,
      newXP: xpCarryover,
      xpCarriedOver: xpCarryover,
    };
  }

  /**
   * Execute season reset for player
   */
  executePlayerReset(
    seasonId: string,
    entityId: string,
    currentStats: any
  ): {
    newLevel: number;
    newTier: string;
    newXP: number;
    preservedBadges: string[];
    xpCarriedOver: number;
  } {
    const season = this.seasons.get(seasonId);
    if (!season) throw new Error(`Season ${seasonId} not found`);

    const resetRules = season.resetRules;

    // Take snapshot first
    this.takeSnapshot(
      seasonId,
      entityId,
      currentStats.name,
      currentStats.type,
      currentStats.stats
    );

    // Calculate new stats
    const adjustments = this.calculateResetAdjustments(
      currentStats.stats.level,
      currentStats.stats.tier,
      currentStats.stats.totalXP,
      resetRules
    );

    return {
      newLevel: adjustments.newLevel,
      newTier: adjustments.newTier,
      newXP: adjustments.newXP,
      preservedBadges: resetRules.preserveBadges ? currentStats.stats.badges : [],
      xpCarriedOver: adjustments.xpCarriedOver,
    };
  }

  /**
   * Execute full season reset
   */
  executeSeasonReset(
    fromSeasonId: string,
    toSeasonId: string,
    playerResets: Array<{
      entityId: string;
      currentStats: any;
    }>
  ): SeasonResetResult {
    const resetId = `reset_${fromSeasonId}_${toSeasonId}`;
    const resetDate = Date.now();

    let playersReset = 0;
    let totalRewardsIssued = 0;
    let playersWithBadges = 0;
    let playersWithXPCarryover = 0;
    let playersWithLevelCarryover = 0;

    for (const playerReset of playerResets) {
      const resetResult = this.executePlayerReset(
        fromSeasonId,
        playerReset.entityId,
        playerReset.currentStats
      );

      playersReset++;
      if (resetResult.preservedBadges.length > 0) playersWithBadges++;
      if (resetResult.xpCarriedOver > 0) playersWithXPCarryover++;

      const fromSeason = this.seasons.get(fromSeasonId);
      if (fromSeason && !fromSeason.resetRules.resetLevel) {
        playersWithLevelCarryover++;
      }
    }

    const result: SeasonResetResult = {
      resetId,
      seasonFrom: fromSeasonId,
      seasonTo: toSeasonId,
      playersReset,
      teamsReset: 0, // Would be calculated separately
      totalRewardsIssued,
      resetDate,
      preservedData: {
        playersWithBadges,
        playersWithXPCarryover,
        playersWithLevelCarryover,
      },
    };

    this.resetHistory.set(resetId, result);

    // Update season status
    const fromSeason = this.seasons.get(fromSeasonId);
    if (fromSeason) {
      fromSeason.status = 'archived';
      fromSeason.resetDate = resetDate;
    }

    const toSeason = this.seasons.get(toSeasonId);
    if (toSeason) {
      toSeason.status = 'active';
      toSeason.startDate = resetDate;
    }

    this.saveToStorage();
    return result;
  }

  /**
   * Get current season
   */
  getCurrentSeason(): SeasonConfig | undefined {
    return this.seasons.get(this.currentSeason);
  }

  /**
   * Get season by ID
   */
  getSeason(seasonId: string): SeasonConfig | undefined {
    return this.seasons.get(seasonId);
  }

  /**
   * Get all seasons
   */
  getAllSeasons(): SeasonConfig[] {
    return Array.from(this.seasons.values()).sort(
      (a, b) => b.seasonNumber - a.seasonNumber
    );
  }

  /**
   * Get active season
   */
  getActiveSeason(): SeasonConfig | undefined {
    return Array.from(this.seasons.values()).find((s) => s.status === 'active');
  }

  /**
   * Get previous season
   */
  getPreviousSeason(seasonId: string): SeasonConfig | undefined {
    const season = this.seasons.get(seasonId);
    if (!season) return undefined;

    return Array.from(this.seasons.values())
      .filter((s) => s.seasonNumber < season.seasonNumber)
      .sort((a, b) => b.seasonNumber - a.seasonNumber)[0];
  }

  /**
   * Get reset history
   */
  getResetHistory(seasonId?: string): SeasonResetResult[] {
    let history = Array.from(this.resetHistory.values());

    if (seasonId) {
      history = history.filter((r) => r.seasonFrom === seasonId || r.seasonTo === seasonId);
    }

    return history.sort((a, b) => b.resetDate - a.resetDate);
  }

  /**
   * Get season progression timeline
   */
  getSeasonTimeline(): SeasonConfig[] {
    return Array.from(this.seasons.values()).sort((a, b) => b.startDate - a.startDate);
  }

  /**
   * Calculate season duration
   */
  getSeasonDuration(seasonId: string): number | null {
    const season = this.seasons.get(seasonId);
    if (!season || !season.endDate) return null;

    return season.endDate - season.startDate;
  }

  /**
   * Get season statistics
   */
  getSeasonStats(seasonId: string): {
    totalSnapshots: number;
    averageFinalLevel: number;
    topTier: string;
    totalMatchesPlayed: number;
    highestWinRate: number;
  } | null {
    const snapshots = this.getSeasonSnapshots(seasonId);
    if (snapshots.length === 0) return null;

    const avgLevel = snapshots.reduce((sum, s) => sum + s.finalLevel, 0) / snapshots.length;
    const topTier = snapshots.reduce(
      (max, s) => (this.getTierRank(s.finalTier) > this.getTierRank(max) ? s.finalTier : max),
      'bronze'
    );
    const totalMatches = snapshots.reduce((sum, s) => sum + s.totalMatches, 0);
    const highestWinRate = Math.max(...snapshots.map((s) => s.finalWinRate));

    return {
      totalSnapshots: snapshots.length,
      averageFinalLevel: Math.round(avgLevel * 10) / 10,
      topTier,
      totalMatchesPlayed: totalMatches,
      highestWinRate: Math.round(highestWinRate * 10) / 10,
    };
  }

  /**
   * Private helper: Get tier rank
   */
  private getTierRank(tier: string): number {
    const tierRanks: Record<string, number> = {
      bronze: 1,
      silver: 2,
      gold: 3,
      platinum: 4,
      diamond: 5,
      master: 6,
    };
    return tierRanks[tier] || 0;
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        seasons: Array.from(this.seasons.entries()),
        snapshots: Array.from(this.snapshots.entries()),
        resetHistory: Array.from(this.resetHistory.entries()),
        currentSeason: this.currentSeason,
      };
      localStorage.setItem('season_management', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving season data:', error);
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('season_management');
      if (stored) {
        const data = JSON.parse(stored);

        if (Array.isArray(data.seasons)) {
          for (const [key, value] of data.seasons) {
            this.seasons.set(key, value);
          }
        }

        if (Array.isArray(data.snapshots)) {
          for (const [key, value] of data.snapshots) {
            this.snapshots.set(key, value);
          }
        }

        if (Array.isArray(data.resetHistory)) {
          for (const [key, value] of data.resetHistory) {
            this.resetHistory.set(key, value);
          }
        }

        this.currentSeason = data.currentSeason || '';
      }
    } catch (error) {
      console.error('Error loading season data:', error);
    }
  }
}
