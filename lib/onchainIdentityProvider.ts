/**
 * Onchain Identity Badges Provider
 * NFT-based identity badges on Base network for player achievements
 */

interface Badge {
  badgeId: string;
  name: string;
  description: string;
  icon: string;
  
  type: 'og_player' | 'champion' | 'top_1_percent' | 'legend' | 'streak_master' | 'collector';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  
  // Requirements to earn
  requirements: {
    minGamesPlayed?: number;
    minWinRate?: number;
    minRating?: number;
    joinedBefore?: number; // timestamp
    topPercentile?: number; // 1 for top 1%, 5 for top 5%, etc.
    consecutiveWins?: number;
  };
  
  // NFT metadata
  nftContractAddress?: string;
  tokenId?: string;
  chainId: number; // Base: 8453
  
  // Badge stats
  totalMinted: number;
  maxSupply?: number;
  createdAt: number;
}

interface PlayerBadge {
  badgeTokenId: string;
  badgeId: string;
  playerAddress: string;
  playerName: string;
  
  // Earned metadata
  earnedAt: number;
  expiresAt?: number; // Some badges expire (e.g., seasonal)
  
  // Badge info snapshot at time of earning
  badgeSnapshot: Badge;
  
  // Onchain status
  minted: boolean;
  mintTx?: string;
  contractAddress?: string;
  tokenIdOnchain?: string;
  
  // Verification
  verified: boolean;
  verifyingContract?: string;
  
  timestamp: number;
}

interface BadgeRequirement {
  requirementId: string;
  badgeId: string;
  name: string;
  
  condition: {
    type: 'games_played' | 'win_rate' | 'rating' | 'join_date' | 'percentile' | 'streak';
    operator: '>' | '>=' | '<' | '<=' | '=' | 'in_range';
    value: number;
    maxValue?: number; // for ranges
  };
  
  progress?: number; // 0-100
  completed: boolean;
  completedAt?: number;
  
  createdAt: number;
}

interface BadgeMintRequest {
  mintRequestId: string;
  playerAddress: string;
  badgeId: string;
  
  status: 'pending' | 'processing' | 'minted' | 'failed';
  
  // Blockchain data
  txHash?: string;
  contractAddress?: string;
  tokenId?: string;
  
  gasUsed?: string;
  gasCost?: string;
  
  initiatedAt: number;
  completedAt?: number;
  
  error?: string;
}

interface BadgeCollection {
  collectionId: string;
  playerAddress: string;
  playerName: string;
  playerRating: number;
  
  totalBadges: number;
  badges: PlayerBadge[];
  
  primaryBadge: PlayerBadge | null; // displayed on profile
  
  rarity_distribution: {
    common: number;
    uncommon: number;
    rare: number;
    epic: number;
    legendary: number;
  };
  
  collectionValue?: string; // in ETH
  
  lastUpdated: number;
}

interface BadgeLeaderboard {
  leaderboardId: string;
  badgeType: Badge['type'] | 'all';
  period: 'all_time' | 'monthly' | 'seasonal';
  
  entries: Array<{
    rank: number;
    playerAddress: string;
    playerName: string;
    playerRating: number;
    badgeCount: number;
    topBadge: Badge['type'];
    earnedAt: number;
  }>;
  
  snapshot: number;
}

interface BadgeMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  external_url?: string;
}

export class OnchainIdentityProvider {
  private static instance: OnchainIdentityProvider;
  
  private badges: Map<string, Badge> = new Map();
  private playerBadges: Map<string, PlayerBadge[]> = new Map(); // Key: playerAddress
  private badgeRequirements: Map<string, BadgeRequirement[]> = new Map(); // Key: badgeId
  private mintRequests: Map<string, BadgeMintRequest> = new Map();
  private collections: Map<string, BadgeCollection> = new Map(); // Key: playerAddress
  private leaderboards: Map<string, BadgeLeaderboard> = new Map();

  // Configuration
  private readonly BASE_CHAIN_ID = 8453;
  private readonly BADGE_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000'; // Placeholder
  private readonly MAX_BADGES_PER_PLAYER = 10;
  private readonly VERIFICATION_THRESHOLD = 0.8; // 80% requirements met

  private constructor() {
    this.loadFromStorage();
    this.initializeBadges();
    this.initializeBadgeRequirements();
  }

