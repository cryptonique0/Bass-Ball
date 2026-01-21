/**
 * Player roster and team management
 */

export interface PlayerContract {
  playerId: string;
  teamId: string;
  position: string;
  salary: bigint;
  joinedAt: number;
  expiresAt: number;
}

export interface TeamRoster {
  teamId: string;
  name: string;
  players: Map<string, PlayerContract>;
  maxSquadSize: number;
  createdAt: number;
}

export class RosterManager {
  private rosters: Map<string, TeamRoster> = new Map();
  private playerTeams: Map<string, string> = new Map(); // playerId -> teamId

  /**
   * Create team roster
   */
  createRoster(teamId: string, name: string, maxSquadSize: number = 25): TeamRoster {
    const roster: TeamRoster = {
      teamId,
      name,
      players: new Map(),
      maxSquadSize,
      createdAt: Date.now(),
    };

    this.rosters.set(teamId, roster);
    return roster;
  }

  /**
   * Sign player to team
   */
  signPlayer(
    teamId: string,
    playerId: string,
    position: string,
    salary: bigint,
    durationDays: number = 365
  ): PlayerContract | null {
    const roster = this.rosters.get(teamId);
    if (!roster) return null;

    if (roster.players.size >= roster.maxSquadSize) return null;

    // Check if player is already on another team
    const currentTeam = this.playerTeams.get(playerId);
    if (currentTeam && currentTeam !== teamId) return null;

    const now = Date.now();
    const contract: PlayerContract = {
      playerId,
      teamId,
      position,
      salary,
      joinedAt: now,
      expiresAt: now + durationDays * 24 * 60 * 60 * 1000,
    };

    roster.players.set(playerId, contract);
    this.playerTeams.set(playerId, teamId);

    return contract;
  }

  /**
   * Release player from team
   */
  releasePlayer(teamId: string, playerId: string): boolean {
    const roster = this.rosters.get(teamId);
    if (!roster) return false;

    const removed = roster.players.delete(playerId);
    if (removed) {
      this.playerTeams.delete(playerId);
    }

    return removed;
  }

  /**
   * Get player's current team
   */
  getPlayerTeam(playerId: string): string | undefined {
    return this.playerTeams.get(playerId);
  }

  /**
   * Get roster
   */
  getRoster(teamId: string): TeamRoster | undefined {
    return this.rosters.get(teamId);
  }

  /**
   * Get team roster size
   */
  getRosterSize(teamId: string): number {
    const roster = this.rosters.get(teamId);
    return roster?.players.size || 0;
  }

  /**
   * Get players by position
   */
  getPlayersByPosition(teamId: string, position: string): PlayerContract[] {
    const roster = this.rosters.get(teamId);
    if (!roster) return [];

    return Array.from(roster.players.values()).filter((c) => c.position === position);
  }

  /**
   * Get team salary cap
   */
  getTeamSalaryCap(teamId: string): bigint {
    const roster = this.rosters.get(teamId);
    if (!roster) return BigInt(0);

    return Array.from(roster.players.values()).reduce(
      (sum, contract) => sum + contract.salary,
      BigInt(0)
    );
  }

  /**
   * Check contract expiration
   */
  checkContractExpirations(teamId: string): PlayerContract[] {
    const roster = this.rosters.get(teamId);
    if (!roster) return [];

    const now = Date.now();
    const expiring: PlayerContract[] = [];

    roster.players.forEach((contract) => {
      const daysLeft = (contract.expiresAt - now) / (24 * 60 * 60 * 1000);
      if (daysLeft <= 30 && daysLeft > 0) {
        expiring.push(contract);
      } else if (now > contract.expiresAt) {
        roster.players.delete(contract.playerId);
        this.playerTeams.delete(contract.playerId);
      }
    });

    return expiring;
  }

  /**
   * Get roster statistics
   */
  getStatistics(teamId: string) {
    const roster = this.rosters.get(teamId);
    if (!roster) return null;

    const positions: Record<string, number> = {};
    let totalSalary = BigInt(0);

    roster.players.forEach((contract) => {
      positions[contract.position] = (positions[contract.position] || 0) + 1;
      totalSalary += contract.salary;
    });

    return {
      teamId,
      rosterSize: roster.players.size,
      maxSize: roster.maxSquadSize,
      totalSalary,
      positions,
      utilization: (roster.players.size / roster.maxSquadSize) * 100,
    };
  }
}
