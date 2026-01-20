// Database schema definitions
export interface UserSchema {
  id: string;
  walletAddress: string;
  email?: string;
  username: string;
  createdAt: number;
  updatedAt: number;
  lastLogin?: number;
}

export interface MatchSchema {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  startTime: number;
  endTime?: number;
  status: 'scheduled' | 'live' | 'ended';
  createdAt: number;
}

export interface PlayerStatsSchema {
  id: string;
  playerId: string;
  matchId: string;
  goals: number;
  assists: number;
  passes: number;
  tackles: number;
  rating: number;
  createdAt: number;
}

export interface BadgeSchema {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: string;
  criteria: Record<string, any>;
  createdAt: number;
}
