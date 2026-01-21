/**
 * Meta-Game Analytics Library
 * Analyzes formations, strategies, and meta trends
 */

export interface Formation {
  id: string;
  name: string; // e.g., "4-3-3", "5-2-3", "3-5-2"
  description: string;
  positions: {
    goalkeeper: number;
    defenders: number;
    midfielders: number;
    forwards: number;
  };
  defensiveRating: number; // 0-100
  offensiveRating: number; // 0-100
  balanceRating: number; // 0-100
}

export interface FormationStats {
  formationId: string;
  formationName: string;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  avgPossession: number; // percentage
  avgShotsPerMatch: number;
  avgAccuracy: number; // passing accuracy
  lastUpdated: number;
}

export interface Strategy {
  id: string;
  name: string;
  formationId: string;
  keyTactics: string[]; // e.g., ["high_press", "wing_play", "counter_attack"]
  strength: string; // primary strength
  weakness: string; // primary weakness
  winRate: number; // 0-100
  createdAt: number;
}

export interface CounterStrategy {
  id: string;
  counterToStrategyId: string;
  strategyId: string;
  effectiveness: number; // 0-100 (win rate against target)
  description: string;
  keyActions: string[];
  lastUsed: number;
}

export interface MetaTrend {
  id: string;
  period: 'week' | 'month' | 'season';
  type: 'formation' | 'strategy' | 'tactic' | 'player_role';
  trend: string; // what's trending (e.g., "4-2-3-1")
  popularity: number; // 0-100 (% of matches using it)
  successRate: number; // 0-100 (win rate)
  direction: 'rising' | 'falling' | 'stable';
  momentum: number; // growth rate (-100 to 100)
  timestamp: number;
}

export interface PlayerRole {
  id: string;
  name: string; // e.g., "False 9", "Box-to-Box", "Wing-Back"
  primaryPosition: string;
  requiredSkills: string[];
  tacticalResponsibilities: string[];
  offensiveContribution: number; // 0-100
  defensiveContribution: number; // 0-100
}

export interface RolePerformance {
  roleId: string;
  playerId: string;
  matchId: string;
  effectiveness: number; // 0-100
  tacticalCorrectness: number; // 0-100 (did they execute responsibilities?)
  interactionQuality: number; // 0-100 (coordination with teammates)
  timestamp: number;
}

export interface MetaMismatch {
  id: string;
  formationA: string;
  formationB: string;
  favoredBy: 'A' | 'B' | 'neutral';
  advantageMargin: number; // 0-100
  winRateAdvantage: number; // percentage points
  matchesAnalyzed: number;
  lastAnalyzed: number;
}

export class MetaAnalyticsService {
  private formations = new Map<string, Formation>();
  private formationStats = new Map<string, FormationStats>();
  private strategies = new Map<string, Strategy>();
  private counterStrategies = new Map<string, CounterStrategy>();
  private metaTrends = new Map<string, MetaTrend>();
  private playerRoles = new Map<string, PlayerRole>();
  private rolePerformances = new Map<string, RolePerformance>();
  private metaMismatches = new Map<string, MetaMismatch>();

  constructor() {
    this.initializeDefaultFormations();
    this.loadFromStorage();
  }