  static getInstance(): OnchainIdentityProvider {
    if (!OnchainIdentityProvider.instance) {
      OnchainIdentityProvider.instance = new OnchainIdentityProvider();
    }
    return OnchainIdentityProvider.instance;
  }

  /**
   * Badge Initialization
   */
  private initializeBadges(): void {
    const badges: Badge[] = [
      {
        badgeId: 'badge_og_player',
        name: 'OG Player',
        description: 'Been here since the beginning',
        icon: '🚀',
        type: 'og_player',
        rarity: 'legendary',
        requirements: {
          joinedBefore: new Date('2024-01-01').getTime(), // Joined in 2024 or earlier
          minGamesPlayed: 5,
        },
        chainId: this.BASE_CHAIN_ID,
        totalMinted: 0,
        createdAt: Date.now(),
      },
      {
        badgeId: 'badge_champion',
        name: 'Champion',
        description: 'Won 50+ matches with 60%+ win rate',
        icon: '🏆',
        type: 'champion',
        rarity: 'epic',
        requirements: {
          minGamesPlayed: 50,
          minWinRate: 60,
          minRating: 70,
        },
        chainId: this.BASE_CHAIN_ID,
        totalMinted: 0,
        createdAt: Date.now(),
      },
      {
        badgeId: 'badge_top_1_percent',
        name: 'Top 1%',
        description: 'Ranked in the top 1% of all players',
        icon: '💎',
        type: 'top_1_percent',
        rarity: 'legendary',
        requirements: {
          topPercentile: 1,
          minRating: 90,
          minGamesPlayed: 100,
        },
        chainId: this.BASE_CHAIN_ID,
        maxSupply: 100, // Only 100 players can have this
        totalMinted: 0,
        createdAt: Date.now(),
      },
      {
        badgeId: 'badge_legend',
        name: 'Living Legend',
        description: 'All-time greatest player',
        icon: '👑',
        type: 'legend',
        rarity: 'legendary',
        requirements: {
          minGamesPlayed: 500,
          minWinRate: 70,
          minRating: 95,
        },
        chainId: this.BASE_CHAIN_ID,
        maxSupply: 10,
        totalMinted: 0,
        createdAt: Date.now(),
      },
      {
        badgeId: 'badge_streak_master',
        name: 'Streak Master',
        description: 'Won 20+ consecutive matches',
        icon: '🔥',
        type: 'streak_master',
        rarity: 'rare',
        requirements: {
          consecutiveWins: 20,
          minGamesPlayed: 30,
        },
        chainId: this.BASE_CHAIN_ID,
        totalMinted: 0,
        createdAt: Date.now(),
      },
      {
        badgeId: 'badge_collector',
        name: 'Badge Collector',
        description: 'Earned 5 different badges',
        icon: '🎖️',
        type: 'collector',
        rarity: 'uncommon',
        requirements: {
          minGamesPlayed: 10,
        },
        chainId: this.BASE_CHAIN_ID,
        totalMinted: 0,
        createdAt: Date.now(),
      },
    ];

    badges.forEach(badge => this.badges.set(badge.badgeId, badge));
  }

