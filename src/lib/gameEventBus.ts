// Game event types and handlers
export enum GameEventType {
  MATCH_START = 'match_start',
  GOAL = 'goal',
  FOUL = 'foul',
  SUBSTITUTION = 'substitution',
  MATCH_END = 'match_end',
  INJURY = 'injury',
  YELLOW_CARD = 'yellow_card',
  RED_CARD = 'red_card',
}

export interface GameEvent {
  type: GameEventType;
  timestamp: number;
  playerId?: string;
  teamId?: string;
  data?: Record<string, any>;
}

export class GameEventBus {
  private handlers: Map<GameEventType, Set<(event: GameEvent) => void>> = new Map();

  on(type: GameEventType, handler: (event: GameEvent) => void): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);

    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }

  emit(event: GameEvent): void {
    const handlers = this.handlers.get(event.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error('Error in event handler:', error);
        }
      });
    }
  }

  clear(type?: GameEventType): void {
    if (type) {
      this.handlers.delete(type);
    } else {
      this.handlers.clear();
    }
  }
}

export const gameEventBus = new GameEventBus();
