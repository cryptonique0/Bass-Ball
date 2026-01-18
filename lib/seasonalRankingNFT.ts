/**
 * Seasonal Ranking NFT System
 * On-chain seasonal leaderboard with NFT certificates
 */

/**
 * Seasonal ranking achievement
 */
export interface SeasonalRankingNFT {
  // NFT Identifiers
  tokenId: string;
  contractAddress: string;
  chainId: number;

  // Season Information
  seasonId: string; // e.g., "season_2026_winter"
  seasonName: string; // e.g., "Winter 2026"
  seasonStartDate: number; // Timestamp
  seasonEndDate: number; // Timestamp

  // Player Information
  playerId: string;
  playerName: string;
  playerTeam: string;

  // Ranking Data
  finalRank: number; // 1-100+ (position in league)
  totalPoints: number; // Season points earned
  matchesPlayed: number;
  goalsScored: number;
  assists: number;
  averageRating: number; // 0-99

  // Achievement Badge
  badge: 'platinum' | 'gold' | 'silver' | 'bronze' | 'participant';
  tier: number; // 1-100 based on final rank
  leaguePosition: string; // e.g., "Top 10", "Top 25", "Top 50"

  // Ownership
  owner: string;
  issuer: string;
  issuedDate: number;
  mintedDate?: number;

  // Verification
  txHash?: string;
  blockNumber?: number;
  verificationHash?: string;

  // Metadata
  imageUrl?: string;
  metadata?: {
    [key: string]: any;
  };
}

/**
 * Season configuration
 */
export interface SeasonConfig {
  seasonId: string;
  seasonName: string;
  startDate: number;
  endDate: number;
  isActive: boolean;
  totalParticipants: number;
  pointsPerGoal: number;
  pointsPerAssist: number;
  pointsPerWin: number;
  pointsPerDraw: number;
}

/**
 * Badge tier configuration
 */
const BADGE_CONFIG: Record<string, { tier: string; minRank: number; maxRank: number; color: string }> = {
  platinum: { tier: 'Platinum', minRank: 1, maxRank: 5, color: '#E5E4E2' },
  gold: { tier: 'Gold', minRank: 6, maxRank: 25, color: '#FFD700' },
  silver: { tier: 'Silver', minRank: 26, maxRank: 100, color: '#C0C0C0' },
  bronze: { tier: 'Bronze', minRank: 101, maxRank: 500, color: '#CD7F32' },
  participant: { tier: 'Participant', minRank: 501, maxRank: 10000, color: '#808080' },
};

/**
 * Get badge based on rank
 */
function getBadgeFromRank(rank: number): 'platinum' | 'gold' | 'silver' | 'bronze' | 'participant' {
  if (rank <= 5) return 'platinum';
  if (rank <= 25) return 'gold';
  if (rank <= 100) return 'silver';
  if (rank <= 500) return 'bronze';
  return 'participant';
}

/**
 * Get league position description
 */
function getLeaguePosition(rank: number): string {
  if (rank <= 5) return 'Top 5';
  if (rank <= 10) return 'Top 10';
  if (rank <= 25) return 'Top 25';
  if (rank <= 50) return 'Top 50';
  if (rank <= 100) return 'Top 100';
  if (rank <= 500) return 'Top 500';
  return 'Ranked';
}

/**
 * SeasonalRankingNFTManager - Manage seasonal ranking NFTs
 * Handles creation, season management, and metadata generation
 */
export class SeasonalRankingNFTManager {
  private static instance: SeasonalRankingNFTManager;
  private nfts: Map<string, SeasonalRankingNFT> = new Map();
  private seasons: Map<string, SeasonConfig> = new Map();
  private playerSeasonMap: Map<string, Map<string, string>> = new Map(); // playerId -> seasonId -> tokenId
  private currentSeason: string = '';

  private constructor() {
    this.loadFromStorage();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): SeasonalRankingNFTManager {
    if (!SeasonalRankingNFTManager.instance) {
      SeasonalRankingNFTManager.instance = new SeasonalRankingNFTManager();
    }
    return SeasonalRankingNFTManager.instance;
  }

  /**
   * Create a new season
   */
  createSeason(config: SeasonConfig): SeasonConfig {
    this.seasons.set(config.seasonId, config);
    if (config.isActive) {
      this.currentSeason = config.seasonId;
    }
    this.saveToStorage();
    return config;
  }

