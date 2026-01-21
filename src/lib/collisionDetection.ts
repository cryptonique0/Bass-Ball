/**
 * Collision detection system for players and ball
 */

export interface Circle {
  x: number;
  y: number;
  radius: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CollisionResult {
  collided: boolean;
  overlapX: number;
  overlapY: number;
  normal: { x: number; y: number };
}

export class CollisionDetection {
  /**
   * Circle to circle collision
   */
  static circleToCircle(a: Circle, b: Circle): CollisionResult {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = a.radius + b.radius;

    if (distance < minDistance) {
      const overlap = minDistance - distance;
      const nx = dx / distance;
      const ny = dy / distance;
      return {
        collided: true,
        overlapX: overlap * nx,
        overlapY: overlap * ny,
        normal: { x: nx, y: ny },
      };
    }

    return {
      collided: false,
      overlapX: 0,
      overlapY: 0,
      normal: { x: 0, y: 0 },
    };
  }

  /**
   * Circle to rectangle collision
   */
  static circleToRectangle(circle: Circle, rect: Rectangle): CollisionResult {
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    const closestY = Math.max(
      rect.y,
      Math.min(circle.y, rect.y + rect.height)
    );

    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < circle.radius) {
      const normal =
        distance === 0
          ? { x: 1, y: 0 }
          : { x: dx / distance, y: dy / distance };

      return {
        collided: true,
        overlapX: (circle.radius - distance) * normal.x,
        overlapY: (circle.radius - distance) * normal.y,
        normal,
      };
    }

    return {
      collided: false,
      overlapX: 0,
      overlapY: 0,
      normal: { x: 0, y: 0 },
    };
  }

  /**
   * Rectangle to rectangle collision (AABB)
   */
  static rectangleToRectangle(
    a: Rectangle,
    b: Rectangle
  ): CollisionResult {
    const overlapX =
      Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
    const overlapY =
      Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);

    if (overlapX > 0 && overlapY > 0) {
      const normalX = a.x > b.x ? 1 : -1;
      const normalY = a.y > b.y ? 1 : -1;

      return {
        collided: true,
        overlapX: overlapX * normalX,
        overlapY: overlapY * normalY,
        normal: {
          x: overlapX < overlapY ? normalX : 0,
          y: overlapX < overlapY ? 0 : normalY,
        },
      };
    }

    return {
      collided: false,
      overlapX: 0,
      overlapY: 0,
      normal: { x: 0, y: 0 },
    };
  }

  /**
   * Point in circle collision
   */
  static pointInCircle(x: number, y: number, circle: Circle): boolean {
    const dx = x - circle.x;
    const dy = y - circle.y;
    return dx * dx + dy * dy <= circle.radius * circle.radius;
  }

  /**
   * Point in rectangle collision
   */
  static pointInRectangle(
    x: number,
    y: number,
    rect: Rectangle
  ): boolean {
    return (
      x >= rect.x &&
      x <= rect.x + rect.width &&
      y >= rect.y &&
      y <= rect.y + rect.height
    );
  }

  /**
   * Get all collisions from a list of circles
   */
  static getCollisions(
    circles: (Circle & { id: string })[]
  ): Array<{
    id1: string;
    id2: string;
    result: CollisionResult;
  }> {
    const collisions = [];

    for (let i = 0; i < circles.length; i++) {
      for (let j = i + 1; j < circles.length; j++) {
        const result = this.circleToCircle(circles[i], circles[j]);
        if (result.collided) {
          collisions.push({
            id1: circles[i].id,
            id2: circles[j].id,
            result,
          });
        }
      }
    }

    return collisions;
  }
}
