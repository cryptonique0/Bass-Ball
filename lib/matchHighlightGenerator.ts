/**
 * AI Match Highlight Generation System
 * Generates automated match highlights based on key events and AI analysis
 */

interface MatchEvent {
  eventId: string;
  eventType: 'goal' | 'shot' | 'assist' | 'tackle' | 'interception' | 'save' | 'foul' | 'yellow_card' | 'red_card' | 'chance_missed';
  timestamp: number; // Game minute (0-90+)
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  position: { x: number; y: number };
  description: string;
  xG?: number; // Expected goals
  impact: number; // -100 to +100 (negative for defender actions)
  video?: {
    startTime: number;
    endTime: number;
    duration: number;
  };
}

interface HighlightSequence {
  sequenceId: string;
  matchId: string;
  type: 'goal' | 'chance_creation' | 'defensive_action' | 'save' | 'skill' | 'team_move';
  events: MatchEvent[];
  narrative: string;
  duration: number;
  emotionalIntensity: number;
  importance: number;
  keyPlayer: string;
}

interface GeneratedHighlights {
  highlightId: string;
  matchId: string;
  timestamp: number;
  
  fullMatchDuration: number; // minutes
  highlightReel: HighlightSequence[];
  totalDuration: number; // in seconds
  
  statistics: {
    totalEvents: number;
    selectedEvents: number;
    coverage: number; // % of match covered
  };
  
  narrativeCommentary: string[];
  keyMoments: {
    minute: number;
    description: string;
    significance: string;
  }[];
  
  playerOfTheMatch: {
    playerId: string;
    playerName: string;
    rating: number;
    highlights: HighlightSequence[];
  };
  
  teamStatistics: {
    teamId: string;
    teamName: string;
    possessionPercentage: number;
    shotsOnTarget: number;
    tackles: number;
    interceptions: number;
    saves: number;
    goals: number;
  }[];
  
  generationQuality: number; // 0-100
  aiConfidence: number; // 0-100
}

interface HighlightPreset {
  presetId: string;
  name: string;
  description: string;
  duration: number; // target duration in seconds
  eventTypes: string[];
  minimumImpactThreshold: number; // -100 to +100
  focusTeam?: string; // null for all events
  narrativeStyle: 'dramatic' | 'analytical' | 'entertaining' | 'detailed';
  prioritizeGoals: boolean;
}

interface CommentaryLine {
  lineId: string;
  eventType: string;
  template: string; // Template with {playerName}, {teamName}, etc
  emotionalTone: 'excited' | 'neutral' | 'serious';
  duration: number; // Expected voice duration in seconds
}

interface HighlightTheme {
  themeId: string;
  name: string;
  musicGenre: string;
  colorScheme: string;
  transitionStyle: string;
  filters: string[];
}

export class MatchHighlightGenerator {
  private static instance: MatchHighlightGenerator;
  private matchEvents: Map<string, MatchEvent[]> = new Map();
  private generatedHighlights: Map<string, GeneratedHighlights> = new Map();
  private presets: Map<string, HighlightPreset> = new Map();
  private commentary: Map<string, CommentaryLine[]> = new Map();

  private constructor() {
    this.loadFromStorage();
    this.initializeDefaultPresets();
    this.initializeCommentary();
  }

  static getInstance(): MatchHighlightGenerator {
    if (!MatchHighlightGenerator.instance) {
      MatchHighlightGenerator.instance = new MatchHighlightGenerator();
    }
    return MatchHighlightGenerator.instance;
  }