  private initializeDefaultFormations() {
    const defaultFormations: Formation[] = [
      {
        id: 'f_433',
        name: '4-3-3',
        description: 'Balanced attacking formation',
        positions: { goalkeeper: 1, defenders: 4, midfielders: 3, forwards: 3 },
        defensiveRating: 70,
        offensiveRating: 85,
        balanceRating: 80
      },
      {
        id: 'f_442',
        name: '4-4-2',
        description: 'Classic balanced formation',
        positions: { goalkeeper: 1, defenders: 4, midfielders: 4, forwards: 2 },
        defensiveRating: 75,
        offensiveRating: 70,
        balanceRating: 75
      },
      {
        id: 'f_532',
        name: '5-3-2',
        description: 'Defensive formation',
        positions: { goalkeeper: 1, defenders: 5, midfielders: 3, forwards: 2 },
        defensiveRating: 90,
        offensiveRating: 60,
        balanceRating: 65
      },
      {
        id: 'f_352',
        name: '3-5-2',
        description: 'Attacking formation',
        positions: { goalkeeper: 1, defenders: 3, midfielders: 5, forwards: 2 },
        defensiveRating: 60,
        offensiveRating: 90,
        balanceRating: 70
      },
      {
        id: 'f_4231',
        name: '4-2-3-1',
        description: 'Controlled possession formation',
        positions: { goalkeeper: 1, defenders: 4, midfielders: 5, forwards: 1 },
        defensiveRating: 80,
        offensiveRating: 75,
        balanceRating: 85
      }
    ];

    defaultFormations.forEach(f => this.formations.set(f.id, f));
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('metaAnalytics:global');
      if (stored) {
        const data = JSON.parse(stored);
        data.formationStats?.forEach((s: FormationStats) =>
          this.formationStats.set(s.formationId, s)
        );
        data.strategies?.forEach((s: Strategy) => this.strategies.set(s.id, s));
        data.counterStrategies?.forEach((c: CounterStrategy) =>
          this.counterStrategies.set(c.id, c)
        );
        data.metaTrends?.forEach((t: MetaTrend) => this.metaTrends.set(t.id, t));
        data.playerRoles?.forEach((r: PlayerRole) => this.playerRoles.set(r.id, r));
        data.rolePerformances?.forEach((p: RolePerformance) =>
          this.rolePerformances.set(`${p.roleId}:${p.playerId}:${p.matchId}`, p)
        );
        data.metaMismatches?.forEach((m: MetaMismatch) =>
          this.metaMismatches.set(m.id, m)
        );
      }
    } catch (error) {
      console.error('Failed to load meta analytics from storage:', error);
    }
  }

  private saveToStorage() {
    try {
      const data = {
        formationStats: Array.from(this.formationStats.values()),
        strategies: Array.from(this.strategies.values()),
        counterStrategies: Array.from(this.counterStrategies.values()),
        metaTrends: Array.from(this.metaTrends.values()),
        playerRoles: Array.from(this.playerRoles.values()),
        rolePerformances: Array.from(this.rolePerformances.values()),
        metaMismatches: Array.from(this.metaMismatches.values())
      };
      localStorage.setItem('metaAnalytics:global', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save meta analytics to storage:', error);
    }
  }

  // ==================== FORMATION METHODS ====================

  getFormation(formationId: string): Formation | undefined {
    return this.formations.get(formationId);
  }

  getAllFormations(): Formation[] {
    return Array.from(this.formations.values());
  }

  getFormationStats(formationId: string): FormationStats | undefined {
    return this.formationStats.get(formationId);
  }

  recordFormationMatch(
    formationId: string,
    result: 'win' | 'draw' | 'loss',
    stats: {
      possession: number;
      goalsFor: number;
      goalsAgainst: number;
      shots: number;
      accuracy: number;
    }
  ): FormationStats {
    const formation = this.formations.get(formationId);
    if (!formation) throw new Error(`Formation ${formationId} not found`);

    let existing = this.formationStats.get(formationId);
    if (!existing) {
      existing = {
        formationId,
        formationName: formation.name,
        matchesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        avgPossession: 0,
        avgShotsPerMatch: 0,
        avgAccuracy: 0,
        lastUpdated: Date.now()
      };
    }

    const prevMatches = existing.matchesPlayed;
    existing.matchesPlayed++;

    if (result === 'win') existing.wins++;
    else if (result === 'draw') existing.draws++;
    else existing.losses++;

    existing.goalsFor += stats.goalsFor;
    existing.goalsAgainst += stats.goalsAgainst;
    existing.avgPossession = (existing.avgPossession * prevMatches + stats.possession) / existing.matchesPlayed;
    existing.avgShotsPerMatch = (existing.avgShotsPerMatch * prevMatches + stats.shots) / existing.matchesPlayed;
    existing.avgAccuracy = (existing.avgAccuracy * prevMatches + stats.accuracy) / existing.matchesPlayed;
    existing.lastUpdated = Date.now();

    this.formationStats.set(formationId, existing);
    this.saveToStorage();
    return existing;
  }

  getTopFormations(limit: number = 5): FormationStats[] {
    return Array.from(this.formationStats.values())
      .sort((a, b) => {
        const aWinRate = a.matchesPlayed > 0 ? a.wins / a.matchesPlayed : 0;
        const bWinRate = b.matchesPlayed > 0 ? b.wins / b.matchesPlayed : 0;
        return bWinRate - aWinRate;
      })
      .slice(0, limit);
  }

  // ==================== STRATEGY METHODS ====================

  createStrategy(
    name: string,
    formationId: string,
    keyTactics: string[],
    strength: string,
    weakness: string
  ): Strategy {
    const strategy: Strategy = {
      id: `str_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      formationId,
      keyTactics,
      strength,
      weakness,
      winRate: 0,
      createdAt: Date.now()
    };

    this.strategies.set(strategy.id, strategy);
    this.saveToStorage();
    return strategy;
  }

  getStrategy(strategyId: string): Strategy | undefined {
    return this.strategies.get(strategyId);
  }

  updateStrategyWinRate(strategyId: string, matches: number, wins: number): void {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) return;

    strategy.winRate = matches > 0 ? Math.round((wins / matches) * 100) : 0;
    this.saveToStorage();
  }

  getFormationStrategies(formationId: string): Strategy[] {
    return Array.from(this.strategies.values()).filter(s => s.formationId === formationId);
  }

  getAllStrategies(): Strategy[] {
    return Array.from(this.strategies.values());
  }

  // ==================== COUNTER STRATEGY METHODS ====================

  addCounterStrategy(
    counterToStrategyId: string,
    strategyId: string,
    effectiveness: number,
    keyActions: string[]
  ): CounterStrategy {
    const counter: CounterStrategy = {
      id: `ctr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      counterToStrategyId,
      strategyId,
      effectiveness: Math.min(100, Math.max(0, effectiveness)),
      description: `Counter to ${this.strategies.get(counterToStrategyId)?.name || 'Unknown'}`,
      keyActions,
      lastUsed: Date.now()
    };

    this.counterStrategies.set(counter.id, counter);
    this.saveToStorage();
    return counter;
  }

  getCounters(strategyId: string): CounterStrategy[] {
    return Array.from(this.counterStrategies.values()).filter(
      c => c.counterToStrategyId === strategyId
    );
  }

  getBestCounter(strategyId: string): CounterStrategy | undefined {
    const counters = this.getCounters(strategyId);
    return counters.length > 0
      ? counters.reduce((best, current) =>
          current.effectiveness > best.effectiveness ? current : best
        )
      : undefined;
  }

  // ==================== META TREND METHODS ====================

  recordTrend(
    type: MetaTrend['type'],
    trend: string,
    popularity: number,
    successRate: number
  ): MetaTrend {
    const metaTrend: MetaTrend = {
      id: `trend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      period: 'season',
      type,
      trend,
      popularity: Math.min(100, Math.max(0, popularity)),
      successRate: Math.min(100, Math.max(0, successRate)),
      direction: 'stable',
      momentum: 0,
      timestamp: Date.now()
    };

    // Calculate momentum based on similar recent trends
    const similar = Array.from(this.metaTrends.values())
      .filter(t => t.type === type && t.trend === trend)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 3);

    if (similar.length > 0) {
      const prevPopularity = similar[0].popularity;
      const popularityChange = popularity - prevPopularity;

      if (popularityChange > 5) {
        metaTrend.direction = 'rising';
        metaTrend.momentum = Math.min(100, popularityChange * 2);
      } else if (popularityChange < -5) {
        metaTrend.direction = 'falling';
        metaTrend.momentum = Math.max(-100, popularityChange * 2);
      } else {
        metaTrend.direction = 'stable';
        metaTrend.momentum = 0;
      }
    }

    this.metaTrends.set(metaTrend.id, metaTrend);
    this.saveToStorage();
    return metaTrend;
  }

  getTrends(type?: MetaTrend['type']): MetaTrend[] {
    return Array.from(this.metaTrends.values())
      .filter(t => !type || t.type === type)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  getRisingTrends(): MetaTrend[] {
    return this.getTrends().filter(t => t.direction === 'rising').slice(0, 10);
  }

  getFallingTrends(): MetaTrend[] {
    return this.getTrends().filter(t => t.direction === 'falling').slice(0, 10);
  }

  // ==================== PLAYER ROLE METHODS ====================

  createPlayerRole(
    name: string,
    primaryPosition: string,
    requiredSkills: string[],
    tacticalResponsibilities: string[],
    offensiveContribution: number,
    defensiveContribution: number
  ): PlayerRole {
    const role: PlayerRole = {
      id: `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      primaryPosition,
      requiredSkills,
      tacticalResponsibilities,
      offensiveContribution: Math.min(100, Math.max(0, offensiveContribution)),
      defensiveContribution: Math.min(100, Math.max(0, defensiveContribution))
    };

    this.playerRoles.set(role.id, role);
    this.saveToStorage();
    return role;
  }

  getPlayerRole(roleId: string): PlayerRole | undefined {
    return this.playerRoles.get(roleId);
  }

  getAllPlayerRoles(): PlayerRole[] {
    return Array.from(this.playerRoles.values());
  }

  recordRolePerformance(
    roleId: string,
    playerId: string,
    matchId: string,
    effectiveness: number,
    tacticalCorrectness: number,
    interactionQuality: number
  ): RolePerformance {
    const performance: RolePerformance = {
      roleId,
      playerId,
      matchId,
      effectiveness: Math.min(100, Math.max(0, effectiveness)),
      tacticalCorrectness: Math.min(100, Math.max(0, tacticalCorrectness)),
      interactionQuality: Math.min(100, Math.max(0, interactionQuality)),
      timestamp: Date.now()
    };

    this.rolePerformances.set(`${roleId}:${playerId}:${matchId}`, performance);
    this.saveToStorage();
    return performance;
  }

  getPlayerRoleHistory(playerId: string): RolePerformance[] {
    return Array.from(this.rolePerformances.values())
      .filter(p => p.playerId === playerId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  // ==================== META MISMATCH METHODS ====================

  analyzeFormationMismatch(
    formationAId: string,
    formationBId: string,
    matches: number,
    winsA: number
  ): MetaMismatch {
    const winsB = matches - winsA;
    const favoredBy = winsA > winsB ? 'A' : winsB > winsA ? 'B' : 'neutral';
    const maxWins = Math.max(winsA, winsB);
    const advantageMargin = matches > 0 ? Math.round((maxWins / matches) * 100) : 50;
    const winRateAdvantage = Math.abs(winsA - winsB);

    const mismatch: MetaMismatch = {
      id: `mm_${formationAId}_${formationBId}_${Date.now()}`,
      formationA: formationAId,
      formationB: formationBId,
      favoredBy,
      advantageMargin,
      winRateAdvantage,
      matchesAnalyzed: matches,
      lastAnalyzed: Date.now()
    };

    this.metaMismatches.set(mismatch.id, mismatch);
    this.saveToStorage();
    return mismatch;
  }

  getMismatch(formationAId: string, formationBId: string): MetaMismatch | undefined {
    return Array.from(this.metaMismatches.values()).find(
      m =>
        (m.formationA === formationAId && m.formationB === formationBId) ||
        (m.formationA === formationBId && m.formationB === formationAId)
    );
  }

  getFormationMatchups(formationId: string): MetaMismatch[] {
    return Array.from(this.metaMismatches.values()).filter(
      m => m.formationA === formationId || m.formationB === formationId
    );
  }

  // ==================== UTILITY METHODS ====================

  getMetaSummary(): {
    totalStrategies: number;
    activeTrends: number;
    topFormation: string;
    metaShift: number;
  } {
    const strategies = Array.from(this.strategies.values());
    const trends = this.getTrends();
    const topFormation = this.getTopFormations(1)[0];

    let metaShift = 0;
    const risingCount = this.getRisingTrends().length;
    const fallingCount = this.getFallingTrends().length;
    metaShift = risingCount - fallingCount;

    return {
      totalStrategies: strategies.length,
      activeTrends: trends.length,
      topFormation: topFormation?.formationName || 'Unknown',
      metaShift
    };
  }

  getFormationAdvantage(formationId: string): number {
    const stats = this.getFormationStats(formationId);
    if (!stats || stats.matchesPlayed === 0) return 0;

    const winRate = stats.wins / stats.matchesPlayed;
    const drawRate = stats.draws / stats.matchesPlayed;
    return Math.round((winRate + drawRate * 0.5) * 100);
  }

  exportMetaData(): {
    formations: FormationStats[];
    strategies: Strategy[];
    trends: MetaTrend[];
    roles: PlayerRole[];
  } {
    return {
      formations: Array.from(this.formationStats.values()),
      strategies: Array.from(this.strategies.values()),
      trends: Array.from(this.metaTrends.values()),
      roles: Array.from(this.playerRoles.values())
    };
  }
}

export const metaAnalytics = new MetaAnalyticsService();
