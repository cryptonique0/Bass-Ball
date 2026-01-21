/**
 * Player statistics comparison and analysis
 */

export interface PlayerComparison {
  player1Id: string;
  player2Id: string;
  player1Name: string;
  player2Name: string;
  comparisonMetrics: Record<string, {
    player1: number;
    player2: number;
    winner: string;
  }>;
  similarityScore: number;
}

export interface StatisticalAnalysis {
  average: number;
  median: number;
  standardDeviation: number;
  min: number;
  max: number;
  percentile: Record<number, number>;
}

export class PlayerAnalytics {
  private playerStats: Map<string, Record<string, number>> = new Map();

  /**
   * Store player statistics
   */
  recordStats(playerId: string, stats: Record<string, number>): void {
    this.playerStats.set(playerId, { ...stats });
  }

  /**
   * Compare two players
   */
  comparePlayersPlayers(
    player1Id: string,
    player2Id: string,
    player1Name: string = '',
    player2Name: string = ''
  ): PlayerComparison {
    const stats1 = this.playerStats.get(player1Id) || {};
    const stats2 = this.playerStats.get(player2Id) || {};

    const comparisonMetrics: Record<string, {
      player1: number;
      player2: number;
      winner: string;
    }> = {};

    const allKeys = new Set([...Object.keys(stats1), ...Object.keys(stats2)]);

    allKeys.forEach((key) => {
      const v1 = stats1[key] || 0;
      const v2 = stats2[key] || 0;

      comparisonMetrics[key] = {
        player1: v1,
        player2: v2,
        winner: v1 > v2 ? player1Id : v2 > v1 ? player2Id : 'tie',
      };
    });

    // Calculate similarity score
    let wins = 0;
    allKeys.forEach((key) => {
      if (comparisonMetrics[key].winner === player1Id) wins++;
    });

    const similarityScore = (wins / allKeys.size) * 100;

    return {
      player1Id,
      player2Id,
      player1Name,
      player2Name,
      comparisonMetrics,
      similarityScore,
    };
  }

  /**
   * Analyze statistic distribution
   */
  analyzeStatistic(statName: string, playerIds: string[]): StatisticalAnalysis | null {
    const values: number[] = [];

    playerIds.forEach((id) => {
      const stats = this.playerStats.get(id);
      if (stats && stats[statName] !== undefined) {
        values.push(stats[statName]);
      }
    });

    if (values.length === 0) return null;

    values.sort((a, b) => a - b);

    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const median = values[Math.floor(values.length / 2)];
    const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
    const stdDev = Math.sqrt(variance);

    const percentiles: Record<number, number> = {};
    [25, 50, 75, 90, 95].forEach((p) => {
      const index = Math.floor((p / 100) * values.length);
      percentiles[p] = values[index];
    });

    return {
      average: avg,
      median,
      standardDeviation: stdDev,
      min: values[0],
      max: values[values.length - 1],
      percentile: percentiles,
    };
  }

  /**
   * Find similar players
   */
  findSimilarPlayers(
    playerId: string,
    threshold: number = 70
  ): Array<{ id: string; similarity: number }> {
    const reference = this.playerStats.get(playerId);
    if (!reference) return [];

    const similarities: Array<{ id: string; similarity: number }> = [];

    this.playerStats.forEach((stats, otherId) => {
      if (otherId === playerId) return;

      let matchingTraits = 0;
      let totalTraits = 0;

      Object.keys(reference).forEach((trait) => {
        totalTraits++;
        const diff = Math.abs(reference[trait] - (stats[trait] || 0));
        if (diff < 10) {
          matchingTraits++;
        }
      });

      const similarity = (matchingTraits / totalTraits) * 100;
      if (similarity >= threshold) {
        similarities.push({ id: otherId, similarity });
      }
    });

    return similarities.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Get top players in category
   */
  getTopPlayers(
    statName: string,
    limit: number = 10
  ): Array<{ playerId: string; value: number }> {
    const rankings: Array<{ playerId: string; value: number }> = [];

    this.playerStats.forEach((stats, playerId) => {
      if (stats[statName] !== undefined) {
        rankings.push({
          playerId,
          value: stats[statName],
        });
      }
    });

    return rankings.sort((a, b) => b.value - a.value).slice(0, limit);
  }
}
