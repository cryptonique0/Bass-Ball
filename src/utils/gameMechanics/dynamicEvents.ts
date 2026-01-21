/**
 * Dynamic Match Events - In-game events that affect gameplay
 */

export interface DynamicEvent {
  type: string;
  timestamp: number;
  playerId?: string;
  impact: Record<string, number>;
}

export class DynamicEventManager {
  private events: DynamicEvent[] = [];
  private eventProbabilities: Map<string, number> = new Map();

  constructor() {
    this.initializeEventProbabilities();
  }

  private initializeEventProbabilities(): void {
    this.eventProbabilities.set('player_motivated', 0.15);
    this.eventProbabilities.set('player_tired', 0.2);
    this.eventProbabilities.set('crowd_boost', 0.1);
    this.eventProbabilities.set('momentum_swing', 0.12);
    this.eventProbabilities.set('referee_controversy', 0.05);
  }

  checkEventTriggers(matchState: {
    possession: string;
    score: [number, number];
    timeElapsed: number;
  }): DynamicEvent[] {
    const triggeredEvents: DynamicEvent[] = [];
    const currentTime = matchState.timeElapsed;

    // Score lead motivation/pressure
    const scoreDiff = Math.abs(matchState.score[0] - matchState.score[1]);
    if (scoreDiff > 0 && matchState.timeElapsed > 60 && Math.random() < scoreDiff * 0.05) {
      triggeredEvents.push(
        this.createMomentumEvent('momentum_swing', matchState.score[1] > matchState.score[0])
      );
    }

    // Time-based events (injury time, comeback attempts)
    if (currentTime > 85 && Math.random() < 0.02) {
      triggeredEvents.push(this.createTimeEvent('late_game_pressure'));
    }

    // Random motivation events
    if (Math.random() < ((this.eventProbabilities.get('player_motivated') || 0) * 0.01)) {
      triggeredEvents.push(this.createPlayerEvent('player_motivated'));
    }

    for (const event of triggeredEvents) {
      this.events.push(event);
    }

    return triggeredEvents;
  }

  private createMomentumEvent(type: string, trailingTeam: boolean): DynamicEvent {
    return {
      type,
      timestamp: Date.now(),
      impact: {
        attackPower: trailingTeam ? 0.15 : -0.1,
        defensePower: trailingTeam ? -0.05 : 0.1,
        mentality: trailingTeam ? 0.2 : -0.1,
      },
    };
  }

  private createTimeEvent(type: string): DynamicEvent {
    return {
      type,
      timestamp: Date.now(),
      impact: {
        urgency: 0.3,
        risking: 0.2,
        mentality: -0.1,
      },
    };
  }

  private createPlayerEvent(type: string): DynamicEvent {
    return {
      type,
      timestamp: Date.now(),
      playerId: `player_${Math.floor(Math.random() * 11)}`,
      impact: {
        form: 0.1,
        confidence: 0.15,
        performance: 0.08,
      },
    };
  }

  getActiveEvents(): DynamicEvent[] {
    const oneMinuteAgo = Date.now() - 60000;
    return this.events.filter((e) => e.timestamp > oneMinuteAgo);
  }

  getEventHistory(): DynamicEvent[] {
    return [...this.events];
  }

  clearOldEvents(ageLimit: number = 300000): void {
    const cutoff = Date.now() - ageLimit;
    this.events = this.events.filter((e) => e.timestamp > cutoff);
  }
}
