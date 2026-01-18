/**
 * AI Squad Recommendations System
 * Provides intelligent squad composition, tactical recommendations, and player suggestions
 */

interface PlayerProfile {
  playerId: string;
  playerName: string;
  position: string;
  overall: number;
  attributes: {
    pace: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defense: number;
    physical: number;
  };
  form: number;
  fitness: number;
  morale: number;
  marketValue: number;
  rarity: string;
}

interface SquadRecommendation {
  recommendationId: string;
  timestamp: number;
  context: {
    budget: number;
    matchType: 'league' | 'cup' | 'friendly' | 'derby' | 'crucial';
    opponent?: string;
    opponentStyle?: string;
    homeAway: 'home' | 'away';
  };
  recommendedFormation: string;
  recommendedStartingXI: PlayerProfile[];
  recommendedBench: PlayerProfile[];
  tacticsSuggestion: TacticsRecommendation;
  captainSuggestion: PlayerProfile;
  viceCaptainSuggestion: PlayerProfile;
  keyStrategies: string[];
  confidenceScore: number; // 0-100
  reasoning: string;
}

interface TacticsRecommendation {
  formation: string;
  pressing: number;
  tempo: number;
  width: number;
  defensiveLineHeight: number;
  offensiveAggression: number;
  buildUpPlay: number;
  transitionSpeed: number;
  creativity: number;
  reasoning: string;
  strengths: string[];
  weaknesses: string[];
}

interface SquadAnalysis {
  analysisId: string;
  squadId: string;
  timestamp: number;
  
  overallRating: number; // 0-100
  strengths: SquadStrength[];
  weaknesses: SquadWeakness[];
  balanceScore: number; // 0-100
  chemistryScore: number; // 0-100
  formScore: number; // 0-100
  fitnessScore: number; // 0-100
  
  recommendations: {
    playersToUpgrade: PlayerProfile[];
    playersToRest: PlayerProfile[];
    potentialBuys: PlayerProfile[];
    formImprovementAreas: string[];
  };
  
  versusOpponent: {
    opponentId: string;
    matchupAnalysis: MatchupAnalysis[];
    overallMatchupScore: number;
    recommendations: string[];
  }[];
}

interface SquadStrength {
  area: string;
  rating: number;
  explanation: string;
  players: PlayerProfile[];
}

interface SquadWeakness {
  area: string;
  severity: number; // 0-100
  explanation: string;
  suggestedFix: string;
}

interface MatchupAnalysis {
  category: string;
  ourRating: number;
  opponentRating: number;
  advantage: 'us' | 'opponent' | 'neutral';
  explanation: string;
  countermeasures: string[];
}

interface PlayerSuggestion {
  suggestionId: string;
  timestamp: number;
  suggestedPlayerId: string;
  suggestedPlayerName: string;
  reason: 'form' | 'fitness' | 'tactical_fit' | 'balance' | 'upgrade';
  targetPosition: string;
  compatiblePlayers: string[];
  expectedImpact: {
    overallRating: number;
    chemistryChange: number; // -10 to +10
    formChange: number; // -5 to +5
    fitnessChange: number; // -5 to +5
  };
  priority: 'high' | 'medium' | 'low';
  explanation: string;
}

interface LineupPrediction {
  predictionId: string;
  matchId: string;
  predictedLineup: PlayerProfile[];
  predictionConfidence: number; // 0-100
  reasoning: string;
  alternativeOptions: {
    formation: string;
    players: PlayerProfile[];
    reason: string;
  }[];
}

export class AISquadRecommendationSystem {
  private static instance: AISquadRecommendationSystem;
  private playerDatabase: Map<string, PlayerProfile> = new Map();
  private recommendations: Map<string, SquadRecommendation> = new Map();
  private analyses: Map<string, SquadAnalysis> = new Map();
  private suggestions: Map<string, PlayerSuggestion> = new Map();
  private predictions: Map<string, LineupPrediction> = new Map();

  private constructor() {
    this.loadFromStorage();
    this.initializeSampleDatabase();
  }

