// Match types and interfaces

export interface PlayerInput {
  tick: number;
  action: 'MOVE' | 'PASS' | 'SHOOT' | 'TACKLE' | 'SPRINT' | 'SKILL';
  params: {
    x?: number;
    y?: number;
    power?: number;
    angle?: number;
    targetId?: string;
  };
  timestamp: number;
}

export interface MatchState {
  matchId: string;
  status: 'waiting' | 'started' | 'ended';
  tick: number;
  homeTeam: {
    name: string;
    score: number;
    players: PlayerState[];
  };
  awayTeam: {
    name: string;
    score: number;
    players: PlayerState[];
  };
  ball: {
    x: number;
    y: number;
    vx: number;
    vy: number;
  };
  possession: 'home' | 'away';
  duration: number;
  seed: string;
}

export interface PlayerState {
  id: string;
  position: {
    x: number;
    y: number;
  };
  stamina: number;
  stats: {
    pace: number;
    shooting: number;
    passing: number;
    defense: number;
    dribbling: number;
  };
}

export interface MatchResult {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  duration: number;
  durationTicks: number;
  seed: string;
  engineVersion: string;
  inputs: {
    home: PlayerInput[];
    away: PlayerInput[];
  };
  replayHash: string;
  resultHash: string;
  timestamp: number;
}

export interface GameConfig {
  fieldWidth: number;
  fieldHeight: number;
  tickRate: number;
  matchDuration: number;
}

export interface VerificationResult {
  valid: boolean;
  computedHash: string;
  onChainHash: string;
  mismatchType?: string;
  details: {
    seed: string;
    engineVersion: string;
    finalScore: {
      home: number;
      away: number;
    };
    inputsProcessed: number;
    duration: number;
  };
}

export interface PlayerProfile {
  id: string;
  username: string;
  wallet?: string;
  stats: {
    wins: number;
    losses: number;
    draws: number;
    totalGoals: number;
    totalAssists: number;
    totalMatches: number;
    winRate: number;
  };
  ranking: {
    rating: number;
    position: number;
  };
  nfts: {
    teamNFTs: string[];
    playerCards: string[];
  };
  matchHistory: MatchResult[];
}

export interface GuestSession {
  sessionId: string;
  username: string;
  createdAt: number;
  lastActivity: number;
}