  private initializeBadgeRequirements(): void {
    // OG Player requirements
    const ogReqs: BadgeRequirement[] = [
      {
        requirementId: `req_og_joined`,
        badgeId: 'badge_og_player',
        name: 'Joined Early',
        condition: {
          type: 'join_date',
          operator: '<=',
          value: new Date('2024-01-01').getTime(),
        },
        completed: false,
        createdAt: Date.now(),
      },
      {
        requirementId: `req_og_games`,
        badgeId: 'badge_og_player',
        name: 'Played Minimum Games',
        condition: {
          type: 'games_played',
          operator: '>=',
          value: 5,
        },
        completed: false,
        createdAt: Date.now(),
      },
    ];

    // Champion requirements
    const champReqs: BadgeRequirement[] = [
      {
        requirementId: `req_champ_games`,
        badgeId: 'badge_champion',
        name: 'Minimum Games',
        condition: { type: 'games_played', operator: '>=', value: 50 },
        completed: false,
        createdAt: Date.now(),
      },
      {
        requirementId: `req_champ_winrate`,
        badgeId: 'badge_champion',
        name: 'Win Rate',
        condition: { type: 'win_rate', operator: '>=', value: 60 },
        completed: false,
        createdAt: Date.now(),
      },
      {
        requirementId: `req_champ_rating`,
        badgeId: 'badge_champion',
        name: 'Minimum Rating',
        condition: { type: 'rating', operator: '>=', value: 70 },
        completed: false,
        createdAt: Date.now(),
      },
    ];

    // Top 1% requirements
    const top1Reqs: BadgeRequirement[] = [
      {
        requirementId: `req_top1_percentile`,
        badgeId: 'badge_top_1_percent',
        name: 'Top 1% Players',
        condition: { type: 'percentile', operator: '<=', value: 1 },
        completed: false,
        createdAt: Date.now(),
      },
      {
        requirementId: `req_top1_rating`,
        badgeId: 'badge_top_1_percent',
        name: 'Elite Rating',
        condition: { type: 'rating', operator: '>=', value: 90 },
        completed: false,
        createdAt: Date.now(),
      },
      {
        requirementId: `req_top1_games`,
        badgeId: 'badge_top_1_percent',
        name: 'Extensive Experience',
        condition: { type: 'games_played', operator: '>=', value: 100 },
        completed: false,
        createdAt: Date.now(),
      },
    ];

    const allReqs = [...ogReqs, ...champReqs, ...top1Reqs];
    allReqs.forEach(req => {
      if (!this.badgeRequirements.has(req.badgeId)) {
        this.badgeRequirements.set(req.badgeId, []);
      }
      this.badgeRequirements.get(req.badgeId)!.push(req);
    });
  }

  /**
   * Badge Management
   */
  getBadge(badgeId: string): Badge | null {
    return this.badges.get(badgeId) || null;
  }

  getAllBadges(): Badge[] {
    return Array.from(this.badges.values());
  }

  /**
   * Badge Earning Logic
   */
  checkBadgeEligibility(
    playerAddress: string,
    playerName: string,
    stats: {
      gamesPlayed: number;
      wins: number;
      losses: number;
      rating: number;
      joinedAt: number;
      currentStreak?: number;
    }
  ): string[] {
    // Calculate derived stats
    const winRate = stats.gamesPlayed > 0 ? (stats.wins / stats.gamesPlayed) * 100 : 0;

    const eligibleBadges: string[] = [];

    // Check each badge
    this.badges.forEach((badge) => {
      let qualifies = true;

      // Check all requirements
      if (badge.requirements.minGamesPlayed && stats.gamesPlayed < badge.requirements.minGamesPlayed) {
        qualifies = false;
      }

      if (badge.requirements.minWinRate && winRate < badge.requirements.minWinRate) {
        qualifies = false;
      }

      if (badge.requirements.minRating && stats.rating < badge.requirements.minRating) {
        qualifies = false;
      }

      if (badge.requirements.joinedBefore && stats.joinedAt > badge.requirements.joinedBefore) {
        qualifies = false;
      }

      if (badge.requirements.consecutiveWins && (!stats.currentStreak || stats.currentStreak < badge.requirements.consecutiveWins)) {
        qualifies = false;
      }

      if (qualifies) {
        eligibleBadges.push(badge.badgeId);
      }
    });

    return eligibleBadges;
  }

  awardBadge(
    badgeId: string,
    playerAddress: string,
    playerName: string
  ): PlayerBadge {
    const badge = this.getBadge(badgeId);
    if (!badge) {
      throw new Error(`Badge ${badgeId} not found`);
    }

    // Check max supply
    if (badge.maxSupply && badge.totalMinted >= badge.maxSupply) {
      throw new Error(`Badge ${badgeId} has reached max supply`);
    }

    // Check if player already has this badge
    const playerBadges = this.playerBadges.get(playerAddress) || [];
    if (playerBadges.some(b => b.badgeId === badgeId)) {
      throw new Error(`Player already owns badge ${badgeId}`);
    }

    const playerBadge: PlayerBadge = {
      badgeTokenId: `badge_${playerAddress}_${badgeId}_${Date.now()}`,
      badgeId,
      playerAddress,
      playerName,
      earnedAt: Date.now(),
      badgeSnapshot: { ...badge },
      minted: false,
      verified: false,
      timestamp: Date.now(),
    };

    if (!this.playerBadges.has(playerAddress)) {
      this.playerBadges.set(playerAddress, []);
    }

    this.playerBadges.get(playerAddress)!.push(playerBadge);

    // Update badge count
    badge.totalMinted++;

    // Update collection
    this.updateBadgeCollection(playerAddress, playerName, 0);

    this.saveToStorage();
    return playerBadge;
  }