  static getInstance(): AISquadRecommendationSystem {
    if (!AISquadRecommendationSystem.instance) {
      AISquadRecommendationSystem.instance = new AISquadRecommendationSystem();
    }
    return AISquadRecommendationSystem.instance;
  }

  /**
   * Player Database
   */
  private initializeSampleDatabase(): void {
    const positions = ['GK', 'CB', 'LB', 'RB', 'CM', 'CAM', 'CDM', 'LW', 'RW', 'ST'];
    
    positions.forEach((pos, idx) => {
      const player: PlayerProfile = {
        playerId: `player_${idx}`,
        playerName: `Sample Player ${idx + 1}`,
        position: pos,
        overall: 75 + Math.random() * 25,
        attributes: {
          pace: 70 + Math.random() * 30,
          shooting: 70 + Math.random() * 30,
          passing: 70 + Math.random() * 30,
          dribbling: 70 + Math.random() * 30,
          defense: 70 + Math.random() * 30,
          physical: 70 + Math.random() * 30,
        },
        form: 50 + Math.random() * 50,
        fitness: 80 + Math.random() * 20,
        morale: 60 + Math.random() * 40,
        marketValue: 1000000 + Math.random() * 50000000,
        rarity: Math.random() > 0.7 ? 'rare' : Math.random() > 0.4 ? 'uncommon' : 'common',
      };
      
      if (this.playerDatabase.size < 50) {
        this.playerDatabase.set(player.playerId, player);
      }
    });

    if (this.playerDatabase.size < 50) {
      this.saveToStorage();
    }
  }

  addPlayer(player: PlayerProfile): void {
    this.playerDatabase.set(player.playerId, player);
    this.saveToStorage();
  }

  getPlayer(playerId: string): PlayerProfile | null {
    return this.playerDatabase.get(playerId) || null;
  }

  getPlayersByPosition(position: string): PlayerProfile[] {
    return Array.from(this.playerDatabase.values()).filter(p => p.position === position);
  }

  /**
   * Squad Recommendations
   */
  generateSquadRecommendation(
    availablePlayers: PlayerProfile[],
    context: SquadRecommendation['context']
  ): SquadRecommendation {
    // Determine formation based on opponent and context
    const formation = this.selectFormation(context);
    
    // Get starting XI based on formation
    const { startingXI, bench } = this.selectPlayers(availablePlayers, formation);
    
    // Generate tactics recommendation
    const tacticsSuggestion = this.generateTacticsRecommendation(formation, context);
    
    // Select captain and vice-captain
    const captainSuggestion = this.selectCaptain(startingXI);
    const viceCaptainSuggestion = this.selectViceCaptain(startingXI, captainSuggestion);
    
    // Generate key strategies
    const keyStrategies = this.generateKeyStrategies(formation, context, startingXI);
    
    // Calculate confidence
    const confidenceScore = this.calculateRecommendationConfidence(
      availablePlayers,
      startingXI,
      context
    );

    const recommendation: SquadRecommendation = {
      recommendationId: `rec_${Date.now()}`,
      timestamp: Date.now(),
      context,
      recommendedFormation: formation,
      recommendedStartingXI: startingXI,
      recommendedBench: bench,
      tacticsSuggestion,
      captainSuggestion,
      viceCaptainSuggestion,
      keyStrategies,
      confidenceScore,
      reasoning: this.generateRecommendationReasoning(formation, context, availablePlayers),
    };

    this.recommendations.set(recommendation.recommendationId, recommendation);
    this.saveToStorage();
    return recommendation;
  }

  private selectFormation(context: SquadRecommendation['context']): string {
    if (context.matchType === 'crucial' || context.matchType === 'derby') {
      return '4-3-3'; // Balanced for important matches
    }
    
    if (context.homeAway === 'away') {
      return '5-3-2'; // Defensive away
    }
    
    if (context.opponentStyle === 'aggressive') {
      return '4-2-3-1'; // Defensive
    }
    
    if (context.opponentStyle === 'counter-attack') {
      return '4-3-3'; // Possession
    }

    return '4-4-2'; // Default balanced
  }

