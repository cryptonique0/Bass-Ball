/**
 * Leagues & Divisions System
 * Multi-tier competitive structure with promotion/relegation
 */

/**
 * Division definition
 */
export interface Division {
  divisionId: string;
  name: string; // e.g., "Premier Division", "Championship"
  tier: number; // 1 = top tier, higher = lower
  level: 'elite' | 'professional' | 'amateur' | 'casual';
  season: string; // Season ID this division belongs to
  maxTeams: number;
  minMMR?: number; // Minimum MMR to participate (optional)
  maxMMR?: number; // Maximum MMR to participate (optional)
  promotionPlaces: number; // Top N teams promoted
  relegationPlaces: number; // Bottom N teams relegated
  description: string;
  createdDate: number;
}

/**
 * Team division standing
 */
export interface DivisionStanding {
  standingId: string;
  divisionId: string;
  teamId: string;
  teamName: string;
  position: number; // Current position (1 = first)
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number; // 3 points per win, 1 per draw

  // Streak tracking
  winStreak: number;
  unbeatenStreak: number;
  currentForm: ('W' | 'D' | 'L')[]; // Last 5 matches

  // Stats
  averageRating: number;
  topScorer: { playerName: string; goals: number };
  topAssister: { playerName: string; assists: number };

  // Promotion/Relegation info
  promotionOdds: number; // 0-100%
  relegationOdds: number; // 0-100%
  playoffChance: boolean; // Can still make playoffs

  // Ownership
  owner: string;

  // Timeline
  joinedDate: number;
  lastUpdated: number;
}

/**
 * League definition
 */
export interface League {
  leagueId: string;
  name: string; // e.g., "International Football League"
  country?: string;
  divisions: Division[];
  season: string; // Season ID
  totalTeams: number;
  status: 'planning' | 'active' | 'completed' | 'paused';
  startDate: number;
  endDate?: number;
  description: string;

  // Scoring & rules
  pointsPerWin: number;
  pointsPerDraw: number;
  pointsPerLoss: number;

  // Promotion & Relegation
  promotionRules: {
    divisionId: string;
    promoteTo: string; // Division ID to promote to
    count: number; // Number of teams to promote
  }[];
  relegationRules: {
    divisionId: string;
    relegateTo: string; // Division ID to relegate to
    count: number; // Number of teams to relegate
  }[];

  // Playoffs
  hasPlayoffs: boolean;
  playoffFormat?: string; // e.g., "knockout", "round-robin"

  owner: string;
  createdDate: number;
  lastUpdated: number;
}

/**
 * Season definition
 */
export interface LeagueSeason {
  seasonId: string;
  leagueId: string;
  seasonNumber: number; // 1st season, 2nd season, etc.
  seasonName: string; // e.g., "Winter 2026"
  status: 'upcoming' | 'active' | 'completed';
  startDate: number;
  endDate?: number;
  leaderboard: {
    position: number;
    teamId: string;
    teamName: string;
    points: number;
    matchesPlayed: number;
  }[];
}

/**
 * Promotion/Relegation event
 */
export interface PromotionRelegaltion {
  eventId: string;
  season: string;
  date: number;
  fromDivision: string;
  toDivision: string;
  teams: string[]; // Team IDs promoted/relegated
  type: 'promotion' | 'relegation' | 'playoff';
}

/**
 * Leagues & Divisions Manager
 * Singleton for managing league structure and standings
 */
export class LeagueManager {
  private static instance: LeagueManager;
  private leagues: Map<string, League> = new Map();
  private divisions: Map<string, Division> = new Map();
  private standings: Map<string, DivisionStanding> = new Map();
  private seasons: Map<string, LeagueSeason> = new Map();
  private promotionHistory: Map<string, PromotionRelegaltion> = new Map();

  private constructor() {
    this.loadFromStorage();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): LeagueManager {
    if (!LeagueManager.instance) {
      LeagueManager.instance = new LeagueManager();
    }
    return LeagueManager.instance;
  }

