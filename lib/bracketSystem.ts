/**
 * Tournament Bracket System
 * Single/double elimination, round-robin, Swiss system
 * @version 1.0.0
 */

export type TournamentFormat = 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss';
export type MatchStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'bye';
export type BracketPosition = 'winner' | 'loser' | 'grand_final';

export interface Tournament {
  id: string;
  name: string;
  description: string;
  organizerId: string;
  format: TournamentFormat;
  maxParticipants: number;
  participants: string[];
  status: 'registration' | 'in_progress' | 'completed' | 'cancelled';
  prizePool: number;
  prizeDivision: number[]; // Percentages for each place
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  settings: {
    bestOf: number;
    allowSubstitutions: boolean;
    allowSpectatorship: boolean;
    autoStartMatches: boolean;
  };
}

export interface BracketMatch {
  id: string;
  tournamentId: string;
  matchNumber: number;
  round: number;
  status: MatchStatus;
  participant1?: string;
  participant2?: string;
  winner?: string;
  loser?: string;
  score1?: number;
  score2?: number;
  scheduledTime?: Date;
  completedTime?: Date;
  bracket: BracketPosition;
  nextMatchWinner?: string; // Match ID for winner's next match
  nextMatchLoser?: string; // Match ID for loser's next match
}

export interface Round {
  roundNumber: number;
  name: string;
  matches: BracketMatch[];
  startDate?: Date;
  endDate?: Date;
  totalMatches: number;
  completedMatches: number;
}

