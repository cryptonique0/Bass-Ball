/**
 * Tournament bracket and matchmaking system
 */

export interface TournamentMatch {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore?: number;
  awayScore?: number;
  winnerId?: string;
  scheduledTime?: number;
  completedAt?: number;
  status: 'pending' | 'live' | 'completed';
}

export interface TournamentRound {
  roundNumber: number;
  matches: TournamentMatch[];
  startTime?: number;
  endTime?: number;
}

export interface Tournament {
  id: string;
  name: string;
  format: 'single-elimination' | 'double-elimination' | 'round-robin';
  rounds: TournamentRound[];
  participants: string[];
  winner?: string;
  startedAt?: number;
  completedAt?: number;
  status: 'draft' | 'active' | 'completed';
}

export class TournamentManager {
  private tournaments: Map<string, Tournament> = new Map();

  /**
   * Create single elimination tournament
   */
  createSingleElimination(
    tournamentId: string,
    name: string,
    participants: string[]
  ): Tournament {
    if (participants.length < 2 || (participants.length & (participants.length - 1)) !== 0) {
      throw new Error('Participants must be a power of 2');
    }

    const tournament: Tournament = {
      id: tournamentId,
      name,
      format: 'single-elimination',
      rounds: [],
      participants,
      status: 'draft',
    };

    // Create first round
    const firstRound: TournamentRound = {
      roundNumber: 1,
      matches: [],
    };

    for (let i = 0; i < participants.length; i += 2) {
      firstRound.matches.push({
        id: `${tournamentId}-1-${i / 2}`,
        homeTeamId: participants[i],
        awayTeamId: participants[i + 1],
        status: 'pending',
      });
    }

    tournament.rounds.push(firstRound);
    this.generateNextRound(tournament);

    this.tournaments.set(tournamentId, tournament);
    return tournament;
  }

  /**
   * Generate next round automatically
   */
  private generateNextRound(tournament: Tournament): void {
    const lastRound = tournament.rounds[tournament.rounds.length - 1];

    if (lastRound.matches.length === 1) {
      return; // Tournament complete
    }

    const nextRound: TournamentRound = {
      roundNumber: lastRound.roundNumber + 1,
      matches: [],
    };

    // Winners will be added as they complete matches
    tournament.rounds.push(nextRound);
  }

  /**
   * Record match result
   */
  recordResult(
    tournamentId: string,
    roundNumber: number,
    matchId: string,
    homeScore: number,
    awayScore: number
  ): boolean {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) return false;

    const round = tournament.rounds[roundNumber - 1];
    if (!round) return false;

    const match = round.matches.find((m) => m.id === matchId);
    if (!match) return false;

    match.homeScore = homeScore;
    match.awayScore = awayScore;
    match.status = 'completed';
    match.completedAt = Date.now();

    const winner = homeScore > awayScore ? match.homeTeamId : match.awayTeamId;
    match.winnerId = winner;

    // Check if all matches in round are complete
    const allComplete = round.matches.every((m) => m.status === 'completed');
    if (allComplete) {
      this.advanceWinners(tournament, roundNumber);
    }

    return true;
  }

  /**
   * Advance winners to next round
   */
  private advanceWinners(tournament: Tournament, roundNumber: number): void {
    const round = tournament.rounds[roundNumber - 1];
    const nextRound = tournament.rounds[roundNumber];

    if (!nextRound) {
      // Tournament complete
      if (round.matches.length === 1) {
        tournament.status = 'completed';
        tournament.winner = round.matches[0].winnerId;
        tournament.completedAt = Date.now();
      }
      return;
    }

    const winners = round.matches.map((m) => m.winnerId!);

    for (let i = 0; i < winners.length; i += 2) {
      nextRound.matches.push({
        id: `${tournament.id}-${roundNumber + 1}-${i / 2}`,
        homeTeamId: winners[i],
        awayTeamId: winners[i + 1],
        status: 'pending',
      });
    }
  }

  /**
   * Get tournament
   */
  getTournament(tournamentId: string): Tournament | undefined {
    return this.tournaments.get(tournamentId);
  }

  /**
   * Get tournament bracket
   */
  getBracket(tournamentId: string): Tournament | null {
    return this.tournaments.get(tournamentId) || null;
  }

  /**
   * Get current round standings
   */
  getCurrentRound(tournamentId: string): TournamentRound | null {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) return null;

    // Find first incomplete round
    return (
      tournament.rounds.find((r) =>
        r.matches.some((m) => m.status !== 'completed')
      ) || tournament.rounds[tournament.rounds.length - 1]
    );
  }

  /**
   * Get tournament standings
   */
  getStandings(tournamentId: string): Array<{
    teamId: string;
    matchesPlayed: number;
    wins: number;
    eliminated: boolean;
  }> {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) return [];

    const standings: Record<
      string,
      { teamId: string; matchesPlayed: number; wins: number; eliminated: boolean }
    > = {};

    tournament.participants.forEach((p) => {
      standings[p] = {
        teamId: p,
        matchesPlayed: 0,
        wins: 0,
        eliminated: tournament.status === 'completed' && p !== tournament.winner,
      };
    });

    tournament.rounds.forEach((round) => {
      round.matches.forEach((match) => {
        standings[match.homeTeamId].matchesPlayed++;
        standings[match.awayTeamId].matchesPlayed++;

        if (match.winnerId === match.homeTeamId) {
          standings[match.homeTeamId].wins++;
        } else if (match.winnerId === match.awayTeamId) {
          standings[match.awayTeamId].wins++;
        }
      });
    });

    return Object.values(standings).sort((a, b) => b.wins - a.wins);
  }

  /**
   * Start tournament
   */
  startTournament(tournamentId: string): boolean {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) return false;

    tournament.status = 'active';
    tournament.startedAt = Date.now();
    tournament.rounds[0].startTime = Date.now();
    return true;
  }
}
