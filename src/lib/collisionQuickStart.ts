// COLLISION SYSTEM QUICK REFERENCE
// ================================
// Integration guide for Bass Ball match engine

import { MatchState } from '@/types/match';
import { MatchCollisionSystem, CollisionEvent } from './collisionHandler';
import { COLLISION_PRESETS } from './collisionSystem';

/**
 * QUICK START: Using the Collision System
 */
export class MatchEngineWithCollisions {
  private collisionSystem: MatchCollisionSystem;
  private matchState: MatchState;

  constructor(matchState: MatchState) {
    this.matchState = matchState;
    // Initialize with competitive preset
    this.collisionSystem = new MatchCollisionSystem(COLLISION_PRESETS.competitive);
  }

  /**
   * Called every physics frame (60 Hz)
   */
  updateFrame(deltaTime: number): void {
    // 1. Update player positions and velocities
    this.updatePhysics(deltaTime);

    // 2. Track velocities for collision detection
    this.updateCollisionVelocities();

    // 3. PROCESS ALL COLLISIONS
    const { collisionEvents, fouls } = this.collisionSystem.tick(this.matchState, this.matchState.tick);

    // 4. Handle collision events
    this.handleCollisionEvents(collisionEvents);

    // 5. Apply fouls
    this.applyFouls(fouls);

    // 6. Increment tick
    this.matchState.tick++;
  }

  private updatePhysics(deltaTime: number): void {
    // Your physics update code here
    // Update player positions, velocities
    // Apply forces, friction, etc.
  }

  private updateCollisionVelocities(): void {
    // Tell collision system about current velocities
    for (const player of [...this.matchState.homeTeam.players, ...this.matchState.awayTeam.players]) {
      // Get velocity from your physics system
      const velocity = this.getPlayerVelocity(player.id);
      this.collisionSystem.setPlayerVelocity(player.id, velocity.vx, velocity.vy);
    }
  }

  private handleCollisionEvents(events: CollisionEvent[]): void {
    for (const event of events) {
      // Log collision for replay
      console.log(`Collision at tick ${event.tick}:`, {
        type: event.type,
        player1: event.playerId1,
        player2: event.playerId2,
        impulse: event.impulse,
        foul: event.foulTriggered,
      });

      // Handle special collision effects
      if (event.type === 'player-ball') {
        this.handleBallCollision(event);
      } else if (event.type === 'player-player') {
        this.handlePlayerCollision(event);
      }
    }
  }

  private handleBallCollision(event: CollisionEvent): void {
    // Ball was touched by player
    // Update possession, control, etc.
    const player = this.findPlayer(event.playerId1);
    if (player) {
      this.updateBallPossession(player);
      // Apply touch event to replay
    }
  }

  private handlePlayerCollision(event: CollisionEvent): void {
    // Two players collided
    // Apply any special effects, animations, etc.
    if (event.impulse > 15) {
      // High-impact collision
      this.playCollisionEffect(event.contactPoint, 'high');
    }
  }

  private applyFouls(fouls: Array<{ playerId: string; type: string; severity: 'yellow' | 'red' }>): void {
    for (const foul of fouls) {
      const player = this.findPlayer(foul.playerId);
      if (!player) continue;

      if (foul.severity === 'yellow') {
        player.yellowCards = (player.yellowCards || 0) + 1;
        console.log(`${player.id} receives yellow card (${player.yellowCards})`);

        if (player.yellowCards >= 2) {
          this.applyRedCard(player);
        }
      } else if (foul.severity === 'red') {
        this.applyRedCard(player);
      }

      // Award set piece
      this.awardSetPiece(foul.type, foul.playerId);
    }
  }

  private applyRedCard(player: any): void {
    console.log(`${player.id} is sent off!`);
    player.sentOff = true;
    // Remove from pitch, update team formation
  }

  private awardSetPiece(type: string, fouldedBy: string): void {
    console.log(`Free kick awarded (type: ${type})`);
  }

  // Helper methods
  private getPlayerVelocity(playerId: string): { vx: number; vy: number } {
    // Return from your physics engine
    return { vx: 0, vy: 0 };
  }

  private findPlayer(playerId: string): any {
    return [...this.matchState.homeTeam.players, ...this.matchState.awayTeam.players].find((p) => p.id === playerId);
  }