export interface Bracket {
  id: string;
  tournamentId: string;
  format: TournamentFormat;
  rounds: Round[];
  currentRound: number;
  participantCount: number;
  winner?: string;
  secondPlace?: string;
  thirdPlace?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TournamentStats {
  totalTournaments: number;
  activeTournaments: number;
  completedTournaments: number;
  totalMatches: number;
  totalParticipants: number;
  averageParticipants: number;
  winningTournaments: number;
  totalPrizeWinnings: number;
}

export interface TournamentParticipantRecord {
  userId: string;
  username: string;
  placement: number;
  matchesPlayed: number;
  matchesWon: number;
  prizeAmount: number;
  eliminatedBy?: string;
  eliminatedAt?: Date;
}

export interface BracketGenerator {
  generateSingleElimination(participants: string[]): Bracket;
  generateDoubleElimination(participants: string[]): Bracket;
  generateRoundRobin(participants: string[]): Bracket;
  generateSwiss(participants: string[], rounds: number): Bracket;
}

/**
 * Tournament Bracket System
 * Manages tournament organization and bracket generation
 */
export const bracketSystem = {
  // Storage keys
  _tournamentKey: 'bracketSystem:tournaments',
  _bracketKey: 'bracketSystem:brackets',
  _userTournamentsKey: 'bracketSystem:userTournaments',

  /**
   * Tournament Management
   */

  // Create tournament
  createTournament(
    organizerId: string,
    name: string,
    format: TournamentFormat = 'single_elimination',
    maxParticipants: number = 64,
    prizePool: number = 1000
  ): Tournament {
    const tournament: Tournament = {
      id: `tour_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description: '',
      organizerId,
      format,
      maxParticipants,
      participants: [],
      status: 'registration',
      prizePool,
      prizeDivision: this._getDefaultPrizeDivision(maxParticipants),
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      createdAt: new Date(),
      settings: {
        bestOf: 3,
        allowSubstitutions: true,
        allowSpectatorship: true,
        autoStartMatches: false,
      },
    };

    const tournaments = this._getTournaments();
    tournaments.push(tournament);
    localStorage.setItem(this._tournamentKey, JSON.stringify(tournaments));

    return tournament;
  },

  // Get all tournaments
  getTournaments(): Tournament[] {
    return this._getTournaments();
  },

  // Get tournament by ID
  getTournament(tournamentId: string): Tournament | null {
    const tournaments = this._getTournaments();
    return tournaments.find((t) => t.id === tournamentId) || null;
  },

  // Update tournament
  updateTournament(tournamentId: string, updates: Partial<Tournament>): Tournament | null {
    const tournaments = this._getTournaments();
    const tournament = tournaments.find((t) => t.id === tournamentId);

    if (!tournament) return null;

    Object.assign(tournament, updates);
    localStorage.setItem(this._tournamentKey, JSON.stringify(tournaments));
    return tournament;
  },

  // Get user's tournaments
  getUserTournaments(userId: string): Tournament[] {
    const tournaments = this._getTournaments();
    return tournaments.filter((t) => t.organizerId === userId || t.participants.includes(userId));
  },

  /**
   * Participant Management
   */

  // Join tournament
  joinTournament(tournamentId: string, userId: string): boolean {
    const tournament = this.getTournament(tournamentId);
    if (!tournament) return false;

    if (tournament.participants.length >= tournament.maxParticipants) return false;
    if (tournament.participants.includes(userId)) return true; // Already joined

    tournament.participants.push(userId);
    this.updateTournament(tournamentId, tournament);
    return true;
  },

  // Leave tournament
  leaveTournament(tournamentId: string, userId: string): boolean {
    const tournament = this.getTournament(tournamentId);
    if (!tournament) return false;

    if (tournament.status !== 'registration') return false;

    const index = tournament.participants.indexOf(userId);
    if (index === -1) return false;

    tournament.participants.splice(index, 1);
    this.updateTournament(tournamentId, tournament);
    return true;
  },

  /**
   * Bracket Generation
   */

  // Generate bracket
  generateBracket(tournamentId: string): Bracket | null {
    const tournament = this.getTournament(tournamentId);
    if (!tournament) return null;

    if (tournament.participants.length < 2) return null;

    let bracket: Bracket;

    switch (tournament.format) {
      case 'single_elimination':
        bracket = this._generateSingleElimination(tournament);
        break;
      case 'double_elimination':
        bracket = this._generateDoubleElimination(tournament);
        break;
      case 'round_robin':
        bracket = this._generateRoundRobin(tournament);
        break;
      case 'swiss':
        bracket = this._generateSwiss(tournament);
        break;
      default:
        bracket = this._generateSingleElimination(tournament);
    }

    const brackets = this._getBrackets();
    brackets.push(bracket);
    localStorage.setItem(this._bracketKey, JSON.stringify(brackets));

    // Update tournament status
    tournament.status = 'in_progress';
    this.updateTournament(tournamentId, tournament);

    return bracket;
  },

  // Get bracket
  getBracket(bracketId: string): Bracket | null {
    const brackets = this._getBrackets();
    return brackets.find((b) => b.id === bracketId) || null;
  },

  /**
   * Match Management
   */

  // Update match
  updateMatch(
    bracketId: string,
    matchId: string,
    participant1Score: number,
    participant2Score: number,
    winner: string
  ): BracketMatch | null {
    const bracket = this.getBracket(bracketId);
    if (!bracket) return null;

    let match: BracketMatch | null = null;

    for (const round of bracket.rounds) {
      const found = round.matches.find((m) => m.id === matchId);
      if (found) {
        match = found;
        break;
      }
    }

    if (!match) return null;

    match.status = 'completed';
    match.score1 = participant1Score;
    match.score2 = participant2Score;
    match.winner = winner;
    match.completedTime = new Date();
    match.loser = winner === match.participant1 ? match.participant2 : match.participant1;

    // Advance winner to next round
    if (match.nextMatchWinner) {
      this._advanceParticipant(bracket, match.nextMatchWinner, winner);
    }

    // Advance loser in double elimination
    if (bracket.format === 'double_elimination' && match.nextMatchLoser) {
      this._advanceParticipant(bracket, match.nextMatchLoser, match.loser!);
    }

    this._updateBracket(bracket);
    return match;
  },

  /**
   * Bracket Visualization
   */

  // Get round matches
  getRoundMatches(bracketId: string, roundNumber: number): BracketMatch[] {
    const bracket = this.getBracket(bracketId);
    if (!bracket) return [];

    const round = bracket.rounds.find((r) => r.roundNumber === roundNumber);
    return round?.matches || [];
  },

  // Get bracket structure
  getBracketStructure(bracketId: string): Round[] {
    const bracket = this.getBracket(bracketId);
    return bracket?.rounds || [];
  },

  /**
   * Results & Standings
   */

  // Get tournament standings
  getTournamentStandings(tournamentId: string): TournamentParticipantRecord[] {
    const bracket = this._getBrackets().find((b) => b.tournamentId === tournamentId);
    if (!bracket) return [];

    const tournament = this.getTournament(tournamentId);
    if (!tournament) return [];

    const standings: Map<string, TournamentParticipantRecord> = new Map();

    tournament.participants.forEach((userId) => {
      standings.set(userId, {
        userId,
        username: `User ${userId.slice(0, 8)}`,
        placement: tournament.participants.length,
        matchesPlayed: 0,
        matchesWon: 0,
        prizeAmount: 0,
      });
    });

    // Count wins and track placements
    for (const round of bracket.rounds) {
      for (const match of round.matches) {
        if (match.status === 'completed' && match.winner && match.participant1 && match.participant2) {
          const winner = standings.get(match.winner) || standings.get(match.winner)!;
          winner.matchesWon++;
          winner.matchesPlayed++;

          const loser = match.loser;
          if (loser) {
            const loserRecord = standings.get(loser) || standings.get(loser)!;
            loserRecord.matchesPlayed++;
            loserRecord.eliminatedBy = match.winner;
            loserRecord.eliminatedAt = match.completedTime;
          }
        }
      }
    }

    // Assign placements
    if (bracket.winner) {
      standings.get(bracket.winner)!.placement = 1;
      standings.get(bracket.winner)!.prizeAmount =
        (tournament.prizePool * tournament.prizeDivision[0]) / 100;
    }
    if (bracket.secondPlace) {
      standings.get(bracket.secondPlace)!.placement = 2;
      standings.get(bracket.secondPlace)!.prizeAmount =
        (tournament.prizePool * tournament.prizeDivision[1]) / 100;
    }
    if (bracket.thirdPlace) {
      standings.get(bracket.thirdPlace)!.placement = 3;
      standings.get(bracket.thirdPlace)!.prizeAmount =
        (tournament.prizePool * tournament.prizeDivision[2]) / 100;
    }

    return Array.from(standings.values()).sort((a, b) => a.placement - b.placement);
  },

  /**
   * Statistics
   */

  // Get user tournament stats
  getUserTournamentStats(userId: string): TournamentStats {
    const tournaments = this.getTournaments();
    const userTournaments = tournaments.filter((t) => t.participants.includes(userId));

    let totalWinnings = 0;
    let winCount = 0;

    userTournaments.forEach((tournament) => {
      const standings = this.getTournamentStandings(tournament.id);
      const userRecord = standings.find((s) => s.userId === userId);
      if (userRecord) {
        totalWinnings += userRecord.prizeAmount;
        if (userRecord.placement === 1) winCount++;
      }
    });

    return {
      totalTournaments: userTournaments.length,
      activeTournaments: userTournaments.filter((t) => t.status === 'in_progress').length,
      completedTournaments: userTournaments.filter((t) => t.status === 'completed').length,
      totalMatches: tournaments.reduce((sum, t) => {
        const bracket = this._getBrackets().find((b) => b.tournamentId === t.id);
        return (
          sum + (bracket?.rounds.reduce((s, r) => s + r.completedMatches, 0) || 0)
        );
      }, 0),
      totalParticipants: tournaments.reduce((sum, t) => sum + t.participants.length, 0),
      averageParticipants:
        userTournaments.length > 0
          ? Math.round(
              userTournaments.reduce((sum, t) => sum + t.participants.length, 0) /
                userTournaments.length
            )
          : 0,
      winningTournaments: winCount,
      totalPrizeWinnings: totalWinnings,
    };
  },

  /**
   * Private Helper Methods
   */

  _getTournaments(): Tournament[] {
    const data = localStorage.getItem(this._tournamentKey);
    return data ? JSON.parse(data) : [];
  },

  _getBrackets(): Bracket[] {
    const data = localStorage.getItem(this._bracketKey);
    return data ? JSON.parse(data) : [];
  },

  _generateSingleElimination(tournament: Tournament): Bracket {
    const participants = [...tournament.participants];
    const roundCount = Math.ceil(Math.log2(participants.length));
    const rounds: Round[] = [];

    let matchNumber = 1;

    for (let roundNum = 0; roundNum < roundCount; roundNum++) {
      const roundMatches: BracketMatch[] = [];
      const participantsInRound = Math.pow(2, roundCount - roundNum);

      for (let i = 0; i < participantsInRound; i += 2) {
        const match: BracketMatch = {
          id: `match_${Date.now()}_${matchNumber}`,
          tournamentId: tournament.id,
          matchNumber,
          round: roundNum + 1,
          status: 'pending',
          participant1: participants[i],
          participant2: i + 1 < participants.length ? participants[i + 1] : undefined,
          bracket: 'winner',
        };
        roundMatches.push(match);
        matchNumber++;
      }

      rounds.push({
        roundNumber: roundNum + 1,
        name: this._getRoundName(roundNum + 1, roundCount),
        matches: roundMatches,
        totalMatches: roundMatches.length,
        completedMatches: 0,
      });

      participants.splice(0, participantsInRound);
    }

    return {
      id: `bracket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tournamentId: tournament.id,
      format: 'single_elimination',
      rounds,
      currentRound: 1,
      participantCount: tournament.participants.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  _generateDoubleElimination(tournament: Tournament): Bracket {
    // Simplified double elimination with winner's and loser's bracket
    const bracket = this._generateSingleElimination(tournament);
    bracket.format = 'double_elimination';

    // Add loser's bracket rounds
    const additionalRounds = bracket.rounds.length - 1;
    for (let i = 0; i < additionalRounds; i++) {
      bracket.rounds.push({
        roundNumber: bracket.rounds.length + 1,
        name: `Loser's Round ${i + 1}`,
        matches: [],
        totalMatches: 0,
        completedMatches: 0,
      });
    }

    return bracket;
  },

  _generateRoundRobin(tournament: Tournament): Bracket {
    const participants = [...tournament.participants];
    const roundMatches: BracketMatch[] = [];
    let matchNumber = 1;

    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        roundMatches.push({
          id: `match_${Date.now()}_${matchNumber}`,
          tournamentId: tournament.id,
          matchNumber,
          round: 1,
          status: 'pending',
          participant1: participants[i],
          participant2: participants[j],
          bracket: 'winner',
        });
        matchNumber++;
      }
    }

    return {
      id: `bracket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tournamentId: tournament.id,
      format: 'round_robin',
      rounds: [
        {
          roundNumber: 1,
          name: 'Round Robin',
          matches: roundMatches,
          totalMatches: roundMatches.length,
          completedMatches: 0,
        },
      ],
      currentRound: 1,
      participantCount: participants.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  _generateSwiss(tournament: Tournament, rounds: number = 3): Bracket {
    const participants = [...tournament.participants];
    const swissRounds: Round[] = [];

    for (let roundNum = 0; roundNum < rounds; roundNum++) {
      const roundMatches: BracketMatch[] = [];
      let matchNumber = 1;

      // Simplified Swiss pairing
      for (let i = 0; i < participants.length; i += 2) {
        if (i + 1 < participants.length) {
          roundMatches.push({
            id: `match_${Date.now()}_${matchNumber}`,
            tournamentId: tournament.id,
            matchNumber,
            round: roundNum + 1,
            status: 'pending',
            participant1: participants[i],
            participant2: participants[i + 1],
            bracket: 'winner',
          });
          matchNumber++;
        }
      }

      swissRounds.push({
        roundNumber: roundNum + 1,
        name: `Swiss Round ${roundNum + 1}`,
        matches: roundMatches,
        totalMatches: roundMatches.length,
        completedMatches: 0,
      });
    }

    return {
      id: `bracket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tournamentId: tournament.id,
      format: 'swiss',
      rounds: swissRounds,
      currentRound: 1,
      participantCount: participants.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  _getRoundName(roundNum: number, totalRounds: number): string {
    const remaining = totalRounds - roundNum + 1;
    if (remaining === 1) return 'Finals';
    if (remaining === 2) return 'Semi-Finals';
    if (remaining === 3) return 'Quarter-Finals';
    return `Round ${roundNum}`;
  },

  _getDefaultPrizeDivision(maxParticipants: number): number[] {
    return [50, 30, 20]; // 50% for 1st, 30% for 2nd, 20% for 3rd
  },

  _advanceParticipant(bracket: Bracket, nextMatchId: string, participantId: string): void {
    for (const round of bracket.rounds) {
      const match = round.matches.find((m) => m.id === nextMatchId);
      if (match) {
        if (!match.participant1) {
          match.participant1 = participantId;
        } else if (!match.participant2) {
          match.participant2 = participantId;
        }
        break;
      }
    }
  },

  _updateBracket(bracket: Bracket): void {
    const brackets = this._getBrackets();
    const index = brackets.findIndex((b) => b.id === bracket.id);
    if (index !== -1) {
      brackets[index] = bracket;
      localStorage.setItem(this._bracketKey, JSON.stringify(brackets));
    }
  },
};