  /**
   * Event Recording
   */
  recordMatchEvent(
    matchId: string,
    event: Omit<MatchEvent, 'eventId'>
  ): MatchEvent {
    const fullEvent: MatchEvent = {
      ...event,
      eventId: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    if (!this.matchEvents.has(matchId)) {
      this.matchEvents.set(matchId, []);
    }

    this.matchEvents.get(matchId)!.push(fullEvent);
    this.saveToStorage();
    return fullEvent;
  }

  getMatchEvents(matchId: string): MatchEvent[] {
    return this.matchEvents.get(matchId) || [];
  }

  /**
   * Highlight Generation
   */
  generateHighlights(
    matchId: string,
    events: MatchEvent[],
    presetId?: string,
    maxDuration: number = 300 // 5 minutes default
  ): GeneratedHighlights {
    const preset = presetId ? this.presets.get(presetId) : this.getDefaultPreset();
    if (!preset) throw new Error('Preset not found');

    // Filter and rank events
    const selectedEvents = this.selectHighlightEvents(events, preset, maxDuration);
    
    // Create highlight sequences
    const sequences = this.createHighlightSequences(selectedEvents);
    
    // Generate narrative
    const narrativeCommentary = this.generateNarrative(sequences);
    
    // Identify player of the match
    const playerOfTheMatch = this.identifyPlayerOfTheMatch(selectedEvents);
    
    // Calculate team statistics
    const teamStatistics = this.calculateTeamStatistics(events);
    
    // Calculate quality metrics
    const { generationQuality, aiConfidence } = this.calculateQualityMetrics(
      selectedEvents,
      events,
      sequences
    );

    const highlights: GeneratedHighlights = {
      highlightId: `highlights_${Date.now()}`,
      matchId,
      timestamp: Date.now(),
      fullMatchDuration: events.length > 0 ? Math.max(...events.map(e => e.timestamp)) : 90,
      highlightReel: sequences,
      totalDuration: sequences.reduce((sum, seq) => sum + seq.duration, 0),
      statistics: {
        totalEvents: events.length,
        selectedEvents: selectedEvents.length,
        coverage: (selectedEvents.length / events.length) * 100,
      },
      narrativeCommentary,
      keyMoments: this.identifyKeyMoments(sequences),
      playerOfTheMatch,
      teamStatistics,
      generationQuality,
      aiConfidence,
    };

    this.generatedHighlights.set(highlights.highlightId, highlights);
    this.saveToStorage();
    return highlights;
  }

  private selectHighlightEvents(
    events: MatchEvent[],
    preset: HighlightPreset,
    maxDuration: number
  ): MatchEvent[] {
    // Filter by event type and preset criteria
    let filtered = events.filter(e => 
      preset.eventTypes.includes(e.eventType) &&
      e.impact >= preset.minimumImpactThreshold
    );

    // If focusing on specific team
    if (preset.focusTeam) {
      filtered = filtered.filter(e => e.teamId === preset.focusTeam);
    }

    // Sort by impact and timestamp
    filtered.sort((a, b) => {
      const impactDiff = Math.abs(b.impact) - Math.abs(a.impact);
      if (impactDiff !== 0) return impactDiff;
      return a.timestamp - b.timestamp;
    });

    // Prioritize goals if enabled
    if (preset.prioritizeGoals) {
      const goals = filtered.filter(e => e.eventType === 'goal');
      const nonGoals = filtered.filter(e => e.eventType !== 'goal');
      filtered = [...goals, ...nonGoals];
    }

    // Estimate duration and trim
    let estimatedDuration = 0;
    const selected: MatchEvent[] = [];

    for (const event of filtered) {
      const eventDuration = this.estimateEventDuration(event);
      if (estimatedDuration + eventDuration <= maxDuration) {
        selected.push(event);
        estimatedDuration += eventDuration;
      } else if (event.eventType === 'goal') {
        // Always include goals
        selected.push(event);
        estimatedDuration += eventDuration;
      }
    }

    return selected;
  }

  private estimateEventDuration(event: MatchEvent): number {
    const durations: { [key: string]: number } = {
      goal: 15,
      assist: 12,
      shot: 8,
      chance_missed: 6,
      save: 5,
      tackle: 4,
      interception: 4,
      foul: 6,
      yellow_card: 4,
      red_card: 8,
    };

    return durations[event.eventType] || 5;
  }

  private createHighlightSequences(events: MatchEvent[]): HighlightSequence[] {
    const sequences: HighlightSequence[] = [];
    const eventsByType = new Map<string, MatchEvent[]>();

    // Group events by type
    events.forEach(event => {
      if (!eventsByType.has(event.eventType)) {
        eventsByType.set(event.eventType, []);
      }
      eventsByType.get(event.eventType)!.push(event);
    });

    // Create sequences
    eventsByType.forEach((typeEvents, eventType) => {
      if (eventType === 'goal') {
        // Each goal gets its own sequence
        typeEvents.forEach(goal => {
          const sequenceEvents = this.gatherSequenceEvents(goal, events);
          sequences.push({
            sequenceId: `seq_${goal.eventId}`,
            matchId: '', // Will be set by caller
            type: 'goal',
            events: sequenceEvents,
            narrative: this.generateSequenceNarrative(goal, sequenceEvents),
            duration: sequenceEvents.length * 3 + 10,
            emotionalIntensity: 95,
            importance: 100,
            keyPlayer: goal.playerId,
          });
        });
      } else if (typeEvents.length > 0) {
        // Group related events into sequences
        sequences.push({
          sequenceId: `seq_${eventType}_${Date.now()}`,
          matchId: '',
          type: eventType as any,
          events: typeEvents.slice(0, 5),
          narrative: this.generateSequenceNarrative(typeEvents[0], typeEvents.slice(0, 5)),
          duration: Math.min(typeEvents.length * 4, 30),
          emotionalIntensity: this.calculateIntensity(typeEvents),
          importance: Math.max(...typeEvents.map(e => e.impact)),
          keyPlayer: typeEvents[0].playerId,
        });
      }
    });

    // Sort by importance
    sequences.sort((a, b) => b.importance - a.importance);

    return sequences.slice(0, 20); // Limit to 20 sequences
  }

  private gatherSequenceEvents(centerEvent: MatchEvent, allEvents: MatchEvent[]): MatchEvent[] {
    // Gather surrounding events (assist, build-up, etc)
    const window = 120; // 2 minute window
    return allEvents.filter(e =>
      Math.abs(e.timestamp - centerEvent.timestamp) <= window &&
      (e.teamId === centerEvent.teamId || e.eventType === 'interception' || e.eventType === 'tackle')
    );
  }

  private generateSequenceNarrative(event: MatchEvent, sequence: MatchEvent[]): string {
    const templates: { [key: string]: string } = {
      goal: `GOAL! {playerName} finishes brilliantly for {teamName}!`,
      assist: `{playerName} provides the assist for {teamName}!`,
      shot: `{playerName} attempts a shot but it goes wide!`,
      save: `Tremendous save by {playerName}!`,
      tackle: `{playerName} wins the ball back for {teamName}!`,
      interception: `Smart interception by {playerName}!`,
    };

    const template = templates[event.eventType] || 'Great action by {playerName}!';
    return template.replace('{playerName}', event.playerName).replace('{teamName}', event.teamName);
  }

  private calculateIntensity(events: MatchEvent[]): number {
    const avgImpact = events.reduce((sum, e) => sum + Math.abs(e.impact), 0) / events.length;
    return Math.min(100, avgImpact * 1.5);
  }

  private generateNarrative(sequences: HighlightSequence[]): string[] {
    const commentary: string[] = [];

    sequences.slice(0, 5).forEach((seq, idx) => {
      commentary.push(`${idx + 1}. ${seq.narrative}`);
    });

    return commentary;
  }

  private identifyKeyMoments(sequences: HighlightSequence[]): GeneratedHighlights['keyMoments'] {
    return sequences
      .filter(s => s.type === 'goal' || s.importance > 75)
      .slice(0, 5)
      .map((seq, idx) => ({
        minute: seq.events[0]?.timestamp || 0,
        description: seq.narrative,
        significance: seq.importance > 90 ? 'Critical' : 'Important',
      }));
  }

  private identifyPlayerOfTheMatch(events: MatchEvent[]): GeneratedHighlights['playerOfTheMatch'] {
    // Calculate player ratings based on event impact
    const playerStats = new Map<string, { name: string; impact: number; events: MatchEvent[] }>();

    events.forEach(event => {
      if (!playerStats.has(event.playerId)) {
        playerStats.set(event.playerId, {
          name: event.playerName,
          impact: 0,
          events: [],
        });
      }

      const stats = playerStats.get(event.playerId)!;
      stats.impact += Math.abs(event.impact);
      stats.events.push(event);
    });

    let topPlayer = Array.from(playerStats.values()).reduce((prev, current) =>
      current.impact > prev.impact ? current : prev
    );

    return {
      playerId: 'player_1',
      playerName: topPlayer.name || 'Unknown',
      rating: Math.min(100, 70 + (topPlayer.impact / 50)),
      highlights: [],
    };
  }

  private calculateTeamStatistics(events: MatchEvent[]): GeneratedHighlights['teamStatistics'] {
    const teamStats = new Map<string, any>();

    events.forEach(event => {
      if (!teamStats.has(event.teamId)) {
        teamStats.set(event.teamId, {
          teamId: event.teamId,
          teamName: event.teamName,
          possessionPercentage: 0,
          shotsOnTarget: 0,
          tackles: 0,
          interceptions: 0,
          saves: 0,
          goals: 0,
        });
      }

      const stats = teamStats.get(event.teamId);
      if (event.eventType === 'goal') stats.goals++;
      if (event.eventType === 'shot') stats.shotsOnTarget++;
      if (event.eventType === 'tackle') stats.tackles++;
      if (event.eventType === 'interception') stats.interceptions++;
      if (event.eventType === 'save') stats.saves++;
    });

    return Array.from(teamStats.values());
  }

  private calculateQualityMetrics(
    selected: MatchEvent[],
    all: MatchEvent[],
    sequences: HighlightSequence[]
  ): { generationQuality: number; aiConfidence: number } {
    let quality = 70;
    let confidence = 75;

    // Increase quality based on goals included
    const goals = selected.filter(e => e.eventType === 'goal');
    quality += Math.min(goals.length * 10, 20);

    // Increase quality based on sequence diversity
    quality += Math.min(sequences.length * 2, 15);

    // Confidence based on event count
    confidence += Math.min(selected.length / 2, 15);

    return {
      generationQuality: Math.min(100, quality),
      aiConfidence: Math.min(100, confidence),
    };
  }

  /**
   * Presets
   */
  private initializeDefaultPresets(): void {
    const presets: HighlightPreset[] = [
      {
        presetId: 'preset_all',
        name: 'Full Match Highlights',
        description: 'Best moments from entire match',
        duration: 300,
        eventTypes: ['goal', 'assist', 'chance_missed', 'save', 'tackle'],
        minimumImpactThreshold: 0,
        narrativeStyle: 'entertaining',
        prioritizeGoals: true,
      },
      {
        presetId: 'preset_goals',
        name: 'Goals Only',
        description: 'Every goal scored',
        duration: 120,
        eventTypes: ['goal'],
        minimumImpactThreshold: 50,
        narrativeStyle: 'dramatic',
        prioritizeGoals: true,
      },
      {
        presetId: 'preset_attacking',
        name: 'Attacking Plays',
        description: 'Goals and chances created',
        duration: 240,
        eventTypes: ['goal', 'assist', 'shot', 'chance_missed'],
        minimumImpactThreshold: 20,
        narrativeStyle: 'entertaining',
        prioritizeGoals: true,
      },
      {
        presetId: 'preset_defensive',
        name: 'Defensive Highlights',
        description: 'Best defensive actions',
        duration: 180,
        eventTypes: ['tackle', 'interception', 'save', 'yellow_card'],
        minimumImpactThreshold: 10,
        narrativeStyle: 'analytical',
        prioritizeGoals: false,
      },
    ];

    presets.forEach(p => this.presets.set(p.presetId, p));
  }

  private initializeCommentary(): void {
    const commentary: CommentaryLine[] = [
      {
        lineId: 'commentary_goal_1',
        eventType: 'goal',
        template: 'GOAL! {playerName} scores for {teamName}!',
        emotionalTone: 'excited',
        duration: 3,
      },
      {
        lineId: 'commentary_save_1',
        eventType: 'save',
        template: 'Fantastic save by {playerName}!',
        emotionalTone: 'excited',
        duration: 2,
      },
      {
        lineId: 'commentary_tackle_1',
        eventType: 'tackle',
        template: '{playerName} wins the ball back!',
        emotionalTone: 'neutral',
        duration: 2,
      },
    ];

    commentary.forEach(c => {
      if (!this.commentary.has(c.eventType)) {
        this.commentary.set(c.eventType, []);
      }
      this.commentary.get(c.eventType)!.push(c);
    });
  }

  private getDefaultPreset(): HighlightPreset | null {
    return this.presets.get('preset_all') || null;
  }

  /**
   * Storage
   */
  private saveToStorage(): void {
    try {
      const data = {
        matchEvents: Array.from(this.matchEvents.entries()),
        generatedHighlights: Array.from(this.generatedHighlights.entries()),
      };
      localStorage['match_highlight_system'] = JSON.stringify(data);
    } catch (error) {
      console.error('Failed to save highlight system:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = JSON.parse(localStorage['match_highlight_system'] || '{}');
      if (data.matchEvents) this.matchEvents = new Map(data.matchEvents);
      if (data.generatedHighlights) this.generatedHighlights = new Map(data.generatedHighlights);
    } catch (error) {
      console.error('Failed to load highlight system:', error);
    }
  }

  getHighlights(highlightId: string): GeneratedHighlights | null {
    return this.generatedHighlights.get(highlightId) || null;
  }

  getAllHighlightsForMatch(matchId: string): GeneratedHighlights[] {
    return Array.from(this.generatedHighlights.values()).filter(h => h.matchId === matchId);
  }
}

export type {
  MatchEvent,
  HighlightSequence,
  GeneratedHighlights,
  HighlightPreset,
  CommentaryLine,
  HighlightTheme,
};
