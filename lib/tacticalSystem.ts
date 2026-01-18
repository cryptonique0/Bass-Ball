/**
 * Tactical System
 * Manages team formations, tactical sliders, and strategic configurations
 */

interface TeamFormation {
  formationId: string;
  name: string;
  type: '433' | '442' | '352' | '532' | '4231' | '3421' | 'custom';
  description: string;
  positions: Map<string, FormationPosition>; // Position -> FormationPosition
  createdAt: number;
  isDefault: boolean;
}

interface FormationPosition {
  positionName: string;
  shortName: string;
  x: number; // Field position (0-100)
  y: number; // Field position (0-100)
  responsibilities: string[];
  idealPlayerType: string;
}

interface TacticalSliders {
  slidersId: string;
  teamId: string;
  matchId?: string;
  
  // Pressing intensity (0-100)
  pressing: number; // 0 = low pressure, 100 = high pressure
  
  // Tempo of play (0-100)
  tempo: number; // 0 = slow build-up, 100 = fast counter-attack
  
  // Width of play (0-100)
  width: number; // 0 = narrow/compact, 100 = wide/expansive
  
  // Defensive line height (0-100)
  defensiveLineHeight: number; // 0 = deep defense, 100 = high press
  
  // Offensive aggression (0-100)
  offensiveAggression: number; // 0 = passive, 100 = aggressive attack
  
  // Build up play (0-100)
  buildUpPlay: number; // 0 = long balls, 100 = short passes
  
  // Transition speed (0-100)
  transitionSpeed: number; // 0 = slow possession, 100 = fast transitions
  
  // Creativity (0-100)
  creativity: number; // 0 = structured play, 100 = creative/risky
  
  timestamp: number;
}

interface TacticalPreset {
  presetId: string;
  name: string;
  description: string;
  sliders: TacticalSliders;
  isDefault: boolean;
  createdAt: number;
  winRate?: number; // Historical win rate with this preset
}

interface PlayerTacticalRole {
  playerId: string;
  playerName: string;
  position: string;
  assignment: 'defender' | 'midfielder' | 'forward' | 'winger' | 'fullback';
  personalPressing: number; // 0-100
  advancedPosition: boolean; // Whether to push forward
  markedOpponent?: string; // playerId to mark
  hasSetPiece: 'corners' | 'freekicks' | 'penalties' | 'none';
  tacticType: 'aggressive' | 'balanced' | 'defensive' | 'creative';
}

interface MatchTactics {
  tacticsId: string;
  matchId: string;
  homeTeamId: string;
  awayTeamId: string;
  
  homeTeamTactics: {
    formation: TeamFormation;
    sliders: TacticalSliders;
    playerRoles: Map<string, PlayerTacticalRole>;
  };
  
  awayTeamTactics: {
    formation: TeamFormation;
    sliders: TacticalSliders;
    playerRoles: Map<string, PlayerTacticalRole>;
  };
  
  timestamp: number;
}

interface TacticalAdjustment {
  adjustmentId: string;
  matchId: string;
  teamId: string;
  gameMinute: number;
  type: 'slider_change' | 'formation_change' | 'substitution' | 'player_role_change';
  previousState: any;
  newState: any;
  reason: string;
  effectiveness: number; // -100 to +100
  timestamp: number;
}

interface TacticalAnalytics {
  analyticsId: string;
  matchId: string;
  teamId: string;
  
  formationEffectiveness: Record<string, number>;
  sliderImpact: Record<string, number>;
  playerRolePerformance: Map<string, number>;
  
  pressureSuccess: number; // %
  possessionLost: number; // %
  defensiveErrors: number;
  creativeSuccess: number; // %
  
  adjustments: TacticalAdjustment[];
  timestamp: number;
}

export class TacticalSystem {
  private static instance: TacticalSystem;
  private formations: Map<string, TeamFormation> = new Map();
  private tacticalSliders: Map<string, TacticalSliders> = new Map();
  private presets: Map<string, TacticalPreset> = new Map();
  private matchTactics: Map<string, MatchTactics> = new Map();
  private adjustments: Map<string, TacticalAdjustment> = new Map();
  private analytics: Map<string, TacticalAnalytics> = new Map();

