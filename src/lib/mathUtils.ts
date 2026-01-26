/**
 * Mathematical utilities for game physics and calculations
 * 
 * Provides vector operations, interpolation, and common math functions
 * optimized for game development.
 */

/** 2D Vector representation */
export interface Vector2 {
  x: number;
  y: number;
}

/** Small epsilon for floating point comparisons */
const EPSILON = 1e-10;

/**
 * Create a 2D vector
 * @param x - X component (default: 0)
 * @param y - Y component (default: 0)
 */
export const vec2 = (x: number = 0, y: number = 0): Vector2 => ({ x, y });

/** Add two vectors */
export const add = (a: Vector2, b: Vector2): Vector2 => ({ 
  x: a.x + b.x, 
  y: a.y + b.y 
});

/** Subtract vector b from vector a */
export const subtract = (a: Vector2, b: Vector2): Vector2 => ({ 
  x: a.x - b.x, 
  y: a.y - b.y 
});

/** Multiply vector by scalar */
export const multiply = (v: Vector2, scalar: number): Vector2 => ({ 
  x: v.x * scalar, 
  y: v.y * scalar 
});

/**
 * Divide vector by scalar
 * @throws {Error} If scalar is zero or too close to zero
 */
export const divide = (v: Vector2, scalar: number): Vector2 => {
  if (Math.abs(scalar) < EPSILON) {
    throw new Error('Division by zero in vector operation');
  }
  return { x: v.x / scalar, y: v.y / scalar };
};

/** Calculate vector magnitude (length) */
export const length = (v: Vector2): number => Math.sqrt(v.x * v.x + v.y * v.y);

/** Calculate squared magnitude (faster, avoids sqrt) */
export const lengthSquared = (v: Vector2): number => v.x * v.x + v.y * v.y;

/**
 * Normalize vector to unit length
 * Returns zero vector if input length is zero
 */
export const normalize = (v: Vector2): Vector2 => {
  const len = length(v);
  return len < EPSILON ? { x: 0, y: 0 } : divide(v, len);
};

/** Calculate dot product of two vectors */
export const dot = (a: Vector2, b: Vector2): number => a.x * b.x + a.y * b.y;

/** Calculate cross product (returns scalar in 2D) */
export const cross = (a: Vector2, b: Vector2): number => a.x * b.y - a.y * b.x;

/** Calculate distance between two points */
export const distance = (a: Vector2, b: Vector2): number => length(subtract(b, a));

/** Calculate squared distance (faster, avoids sqrt) */
export const distanceSquared = (a: Vector2, b: Vector2): number => {
  const diff = subtract(b, a);
  return lengthSquared(diff);
};

/**
 * Linear interpolation between two values
 * @param a - Start value
 * @param b - End value
 * @param t - Interpolation factor (0-1)
 */
export const lerp = (a: number, b: number, t: number): number => 
  a + (b - a) * clamp(t, 0, 1);

/**
 * Linear interpolation between two vectors
 * @param a - Start vector
 * @param b - End vector
 * @param t - Interpolation factor (0-1)
 */
export const lerpVector = (a: Vector2, b: Vector2, t: number): Vector2 => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
});

/**
 * Clamp value between min and max
 */
export const clamp = (v: number, min: number, max: number): number => 
  Math.max(min, Math.min(max, v));

/**
 * Generate random number between min and max
 */
export const random = (min: number = 0, max: number = 1): number => 
  Math.random() * (max - min) + min;

/**
 * Generate random integer between min and max (inclusive)
 */
export const randomInt = (min: number, max: number): number => 
  Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Rotate vector by angle (radians)
 */
export const rotate = (v: Vector2, angle: number): Vector2 => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: v.x * cos - v.y * sin,
    y: v.x * sin + v.y * cos,
  };
};

/**
 * Calculate angle between two vectors (radians)
 */
export const angleBetween = (a: Vector2, b: Vector2): number => {
  const dot_product = dot(a, b);
  const lengths = length(a) * length(b);
  if (lengths < EPSILON) return 0;
  return Math.acos(clamp(dot_product / lengths, -1, 1));
};

/**
 * Reflect vector across a normal
 */
export const reflect = (v: Vector2, normal: Vector2): Vector2 => {
  const dotProduct = dot(v, normal);
  return subtract(v, multiply(normal, 2 * dotProduct));
};

/**
 * Check if two numbers are approximately equal
 */
export const approximately = (a: number, b: number, epsilon: number = EPSILON): boolean => 
  Math.abs(a - b) < epsilon;

/**
 * Map value from one range to another
 */
export const map = (
  value: number, 
  inMin: number, 
  inMax: number, 
  outMin: number, 
  outMax: number
): number => {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};
