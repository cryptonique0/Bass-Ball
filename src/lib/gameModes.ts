/**
 * Game modes and rule sets
 */

export type GameMode = 'friendly' | 'ranked' | 'tournament' | 'campaign' | 'practice';

export interface GameModeRules {
  mode: GameMode;
  description: string;
  duration: number; // in seconds
  maxPlayers: number;
  minPlayers: number;
  pointsPerWin: number;
  pointsPerDraw: number;
  pointsPerLoss: number;
  rewardMultiplier: number;
  skillPointsMultiplier: number;
  allowSubstitutions: boolean;
  allowTimeouts: boolean;
  injury_enabled: boolean;
}

export const GAME_MODE_RULES: Record<GameMode, GameModeRules> = {
  friendly: {
    mode: 'friendly',
    description: 'Casual match with no ranking implications',
    duration: 90 * 60,
    maxPlayers: 22,
    minPlayers: 22,
    pointsPerWin: 0,
    pointsPerDraw: 0,
    pointsPerLoss: 0,
    rewardMultiplier: 0.5,
    skillPointsMultiplier: 0.5,
    allowSubstitutions: true,
    allowTimeouts: true,
    injury_enabled: false,
  },
  ranked: {
    mode: 'ranked',
    description: 'Competitive match affecting rank and rating',
    duration: 90 * 60,
    maxPlayers: 22,
    minPlayers: 22,
    pointsPerWin: 3,
    pointsPerDraw: 1,
    pointsPerLoss: 0,
    rewardMultiplier: 1.0,
    skillPointsMultiplier: 1.0,
    allowSubstitutions: true,
    allowTimeouts: false,
    injury_enabled: true,
  },
  tournament: {
    mode: 'tournament',
    description: 'Tournament bracket with elimination',
    duration: 90 * 60,
    maxPlayers: 22,
    minPlayers: 22,
    pointsPerWin: 5,
    pointsPerDraw: 1,
    pointsPerLoss: 0,
    rewardMultiplier: 2.0,
    skillPointsMultiplier: 2.0,
    allowSubstitutions: true,
    allowTimeouts: false,
    injury_enabled: true,
  },
  campaign: {
    mode: 'campaign',
    description: 'Story-driven single-player campaign',
    duration: 90 * 60,
    maxPlayers: 2,
    minPlayers: 1,
    pointsPerWin: 10,
    pointsPerDraw: 0,
    pointsPerLoss: 0,
    rewardMultiplier: 1.5,
    skillPointsMultiplier: 1.5,
    allowSubstitutions: true,
    allowTimeouts: true,
    injury_enabled: true,
  },
  practice: {
    mode: 'practice',
    description: 'Practice mode to learn game mechanics',
    duration: 45 * 60,
    maxPlayers: 22,
    minPlayers: 1,
    pointsPerWin: 0,
    pointsPerDraw: 0,
    pointsPerLoss: 0,
    rewardMultiplier: 0.1,
    skillPointsMultiplier: 1.0,
    allowSubstitutions: true,
    allowTimeouts: true,
    injury_enabled: false,
  },
};

export class GameModeManager {
  /**
   * Get game mode rules
   */
  getGameModeRules(mode: GameMode): GameModeRules {
    return { ...GAME_MODE_RULES[mode] };
  }

  /**
   * Get all game modes
   */
  getAllGameModes(): GameModeRules[] {
    return Object.values(GAME_MODE_RULES).map((r) => ({ ...r }));
  }

  /**
   * Calculate rewards for mode and result
   */
  calculateRewards(
    mode: GameMode,
    won: boolean,
    baseReward: bigint
  ): {
    rewardAmount: bigint;
    points: number;
    skillPoints: number;
  } {
    const rules = GAME_MODE_RULES[mode];

    const rewardAmount =
      (baseReward * BigInt(Math.floor(rules.rewardMultiplier * 100))) / BigInt(100);

    const points = won ? rules.pointsPerWin : rules.pointsPerLoss;
    const skillPoints = Math.floor(10 * rules.skillPointsMultiplier);

    return {
      rewardAmount,
      points,
      skillPoints,
    };
  }

  /**
   * Validate game mode settings
   */
  validateGameMode(mode: GameMode, playerCount: number): boolean {
    const rules = GAME_MODE_RULES[mode];
    return (
      playerCount >= rules.minPlayers && playerCount <= rules.maxPlayers
    );
  }

  /**
   * Get recommended game mode for player level
   */
  getRecommendedMode(playerLevel: number): GameMode {
    if (playerLevel < 5) return 'practice';
    if (playerLevel < 10) return 'friendly';
    if (playerLevel < 25) return 'ranked';
    return 'tournament';
  }

  /**
   * Check if mode allows feature
   */
  hasFeature(
    mode: GameMode,
    feature: 'substitutions' | 'timeouts' | 'injuries'
  ): boolean {
    const rules = GAME_MODE_RULES[mode];

    switch (feature) {
      case 'substitutions':
        return rules.allowSubstitutions;
      case 'timeouts':
        return rules.allowTimeouts;
      case 'injuries':
        return rules.injury_enabled;
      default:
        return false;
    }
  }
}
