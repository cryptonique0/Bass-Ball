/**
 * Match Logger System
 * Records detailed match events and enables replay functionality
 * Stores everything as simple JSON for portability
 */

/**
 * Individual match event
 */
export interface MatchEvent {
  timestamp: number;           // Milliseconds since match start
  type: 'goal' | 'assist' | 'tackle' | 'pass' | 'shot' | 'foul' | 'possession' | 'substitution' | 'injury' | 'card' | 'period_start' | 'period_end' | 'match_start' | 'match_end';
  player: string;              // Player name or ID
  team: 'home' | 'away';       // Which team
  details?: {
    [key: string]: any;        // Flexible details based on event type
  };
}

/**
 * Match statistics snapshot
 */
export interface MatchStats {
  homeScore: number;
  awayScore: number;
  homePossession: number;      // Percentage
  awayPossession: number;      // Percentage
  homeShots: number;
  awayShots: number;
  homeTackles: number;
  awayTackles: number;
  homePasses: number;
  awayPasses: number;
  homeGoals: number;
  awayGoals: number;
  homeAssists: number;
  awayAssists: number;
}

/**
 * Complete match log
 */
export interface MatchLog {
  id: string;                  // Unique match ID
  timestamp: number;           // Match start time
  homeTeam: string;
  awayTeam: string;
  duration: number;            // Total duration in minutes
  finalScore: {
    home: number;
    away: number;
  };
  events: MatchEvent[];        // All recorded events
  playerStats: {
    [playerName: string]: {
      team: 'home' | 'away';
      goals: number;
      assists: number;
      shots: number;
      tackles: number;
      passes: number;
      fouls: number;
      cards?: 'yellow' | 'red';
    };
  };
  timeline: MatchStats[];      // Stats snapshots throughout match
  metadata?: {
    location?: string;
    weather?: string;
    notes?: string;
    [key: string]: any;
  };
}

/**
 * Match Logger - Records and replays match events
 */