  /**
   * Get season by ID
   */
  getSeason(seasonId: string): SeasonConfig | undefined {
    return this.seasons.get(seasonId);
  }

  /**
   * Get all seasons
   */
  getAllSeasons(): SeasonConfig[] {
    return Array.from(this.seasons.values());
  }

  /**
   * Get current active season
   */
  getCurrentSeason(): SeasonConfig | undefined {
    return this.seasons.get(this.currentSeason);
  }

  /**
   * Award seasonal ranking NFT
   */
  awardSeasonalRankingNFT(
    playerId: string,
    playerName: string,
    playerTeam: string,
    seasonId: string,
    ranking: {
      finalRank: number;
      totalPoints: number;
      matchesPlayed: number;
      goalsScored: number;
      assists: number;
      averageRating: number;
    },
    owner: string,
    issuer: string
  ): SeasonalRankingNFT {
    const season = this.getSeason(seasonId);
    if (!season) {
      throw new Error(`Season ${seasonId} not found`);
    }

    const badge = getBadgeFromRank(ranking.finalRank);
    const tokenId = `season_${seasonId}_player_${playerId}_${Date.now()}`;

    const nft: SeasonalRankingNFT = {
      tokenId,
      contractAddress: '',
      chainId: 0,
      seasonId,
      seasonName: season.seasonName,
      seasonStartDate: season.startDate,
      seasonEndDate: season.endDate,
      playerId,
      playerName,
      playerTeam,
      finalRank: ranking.finalRank,
      totalPoints: ranking.totalPoints,
      matchesPlayed: ranking.matchesPlayed,
      goalsScored: ranking.goalsScored,
      assists: ranking.assists,
      averageRating: ranking.averageRating,
      badge,
      tier: ranking.finalRank,
      leaguePosition: getLeaguePosition(ranking.finalRank),
      owner,
      issuer,
      issuedDate: Date.now(),
    };

    this.nfts.set(tokenId, nft);

    // Track player's seasonal NFTs
    if (!this.playerSeasonMap.has(playerId)) {
      this.playerSeasonMap.set(playerId, new Map());
    }
    this.playerSeasonMap.get(playerId)!.set(seasonId, tokenId);

    this.saveToStorage();
    return nft;
  }

  /**
   * Get seasonal NFT by token ID
   */
  getNFT(tokenId: string): SeasonalRankingNFT | undefined {
    return this.nfts.get(tokenId);
  }

  /**
   * Get all seasonal NFTs for a player
   */
  getPlayerSeasonalNFTs(playerId: string): SeasonalRankingNFT[] {
    const seasonMap = this.playerSeasonMap.get(playerId);
    if (!seasonMap) return [];
    return Array.from(seasonMap.values()).map((tokenId) => this.nfts.get(tokenId)!);
  }

  /**
   * Get seasonal NFT for player in specific season
   */
  getPlayerSeasonalNFT(playerId: string, seasonId: string): SeasonalRankingNFT | undefined {
    const seasonMap = this.playerSeasonMap.get(playerId);
    if (!seasonMap) return undefined;
    const tokenId = seasonMap.get(seasonId);
    return tokenId ? this.nfts.get(tokenId) : undefined;
  }

  /**
   * Get all NFTs in a season
   */
  getSeasonalNFTs(seasonId: string): SeasonalRankingNFT[] {
    return Array.from(this.nfts.values()).filter((nft) => nft.seasonId === seasonId);
  }

  /**
   * Get NFTs by badge type
   */
  getNFTsByBadge(badge: string): SeasonalRankingNFT[] {
    return Array.from(this.nfts.values()).filter((nft) => nft.badge === badge);
  }

  /**
   * Get leaderboard for season
   */
  getSeasonLeaderboard(seasonId: string): SeasonalRankingNFT[] {
    return this.getSeasonalNFTs(seasonId).sort((a, b) => a.finalRank - b.finalRank);
  }

  /**
   * Get top players by badge
   */
  getTopPlayersByBadge(seasonId: string, badge: string): SeasonalRankingNFT[] {
    return this.getSeasonalNFTs(seasonId)
      .filter((nft) => nft.badge === badge)
      .sort((a, b) => a.finalRank - b.finalRank);
  }

