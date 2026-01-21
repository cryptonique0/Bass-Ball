/**
 * Match simulation engine for realistic game progression
 */

export interface SimulationConfig {
  tickRate: number; // Updates per second
  minTime: number;
  maxTime: number;
  goalChance: number; // Probability per possession
  foulsPerMatch: number;
}

export enum MatchEvent {
  POSSESSION_CHANGE = 'possession_change',
  SHOT = 'shot',
  GOAL = 'goal',
  FOUL = 'foul',
  INJURY = 'injury',
  SUBSTITUTION = 'substitution',
  YELLOW_CARD = 'yellow_card',
  RED_CARD = 'red_card',
  CORNER = 'corner',
  THROW_IN = 'throw_in',
}

export interface MatchEventData {
  event: MatchEvent;
  time: number;
  team: 'home' | 'away';
  playerId?: string;
  data?: Record<string, any>;
}

export class MatchSimulator {
  private possession: 'home' | 'away' = 'home';
  private time: number = 0;
  private homeScore: number = 0;
  private awayScore: number = 0;
  private config: SimulationConfig;
  private events: MatchEventData[] = [];
  private isRunning: boolean = false;

  constructor(config: Partial<SimulationConfig> = {}) {
    this.config = {
      tickRate: 30,
      minTime: 45,
      maxTime: 50,
      goalChance: 0.02,
      foulsPerMatch: 20,
      ...config,
    } as SimulationConfig;
    this.possession = Math.random() > 0.5 ? 'home' : 'away';
    this.time = 0;
    this.homeScore = 0;
    this.awayScore = 0;
  }

  /**
   * Run simulation for first half
   */
  simulateFirstHalf(): MatchEventData[] {
    this.events = [];
    const duration = this.config.minTime + Math.random() * (this.config.maxTime - this.config.minTime);

    while (this.time < duration * 60) {
      this.tick();
    }

    return this.events;
  }

  /**
   * Run simulation for full match
   */
  simulateFullMatch(): {
    homeScore: number;
    awayScore: number;
    events: MatchEventData[];
  } {
    this.events = [];
    this.time = 0;
    this.homeScore = 0;
    this.awayScore = 0;

    // First half
    const firstHalfDuration =
      45 * 60 +
      Math.random() * 5 * 60;
    while (this.time < firstHalfDuration) {
      this.tick();
    }

    // Second half
    const secondHalfDuration = firstHalfDuration + 45 * 60 + Math.random() * 5 * 60;
    while (this.time < secondHalfDuration) {
      this.tick();
    }

    return {
      homeScore: this.homeScore,
      awayScore: this.awayScore,
      events: this.events,
    };
  }

  /**
   * Single simulation tick
   */
  private tick(): void {
    this.time += 1 / this.config.tickRate;

    // Randomly change possession
    if (Math.random() < 0.01) {
      this.possession = this.possession === 'home' ? 'away' : 'home';
      this.events.push({
        event: MatchEvent.POSSESSION_CHANGE,
        time: this.time,
        team: this.possession,
      });
    }

    // Attempt shot
    if (Math.random() < this.config.goalChance / 60) {
      this.events.push({
        event: MatchEvent.SHOT,
        time: this.time,
        team: this.possession,
      });

      // Possible goal from shot
      if (Math.random() < 0.15) {
        if (this.possession === 'home') {
          this.homeScore++;
        } else {
          this.awayScore++;
        }
        this.events.push({
          event: MatchEvent.GOAL,
          time: this.time,
          team: this.possession,
          data: {
            homeScore: this.homeScore,
            awayScore: this.awayScore,
          },
        });
      }
    }

    // Random fouls
    if (Math.random() < (this.config.foulsPerMatch / 2700) / 60) {
      const foulTeam = Math.random() > 0.5 ? 'home' : 'away';
      this.events.push({
        event: MatchEvent.FOUL,
        time: this.time,
        team: foulTeam,
      });
    }
  }

  /**
   * Get current match state
   */
  getState() {
    return {
      time: Math.floor(this.time),
      homeScore: this.homeScore,
      awayScore: this.awayScore,
      possession: this.possession,
      events: this.events,
    };
  }

  /**
   * Add event manually
   */
  addEvent(event: MatchEventData): void {
    this.events.push(event);
  }

  /**
   * Get events by type
   */
  getEventsByType(type: MatchEvent): MatchEventData[] {
    return this.events.filter((e) => e.event === type);
  }

  /**
   * Get match statistics
   */
  getStatistics() {
    return {
      totalEvents: this.events.length,
      possessionChanges: this.getEventsByType(
        MatchEvent.POSSESSION_CHANGE
      ).length,
      shots: this.getEventsByType(MatchEvent.SHOT).length,
      goals: this.getEventsByType(MatchEvent.GOAL).length,
      fouls: this.getEventsByType(MatchEvent.FOUL).length,
    };
  }
}
