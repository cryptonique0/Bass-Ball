// Collision detection and resolution system for Bass Ball
// Handles player-to-ball and player-to-player physics

import { MatchState, PlayerState } from '@/types/match';

/**
 * Collision geometry types
 */
export interface CollisionGeometry {
  type: 'capsule' | 'circle';
  x: number;
  y: number;
  radius: number;
  halfHeight?: number; // For capsule (extends above and below center)
}

/**
 * Collision result after resolution
 */
export interface CollisionResult {
  collided: boolean;
  type: 'player-ball' | 'player-player' | 'none';
  entity1Id?: string;
  entity2Id?: string;
  penetration?: number;
  contactPoint?: { x: number; y: number };
  normal?: { x: number; y: number };
  foulTriggered?: boolean;
  foulType?: 'tackle' | 'collision' | 'dangerous-play';
  momentumTransfer?: { vx: number; vy: number };
}

/**
 * Collision system parameters
 */
export interface CollisionConfig {
  playerCapsuleRadius: number; // 0.4m typical
  playerCapsuleHeight: number; // 1.8m typical
  ballRadius: number; // 0.11m typical
  fieldWidth: number; // meters
  fieldHeight: number; // meters
  maxPenetration: number; // 0.01m - no penetration tolerance
  momentumTransferCap: number; // 0.5 - max velocity transfer ratio
  foulForceThreshold: number; // 25 m/s^2 - impulse magnitude
  foulContactAngle: number; // 0.7 radians (40 degrees)
}

/**
 * Vector utilities
 */
const Vec2 = {
  length: (v: { x: number; y: number }) => Math.sqrt(v.x * v.x + v.y * v.y),
  dot: (a: { x: number; y: number }, b: { x: number; y: number }) => a.x * b.x + a.y * b.y,
  normalize: (v: { x: number; y: number }) => {
    const len = Vec2.length(v);
    return len > 0 ? { x: v.x / len, y: v.y / len } : { x: 0, y: 0 };
  },
  scale: (v: { x: number; y: number }, s: number) => ({ x: v.x * s, y: v.y * s }),
  add: (a: { x: number; y: number }, b: { x: number; y: number }) => ({ x: a.x + b.x, y: a.y + b.y }),
  subtract: (a: { x: number; y: number }, b: { x: number; y: number }) => ({ x: a.x - b.x, y: a.y - b.y }),
  clamp: (v: { x: number; y: number }, max: number) => {
    const len = Vec2.length(v);
    return len > max ? Vec2.scale(v, max / len) : v;
  },
};

/**
 * Player-to-Ball Collision Detection
 * Uses capsule (player) vs circle (ball) detection
 */
export function detectPlayerBallCollision(
  player: PlayerState & { vx: number; vy: number },
  ball: { x: number; y: number; vx: number; vy: number },
  config: CollisionConfig
): CollisionResult {
  // Player is a capsule, ball is a circle
  const playerGeo: CollisionGeometry = {
    type: 'capsule',
    x: player.position.x,
    y: player.position.y,
    radius: config.playerCapsuleRadius,
    halfHeight: config.playerCapsuleHeight / 2,
  };

  const ballGeo: CollisionGeometry = {
    type: 'circle',
    x: ball.x,
    y: ball.y,
    radius: config.ballRadius,
  };

  return detectCapsuleCircleCollision(playerGeo, ballGeo, config);
}

/**
 * Capsule vs Circle collision detection
 * Priority: No penetration allowed
 */