export class MatchLogger {
  private static instance: MatchLogger;
  private currentMatch: Partial<MatchLog> | null = null;
  private eventBuffer: MatchEvent[] = [];
  private statsBuffer: MatchStats[] = [];
  private matchStartTime: number = 0;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): MatchLogger {
    if (!MatchLogger.instance) {
      MatchLogger.instance = new MatchLogger();
    }
    return MatchLogger.instance;
  }

  /**
   * Start recording a new match
   */
  startMatch(homeTeam: string, awayTeam: string, duration: number): void {
    this.matchStartTime = Date.now();
    this.eventBuffer = [];
    this.statsBuffer = [];

    this.currentMatch = {
      id: this.generateMatchId(),
      timestamp: this.matchStartTime,
      homeTeam,
      awayTeam,
      duration,
      finalScore: { home: 0, away: 0 },
      events: [],
      playerStats: {},
      timeline: [],
    };

    // Record match start event
    this.recordEvent('match_start', 'system', 'home', {
      homeTeam,
      awayTeam,
    });
  }

  /**
   * Record a match event
   */
  recordEvent(
    type: MatchEvent['type'],
    player: string,
    team: 'home' | 'away',
    details?: any
  ): void {
    if (!this.currentMatch) {
      console.warn('No match in progress');
      return;
    }

    const event: MatchEvent = {
      timestamp: Date.now() - this.matchStartTime,
      type,
      player,
      team,
      details: details || {},
    };

    this.eventBuffer.push(event);

    // Update player stats
    if (player !== 'system') {
      if (!this.currentMatch.playerStats) {
        this.currentMatch.playerStats = {};
      }

      if (!this.currentMatch.playerStats[player]) {
        this.currentMatch.playerStats[player] = {
          team,
          goals: 0,
          assists: 0,
          shots: 0,
          tackles: 0,
          passes: 0,
          fouls: 0,
        };
      }

      const stats = this.currentMatch.playerStats[player];

      switch (type) {
        case 'goal':
          stats.goals++;
          if (this.currentMatch.finalScore) {
            if (team === 'home') {
              this.currentMatch.finalScore.home++;
            } else {
              this.currentMatch.finalScore.away++;
            }
          }
          break;
        case 'assist':
          stats.assists++;
          break;
        case 'shot':
          stats.shots++;
          break;
        case 'tackle':
          stats.tackles++;
          break;
        case 'pass':
          stats.passes++;
          break;
        case 'foul':
          stats.fouls++;
          break;
        case 'card':
          if (details?.card === 'yellow') {
            stats.cards = 'yellow';
          } else if (details?.card === 'red') {
            stats.cards = 'red';
          }
          break;
      }
    }
  }

  /**
   * Record match statistics snapshot
   */
  recordStats(stats: MatchStats): void {
    if (!this.currentMatch) {
      console.warn('No match in progress');
      return;
    }

    this.statsBuffer.push(stats);
  }

  /**
   * End match recording
   */
  endMatch(finalScore: { home: number; away: number }): MatchLog {
    if (!this.currentMatch) {
      throw new Error('No match in progress');
    }

    this.currentMatch.events = this.eventBuffer;
    this.currentMatch.timeline = this.statsBuffer;
    this.currentMatch.finalScore = finalScore;

    this.recordEvent('match_end', 'system', 'home', {
      finalScore,
    });

    const match = this.currentMatch as MatchLog;
    this.currentMatch = null;
    this.eventBuffer = [];
    this.statsBuffer = [];

    return match;
  }

  /**
   * Convert match to JSON string
   */
  static toJSON(match: MatchLog): string {
    return JSON.stringify(match, null, 2);
  }

  /**
   * Parse match from JSON string
   */
  static fromJSON(json: string): MatchLog {
    return JSON.parse(json);
  }

  /**
   * Save match log to localStorage
   */
  static saveToStorage(match: MatchLog, key?: string): void {
    const storageKey = key || `match_log_${match.id}`;
    localStorage.setItem(storageKey, MatchLogger.toJSON(match));
  }

  /**
   * Load match log from localStorage
   */
  static loadFromStorage(key: string): MatchLog | null {
    const json = localStorage.getItem(key);
    if (!json) return null;
    return MatchLogger.fromJSON(json);
  }

  /**
   * Get all match logs from storage
   */
  static getAllLogsFromStorage(): MatchLog[] {
    const logs: MatchLog[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('match_log_')) {
        const json = localStorage.getItem(key);
        if (json) {
          try {
            logs.push(MatchLogger.fromJSON(json));
          } catch (e) {
            console.error(`Failed to parse ${key}`, e);
          }
        }
      }
    }
    return logs.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Export match logs as CSV
   */
  static toCSV(match: MatchLog): string {
    const lines: string[] = [];

    // Header
    lines.push('Match Information');
    lines.push(`ID,${match.id}`);
    lines.push(`Date,${new Date(match.timestamp).toISOString()}`);
    lines.push(`Home Team,${match.homeTeam}`);
    lines.push(`Away Team,${match.awayTeam}`);
    lines.push(`Final Score,"${match.finalScore.home} - ${match.finalScore.away}"`);
    lines.push(`Duration,${match.duration} minutes`);
    lines.push('');

    // Player Stats
    lines.push('Player Statistics');
    lines.push('Player,Team,Goals,Assists,Shots,Tackles,Passes,Fouls,Cards');
    for (const [player, stats] of Object.entries(match.playerStats)) {
      const cards = stats.cards ? `"${stats.cards}"` : '';
      lines.push(
        `"${player}",${stats.team},${stats.goals},${stats.assists},${stats.shots},${stats.tackles},${stats.passes},${stats.fouls},${cards}`
      );
    }
    lines.push('');

    // Events
    lines.push('Match Events');
    lines.push('Time (s),Type,Player,Team,Details');
    for (const event of match.events) {
      const details = event.details ? JSON.stringify(event.details) : '';
      lines.push(
        `${event.timestamp},"${event.type}","${event.player}",${event.team},"${details}"`
      );
    }

    return lines.join('\n');
  }

  /**
   * Generate match highlight summary
   */
  static generateHighlights(match: MatchLog): string[] {
    const highlights: string[] = [];

    // Goals
    const goals = match.events.filter(e => e.type === 'goal');
    for (const goal of goals) {
      const minute = Math.floor(goal.timestamp / 60000);
      highlights.push(`⚽ ${goal.player} (${goal.team}) - ${minute}'`);
    }

    // Cards
    const cards = match.events.filter(e => e.type === 'card');
    for (const card of cards) {
      const minute = Math.floor(card.timestamp / 60000);
      const cardType = card.details?.card === 'red' ? '🔴' : '🟡';
      highlights.push(`${cardType} ${card.player} - ${minute}'`);
    }

    return highlights;
  }

  /**
   * Get match statistics
   */
  static getMatchStats(match: MatchLog): {
    totalEvents: number;
    totalGoals: number;
    totalAssists: number;
    totalTackles: number;
    totalPasses: number;
    topScorer: { name: string; goals: number } | null;
    topAssister: { name: string; assists: number } | null;
  } {
    let topScorer: { name: string; goals: number } | null = null;
    let topAssister: { name: string; assists: number } | null = null;
    let totalGoals = 0;
    let totalAssists = 0;

    for (const [player, stats] of Object.entries(match.playerStats)) {
      if (stats.goals > (topScorer?.goals ?? 0)) {
        topScorer = { name: player, goals: stats.goals };
      }
      if (stats.assists > (topAssister?.assists ?? 0)) {
        topAssister = { name: player, assists: stats.assists };
      }
      totalGoals += stats.goals;
      totalAssists += stats.assists;
    }

    const totalTackles = Object.values(match.playerStats).reduce(
      (sum, stats) => sum + stats.tackles,
      0
    );
    const totalPasses = Object.values(match.playerStats).reduce(
      (sum, stats) => sum + stats.passes,
      0
    );

    return {
      totalEvents: match.events.length,
      totalGoals,
      totalAssists,
      totalTackles,
      totalPasses,
      topScorer,
      topAssister,
    };
  }

  /**
   * Generate match report
   */
  static generateReport(match: MatchLog): string {
    const stats = this.getMatchStats(match);
    const highlights = this.generateHighlights(match);

    const lines: string[] = [];
    lines.push('═══════════════════════════════════════════');
    lines.push(`           MATCH REPORT`);
    lines.push('═══════════════════════════════════════════');
    lines.push('');
    lines.push(`${match.homeTeam} vs ${match.awayTeam}`);
    lines.push(
      `Final Score: ${match.finalScore.home} - ${match.finalScore.away}`
    );
    lines.push(
      `Date: ${new Date(match.timestamp).toLocaleString()}`
    );
    lines.push(`Duration: ${match.duration} minutes`);
    lines.push('');

    lines.push('HIGHLIGHTS:');
    if (highlights.length > 0) {
      for (const highlight of highlights) {
        lines.push(`  ${highlight}`);
      }
    } else {
      lines.push('  No highlights recorded');
    }
    lines.push('');

    lines.push('STATISTICS:');
    lines.push(`  Total Events: ${stats.totalEvents}`);
    lines.push(`  Total Goals: ${stats.totalGoals}`);
    lines.push(`  Total Assists: ${stats.totalAssists}`);
    lines.push(`  Total Tackles: ${stats.totalTackles}`);
    lines.push(`  Total Passes: ${stats.totalPasses}`);
    lines.push('');

    if (stats.topScorer) {
      lines.push(`  Top Scorer: ${stats.topScorer.name} (${stats.topScorer.goals})`);
    }
    if (stats.topAssister) {
      lines.push(`  Top Assister: ${stats.topAssister.name} (${stats.topAssister.assists})`);
    }
    lines.push('');

    lines.push('PLAYER STATISTICS:');
    const sortedPlayers = Object.entries(match.playerStats).sort(
      (a, b) => (b[1].goals + b[1].assists) - (a[1].goals + a[1].assists)
    );
    for (const [player, stats] of sortedPlayers) {
      lines.push(`  ${player} (${stats.team}): ${stats.goals}G ${stats.assists}A ${stats.shots}S ${stats.tackles}T`);
    }

    lines.push('');
    lines.push('═══════════════════════════════════════════');

    return lines.join('\n');
  }

  /**
   * Generate unique match ID
   */
  private generateMatchId(): string {
    return `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Match Replayer - Plays back match events
 */
export class MatchReplayer {
  private match: MatchLog;
  private currentEventIndex: number = 0;
  private isPlaying: boolean = false;
  private playbackSpeed: number = 1; // 1x speed
  private timeoutId: NodeJS.Timeout | null = null;

  constructor(match: MatchLog) {
    this.match = match;
  }

  /**
   * Start replaying match
   */
  play(onEvent?: (event: MatchEvent) => void): void {
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.playbackStep(onEvent);
  }

  /**
   * Pause replay
   */
  pause(): void {
    this.isPlaying = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /**
   * Resume replay
   */
  resume(onEvent?: (event: MatchEvent) => void): void {
    this.isPlaying = true;
    this.playbackStep(onEvent);
  }

  /**
   * Stop replay and reset
   */
  stop(): void {
    this.pause();
    this.currentEventIndex = 0;
  }

  /**
   * Skip to specific time (in seconds)
   */
  skipTo(seconds: number): void {
    const targetTime = seconds * 1000;
    this.currentEventIndex = this.match.events.findIndex(
      e => e.timestamp >= targetTime
    );
    if (this.currentEventIndex === -1) {
      this.currentEventIndex = this.match.events.length;
    }
  }

  /**
   * Get next event
   */
  getNextEvent(): MatchEvent | null {
    if (this.currentEventIndex >= this.match.events.length) {
      this.isPlaying = false;
      return null;
    }
    return this.match.events[this.currentEventIndex];
  }

  /**
   * Get current time in match (seconds)
   */
  getCurrentTime(): number {
    if (this.currentEventIndex === 0) return 0;
    const lastEvent = this.match.events[this.currentEventIndex - 1];
    return Math.floor(lastEvent.timestamp / 1000);
  }

  /**
   * Get progress percentage
   */
  getProgress(): number {
    return (this.currentEventIndex / this.match.events.length) * 100;
  }

  /**
   * Set playback speed
   */
  setSpeed(speed: number): void {
    this.playbackSpeed = Math.max(0.25, Math.min(2, speed)); // 0.25x to 2x
  }

  /**
   * Internal playback step
   */
  private playbackStep(onEvent?: (event: MatchEvent) => void): void {
    const event = this.getNextEvent();

    if (!event) {
      this.isPlaying = false;
      return;
    }

    if (onEvent) {
      onEvent(event);
    }

    this.currentEventIndex++;

    if (this.isPlaying && this.currentEventIndex < this.match.events.length) {
      const currentEvent = this.match.events[this.currentEventIndex];
      const nextEvent = this.match.events[this.currentEventIndex + 1];

      if (nextEvent) {
        const delayMs = (nextEvent.timestamp - currentEvent.timestamp) / this.playbackSpeed;
        this.timeoutId = setTimeout(() => this.playbackStep(onEvent), delayMs);
      } else {
        this.isPlaying = false;
      }
    } else if (this.isPlaying) {
      this.isPlaying = false;
    }
  }
}

/**
 * Quick match logger for simple recording
 */
export function createSimpleMatchLogger() {
  const logger = MatchLogger.getInstance();

  return {
    recordGoal: (player: string, team: 'home' | 'away') =>
      logger.recordEvent('goal', player, team, { type: 'open_play' }),

    recordAssist: (player: string, team: 'home' | 'away') =>
      logger.recordEvent('assist', player, team),

    recordShot: (player: string, team: 'home' | 'away') =>
      logger.recordEvent('shot', player, team, { onTarget: true }),

    recordTackle: (player: string, team: 'home' | 'away') =>
      logger.recordEvent('tackle', player, team),

    recordFoul: (player: string, team: 'home' | 'away', details?: any) =>
      logger.recordEvent('foul', player, team, details),

    recordCard: (player: string, team: 'home' | 'away', card: 'yellow' | 'red') =>
      logger.recordEvent('card', player, team, { card }),
  };
}
