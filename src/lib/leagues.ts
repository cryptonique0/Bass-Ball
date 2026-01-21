/**
 * Season and league management system
 */

export type LeagueType = 'professional' | 'amateur' | 'casual';

export interface Season {
  id: string;
  number: number;
  startDate: number;
  endDate: number;
  name: string;
  status: 'planning' | 'active' | 'ended';
  teams: string[];
  matches: string[];
}

export interface League {
  id: string;
  name: string;
  type: LeagueType;
  seasons: Season[];
  currentSeasonId?: string;
  createdAt: number;
}

export interface TeamStanding {
  teamId: string;
  teamName: string;
  wins: number;
  losses: number;
  draws: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  position: number;
}

export class LeagueManager {
  private leagues: Map<string, League> = new Map();
  private standings: Map<string, TeamStanding[]> = new Map();

  /**
   * Create league
   */
  createLeague(name: string, type: LeagueType = 'amateur'): League {
    const leagueId = `league-${name}-${Date.now()}`;

    const league: League = {
      id: leagueId,
      name,
      type,
      seasons: [],
      createdAt: Date.now(),
    };

    this.leagues.set(leagueId, league);
    return league;
  }

  /**
   * Create season
   */
  createSeason(
    leagueId: string,
    seasonNumber: number,
    startDate: number,
    endDate: number,
    teams: string[]
  ): Season | null {
    const league = this.leagues.get(leagueId);
    if (!league) return null;

    const season: Season = {
      id: `season-${leagueId}-${seasonNumber}`,
      number: seasonNumber,
      startDate,
      endDate,
      name: `Season ${seasonNumber}`,
      status: 'planning',
      teams,
      matches: [],
    };

    league.seasons.push(season);
    if (!league.currentSeasonId) {
      league.currentSeasonId = season.id;
    }

    // Initialize standings
    const standings: TeamStanding[] = teams.map((teamId) => ({
      teamId,
      teamName: teamId,
      wins: 0,
      losses: 0,
      draws: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
      position: 0,
    }));

    this.standings.set(season.id, standings);
    return season;
  }

  /**
   * Start season
   */
  startSeason(leagueId: string, seasonId: string): boolean {
    const league = this.leagues.get(leagueId);
    if (!league) return false;

    const season = league.seasons.find((s) => s.id === seasonId);
    if (!season) return false;

    season.status = 'active';
    return true;
  }

  /**
   * End season
   */
  endSeason(leagueId: string, seasonId: string): boolean {
    const league = this.leagues.get(leagueId);
    if (!league) return false;

    const season = league.seasons.find((s) => s.id === seasonId);
    if (!season) return false;

    season.status = 'ended';
    return true;
  }

  /**
   * Record match result
   */
  recordMatchResult(
    seasonId: string,
    homeTeamId: string,
    awayTeamId: string,
    homeGoals: number,
    awayGoals: number
  ): boolean {
    const standings = this.standings.get(seasonId);
    if (!standings) return false;

    const homeTeam = standings.find((s) => s.teamId === homeTeamId);
    const awayTeam = standings.find((s) => s.teamId === awayTeamId);

    if (!homeTeam || !awayTeam) return false;

    homeTeam.goalsFor += homeGoals;
    homeTeam.goalsAgainst += awayGoals;
    awayTeam.goalsFor += awayGoals;
    awayTeam.goalsAgainst += homeGoals;

    if (homeGoals > awayGoals) {
      homeTeam.wins++;
      homeTeam.points += 3;
      awayTeam.losses++;
    } else if (awayGoals > homeGoals) {
      awayTeam.wins++;
      awayTeam.points += 3;
      homeTeam.losses++;
    } else {
      homeTeam.draws++;
      homeTeam.points += 1;
      awayTeam.draws++;
      awayTeam.points += 1;
    }

    this.updateStandings(standings);
    return true;
  }

  /**
   * Update standings positions
   */
  private updateStandings(standings: TeamStanding[]): void {
    standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.goalsFor - a.goalsFor - (b.goalsAgainst - a.goalsAgainst);
    });

    standings.forEach((team, index) => {
      team.position = index + 1;
    });
  }

  /**
   * Get season standings
   */
  getStandings(seasonId: string): TeamStanding[] {
    return this.standings.get(seasonId) || [];
  }

  /**
   * Get league
   */
  getLeague(leagueId: string): League | undefined {
    return this.leagues.get(leagueId);
  }

  /**
   * Get current season
   */
  getCurrentSeason(leagueId: string): Season | undefined {
    const league = this.leagues.get(leagueId);
    if (!league || !league.currentSeasonId) return undefined;

    return league.seasons.find((s) => s.id === league.currentSeasonId);
  }

  /**
   * Get top teams
   */
  getTopTeams(seasonId: string, limit: number = 10): TeamStanding[] {
    const standings = this.standings.get(seasonId) || [];
    return standings.slice(0, limit);
  }

  /**
   * Get league statistics
   */
  getStatistics(leagueId: string) {
    const league = this.leagues.get(leagueId);
    if (!league) return null;

    return {
      leagueId,
      name: league.name,
      type: league.type,
      totalSeasons: league.seasons.length,
      activeSeasons: league.seasons.filter((s) => s.status === 'active').length,
      completedSeasons: league.seasons.filter((s) => s.status === 'ended').length,
      currentSeasonId: league.currentSeasonId,
    };
  }
}
