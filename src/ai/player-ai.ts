/**
 * Player AI System
 * 
 * Implements role-based AI decision-making for football players
 * - Role-specific decision trees (CB, FB, DM, CM, AM, Winger, Striker)
 * - Behavioral weighting (role, tactical, situational)
 * - Difficulty scaling (Easy, Medium, Hard)
 * - Deterministic decision-making (blockchain verifiable)
 * 
 * Integration: Match Engine → PlayerAI → Decision → Execution
 * Verification: All decisions logged, hashed, and verifiable via blockhash
 */

import { Vector2 } from 'phaser';

/**
 * Player role types
 */
export type PlayerRole = 
  | 'CB'       // Center Back
  | 'FB'       // Full Back (LB, RB)
  | 'DM'       // Defensive Midfielder
  | 'CM'       // Central Midfielder
  | 'AM'       // Attacking Midfielder
  | 'Winger'   // Winger (LW, RW)
  | 'Striker'; // Striker (CF, ST)

/**
 * Game situation context
 */
export interface GameSituation {
  ballPosition: Vector2;
  ballVelocity: Vector2;
  possessionTeam: 'home' | 'away';
  matchTime: number;           // 0-90 minutes
  score: { home: number; away: number };
  pressureLevel: number;       // 0-1 (0=no pressure, 1=max pressure)
  defensiveLineDepth: number;  // Yard line (0-100)
  formationCompactness: number; // 0-1
}

/**
 * Behavioral weights
 */
export interface BehaviorWeights {
  roleWeight: number;      // 0.5 (role identity)
  tacticalWeight: number;  // 0.3 (team tactics)
  situationWeight: number; // 0.2 (match situation)
  
  // Behavioral traits
  aggression: number;       // 0-1
  positioning: number;      // 0-1
  technique: number;        // 0-1
  workRate: number;         // 0-1
  defensiveAwareness: number; // 0-1
  creativity: number;       // 0-1
  riskTaking: number;       // 0-1
}

/**
 * AI Decision
 */
export interface AIDecision {
  action: 'move' | 'pass' | 'shoot' | 'press' | 'mark' | 'position';
  target?: Vector2;
  intensity: number;          // 0-1
  urgency: number;            // 0-1
  confidence: number;         // 0-1
  reasoning: string;
  timestamp: number;
  deterministicSeed: number;  // For blockchain verification
}

/**
 * Player AI Class
 * 
 * Core AI logic for individual player decision-making
 */
export class PlayerAI {
  private role: PlayerRole;
  private difficulty: 'easy' | 'medium' | 'hard';
  private playerId: string;
  private lastDecision: AIDecision | null = null;
  private decisionHistory: AIDecision[] = [];
  
  constructor(
    playerId: string,
    role: PlayerRole,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
  ) {
    this.playerId = playerId;
    this.role = role;
    this.difficulty = difficulty;
  }

  /**
   * Main decision loop
   * Called by match engine at decision frequency (5Hz = every 200ms)
   */
  makeDecision(
    situation: GameSituation,
    weights: BehaviorWeights,
    deterministicSeed: number
  ): AIDecision {
    // 1. Assess situation
    const assessment = this.assessSituation(situation, weights);
    
    // 2. Generate role-specific decision
    const decision = this.generateRoleDecision(assessment, situation, weights, deterministicSeed);
    
    // 3. Apply difficulty modifiers
    this.applyDifficultyModifier(decision, this.difficulty);
    
    // 4. Log for verification
    this.lastDecision = decision;
    this.decisionHistory.push(decision);
    
    return decision;
  }

