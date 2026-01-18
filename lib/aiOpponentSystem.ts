/**
 * AI Opponent System
 * Manages AI-driven opponent behavior, decision-making, and adaptation
 */

interface AIProfile {
  profileId: string;
  name: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'legendary';
  style: 'aggressive' | 'balanced' | 'defensive' | 'possession' | 'counter-attack';
  personality: {
    aggression: number; // 0-100
    intelligence: number; // 0-100
    adaptability: number; // 0-100
    riskTaking: number; // 0-100
    consistency: number; // 0-100
  };
  preferredFormation: string;
  playingStyle: TacticalProfile;
  weaknesses: string[];
  strengths: string[];
  createdAt: number;
}

interface TacticalProfile {
  pressing: number;
  tempo: number;
  width: number;
  defensiveLineHeight: number;
  offensiveAggression: number;
  buildUpPlay: number;
  transitionSpeed: number;
  creativity: number;
}

interface AIDecision {
  decisionId: string;
  matchId: string;
  gameMinute: number;
  type: 'pass_direction' | 'shot_attempt' | 'tackle' | 'substitution' | 'tactical_change' | 'positioning';
  context: {
    playerPosition: { x: number; y: number };
    ballPosition: { x: number; y: number };
    nearbyOpponents: number;
    nearbyTeammates: number;
    stamina: number;
    form: number; // 0-100
  };
  options: AIOption[];
  chosenOption: AIOption;
  successProbability: number;
  actualOutcome: 'success' | 'partial' | 'failure';
  timestamp: number;
}

interface AIOption {
  optionId: string;
  type: string;
  description: string;
  successChance: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  expectedValue: number; // -100 to +100
  weight: number; // Decision weight
}

interface MatchAdaptation {
  adaptationId: string;
  matchId: string;
  gameMinute: number;
  trigger: 'losing' | 'winning' | 'pressure' | 'possession' | 'injury' | 'tactical_counter';
  previousTactics: TacticalProfile;
  newTactics: TacticalProfile;
  reason: string;
  effectiveness: number; // -100 to +100
  timestamp: number;
}

interface AIPerformance {
  performanceId: string;
  aiProfileId: string;
  matchId: string;
  
  decisionAccuracy: number; // % correct decisions
  adaptationEffectiveness: number; // How well AI adapted
  tacticalRating: number; // 0-100
  executionRating: number; // 0-100
  
  decisions: AIDecision[];
  adaptations: MatchAdaptation[];
  
  goalsScored: number;
  goalsConceded: number;
  possession: number;
  shotsOnTarget: number;
  
  timestamp: number;
}

interface OpponentBehavior {
  behaviorId: string;
  matchId: string;
  opponentTeamId: string;
  
  currentFocus: 'defense' | 'balance' | 'attack' | 'possession' | 'counter';
  pressureLevel: number; // 0-100
  riskLevel: number; // 0-100
  
  // Player-specific behaviors
  playerBehaviors: Map<string, PlayerBehaviorProfile>;
  
  lastAdaptation: number;
  adaptationFrequency: number; // How often AI adapts (ms)
  
  timestamp: number;
}

interface PlayerBehaviorProfile {
  playerId: string;
  playerName: string;
  role: 'defender' | 'midfielder' | 'forward';
  
  positioningTendency: { x: number; y: number }; // Field position bias
  passingStyle: 'risky' | 'balanced' | 'safe';
  defenseAggression: number; // 0-100
  offensiveContribution: number; // 0-100
  workRate: number; // 0-100
  
  currentForm: number; // 0-100
  fatigue: number; // 0-100
  confidence: number; // 0-100
}

export class AIOpponentSystem {
  private static instance: AIOpponentSystem;
  private aiProfiles: Map<string, AIProfile> = new Map();
  private decisions: Map<string, AIDecision> = new Map();
  private matchAdaptations: Map<string, MatchAdaptation> = new Map();
  private performances: Map<string, AIPerformance> = new Map();
  private opponentBehaviors: Map<string, OpponentBehavior> = new Map();

