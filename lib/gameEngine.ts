// Game state and mechanics
export interface Player {
  id: string;
  name: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defense: number;
  physical: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  stamina: number;
  selected: boolean;
}

export interface Team {
  id: string;
  name: string;
  formation: string; // e.g., "4-3-3"
  players: Player[];
  score: number;
  possession: number;
}

export interface GameState {
  homeTeam: Team;
  awayTeam: Team;
  ballX: number;
  ballY: number;
  ballVx: number;
  ballVy: number;
  possession: string | null;
  gameTime: number;
  isPlaying: boolean;
  selectedPlayer: Player | null;
}

export interface Formation {
  name: string;
  positions: Array<{ x: number; y: number; position: string }>;
}

// Formations
export const FORMATIONS: Record<string, Formation> = {
  '4-4-2': {
    name: '4-4-2 Classic',
    positions: [
      { x: 0.05, y: 0.5, position: 'GK' },
      { x: 0.2, y: 0.2, position: 'DEF' },
      { x: 0.2, y: 0.4, position: 'DEF' },
      { x: 0.2, y: 0.6, position: 'DEF' },
      { x: 0.2, y: 0.8, position: 'DEF' },
      { x: 0.4, y: 0.25, position: 'MID' },
      { x: 0.4, y: 0.45, position: 'MID' },
      { x: 0.4, y: 0.65, position: 'MID' },
      { x: 0.4, y: 0.85, position: 'MID' },
      { x: 0.65, y: 0.35, position: 'FWD' },
      { x: 0.65, y: 0.65, position: 'FWD' },
    ],
  },
  '4-3-3': {
    name: '4-3-3 Balanced',
    positions: [
      { x: 0.05, y: 0.5, position: 'GK' },
      { x: 0.2, y: 0.2, position: 'DEF' },
      { x: 0.2, y: 0.4, position: 'DEF' },
      { x: 0.2, y: 0.6, position: 'DEF' },
      { x: 0.2, y: 0.8, position: 'DEF' },
      { x: 0.4, y: 0.3, position: 'MID' },
      { x: 0.4, y: 0.5, position: 'MID' },
      { x: 0.4, y: 0.7, position: 'MID' },
      { x: 0.65, y: 0.2, position: 'FWD' },
      { x: 0.65, y: 0.5, position: 'FWD' },
      { x: 0.65, y: 0.8, position: 'FWD' },
    ],
  },
  '3-5-2': {
    name: '3-5-2 Attacking',
    positions: [
      { x: 0.05, y: 0.5, position: 'GK' },
      { x: 0.2, y: 0.25, position: 'DEF' },
      { x: 0.2, y: 0.5, position: 'DEF' },
      { x: 0.2, y: 0.75, position: 'DEF' },
      { x: 0.4, y: 0.15, position: 'MID' },
      { x: 0.4, y: 0.4, position: 'MID' },
      { x: 0.4, y: 0.65, position: 'MID' },
      { x: 0.4, y: 0.85, position: 'MID' },
      { x: 0.65, y: 0.35, position: 'FWD' },
      { x: 0.65, y: 0.65, position: 'FWD' },
    ],
  },
};

// Game constants
export const PITCH_WIDTH = 1050; // in viewport units
export const PITCH_HEIGHT = 680;
export const BALL_RADIUS = 12;
export const PLAYER_RADIUS = 16;
export const MAX_BALL_SPEED = 15;
export const FRICTION = 0.99;
export const MATCH_DURATION = 90 * 60; // 90 minutes in seconds

// Helper functions
export function getDistanceBetweenPoints(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function getAngleBetweenPoints(x1: number, y1: number, x2: number, y2: number): number {
  return Math.atan2(y2 - y1, x2 - x1);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Calculate pass success based on player stats
export function getPassSuccessRate(
  passingPlayer: Player,
  targetPlayer: Player,
  defendingPlayers: Player[],
  distance: number
): number {
  let successRate = 0.5 + passingPlayer.passing / 200;

  // Distance affects pass success
  const maxPassDistance = 300;
  if (distance > maxPassDistance) {
    successRate *= distance / maxPassDistance;
  }

  // Nearby defenders reduce success
  defendingPlayers.forEach((defender) => {
    const distToDefender = getDistanceBetweenPoints(
      targetPlayer.x,
      targetPlayer.y,
      defender.x,
      defender.y
    );
    if (distToDefender < 100) {
      successRate *= 0.9;
    }
  });

  return Math.max(0, Math.min(1, successRate));
}

// Calculate shot accuracy
export function getShotAccuracy(player: Player, goalDistance: number): number {
  let accuracy = 0.3 + player.shooting / 200;
  // Distance affects accuracy
  accuracy *= Math.max(0, 1 - goalDistance / 500);
  return Math.max(0, Math.min(1, accuracy));
}
