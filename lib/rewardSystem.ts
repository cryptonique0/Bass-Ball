/**
 * Reward System
 * Handles XP, tokens, cosmetic NFTs, and seasonal reward distribution
 */

/**
 * Reward definition
 */
export interface Reward {
  rewardId: string;
  type: 'xp' | 'token' | 'cosmetic_nft' | 'cosmetic' | 'badge';
  amount: number;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  source: string; // e.g., 'season_end', 'ranking_top10', 'milestone', 'challenge'
  metadata?: Record<string, unknown>;
}

/**
 * Player reward claim
 */
export interface RewardClaim {
  claimId: string;
  entityId: string;
  entityType: 'player' | 'team';
  entityName: string;
  reward: Reward;
  claimed: boolean;
  claimedDate?: number;
  season: string;
}

/**
 * Ranking-based reward tier
 */
export interface RankingRewardTier {
  rankFrom: number;
  rankTo: number;
  tier: string;
  xpBonus: number;
  tokenBonus: number;
  cosmeticReward?: string;
  badge?: string;
  nftReward?: boolean;
}

/**
 * Cosmetic NFT definition
 */
export interface CosmeticNFT {
  cosmeticId: string;
  name: string;
  description: string;
  type: 'jersey' | 'badge' | 'border' | 'effect' | 'particles' | 'aura';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  colors: {
    primary: string;
    secondary?: string;
    accent?: string;
  };
  season?: string;
  exclusive: boolean;
  mintedDate: number;
  tokenId?: string; // For blockchain
}

/**
 * Reward Manager
 * Singleton for managing all rewards
 */
export class RewardManager {
  private static instance: RewardManager;
  private rewards: Map<string, Reward> = new Map();
  private claims: Map<string, RewardClaim> = new Map();
  private cosmeticNFTs: Map<string, CosmeticNFT> = new Map();
  private playerInventory: Map<string, string[]> = new Map(); // entityId -> cosmeticIds

  // Reward configurations
  private rankingRewardTiers: RankingRewardTier[] = [
    { rankFrom: 1, rankTo: 5, tier: 'top5', xpBonus: 1000, tokenBonus: 500, nftReward: true },
    { rankFrom: 6, rankTo: 10, tier: 'top10', xpBonus: 500, tokenBonus: 250, cosmeticReward: 'top10_badge' },
    { rankFrom: 11, rankTo: 25, tier: 'top25', xpBonus: 250, tokenBonus: 100, cosmeticReward: 'top25_badge' },
    { rankFrom: 26, rankTo: 50, tier: 'top50', xpBonus: 100, tokenBonus: 50 },
    { rankFrom: 51, rankTo: 100, tier: 'top100', xpBonus: 50, tokenBonus: 25 },
  ];

  private constructor() {
    this.loadFromStorage();
    this.initializeDefaultCosmetics();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): RewardManager {
    if (!RewardManager.instance) {
      RewardManager.instance = new RewardManager();
    }
    return RewardManager.instance;
  }

  /**
   * Create reward claim
   */
  createRewardClaim(
    entityId: string,
    entityType: 'player' | 'team',
    entityName: string,
    reward: Reward,
    season: string
  ): RewardClaim {
    const claimId = `claim_${entityId}_${reward.rewardId}`;

    const claim: RewardClaim = {
      claimId,
      entityId,
      entityType,
      entityName,
      reward,
      claimed: false,
      season,
    };

    this.claims.set(claimId, claim);
    this.saveToStorage();

    return claim;
  }

  /**
   * Claim reward
   */
  claimReward(claimId: string): RewardClaim | null {
    const claim = this.claims.get(claimId);
    if (!claim) return null;

    claim.claimed = true;
    claim.claimedDate = Date.now();

    // If cosmetic NFT, add to inventory
    if (claim.reward.type === 'cosmetic_nft' && claim.reward.metadata?.cosmeticId) {
      this.addToInventory(claim.entityId, claim.reward.metadata.cosmeticId as string);
    }

    this.saveToStorage();
    return claim;
  }

  /**
   * Get pending claims for entity
   */
  getPendingClaims(entityId: string): RewardClaim[] {
    return Array.from(this.claims.values()).filter(
      (c) => c.entityId === entityId && !c.claimed
    );
  }

  /**
   * Get claimed rewards for entity
   */
  getClaimedRewards(entityId: string, season?: string): RewardClaim[] {
    let claims = Array.from(this.claims.values()).filter(
      (c) => c.entityId === entityId && c.claimed
    );

    if (season) {
      claims = claims.filter((c) => c.season === season);
    }

    return claims;
  }

