/**
 * Referee Decision System - Simulates referee decisions, cards, fouls, and VAR reviews
 */

export type CardType = 'yellow' | 'red' | 'none';
export type FoulType = 'tackle' | 'handball' | 'offside' | 'push' | 'kick' | 'obstruction';

export interface FoulEvent {
  type: FoulType;
  severity: number; // 0-1
  playerId: string;
  victimId: string;
  position: { x: number; y: number };
  timestamp: number;
}

export interface RefereeDecision {
  foulCalled: boolean;
  card: CardType;
  freeKick: boolean;
  penalty: boolean;
  var: boolean;
  overturned: boolean;
  confidence: number; // 0-1
}

export class RefereeSystem {
  private cardHistory: Map<string, { yellow: number; red: boolean }> = new Map();
  private varReviewQueue: FoulEvent[] = [];
  private mistakeRate: number = 0.15; // 15% chance of error

  recordFoul(foul: FoulEvent): RefereeDecision {
    const decision = this.makeFoulDecision(foul);

    if (decision.foulCalled) {
      this.applyCard(foul.playerId, decision.card);
    }

    return decision;
  }

  private makeFoulDecision(foul: FoulEvent): RefereeDecision {
    const baseSeverity = this.getBaseSeverity(foul.type);
    const adjustedSeverity = baseSeverity + (Math.random() - 0.5) * 0.2; // ±10% variance

    // Critical fouls always called
    if (adjustedSeverity > 0.8) {
      return {
        foulCalled: true,
        card: adjustedSeverity > 0.9 ? 'red' : 'yellow',
        freeKick: true,
        penalty: this.isPenaltyArea(foul.position),
        var: adjustedSeverity > 0.85,
        overturned: false,
        confidence: 0.95,
      };
    }

    // Apply mistake rate
    const mistakeFactor = Math.random() < this.mistakeRate ? -0.3 : 0;
    const finalSeverity = Math.max(0, adjustedSeverity + mistakeFactor);

    return {
      foulCalled: finalSeverity > 0.5,
      card: finalSeverity > 0.75 ? 'yellow' : 'none',
      freeKick: finalSeverity > 0.5,
      penalty: finalSeverity > 0.6 && this.isPenaltyArea(foul.position),
      var: false,
      overturned: false,
      confidence: finalSeverity,
    };
  }

  private getBaseSeverity(foulType: FoulType): number {
    const severities: Record<FoulType, number> = {
      tackle: 0.4,
      handball: 0.7,
      offside: 0.3,
      push: 0.55,
      kick: 0.8,
      obstruction: 0.45,
    };
    return severities[foulType] || 0.5;
  }

  private isPenaltyArea(position: { x: number; y: number }): boolean {
    // Penalty area is roughly 16.5m x 40.3m
    return position.x > 88.5 && position.y > 13.85 && position.y < 54.15;
  }

  private applyCard(playerId: string, card: CardType): void {
    if (card === 'none') return;

    if (!this.cardHistory.has(playerId)) {
      this.cardHistory.set(playerId, { yellow: 0, red: false });
    }

    const playerCards = this.cardHistory.get(playerId)!;

    if (card === 'red') {
      playerCards.red = true;
    } else if (card === 'yellow') {
      playerCards.yellow++;
      if (playerCards.yellow >= 2) {
        playerCards.red = true;
      }
    }
  }

  getPlayerSuspension(playerId: string): boolean {
    const cards = this.cardHistory.get(playerId);
    return cards ? cards.red : false;
  }

  getPlayerYellowCards(playerId: string): number {
    const cards = this.cardHistory.get(playerId);
    return cards ? cards.yellow : 0;
  }

  reviewVAR(foul: FoulEvent): boolean {
    // VAR overturns 10-15% of on-field decisions
    if (foul.severity > 0.8) {
      return Math.random() < 0.12;
    }
    return false;
  }

  getRefereeAccuracy(): number {
    // Returns 0.85-0.95 representing referee accuracy
    return 1 - this.mistakeRate;
  }

  setMistakeRate(rate: number): void {
    this.mistakeRate = Math.max(0, Math.min(0.3, rate));
  }
}