  /**
   * Create new league
   */
  createLeague(
    name: string,
    country: string | undefined,
    owner: string,
    description: string = ''
  ): League {
    const leagueId = `league_${Date.now()}`;

    const league: League = {
      leagueId,
      name,
      country,
      divisions: [],
      season: `season_${leagueId}_1`,
      totalTeams: 0,
      status: 'planning',
      startDate: Date.now(),
      description,
      pointsPerWin: 3,
      pointsPerDraw: 1,
      pointsPerLoss: 0,
      promotionRules: [],
      relegationRules: [],
      hasPlayoffs: false,
      owner,
      createdDate: Date.now(),
      lastUpdated: Date.now(),
    };

    this.leagues.set(leagueId, league);
    this.saveToStorage();

    return league;
  }

  /**
   * Create division in league
   */
  createDivision(
    leagueId: string,
    name: string,
    tier: number,
    level: 'elite' | 'professional' | 'amateur' | 'casual',
    maxTeams: number,
    promotionPlaces: number = 2,
    relegationPlaces: number = 2
  ): Division | null {
    const league = this.leagues.get(leagueId);
    if (!league) return null;

    const divisionId = `div_${leagueId}_${tier}_${Date.now()}`;

    const division: Division = {
      divisionId,
      name,
      tier,
      level,
      season: league.season,
      maxTeams,
      promotionPlaces,
      relegationPlaces,
      description: `${name} - ${level} level`,
      createdDate: Date.now(),
    };

    this.divisions.set(divisionId, division);
    league.divisions.push(division);

    this.saveToStorage();
    return division;
  }

  /**
   * Add team to division
   */
  addTeamToDivision(
    divisionId: string,
    teamId: string,
    teamName: string,
    owner: string
  ): DivisionStanding | null {
    const division = this.divisions.get(divisionId);
    if (!division) return null;

    // Check capacity
    const teamsInDivision = Array.from(this.standings.values()).filter(
      (s) => s.divisionId === divisionId
    ).length;

    if (teamsInDivision >= division.maxTeams) {
      return null; // Division full
    }

    const standingId = `stand_${divisionId}_${teamId}`;

    const standing: DivisionStanding = {
      standingId,
      divisionId,
      teamId,
      teamName,
      position: teamsInDivision + 1, // Will be recalculated
      matchesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      winStreak: 0,
      unbeatenStreak: 0,
      currentForm: [],
      averageRating: 0,
      topScorer: { playerName: '', goals: 0 },
      topAssister: { playerName: '', assists: 0 },
      promotionOdds: 0,
      relegationOdds: 0,
      playoffChance: false,
      owner,
      joinedDate: Date.now(),
      lastUpdated: Date.now(),
    };

    this.standings.set(standingId, standing);
    this.recalculateDivisionStandings(divisionId);

    this.saveToStorage();
    return standing;
  }

