/**
 * Ball physics engine for realistic ball movement and interaction
 * 
 * Implements realistic physics including:
 * - Gravity and friction
 * - Boundary collisions with restitution
 * - Magnus effect for ball spin/curve
 * - Speed limiting
 */

/** 2D vector for position and velocity */
export interface Vector2D {
  x: number;
  y: number;
}

/** Complete ball state at any point in time */
export interface BallState {
  /** Current position in meters */
  position: Vector2D;
  /** Current velocity in meters per second */
  velocity: Vector2D;
  /** Current acceleration in meters per second squared */
  acceleration: Vector2D;
  /** Rotation in radians per frame */
  spin: number;
  /** Timestamp of last touch in milliseconds */
  lastTouched: number;
}

/** Physics simulation configuration */
export interface PhysicsConfig {
  /** Gravity constant (meters per second squared) */
  gravity: number;
  /** Friction coefficient (0-1, where 1 = no friction) */
  friction: number;
  /** Bounciness/elasticity (0-1, where 1 = perfectly elastic) */
  restitution: number;
  /** Maximum ball speed in meters per second */
  maxSpeed: number;
  /** Field width in meters */
  fieldWidth: number;
  /** Field height in meters */
  fieldHeight: number;
}

/**
 * Ball physics simulation engine
 * 
 * @example
 * ```ts
 * const physics = new BallPhysics(
 *   { x: 50, y: 50 },
 *   { gravity: 9.8, friction: 0.98, restitution: 0.7, maxSpeed: 30, fieldWidth: 100, fieldHeight: 60 }
 * );
 * physics.applyForce(10, 5);
 * physics.update(1/60); // 60 FPS
 * const state = physics.getState();
 * ```
 */
export class BallPhysics {
  private ball: BallState;
  private config: PhysicsConfig;
  
  /** Minimum velocity threshold to prevent jittering (m/s) */
  private static readonly MIN_VELOCITY = 0.01;
  /** Maximum spin rate in radians per second */
  private static readonly MAX_SPIN = Math.PI * 2;

  constructor(initialPosition: Vector2D, config: PhysicsConfig) {
    this.ball = {
      position: { ...initialPosition },
      velocity: { x: 0, y: 0 },
      acceleration: { x: 0, y: 0 },
      spin: 0,
      lastTouched: Date.now(),
    };
    this.config = this.validateConfig(config);
  }

  /**
   * Validate and normalize physics configuration
   */
  private validateConfig(config: PhysicsConfig): PhysicsConfig {
    return {
      gravity: Math.max(0, config.gravity),
      friction: Math.max(0, Math.min(1, config.friction)),
      restitution: Math.max(0, Math.min(1, config.restitution)),
      maxSpeed: Math.max(1, config.maxSpeed),
      fieldWidth: Math.max(1, config.fieldWidth),
      fieldHeight: Math.max(1, config.fieldHeight),
    };
  }

  /**
   * Apply force to the ball (e.g., from a kick or collision)
   * 
   * @param forceX - Force in X direction (meters per second squared)
   * @param forceY - Force in Y direction (meters per second squared)
   */
  applyForce(forceX: number, forceY: number): void {
    if (!isFinite(forceX) || !isFinite(forceY)) {
      console.warn('[BallPhysics] Invalid force applied:', { forceX, forceY });
      return;
    }
    this.ball.acceleration.x += forceX;
    this.ball.acceleration.y += forceY;
    this.ball.lastTouched = Date.now();
  }

  /**
   * Update ball physics for one frame
   * 
   * @param deltaTime - Time elapsed since last update in seconds
   */
  update(deltaTime: number): void {
    // Clamp deltaTime to prevent large jumps
    const dt = Math.min(deltaTime, 0.1);
    
    // Apply gravity
    this.ball.acceleration.y += this.config.gravity;

    // Apply Magnus effect if ball is spinning
    if (Math.abs(this.ball.spin) > 0.001) {
      const magnus = this.calculateMagnusEffect();
      this.ball.acceleration.x += magnus.x;
      this.ball.acceleration.y += magnus.y;
    }

    // Update velocity
    this.ball.velocity.x += this.ball.acceleration.x * dt;
    this.ball.velocity.y += this.ball.acceleration.y * dt;

    // Apply friction
    this.ball.velocity.x *= 1 - this.config.friction * dt;
    this.ball.velocity.y *= 1 - this.config.friction * dt;
    
    // Stop ball if velocity is negligible
    if (Math.abs(this.ball.velocity.x) < BallPhysics.MIN_VELOCITY) {
      this.ball.velocity.x = 0;
    }
    if (Math.abs(this.ball.velocity.y) < BallPhysics.MIN_VELOCITY) {
      this.ball.velocity.y = 0;
    }

    // Limit speed
    const speed = Math.sqrt(
      this.ball.velocity.x ** 2 + this.ball.velocity.y ** 2
    );
    if (speed > this.config.maxSpeed) {
      const scale = this.config.maxSpeed / speed;
      this.ball.velocity.x *= scale;
      this.ball.velocity.y *= scale;
    }

    // Update position
    this.ball.position.x += this.ball.velocity.x * dt;
    this.ball.position.y += this.ball.velocity.y * dt;

    // Reset acceleration
    this.ball.acceleration.x = 0;
    this.ball.acceleration.y = 0;

    // Handle boundary collisions
    this.handleBoundaryCollisions();

    // Update spin with damping
    this.ball.spin *= 0.95;
    if (Math.abs(this.ball.spin) < 0.01) {
      this.ball.spin = 0;
    }
  }

  /**
   * Handle collisions with field boundaries
   */
  private handleBoundaryCollisions(): void {
    if (this.ball.position.x < 0) {
      this.ball.position.x = 0;
      this.ball.velocity.x *= -this.config.restitution;
    }
    if (this.ball.position.x > this.config.fieldWidth) {
      this.ball.position.x = this.config.fieldWidth;
      this.ball.velocity.x *= -this.config.restitution;
    }
    if (this.ball.position.y < 0) {
      this.ball.position.y = 0;
      this.ball.velocity.y *= -this.config.restitution;
    }
    if (this.ball.position.y > this.config.fieldHeight) {
      this.ball.position.y = this.config.fieldHeight;
      this.ball.velocity.y *= -this.config.restitution;
    }
  }

  /**
   * Get current ball state
   */
  getState(): BallState {
    return { ...this.ball };
  }

  /**
   * Set ball spin (from curved passes)
   */
  setSpin(spin: number): void {
    this.ball.spin = Math.max(-Math.PI * 2, Math.min(Math.PI * 2, spin));
  }

  /**
   * Calculate Magnus effect (curve) from spin
   */
  calculateMagnusEffect(): Vector2D {
    const magnusForce = 0.15;
    return {
      x: -this.ball.spin * this.ball.velocity.y * magnusForce,
      y: this.ball.spin * this.ball.velocity.x * magnusForce,
    };
  }

  /**
   * Reset ball to initial state
   */
  reset(position: Vector2D): void {
    this.ball.position = { ...position };
    this.ball.velocity = { x: 0, y: 0 };
    this.ball.acceleration = { x: 0, y: 0 };
    this.ball.spin = 0;
  }
}
