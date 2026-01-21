/**
 * Injury and recovery management system
 */

export type InjuryType = 'minor' | 'moderate' | 'severe' | 'critical';

export interface Injury {
  injuryId: string;
  playerId: string;
  type: InjuryType;
  daysOut: number;
  recoveryProgress: number; // 0-100
  createdAt: number;
  recoveredAt?: number;
  description: string;
}

export interface InjuryRecord {
  playerId: string;
  injuries: Injury[];
  totalDaysOut: number;
  injuryProne: boolean;
}

export class InjuryService {
  private injuries: Map<string, Injury> = new Map();
  private playerRecords: Map<string, InjuryRecord> = new Map();

  /**
   * Record injury
   */
  recordInjury(
    playerId: string,
    type: InjuryType,
    daysOut: number,
    description: string = ''
  ): Injury {
    const now = Date.now();
    const injuryId = `injury-${playerId}-${now}`;

    const injury: Injury = {
      injuryId,
      playerId,
      type,
      daysOut,
      recoveryProgress: 0,
      createdAt: now,
      description,
    };

    this.injuries.set(injuryId, injury);

    if (!this.playerRecords.has(playerId)) {
      this.playerRecords.set(playerId, {
        playerId,
        injuries: [],
        totalDaysOut: 0,
        injuryProne: false,
      });
    }

    const record = this.playerRecords.get(playerId)!;
    record.injuries.push({ ...injury });
    record.totalDaysOut += daysOut;
    record.injuryProne = record.injuries.length >= 3;

    return injury;
  }

  /**
   * Get active injury
   */
  getActiveInjury(playerId: string): Injury | undefined {
    return Array.from(this.injuries.values()).find(
      (i) => i.playerId === playerId && !i.recoveredAt
    );
  }

  /**
   * Update recovery progress
   */
  updateRecoveryProgress(injuryId: string, progress: number): boolean {
    const injury = this.injuries.get(injuryId);
    if (!injury) return false;

    injury.recoveryProgress = Math.min(100, progress);

    if (injury.recoveryProgress >= 100) {
      injury.recoveredAt = Date.now();
    }

    return true;
  }

  /**
   * Get days until return
   */
  getDaysUntilReturn(playerId: string): number {
    const injury = this.getActiveInjury(playerId);
    if (!injury) return 0;

    const daysElapsed = (Date.now() - injury.createdAt) / (24 * 60 * 60 * 1000);
    return Math.max(0, injury.daysOut - daysElapsed);
  }

  /**
   * Check if player can play
   */
  canPlay(playerId: string): boolean {
    const injury = this.getActiveInjury(playerId);
    return !injury || injury.recoveryProgress >= 100;
  }

  /**
   * Get injury record
   */
  getInjuryRecord(playerId: string): InjuryRecord | undefined {
    return this.playerRecords.get(playerId);
  }

  /**
   * Get injury history
   */
  getInjuryHistory(playerId: string): Injury[] {
    return this.playerRecords.get(playerId)?.injuries || [];
  }

  /**
   * Simulate daily recovery
   */
  simulateDayOfRecovery(playerId: string): boolean {
    const injury = this.getActiveInjury(playerId);
    if (!injury) return false;

    const recoveryRate = 100 / injury.daysOut;
    this.updateRecoveryProgress(injury.injuryId, injury.recoveryProgress + recoveryRate);

    return true;
  }

  /**
   * Get unavailable players
   */
  getUnavailablePlayers(playerIds: string[]): string[] {
    return playerIds.filter((id) => !this.canPlay(id));
  }
}