  /**
   * Assess game situation
   */
  private assessSituation(
    situation: GameSituation,
    weights: BehaviorWeights
  ): {
    nearBall: boolean;
    hasball: boolean;
    underPressure: boolean;
    opponentThreat: number; // 0-1
    spacingPriority: 'defensive' | 'neutral' | 'attacking';
  } {
    // Simplified assessment - in real implementation would be more complex
    const nearBall = situation.ballPosition.distance(new Vector2(0, 0)) < 20;
    const hasBall = situation.possessionTeam === 'home'; // Assume player is home team
    const underPressure = situation.pressureLevel > 0.5;
    
    const spacingPriority = situation.possessionTeam === 'home' 
      ? 'attacking' 
      : 'defensive';

    return {
      nearBall,
      hasball: hasBall,
      underPressure,
      opponentThreat: situation.pressureLevel,
      spacingPriority,
    };
  }

  /**
   * Role-specific decision methods
   */
  private generateRoleDecision(
    assessment: any,
    situation: GameSituation,
    weights: BehaviorWeights,
    seed: number
  ): AIDecision {
    switch (this.role) {
      case 'CB':
        return this.decideCB(assessment, situation, weights, seed);
      case 'FB':
        return this.decideFB(assessment, situation, weights, seed);
      case 'DM':
        return this.decideDM(assessment, situation, weights, seed);
      case 'CM':
        return this.decideCM(assessment, situation, weights, seed);
      case 'AM':
        return this.decideAM(assessment, situation, weights, seed);
      case 'Winger':
        return this.decideWinger(assessment, situation, weights, seed);
      case 'Striker':
        return this.decideStriker(assessment, situation, weights, seed);
      default:
        throw new Error(`Unknown role: ${this.role}`);
    }
  }

  /**
   * CENTER BACK DECISION TREE
   * Primary: Zone coverage, mark strikers, clear danger
   */
  private decideCB(
    assessment: any,
    situation: GameSituation,
    weights: BehaviorWeights,
    seed: number
  ): AIDecision {
    const { nearBall, hasball, underPressure, opponentThreat } = assessment;

    // If has ball: distribute / clear
    if (hasball) {
      return {
        action: 'pass',
        intensity: 0.6,
        urgency: underPressure ? 0.8 : 0.3,
        confidence: weights.positioning * weights.technique,
        reasoning: 'CB with ball: distribute safely',
        timestamp: Date.now(),
        deterministicSeed: seed,
      };
    }

    // If under pressure: clear ball
    if (underPressure && nearBall) {
      return {
        action: 'press',
        intensity: Math.min(weights.defensiveAwareness * 1.2, 1),
        urgency: 1.0,
        confidence: weights.positioning,
        reasoning: 'CB under pressure: aggressive defense',
        timestamp: Date.now(),
        deterministicSeed: seed,
      };
    }

    // Default: maintain zone position
    return {
      action: 'position',
      intensity: 0.5,
      urgency: 0.3,
      confidence: weights.positioning,
      reasoning: 'CB: maintain defensive zone',
      timestamp: Date.now(),
      deterministicSeed: seed,
    };
  }

  /**
   * FULLBACK DECISION TREE
   * Primary: Mark winger, attacking runs, defensive cover
   */
  private decideFB(
    assessment: any,
    situation: GameSituation,
    weights: BehaviorWeights,
    seed: number
  ): AIDecision {
    const { nearBall, hasball, underPressure } = assessment;

    // If has ball: attack forward
    if (hasball) {
      return {
        action: 'move',
        intensity: 0.7 + (weights.aggression * 0.3),
        urgency: 0.5,
        confidence: weights.technique,
        reasoning: 'FB with ball: advance forward',
        timestamp: Date.now(),
        deterministicSeed: seed,
      };
    }

    // If winger attacking (near ball on wing): mark
    if (nearBall && !hasball) {
      return {
        action: 'mark',
        intensity: Math.min(weights.workRate * 1.3, 1),
        urgency: 0.8,
        confidence: weights.defensiveAwareness,
        reasoning: 'FB: mark attacking winger',
        timestamp: Date.now(),
        deterministicSeed: seed,
      };
    }

    // Default: defensive positioning
    return {
      action: 'position',
      intensity: 0.6,
      urgency: 0.4,
      confidence: weights.positioning,
      reasoning: 'FB: maintain defensive position',
      timestamp: Date.now(),
      deterministicSeed: seed,
    };
  }

