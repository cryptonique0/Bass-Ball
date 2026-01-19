// Collision integration for the match simulation engine
// Handles collision detection, resolution, and event dispatch

import { MatchState, PlayerState } from '@/types/match';
import {
  CollisionResult,
  checkAllCollisions,
  resolveCollision,
  DEFAULT_COLLISION_CONFIG,
  CollisionConfig,
} from './collision';

/**
 * Collision event emitted during match
 */
export interface CollisionEvent {
  tick: number;
  type: 'player-ball' | 'player-player';
  playerId1: string;
  playerId2?: string; // For player-player collisions
  contactPoint: { x: number; y: number };
  normal: { x: number; y: number };
  impulse: number;
  foulTriggered?: boolean;
  foulType?: 'tackle' | 'collision' | 'dangerous-play';
}

/**
 * Match engine collision handler
 */
export class CollisionHandler {
  private config: CollisionConfig;
  private playerVelocities: Map<string, { vx: number; vy: number }>;
  private collisionEvents: CollisionEvent[] = [];
  private frameSeparationIterations: number = 3; // Iterative collision resolution

  constructor(config?: Partial<CollisionConfig>) {
    this.config = { ...DEFAULT_COLLISION_CONFIG, ...config };
    this.playerVelocities = new Map();
  }

  /**
   * Update player velocity tracking for next frame
   */
  updatePlayerVelocity(playerId: string, vx: number, vy: number): void {
    this.playerVelocities.set(playerId, { vx, vy });
  }

  /**
   * Process collisions for the current frame
   * Called after physics simulation but before state update
   */
  processCollisions(matchState: MatchState, tick: number): CollisionEvent[] {
    this.collisionEvents = [];

    // Check all collisions
    const collisions = checkAllCollisions(matchState, this.playerVelocities, this.config);

    // Resolve collisions with multiple iterations
    // (ensures no penetration even with fast-moving objects)
    for (let iteration = 0; iteration < this.frameSeparationIterations; iteration++) {
      for (const collision of collisions) {
        const player1 = this.findPlayer(matchState, collision.entity1Id);
        const player2 = collision.entity2Id ? this.findPlayer(matchState, collision.entity2Id) : undefined;

        if (player1 && this.playerVelocities.has(player1.id)) {
          const p1WithVel = { ...player1, ...this.playerVelocities.get(player1.id)! };
          const p2WithVel = player2 && this.playerVelocities.has(player2.id)
            ? { ...player2, ...this.playerVelocities.get(player2.id)! }
            : undefined;

          resolveCollision(collision, p1WithVel, p2WithVel, matchState.ball, this.config);

          // Update positions
          if (player1.position) {
            player1.position = p1WithVel.position;
          }
          if (p2WithVel && player2) {
            player2.position = p2WithVel.position;
          }

          // Update velocities
          this.playerVelocities.set(player1.id, { vx: p1WithVel.vx, vy: p1WithVel.vy });
          if (p2WithVel && player2) {
            this.playerVelocities.set(player2.id, { vx: p2WithVel.vx, vy: p2WithVel.vy });
          }
        }
      }
    }

    // Generate collision events for logging/replay
    for (const collision of collisions) {
      if (collision.collided && collision.contactPoint && collision.normal) {
        const impulseMagnitude = Math.hypot(
          collision.momentumTransfer?.vx || 0,
          collision.momentumTransfer?.vy || 0
        );

        const event: CollisionEvent = {
          tick,
          type: collision.type,
          playerId1: collision.entity1Id || '',
          playerId2: collision.entity2Id,
          contactPoint: collision.contactPoint,
          normal: collision.normal,
          impulse: impulseMagnitude,
          foulTriggered: collision.foulTriggered,
          foulType: collision.foulType,
        };

        this.collisionEvents.push(event);
      }
    }

    return this.collisionEvents;
  }

  /**
   * Get all collision events from current frame
   */
  getCollisionEvents(): CollisionEvent[] {
    return this.collisionEvents;
  }