  private constructor() {
    this.loadFromStorage();
    this.initializeDefaultFormations();
  }

  static getInstance(): TacticalSystem {
    if (!TacticalSystem.instance) {
      TacticalSystem.instance = new TacticalSystem();
    }
    return TacticalSystem.instance;
  }

  /**
   * Formation Management
   */
  private initializeDefaultFormations(): void {
    const formations: TeamFormation[] = [
      {
        formationId: 'form_433',
        name: '4-3-3',
        type: '433',
        description: 'Balanced formation with 4 defenders, 3 midfielders, 3 forwards',
        positions: new Map([
          ['GK', { positionName: 'Goalkeeper', shortName: 'GK', x: 50, y: 5, responsibilities: ['shot_stopping', 'distribution'], idealPlayerType: 'Goalkeeper' }],
          ['CB1', { positionName: 'Center Back Left', shortName: 'CB', x: 25, y: 20, responsibilities: ['defending', 'aerial_duels'], idealPlayerType: 'Defender' }],
          ['CB2', { positionName: 'Center Back Right', shortName: 'CB', x: 75, y: 20, responsibilities: ['defending', 'aerial_duels'], idealPlayerType: 'Defender' }],
          ['LB', { positionName: 'Left Back', shortName: 'LB', x: 10, y: 35, responsibilities: ['defending', 'crossing'], idealPlayerType: 'Fullback' }],
          ['RB', { positionName: 'Right Back', shortName: 'RB', x: 90, y: 35, responsibilities: ['defending', 'crossing'], idealPlayerType: 'Fullback' }],
          ['CM1', { positionName: 'Center Midfield Left', shortName: 'CM', x: 35, y: 50, responsibilities: ['passing', 'work_rate'], idealPlayerType: 'Midfielder' }],
          ['CM2', { positionName: 'Center Midfield', shortName: 'CM', x: 50, y: 50, responsibilities: ['passing', 'ball_retention'], idealPlayerType: 'Midfielder' }],
          ['CM3', { positionName: 'Center Midfield Right', shortName: 'CM', x: 65, y: 50, responsibilities: ['passing', 'work_rate'], idealPlayerType: 'Midfielder' }],
          ['LW', { positionName: 'Left Wing', shortName: 'LW', x: 15, y: 70, responsibilities: ['dribbling', 'crossing'], idealPlayerType: 'Winger' }],
          ['ST', { positionName: 'Striker', shortName: 'ST', x: 50, y: 85, responsibilities: ['finishing', 'positioning'], idealPlayerType: 'Forward' }],
          ['RW', { positionName: 'Right Wing', shortName: 'RW', x: 85, y: 70, responsibilities: ['dribbling', 'crossing'], idealPlayerType: 'Winger' }],
        ]),
        createdAt: Date.now(),
        isDefault: true,
      },
      {
        formationId: 'form_442',
        name: '4-4-2',
        type: '442',
        description: 'Classic formation with 4 defenders, 4 midfielders, 2 forwards',
        positions: new Map([
          ['GK', { positionName: 'Goalkeeper', shortName: 'GK', x: 50, y: 5, responsibilities: ['shot_stopping', 'distribution'], idealPlayerType: 'Goalkeeper' }],
          ['CB1', { positionName: 'Center Back Left', shortName: 'CB', x: 30, y: 20, responsibilities: ['defending', 'aerial_duels'], idealPlayerType: 'Defender' }],
          ['CB2', { positionName: 'Center Back Right', shortName: 'CB', x: 70, y: 20, responsibilities: ['defending', 'aerial_duels'], idealPlayerType: 'Defender' }],
          ['LB', { positionName: 'Left Back', shortName: 'LB', x: 10, y: 35, responsibilities: ['defending', 'crossing'], idealPlayerType: 'Fullback' }],
          ['RB', { positionName: 'Right Back', shortName: 'RB', x: 90, y: 35, responsibilities: ['defending', 'crossing'], idealPlayerType: 'Fullback' }],
          ['LM', { positionName: 'Left Midfielder', shortName: 'LM', x: 20, y: 55, responsibilities: ['passing', 'work_rate'], idealPlayerType: 'Midfielder' }],
          ['RM', { positionName: 'Right Midfielder', shortName: 'RM', x: 80, y: 55, responsibilities: ['passing', 'work_rate'], idealPlayerType: 'Midfielder' }],
          ['CM1', { positionName: 'Center Midfielder Left', shortName: 'CM', x: 40, y: 50, responsibilities: ['passing', 'ball_retention'], idealPlayerType: 'Midfielder' }],
          ['CM2', { positionName: 'Center Midfielder Right', shortName: 'CM', x: 60, y: 50, responsibilities: ['passing', 'ball_retention'], idealPlayerType: 'Midfielder' }],
          ['ST1', { positionName: 'Striker Left', shortName: 'ST', x: 35, y: 85, responsibilities: ['finishing', 'link_up'], idealPlayerType: 'Forward' }],
          ['ST2', { positionName: 'Striker Right', shortName: 'ST', x: 65, y: 85, responsibilities: ['finishing', 'link_up'], idealPlayerType: 'Forward' }],
        ]),
        createdAt: Date.now(),
        isDefault: true,
      },
      {
        formationId: 'form_352',
        name: '3-5-2',
        type: '352',
        description: 'Offensive formation with 3 defenders, 5 midfielders, 2 forwards',
        positions: new Map([
          ['GK', { positionName: 'Goalkeeper', shortName: 'GK', x: 50, y: 5, responsibilities: ['shot_stopping', 'distribution'], idealPlayerType: 'Goalkeeper' }],
          ['CB1', { positionName: 'Center Back Left', shortName: 'CB', x: 20, y: 25, responsibilities: ['defending', 'aerial_duels'], idealPlayerType: 'Defender' }],
          ['CB2', { positionName: 'Center Back', shortName: 'CB', x: 50, y: 20, responsibilities: ['defending', 'positioning'], idealPlayerType: 'Defender' }],
          ['CB3', { positionName: 'Center Back Right', shortName: 'CB', x: 80, y: 25, responsibilities: ['defending', 'aerial_duels'], idealPlayerType: 'Defender' }],
          ['LWB', { positionName: 'Left Wing Back', shortName: 'LWB', x: 10, y: 50, responsibilities: ['defending', 'crossing'], idealPlayerType: 'Fullback' }],
          ['CM1', { positionName: 'Center Midfielder Left', shortName: 'CM', x: 35, y: 55, responsibilities: ['passing', 'ball_retention'], idealPlayerType: 'Midfielder' }],
          ['CM2', { positionName: 'Center Midfielder', shortName: 'CM', x: 50, y: 60, responsibilities: ['passing', 'work_rate'], idealPlayerType: 'Midfielder' }],
          ['CM3', { positionName: 'Center Midfielder Right', shortName: 'CM', x: 65, y: 55, responsibilities: ['passing', 'ball_retention'], idealPlayerType: 'Midfielder' }],
          ['RWB', { positionName: 'Right Wing Back', shortName: 'RWB', x: 90, y: 50, responsibilities: ['defending', 'crossing'], idealPlayerType: 'Fullback' }],
          ['ST1', { positionName: 'Striker Left', shortName: 'ST', x: 40, y: 80, responsibilities: ['finishing', 'link_up'], idealPlayerType: 'Forward' }],
          ['ST2', { positionName: 'Striker Right', shortName: 'ST', x: 60, y: 80, responsibilities: ['finishing', 'link_up'], idealPlayerType: 'Forward' }],
        ]),
        createdAt: Date.now(),
        isDefault: true,
      },
    ];

    formations.forEach(f => this.formations.set(f.formationId, f));
    this.saveToStorage();
  }