  /**
   * DEFENSIVE MIDFIELDER DECISION TREE
   * Primary: Shield defense, intercept, blocking
   */
  private decideDM(
    assessment: any,
    situation: GameSituation,
    weights: BehaviorWeights,
    seed: number
  ): AIDecision {
    const { nearBall, hasball, underPressure } = assessment;

    // If has ball: shield / protect
    if (hasball) {
      return {
        action: 'pass',
        intensity: 0.5,
        urgency: underPressure ? 0.7 : 0.3,
        confidence: weights.technique * weights.positioning,
        reasoning: 'DM with ball: shield and distribute',
        timestamp: Date.now(),
        deterministicSeed: seed,
      };
    }

    // If opponent attacking: intercept / block
    if (underPressure || (nearBall && !hasball)) {
      return {
        action: 'press',
        intensity: Math.min(weights.defensiveAwareness * 1.4, 1),
        urgency: 0.9,
        confidence: weights.positioning,
        reasoning: 'DM: aggressive interception',
        timestamp: Date.now(),
        deterministicSeed: seed,
      };
    }

    // Default: cover space
    return {
      action: 'position',
      intensity: 0.7,
      urgency: 0.5,
      confidence: weights.positioning,
      reasoning: 'DM: cover defensive gaps',
      timestamp: Date.now(),
      deterministicSeed: seed,
    };
  }

  /**
   * CENTRAL MIDFIELDER DECISION TREE
   * Primary: Control tempo, link defense/attack, press
   */
  private decideCM(
    assessment: any,
    situation: GameSituation,
    weights: BehaviorWeights,
    seed: number
  ): AIDecision {
    const { nearBall, hasball, spacingPriority } = assessment;

    // If has ball: advance or distribute
    if (hasball) {
      if (spacingPriority === 'attacking') {
        return {
          action: 'move',
          intensity: 0.7 + (weights.creativity * 0.3),
          urgency: 0.6,
          confidence: weights.technique,
          reasoning: 'CM: advance with ball',
          timestamp: Date.now(),
          deterministicSeed: seed,
        };
      } else {
        return {
          action: 'pass',
          intensity: 0.6,
          urgency: 0.5,
          confidence: weights.technique,
          reasoning: 'CM: controlled pass',
          timestamp: Date.now(),
          deterministicSeed: seed,
        };
      }
    }

    // If near ball: press or support
    if (nearBall) {
      return {
        action: 'press',
        intensity: weights.workRate * 0.8,
        urgency: 0.7,
        confidence: weights.positioning,
        reasoning: 'CM: contest for ball',
        timestamp: Date.now(),
        deterministicSeed: seed,
      };
    }

    // Default: positioning
    return {
      action: 'position',
      intensity: 0.6,
      urgency: 0.5,
      confidence: weights.positioning,
      reasoning: 'CM: tactical positioning',
      timestamp: Date.now(),
      deterministicSeed: seed,
    };
  }