  /**
   * Calculate badge statistics
   */
  getBadgeStats(seasonId: string): Record<string, { count: number; topRank: number }> {
    const nfts = this.getSeasonalNFTs(seasonId);
    const stats: Record<string, { count: number; topRank: number }> = {
      platinum: { count: 0, topRank: 999999 },
      gold: { count: 0, topRank: 999999 },
      silver: { count: 0, topRank: 999999 },
      bronze: { count: 0, topRank: 999999 },
      participant: { count: 0, topRank: 999999 },
    };

    nfts.forEach((nft) => {
      stats[nft.badge].count++;
      stats[nft.badge].topRank = Math.min(stats[nft.badge].topRank, nft.finalRank);
    });

    return stats;
  }

  /**
   * Generate metadata for blockchain
   */
  generateMetadata(nft: SeasonalRankingNFT) {
    const badgeConfig = BADGE_CONFIG[nft.badge];

    return {
      name: `${nft.playerName} - ${nft.seasonName} ${badgeConfig.tier}`,
      description: `${nft.playerName} ranked #${nft.finalRank} in ${nft.seasonName}. Scored ${nft.goalsScored} goals with ${nft.assists} assists across ${nft.matchesPlayed} matches.`,
      image: nft.imageUrl || `https://placeholder.nft/seasonal/${nft.badge}`,
      external_url: `https://bassball.example/seasonal/${nft.seasonId}/${nft.playerId}`,
      attributes: [
        { trait_type: 'Season', value: nft.seasonName },
        { trait_type: 'Badge', value: badgeConfig.tier },
        { trait_type: 'Final Rank', value: nft.finalRank },
        { trait_type: 'League Position', value: nft.leaguePosition },
        { trait_type: 'Total Points', value: nft.totalPoints },
        { trait_type: 'Matches Played', value: nft.matchesPlayed },
        { trait_type: 'Goals Scored', value: nft.goalsScored },
        { trait_type: 'Assists', value: nft.assists },
        { trait_type: 'Average Rating', value: nft.averageRating },
        { trait_type: 'Player Team', value: nft.playerTeam },
      ],
    };
  }

  /**
   * Export NFT as JSON
   */
  exportNFT(tokenId: string): string {
    const nft = this.getNFT(tokenId);
    if (!nft) throw new Error(`NFT ${tokenId} not found`);
    return JSON.stringify(nft, null, 2);
  }

  /**
   * Get all NFTs
   */
  getAllNFTs(): SeasonalRankingNFT[] {
    return Array.from(this.nfts.values());
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        nfts: Array.from(this.nfts.entries()),
        seasons: Array.from(this.seasons.entries()),
        playerSeasonMap: Array.from(this.playerSeasonMap.entries()).map(([playerId, seasonMap]) => [
          playerId,
          Array.from(seasonMap.entries()),
        ]),
        currentSeason: this.currentSeason,
      };
      localStorage.setItem('seasonal_ranking_nfts', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save seasonal ranking NFTs:', error);
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    try {
      const data = JSON.parse(localStorage.getItem('seasonal_ranking_nfts') || '{}');
      if (data.nfts) {
        this.nfts = new Map(data.nfts);
      }
      if (data.seasons) {
        this.seasons = new Map(data.seasons);
      }
      if (data.playerSeasonMap) {
        this.playerSeasonMap = new Map(
          data.playerSeasonMap.map(([playerId, seasonMap]: any) => [playerId, new Map(seasonMap)])
        );
      }
      this.currentSeason = data.currentSeason || '';
    } catch (error) {
      console.error('Failed to load seasonal ranking NFTs:', error);
    }
  }
}

/**
 * Create seasonal ranking NFT
 */
export function createSeasonalRankingNFT(
  playerId: string,
  playerName: string,
  playerTeam: string,
  seasonId: string,
  ranking: {
    finalRank: number;
    totalPoints: number;
    matchesPlayed: number;
    goalsScored: number;
    assists: number;
    averageRating: number;
  },
  owner: string,
  issuer: string = 'platform'
): SeasonalRankingNFT {
  const manager = SeasonalRankingNFTManager.getInstance();
  return manager.awardSeasonalRankingNFT(
    playerId,
    playerName,
    playerTeam,
    seasonId,
    ranking,
    owner,
    issuer
  );
}