  createCustomFormation(name: string, description: string, positions: Map<string, FormationPosition>): TeamFormation {
    const formation: TeamFormation = {
      formationId: `form_custom_${Date.now()}`,
      name,
      description,
      type: 'custom',
      positions,
      createdAt: Date.now(),
      isDefault: false,
    };

    this.formations.set(formation.formationId, formation);
    this.saveToStorage();
    return formation;
  }

  getFormation(formationId: string): TeamFormation | null {
    return this.formations.get(formationId) || null;
  }

  getAllFormations(): TeamFormation[] {
    return Array.from(this.formations.values());
  }

  /**
   * Tactical Sliders
   */
  createTacticalSliders(
    teamId: string,
    pressing: number = 50,
    tempo: number = 50,
    width: number = 50,
    defensiveLineHeight: number = 50,
    offensiveAggression: number = 50,
    buildUpPlay: number = 50,
    transitionSpeed: number = 50,
    creativity: number = 50,
    matchId?: string
  ): TacticalSliders {
    const sliders: TacticalSliders = {
      slidersId: `sliders_${Date.now()}`,
      teamId,
      matchId,
      pressing: Math.max(0, Math.min(100, pressing)),
      tempo: Math.max(0, Math.min(100, tempo)),
      width: Math.max(0, Math.min(100, width)),
      defensiveLineHeight: Math.max(0, Math.min(100, defensiveLineHeight)),
      offensiveAggression: Math.max(0, Math.min(100, offensiveAggression)),
      buildUpPlay: Math.max(0, Math.min(100, buildUpPlay)),
      transitionSpeed: Math.max(0, Math.min(100, transitionSpeed)),
      creativity: Math.max(0, Math.min(100, creativity)),
      timestamp: Date.now(),
    };

    this.tacticalSliders.set(sliders.slidersId, sliders);
    this.saveToStorage();
    return sliders;
  }

