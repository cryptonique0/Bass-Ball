/**
 * Gameplay Dynamics System
 * Manages dynamic weather, player injuries, and live substitutions
 */

interface WeatherCondition {
  weatherId: string;
  type: 'clear' | 'rainy' | 'snowy' | 'foggy' | 'windy' | 'stormy' | 'extreme';
  intensity: number; // 0-100
  temperature: number; // Celsius
  windSpeed: number; // km/h
  rainfall: number; // mm/hour
  visibility: number; // 0-100%
  duration: number; // milliseconds
  timestamp: number;
  
  // Effects on gameplay
  effectMultipliers: {
    passAccuracy: number;
    shootingAccuracy: number;
    ballControl: number;
    playerSpeed: number;
    tackleStrength: number;
    staminaDrain: number;
  };
}

interface PlayerInjury {
  injuryId: string;
  playerId: string;
  playerName: string;
  type: 'strain' | 'sprain' | 'fracture' | 'concussion' | 'cut' | 'muscle_tear' | 'ligament';
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  location: string; // 'head' | 'left_leg' | 'right_leg' | 'left_arm' | 'right_arm' | 'torso'
  causedBy?: string; // playerId who caused it
  recoveryTime: number; // milliseconds until healed
  recoveredAt?: number;
  status: 'active' | 'recovering' | 'healed';
  gamesDissed: number;
  timestamp: number;
  
  // Performance impact
  performanceImpact: {
    speed: number; // -5 to -50%
    acceleration: number; // -5 to -50%
    stamina: number; // -5 to -50%
    shooting: number; // -5 to -50%
    passing: number; // -5 to -50%
    dribbling: number; // -5 to -50%
    defense: number; // -5 to -50%
  };
}

interface PlayerSubstitution {
  substitutionId: string;
  matchId: string;
  playerOut: {
    playerId: string;
    playerName: string;
    position: string;
  };
  playerIn: {
    playerId: string;
    playerName: string;
    position: string;
  };
  time: number; // Game minute
  reason: 'injury' | 'tactics' | 'fatigue' | 'performance';
  teamId: string;
  teamName: string;
  timestamp: number;
}

interface SubstitutionSlot {
  slotId: string;
  matchId: string;
  teamId: string;
  bench: BenchPlayer[];
  usedSubstitutions: number;
  maxSubstitutions: number; // Usually 3-5
  autoSubOnInjury: boolean;
  preferredPositions: Map<string, string[]>; // Position -> compatible positions
}

interface BenchPlayer {
  playerId: string;
  playerName: string;
  position: string;
  availability: 'available' | 'injured' | 'suspended' | 'tired';
  readiness: number; // 0-100
  freshness: number; // 0-100
}

interface MatchConditions {
  conditionsId: string;
  matchId: string;
  homeTeamId: string;
  awayTeamId: string;
  weather: WeatherCondition;
  injuries: Map<string, PlayerInjury>; // playerId -> PlayerInjury
  substitutions: PlayerSubstitution[];
  pitchCondition: 'perfect' | 'good' | 'wet' | 'muddy' | 'icy';
  crowd: number; // Attendance/crowd noise impact 0-100
  timestamp: number;
}

