// Vector and math utilities
export interface Vector2 {
  x: number;
  y: number;
}

export const vec2 = (x: number = 0, y: number = 0): Vector2 => ({ x, y });

export const add = (a: Vector2, b: Vector2): Vector2 => ({ x: a.x + b.x, y: a.y + b.y });

export const subtract = (a: Vector2, b: Vector2): Vector2 => ({ x: a.x - b.x, y: a.y - b.y });

export const multiply = (v: Vector2, scalar: number): Vector2 => ({ x: v.x * scalar, y: v.y * scalar });

export const divide = (v: Vector2, scalar: number): Vector2 => ({ x: v.x / scalar, y: v.y / scalar });

export const length = (v: Vector2): number => Math.sqrt(v.x * v.x + v.y * v.y);

export const normalize = (v: Vector2): Vector2 => {
  const len = length(v);
  return len === 0 ? { x: 0, y: 0 } : divide(v, len);
};

export const dot = (a: Vector2, b: Vector2): number => a.x * b.x + a.y * b.y;

export const distance = (a: Vector2, b: Vector2): number => length(subtract(b, a));

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));

export const random = (min: number = 0, max: number = 1): number => Math.random() * (max - min) + min;

export const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