  private selectPlayers(
    players: PlayerProfile[],
    formation: string
  ): { startingXI: PlayerProfile[]; bench: PlayerProfile[] } {
    const startingXI: PlayerProfile[] = [];
    const remaining = [...players].sort((a, b) => b.overall - a.overall);

    // Get positions for formation
    const positions = this.getFormationPositions(formation);
    
    positions.forEach(pos => {
      const candidate = remaining.find(
        p => p.position === pos && !startingXI.includes(p)
      );
      if (candidate) {
        startingXI.push(candidate);
      }
    });

    // Fill bench with remaining players
    const bench = remaining.filter(p => !startingXI.includes(p)).slice(0, 7);

    return { startingXI, bench };
  }

  private getFormationPositions(formation: string): string[] {
    const formationMap: { [key: string]: string[] } = {
      '4-3-3': ['GK', 'CB', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CM', 'LW', 'RW', 'ST'],
      '4-4-2': ['GK', 'CB', 'CB', 'LB', 'RB', 'CM', 'CM', 'LW', 'RW', 'ST', 'ST'],
      '3-5-2': ['GK', 'CB', 'CB', 'CB', 'LB', 'RB', 'CM', 'CM', 'CAM', 'ST', 'ST'],
      '5-3-2': ['GK', 'CB', 'CB', 'CB', 'LB', 'RB', 'CM', 'CM', 'CAM', 'ST', 'ST'],
      '4-2-3-1': ['GK', 'CB', 'CB', 'LB', 'RB', 'CDM', 'CDM', 'CAM', 'LW', 'RW', 'ST'],
    };

    return formationMap[formation] || formationMap['4-3-3'];
  }

  private generateTacticsRecommendation(
    formation: string,
    context: SquadRecommendation['context']
  ): TacticsRecommendation {
    const baselineSliders: TacticsRecommendation = {
      formation,
      pressing: 50,
      tempo: 50,
      width: 50,
      defensiveLineHeight: 50,
      offensiveAggression: 50,
      buildUpPlay: 50,
      transitionSpeed: 50,
      creativity: 50,
      reasoning: '',
      strengths: [],
      weaknesses: [],
    };

    if (context.homeAway === 'away') {
      baselineSliders.pressing = 40;
      baselineSliders.defensiveLineHeight = 35;
      baselineSliders.offensiveAggression = 40;
    }

    if (context.matchType === 'crucial') {
      baselineSliders.defensiveLineHeight = 55;
      baselineSliders.pressing = 60;
    }

    baselineSliders.reasoning = `Tailored for ${context.matchType} match, ${context.homeAway} game`;
    baselineSliders.strengths = ['Balanced', 'Flexible'];
    baselineSliders.weaknesses = ['Can be predictable'];

    return baselineSliders;
  }

  private selectCaptain(players: PlayerProfile[]): PlayerProfile {
    return players.reduce((prev, current) => {
      const prevScore = prev.form + prev.morale;
      const currentScore = current.form + current.morale;
      return currentScore > prevScore ? current : prev;
    });
  }

  private selectViceCaptain(
    players: PlayerProfile[],
    captain: PlayerProfile
  ): PlayerProfile {
    return players
      .filter(p => p.playerId !== captain.playerId)
      .reduce((prev, current) => {
        const prevScore = prev.form + prev.morale;
        const currentScore = current.form + current.morale;
        return currentScore > prevScore ? current : prev;
      });
  }

  private generateKeyStrategies(
    formation: string,
    context: SquadRecommendation['context'],
    squad: PlayerProfile[]
  ): string[] {
    const strategies: string[] = [];

    strategies.push('Maintain defensive shape in first 15 minutes');
    strategies.push('Control midfield through possession');

    if (context.homeAway === 'away') {
      strategies.push('Hit on counter-attack');
      strategies.push('Preserve shape and avoid unnecessary risks');
    } else {
      strategies.push('Push for early goals');
    }

    if (context.matchType === 'derby') {
      strategies.push('Match intensity and aggression');
    }

    return strategies;
  }

  private calculateRecommendationConfidence(
    available: PlayerProfile[],
    selected: PlayerProfile[],
    context: SquadRecommendation['context']
  ): number {
    let confidence = 70;

    // Increase confidence with squad depth
    confidence += Math.min(available.length / 100 * 10, 10);

    // Adjust based on average form
    const avgForm = selected.reduce((sum, p) => sum + p.form, 0) / selected.length;
    confidence += (avgForm - 50) * 0.3;

    // Reduce confidence for crucial matches without full squad
    if (context.matchType === 'crucial' && available.length < 11) {
      confidence -= 15;
    }

    return Math.max(30, Math.min(100, confidence));
  }

  private generateRecommendationReasoning(
    formation: string,
    context: SquadRecommendation['context'],
    players: PlayerProfile[]
  ): string {
    return `${formation} formation selected for ${context.matchType} match (${context.homeAway}). Squad optimized for balance and tactical flexibility with average overall rating of ${(players.reduce((sum, p) => sum + p.overall, 0) / players.length).toFixed(1)}.`;
  }

  /**
   * Squad Analysis
   */
  analyzeSquad(squadId: string, players: PlayerProfile[]): SquadAnalysis {
    const strengths = this.identifyStrengths(players);
    const weaknesses = this.identifyWeaknesses(players);
    const balanceScore = this.calculateBalanceScore(players);
    const chemistryScore = this.calculateChemistryScore(players);
    const formScore = this.calculateFormScore(players);
    const fitnessScore = this.calculateFitnessScore(players);

    const analysis: SquadAnalysis = {
      analysisId: `analysis_${Date.now()}`,
      squadId,
      timestamp: Date.now(),
      overallRating: (balanceScore + chemistryScore + formScore + fitnessScore) / 4,
      strengths,
      weaknesses,
      balanceScore,
      chemistryScore,
      formScore,
      fitnessScore,
      recommendations: {
        playersToUpgrade: this.identifyUpgradeTargets(players),
        playersToRest: this.identifyPlayersToRest(players),
        potentialBuys: this.suggestNewPlayers(players),
        formImprovementAreas: this.identifyFormImprovementAreas(players),
      },
      versusOpponent: [],
    };

    this.analyses.set(analysis.analysisId, analysis);
    this.saveToStorage();
    return analysis;
  }

  private identifyStrengths(players: PlayerProfile[]): SquadStrength[] {
    const strengths: SquadStrength[] = [];

    const avgOverall = players.reduce((sum, p) => sum + p.overall, 0) / players.length;
    if (avgOverall > 80) {
      const topPlayers = players.sort((a, b) => b.overall - a.overall).slice(0, 3);
      strengths.push({
        area: 'Overall Quality',
        rating: Math.min(100, avgOverall),
        explanation: 'Squad has excellent overall rating',
        players: topPlayers,
      });
    }

    const defensivePlayers = players.filter(p => ['GK', 'CB', 'LB', 'RB'].includes(p.position));
    const avgDefense = defensivePlayers.reduce((sum, p) => sum + p.attributes.defense, 0) / defensivePlayers.length;
    if (avgDefense > 75) {
      strengths.push({
        area: 'Defense',
        rating: avgDefense,
        explanation: 'Strong defensive line with good positioning',
        players: defensivePlayers,
      });
    }

    return strengths;
  }

  private identifyWeaknesses(players: PlayerProfile[]): SquadWeakness[] {
    const weaknesses: SquadWeakness[] = [];

    const avgFitness = players.reduce((sum, p) => sum + p.fitness, 0) / players.length;
    if (avgFitness < 70) {
      weaknesses.push({
        area: 'Fitness',
        severity: 100 - avgFitness,
        explanation: 'Several players have low fitness levels',
        suggestedFix: 'Rest players and focus on recovery training',
      });
    }

    const lowFormPlayers = players.filter(p => p.form < 40);
    if (lowFormPlayers.length > 3) {
      weaknesses.push({
        area: 'Form',
        severity: 60,
        explanation: `${lowFormPlayers.length} players in poor form`,
        suggestedFix: 'Rotate squad or provide confidence-building fixtures',
      });
    }

    return weaknesses;
  }

  private calculateBalanceScore(players: PlayerProfile[]): number {
    const positions = ['GK', 'CB', 'LB', 'RB', 'CM', 'CAM', 'CDM', 'LW', 'RW', 'ST'];
    let coveredPositions = 0;

    positions.forEach(pos => {
      if (players.some(p => p.position === pos)) {
        coveredPositions++;
      }
    });

    return (coveredPositions / positions.length) * 100;
  }

  private calculateChemistryScore(players: PlayerProfile[]): number {
    // Simplified chemistry calculation based on form and morale
    const avgMorale = players.reduce((sum, p) => sum + p.morale, 0) / players.length;
    return Math.min(100, avgMorale + 20);
  }

  private calculateFormScore(players: PlayerProfile[]): number {
    return players.reduce((sum, p) => sum + p.form, 0) / players.length;
  }

  private calculateFitnessScore(players: PlayerProfile[]): number {
    return players.reduce((sum, p) => sum + p.fitness, 0) / players.length;
  }

  private identifyUpgradeTargets(players: PlayerProfile[]): PlayerProfile[] {
    return players.filter(p => p.overall < 70).sort((a, b) => a.overall - b.overall).slice(0, 3);
  }

  private identifyPlayersToRest(players: PlayerProfile[]): PlayerProfile[] {
    return players.filter(p => p.fitness < 50 || p.form < 40).slice(0, 3);
  }

  private suggestNewPlayers(players: PlayerProfile[]): PlayerProfile[] {
    const suggestions: PlayerProfile[] = [];
    const positions = ['GK', 'CB', 'LW', 'RW', 'ST'];

    positions.forEach(pos => {
      const count = players.filter(p => p.position === pos).length;
      if (count === 0) {
        suggestions.push({
          playerId: `suggested_${pos}`,
          playerName: `Top ${pos}`,
          position: pos,
          overall: 85,
          attributes: {
            pace: 85,
            shooting: 85,
            passing: 85,
            dribbling: 85,
            defense: 85,
            physical: 85,
          },
          form: 75,
          fitness: 95,
          morale: 80,
          marketValue: 5000000,
          rarity: 'rare',
        });
      }
    });

    return suggestions;
  }

  private identifyFormImprovementAreas(players: PlayerProfile[]): string[] {
    const areas: string[] = [];
    
    const lowFormCount = players.filter(p => p.form < 50).length;
    if (lowFormCount > 2) {
      areas.push('Build confidence through winning games');
    }

    const injuryRiskCount = players.filter(p => p.fitness < 60).length;
    if (injuryRiskCount > 1) {
      areas.push('Manage workload and recovery');
    }

    areas.push('Focus on team cohesion');
    return areas;
  }

  /**
   * Storage
   */
  private saveToStorage(): void {
    try {
      const data = {
        playerDatabase: Array.from(this.playerDatabase.entries()),
        recommendations: Array.from(this.recommendations.entries()),
        analyses: Array.from(this.analyses.entries()),
        suggestions: Array.from(this.suggestions.entries()),
        predictions: Array.from(this.predictions.entries()),
      };
      localStorage['ai_squad_recommendation_system'] = JSON.stringify(data);
    } catch (error) {
      console.error('Failed to save squad recommendation system:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = JSON.parse(localStorage['ai_squad_recommendation_system'] || '{}');
      if (data.playerDatabase) this.playerDatabase = new Map(data.playerDatabase);
      if (data.recommendations) this.recommendations = new Map(data.recommendations);
      if (data.analyses) this.analyses = new Map(data.analyses);
      if (data.suggestions) this.suggestions = new Map(data.suggestions);
      if (data.predictions) this.predictions = new Map(data.predictions);
    } catch (error) {
      console.error('Failed to load squad recommendation system:', error);
    }
  }

  getRecommendation(recommendationId: string): SquadRecommendation | null {
    return this.recommendations.get(recommendationId) || null;
  }

  getAnalysis(analysisId: string): SquadAnalysis | null {
    return this.analyses.get(analysisId) || null;
  }
}

export type {
  PlayerProfile,
  SquadRecommendation,
  TacticsRecommendation,
  SquadAnalysis,
  SquadStrength,
  SquadWeakness,
  MatchupAnalysis,
  PlayerSuggestion,
  LineupPrediction,
};
