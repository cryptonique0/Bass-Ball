/**
 * Spectator System - Live Match Viewing
 * 
 * Allow players to spectate live matches with:
 * - Real-time match updates
 * - Spectator notifications
 * - Replay recording
 * - Spectator counts
 */

export interface SpectatorSession {
  sessionId: string;
  matchId: string;
  spectatorId: string;
  spectatorName: string;
  joinedAt: number;
  isGuest: boolean;
  isStreaming?: boolean;
  streamUrl?: string;
}

export interface LiveMatchEvent {
  eventId: string;
  matchId: string;
  type: 'goal' | 'card' | 'substitution' | 'injury' | 'foul' | 'possession' | 'other';
  timestamp: number;
  playerId?: string;
  playerName?: string;
  team: 'home' | 'away';
  details: Record<string, any>;
  description: string;
}

export interface MatchReplay {
  replayId: string;
  matchId: string;
  recordedAt: number;
  duration: number; // milliseconds
  events: LiveMatchEvent[];
  thumbnailUrl?: string;
  isPublic: boolean;
  views: number;
}

/**
 * Spectator Manager - Manage live match spectating
 * Singleton pattern
 */
export class SpectatorManager {
  private static instance: SpectatorManager;
  private activeSessions: Map<string, SpectatorSession[]> = new Map(); // matchId -> sessions
  private liveEvents: Map<string, LiveMatchEvent[]> = new Map(); // matchId -> events
  private replays: Map<string, MatchReplay> = new Map();
  private matchSpectatorCount: Map<string, number> = new Map();

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): SpectatorManager {
    if (!SpectatorManager.instance) {
      SpectatorManager.instance = new SpectatorManager();
    }
    return SpectatorManager.instance;
  }

  /**
   * Join match spectating
   */
  joinSpectator(
    matchId: string,
    spectatorId: string,
    spectatorName: string,
    isGuest: boolean = false
  ): SpectatorSession {
    const sessionId = `session_${matchId}_${spectatorId}_${Date.now()}`;
    const session: SpectatorSession = {
      sessionId,
      matchId,
      spectatorId,
      spectatorName,
      joinedAt: Date.now(),
      isGuest,
    };

    if (!this.activeSessions.has(matchId)) {
      this.activeSessions.set(matchId, []);
    }

    this.activeSessions.get(matchId)!.push(session);
    this.updateSpectatorCount(matchId);

    this.saveToStorage();
    return session;
  }

  /**
   * Leave spectating
   */
  leaveSpectator(matchId: string, sessionId: string): boolean {
    const sessions = this.activeSessions.get(matchId);
    if (!sessions) return false;

    const index = sessions.findIndex(s => s.sessionId === sessionId);
    if (index === -1) return false;

    sessions.splice(index, 1);
    this.updateSpectatorCount(matchId);

    this.saveToStorage();
    return true;
  }

  /**
   * Record live match event
   */
  recordEvent(
    matchId: string,
    type: string,
    team: 'home' | 'away',
    playerId?: string,
    playerName?: string,
    details?: Record<string, any>,
    description?: string
  ): LiveMatchEvent {
    const eventId = `event_${matchId}_${Date.now()}`;
    const event: LiveMatchEvent = {
      eventId,
      matchId,
      type: type as any,
      timestamp: Date.now(),
      playerId,
      playerName,
      team,
      details: details || {},
      description: description || '',
    };

    if (!this.liveEvents.has(matchId)) {
      this.liveEvents.set(matchId, []);
    }

    this.liveEvents.get(matchId)!.push(event);

    this.saveToStorage();
    return event;
  }

  /**
   * Get live match events
   */
  getLiveEvents(matchId: string, limit: number = 50): LiveMatchEvent[] {
    const events = this.liveEvents.get(matchId) || [];
    return events.slice(Math.max(0, events.length - limit));
  }

  /**
   * Get spectator count for match
   */
  getSpectatorCount(matchId: string): number {
    return this.matchSpectatorCount.get(matchId) || 0;
  }

  /**
   * Get active spectators for match
   */
  getActiveSpectators(matchId: string): SpectatorSession[] {
    return this.activeSessions.get(matchId) || [];
  }

  /**
   * Update spectator count
   */
  private updateSpectatorCount(matchId: string): void {
    const count = this.activeSessions.get(matchId)?.length || 0;
    this.matchSpectatorCount.set(matchId, count);
  }

  /**
   * Create replay from match events
   */
  createReplay(matchId: string, isPublic: boolean = true): MatchReplay {
    const events = this.liveEvents.get(matchId) || [];
    const replayId = `replay_${matchId}_${Date.now()}`;

    const replay: MatchReplay = {
      replayId,
      matchId,
      recordedAt: Date.now(),
      duration: events.length > 0 ? events[events.length - 1].timestamp - events[0].timestamp : 0,
      events: [...events],
      isPublic,
      views: 0,
    };

    this.replays.set(replayId, replay);

    this.saveToStorage();
    return replay;
  }

  /**
   * Get replay
   */
  getReplay(replayId: string): MatchReplay | undefined {
    return this.replays.get(replayId);
  }

  /**
   * Get match replays
   */
  getMatchReplays(matchId: string): MatchReplay[] {
    return Array.from(this.replays.values())
      .filter(r => r.matchId === matchId)
      .sort((a, b) => b.recordedAt - a.recordedAt);
  }

  /**
   * Get popular replays
   */
  getPopularReplays(limit: number = 10): MatchReplay[] {
    return Array.from(this.replays.values())
      .filter(r => r.isPublic)
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);
  }

  /**
   * Increment replay view count
   */
  viewReplay(replayId: string): void {
    const replay = this.replays.get(replayId);
    if (replay) {
      replay.views++;
      this.saveToStorage();
    }
  }

  /**
   * Persist to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        activeSessions: Array.from(this.activeSessions.entries()),
        liveEvents: Array.from(this.liveEvents.entries()),
        replays: Array.from(this.replays.entries()),
        matchSpectatorCount: Array.from(this.matchSpectatorCount.entries()),
      };
      localStorage.setItem('spectator_system', JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save spectator data:', e);
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    try {
      const data = JSON.parse(localStorage.getItem('spectator_system') || '{}');
      if (data.activeSessions) this.activeSessions = new Map(data.activeSessions);
      if (data.liveEvents) this.liveEvents = new Map(data.liveEvents);
      if (data.replays) this.replays = new Map(data.replays);
      if (data.matchSpectatorCount) this.matchSpectatorCount = new Map(data.matchSpectatorCount);
    } catch (e) {
      console.warn('Failed to load spectator data:', e);
    }
  }

  /**
   * Clear all data (development only)
   */
  clearAll(): void {
    this.activeSessions.clear();
    this.liveEvents.clear();
    this.replays.clear();
    this.matchSpectatorCount.clear();
    this.saveToStorage();
  }
}