  private updateBallPossession(player: any): void {
    // Update possession
  }

  private playCollisionEffect(point: { x: number; y: number }, severity: string): void {
    // Play visual effect
  }

  /**
   * Get match collision statistics
   */
  getCollisionStats() {
    return this.collisionSystem.getMatchCollisionStats();
  }

  /**
   * Get replay data with all collisions
   */
  getReplayData() {
    return {
      collisions: this.collisionSystem.getCollisionLog(),
      stats: this.collisionSystem.getMatchCollisionStats(),
    };
  }
}

/**
 * COLLISION CONFIGURATION CHEAT SHEET
 */
export const CONFIGURATION_GUIDE = `
ARCADE MODE:
  - Fewer fouls (35 N threshold)
  - More momentum transfer (0.8x)
  - Forgiving physics (0.02m penetration tolerance)
  - Use for: Casual play, AI training
  - Feels like: FIFA arcade mode

REALISTIC MODE:
  - Many fouls (18 N threshold)
  - Less momentum transfer (0.3x)
  - Strict physics (0.005m penetration tolerance)
  - Use for: Simulation enthusiasts
  - Feels like: Real football physics

COMPETITIVE MODE (Default):
  - Balanced fouls (25 N threshold)
  - Standard momentum transfer (0.5x)
  - Standard physics (0.01m penetration tolerance)
  - Use for: Competitive ranked matches
  - Feels like: Balanced game feel

DEBUG MODE:
  - Moderate fouls (20 N threshold)
  - Moderate momentum transfer (0.4x)
  - Detailed logging enabled
  - Use for: Development and testing
`;

/**
 * FOUL RULES SUMMARY
 */
export const FOUL_DETECTION = `
COLLISION FORCE is calculated from:
  - Player mass (~80kg)
  - Relative velocity between colliders
  - Contact angle/direction
  - Duration of contact

FOUL TYPES:

1. COLLISION (Yellow Card)
   - Force: Normal (within 1x threshold)
   - Frontal contact
   - Common in physical play

2. RECKLESS TACKLE (Yellow Card)
   - Force: High (normal threshold)
   - Contact from behind (outside attacker's 40° cone)
   - Defender didn't see it coming

3. DANGEROUS PLAY (Red Card)
   - Force: Very high (1.5x+ threshold)
   - High-speed impact
   - Risk of serious injury
   - Direct dismissal, no warning

FOUL THRESHOLD = 25 N (Newton-units of impulse)
This is roughly equivalent to:
  - Two players at 10 m/s relative velocity (~22 mph)
  - Head-on collision with full body mass
  - Typical "hard challenge" in football
`;

/**
 * COLLISION DETECTION ORDER (Important for Determinism)
 */
export const DETECTION_ORDER = `
Each frame processes collisions in this order:
1. Player-Ball collisions (all players vs ball)
2. Player-Player collisions (all pairs)

Resolution:
3. Iterate 3 times to ensure zero penetration
4. Apply momentum transfers and velocity changes
5. Update match state
6. Log collision events

This deterministic order ensures:
- Same input → Same output (verifiable replay)
- No random elements
- Consistent physics simulation
- Cross-platform determinism
`;

/**
 * PERFORMANCE METRICS
 */
export const PERFORMANCE = `
COLLISION COMPUTATION PER FRAME:

Players: 22
Ball: 1
Potential collisions:
  - Player-ball: 22
  - Player-player: 231 (22 choose 2)
  - Total checks: 253

Per collision:
  - Distance calculation: ~10 ops
  - Penetration depth: ~20 ops
  - Normal calculation: ~20 ops
  - Momentum transfer (if needed): ~30 ops
  - Total per check: ~50 ops (average)

Total per frame: 253 × 50 = ~12,650 operations
At 60 Hz: ~759,000 operations/second
CPU usage: <1% on modern hardware

Memory:
  - Collision event buffer: ~1-2 KB per frame
  - Log storage: ~200 bytes per collision event
  - 100 collisions per match: ~20 KB log

Conclusion: Highly optimized, production-ready
`;

export default {
  MatchEngineWithCollisions,
  CONFIGURATION_GUIDE,
  FOUL_DETECTION,
  DETECTION_ORDER,
  PERFORMANCE,
};
