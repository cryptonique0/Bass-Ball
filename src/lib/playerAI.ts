// Player AI utilities
export interface AIConfig {
  aggressiveness: number; // 0-100
  positioning: number; // 0-100
  passing: number; // 0-100
  defense: number; // 0-100
}

export class PlayerAI {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  decideBehavior(context: any): string {
    if (context.hasBall) {
      return this.getAttackingBehavior();
    } else {
      return this.getDefendingBehavior();
    }
  }

  private getAttackingBehavior(): string {
    if (this.config.aggressiveness > 75) return 'aggressive_attack';
    if (this.config.aggressiveness > 50) return 'normal_attack';
    return 'conservative_attack';
  }

  private getDefendingBehavior(): string {
    if (this.config.defense > 75) return 'tight_defense';
    if (this.config.defense > 50) return 'normal_defense';
    return 'loose_defense';
  }

  calculateOptimalPosition(context: any): { x: number; y: number } {
    const baseX = this.config.positioning;
    const baseY = 50 + (Math.random() - 0.5) * 20;
    return { x: baseX, y: baseY };
  }
}