  private constructor() {
    this.loadFromStorage();
    this.initializeDefaultProfiles();
  }

  static getInstance(): AIOpponentSystem {
    if (!AIOpponentSystem.instance) {
      AIOpponentSystem.instance = new AIOpponentSystem();
    }
    return AIOpponentSystem.instance;
  }

  /**
   * AI Profile Management
   */
  private initializeDefaultProfiles(): void {
    const profiles: AIProfile[] = [
      {
        profileId: 'ai_beginner',
        name: 'Rookie',
        difficulty: 'beginner',
        style: 'balanced',
        personality: {
          aggression: 40,
          intelligence: 40,
          adaptability: 30,
          riskTaking: 20,
          consistency: 60,
        },
        preferredFormation: '4-4-2',
        playingStyle: {
          pressing: 35,
          tempo: 40,
          width: 50,
          defensiveLineHeight: 40,
          offensiveAggression: 40,
          buildUpPlay: 40,
          transitionSpeed: 50,
          creativity: 30,
        },
        weaknesses: ['Adapts slowly', 'Predictable', 'Struggles under pressure'],
        strengths: ['Consistent', 'Defensive', 'Simple tactics'],
        createdAt: Date.now(),
      },
      {
        profileId: 'ai_intermediate',
        name: 'Challenger',
        difficulty: 'intermediate',
        style: 'balanced',
        personality: {
          aggression: 55,
          intelligence: 60,
          adaptability: 60,
          riskTaking: 50,
          consistency: 70,
        },
        preferredFormation: '4-3-3',
        playingStyle: {
          pressing: 50,
          tempo: 55,
          width: 60,
          defensiveLineHeight: 50,
          offensiveAggression: 55,
          buildUpPlay: 60,
          transitionSpeed: 60,
          creativity: 50,
        },
        weaknesses: ['Limited tactical variety', 'Occasional errors'],
        strengths: ['Good adaptability', 'Balanced play', 'Decent decision-making'],
        createdAt: Date.now(),
      },
      {
        profileId: 'ai_advanced',
        name: 'Professional',
        difficulty: 'advanced',
        style: 'possession',
        personality: {
          aggression: 70,
          intelligence: 80,
          adaptability: 80,
          riskTaking: 65,
          consistency: 80,
        },
        preferredFormation: '4-3-3',
        playingStyle: {
          pressing: 65,
          tempo: 70,
          width: 70,
          defensiveLineHeight: 65,
          offensiveAggression: 70,
          buildUpPlay: 85,
          transitionSpeed: 70,
          creativity: 70,
        },
        weaknesses: ['Occasionally overcommits', 'Can be read'],
        strengths: ['Excellent tackling', 'Smart positioning', 'Quick adaptation'],
        createdAt: Date.now(),
      },
      {
        profileId: 'ai_expert',
        name: 'Champion',
        difficulty: 'expert',
        style: 'possession',
        personality: {
          aggression: 75,
          intelligence: 90,
          adaptability: 90,
          riskTaking: 70,
          consistency: 85,
        },
        preferredFormation: '3-5-2',
        playingStyle: {
          pressing: 75,
          tempo: 80,
          width: 80,
          defensiveLineHeight: 75,
          offensiveAggression: 80,
          buildUpPlay: 90,
          transitionSpeed: 80,
          creativity: 80,
        },
        weaknesses: ['Rare weaknesses', 'Occasionally risky'],
        strengths: ['World-class decision making', 'Exceptional adaptability', 'Superior timing'],
        createdAt: Date.now(),
      },
      {
        profileId: 'ai_legendary',
        name: 'Legend',
        difficulty: 'legendary',
        style: 'counter-attack',
        personality: {
          aggression: 85,
          intelligence: 98,
          adaptability: 95,
          riskTaking: 75,
          consistency: 95,
        },
        preferredFormation: '3-5-2',
        playingStyle: {
          pressing: 80,
          tempo: 90,
          width: 85,
          defensiveLineHeight: 80,
          offensiveAggression: 90,
          buildUpPlay: 95,
          transitionSpeed: 95,
          creativity: 90,
        },
        weaknesses: ['Almost none'],
        strengths: ['Perfect decision making', 'Supernatural adaptability', 'Elite execution'],
        createdAt: Date.now(),
      },
    ];

    profiles.forEach(p => this.aiProfiles.set(p.profileId, p));
    this.saveToStorage();
  }