  /**
   * ATTACKING MIDFIELDER DECISION TREE
   * Primary: Create chances, key passes, shooting
   */
  private decideAM(
    assessment: any,
    situation: GameSituation,
    weights: BehaviorWeights,
    seed: number
  ): AIDecision {
    const { nearBall, hasball } = assessment;

    // If has ball: create / shoot / pass
    if (hasball) {
      // Decision: creativity weighted
      const shootChance = weights.technique * 0.6;
      const passChance = weights.creativity * 0.7;

      if (shootChance > passChance) {
        return {
          action: 'shoot',
          intensity: 0.8,
          urgency: 0.8,
          confidence: weights.technique,
          reasoning: 'AM: shoot opportunity',
          timestamp: Date.now(),
          deterministicSeed: seed,
        };
      }

      return {
        action: 'pass',
        intensity: 0.7,
        urgency: 0.6,
        confidence: weights.creativity,
        reasoning: 'AM: create chance via pass',
        timestamp: Date.now(),
        deterministicSeed: seed,
      };
    }

    // If near ball: support striker
    if (nearBall) {
      return {
        action: 'move',
        intensity: 0.7,
        urgency: 0.6,
        confidence: weights.technique,
        reasoning: 'AM: support striker',
        timestamp: Date.now(),
        deterministicSeed: seed,
      };
    }

    // Default: support attacking
    return {
      action: 'position',
      intensity: 0.7,
      urgency: 0.5,
      confidence: weights.creativity,
      reasoning: 'AM: position for chance creation',
      timestamp: Date.now(),
      deterministicSeed: seed,
    };
  }

  /**
   * WINGER DECISION TREE
   * Primary: 1v1 vs fullback, crossing, cutting inside
   */
  private decideWinger(
    assessment: any,
    situation: GameSituation,
    weights: BehaviorWeights,
    seed: number
  ): AIDecision {
    const { nearBall, hasball, spacingPriority } = assessment;

    // If has ball: dribble / cross / cut inside
    if (hasball) {
      // Decision: aggression weighted
      if (weights.aggression > 0.6) {
        return {
          action: 'move',
          intensity: 0.85,
          urgency: 0.7,
          confidence: weights.technique,
          reasoning: 'Winger: aggressive dribble',
          timestamp: Date.now(),
          deterministicSeed: seed,
        };
      }

      return {
        action: 'pass',
        intensity: 0.7,
        urgency: 0.6,
        confidence: weights.technique,
        reasoning: 'Winger: cross or cut inside',
        timestamp: Date.now(),
        deterministicSeed: seed,
      };
    }

    // If near ball without possession: get into 1v1
    if (nearBall && spacingPriority === 'attacking') {
      return {
        action: 'move',
        intensity: 0.8,
        urgency: 0.7,
        confidence: weights.technique,
        reasoning: 'Winger: attack 1v1',
        timestamp: Date.now(),
        deterministicSeed: seed,
      };
    }

    // Default: positioning
    return {
      action: 'position',
      intensity: 0.6,
      urgency: 0.4,
      confidence: weights.positioning,
      reasoning: 'Winger: tactical positioning',
      timestamp: Date.now(),
      deterministicSeed: seed,
    };
  }

  /**
   * STRIKER DECISION TREE
   * Primary: Finish, hold play, positioning
   */
  private decideStriker(
    assessment: any,
    situation: GameSituation,
    weights: BehaviorWeights,
    seed: number
  ): AIDecision {
    const { nearBall, hasball } = assessment;

    // If has ball: shoot / hold play
    if (hasball) {
      if (weights.technique > 0.7 && nearBall) {
        return {
          action: 'shoot',
          intensity: 0.9,
          urgency: 0.9,
          confidence: weights.technique,
          reasoning: 'Striker: finish chance',
          timestamp: Date.now(),
          deterministicSeed: seed,
        };
      }

      return {
        action: 'move',
        intensity: 0.6,
        urgency: 0.5,
        confidence: weights.technique,
        reasoning: 'Striker: hold play, support',
        timestamp: Date.now(),
        deterministicSeed: seed,
      };
    }

    // If in shooting range: position for finish
    if (nearBall && !hasball) {
      return {
        action: 'move',
        intensity: 0.9,
        urgency: 0.9,
        confidence: weights.technique,
        reasoning: 'Striker: get into shooting position',
        timestamp: Date.now(),
        deterministicSeed: seed,
      };
    }

    // Default: run in behind
    return {
      action: 'move',
      intensity: 0.7,
      urgency: 0.6,
      confidence: weights.technique,
      reasoning: 'Striker: run in behind',
      timestamp: Date.now(),
      deterministicSeed: seed,
    };
  }

