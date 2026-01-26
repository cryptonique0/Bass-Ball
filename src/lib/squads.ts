/**
 * Squad and team management system
 * 
 * Manages player rosters, team sheets, and in-match substitutions.
 */

/** Squad configuration and player roster */
export interface Squad {
  squadId: string;
  teamId: string;
  playerIds: string[];
  maxSize: number;
  createdAt: number;
}

/** Team sheet for a match */
export interface TeamSheet {
  squadId: string;
  startingXI: string[]; // 11 players
  bench: string[]; // Available substitutes
  substitutes: string[]; // Players who can be subbed in
  formation: string;
}

/**
 * Squad management service
 * 
 * Handles squad creation, player management, and team sheet operations.
 */
export class SquadManager {
  private squads: Map<string, Squad> = new Map();
  private teamSheets: Map<string, TeamSheet> = new Map();
  
  /** Minimum squad size */
  private static readonly MIN_SQUAD_SIZE = 11;
  /** Default maximum squad size */
  private static readonly DEFAULT_MAX_SIZE = 23;

  /**
   * Create a new squad
   * 
   * @param teamId - Team identifier
   * @param maxSize - Maximum number of players (default: 23)
   * @returns Created squad
   * @throws {Error} If maxSize is less than 11
   */
  createSquad(teamId: string, maxSize: number = SquadManager.DEFAULT_MAX_SIZE): Squad {
    if (maxSize < SquadManager.MIN_SQUAD_SIZE) {
      throw new Error(`Squad size must be at least ${SquadManager.MIN_SQUAD_SIZE}`);
    }
    
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
   * 
   * @param squadId - Squad identifier
   * @param playerId - Player to add
   * @returns True if player was added, false if already in squad or squad is full
   */
  addPlayerToSquad(squadId: string, playerId: string): boolean {
    const squad = this.squads.get(squadId);
    if (!squad) {
      console.warn(`[SquadManager] Squad not found: ${squadId}`);
      return false;
    }
    
    if (squad.playerIds.includes(playerId)) {
      console.warn(`[SquadManager] Player ${playerId} already in squad`);
      return false;
    }

    if (squad.playerIds.length >= squad.maxSize) {
      console.warn(`[SquadManager] Squad ${squadId} is full (${squad.maxSize} players)`);
      return false;
    }

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