  /**
   * Record match result in division
   */
  recordDivisionMatchResult(
    divisionId: string,
    homeTeamId: string,
    awayTeamId: string,
    homeGoals: number,
    awayGoals: number,
    homeStats: { rating: number; topScorer?: string; topAssister?: string },
    awayStats: { rating: number; topScorer?: string; topAssister?: string }
  ): boolean {
    const homeStanding = Array.from(this.standings.values()).find(
      (s) => s.divisionId === divisionId && s.teamId === homeTeamId
    );
    const awayStanding = Array.from(this.standings.values()).find(
      (s) => s.divisionId === divisionId && s.teamId === awayTeamId
    );

    if (!homeStanding || !awayStanding) return false;

    // Update match stats
    homeStanding.matchesPlayed++;
    awayStanding.matchesPlayed++;

    homeStanding.goalsFor += homeGoals;
    homeStanding.goalsAgainst += awayGoals;
    awayStanding.goalsFor += awayGoals;
    awayStanding.goalsAgainst += homeGoals;

    homeStanding.goalDifference = homeStanding.goalsFor - homeStanding.goalsAgainst;
    awayStanding.goalDifference = awayStanding.goalsFor - awayStanding.goalsAgainst;

    // Update form
    if (homeGoals > awayGoals) {
      homeStanding.wins++;
      homeStanding.points += 3;
      homeStanding.winStreak++;
      homeStanding.unbeatenStreak++;
      homeStanding.currentForm.unshift('W');

      awayStanding.losses++;
      awayStanding.winStreak = 0;
      awayStanding.currentForm.unshift('L');
    } else if (homeGoals === awayGoals) {
      homeStanding.draws++;
      homeStanding.points += 1;
      homeStanding.unbeatenStreak++;
      homeStanding.winStreak = 0;
      homeStanding.currentForm.unshift('D');

      awayStanding.draws++;
      awayStanding.points += 1;
      awayStanding.unbeatenStreak++;
      awayStanding.winStreak = 0;
      awayStanding.currentForm.unshift('D');
    } else {
      awayStanding.wins++;
      awayStanding.points += 3;
      awayStanding.winStreak++;
      awayStanding.unbeatenStreak++;
      awayStanding.currentForm.unshift('W');

      homeStanding.losses++;
      homeStanding.winStreak = 0;
      homeStanding.currentForm.unshift('L');
    }

    // Keep only last 5 matches
    homeStanding.currentForm = homeStanding.currentForm.slice(0, 5);
    awayStanding.currentForm = awayStanding.currentForm.slice(0, 5);

    // Update average ratings
    const homeRatingCount = homeStanding.matchesPlayed;
    homeStanding.averageRating =
      (homeStanding.averageRating * (homeRatingCount - 1) + homeStats.rating) / homeRatingCount;

    const awayRatingCount = awayStanding.matchesPlayed;
    awayStanding.averageRating =
      (awayStanding.averageRating * (awayRatingCount - 1) + awayStats.rating) / awayRatingCount;

    homeStanding.lastUpdated = Date.now();
    awayStanding.lastUpdated = Date.now();

    // Recalculate standings
    this.recalculateDivisionStandings(divisionId);

    this.saveToStorage();
    return true;
  }

  /**
   * Get division standings
   */
  getDivisionStandings(divisionId: string): DivisionStanding[] {
    return Array.from(this.standings.values())
      .filter((s) => s.divisionId === divisionId)
      .sort((a, b) => {
        // Sort by points desc, then goal difference, then goals for
        if (a.points !== b.points) return b.points - a.points;
        if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
      })
      .map((standing, index) => ({
        ...standing,
        position: index + 1,
      }));
  }

  /**
   * Get team standing in division
   */
  getTeamStanding(divisionId: string, teamId: string): DivisionStanding | undefined {
    const standings = this.getDivisionStandings(divisionId);
    return standings.find((s) => s.teamId === teamId);
  }

  /**
   * Get league
   */
  getLeague(leagueId: string): League | undefined {
    return this.leagues.get(leagueId);
  }

  /**
   * Get all leagues
   */
  getAllLeagues(): League[] {
    return Array.from(this.leagues.values());
  }

  /**
   * Get divisions in league
   */
  getDivisionsInLeague(leagueId: string): Division[] {
    const league = this.leagues.get(leagueId);
    return league?.divisions || [];
  }

  /**
   * Get teams in division
   */
  getTeamsInDivision(divisionId: string): DivisionStanding[] {
    return Array.from(this.standings.values()).filter((s) => s.divisionId === divisionId);
  }

  /**
   * Calculate promotion/relegation
   */
  calculatePromotionRelegation(fromDivisionId: string, toDivisionId: string): {
    promoted: string[];
    relegated: string[];
  } | null {
    const fromDivision = this.divisions.get(fromDivisionId);
    const toDivision = this.divisions.get(toDivisionId);

    if (!fromDivision || !toDivision) return null;

    const standings = this.getDivisionStandings(fromDivisionId);

    // Get promoted teams (top N)
    const promoted = standings
      .slice(0, fromDivision.promotionPlaces)
      .map((s) => s.teamId);

    // Get relegated teams (bottom N)
    const relegated = standings
      .slice(-fromDivision.relegationPlaces)
      .map((s) => s.teamId);

    return { promoted, relegated };
  }

