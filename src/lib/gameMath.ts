/**
 * Utility functions for game math and physics calculations
 */

export interface Vector2 {
  x: number;
  y: number;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Calculate distance between two 2D points
 */
export function distance2D(p1: Vector2, p2: Vector2): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate distance between two 3D points
 */
export function distance3D(p1: Vector3, p2: Vector3): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dz = p2.z - p1.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Normalize 2D vector
 */
export function normalize2D(v: Vector2): Vector2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

/**
 * Normalize 3D vector
 */
export function normalize3D(v: Vector3): Vector3 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  if (len === 0) return { x: 0, y: 0, z: 0 };
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

/**
 * Calculate dot product of 2D vectors
 */
export function dot2D(v1: Vector2, v2: Vector2): number {
  return v1.x * v2.x + v1.y * v2.y;
}

/**
 * Calculate dot product of 3D vectors
 */
export function dot3D(v1: Vector3, v2: Vector3): number {
  return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
}

/**
 * Calculate cross product of 3D vectors
 */
export function cross3D(v1: Vector3, v2: Vector3): Vector3 {
  return {
    x: v1.y * v2.z - v1.z * v2.y,
    y: v1.z * v2.x - v1.x * v2.z,
    z: v1.x * v2.y - v1.y * v2.x,
  };
}

/**
 * Lerp (linear interpolation) between two values
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

/**
 * Lerp between two 2D vectors
 */
export function lerp2D(p1: Vector2, p2: Vector2, t: number): Vector2 {
  return {
    x: lerp(p1.x, p2.x, t),
    y: lerp(p1.y, p2.y, t),
  };
}

/**
 * Calculate angle between two vectors (in radians)
 */
export function angleBetween2D(v1: Vector2, v2: Vector2): number {
  const n1 = normalize2D(v1);
  const n2 = normalize2D(v2);
  const dotProduct = dot2D(n1, n2);
  return Math.acos(Math.max(-1, Math.min(1, dotProduct)));
}

/**
 * Rotate 2D vector by angle (in radians)
 */
export function rotate2D(v: Vector2, angle: number): Vector2 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: v.x * cos - v.y * sin,
    y: v.x * sin + v.y * cos,
  };
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Smoothstep interpolation
 */
export function smoothstep(t: number): number {
  t = clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * Calculate trajectory for projectile motion
 */
export function calculateTrajectory(
  startPos: Vector3,
  velocity: Vector3,
  gravity: number,
  timeStep: number
): Vector3[] {
  const trajectory: Vector3[] = [startPos];
  let pos = { ...startPos };
  let vel = { ...velocity };
  const g = { x: 0, y: -gravity, z: 0 };

  for (let i = 0; i < 100; i++) {
    // Update velocity
    vel.x += g.x * timeStep;
    vel.y += g.y * timeStep;
    vel.z += g.z * timeStep;

    // Update position
    pos.x += vel.x * timeStep;
    pos.y += vel.y * timeStep;
    pos.z += vel.z * timeStep;

    trajectory.push({ ...pos });

    // Stop if below ground
    if (pos.y < 0) break;
  }

  return trajectory;
}
