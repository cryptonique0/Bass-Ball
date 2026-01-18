/**
 * Club Wars System - Competitive Clan Tournaments
 * 
 * Manage club-vs-club competitions with:
 * - War seasons and tournaments
 * - Team composition
 * - Match scheduling
 * - Leaderboards and rankings
 * - Rewards distribution
 */

export type WarStatus = 'registration' | 'active' | 'completed' | 'cancelled';
export type WarTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface WarMatch {
  matchId: string;
  warId: string;
  homeClubId: string;
  awayClubId: string;
  homeScore: number;
  awayScore: number;
  homeTeam: string[]; // player IDs
  awayTeam: string[]; // player IDs
  status: 'pending' | 'active' | 'completed';
  scheduledAt: number;
  startedAt?: number;
  completedAt?: number;
  mvpPlayerId?: string;
  homeWins: number;
  awayWins: number;
}

export interface WarMetrics {
  clubId: string;
  totalWars: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifferential: number;
  consecutiveWins: number;
  tier: WarTier;
  rating: number;
}

export interface ClubWar {
  warId: string;
  name: string;
  description: string;
  season: number;
  status: WarStatus;
  tier: WarTier;
  registrationOpenAt: number;
  registrationCloseAt: number;
  startAt: number;
  endAt: number;
  format: 'single_elimination' | 'round_robin' | 'best_of_three';
  registeredClubs: Map<string, {
    clubId: string;
    joinedAt: number;
    confirmations: number;
  }>;
  matches: WarMatch[];
  leaderboard: Array<{
    clubId: string;
    clubName: string;
    wins: number;
    losses: number;
    points: number;
    tier: WarTier;
  }>;
  rewards: Map<string, {
    position: number; // 1st, 2nd, 3rd
    softReward: number;
    hardReward: number;
    experienceReward: number;
    badge?: string;
  }>;
}

/**
 * Club Wars Manager - Manage competitive club wars
 * Singleton pattern
 */
