/**
 * Anti-cheat and fair play system
 */

export type ViolationType = 'aimbot' | 'speedhack' | 'macroabuse' | 'glitch' | 'unsporting';

export interface ViolationReport {
  id: string;
  playerId: string;
  type: ViolationType;
  reportedAt: number;
  evidence: Record<string, any>;
  status: 'pending' | 'investigating' | 'confirmed' | 'dismissed';
  penalty?: string;
}

export interface PlayerReputation {
  playerId: string;
  fairPlayScore: number; // 0-100
  violations: ViolationReport[];
  suspensions: Array<{ reason: string; duration: number; startDate: number }>;
  warnings: number;
}

export class AnticheatService {
  private violations: Map<string, ViolationReport> = new Map();
  private reputation: Map<string, PlayerReputation> = new Map();
  private detectionThresholds = {
    speedhack: 50,
    aimbot: 95,
    macroabuse: 85,
  };

  /**
   * Report violation
   */
  reportViolation(
    playerId: string,
    type: ViolationType,
    evidence: Record<string, any>
  ): ViolationReport {
    const reportId = `report-${playerId}-${Date.now()}`;
    const now = Date.now();

    const report: ViolationReport = {
      id: reportId,
      playerId,
      type,
      reportedAt: now,
      evidence,
      status: 'pending',
    };

    this.violations.set(reportId, { ...report });

    // Auto-detect common patterns
    if (this.detectViolation(evidence)) {
      report.status = 'investigating';
    }

    return report;
  }

  /**
   * Detect violation patterns
   */
  private detectViolation(evidence: Record<string, any>): boolean {
    if (evidence.speed && evidence.speed > this.detectionThresholds.speedhack) {
      return true;
    }
    if (evidence.accuracy && evidence.accuracy > this.detectionThresholds.aimbot) {
      return true;
    }
    if (evidence.actionsPerSecond && evidence.actionsPerSecond > this.detectionThresholds.macroabuse) {
      return true;
    }

    return false;
  }

  /**
   * Confirm violation
   */
  confirmViolation(reportId: string, penalty: string = 'warning'): boolean {
    const report = this.violations.get(reportId);
    if (!report) return false;

    report.status = 'confirmed';
    report.penalty = penalty;

    let reputation = this.reputation.get(report.playerId);
    if (!reputation) {
      reputation = this.initializeReputation(report.playerId);
    }

    reputation.violations.push(report);
    reputation.fairPlayScore -= 10 * (penalty === 'ban' ? 5 : 1);
    reputation.fairPlayScore = Math.max(0, reputation.fairPlayScore);

    if (penalty === 'warning') {
      reputation.warnings++;
    } else if (penalty === 'suspension') {
      reputation.suspensions.push({
        reason: report.type,
        duration: 24 * 60 * 60 * 1000, // 24 hours
        startDate: Date.now(),
      });
    }

    return true;
  }

  /**
   * Dismiss violation
   */
  dismissViolation(reportId: string): boolean {
    const report = this.violations.get(reportId);
    if (!report) return false;

    report.status = 'dismissed';
    return true;
  }

  /**
   * Initialize player reputation
   */
  private initializeReputation(playerId: string): PlayerReputation {
    const reputation: PlayerReputation = {
      playerId,
      fairPlayScore: 100,
      violations: [],
      suspensions: [],
      warnings: 0,
    };

    this.reputation.set(playerId, reputation);
    return reputation;
  }

  /**
   * Get player reputation
   */
  getReputation(playerId: string): PlayerReputation {
    return this.reputation.get(playerId) || this.initializeReputation(playerId);
  }

  /**
   * Check if player is suspended
   */
  isSuspended(playerId: string): boolean {
    const reputation = this.reputation.get(playerId);
    if (!reputation) return false;

    const now = Date.now();
    return reputation.suspensions.some((s) => now < s.startDate + s.duration);
  }

  /**
   * Get active suspensions
   */
  getActiveSuspensions(playerId: string): Array<{
    reason: string;
    remainingTime: number;
  }> {
    const reputation = this.reputation.get(playerId);
    if (!reputation) return [];

    const now = Date.now();
    return reputation.suspensions
      .filter((s) => now < s.startDate + s.duration)
      .map((s) => ({
        reason: s.reason,
        remainingTime: s.startDate + s.duration - now,
      }));
  }

  /**
   * Get violation history
   */
  getViolationHistory(playerId: string): ViolationReport[] {
    return this.reputation.get(playerId)?.violations || [];
  }

  /**
   * Award fair play bonus
   */
  awardFairPlayBonus(playerId: string, amount: number = 5): void {
    let reputation = this.reputation.get(playerId);
    if (!reputation) {
      reputation = this.initializeReputation(playerId);
    }

    reputation.fairPlayScore = Math.min(100, reputation.fairPlayScore + amount);
  }

  /**
   * Get players to review
   */
  getPlayersToReview(limit: number = 20): ViolationReport[] {
    return Array.from(this.violations.values())
      .filter((v) => v.status === 'investigating')
      .slice(0, limit);
  }
}
