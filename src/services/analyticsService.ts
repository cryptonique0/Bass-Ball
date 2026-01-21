/**
 * Match analytics and statistics service
 */

export interface MatchStats {
  matchId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeGoals: number;
  awayGoals: number;
}

export class MatchAnalytics {
  private matchStats: Map<string, MatchStats> = new Map();

  /**
   * Record match statistics
   */
  recordMatch(stats: MatchStats): void {
    this.matchStats.set(stats.matchId, { ...stats });
  }

  /**
   * Get match
   */
  getMatch(matchId: string): MatchStats | undefined {
    return this.matchStats.get(matchId);
  }

  /**
   * Get all matches
   */
  getAllMatches(): MatchStats[] {
    return Array.from(this.matchStats.values());
  }

  /**
   * Get team statistics
   */
  getTeamStats(teamId: string) {
    const matches = Array.from(this.matchStats.values()).filter(
      (m) => m.homeTeamId === teamId || m.awayTeamId === teamId
    );

    let wins = 0;
    let losses = 0;
    let draws = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;

    matches.forEach((m) => {
      if (m.homeTeamId === teamId) {
        goalsFor += m.homeGoals;
        goalsAgainst += m.awayGoals;
        if (m.homeGoals > m.awayGoals) wins++;
        else if (m.homeGoals < m.awayGoals) losses++;
        else draws++;
      } else {
        goalsFor += m.awayGoals;
        goalsAgainst += m.homeGoals;
        if (m.awayGoals > m.homeGoals) wins++;
        else if (m.awayGoals < m.homeGoals) losses++;
        else draws++;
      }
    });

    return {
      teamId,
      matchesPlayed: matches.length,
      wins,
      losses,
      draws,
      goalsFor,
      goalsAgainst,
      goalDifference: goalsFor - goalsAgainst,
      points: wins * 3 + draws,
    };
  }

  /**
   * Clear statistics
   */
  clear(): void {
    this.matchStats.clear();
  }
}