  /**
   * Award ranking rewards
   */
  awardRankingRewards(
    entityId: string,
    entityType: 'player' | 'team',
    entityName: string,
    rank: number,
    season: string
  ): Reward[] {
    const rewardsAwarded: Reward[] = [];

    // Find matching tier
    for (const tier of this.rankingRewardTiers) {
      if (rank >= tier.rankFrom && rank <= tier.rankTo) {
        // XP reward
        const xpReward: Reward = {
          rewardId: `reward_xp_${entityId}_${season}`,
          type: 'xp',
          amount: tier.xpBonus,
          description: `${tier.tier.toUpperCase()} Season Ranking Reward`,
          rarity: tier.rankTo <= 10 ? 'epic' : 'rare',
          source: `ranking_${tier.tier}`,
        };
        this.createRewardClaim(entityId, entityType, entityName, xpReward, season);
        rewardsAwarded.push(xpReward);

        // Token reward
        const tokenReward: Reward = {
          rewardId: `reward_token_${entityId}_${season}`,
          type: 'token',
          amount: tier.tokenBonus,
          description: `${tier.tier.toUpperCase()} Season Ranking Tokens`,
          rarity: tier.rankTo <= 10 ? 'epic' : 'rare',
          source: `ranking_${tier.tier}`,
        };
        this.createRewardClaim(entityId, entityType, entityName, tokenReward, season);
        rewardsAwarded.push(tokenReward);

        // Cosmetic reward
        if (tier.cosmeticReward) {
          const cosmeticReward: Reward = {
            rewardId: `reward_cosmetic_${entityId}_${season}`,
            type: 'cosmetic_nft',
            amount: 1,
            description: `${tier.tier.toUpperCase()} Cosmetic NFT`,
            rarity: tier.rankTo <= 10 ? 'epic' : 'rare',
            source: `ranking_${tier.tier}`,
            metadata: { cosmeticId: tier.cosmeticReward },
          };
          this.createRewardClaim(entityId, entityType, entityName, cosmeticReward, season);
          rewardsAwarded.push(cosmeticReward);
        }

        // NFT reward
        if (tier.nftReward) {
          const nftReward: Reward = {
            rewardId: `reward_nft_${entityId}_${season}`,
            type: 'cosmetic_nft',
            amount: 1,
            description: `${tier.tier.toUpperCase()} Exclusive NFT`,
            rarity: 'legendary',
            source: `ranking_${tier.tier}`,
            metadata: { exclusive: true, tier: tier.tier },
          };
          this.createRewardClaim(entityId, entityType, entityName, nftReward, season);
          rewardsAwarded.push(nftReward);
        }

        break;
      }
    }

    return rewardsAwarded;
  }

  /**
   * Award tier-up rewards
   */
  awardTierUpRewards(
    entityId: string,
    entityType: 'player' | 'team',
    entityName: string,
    newTier: string,
    season: string
  ): Reward[] {
    const rewardsAwarded: Reward[] = [];

    const tierRewards: Record<string, { xp: number; tokens: number; cosmetic?: string }> = {
      silver: { xp: 250, tokens: 50, cosmetic: 'silver_border' },
      gold: { xp: 500, tokens: 100, cosmetic: 'gold_border' },
      platinum: { xp: 750, tokens: 200, cosmetic: 'platinum_border' },
      diamond: { xp: 1000, tokens: 500, cosmetic: 'diamond_aura' },
      master: { xp: 2000, tokens: 1000, cosmetic: 'master_aura' },
    };

    const tierInfo = tierRewards[newTier];
    if (!tierInfo) return rewardsAwarded;

    // XP reward
    const xpReward: Reward = {
      rewardId: `reward_tierup_xp_${entityId}_${newTier}`,
      type: 'xp',
      amount: tierInfo.xp,
      description: `${newTier.toUpperCase()} Tier Reached`,
      rarity: 'rare',
      source: 'tier_promotion',
    };
    this.createRewardClaim(entityId, entityType, entityName, xpReward, season);
    rewardsAwarded.push(xpReward);

    // Token reward
    const tokenReward: Reward = {
      rewardId: `reward_tierup_token_${entityId}_${newTier}`,
      type: 'token',
      amount: tierInfo.tokens,
      description: `${newTier.toUpperCase()} Tier Tokens`,
      rarity: 'rare',
      source: 'tier_promotion',
    };
    this.createRewardClaim(entityId, entityType, entityName, tokenReward, season);
    rewardsAwarded.push(tokenReward);

    // Cosmetic reward
    if (tierInfo.cosmetic) {
      const cosmeticReward: Reward = {
        rewardId: `reward_tierup_cosmetic_${entityId}_${newTier}`,
        type: 'cosmetic_nft',
        amount: 1,
        description: `${newTier.toUpperCase()} Exclusive Cosmetic`,
        rarity: 'epic',
        source: 'tier_promotion',
        metadata: { cosmeticId: tierInfo.cosmetic },
      };
      this.createRewardClaim(entityId, entityType, entityName, cosmeticReward, season);
      rewardsAwarded.push(cosmeticReward);
    }

    return rewardsAwarded;
  }