  getAIProfile(profileId: string): AIProfile | null {
    return this.aiProfiles.get(profileId) || null;
  }

  getAllAIProfiles(): AIProfile[] {
    return Array.from(this.aiProfiles.values());
  }

  getAIProfilesByDifficulty(difficulty: string): AIProfile[] {
    return Array.from(this.aiProfiles.values()).filter(p => p.difficulty === difficulty);
  }

  /**
   * Decision Making
   */
  makeAIDecision(
    matchId: string,
    aiProfileId: string,
    decisionType: AIDecision['type'],
    context: AIDecision['context'],
    options: AIOption[]
  ): AIDecision {
    const profile = this.getAIProfile(aiProfileId);
    if (!profile) throw new Error('AI Profile not found');

    // Adjust option weights based on AI profile personality
    const weightedOptions = options.map(option => ({
      ...option,
      weight: this.calculateOptionWeight(option, profile, context),
    }));

    // Choose option based on weights (weighted random for variety)
    const totalWeight = weightedOptions.reduce((sum, opt) => sum + opt.weight, 0);
    let random = Math.random() * totalWeight;
    let chosenOption = weightedOptions[0];

    for (const option of weightedOptions) {
      random -= option.weight;
      if (random <= 0) {
        chosenOption = option;
        break;
      }
    }

    const decision: AIDecision = {
      decisionId: `decision_${Date.now()}`,
      matchId,
      gameMinute: context.playerPosition.x, // Placeholder
      type: decisionType,
      context,
      options,
      chosenOption,
      successProbability: chosenOption.successChance,
      actualOutcome: 'success', // Will be updated after action
      timestamp: Date.now(),
    };

    this.decisions.set(decision.decisionId, decision);
    this.saveToStorage();
    return decision;
  }

  private calculateOptionWeight(option: AIOption, profile: AIProfile, context: any): number {
    let weight = option.weight;

    // Adjust based on AI personality
    if (option.riskLevel === 'high') {
      weight *= (profile.personality.riskTaking / 50); // Scale 0.4 to 2.0
    } else if (option.riskLevel === 'low') {
      weight *= (1 - profile.personality.riskTaking / 200); // Scale 0.75 to 1.0
    }

    // Adjust based on confidence
    weight *= (0.8 + (context.form / 500)); // 0.8 to 1.2

    // Adjust based on stamina
    if (context.stamina < 30) {
      weight *= 0.7; // Tired players make safer choices
    }

    return weight;
  }

  recordDecisionOutcome(decisionId: string, outcome: 'success' | 'partial' | 'failure'): void {
    const decision = this.decisions.get(decisionId);
    if (decision) {
      decision.actualOutcome = outcome;
      this.saveToStorage();
    }
  }

