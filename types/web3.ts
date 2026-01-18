/**
 * Web3 and Blockchain Types for Bass Ball
 */

export interface UserProfile {
  address: string;
  username?: string;
  avatar?: string;
  level: number;
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  totalRewards: bigint;
  lastLogin: Date;
  joinedAt: Date;
}

export interface WalletInfo {
  address: string;
  chainId: number;
  chainName: string;
  isOnBase: boolean;
  balance: string;
  balanceRaw: bigint;
  connector?: string;
}

export interface MatchReward {
  playerAddress: string;
  amount: bigint;
  matchId: string;
  timestamp: Date;
  matchStats: {
    goals: number;
    assists: number;
    wins: number;
  };
}

export interface PlayerNFT {
  tokenId: bigint;
  name: string;
  position: string;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defense: number;
  physical: number;
  overallRating: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface GameSession {
  id: string;
  playerAddress: string;
  mode: 'ai' | 'pvp';
  opponentAddress?: string;
  startTime: Date;
  endTime?: Date;
  homeTeamScore: number;
  awayTeamScore: number;
  winner?: 'home' | 'away' | 'draw';
  reward?: bigint;
  transactionHash?: string;
}

export interface LeaderboardEntry {
  rank: number;
  playerAddress: string;
  username: string;
  totalMatches: number;
  wins: number;
  winRate: number;
  totalRewards: bigint;
  lastUpdated: Date;
}

export interface GameReadyChecks {
  walletConnected: boolean;
  onCorrectChain: boolean;
  sufficientBalance: boolean;
}
