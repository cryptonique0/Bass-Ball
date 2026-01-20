// Match service
export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  status: 'pending' | 'live' | 'completed';
}

export class MatchService {
  private matches: Map<string, Match> = new Map();

  createMatch(match: Match): void {
    this.matches.set(match.id, match);
  }

  getMatch(id: string): Match | null {
    return this.matches.get(id) || null;
  }

  updateScore(matchId: string, homeScore: number, awayScore: number): void {
    const match = this.matches.get(matchId);
    if (match) {
      match.homeScore = homeScore;
      match.awayScore = awayScore;
    }
  }

  getAll(): Match[] {
    return Array.from(this.matches.values());
  }
}

export const matchService = new MatchService();
