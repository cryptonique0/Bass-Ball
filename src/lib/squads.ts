/**
 * Squad and team management
 */

export interface Squad {
  squadId: string;
  teamId: string;
  playerIds: string[];
  maxSize: number;
  createdAt: number;
}

export interface TeamSheet {
  squadId: string;
  startingXI: string[];
  bench: string[];
  substitutes: string[];
  formation: string;
}

export class SquadManager {
  private squads: Map<string, Squad> = new Map();
  private teamSheets: Map<string, TeamSheet> = new Map();

  /**
   * Create squad
   */
  createSquad(teamId: string, maxSize: number = 23): Squad {
    const squadId = `squad-${teamId}-${Date.now()}`;
    const now = Date.now();

    const squad: Squad = {
      squadId,
      teamId,
      playerIds: [],
      maxSize,
      createdAt: now,
    };

    this.squads.set(squadId, squad);
    return squad;
  }

  /**
   * Add player to squad
   */
  addPlayerToSquad(squadId: string, playerId: string): boolean {
    const squad = this.squads.get(squadId);
    if (!squad || squad.playerIds.includes(playerId)) return false;

    if (squad.playerIds.length >= squad.maxSize) return false;

    squad.playerIds.push(playerId);
    return true;
  }

  /**
   * Remove player from squad
   */
  removePlayerFromSquad(squadId: string, playerId: string): boolean {
    const squad = this.squads.get(squadId);
    if (!squad) return false;

    const index = squad.playerIds.indexOf(playerId);
    if (index === -1) return false;

    squad.playerIds.splice(index, 1);
    return true;
  }

  /**
   * Get squad
   */
  getSquad(squadId: string): Squad | undefined {
    return this.squads.get(squadId);
  }

  /**
   * Get squad size
   */
  getSquadSize(squadId: string): number {
    const squad = this.squads.get(squadId);
    return squad?.playerIds.length || 0;
  }

  /**
   * Create team sheet
   */
  createTeamSheet(
    squadId: string,
    startingXI: string[],
    bench: string[],
    substitutes: string[],
    formation: string
  ): TeamSheet {
    const teamSheet: TeamSheet = {
      squadId,
      startingXI,
      bench,
      substitutes,
      formation,
    };

    this.teamSheets.set(squadId, teamSheet);
    return teamSheet;
  }

  /**
   * Get team sheet
   */
  getTeamSheet(squadId: string): TeamSheet | undefined {
    return this.teamSheets.get(squadId);
  }

  /**
   * Make substitution
   */
  makeSubstitution(
    squadId: string,
    playerOut: string,
    playerIn: string
  ): boolean {
    const teamSheet = this.teamSheets.get(squadId);
    if (!teamSheet) return false;

    let found = false;

    // Find player and move to bench
    const xiIndex = teamSheet.startingXI.indexOf(playerOut);
    if (xiIndex !== -1) {
      teamSheet.startingXI[xiIndex] = playerIn;
      teamSheet.bench.push(playerOut);
      found = true;
    }

    // Alternative: replace from bench
    if (!found) {
      const benchIndex = teamSheet.bench.indexOf(playerOut);
      if (benchIndex !== -1) {
        teamSheet.bench[benchIndex] = playerIn;
        found = true;
      }
    }

    return found;
  }

  /**
   * Get team formation
   */
  getFormation(squadId: string): string | null {
    const teamSheet = this.teamSheets.get(squadId);
    return teamSheet?.formation || null;
  }

  /**
   * Validate team sheet
   */
  validateTeamSheet(teamSheet: TeamSheet): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (teamSheet.startingXI.length !== 11) {
      errors.push(`Starting XI must have 11 players, got ${teamSheet.startingXI.length}`);
    }

    if (teamSheet.bench.length < 7) {
      errors.push(`Bench must have at least 7 players, got ${teamSheet.bench.length}`);
    }

    const totalPlayers = new Set([
      ...teamSheet.startingXI,
      ...teamSheet.bench,
      ...teamSheet.substitutes,
    ]).size;

    if (totalPlayers !== teamSheet.startingXI.length + teamSheet.bench.length + teamSheet.substitutes.length) {
      errors.push('Duplicate players in team sheet');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get team for match
   */
  getTeamForMatch(squadId: string) {
    const teamSheet = this.teamSheets.get(squadId);
    if (!teamSheet) return null;

    return {
      ...teamSheet,
      allPlayers: [
        ...teamSheet.startingXI,
        ...teamSheet.bench,
        ...teamSheet.substitutes,
      ],
    };
  }
}