  updateTacticalSliders(slidersId: string, updates: Partial<TacticalSliders>): TacticalSliders | null {
    const sliders = this.tacticalSliders.get(slidersId);
    if (!sliders) return null;

    Object.assign(sliders, {
      ...updates,
      pressing: Math.max(0, Math.min(100, updates.pressing ?? sliders.pressing)),
      tempo: Math.max(0, Math.min(100, updates.tempo ?? sliders.tempo)),
      width: Math.max(0, Math.min(100, updates.width ?? sliders.width)),
      defensiveLineHeight: Math.max(0, Math.min(100, updates.defensiveLineHeight ?? sliders.defensiveLineHeight)),
      offensiveAggression: Math.max(0, Math.min(100, updates.offensiveAggression ?? sliders.offensiveAggression)),
      buildUpPlay: Math.max(0, Math.min(100, updates.buildUpPlay ?? sliders.buildUpPlay)),
      transitionSpeed: Math.max(0, Math.min(100, updates.transitionSpeed ?? sliders.transitionSpeed)),
      creativity: Math.max(0, Math.min(100, updates.creativity ?? sliders.creativity)),
    });

    this.saveToStorage();
    return sliders;
  }

  getTacticalSliders(slidersId: string): TacticalSliders | null {
    return this.tacticalSliders.get(slidersId) || null;
  }

  /**
   * Tactical Presets
   */
  createPreset(name: string, description: string, sliders: TacticalSliders): TacticalPreset {
    const preset: TacticalPreset = {
      presetId: `preset_${Date.now()}`,
      name,
      description,
      sliders: { ...sliders },
      isDefault: false,
      createdAt: Date.now(),
    };

    this.presets.set(preset.presetId, preset);
    this.saveToStorage();
    return preset;
  }

  getPreset(presetId: string): TacticalPreset | null {
    return this.presets.get(presetId) || null;
  }

  getAllPresets(): TacticalPreset[] {
    return Array.from(this.presets.values()).sort((a, b) => (b.winRate || 0) - (a.winRate || 0));
  }

  /**
   * Match Tactics
   */
  initializeMatchTactics(
    matchId: string,
    homeTeamId: string,
    awayTeamId: string,
    homeFormation: TeamFormation,
    awayFormation: TeamFormation,
    homeSliders?: TacticalSliders,
    awaySliders?: TacticalSliders
  ): MatchTactics {
    const defaultSliders = this.createTacticalSliders(homeTeamId);

    const tactics: MatchTactics = {
      tacticsId: `tactics_${matchId}`,
      matchId,
      homeTeamId,
      awayTeamId,
      homeTeamTactics: {
        formation: homeFormation,
        sliders: homeSliders || { ...defaultSliders, teamId: homeTeamId },
        playerRoles: new Map(),
      },
      awayTeamTactics: {
        formation: awayFormation,
        sliders: awaySliders || { ...defaultSliders, teamId: awayTeamId },
        playerRoles: new Map(),
      },
      timestamp: Date.now(),
    };

    this.matchTactics.set(matchId, tactics);
    this.saveToStorage();
    return tactics;
  }