  /**
   * Award challenge rewards
   */
  awardChallengeReward(
    entityId: string,
    entityType: 'player' | 'team',
    entityName: string,
    challengeType: 'daily' | 'weekly',
    difficulty: 'easy' | 'medium' | 'hard',
    season: string
  ): Reward {
    const rewardTable: Record<string, Record<string, { xp: number; tokens: number }>> = {
      daily: {
        easy: { xp: 50, tokens: 10 },
        medium: { xp: 100, tokens: 25 },
        hard: { xp: 200, tokens: 50 },
      },
      weekly: {
        easy: { xp: 250, tokens: 50 },
        medium: { xp: 500, tokens: 100 },
        hard: { xp: 1000, tokens: 250 },
      },
    };

    const config = rewardTable[challengeType][difficulty];
    const rarityMap: Record<string, 'common' | 'uncommon' | 'rare' | 'epic'> = {
      daily_easy: 'common',
      daily_medium: 'uncommon',
      daily_hard: 'rare',
      weekly_easy: 'uncommon',
      weekly_medium: 'rare',
      weekly_hard: 'epic',
    };

    // Awards are split: XP and tokens as separate rewards
    const xpReward: Reward = {
      rewardId: `reward_challenge_xp_${entityId}_${Date.now()}`,
      type: 'xp',
      amount: config.xp,
      description: `${challengeType.toUpperCase()} ${difficulty.toUpperCase()} Challenge Complete`,
      rarity: rarityMap[`${challengeType}_${difficulty}`],
      source: 'challenge',
    };

    this.createRewardClaim(entityId, entityType, entityName, xpReward, season);

    return xpReward;
  }

  /**
   * Create cosmetic NFT
   */
  createCosmeticNFT(
    name: string,
    description: string,
    type: CosmeticNFT['type'],
    rarity: CosmeticNFT['rarity'],
    colors: CosmeticNFT['colors'],
    exclusive: boolean = false,
    season?: string
  ): CosmeticNFT {
    const cosmeticId = `cosmetic_${Date.now()}`;

    const cosmetic: CosmeticNFT = {
      cosmeticId,
      name,
      description,
      type,
      rarity,
      colors,
      season,
      exclusive,
      mintedDate: Date.now(),
    };

    this.cosmeticNFTs.set(cosmeticId, cosmetic);
    this.saveToStorage();

    return cosmetic;
  }

  /**
   * Get cosmetic NFT
   */
  getCosmeticNFT(cosmeticId: string): CosmeticNFT | undefined {
    return this.cosmeticNFTs.get(cosmeticId);
  }

  /**
   * Get all cosmetics
   */
  getAllCosmetics(): CosmeticNFT[] {
    return Array.from(this.cosmeticNFTs.values());
  }

  /**
   * Get player inventory
   */
  getInventory(entityId: string): CosmeticNFT[] {
    const cosmeticIds = this.playerInventory.get(entityId) || [];
    return cosmeticIds.map((id) => this.cosmeticNFTs.get(id)).filter((c) => c !== undefined) as CosmeticNFT[];
  }

  /**
   * Add to inventory
   */
  addToInventory(entityId: string, cosmeticId: string): void {
    if (!this.playerInventory.has(entityId)) {
      this.playerInventory.set(entityId, []);
    }

    const inventory = this.playerInventory.get(entityId)!;
    if (!inventory.includes(cosmeticId)) {
      inventory.push(cosmeticId);
    }

    this.saveToStorage();
  }

  /**
   * Get reward claim
   */
  getRewardClaim(claimId: string): RewardClaim | undefined {
    return this.claims.get(claimId);
  }

  /**
   * Get season rewards
   */
  getSeasonRewards(season: string, claimed?: boolean): RewardClaim[] {
    let claims = Array.from(this.claims.values()).filter((c) => c.season === season);

    if (claimed !== undefined) {
      claims = claims.filter((c) => c.claimed === claimed);
    }

    return claims;
  }

  /**
   * Get total season rewards
   */
  getTotalSeasonRewards(season: string): { xp: number; tokens: number; cosmetics: number } {
    const claims = this.getSeasonRewards(season, true);

    const totals = {
      xp: 0,
      tokens: 0,
      cosmetics: 0,
    };

    for (const claim of claims) {
      if (claim.reward.type === 'xp') totals.xp += claim.reward.amount;
      if (claim.reward.type === 'token') totals.tokens += claim.reward.amount;
      if (claim.reward.type === 'cosmetic_nft') totals.cosmetics += claim.reward.amount;
    }

    return totals;
  }