  getPlayerBadges(playerAddress: string): PlayerBadge[] {
    return this.playerBadges.get(playerAddress) || [];
  }

  /**
   * Badge Minting (Onchain)
   */
  requestBadgeMint(
    playerAddress: string,
    badgeId: string
  ): BadgeMintRequest {
    const badge = this.getBadge(badgeId);
    if (!badge) {
      throw new Error(`Badge ${badgeId} not found`);
    }

    const playerBadges = this.getPlayerBadges(playerAddress);
    const playerBadge = playerBadges.find(b => b.badgeId === badgeId);
    if (!playerBadge) {
      throw new Error(`Player does not own badge ${badgeId}`);
    }

    const mintRequest: BadgeMintRequest = {
      mintRequestId: `mint_${playerAddress}_${badgeId}_${Date.now()}`,
      playerAddress,
      badgeId,
      status: 'pending',
      initiatedAt: Date.now(),
    };

    this.mintRequests.set(mintRequest.mintRequestId, mintRequest);
    this.saveToStorage();

    return mintRequest;
  }

  completeBadgeMint(
    mintRequestId: string,
    txHash: string,
    contractAddress: string,
    tokenId: string,
    gasUsed: string
  ): BadgeMintRequest | null {
    const mintRequest = this.mintRequests.get(mintRequestId);
    if (!mintRequest) return null;

    mintRequest.status = 'minted';
    mintRequest.txHash = txHash;
    mintRequest.contractAddress = contractAddress;
    mintRequest.tokenId = tokenId;
    mintRequest.gasUsed = gasUsed;
    mintRequest.completedAt = Date.now();

    // Update player badge
    const playerBadges = this.getPlayerBadges(mintRequest.playerAddress);
    const badge = playerBadges.find(b => b.badgeId === mintRequest.badgeId);
    if (badge) {
      badge.minted = true;
      badge.mintTx = txHash;
      badge.contractAddress = contractAddress;
      badge.tokenIdOnchain = tokenId;
      badge.verified = true;
    }

    this.saveToStorage();
    return mintRequest;
  }

  getMintRequest(mintRequestId: string): BadgeMintRequest | null {
    return this.mintRequests.get(mintRequestId) || null;
  }

  /**
   * Badge Collections
   */
  private updateBadgeCollection(
    playerAddress: string,
    playerName: string,
    playerRating: number
  ): void {
    const playerBadges = this.getPlayerBadges(playerAddress);

    let collection = this.collections.get(playerAddress);
    if (!collection) {
      collection = {
        collectionId: `collection_${playerAddress}`,
        playerAddress,
        playerName,
        playerRating,
        totalBadges: 0,
        badges: [],
        primaryBadge: null,
        rarity_distribution: {
          common: 0,
          uncommon: 0,
          rare: 0,
          epic: 0,
          legendary: 0,
        },
        lastUpdated: Date.now(),
      };
    }

    collection.totalBadges = playerBadges.length;
    collection.badges = playerBadges;
    collection.playerRating = playerRating;
    collection.lastUpdated = Date.now();

    // Set primary badge (most prestigious)
    const rarityOrder = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
    collection.primaryBadge = playerBadges.reduce((highest, current) => {
      const currentRarity = rarityOrder[current.badgeSnapshot.rarity as keyof typeof rarityOrder] || 0;
      const highestRarity = rarityOrder[highest.badgeSnapshot.rarity as keyof typeof rarityOrder] || 0;
      return currentRarity > highestRarity ? current : highest;
    }, playerBadges[0] || null);

    // Calculate rarity distribution
    collection.rarity_distribution = {
      common: 0,
      uncommon: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
    };

    playerBadges.forEach(badge => {
      const rarity = badge.badgeSnapshot.rarity as keyof typeof collection.rarity_distribution;
      collection.rarity_distribution[rarity]++;
    });

    this.collections.set(playerAddress, collection);
  }