function detectCapsuleCircleCollision(
  capsule: CollisionGeometry,
  circle: CollisionGeometry,
  config: CollisionConfig
): CollisionResult {
  if (capsule.type !== 'capsule' || circle.type !== 'circle') {
    return { collided: false, type: 'none' };
  }

  const { x: px, y: py } = capsule;
  const { x: cx, y: cy } = circle;
  const capsuleTop = py + (capsule.halfHeight || 0);
  const capsuleBottom = py - (capsule.halfHeight || 0);

  // Find closest point on capsule to circle center
  let closestY = cy;
  if (cy > capsuleTop) {
    closestY = capsuleTop;
  } else if (cy < capsuleBottom) {
    closestY = capsuleBottom;
  }

  // Distance from capsule center to closest point on circle
  const dx = cx - px;
  const dy = closestY - py;
  const distanceSquared = dx * dx + dy * dy;
  const minDistance = capsule.radius + circle.radius;
  const minDistanceSquared = minDistance * minDistance;

  if (distanceSquared >= minDistanceSquared) {
    return { collided: false, type: 'none' };
  }

  const distance = Math.sqrt(distanceSquared);
  const penetration = minDistance - distance;

  // Collision detected
  const contactNormal = distance > 0 ? Vec2.normalize({ x: dx, y: dy }) : { x: 0, y: -1 };
  const contactPoint = {
    x: px + contactNormal.x * (capsule.radius + penetration / 2),
    y: py + contactNormal.y * (capsule.radius + penetration / 2),
  };

  return {
    collided: true,
    type: 'player-ball',
    penetration: Math.max(0, penetration), // Should be zero after resolution
    contactPoint,
    normal: contactNormal,
  };
}

/**
 * Player-to-Player Collision Detection
 * Uses circle vs circle (soft collisions)
 */
export function detectPlayerPlayerCollision(
  player1: PlayerState & { vx: number; vy: number },
  player2: PlayerState & { vx: number; vy: number },
  config: CollisionConfig
): CollisionResult {
  const p1Geo: CollisionGeometry = {
    type: 'circle',
    x: player1.position.x,
    y: player1.position.y,
    radius: config.playerCapsuleRadius,
  };

  const p2Geo: CollisionGeometry = {
    type: 'circle',
    x: player2.position.x,
    y: player2.position.y,
    radius: config.playerCapsuleRadius,
  };

  return detectCircleCircleCollision(p1Geo, p2Geo, player1, player2, config);
}

/**
 * Circle vs Circle collision detection
 * Used for player-to-player interactions
 */
function detectCircleCircleCollision(
  circle1: CollisionGeometry,
  circle2: CollisionGeometry,
  player1: PlayerState & { vx: number; vy: number },
  player2: PlayerState & { vx: number; vy: number },
  config: CollisionConfig
): CollisionResult {
  const dx = circle2.x - circle1.x;
  const dy = circle2.y - circle1.y;
  const distanceSquared = dx * dx + dy * dy;
  const minDistance = circle1.radius + circle2.radius;
  const minDistanceSquared = minDistance * minDistance;

  if (distanceSquared >= minDistanceSquared) {
    return { collided: false, type: 'none' };
  }

  const distance = Math.sqrt(distanceSquared);
  const penetration = minDistance - distance;
  const contactNormal = distance > 0 ? Vec2.normalize({ x: dx, y: dy }) : { x: 0, y: 1 };

  // Calculate relative velocity
  const relativeVelocity = {
    x: player2.vx - player1.vx,
    y: player2.vy - player1.vy,
  };

  const velocityAlongNormal = Vec2.dot(relativeVelocity, contactNormal);

  // Only collide if moving toward each other
  if (velocityAlongNormal >= 0) {
    return { collided: false, type: 'none' };
  }

  // Calculate impulse magnitude (soft collision - capped momentum transfer)
  const restitution = 0.4; // Bounce factor
  const impulseMagnitude = -(1 + restitution) * velocityAlongNormal;
  const cappedMagnitude = Math.min(impulseMagnitude, config.momentumTransferCap);

  // Momentum transfer (split evenly between players for equal mass)
  const momentumTransfer = Vec2.scale(contactNormal, cappedMagnitude * 0.5);

  // Check for foul based on force threshold and contact angle
  const forceMagnitude = Math.abs(impulseMagnitude);
  const isBehindContact = Vec2.dot(
    { x: player1.position.x - player2.position.x, y: player1.position.y - player2.position.y },
    contactNormal
  ) > config.playerCapsuleRadius;

  const foulTriggered =
    forceMagnitude > config.foulForceThreshold ||
    (isBehindContact && forceMagnitude > config.foulForceThreshold * 0.7);

  const foulType: 'tackle' | 'collision' | 'dangerous-play' = isBehindContact
    ? 'tackle'
    : forceMagnitude > config.foulForceThreshold * 1.5
      ? 'dangerous-play'
      : 'collision';

  const contactPoint = {
    x: circle1.x + contactNormal.x * circle1.radius,
    y: circle1.y + contactNormal.y * circle1.radius,
  };

  return {
    collided: true,
    type: 'player-player',
    entity1Id: player1.id,
    entity2Id: player2.id,
    penetration: Math.max(0, penetration),
    contactPoint,
    normal: contactNormal,
    momentumTransfer,
    foulTriggered,
    foulType: foulTriggered ? foulType : undefined,
  };
}

