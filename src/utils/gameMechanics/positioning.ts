/**
 * Player Positioning System - Dynamic positioning based on tactics and possession
 * Determines optimal player positions during match
 */

export interface PositionVector {
  x: number;
  y: number;
  zone: string;
}

export interface PlayerPosition {
  playerId: string;
  position: PositionVector;
  marking: string | null;
  pressing: boolean;
  coverage: number; // 0-1, how much area defended
}

export interface FormationTactics {
  name: string;
  defending: PlayerPosition[];
  attacking: PlayerPosition[];
  transitioning: PlayerPosition[];
  width: number;
  depth: number;
  aggressiveness: number; // 0-1
}

export class PositioningSystem {
  private fieldWidth: number = 105;
  private fieldHeight: number = 68;
  private zones: Map<string, { x: number; y: number; width: number; height: number }> = new Map();

  constructor() {
    this.initializeZones();
  }

  private initializeZones(): void {
    // Divide field into 18 zones (3x6)
    const zoneWidth = this.fieldWidth / 3;
    const zoneHeight = this.fieldHeight / 6;

    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 3; col++) {
        const zoneId = `z_${row}_${col}`;
        this.zones.set(zoneId, {
          x: col * zoneWidth,
          y: row * zoneHeight,
          width: zoneWidth,
          height: zoneHeight,
        });
      }
    }
  }

  calculateOptimalPosition(
    playerId: string,
    playerRole: string,
    ballPosition: PositionVector,
    formationTactics: FormationTactics,
    possession: string
  ): PositionVector {
    if (possession === 'attacking') {
      return this.calculateAttackingPosition(playerId, playerRole, ballPosition, formationTactics);
    } else {
      return this.calculateDefendingPosition(playerId, playerRole, ballPosition, formationTactics);
    }
  }

  private calculateAttackingPosition(
    playerId: string,
    playerRole: string,
    ballPosition: PositionVector,
    tactics: FormationTactics
  ): PositionVector {
    const basePosition = tactics.attacking.find((p) => p.playerId === playerId) || tactics.attacking[0];

    const offset = {
      x: (ballPosition.x - this.fieldWidth / 2) * 0.3,
      y: (ballPosition.y - this.fieldHeight / 2) * 0.3,
    };

    const targetX = Math.max(0, Math.min(this.fieldWidth, basePosition.position.x + offset.x));
    const targetY = Math.max(0, Math.min(this.fieldHeight, basePosition.position.y + offset.y));

    return {
      x: targetX,
      y: targetY,
      zone: this.getZoneForPosition(targetX, targetY),
    };
  }

  private calculateDefendingPosition(
    playerId: string,
    playerRole: string,
    ballPosition: PositionVector,
    tactics: FormationTactics
  ): PositionVector {
    const basePosition = tactics.defending.find((p) => p.playerId === playerId) || tactics.defending[0];
    
    // Defensive shape compactness increases as ball moves forward
    const compactness = Math.min(1, ballPosition.x / (this.fieldWidth * 0.6));
    
    const defensiveAdjustment = {
      x: basePosition.position.x - (ballPosition.x - this.fieldWidth * 0.2) * 0.2 * compactness,
      y: basePosition.position.y + (ballPosition.y - this.fieldHeight / 2) * 0.15 * compactness,
    };

    const targetX = Math.max(0, Math.min(this.fieldWidth, defensiveAdjustment.x));
    const targetY = Math.max(0, Math.min(this.fieldHeight, defensiveAdjustment.y));

    return {
      x: targetX,
      y: targetY,
      zone: this.getZoneForPosition(targetX, targetY),
    };
  }

  private getZoneForPosition(x: number, y: number): string {
    const zoneWidth = this.fieldWidth / 3;
    const zoneHeight = this.fieldHeight / 6;
    
    const col = Math.floor(x / zoneWidth);
    const row = Math.floor(y / zoneHeight);
    
    return `z_${row}_${col}`;
  }

  calculatePressure(attackerPosition: PositionVector, defenderPosition: PositionVector): number {
    const distance = Math.sqrt(
      Math.pow(attackerPosition.x - defenderPosition.x, 2) +
      Math.pow(attackerPosition.y - defenderPosition.y, 2)
    );
    
    // Pressure decreases with distance, max at 5m, zero at 15m
    return Math.max(0, 1 - distance / 15);
  }

  getSpaceAvailable(position: PositionVector, defenderPositions: PositionVector[]): number {
    let totalPressure = 0;

    for (const defender of defenderPositions) {
      totalPressure += this.calculatePressure(position, defender);
    }

    return Math.max(0, 1 - totalPressure);
  }

  validateFormationTactics(tactics: FormationTactics): boolean {
    // Ensure balanced positioning
    const allPositions = [...tactics.attacking, ...tactics.defending];
    
    // Check for duplicate positions
    const positionSet = new Set(allPositions.map((p) => JSON.stringify(p.position)));
    if (positionSet.size !== allPositions.length) {
      return false;
    }

    // Check reasonable spacing
    return allPositions.every((p) =>
      p.position.x >= 0 &&
      p.position.x <= this.fieldWidth &&
      p.position.y >= 0 &&
      p.position.y <= this.fieldHeight
    );
  }
}