  getPlayerCollection(playerAddress: string): BadgeCollection | null {
    return this.collections.get(playerAddress) || null;
  }

  /**
   * Badge Leaderboards
   */
  updateLeaderboard(type: Badge['type'] | 'all'): FrameLeaderboard {
    const allCollections = Array.from(this.collections.values());

    // Filter by type if not 'all'
    let filtered = allCollections;
    if (type !== 'all') {
      filtered = allCollections.filter(col =>
        col.badges.some(b => b.badgeSnapshot.type === type)
      );
    }

    // Sort by badge count, then by rating
    const sorted = filtered.sort((a, b) => {
      if (b.totalBadges !== a.totalBadges) {
        return b.totalBadges - a.totalBadges;
      }
      return b.playerRating - a.playerRating;
    });

    const leaderboard: BadgeLeaderboard = {
      leaderboardId: `leaderboard_${type}_${Date.now()}`,
      badgeType: type,
      period: 'all_time',
      entries: sorted.slice(0, 100).map((collection, idx) => ({
        rank: idx + 1,
        playerAddress: collection.playerAddress,
        playerName: collection.playerName,
        playerRating: collection.playerRating,
        badgeCount: collection.totalBadges,
        topBadge: collection.primaryBadge?.badgeSnapshot.type || 'og_player',
        earnedAt: collection.lastUpdated,
      })),
      snapshot: Date.now(),
    };

    this.leaderboards.set(`${type}_all`, leaderboard);
    this.saveToStorage();

    return leaderboard;
  }

  getLeaderboard(type: Badge['type'] | 'all' = 'all'): BadgeLeaderboard | null {
    return this.leaderboards.get(`${type}_all`) || null;
  }

  /**
   * Badge Metadata (for NFT)
   */
  generateBadgeMetadata(badgeId: string): BadgeMetadata | null {
    const badge = this.getBadge(badgeId);
    if (!badge) return null;

    return {
      name: badge.name,
      description: badge.description,
      image: `ipfs://QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/${badgeId}.png`,
      attributes: [
        { trait_type: 'Type', value: badge.type },
        { trait_type: 'Rarity', value: badge.rarity },
        { trait_type: 'Total Minted', value: badge.totalMinted },
        { trait_type: 'Chain', value: 'Base' },
      ],
      external_url: `https://bassball.io/badges/${badgeId}`,
    };
  }

  /**
   * Verification & Validation
   */
  verifyBadgeOwnership(
    playerAddress: string,
    badgeId: string,
    txHash: string
  ): boolean {
    const badges = this.getPlayerBadges(playerAddress);
    const badge = badges.find(b => b.badgeId === badgeId);

    if (!badge) return false;
    if (!badge.minted) return false;
    if (badge.mintTx !== txHash) return false;

    return true;
  }

  /**
   * Storage
   */
  private saveToStorage(): void {
    try {
      const data = {
        badges: Array.from(this.badges.entries()),
        playerBadges: Array.from(this.playerBadges.entries()),
        badgeRequirements: Array.from(this.badgeRequirements.entries()),
        mintRequests: Array.from(this.mintRequests.entries()),
        collections: Array.from(this.collections.entries()),
        leaderboards: Array.from(this.leaderboards.entries()),
      };
      localStorage['onchain_identity_provider'] = JSON.stringify(data);
    } catch (error) {
      console.error('Failed to save onchain identity provider:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = JSON.parse(localStorage['onchain_identity_provider'] || '{}');
      if (data.badges) this.badges = new Map(data.badges);
      if (data.playerBadges) this.playerBadges = new Map(data.playerBadges);
      if (data.badgeRequirements) this.badgeRequirements = new Map(data.badgeRequirements);
      if (data.mintRequests) this.mintRequests = new Map(data.mintRequests);
      if (data.collections) this.collections = new Map(data.collections);
      if (data.leaderboards) this.leaderboards = new Map(data.leaderboards);
    } catch (error) {
      console.error('Failed to load onchain identity provider:', error);
    }
  }
}

export type {
  Badge,
  PlayerBadge,
  BadgeRequirement,
  BadgeMintRequest,
  BadgeCollection,
  BadgeLeaderboard,
  BadgeMetadata,
};
