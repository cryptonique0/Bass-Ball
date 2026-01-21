/**
 * Set Plays System - Corner kicks, free kicks, throw-ins, penalties
 * Handles structured plays with pre-defined formations and run patterns
 */

export interface SetPlayConfig {
  playType: 'corner' | 'freeKick' | 'throwIn' | 'penalty' | 'goalKick';
  team: string;
  position: { x: number; y: number };
  formation: string;
  difficulty: 'easy' | 'normal' | 'hard' | 'expert';
}

export interface PlayRunner {
  playerId: string;
  targetPosition: { x: number; y: number };
  runType: 'straight' | 'diagonal' | 'curve' | 'dummy';
  timing: number; // milliseconds to start run
  speed: number; // 0-1 multiplier
}

export interface SetPlayResult {
  success: boolean;
  type: string;
  scorer?: string;
  assist?: string;
  defenseInterrupted: boolean;
  predictedXG: number;
}

export class SetPlayManager {
  private playHistory: SetPlayResult[] = [];
  private playerRunPatterns: Map<string, PlayRunner[]> = new Map();

  constructor(private fieldWidth: number = 105, private fieldHeight: number = 68) {}

  generateCornerKick(
    team: string,
    isLeftCorner: boolean,
    difficulty: 'easy' | 'normal' | 'hard' | 'expert' = 'normal'
  ): SetPlayConfig {
    const position = isLeftCorner
      ? { x: 0, y: this.fieldHeight }
      : { x: this.fieldWidth, y: this.fieldHeight };

    return {
      playType: 'corner',
      team,
      position,
      formation: this.selectCornerFormation(difficulty),
      difficulty,
    };
  }

  generateFreeKick(
    team: string,
    distanceFromGoal: number,
    angleFromCenter: number,
    difficulty: 'easy' | 'normal' | 'hard' | 'expert' = 'normal'
  ): SetPlayConfig {
    const x = this.fieldWidth * (distanceFromGoal / 100);
    const y = (this.fieldHeight / 2) + Math.sin(angleFromCenter) * 20;

    return {
      playType: 'freeKick',
      team,
      position: { x, y },
      formation: this.selectFreeKickFormation(difficulty),
      difficulty,
    };
  }

  generatePenalty(team: string): SetPlayConfig {
    return {
      playType: 'penalty',
      team,
      position: { x: this.fieldWidth * 0.88, y: this.fieldHeight / 2 },
      formation: 'penalty',
      difficulty: 'expert',
    };
  }

  generatePlayRunners(config: SetPlayConfig): PlayRunner[] {
    const runners: PlayRunner[] = [];
    const numRunners = config.difficulty === 'expert' ? 4 : 3;

    for (let i = 0; i < numRunners; i++) {
      const angle = (Math.PI * 2 * i) / numRunners;
      runners.push({
        playerId: `runner_${i}`,
        targetPosition: {
          x: config.position.x + Math.cos(angle) * 15,
          y: config.position.y + Math.sin(angle) * 15,
        },
        runType: i === 0 ? 'straight' : i % 2 === 0 ? 'diagonal' : 'dummy',
        timing: 800 + i * 200,
        speed: 0.7 + (i * 0.1),
      });
    }

    return runners;
  }

  predictSetPlaySuccess(config: SetPlayConfig, defenseFormation: string): number {
    const baseSuccess = { corner: 0.15, freeKick: 0.08, throwIn: 0.05, penalty: 0.75, goalKick: 0.02 };
    let xg = baseSuccess[config.playType] || 0;

    // Difficulty multiplier
    const difficultyMultiplier = { easy: 0.8, normal: 1.0, hard: 1.3, expert: 1.8 };
    xg *= difficultyMultiplier[config.difficulty];

    // Defense strength factor
    const defenseStrength = this.getDefenseStrength(defenseFormation);
    xg *= (1 - defenseStrength * 0.5);

    return Math.min(xg, 0.9);
  }

  recordSetPlayResult(result: SetPlayResult): void {
    this.playHistory.push(result);
  }

  getSetPlayStatistics(): {
    totalPlays: number;
    successRate: number;
    averageXG: number;
    byType: Record<string, { total: number; successful: number }>;
  } {
    const byType: Record<string, { total: number; successful: number }> = {};

    for (const result of this.playHistory) {
      if (!byType[result.type]) {
        byType[result.type] = { total: 0, successful: 0 };
      }
      byType[result.type].total++;
      if (result.success) {
        byType[result.type].successful++;
      }
    }

    const successCount = this.playHistory.filter((p) => p.success).length;
    const totalXG = this.playHistory.reduce((sum, p) => sum + p.predictedXG, 0);

    return {
      totalPlays: this.playHistory.length,
      successRate: this.playHistory.length > 0 ? successCount / this.playHistory.length : 0,
      averageXG: this.playHistory.length > 0 ? totalXG / this.playHistory.length : 0,
      byType,
    };
  }

  private selectCornerFormation(difficulty: string): string {
    const formations = {
      easy: 'corner_simple',
      normal: 'corner_standard',
      hard: 'corner_complex',
      expert: 'corner_elite',
    };
    return formations[difficulty] || 'corner_standard';
  }

  private selectFreeKickFormation(difficulty: string): string {
    const formations = {
      easy: 'fk_simple',
      normal: 'fk_standard',
      hard: 'fk_curved',
      expert: 'fk_advanced',
    };
    return formations[difficulty] || 'fk_standard';
  }

  private getDefenseStrength(formation: string): number {
    const defensiveStrength: Record<string, number> = {
      '5-3-2': 0.85,
      '4-4-2': 0.7,
      '3-5-2': 0.65,
      'compact': 0.9,
      'spread': 0.4,
    };
    return defensiveStrength[formation] || 0.6;
  }
}