  /**
   * Generate ERC-721 metadata for cosmetic NFT
   */
  generateCosmeticMetadata(cosmeticId: string): Record<string, unknown> | null {
    const cosmetic = this.cosmeticNFTs.get(cosmeticId);
    if (!cosmetic) return null;

    return {
      name: cosmetic.name,
      description: cosmetic.description,
      image: `ipfs://cosmetic/${cosmeticId}`,
      attributes: [
        { trait_type: 'Type', value: cosmetic.type },
        { trait_type: 'Rarity', value: cosmetic.rarity },
        { trait_type: 'Exclusive', value: cosmetic.exclusive },
        { trait_type: 'Primary Color', value: cosmetic.colors.primary },
        { trait_type: 'Minted Date', value: new Date(cosmetic.mintedDate).toISOString() },
        ...(cosmetic.season ? [{ trait_type: 'Season', value: cosmetic.season }] : []),
      ],
    };
  }

  /**
   * Private helper: Initialize default cosmetics
   */
  private initializeDefaultCosmetics(): void {
    if (this.cosmeticNFTs.size > 0) return;

    const defaults: Array<{
      name: string;
      description: string;
      type: CosmeticNFT['type'];
      rarity: CosmeticNFT['rarity'];
      colors: CosmeticNFT['colors'];
      id: string;
    }> = [
      {
        id: 'top10_badge',
        name: 'Top 10 Badge',
        description: 'Awarded for ranking in top 10',
        type: 'badge',
        rarity: 'rare',
        colors: { primary: '#FFD700', secondary: '#FFA500' },
      },
      {
        id: 'top25_badge',
        name: 'Top 25 Badge',
        description: 'Awarded for ranking in top 25',
        type: 'badge',
        rarity: 'uncommon',
        colors: { primary: '#C0C0C0', secondary: '#808080' },
      },
      {
        id: 'silver_border',
        name: 'Silver Border',
        description: 'Silver tier exclusive cosmetic',
        type: 'border',
        rarity: 'uncommon',
        colors: { primary: '#C0C0C0', accent: '#808080' },
      },
      {
        id: 'gold_border',
        name: 'Gold Border',
        description: 'Gold tier exclusive cosmetic',
        type: 'border',
        rarity: 'rare',
        colors: { primary: '#FFD700', accent: '#FFA500' },
      },
      {
        id: 'platinum_border',
        name: 'Platinum Border',
        description: 'Platinum tier exclusive cosmetic',
        type: 'border',
        rarity: 'epic',
        colors: { primary: '#E5E4E2', accent: '#D3D3D3' },
      },
      {
        id: 'diamond_aura',
        name: 'Diamond Aura',
        description: 'Diamond tier exclusive effect',
        type: 'aura',
        rarity: 'epic',
        colors: { primary: '#B9F2FF', secondary: '#00CED1', accent: '#00BFFF' },
      },
      {
        id: 'master_aura',
        name: 'Master Aura',
        description: 'Master tier exclusive effect',
        type: 'aura',
        rarity: 'legendary',
        colors: { primary: '#FF1493', secondary: '#FF69B4', accent: '#FFB6C1' },
      },
    ];

    for (const def of defaults) {
      const cosmetic: CosmeticNFT = {
        cosmeticId: def.id,
        name: def.name,
        description: def.description,
        type: def.type,
        rarity: def.rarity,
        colors: def.colors,
        exclusive: false,
        mintedDate: Date.now(),
      };
      this.cosmeticNFTs.set(def.id, cosmetic);
    }

    this.saveToStorage();
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        claims: Array.from(this.claims.entries()),
        cosmeticNFTs: Array.from(this.cosmeticNFTs.entries()),
        playerInventory: Array.from(this.playerInventory.entries()),
      };
      localStorage.setItem('reward_system', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving reward data:', error);
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('reward_system');
      if (stored) {
        const data = JSON.parse(stored);

        if (Array.isArray(data.claims)) {
          for (const [key, value] of data.claims) {
            this.claims.set(key, value);
          }
        }

        if (Array.isArray(data.cosmeticNFTs)) {
          for (const [key, value] of data.cosmeticNFTs) {
            this.cosmeticNFTs.set(key, value);
          }
        }

        if (Array.isArray(data.playerInventory)) {
          for (const [key, value] of data.playerInventory) {
            this.playerInventory.set(key, value);
          }
        }
      }
    } catch (error) {
      console.error('Error loading reward data:', error);
    }
  }
}