  /**
   * Clear events for next frame
   */
  clearEvents(): void {
    this.collisionEvents = [];
  }

  /**
   * Check if a foul should be given
   */
  shouldTriggerFoul(event: CollisionEvent): boolean {
    return event.foulTriggered === true;
  }

  /**
   * Get foul details
   */
  getFoulDetails(event: CollisionEvent): {
    type: string;
    severity: 'yellow' | 'red';
    offendingPlayerId: string;
  } | null {
    if (!event.foulTriggered) return null;

    const severity: 'yellow' | 'red' =
      event.foulType === 'dangerous-play' ? 'red' : event.foulType === 'tackle' ? 'yellow' : 'yellow';

    return {
      type: event.foulType || 'collision',
      severity,
      offendingPlayerId: event.playerId1,
    };
  }

  /**
   * Find player in match state by ID
   */
  private findPlayer(matchState: MatchState, playerId?: string): (PlayerState & { vx: number; vy: number }) | null {
    if (!playerId) return null;

    for (const team of [matchState.homeTeam, matchState.awayTeam]) {
      const player = team.players.find((p) => p.id === playerId);
      if (player && this.playerVelocities.has(playerId)) {
        return { ...player, ...this.playerVelocities.get(playerId)! };
      }
    }

    return null;
  }

  /**
   * Get collision statistics
   */
  getCollisionStats(): {
    playerBallCollisions: number;
    playerPlayerCollisions: number;
    foulsTriggered: number;
  } {
    const stats = {
      playerBallCollisions: 0,
      playerPlayerCollisions: 0,
      foulsTriggered: 0,
    };

    for (const event of this.collisionEvents) {
      if (event.type === 'player-ball') {
        stats.playerBallCollisions++;
      } else if (event.type === 'player-player') {
        stats.playerPlayerCollisions++;
      }

      if (event.foulTriggered) {
        stats.foulsTriggered++;
      }
    }

    return stats;
  }
}

/**
 * Integration with match engine tick
 * Call this every frame in the match simulation loop
 */
export class MatchCollisionSystem {
  private handler: CollisionHandler;
  private collisionLog: CollisionEvent[] = [];

  constructor(config?: Partial<CollisionConfig>) {
    this.handler = new CollisionHandler(config);
  }

  /**
   * Main update function for match tick
   */
  tick(matchState: MatchState, tickNumber: number): {
    collisionEvents: CollisionEvent[];
    fouls: Array<{ playerId: string; type: string; severity: 'yellow' | 'red' }>;
  } {
    // Process collisions
    const collisions = this.handler.processCollisions(matchState, tickNumber);
    this.collisionLog.push(...collisions);

    // Generate fouls from collisions
    const fouls = [];
    for (const collision of collisions) {
      const foul = this.handler.getFoulDetails(collision);
      if (foul) {
        fouls.push({
          playerId: foul.offendingPlayerId,
          type: foul.type,
          severity: foul.severity,
        });
      }
    }

    this.handler.clearEvents();

    return {
      collisionEvents: collisions,
      fouls,
    };
  }

  /**
   * Update player velocities for collision tracking
   */
  setPlayerVelocity(playerId: string, vx: number, vy: number): void {
    this.handler.updatePlayerVelocity(playerId, vx, vy);
  }

  /**
   * Get collision statistics for match
   */
  getMatchCollisionStats(): {
    totalCollisions: number;
    playerBallCollisions: number;
    playerPlayerCollisions: number;
    totalFouls: number;
  } {
    const stats = this.handler.getCollisionStats();
    return {
      totalCollisions: stats.playerBallCollisions + stats.playerPlayerCollisions,
      playerBallCollisions: stats.playerBallCollisions,
      playerPlayerCollisions: stats.playerPlayerCollisions,
      totalFouls: stats.foulsTriggered,
    };
  }

  /**
   * Get full collision log for replay
   */
  getCollisionLog(): CollisionEvent[] {
    return this.collisionLog;
  }

  /**
   * Clear log (for memory management)
   */
  clearLog(): void {
    this.collisionLog = [];
  }
}