/**
 * Collision Resolution: Separate entities to prevent penetration
 */
export function resolveCollision(
  collision: CollisionResult,
  player1: PlayerState & { vx: number; vy: number },
  player2?: PlayerState & { vx: number; vy: number },
  ball?: { x: number; y: number; vx: number; vy: number },
  config?: CollisionConfig
): void {
  if (!collision.collided || !collision.normal) return;

  const penetration = collision.penetration || 0;
  const separationVector = Vec2.scale(collision.normal, penetration / 2 + 0.001); // Add tiny buffer

  if (collision.type === 'player-ball') {
    // Push player away from ball
    player1.position.x -= separationVector.x;
    player1.position.y -= separationVector.y;

    // Push ball away from player
    if (ball) {
      ball.x += separationVector.x;
      ball.y += separationVector.y;
    }
  } else if (collision.type === 'player-player' && player2) {
    // Push both players apart equally
    player1.position.x -= separationVector.x;
    player1.position.y -= separationVector.y;
    player2.position.x += separationVector.x;
    player2.position.y += separationVector.y;

    // Apply momentum transfer if applicable
    if (collision.momentumTransfer && config) {
      // Clamp momentum transfer
      player1.vx -= collision.momentumTransfer.x;
      player1.vy -= collision.momentumTransfer.y;
      player2.vx += collision.momentumTransfer.x;
      player2.vy += collision.momentumTransfer.y;
    }
  }
}

/**
 * Check all collisions in a match state
 */
export function checkAllCollisions(
  matchState: MatchState,
  playerVelocities: Map<string, { vx: number; vy: number }>,
  config: CollisionConfig
): CollisionResult[] {
  const collisions: CollisionResult[] = [];
  const allPlayers = [...matchState.homeTeam.players, ...matchState.awayTeam.players];

  // Player-to-Ball collisions
  for (const player of allPlayers) {
    const playerWithVel = { ...player, ...playerVelocities.get(player.id) };
    const collision = detectPlayerBallCollision(playerWithVel, matchState.ball, config);
    if (collision.collided) {
      collisions.push({ ...collision, entity1Id: player.id });
    }
  }

  // Player-to-Player collisions
  for (let i = 0; i < allPlayers.length; i++) {
    for (let j = i + 1; j < allPlayers.length; j++) {
      const player1 = { ...allPlayers[i], ...playerVelocities.get(allPlayers[i].id) };
      const player2 = { ...allPlayers[j], ...playerVelocities.get(allPlayers[j].id) };
      const collision = detectPlayerPlayerCollision(player1, player2, config);
      if (collision.collided) {
        collisions.push(collision);
      }
    }
  }

  return collisions;
}

/**
 * Default collision configuration for Bass Ball
 */
export const DEFAULT_COLLISION_CONFIG: CollisionConfig = {
  playerCapsuleRadius: 0.4, // 40cm
  playerCapsuleHeight: 1.8, // 180cm (roughly 6ft)
  ballRadius: 0.11, // 11cm (FIFA standard)
  fieldWidth: 120, // 120 meters
  fieldHeight: 80, // 80 meters
  maxPenetration: 0.01, // 1cm - ensures no penetration
  momentumTransferCap: 0.5, // 50% of relative velocity
  foulForceThreshold: 25, // 25 m/s^2 impulse
  foulContactAngle: 0.7, // 40 degrees (cos(40°) ≈ 0.766)
};
