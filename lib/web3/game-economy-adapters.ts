/**
 * Bass Ball In-Game Economy Adapters
 * Game-specific integrations for web3 rewards, tournaments, NFTs, and marketplace
 * 
 * Features:
 * - Match rewards distribution (wins/losses/draws)
 * - Tournament escrow management
 * - Player stats NFT minting
 * - Marketplace integration for cosmetics/formations
 */

import { formatUnits, parseUnits } from 'viem';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Player {
  id: string;
  username: string;
  walletAddress: string;
  level: number;
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  mmr: number; // Matchmaking rating
  totalEarnings: number; // Total USDC earned
  joinDate: number;
}

export interface Match {
  id: string;
  homePlayerId: string;
  awayPlayerId: string;
  homeTeamFormation: string;
  awayTeamFormation: string;
  startTime: number;
  endTime: number;
  status: 'pending' | 'in-progress' | 'completed' | 'disputed';
  finalScore: {
    home: number;
    away: number;
  };
  winner?: 'home' | 'away' | 'draw';
  rewardDistributed: boolean;
  rewardTxHash?: string;
}

export interface MatchReward {
  matchId: string;
  playerId: string;
  playerWalletAddress: string;
  amount: number; // USDC
  rewardType: 'win' | 'loss' | 'draw' | 'bonus';
  bonusReason?: string;
  baseReward: number;
  multiplier: number;
  finalReward: number;
  timestamp: number;
  distributed: boolean;
  txHash?: string;
}

export interface Tournament {
  id: string;
  name: string;
  description: string;
  maxPlayers: number;
  entryFee: number; // USDC
  prizePool: number; // Total USDC
  status: 'registration' | 'active' | 'completed' | 'cancelled';
  startTime: number;
  endTime?: number;
  format: 'single-elimination' | 'round-robin' | 'best-of-three';
  participants: string[]; // Player IDs
  escrowAddress: string;
  escrowAmount: number;
  escrowStatus: 'locked' | 'released' | 'disputed';
  winners?: string[]; // Player IDs
  prizeDistribution?: number[]; // Percentages
}

export interface TournamentEscrow {
  tournamentId: string;
  escrowAddress: string;
  totalAmount: number; // USDC
  playerStakes: Record<string, number>; // playerId -> amount
  status: 'locked' | 'released' | 'disputed';
  timestamp: number;
  releaseTime?: number;
  txHash?: string;
  distributionTxHash?: string;
}