  /**
   * Apply difficulty modifiers
   * Easy: -20% positioning, -30% reaction time
   * Medium: normal
   * Hard: +20% positioning, +30% reaction time
   */
  private applyDifficultyModifier(
    decision: AIDecision,
    difficulty: 'easy' | 'medium' | 'hard'
  ): void {
    switch (difficulty) {
      case 'easy':
        decision.confidence *= 0.7;  // Less confident
        decision.intensity *= 0.8;   // Less intense
        break;
      case 'medium':
        // No modification
        break;
      case 'hard':
        decision.confidence = Math.min(decision.confidence * 1.3, 1);
        decision.intensity = Math.min(decision.intensity * 1.2, 1);
        break;
    }
  }

  /**
   * Get decision history for verification
   */
  getDecisionHistory(): AIDecision[] {
    return [...this.decisionHistory];
  }

  /**
   * Get last decision
   */
  getLastDecision(): AIDecision | null {
    return this.lastDecision;
  }

  /**
   * Reset history (for new match)
   */
  resetHistory(): void {
    this.decisionHistory = [];
    this.lastDecision = null;
  }

  /**
   * Generate hash of decisions for blockchain verification
   * Allows replay verification via blockhash
   */
  generateDecisionHash(): string {
    let hash = '';
    for (const decision of this.decisionHistory) {
      hash += `${decision.action}|${decision.intensity}|${decision.seed}|`;
    }
    return hash; // In real implementation: actual hash algorithm
  }
}

/**
 * Behavior Weights Factory
 * Generates role-specific base weights
 */
export function createRoleWeights(role: PlayerRole): Partial<BehaviorWeights> {
  const baseWeights = {
    roleWeight: 0.5,
    tacticalWeight: 0.3,
    situationWeight: 0.2,
  };

  switch (role) {
    case 'CB':
      return {
        ...baseWeights,
        defensiveAwareness: 0.9,
        positioning: 0.9,
        technique: 0.6,
        aggression: 0.4,
        workRate: 0.7,
        creativity: 0.3,
        riskTaking: 0.2,
      };
    case 'FB':
      return {
        ...baseWeights,
        defensiveAwareness: 0.8,
        positioning: 0.8,
        technique: 0.7,
        aggression: 0.6,
        workRate: 0.9,
        creativity: 0.4,
        riskTaking: 0.3,
      };
    case 'DM':
      return {
        ...baseWeights,
        defensiveAwareness: 0.95,
        positioning: 0.85,
        technique: 0.65,
        aggression: 0.5,
        workRate: 0.9,
        creativity: 0.35,
        riskTaking: 0.2,
      };
    case 'CM':
      return {
        ...baseWeights,
        defensiveAwareness: 0.7,
        positioning: 0.75,
        technique: 0.8,
        aggression: 0.5,
        workRate: 0.85,
        creativity: 0.7,
        riskTaking: 0.4,
      };
    case 'AM':
      return {
        ...baseWeights,
        defensiveAwareness: 0.5,
        positioning: 0.7,
        technique: 0.9,
        aggression: 0.6,
        workRate: 0.75,
        creativity: 0.9,
        riskTaking: 0.6,
      };
    case 'Winger':
      return {
        ...baseWeights,
        defensiveAwareness: 0.6,
        positioning: 0.7,
        technique: 0.85,
        aggression: 0.7,
        workRate: 0.8,
        creativity: 0.75,
        riskTaking: 0.5,
      };
    case 'Striker':
      return {
        ...baseWeights,
        defensiveAwareness: 0.4,
        positioning: 0.85,
        technique: 0.9,
        aggression: 0.8,
        workRate: 0.6,
        creativity: 0.6,
        riskTaking: 0.7,
      };
    default:
      throw new Error(`Unknown role: ${role}`);
  }
}

export default PlayerAI;