  getMatchTactics(matchId: string): MatchTactics | null {
    return this.matchTactics.get(matchId) || null;
  }

  updatePlayerRole(matchId: string, teamId: string, playerId: string, role: PlayerTacticalRole): void {
    const tactics = this.matchTactics.get(matchId);
    if (!tactics) return;

    const teamTactics = teamId === tactics.homeTeamId ? tactics.homeTeamTactics : tactics.awayTeamTactics;
    teamTactics.playerRoles.set(playerId, role);
    this.saveToStorage();
  }

  /**
   * Tactical Adjustments
   */
  recordAdjustment(
    matchId: string,
    teamId: string,
    gameMinute: number,
    type: TacticalAdjustment['type'],
    previousState: any,
    newState: any,
    reason: string
  ): TacticalAdjustment {
    const adjustment: TacticalAdjustment = {
      adjustmentId: `adj_${Date.now()}`,
      matchId,
      teamId,
      gameMinute,
      type,
      previousState,
      newState,
      reason,
      effectiveness: 0, // Will be updated based on match results
      timestamp: Date.now(),
    };

    this.adjustments.set(adjustment.adjustmentId, adjustment);
    this.saveToStorage();
    return adjustment;
  }

  getAdjustments(matchId: string): TacticalAdjustment[] {
    return Array.from(this.adjustments.values())
      .filter(a => a.matchId === matchId)
      .sort((a, b) => a.gameMinute - b.gameMinute);
  }

  /**
   * Tactical Analytics
   */
  createAnalytics(matchId: string, teamId: string): TacticalAnalytics {
    const analytics: TacticalAnalytics = {
      analyticsId: `analytics_${matchId}_${teamId}`,
      matchId,
      teamId,
      formationEffectiveness: {},
      sliderImpact: {},
      playerRolePerformance: new Map(),
      pressureSuccess: 0,
      possessionLost: 0,
      defensiveErrors: 0,
      creativeSuccess: 0,
      adjustments: this.getAdjustments(matchId).filter(a => a.teamId === teamId),
      timestamp: Date.now(),
    };

    this.analytics.set(analytics.analyticsId, analytics);
    this.saveToStorage();
    return analytics;
  }

  updateAnalytics(analyticsId: string, updates: Partial<TacticalAnalytics>): void {
    const analytics = this.analytics.get(analyticsId);
    if (analytics) {
      Object.assign(analytics, updates);
      this.saveToStorage();
    }
  }

  getAnalytics(matchId: string, teamId: string): TacticalAnalytics | null {
    const analyticsId = `analytics_${matchId}_${teamId}`;
    return this.analytics.get(analyticsId) || null;
  }

  /**
   * Storage
   */
  private saveToStorage(): void {
    try {
      const data = {
        formations: Array.from(this.formations.entries()),
        tacticalSliders: Array.from(this.tacticalSliders.entries()),
        presets: Array.from(this.presets.entries()),
        matchTactics: Array.from(this.matchTactics.entries()),
        adjustments: Array.from(this.adjustments.entries()),
        analytics: Array.from(this.analytics.entries()),
      };
      localStorage['tactical_system'] = JSON.stringify(data);
    } catch (error) {
      console.error('Failed to save tactical system:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = JSON.parse(localStorage['tactical_system'] || '{}');
      if (data.formations) this.formations = new Map(data.formations);
      if (data.tacticalSliders) this.tacticalSliders = new Map(data.tacticalSliders);
      if (data.presets) this.presets = new Map(data.presets);
      if (data.matchTactics) this.matchTactics = new Map(data.matchTactics);
      if (data.adjustments) this.adjustments = new Map(data.adjustments);
      if (data.analytics) this.analytics = new Map(data.analytics);
    } catch (error) {
      console.error('Failed to load tactical system:', error);
    }
  }
}

export type {
  TeamFormation,
  TacticalSliders,
  TacticalPreset,
  PlayerTacticalRole,
  MatchTactics,
  TacticalAdjustment,
  TacticalAnalytics,
  FormationPosition,
};