export class GameplayDynamicsManager {
  private static instance: GameplayDynamicsManager;
  private matchConditions: Map<string, MatchConditions> = new Map();
  private playerInjuries: Map<string, PlayerInjury> = new Map();
  private substitutionSlots: Map<string, SubstitutionSlot> = new Map();
  private weatherPatterns: Map<string, WeatherCondition> = new Map();

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): GameplayDynamicsManager {
    if (!GameplayDynamicsManager.instance) {
      GameplayDynamicsManager.instance = new GameplayDynamicsManager();
    }
    return GameplayDynamicsManager.instance;
  }

  /**
   * Weather Management
   */
  generateWeather(
    type?: 'clear' | 'rainy' | 'snowy' | 'foggy' | 'windy' | 'stormy' | 'extreme',
    intensity?: number
  ): WeatherCondition {
    const weatherType = type || this.randomWeatherType();
    const intensityValue = intensity ?? Math.random() * 100;

    const weather: WeatherCondition = {
      weatherId: `weather_${Date.now()}`,
      type: weatherType,
      intensity: intensityValue,
      temperature: 5 + Math.random() * 25, // 5-30°C
      windSpeed: Math.random() * 50, // 0-50 km/h
      rainfall: weatherType === 'rainy' || weatherType === 'stormy' ? Math.random() * 20 : 0,
      visibility: this.calculateVisibility(weatherType, intensityValue),
      duration: 45 * 60 * 1000, // 45 minutes
      timestamp: Date.now(),
      effectMultipliers: this.calculateWeatherEffects(weatherType, intensityValue),
    };

    this.weatherPatterns.set(weather.weatherId, weather);
    this.saveToStorage();
    return weather;
  }

  private randomWeatherType(): WeatherCondition['type'] {
    const types: WeatherCondition['type'][] = ['clear', 'rainy', 'snowy', 'foggy', 'windy', 'stormy'];
    return types[Math.floor(Math.random() * types.length)];
  }

  private calculateVisibility(type: string, intensity: number): number {
    switch (type) {
      case 'foggy':
        return Math.max(30, 100 - intensity * 0.8);
      case 'stormy':
        return Math.max(40, 100 - intensity * 0.6);
      case 'snowy':
        return Math.max(50, 100 - intensity * 0.5);
      default:
        return 100;
    }
  }

  private calculateWeatherEffects(type: string, intensity: number): WeatherCondition['effectMultipliers'] {
    const intensityFactor = intensity / 100;

    let base = {
      passAccuracy: 1.0,
      shootingAccuracy: 1.0,
      ballControl: 1.0,
      playerSpeed: 1.0,
      tackleStrength: 1.0,
      staminaDrain: 1.0,
    };

    switch (type) {
      case 'rainy':
        base = {
          passAccuracy: 1 - intensityFactor * 0.15,
          shootingAccuracy: 1 - intensityFactor * 0.2,
          ballControl: 1 - intensityFactor * 0.1,
          playerSpeed: 0.95,
          tackleStrength: 1.05,
          staminaDrain: 1.15,
        };
        break;
      case 'snowy':
        base = {
          passAccuracy: 1 - intensityFactor * 0.25,
          shootingAccuracy: 1 - intensityFactor * 0.3,
          ballControl: 1 - intensityFactor * 0.2,
          playerSpeed: 0.85,
          tackleStrength: 1.1,
          staminaDrain: 1.25,
        };
        break;
      case 'foggy':
        base = {
          passAccuracy: 1 - intensityFactor * 0.12,
          shootingAccuracy: 1 - intensityFactor * 0.18,
          ballControl: 1.0,
          playerSpeed: 0.98,
          tackleStrength: 1.0,
          staminaDrain: 1.08,
        };
        break;
      case 'windy':
        base = {
          passAccuracy: 1 - intensityFactor * 0.1,
          shootingAccuracy: 1 - intensityFactor * 0.25,
          ballControl: 1.02,
          playerSpeed: 1.0,
          tackleStrength: 1.0,
          staminaDrain: 1.05,
        };
        break;
      case 'stormy':
        base = {
          passAccuracy: 1 - intensityFactor * 0.3,
          shootingAccuracy: 1 - intensityFactor * 0.4,
          ballControl: 1 - intensityFactor * 0.15,
          playerSpeed: 0.9,
          tackleStrength: 1.15,
          staminaDrain: 1.3,
        };
        break;
    }

    return base;
  }

  getCurrentWeather(matchId: string): WeatherCondition | null {
    const conditions = this.matchConditions.get(matchId);
    return conditions?.weather || null;
  }

  /**
   * Injury Management
   */
  recordInjury(
    playerId: string,
    playerName: string,
    type: PlayerInjury['type'],
    severity: PlayerInjury['severity'],
    location: string,
    causedBy?: string
  ): PlayerInjury {
    const recoveryTimes = {
      minor: 7 * 24 * 60 * 60 * 1000, // 7 days
      moderate: 14 * 24 * 60 * 60 * 1000, // 14 days
      severe: 30 * 24 * 60 * 60 * 1000, // 30 days
      critical: 90 * 24 * 60 * 60 * 1000, // 90 days
    };

    const performanceMap = {
      minor: 0.05,
      moderate: 0.15,
      severe: 0.35,
      critical: 0.5,
    };

    const impact = performanceMap[severity];

    const injury: PlayerInjury = {
      injuryId: `injury_${Date.now()}`,
      playerId,
      playerName,
      type,
      severity,
      location,
      causedBy,
      recoveryTime: recoveryTimes[severity],
      status: 'active',
      gamesDissed: 0,
      timestamp: Date.now(),
      performanceImpact: {
        speed: -Math.random() * impact * 100,
        acceleration: -Math.random() * impact * 100,
        stamina: -Math.random() * impact * 100,
        shooting: -Math.random() * impact * 100,
        passing: -Math.random() * impact * 100,
        dribbling: -Math.random() * impact * 100,
        defense: -Math.random() * impact * 100,
      },
    };

    this.playerInjuries.set(injury.injuryId, injury);
    this.saveToStorage();
    return injury;
  }

  getPlayerInjury(playerId: string): PlayerInjury | null {
    for (const injury of this.playerInjuries.values()) {
      if (injury.playerId === playerId && injury.status === 'active') {
        return injury;
      }
    }
    return null;
  }

  healInjury(injuryId: string): void {
    const injury = this.playerInjuries.get(injuryId);
    if (injury) {
      injury.status = 'healed';
      injury.recoveredAt = Date.now();
      this.saveToStorage();
    }
  }

  updateInjuryRecovery(): void {
    const now = Date.now();
    for (const injury of this.playerInjuries.values()) {
      if (injury.status === 'active') {
        const timeRemaining = injury.recoveryTime - (now - injury.timestamp);
        if (timeRemaining <= 0) {
          injury.status = 'healed';
          injury.recoveredAt = now;
        } else if (injury.status === 'recovering') {
          injury.status = 'recovering';
        }
      }
    }
    this.saveToStorage();
  }

  getPlayerPerformanceImpact(playerId: string): Record<string, number> {
    const injury = this.getPlayerInjury(playerId);
    if (!injury) {
      return {
        speed: 0,
        acceleration: 0,
        stamina: 0,
        shooting: 0,
        passing: 0,
        dribbling: 0,
        defense: 0,
      };
    }
    return injury.performanceImpact;
  }

  getAllActiveInjuries(): PlayerInjury[] {
    return Array.from(this.playerInjuries.values()).filter(i => i.status === 'active');
  }

  /**
   * Substitution Management
   */
  createSubstitutionSlot(
    matchId: string,
    teamId: string,
    startingXI: string[],
    bench: BenchPlayer[],
    maxSubstitutions: number = 3
  ): SubstitutionSlot {
    const slot: SubstitutionSlot = {
      slotId: `sub_${matchId}_${teamId}`,
      matchId,
      teamId,
      bench,
      usedSubstitutions: 0,
      maxSubstitutions,
      autoSubOnInjury: true,
      preferredPositions: new Map([
        ['GK', ['GK']],
        ['CB', ['CB', 'LB', 'RB']],
        ['LB', ['LB', 'CB', 'LWB']],
        ['RB', ['RB', 'CB', 'RWB']],
        ['CDM', ['CDM', 'CM', 'CB']],
        ['CM', ['CM', 'CDM', 'CAM']],
        ['CAM', ['CAM', 'CM', 'LW', 'RW']],
        ['LW', ['LW', 'CAM', 'ST']],
        ['RW', ['RW', 'CAM', 'ST']],
        ['ST', ['ST', 'LW', 'RW', 'CAM']],
      ]),
    };

    this.substitutionSlots.set(slot.slotId, slot);
    this.saveToStorage();
    return slot;
  }

  performSubstitution(
    matchId: string,
    teamId: string,
    playerOutId: string,
    playerOutName: string,
    playerOutPosition: string,
    playerInId: string,
    playerInName: string,
    playerInPosition: string,
    reason: 'injury' | 'tactics' | 'fatigue' | 'performance',
    gameMinute: number
  ): PlayerSubstitution | null {
    const slot = this.substitutionSlots.get(`sub_${matchId}_${teamId}`);
    if (!slot) return null;

    if (slot.usedSubstitutions >= slot.maxSubstitutions) {
      console.warn('Maximum substitutions reached');
      return null;
    }

    const substitution: PlayerSubstitution = {
      substitutionId: `sub_${matchId}_${Date.now()}`,
      matchId,
      playerOut: {
        playerId: playerOutId,
        playerName: playerOutName,
        position: playerOutPosition,
      },
      playerIn: {
        playerId: playerInId,
        playerName: playerInName,
        position: playerInPosition,
      },
      time: gameMinute,
      reason,
      teamId,
      teamName: '',
      timestamp: Date.now(),
    };

    slot.usedSubstitutions++;
    slot.bench = slot.bench.filter(p => p.playerId !== playerInId);

    const conditions = this.matchConditions.get(matchId);
    if (conditions) {
      conditions.substitutions.push(substitution);
    }

    this.saveToStorage();
    return substitution;
  }

  getSubstitutionSlot(matchId: string, teamId: string): SubstitutionSlot | null {
    return this.substitutionSlots.get(`sub_${matchId}_${teamId}`) || null;
  }

  getAvailableSubstitutes(matchId: string, teamId: string, position?: string): BenchPlayer[] {
    const slot = this.getSubstitutionSlot(matchId, teamId);
    if (!slot) return [];

    let available = slot.bench.filter(p => p.availability === 'available');

    if (position) {
      const compatible = slot.preferredPositions.get(position) || [position];
      available = available.filter(p => compatible.includes(p.position));
    }

    return available.sort((a, b) => b.readiness - a.readiness);
  }

  getSubstitutionHistory(matchId: string): PlayerSubstitution[] {
    const conditions = this.matchConditions.get(matchId);
    return conditions?.substitutions || [];
  }

  /**
   * Match Conditions
   */
  initializeMatchConditions(
    matchId: string,
    homeTeamId: string,
    awayTeamId: string,
    weather: WeatherCondition
  ): MatchConditions {
    const conditions: MatchConditions = {
      conditionsId: `conditions_${matchId}`,
      matchId,
      homeTeamId,
      awayTeamId,
      weather,
      injuries: new Map(),
      substitutions: [],
      pitchCondition: weather.rainfall > 10 ? 'wet' : 'good',
      crowd: 50 + Math.random() * 50, // 50-100
      timestamp: Date.now(),
    };

    this.matchConditions.set(matchId, conditions);
    this.saveToStorage();
    return conditions;
  }

  getMatchConditions(matchId: string): MatchConditions | null {
    return this.matchConditions.get(matchId) || null;
  }

  updatePitchCondition(matchId: string, condition: 'perfect' | 'good' | 'wet' | 'muddy' | 'icy'): void {
    const conditions = this.matchConditions.get(matchId);
    if (conditions) {
      conditions.pitchCondition = condition;
      this.saveToStorage();
    }
  }

  getGameplayMultipliers(matchId: string): Record<string, number> {
    const conditions = this.getMatchConditions(matchId);
    if (!conditions) {
      return {
        passAccuracy: 1,
        shootingAccuracy: 1,
        ballControl: 1,
        playerSpeed: 1,
        tackleStrength: 1,
        staminaDrain: 1,
      };
    }

    // Combine weather effects with pitch condition
    const weatherEffects = conditions.weather.effectMultipliers;
    const pitchMultiplier = this.getPitchMultiplier(conditions.pitchCondition);

    return {
      passAccuracy: weatherEffects.passAccuracy * pitchMultiplier.passAccuracy,
      shootingAccuracy: weatherEffects.shootingAccuracy * pitchMultiplier.shootingAccuracy,
      ballControl: weatherEffects.ballControl * pitchMultiplier.ballControl,
      playerSpeed: weatherEffects.playerSpeed * pitchMultiplier.playerSpeed,
      tackleStrength: weatherEffects.tackleStrength * pitchMultiplier.tackleStrength,
      staminaDrain: weatherEffects.staminaDrain * pitchMultiplier.staminaDrain,
    };
  }

  private getPitchMultiplier(condition: string): Record<string, number> {
    const multipliers: Record<string, Record<string, number>> = {
      perfect: {
        passAccuracy: 1.05,
        shootingAccuracy: 1.05,
        ballControl: 1.05,
        playerSpeed: 1.02,
        tackleStrength: 1.0,
        staminaDrain: 0.95,
      },
      good: {
        passAccuracy: 1.0,
        shootingAccuracy: 1.0,
        ballControl: 1.0,
        playerSpeed: 1.0,
        tackleStrength: 1.0,
        staminaDrain: 1.0,
      },
      wet: {
        passAccuracy: 0.92,
        shootingAccuracy: 0.88,
        ballControl: 0.95,
        playerSpeed: 0.97,
        tackleStrength: 1.08,
        staminaDrain: 1.12,
      },
      muddy: {
        passAccuracy: 0.88,
        shootingAccuracy: 0.82,
        ballControl: 0.9,
        playerSpeed: 0.93,
        tackleStrength: 1.15,
        staminaDrain: 1.25,
      },
      icy: {
        passAccuracy: 0.85,
        shootingAccuracy: 0.8,
        ballControl: 0.85,
        playerSpeed: 0.88,
        tackleStrength: 1.05,
        staminaDrain: 1.2,
      },
    };

    return multipliers[condition] || multipliers['good'];
  }

  private saveToStorage(): void {
    try {
      const data = {
        matchConditions: Array.from(this.matchConditions.entries()),
        playerInjuries: Array.from(this.playerInjuries.entries()),
        substitutionSlots: Array.from(this.substitutionSlots.entries()),
        weatherPatterns: Array.from(this.weatherPatterns.entries()),
      };
      localStorage['gameplay_dynamics_system'] = JSON.stringify(data);
    } catch (error) {
      console.error('Failed to save gameplay dynamics:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = JSON.parse(localStorage['gameplay_dynamics_system'] || '{}');
      if (data.matchConditions) {
        this.matchConditions = new Map(data.matchConditions);
      }
      if (data.playerInjuries) {
        this.playerInjuries = new Map(data.playerInjuries);
      }
      if (data.substitutionSlots) {
        this.substitutionSlots = new Map(data.substitutionSlots);
      }
      if (data.weatherPatterns) {
        this.weatherPatterns = new Map(data.weatherPatterns);
      }
    } catch (error) {
      console.error('Failed to load gameplay dynamics:', error);
    }
  }
}

export type {
  WeatherCondition,
  PlayerInjury,
  PlayerSubstitution,
  SubstitutionSlot,
  BenchPlayer,
  MatchConditions,
};