export class ClubWarsManager {
  private static instance: ClubWarsManager;
  private wars: Map<string, ClubWar> = new Map();
  private clubMetrics: Map<string, WarMetrics> = new Map();
  private currentSeason: number = 1;
  private matchQueue: Map<string, WarMatch> = new Map();

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): ClubWarsManager {
    if (!ClubWarsManager.instance) {
      ClubWarsManager.instance = new ClubWarsManager();
    }
    return ClubWarsManager.instance;
  }

  /**
   * Create a new club war
   */
  createWar(
    name: string,
    description: string,
    tier: WarTier,
    format: 'single_elimination' | 'round_robin' | 'best_of_three',
    registrationDays: number = 7,
    warDays: number = 14
  ): ClubWar {
    const warId = `war_${this.currentSeason}_${Date.now()}`;
    const now = Date.now();

    const war: ClubWar = {
      warId,
      name,
      description,
      season: this.currentSeason,
      status: 'registration',
      tier,
      registrationOpenAt: now,
      registrationCloseAt: now + registrationDays * 24 * 60 * 60 * 1000,
      startAt: now + (registrationDays + 1) * 24 * 60 * 60 * 1000,
      endAt: now + (registrationDays + warDays) * 24 * 60 * 60 * 1000,
      format,
      registeredClubs: new Map(),
      matches: [],
      leaderboard: [],
      rewards: new Map([
        [
          '1st',
          {
            position: 1,
            softReward: 50000,
            hardReward: 500,
            experienceReward: 1000,
            badge: 'champion',
          },
        ],
        [
          '2nd',
          {
            position: 2,
            softReward: 25000,
            hardReward: 250,
            experienceReward: 500,
            badge: 'runner_up',
          },
        ],
        [
          '3rd',
          {
            position: 3,
            softReward: 10000,
            hardReward: 100,
            experienceReward: 250,
            badge: 'third_place',
          },
        ],
      ]),
    };

    this.wars.set(warId, war);
    this.saveToStorage();
    return war;
  }

  /**
   * Register club for war
   */
  registerClubForWar(warId: string, clubId: string): { success: boolean; war?: ClubWar } {
    const war = this.wars.get(warId);
    if (!war || war.status !== 'registration' || Date.now() > war.registrationCloseAt) {
      return { success: false };
    }

    if (war.registeredClubs.has(clubId)) {
      return { success: false };
    }

    war.registeredClubs.set(clubId, {
      clubId,
      joinedAt: Date.now(),
      confirmations: 1,
    });

    this.saveToStorage();
    return { success: true, war };
  }

  /**
   * Unregister club from war
   */
  unregisterClubFromWar(warId: string, clubId: string): boolean {
    const war = this.wars.get(warId);
    if (!war || war.status !== 'registration') {
      return false;
    }

    return war.registeredClubs.delete(clubId);
  }

  /**
   * Schedule war match
   */
  scheduleMatch(
    warId: string,
    homeClubId: string,
    awayClubId: string,
    scheduledAt: number,
    homeTeam: string[],
    awayTeam: string[]
  ): { success: boolean; match?: WarMatch } {
    const war = this.wars.get(warId);
    if (!war) {
      return { success: false };
    }

    const matchId = `match_${warId}_${homeClubId}_${awayClubId}_${Date.now()}`;
    const match: WarMatch = {
      matchId,
      warId,
      homeClubId,
      awayClubId,
      homeScore: 0,
      awayScore: 0,
      homeTeam,
      awayTeam,
      status: 'pending',
      scheduledAt,
      homeWins: 0,
      awayWins: 0,
    };

    war.matches.push(match);
    this.matchQueue.set(matchId, match);

    this.saveToStorage();
    return { success: true, match };
  }

  /**
   * Record match result
   */
  recordMatchResult(
    matchId: string,
    homeScore: number,
    awayScore: number,
    mvpPlayerId?: string
  ): { success: boolean } {
    const match = this.matchQueue.get(matchId);
    if (!match) {
      return { success: false };
    }

    match.homeScore = homeScore;
    match.awayScore = awayScore;
    match.status = 'completed';
    match.completedAt = Date.now();
    match.mvpPlayerId = mvpPlayerId;

    // Update metrics
    if (homeScore > awayScore) {
      match.homeWins = 1;
      this.addWarWin(match.homeClubId);
      this.addWarLoss(match.awayClubId);
    } else if (awayScore > homeScore) {
      match.awayWins = 1;
      this.addWarWin(match.awayClubId);
      this.addWarLoss(match.homeClubId);
    } else {
      // Draw
      this.addWarDraw(match.homeClubId);
      this.addWarDraw(match.awayClubId);
    }

    // Update war leaderboard
    const war = this.wars.get(match.warId);
    if (war) {
      this.updateWarLeaderboard(war);
    }

    this.saveToStorage();
    return { success: true };
  }

  /**
   * Get club war metrics
   */
  getClubMetrics(clubId: string): WarMetrics | undefined {
    return this.clubMetrics.get(clubId);
  }

  /**
   * Update club metrics
   */
  private getOrCreateMetrics(clubId: string): WarMetrics {
    if (!this.clubMetrics.has(clubId)) {
      this.clubMetrics.set(clubId, {
        clubId,
        totalWars: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winRate: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        pointDifferential: 0,
        consecutiveWins: 0,
        tier: 'bronze',
        rating: 1000,
      });
    }
    return this.clubMetrics.get(clubId)!;
  }

  /**
   * Add war win
   */
  private addWarWin(clubId: string): void {
    const metrics = this.getOrCreateMetrics(clubId);
    metrics.wins++;
    metrics.totalWars++;
    metrics.consecutiveWins++;
    metrics.rating += 25;
    this.updateTier(metrics);
  }

  /**
   * Add war loss
   */
  private addWarLoss(clubId: string): void {
    const metrics = this.getOrCreateMetrics(clubId);
    metrics.losses++;
    metrics.totalWars++;
    metrics.consecutiveWins = 0;
    metrics.rating = Math.max(800, metrics.rating - 15);
    this.updateTier(metrics);
  }

  /**
   * Add war draw
   */
  private addWarDraw(clubId: string): void {
    const metrics = this.getOrCreateMetrics(clubId);
    metrics.draws++;
    metrics.totalWars++;
    metrics.consecutiveWins = 0;
    this.updateTier(metrics);
  }

  /**
   * Update club tier based on rating
   */
  private updateTier(metrics: WarMetrics): void {
    if (metrics.rating >= 2500) {
      metrics.tier = 'diamond';
    } else if (metrics.rating >= 2000) {
      metrics.tier = 'platinum';
    } else if (metrics.rating >= 1500) {
      metrics.tier = 'gold';
    } else if (metrics.rating >= 1200) {
      metrics.tier = 'silver';
    } else {
      metrics.tier = 'bronze';
    }

    metrics.winRate = metrics.totalWars > 0 ? metrics.wins / metrics.totalWars : 0;
  }

  /**
   * Update war leaderboard
   */
  private updateWarLeaderboard(war: ClubWar): void {
    const standings = Array.from(war.registeredClubs.keys()).map(clubId => ({
      clubId,
      clubName: clubId, // Would need to fetch from ClanManager
      wins: war.matches.filter(m => (m.homeClubId === clubId && m.homeWins === 1) || (m.awayClubId === clubId && m.awayWins === 1)).length,
      losses: war.matches.filter(m => (m.homeClubId === clubId && m.awayWins === 1) || (m.awayClubId === clubId && m.homeWins === 1)).length,
      points: 0,
      tier: 'bronze',
    }));

    // Sort by wins
    standings.sort((a, b) => b.wins - a.wins);

    // Calculate points
    standings.forEach((standing, index) => {
      standing.points = (standings.length - index) * 10;
    });

    war.leaderboard = standings;
  }

  /**
   * Get all wars
   */
  getAllWars(status?: WarStatus): ClubWar[] {
    return Array.from(this.wars.values())
      .filter(w => !status || w.status === status)
      .sort((a, b) => b.season - a.season);
  }

  /**
   * Get current season wars
   */
  getCurrentSeasonWars(): ClubWar[] {
    return Array.from(this.wars.values())
      .filter(w => w.season === this.currentSeason && w.status !== 'cancelled')
      .sort((a, b) => b.startAt - a.startAt);
  }

  /**
   * Get war leaderboard
   */
  getWarLeaderboard(warId: string): ClubWar['leaderboard'] | undefined {
    return this.wars.get(warId)?.leaderboard;
  }

  /**
   * Get global leaderboard
   */
  getGlobalLeaderboard(limit: number = 20): Array<{
    clubId: string;
    wins: number;
    losses: number;
    tier: WarTier;
    rating: number;
  }> {
    return Array.from(this.clubMetrics.values())
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit)
      .map(m => ({
        clubId: m.clubId,
        wins: m.wins,
        losses: m.losses,
        tier: m.tier,
        rating: m.rating,
      }));
  }

  /**
   * Advance season
   */
  advanceSeason(): void {
    this.currentSeason++;
    this.matchQueue.clear();
    this.saveToStorage();
  }

  /**
   * Persist to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        wars: Array.from(this.wars.entries()),
        clubMetrics: Array.from(this.clubMetrics.entries()),
        currentSeason: this.currentSeason,
      };
      localStorage.setItem('club_wars_system', JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save club wars data:', e);
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    try {
      const data = JSON.parse(localStorage.getItem('club_wars_system') || '{}');
      if (data.wars) {
        this.wars = new Map(
          data.wars.map((entry: any) => [
            entry[0],
            {
              ...entry[1],
              registeredClubs: new Map(entry[1].registeredClubs || []),
              rewards: new Map(entry[1].rewards || []),
            },
          ])
        );
      }
      if (data.clubMetrics) this.clubMetrics = new Map(data.clubMetrics);
      if (data.currentSeason) this.currentSeason = data.currentSeason;
    } catch (e) {
      console.warn('Failed to load club wars data:', e);
    }
  }

  /**
   * Clear all data (development only)
   */
  clearAll(): void {
    this.wars.clear();
    this.clubMetrics.clear();
    this.matchQueue.clear();
    this.saveToStorage();
  }
}