  /**
   * Match Adaptation
   */
  evaluateAndAdapt(
    matchId: string,
    opponentTeamId: string,
    gameMinute: number,
    currentStats: {
      goalsScored: number;
      goalsConceded: number;
      possession: number;
      pressure: number;
    }
  ): MatchAdaptation | null {
    const behavior = this.opponentBehaviors.get(matchId + '_' + opponentTeamId);
    if (!behavior) return null;

    // Determine if adaptation is needed
    let trigger: MatchAdaptation['trigger'] | null = null;
    let reason = '';

    if (currentStats.goalsScored < currentStats.goalsConceded) {
      trigger = 'losing';
      reason = 'Team is losing, increasing aggression';
    } else if (currentStats.goalsScored > currentStats.goalsConceded) {
      trigger = 'winning';
      reason = 'Team is winning, defending lead';
    } else if (currentStats.pressure > 70) {
      trigger = 'pressure';
      reason = 'Under heavy pressure, defensive adjustment';
    } else if (currentStats.possession > 65) {
      trigger = 'possession';
      reason = 'High possession, counter-attack setup';
    }

    if (!trigger) return null;

    // Calculate new tactics based on trigger
    const newTactics = this.calculateAdaptedTactics(behavior, trigger);

    const adaptation: MatchAdaptation = {
      adaptationId: `adapt_${Date.now()}`,
      matchId,
      gameMinute,
      trigger,
      previousTactics: behavior.playerBehaviors.size > 0 ? this.extractCurrentTactics(behavior) : { pressing: 50, tempo: 50, width: 50, defensiveLineHeight: 50, offensiveAggression: 50, buildUpPlay: 50, transitionSpeed: 50, creativity: 50 },
      newTactics,
      reason,
      effectiveness: 0, // Will be updated after evaluation
      timestamp: Date.now(),
    };

    this.matchAdaptations.set(adaptation.adaptationId, adaptation);
    behavior.lastAdaptation = Date.now();
    this.saveToStorage();
    return adaptation;
  }

  private calculateAdaptedTactics(behavior: OpponentBehavior, trigger: string): TacticalProfile {
    const current = this.extractCurrentTactics(behavior);

    switch (trigger) {
      case 'losing':
        return {
          ...current,
          pressing: Math.min(100, current.pressing + 15),
          offensiveAggression: Math.min(100, current.offensiveAggression + 20),
          defensiveLineHeight: Math.min(100, current.defensiveLineHeight + 10),
          creativity: Math.min(100, current.creativity + 15),
        };
      case 'winning':
        return {
          ...current,
          pressing: Math.max(0, current.pressing - 10),
          defensiveLineHeight: Math.max(0, current.defensiveLineHeight - 15),
          offensiveAggression: Math.max(0, current.offensiveAggression - 10),
        };
      case 'pressure':
        return {
          ...current,
          defensiveLineHeight: Math.max(0, current.defensiveLineHeight - 20),
          pressing: Math.max(0, current.pressing - 15),
          buildUpPlay: Math.min(100, current.buildUpPlay + 15),
        };
      case 'possession':
        return {
          ...current,
          transitionSpeed: Math.min(100, current.transitionSpeed + 25),
          creativity: Math.max(0, current.creativity - 10),
          tempo: Math.min(100, current.tempo + 15),
        };
      default:
        return current;
    }
  }

  private extractCurrentTactics(behavior: OpponentBehavior): TacticalProfile {
    return {
      pressing: behavior.pressureLevel,
      tempo: 50,
      width: 50,
      defensiveLineHeight: 50,
      offensiveAggression: behavior.riskLevel,
      buildUpPlay: 50,
      transitionSpeed: 50,
      creativity: 50,
    };
  }