  /**
   * Execute promotion/relegation
   */
  executePromotionRelegation(
    seasonId: string,
    fromDivisionId: string,
    toDivisionId: string
  ): boolean {
    const result = this.calculatePromotionRelegation(fromDivisionId, toDivisionId);
    if (!result) return false;

    const { promoted, relegated } = result;

    // Move promoted teams
    for (const teamId of promoted) {
      const oldStanding = Array.from(this.standings.values()).find(
        (s) => s.divisionId === fromDivisionId && s.teamId === teamId
      );

      if (oldStanding) {
        // Remove from current division
        this.standings.delete(oldStanding.standingId);

        // Add to new division with reset stats
        const newStandingId = `stand_${toDivisionId}_${teamId}`;
        const newStanding: DivisionStanding = {
          ...oldStanding,
          standingId: newStandingId,
          divisionId: toDivisionId,
          position: 0,
          matchesPlayed: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
          winStreak: 0,
          unbeatenStreak: 0,
          currentForm: [],
          joinedDate: Date.now(),
        };

        this.standings.set(newStandingId, newStanding);

        // Record event
        const eventId = `promo_${seasonId}_${teamId}`;
        this.promotionHistory.set(eventId, {
          eventId,
          season: seasonId,
          date: Date.now(),
          fromDivision: fromDivisionId,
          toDivision: toDivisionId,
          teams: [teamId],
          type: 'promotion',
        });
      }
    }

    // Move relegated teams
    for (const teamId of relegated) {
      const oldStanding = Array.from(this.standings.values()).find(
        (s) => s.divisionId === fromDivisionId && s.teamId === teamId
      );

      if (oldStanding) {
        // Remove from current division
        this.standings.delete(oldStanding.standingId);

        // Add to new division with reset stats
        const newStandingId = `stand_${toDivisionId}_${teamId}`;
        const newStanding: DivisionStanding = {
          ...oldStanding,
          standingId: newStandingId,
          divisionId: toDivisionId,
          position: 0,
          matchesPlayed: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
          winStreak: 0,
          unbeatenStreak: 0,
          currentForm: [],
          joinedDate: Date.now(),
        };

        this.standings.set(newStandingId, newStanding);

        // Record event
        const eventId = `relg_${seasonId}_${teamId}`;
        this.promotionHistory.set(eventId, {
          eventId,
          season: seasonId,
          date: Date.now(),
          fromDivision: fromDivisionId,
          toDivision: toDivisionId,
          teams: [teamId],
          type: 'relegation',
        });
      }
    }

    this.recalculateDivisionStandings(fromDivisionId);
    this.recalculateDivisionStandings(toDivisionId);

    this.saveToStorage();
    return true;
  }

  /**
   * Get division by ID
   */
  getDivision(divisionId: string): Division | undefined {
    return this.divisions.get(divisionId);
  }

  /**
   * Create season
   */
  createSeason(leagueId: string, seasonNumber: number, seasonName: string): LeagueSeason | null {
    const league = this.leagues.get(leagueId);
    if (!league) return null;

    const seasonId = `season_${leagueId}_${seasonNumber}`;

    const season: LeagueSeason = {
      seasonId,
      leagueId,
      seasonNumber,
      seasonName,
      status: 'upcoming',
      startDate: Date.now(),
      leaderboard: [],
    };

    this.seasons.set(seasonId, season);
    this.saveToStorage();

    return season;
  }

  /**
   * Update season leaderboard
   */
  updateSeasonLeaderboard(seasonId: string): boolean {
    const season = this.seasons.get(seasonId);
    if (!season) return false;

    const league = this.leagues.get(season.leagueId);
    if (!league) return false;

    const leaderboard: typeof season.leaderboard = [];
    let position = 1;

    for (const division of league.divisions) {
      const standings = this.getDivisionStandings(division.divisionId);
      for (const standing of standings) {
        leaderboard.push({
          position,
          teamId: standing.teamId,
          teamName: standing.teamName,
          points: standing.points,
          matchesPlayed: standing.matchesPlayed,
        });
        position++;
      }
    }

    season.leaderboard = leaderboard;
    this.saveToStorage();

    return true;
  }

