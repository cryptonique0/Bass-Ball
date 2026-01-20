// Game state and tactical types
export interface TacticalSliders {
  pressing: number;
  tempo: number;
  width: number;
  defensiveLineHeight: number;
  offensiveAggression: number;
  buildUpPlay: number;
  transitionSpeed: number;
  creativity: number;
}

export interface MatchTactics {
  matchId: string;
  homeTeamTactics: {
    formation: string;
    sliders: TacticalSliders;
  };
  awayTeamTactics: {
    formation: string;
    sliders: TacticalSliders;
  };
  updatedAt: number;
}

export interface PlayerPosition {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface BallState {
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  possession?: string;
  lastTouched?: { playerId: string; time: number };
}