  /**
   * Opponent Behavior
   */
  initializeOpponentBehavior(
    matchId: string,
    opponentTeamId: string,
    aiProfileId: string,
    players: string[]
  ): OpponentBehavior {
    const profile = this.getAIProfile(aiProfileId);
    if (!profile) throw new Error('AI Profile not found');

    const playerBehaviors = new Map<string, PlayerBehaviorProfile>();
    players.forEach((playerId, idx) => {
      const role = idx < 4 ? 'defender' : idx < 8 ? 'midfielder' : 'forward';
      playerBehaviors.set(playerId, {
        playerId,
        playerName: `Player ${idx + 1}`,
        role,
        positioningTendency: { x: 50 + Math.random() * 20 - 10, y: 50 + Math.random() * 20 - 10 },
        passingStyle: profile.personality.riskTaking > 70 ? 'risky' : profile.personality.riskTaking > 40 ? 'balanced' : 'safe',
        defenseAggression: profile.personality.aggression,
        offensiveContribution: profile.personality.aggression,
        workRate: 80 + Math.random() * 20,
        currentForm: 75 + Math.random() * 25,
        fatigue: 0,
        confidence: 70 + Math.random() * 30,
      });
    });

    const behavior: OpponentBehavior = {
      behaviorId: `behavior_${matchId}_${opponentTeamId}`,
      matchId,
      opponentTeamId,
      currentFocus: profile.style === 'aggressive' ? 'attack' : profile.style === 'defensive' ? 'defense' : 'balance',
      pressureLevel: profile.personality.aggression,
      riskLevel: profile.personality.riskTaking,
      playerBehaviors,
      lastAdaptation: Date.now(),
      adaptationFrequency: 5 * 60 * 1000, // Every 5 minutes
      timestamp: Date.now(),
    };

    this.opponentBehaviors.set(matchId + '_' + opponentTeamId, behavior);
    this.saveToStorage();
    return behavior;
  }

  getOpponentBehavior(matchId: string, opponentTeamId: string): OpponentBehavior | null {
    return this.opponentBehaviors.get(matchId + '_' + opponentTeamId) || null;
  }

  /**
   * Performance Tracking
   */
  createPerformanceRecord(
    aiProfileId: string,
    matchId: string
  ): AIPerformance {
    const performance: AIPerformance = {
      performanceId: `perf_${matchId}_${aiProfileId}`,
      aiProfileId,
      matchId,
      decisionAccuracy: 0,
      adaptationEffectiveness: 0,
      tacticalRating: 0,
      executionRating: 0,
      decisions: [],
      adaptations: [],
      goalsScored: 0,
      goalsConceded: 0,
      possession: 0,
      shotsOnTarget: 0,
      timestamp: Date.now(),
    };

    this.performances.set(performance.performanceId, performance);
    this.saveToStorage();
    return performance;
  }

  updatePerformanceRecord(
    performanceId: string,
    updates: Partial<AIPerformance>
  ): void {
    const performance = this.performances.get(performanceId);
    if (performance) {
      Object.assign(performance, updates);
      this.saveToStorage();
    }
  }

  getPerformanceRecord(performanceId: string): AIPerformance | null {
    return this.performances.get(performanceId) || null;
  }

  /**
   * Storage
   */
  private saveToStorage(): void {
    try {
      const data = {
        aiProfiles: Array.from(this.aiProfiles.entries()),
        decisions: Array.from(this.decisions.entries()),
        matchAdaptations: Array.from(this.matchAdaptations.entries()),
        performances: Array.from(this.performances.entries()),
        opponentBehaviors: Array.from(this.opponentBehaviors.entries()),
      };
      localStorage['ai_opponent_system'] = JSON.stringify(data);
    } catch (error) {
      console.error('Failed to save AI opponent system:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = JSON.parse(localStorage['ai_opponent_system'] || '{}');
      if (data.aiProfiles) this.aiProfiles = new Map(data.aiProfiles);
      if (data.decisions) this.decisions = new Map(data.decisions);
      if (data.matchAdaptations) this.matchAdaptations = new Map(data.matchAdaptations);
      if (data.performances) this.performances = new Map(data.performances);
      if (data.opponentBehaviors) this.opponentBehaviors = new Map(data.opponentBehaviors);
    } catch (error) {
      console.error('Failed to load AI opponent system:', error);
    }
  }
}

export type {
  AIProfile,
  TacticalProfile,
  AIDecision,
  AIOption,
  MatchAdaptation,
  AIPerformance,
  OpponentBehavior,
  PlayerBehaviorProfile,
};