  /**
   * Get season
   */
  getSeason(seasonId: string): LeagueSeason | undefined {
    return this.seasons.get(seasonId);
  }

  /**
   * Get promotion history
   */
  getPromotionHistory(seasonId: string): PromotionRelegaltion[] {
    return Array.from(this.promotionHistory.values()).filter((p) => p.season === seasonId);
  }

  /**
   * Generate ERC-721 metadata for division NFT
   */
  generateDivisionMetadata(divisionId: string): Record<string, unknown> | null {
    const division = this.divisions.get(divisionId);
    if (!division) return null;

    const standings = this.getDivisionStandings(divisionId);

    return {
      name: `${division.name} Division`,
      description: `${division.level} level division with ${standings.length} teams`,
      image: `ipfs://division/${divisionId}`,
      attributes: [
        { trait_type: 'Division Name', value: division.name },
        { trait_type: 'Level', value: division.level },
        { trait_type: 'Tier', value: division.tier },
        { trait_type: 'Teams', value: standings.length },
        { trait_type: 'Max Teams', value: division.maxTeams },
        { trait_type: 'Leader', value: standings[0]?.teamName || 'N/A' },
        { trait_type: 'Leader Points', value: standings[0]?.points || 0 },
      ],
    };
  }

  /**
   * Private helper: Recalculate division standings
   */
  private recalculateDivisionStandings(divisionId: string): void {
    const standings = this.getDivisionStandings(divisionId);

    // Update promotion/relegation odds
    const division = this.divisions.get(divisionId);
    if (!division) return;

    for (let i = 0; i < standings.length; i++) {
      const standing = standings[i];

      // Promotion odds: top teams
      if (i < division.promotionPlaces) {
        standing.promotionOdds = Math.max(90, 100 - i * 10);
      } else if (i < division.promotionPlaces + 2) {
        standing.promotionOdds = Math.max(20, 60 - i * 10);
      } else {
        standing.promotionOdds = 0;
      }

      // Relegation odds: bottom teams
      if (i >= standings.length - division.relegationPlaces) {
        standing.relegationOdds = Math.max(90, 100 - (standings.length - i) * 10);
      } else if (i >= standings.length - division.relegationPlaces - 2) {
        standing.relegationOdds = Math.max(20, 60 - (standings.length - i) * 10);
      } else {
        standing.relegationOdds = 0;
      }

      // Playoff chance
      standing.playoffChance = division.promotionPlaces && i < division.promotionPlaces * 2;
    }
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        leagues: Array.from(this.leagues.entries()),
        divisions: Array.from(this.divisions.entries()),
        standings: Array.from(this.standings.entries()),
        seasons: Array.from(this.seasons.entries()),
        promotionHistory: Array.from(this.promotionHistory.entries()),
      };
      localStorage.setItem('league_system', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving league data:', error);
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('league_system');
      if (stored) {
        const data = JSON.parse(stored);
        if (Array.isArray(data.leagues)) {
          for (const [key, value] of data.leagues) {
            this.leagues.set(key, value);
          }
        }
        if (Array.isArray(data.divisions)) {
          for (const [key, value] of data.divisions) {
            this.divisions.set(key, value);
          }
        }
        if (Array.isArray(data.standings)) {
          for (const [key, value] of data.standings) {
            this.standings.set(key, value);
          }
        }
        if (Array.isArray(data.seasons)) {
          for (const [key, value] of data.seasons) {
            this.seasons.set(key, value);
          }
        }
        if (Array.isArray(data.promotionHistory)) {
          for (const [key, value] of data.promotionHistory) {
            this.promotionHistory.set(key, value);
          }
        }
      }
    } catch (error) {
      console.error('Error loading league data:', error);
    }
  }
}
