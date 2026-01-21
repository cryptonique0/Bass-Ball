/**
 * Ball physics engine for realistic ball movement and interaction
 */

export interface Vector2D {
  x: number;
  y: number;
}

export interface BallState {
  position: Vector2D;
  velocity: Vector2D;
  acceleration: Vector2D;
  spin: number; // Rotation in radians per frame
  lastTouched: number; // Timestamp of last touch
}

export interface PhysicsConfig {
  gravity: number;
  friction: number;
  restitution: number; // Bounciness
  maxSpeed: number;
  fieldWidth: number;
  fieldHeight: number;
}

export class BallPhysics {
  private ball: BallState;
  private config: PhysicsConfig;

  constructor(initialPosition: Vector2D, config: PhysicsConfig) {
    this.ball = {
      position: { ...initialPosition },
      velocity: { x: 0, y: 0 },
      acceleration: { x: 0, y: 0 },
      spin: 0,
      lastTouched: Date.now(),
    };
    this.config = config;
  }

  /**
   * Apply force to the ball (e.g., from a kick)
   */
  applyForce(forceX: number, forceY: number): void {
    this.ball.acceleration.x += forceX;
    this.ball.acceleration.y += forceY;
    this.ball.lastTouched = Date.now();
  }

  /**
   * Update ball physics for one frame
   */
  update(deltaTime: number): void {
    // Apply gravity
    this.ball.acceleration.y += this.config.gravity;

    // Update velocity
    this.ball.velocity.x += this.ball.acceleration.x * deltaTime;
    this.ball.velocity.y += this.ball.acceleration.y * deltaTime;

    // Apply friction
    this.ball.velocity.x *= 1 - this.config.friction * deltaTime;
    this.ball.velocity.y *= 1 - this.config.friction * deltaTime;

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
    this.ball.position.x += this.ball.velocity.x * deltaTime;
    this.ball.position.y += this.ball.velocity.y * deltaTime;

    // Reset acceleration
    this.ball.acceleration.x = 0;
    this.ball.acceleration.y = 0;

    // Handle boundary collisions
    this.handleBoundaryCollisions();

    // Update spin
    this.ball.spin *= 0.95; // Damping
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