export interface PlayerStatsNFT {
  id: string;
  tokenId: number;
  playerId: string;
  playerName: string;
  playerWallet: string;
  stats: {
    totalMatches: number;
    wins: number;
    losses: number;
    winRate: number;
    currentMMR: number;
    totalEarnings: number;
    achievementCount: number;
  };
  achievements: Achievement[];
  mintedAt: number;
  season: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  ipfsHash: string;
  contractAddress: string;
  txHash: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: number;
  requirement: {
    type: 'wins' | 'mmr' | 'matches' | 'formation' | 'special';
    value: number;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface MarketplaceItem {
  id: string;
  type: 'formation' | 'cosmetic' | 'consumable' | 'special';
  name: string;
  description: string;
  price: number; // USDC
  image: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  stats?: Record<string, number>;
  limited: boolean;
  totalSupply?: number;
  currentSupply?: number;
  owner?: string; // For secondary sales
  createdAt: number;
  verified: boolean;
  contractAddress: string;
}

export interface MarketplaceOrder {
  id: string;
  itemId: string;
  seller: string;
  buyer?: string;
  price: number; // USDC
  orderType: 'listing' | 'offer';
  status: 'active' | 'filled' | 'cancelled' | 'expired';
  createdAt: number;
  expiresAt: number;
  txHash?: string;
  timestamp: number;
}

export interface PlayerInventory {
  playerId: string;
  formations: string[]; // Formation IDs
  cosmetics: string[]; // Cosmetic NFT IDs
  consumables: Record<string, number>; // consumableId -> count
  balanceUSDC: number;
  balanceBase: number;
  rewardsClaimable: number;
  lastUpdated: number;
}

export interface RewardBracket {
  level: string; // 'bronze', 'silver', 'gold', 'diamond', 'legendary'
  mmrRange: [number, number];
  winReward: number;
  lossReward: number;
  drawReward: number;
  rarityMultiplier: number;
}

export interface GameEconomyStats {
  totalMatches: number;
  totalRewardsDistributed: number;
  totalTournamentVolume: number;
  totalNFTsMinted: number;
  totalMarketplaceVolume: number;
  activePlayerCount: number;
  averageRewardPerMatch: number;
  averageStakePerTournament: number;
}

// ============================================================================
// REWARD BRACKETS & CONFIG
// ============================================================================

const REWARD_BRACKETS: Record<string, RewardBracket> = {
  bronze: {
    level: 'bronze',
    mmrRange: [0, 1000],
    winReward: 5,
    lossReward: 1,
    drawReward: 2,
    rarityMultiplier: 1.0,
  },
  silver: {
    level: 'silver',
    mmrRange: [1000, 1500],
    winReward: 10,
    lossReward: 2,
    drawReward: 4,
    rarityMultiplier: 1.2,
  },
  gold: {
    level: 'gold',
    mmrRange: [1500, 2000],
    winReward: 20,
    lossReward: 5,
    drawReward: 8,
    rarityMultiplier: 1.5,
  },
  diamond: {
    level: 'diamond',
    mmrRange: [2000, 2500],
    winReward: 40,
    lossReward: 10,
    drawReward: 15,
    rarityMultiplier: 2.0,
  },
  legendary: {
    level: 'legendary',
    mmrRange: [2500, 99999],
    winReward: 100,
    lossReward: 25,
    drawReward: 40,
    rarityMultiplier: 3.0,
  },
};

const ACHIEVEMENT_CATALOG: Record<string, Achievement> = {
  first_match: {
    id: 'first_match',
    name: 'Welcome to Bass Ball',
    description: 'Complete your first match',
    icon: '🎮',
    unlockedAt: 0,
    requirement: { type: 'matches', value: 1 },
    rarity: 'common',
  },
  hat_trick: {
    id: 'hat_trick',
    name: 'Hat Trick Hero',
    description: 'Score 3+ goals in a match',
    icon: '⚽⚽⚽',
    unlockedAt: 0,
    requirement: { type: 'special', value: 3 },
    rarity: 'rare',
  },
  first_win: {
    id: 'first_win',
    name: 'First Victory',
    description: 'Win your first match',
    icon: '🏆',
    unlockedAt: 0,
    requirement: { type: 'wins', value: 1 },
    rarity: 'common',
  },
  win_streak_5: {
    id: 'win_streak_5',
    name: 'On Fire',
    description: 'Win 5 matches in a row',
    icon: '🔥',
    unlockedAt: 0,
    requirement: { type: 'wins', value: 5 },
    rarity: 'uncommon',
  },
  gold_rank: {
    id: 'gold_rank',
    name: 'Gold Tier',
    description: 'Reach Gold rank (1500+ MMR)',
    icon: '🥇',
    unlockedAt: 0,
    requirement: { type: 'mmr', value: 1500 },
    rarity: 'epic',
  },
  legendary_rank: {
    id: 'legendary_rank',
    name: 'Legendary',
    description: 'Reach Legendary rank (2500+ MMR)',
    icon: '👑',
    unlockedAt: 0,
    requirement: { type: 'mmr', value: 2500 },
    rarity: 'legendary',
  },
  tournament_champion: {
    id: 'tournament_champion',
    name: 'Champion',
    description: 'Win a tournament',
    icon: '🏅',
    unlockedAt: 0,
    requirement: { type: 'special', value: 1 },
    rarity: 'epic',
  },
};

const MARKETPLACE_ITEMS: MarketplaceItem[] = [
  // Formations
  {
    id: 'formation_4-3-3',
    type: 'formation',
    name: '4-3-3 Classic',
    description: 'Balanced formation for versatile play',
    price: 50,
    image: '🏟️',
    rarity: 'common',
    stats: { defense: 75, midfield: 80, attack: 85 },
    limited: false,
    createdAt: Date.now(),
    verified: true,
    contractAddress: '0x...',
  },
  {
    id: 'formation_5-3-2',
    type: 'formation',
    name: '5-3-2 Defensive',
    description: 'Defensive-heavy formation for protection',
    price: 75,
    image: '🛡️',
    rarity: 'uncommon',
    stats: { defense: 95, midfield: 70, attack: 60 },
    limited: false,
    createdAt: Date.now(),
    verified: true,
    contractAddress: '0x...',
  },
  {
    id: 'formation_3-5-2',
    type: 'formation',
    name: '3-5-2 Attacking',
    description: 'Attack-focused formation',
    price: 100,
    image: '⚡',
    rarity: 'rare',
    stats: { defense: 60, midfield: 85, attack: 95 },
    limited: false,
    createdAt: Date.now(),
    verified: true,
    contractAddress: '0x...',
  },
  // Cosmetics
  {
    id: 'cosmetic_gold_kit',
    type: 'cosmetic',
    name: 'Golden Jersey',
    description: 'Exclusive gold team kit',
    price: 25,
    image: '👕',
    rarity: 'epic',
    limited: true,
    totalSupply: 100,
    currentSupply: 45,
    createdAt: Date.now(),
    verified: true,
    contractAddress: '0x...',
  },
  {
    id: 'cosmetic_stadium',
    type: 'cosmetic',
    name: 'Neon Stadium',
    description: 'Futuristic neon-themed stadium',
    price: 50,
    image: '🌃',
    rarity: 'epic',
    limited: true,
    totalSupply: 50,
    currentSupply: 12,
    createdAt: Date.now(),
    verified: true,
    contractAddress: '0x...',
  },
];

// ============================================================================
// MATCH REWARDS SYSTEM
// ============================================================================

/**
 * Calculate match rewards based on player MMR and outcome
 */
export const calculateMatchReward = (
  matchId: string,
  playerId: string,
  playerWalletAddress: string,
  playerMMR: number,
  outcome: 'win' | 'loss' | 'draw',
  matchBonus?: number
): MatchReward => {
  // Find appropriate reward bracket
  const bracket = Object.values(REWARD_BRACKETS).find(b =>
    playerMMR >= b.mmrRange[0] && playerMMR < b.mmrRange[1]
  ) || REWARD_BRACKETS.bronze;

  // Base reward
  const baseReward = 
    outcome === 'win' ? bracket.winReward :
    outcome === 'draw' ? bracket.drawReward :
    bracket.lossReward;

  // Apply bonus if exists
  const multiplier = matchBonus ? 1 + (matchBonus / 100) : 1;
  const finalReward = baseReward * bracket.rarityMultiplier * multiplier;

  return {
    matchId,
    playerId,
    playerWalletAddress,
    amount: finalReward,
    rewardType: outcome,
    baseReward,
    multiplier: bracket.rarityMultiplier * multiplier,
    finalReward,
    timestamp: Date.now(),
    distributed: false,
  };
};

/**
 * Distribute rewards for completed match
 */
export const distributeMatchRewards = (
  match: Match,
  homPlayer: Player,
  awayPlayer: Player
): MatchReward[] => {
  const rewards: MatchReward[] = [];

  if (!match.winner) {
    throw new Error('Match must have a winner');
  }

  // Home player reward
  const homeOutcome = 
    match.winner === 'home' ? 'win' :
    match.winner === 'draw' ? 'draw' :
    'loss';

  const homeReward = calculateMatchReward(
    match.id,
    homPlayer.id,
    homPlayer.walletAddress,
    homPlayer.mmr,
    homeOutcome
  );
  rewards.push(homeReward);

  // Away player reward
  const awayOutcome = 
    match.winner === 'away' ? 'win' :
    match.winner === 'draw' ? 'draw' :
    'loss';

  const awayReward = calculateMatchReward(
    match.id,
    awayPlayer.id,
    awayPlayer.walletAddress,
    awayPlayer.mmr,
    awayOutcome
  );
  rewards.push(awayReward);

  return rewards;
};

/**
 * Get streak bonuses
 */
export const getStreakBonus = (
  winStreak: number,
  lossStreak: number
): number => {
  if (winStreak >= 5) return Math.min(50, winStreak * 5); // Max 50%
  if (lossStreak >= 3) return -Math.min(25, lossStreak * 5); // Min -25%
  return 0;
};

/**
 * Batch distribute rewards
 */
export const batchDistributeRewards = (
  matches: Match[],
  players: Record<string, Player>
): MatchReward[] => {
  const allRewards: MatchReward[] = [];

  matches.forEach(match => {
    if (match.status === 'completed' && !match.rewardDistributed) {
      const homePlayer = players[match.homePlayerId];
      const awayPlayer = players[match.awayPlayerId];

      if (homePlayer && awayPlayer) {
        const rewards = distributeMatchRewards(match, homePlayer, awayPlayer);
        allRewards.push(...rewards);
      }
    }
  });

  return allRewards;
};

/**
 * Get player reward history
 */
export const getPlayerRewardHistory = (
  rewards: MatchReward[],
  playerId: string,
  limit: number = 50
): MatchReward[] => {
  return rewards
    .filter(r => r.playerId === playerId)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
};

/**
 * Calculate total earnings
 */
export const calculateTotalEarnings = (
  rewards: MatchReward[],
  playerId: string
): number => {
  return rewards
    .filter(r => r.playerId === playerId && r.distributed)
    .reduce((sum, r) => sum + r.finalReward, 0);
};

// ============================================================================
// TOURNAMENT ESCROW SYSTEM
// ============================================================================

/**
 * Create tournament escrow
 */
export const createTournamentEscrow = (
  tournament: Tournament,
  participants: Player[]
): TournamentEscrow => {
  const playerStakes: Record<string, number> = {};
  let totalAmount = 0;

  participants.forEach(player => {
    playerStakes[player.id] = tournament.entryFee;
    totalAmount += tournament.entryFee;
  });

  return {
    tournamentId: tournament.id,
    escrowAddress: `0x${Math.random().toString(16).slice(2)}`, // Mock address
    totalAmount,
    playerStakes,
    status: 'locked',
    timestamp: Date.now(),
    releaseTime: tournament.endTime,
  };
};

/**
 * Calculate prize distribution
 */
export const calculatePrizeDistribution = (
  escrow: TournamentEscrow,
  tournament: Tournament,
  winnersInOrder: string[]
): Record<string, number> => {
  const distribution: Record<string, number> = {};

  if (!tournament.prizeDistribution) {
    // Default: 50% first, 30% second, 20% third
    tournament.prizeDistribution = [0.5, 0.3, 0.2];
  }

  winnersInOrder.forEach((winnerId, index) => {
    if (index < tournament.prizeDistribution!.length) {
      const percentage = tournament.prizeDistribution![index];
      distribution[winnerId] = escrow.totalAmount * percentage;
    }
  });

  return distribution;
};

/**
 * Release tournament escrow
 */
export const releaseTournamentEscrow = (
  escrow: TournamentEscrow,
  tournament: Tournament,
  winnersInOrder: string[]
): { escrow: TournamentEscrow; distributions: Record<string, number> } => {
  if (escrow.status !== 'locked') {
    throw new Error('Escrow is not locked');
  }

  const distributions = calculatePrizeDistribution(escrow, tournament, winnersInOrder);

  const updatedEscrow: TournamentEscrow = {
    ...escrow,
    status: 'released',
    distributionTxHash: `0x${Math.random().toString(16).slice(2)}`,
    timestamp: Date.now(),
  };

  return { escrow: updatedEscrow, distributions };
};

/**
 * Get tournament participation stats
 */
export const getTournamentStats = (
  tournament: Tournament
): {
  participantCount: number;
  totalPrizePool: number;
  prizePerCapita: number;
  minStake: number;
  maxStake: number;
  coverage: number; // percentage of game economy
} => {
  const participantCount = tournament.participants.length;
  const totalPrizePool = tournament.prizePool;
  const prizePerCapita = participantCount > 0 ? totalPrizePool / participantCount : 0;

  return {
    participantCount,
    totalPrizePool,
    prizePerCapita,
    minStake: tournament.entryFee,
    maxStake: tournament.entryFee * participantCount,
    coverage: (totalPrizePool / 10000) * 100, // Assume 10k daily volume
  };
};

// ============================================================================
// PLAYER STATS NFT MINTING
// ============================================================================

/**
 * Create player stats NFT data
 */
export const createPlayerStatsNFT = (
  player: Player,
  achievements: Achievement[],
  season: number = 1
): Omit<PlayerStatsNFT, 'tokenId' | 'ipfsHash' | 'txHash'> => {
  const winRate = player.totalMatches > 0 
    ? (player.wins / player.totalMatches) * 100 
    : 0;

  // Determine rarity based on stats
  let rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' = 'common';
  if (player.mmr >= 2500) rarity = 'legendary';
  else if (player.mmr >= 2000) rarity = 'epic';
  else if (player.mmr >= 1500) rarity = 'rare';
  else if (player.mmr >= 1000) rarity = 'uncommon';

  return {
    id: `nft-${player.id}-${season}`,
    playerId: player.id,
    playerName: player.username,
    playerWallet: player.walletAddress,
    stats: {
      totalMatches: player.totalMatches,
      wins: player.wins,
      losses: player.losses,
      winRate: Math.round(winRate * 100) / 100,
      currentMMR: player.mmr,
      totalEarnings: player.totalEarnings,
      achievementCount: achievements.length,
    },
    achievements,
    mintedAt: Date.now(),
    season,
    rarity,
    contractAddress: '0x...',
  };
};

/**
 * Check if player qualifies for NFT minting
 */
export const checkNFTMintEligibility = (
  player: Player,
  minMatches: number = 10,
  minMMR: number = 800
): {
  eligible: boolean;
  reasons: string[];
} => {
  const reasons: string[] = [];

  if (player.totalMatches < minMatches) {
    reasons.push(`Need at least ${minMatches} matches (have ${player.totalMatches})`);
  }

  if (player.mmr < minMMR) {
    reasons.push(`Need at least ${minMMR} MMR (have ${player.mmr})`);
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  };
};

/**
 * Unlock achievements for player
 */
export const checkAndUnlockAchievements = (
  player: Player,
  existingAchievements: Achievement[]
): Achievement[] => {
  const unlockedAchievements = [...existingAchievements];
  const unlockedIds = new Set(unlockedAchievements.map(a => a.id));

  Object.values(ACHIEVEMENT_CATALOG).forEach(achievement => {
    if (unlockedIds.has(achievement.id)) return;

    const shouldUnlock = 
      (achievement.requirement.type === 'wins' && player.wins >= achievement.requirement.value) ||
      (achievement.requirement.type === 'matches' && player.totalMatches >= achievement.requirement.value) ||
      (achievement.requirement.type === 'mmr' && player.mmr >= achievement.requirement.value);

    if (shouldUnlock) {
      unlockedAchievements.push({
        ...achievement,
        unlockedAt: Date.now(),
      });
    }
  });

  return unlockedAchievements;
};

// ============================================================================
// MARKETPLACE SYSTEM
// ============================================================================

/**
 * Get marketplace items
 */
export const getMarketplaceItems = (
  filter?: {
    type?: string;
    rarity?: string;
    maxPrice?: number;
    minPrice?: number;
  }
): MarketplaceItem[] => {
  let items = [...MARKETPLACE_ITEMS];

  if (filter?.type) {
    items = items.filter(i => i.type === filter.type);
  }

  if (filter?.rarity) {
    items = items.filter(i => i.rarity === filter.rarity);
  }

  if (filter?.minPrice) {
    items = items.filter(i => i.price >= filter.minPrice);
  }

  if (filter?.maxPrice) {
    items = items.filter(i => i.price <= filter.maxPrice);
  }

  return items;
};

/**
 * Create marketplace order
 */
export const createMarketplaceOrder = (
  itemId: string,
  seller: string,
  price: number,
  orderType: 'listing' | 'offer' = 'listing',
  expirationHours: number = 24
): MarketplaceOrder => {
  return {
    id: `order-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    itemId,
    seller,
    price,
    orderType,
    status: 'active',
    createdAt: Date.now(),
    expiresAt: Date.now() + (expirationHours * 60 * 60 * 1000),
    timestamp: Date.now(),
  };
};

/**
 * Fill marketplace order
 */
export const fillMarketplaceOrder = (
  order: MarketplaceOrder,
  buyer: string
): MarketplaceOrder => {
  if (order.status !== 'active') {
    throw new Error('Order is not active');
  }

  if (Date.now() > order.expiresAt) {
    throw new Error('Order has expired');
  }

  return {
    ...order,
    buyer,
    status: 'filled',
    txHash: `0x${Math.random().toString(16).slice(2)}`,
    timestamp: Date.now(),
  };
};

/**
 * Calculate marketplace fees
 */
export const calculateMarketplaceFee = (
  price: number,
  feePercentage: number = 2.5 // 2.5% platform fee
): { price: number; fee: number; total: number } => {
  const fee = price * (feePercentage / 100);
  return {
    price,
    fee,
    total: price + fee,
  };
};

/**
 * Get player inventory
 */
export const getPlayerInventory = (
  playerId: string,
  ownedFormations: string[],
  ownedCosmetics: string[],
  usdcBalance: number,
  baseBalance: number,
  claimableRewards: number
): PlayerInventory => {
  return {
    playerId,
    formations: ownedFormations,
    cosmetics: ownedCosmetics,
    consumables: {},
    balanceUSDC: usdcBalance,
    balanceBase: baseBalance,
    rewardsClaimable: claimableRewards,
    lastUpdated: Date.now(),
  };
};

/**
 * Calculate marketplace volume metrics
 */
export const getMarketplaceMetrics = (
  orders: MarketplaceOrder[]
): {
  totalVolume: number;
  totalOrders: number;
  filledOrders: number;
  activeListings: number;
  averagePrice: number;
  medianPrice: number;
} => {
  const filled = orders.filter(o => o.status === 'filled');
  const active = orders.filter(o => o.status === 'active');
  const totalVolume = filled.reduce((sum, o) => sum + o.price, 0);
  const prices = filled.map(o => o.price).sort((a, b) => a - b);

  const medianPrice = 
    prices.length > 0
      ? prices[Math.floor(prices.length / 2)]
      : 0;

  return {
    totalVolume,
    totalOrders: orders.length,
    filledOrders: filled.length,
    activeListings: active.length,
    averagePrice: filled.length > 0 ? totalVolume / filled.length : 0,
    medianPrice,
  };
};

// ============================================================================
// GAME ECONOMY ANALYTICS
// ============================================================================

/**
 * Get overall game economy statistics
 */
export const getGameEconomyStats = (
  matches: Match[],
  rewards: MatchReward[],
  tournaments: Tournament[],
  nfts: PlayerStatsNFT[],
  orders: MarketplaceOrder[],
  activePlayers: number
): GameEconomyStats => {
  const completedMatches = matches.filter(m => m.status === 'completed');
  const distributedRewards = rewards.filter(r => r.distributed);
  const filledOrders = orders.filter(o => o.status === 'filled');

  const totalRewardsDistributed = distributedRewards.reduce((sum, r) => sum + r.finalReward, 0);
  const totalTournamentVolume = tournaments.reduce((sum, t) => sum + t.prizePool, 0);
  const totalMarketplaceVolume = filledOrders.reduce((sum, o) => sum + o.price, 0);

  return {
    totalMatches: completedMatches.length,
    totalRewardsDistributed,
    totalTournamentVolume,
    totalNFTsMinted: nfts.length,
    totalMarketplaceVolume,
    activePlayerCount: activePlayers,
    averageRewardPerMatch: completedMatches.length > 0
      ? totalRewardsDistributed / completedMatches.length
      : 0,
    averageStakePerTournament: tournaments.length > 0
      ? totalTournamentVolume / tournaments.length
      : 0,
  };
};

/**
 * Get player economy metrics
 */
export const getPlayerEconomyMetrics = (
  player: Player,
  rewards: MatchReward[],
  orders: MarketplaceOrder[]
): {
  totalEarned: number;
  earnedThisWeek: number;
  averageRewardPerMatch: number;
  itemsPurchased: number;
  itemsSpent: number;
  netEconomy: number; // earned - spent
} => {
  const playerRewards = rewards.filter(r => r.playerId === player.id && r.distributed);
  const totalEarned = playerRewards.reduce((sum, r) => sum + r.finalReward, 0);

  const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const earnedThisWeek = playerRewards
    .filter(r => r.timestamp > weekAgo)
    .reduce((sum, r) => sum + r.finalReward, 0);

  const playerOrders = orders.filter(o => o.buyer === player.id && o.status === 'filled');
  const itemsPurchased = playerOrders.length;
  const itemsSpent = playerOrders.reduce((sum, o) => sum + o.price, 0);

  return {
    totalEarned,
    earnedThisWeek,
    averageRewardPerMatch: player.totalMatches > 0
      ? totalEarned / player.totalMatches
      : 0,
    itemsPurchased,
    itemsSpent,
    netEconomy: totalEarned - itemsSpent,
  };
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get reward bracket by MMR
 */
export const getRewardBracketByMMR = (mmr: number): RewardBracket => {
  return Object.values(REWARD_BRACKETS).find(b =>
    mmr >= b.mmrRange[0] && mmr < b.mmrRange[1]
  ) || REWARD_BRACKETS.bronze;
};

/**
 * Get bracket name by MMR
 */
export const getBracketNameByMMR = (mmr: number): string => {
  return getRewardBracketByMMR(mmr).level.charAt(0).toUpperCase() +
    getRewardBracketByMMR(mmr).level.slice(1);
};

/**
 * Format reward amounts
 */
export const formatReward = (amount: number): string => {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(2)}K`;
  return `$${amount.toFixed(2)}`;
};

/**
 * Get marketplace item rarity color
 */
export const getRarityColor = (rarity: string): string => {
  const colors: Record<string, string> = {
    common: '#95a5a6',
    uncommon: '#2ecc71',
    rare: '#3498db',
    epic: '#9b59b6',
    legendary: '#f39c12',
  };
  return colors[rarity] || colors.common;
};

/**
 * Export economy state for audit
 */
export const exportEconomyState = (
  matches: Match[],
  rewards: MatchReward[],
  tournaments: Tournament[],
  players: Player[]
): string => {
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    summary: {
      totalMatches: matches.length,
      totalRewards: rewards.length,
      totalTournaments: tournaments.length,
      totalPlayers: players.length,
    },
    totalRewardsDistributed: rewards
      .filter(r => r.distributed)
      .reduce((sum, r) => sum + r.finalReward, 0),
    matches: matches.map(m => ({
      id: m.id,
      status: m.status,
      winner: m.winner,
      score: m.finalScore,
    })),
  }, null, 2);
};
