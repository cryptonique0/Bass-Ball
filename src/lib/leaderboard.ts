/**
 * Leaderboard and ranking system
 */

export interface PlayerRanking {
  playerId: string;
  playerName: string;
  rank: number;
  wins: number;
  losses: number;
  draws: number;
  goalsScored: number;
  goalsConceded: number;
  rating: number;
  pointsEarned: number;
}

export interface LeaderboardStats {
  totalPlayers: number;
  topPlayers: PlayerRanking[];
  lastUpdated: number;
}

export class Leaderboard {
  private rankings: Map<string, PlayerRanking> = new Map();
  private lastUpdated: number = Date.now();

  /**
   * Update or add player ranking
   */
  updateRanking(
    playerId: string,
    stats: Partial<PlayerRanking> & { playerName: string }
  ): void {
    const existing = this.rankings.get(playerId);

    if (existing) {
      Object.assign(existing, stats);
      existing.rating = this.calculateRating(existing);
      existing.pointsEarned = this.calculatePoints(existing);
    } else {
      const ranking: PlayerRanking = {
        playerId,
        playerName: stats.playerName,
        rank: 0,
        wins: stats.wins || 0,
        losses: stats.losses || 0,
        draws: stats.draws || 0,
        goalsScored: stats.goalsScored || 0,
        goalsConceded: stats.goalsConceded || 0,
        rating: 1200,
        pointsEarned: 0,
        ...stats,
      };
      ranking.rating = this.calculateRating(ranking);
      ranking.pointsEarned = this.calculatePoints(ranking);
      this.rankings.set(playerId, ranking);
    }

    this.lastUpdated = Date.now();
    this.updateRanks();
  }

  /**
   * Get player ranking
   */
  getPlayerRanking(playerId: string): PlayerRanking | undefined {
    return this.rankings.get(playerId);
  }

  /**
   * Get top N players
   */
  getTopPlayers(n: number = 10): PlayerRanking[] {
    return Array.from(this.rankings.values())
      .sort((a, b) => b.rating - a.rating)
      .slice(0, n);
  }

  /**
   * Get player's rank
   */
  getPlayerRank(playerId: string): number {
    const player = this.rankings.get(playerId);
    return player?.rank || 0;
  }

  /**
   * Calculate player rating (ELO-like)
   */
  private calculateRating(player: PlayerRanking): number {
    const totalGames = player.wins + player.losses + player.draws;
    if (totalGames === 0) return 1200;

    const winRate = player.wins / totalGames;
    const goalDiff = (player.goalsScored - player.goalsConceded) / Math.max(totalGames, 1);

    return Math.max(
      800,
      Math.min(2400, 1200 + winRate * 600 + goalDiff * 50)
    );
  }

  /**
   * Calculate points from wins/draws
   */
  private calculatePoints(player: PlayerRanking): number {
    return player.wins * 3 + player.draws * 1;
  }

  /**
   * Update ranks based on ratings
   */
  private updateRanks(): void {
    const sorted = Array.from(this.rankings.values()).sort(
      (a, b) => b.rating - a.rating
    );
    sorted.forEach((player, index) => {
      player.rank = index + 1;
    });
  }

  /**
   * Get leaderboard statistics
   */
  getStatistics(): LeaderboardStats {
    return {
      totalPlayers: this.rankings.size,
      topPlayers: this.getTopPlayers(100),
      lastUpdated: this.lastUpdated,
    };
  }

  /**
   * Get players in rank range
   */
  getPlayersInRange(startRank: number, endRank: number): PlayerRanking[] {
    return Array.from(this.rankings.values())
      .sort((a, b) => a.rank - b.rank)
      .filter((p) => p.rank >= startRank && p.rank <= endRank);
  }

  /**
   * Reset all rankings
   */
  reset(): void {
    this.rankings.clear();
    this.lastUpdated = Date.now();
  }

  /**
   * Export rankings as JSON
   */
  export(): Record<string, PlayerRanking> {
    const result: Record<string, PlayerRanking> = {};
    this.rankings.forEach((ranking, id) => {
      result[id] = { ...ranking };
    });
    return result;
  }

  /**
   * Import rankings from JSON
   */
  import(data: Record<string, PlayerRanking>): void {
    this.rankings.clear();
    Object.entries(data).forEach(([id, ranking]) => {
      this.rankings.set(id, { ...ranking });
    });
    this.updateRanks();
    this.lastUpdated = Date.now();
  }
}
