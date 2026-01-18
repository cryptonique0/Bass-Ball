/**
 * Team Ownership NFT System
 * On-chain NFTs representing team ownership and governance rights
 */

/**
 * Team ownership NFT
 */
export interface TeamOwnershipNFT {
  // NFT Identifiers
  tokenId: string;
  contractAddress: string;
  chainId: number;

  // Team Information
  teamId: string;
  teamName: string;
  teamCity: string;
  teamBadgeUrl?: string;

  // Ownership Details
  owner: string; // Primary owner
  ownershipPercentage: number; // 0-100
  ownershipTier: 'founder' | 'major' | 'minor' | 'supporter';

  // Governance
  votingRights: boolean;
  yearsOwned: number;
  governanceVotingPower: number; // 1-100 based on stake

  // Rights & Privileges
  revenueShare: number; // Percentage of team revenue
  matchTicketAllowance: number; // Number of free tickets per season
  merchandiseDiscount: number; // % discount on merch
  boardSeatEligible: boolean;

  // Team Performance Linked
  teamTotalMatches: number;
  teamWins: number;
  teamDraws: number;
  teamLosses: number;
  teamWinPercentage: number;

  // Ownership History
  previousOwners: string[];
  transferHistory: Array<{
    from: string;
    to: string;
    timestamp: number;
    txHash?: string;
  }>;

  // Dates
  issuedDate: number;
  acquiredDate: number;
  issuer: string;

  // Metadata
  customBadgeUrl?: string;
  metadata?: {
    [key: string]: any;
  };

  // On-Chain Records
  txHash?: string;
  blockNumber?: number;
  verificationHash?: string;
}

/**
 * Ownership tier configuration
 */
const OWNERSHIP_TIER_CONFIG: Record<
  string,
  { minPercentage: number; maxPercentage: number; votingPower: number; governance: boolean }
> = {
  founder: { minPercentage: 50, maxPercentage: 100, votingPower: 100, governance: true },
  major: { minPercentage: 20, maxPercentage: 49, votingPower: 75, governance: true },
  minor: { minPercentage: 5, maxPercentage: 19, votingPower: 50, governance: false },
  supporter: { minPercentage: 1, maxPercentage: 4, votingPower: 10, governance: false },
};

/**
 * Get ownership tier from percentage
 */
function getOwnershipTier(
  percentage: number
): 'founder' | 'major' | 'minor' | 'supporter' {
  if (percentage >= 50) return 'founder';
  if (percentage >= 20) return 'major';
  if (percentage >= 5) return 'minor';
  return 'supporter';
}

/**
 * Calculate privileges based on tier
 */
function calculatePrivileges(
  percentage: number
): {
  revenueShare: number;
  matchTicketAllowance: number;
  merchandiseDiscount: number;
  boardSeatEligible: boolean;
} {
  if (percentage >= 50)
    return {
      revenueShare: percentage,
      matchTicketAllowance: 100,
      merchandiseDiscount: 50,
      boardSeatEligible: true,
    };
  if (percentage >= 20)
    return {
      revenueShare: percentage,
      matchTicketAllowance: 50,
      merchandiseDiscount: 30,
      boardSeatEligible: true,
    };
  if (percentage >= 5)
    return {
      revenueShare: percentage,
      matchTicketAllowance: 20,
      merchandiseDiscount: 15,
      boardSeatEligible: false,
    };
  return {
    revenueShare: percentage,
    matchTicketAllowance: 5,
    merchandiseDiscount: 5,
    boardSeatEligible: false,
  };
}

/**
 * TeamOwnershipNFTManager - Manage team ownership NFTs
 * Handles issuance, transfers, and governance
 */
export class TeamOwnershipNFTManager {
  private static instance: TeamOwnershipNFTManager;
  private nfts: Map<string, TeamOwnershipNFT> = new Map();
  private teamOwnershipMap: Map<string, string[]> = new Map(); // teamId -> tokenIds
  private ownerTeamMap: Map<string, Map<string, string>> = new Map(); // owner -> teamId -> tokenId

  private constructor() {
    this.loadFromStorage();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): TeamOwnershipNFTManager {
    if (!TeamOwnershipNFTManager.instance) {
      TeamOwnershipNFTManager.instance = new TeamOwnershipNFTManager();
    }
    return TeamOwnershipNFTManager.instance;
  }

  /**
   * Issue team ownership NFT
   */
  issueTeamOwnershipNFT(
    teamId: string,
    teamName: string,
    teamCity: string,
    ownershipPercentage: number,
    owner: string,
    issuer: string = 'platform'
  ): TeamOwnershipNFT {
    if (ownershipPercentage <= 0 || ownershipPercentage > 100) {
      throw new Error('Ownership percentage must be between 0 and 100');
    }

    const tier = getOwnershipTier(ownershipPercentage);
    const tierConfig = OWNERSHIP_TIER_CONFIG[tier];
    const privileges = calculatePrivileges(ownershipPercentage);
    const tokenId = `team_${teamId}_owner_${owner}_${Date.now()}`;

    const nft: TeamOwnershipNFT = {
      tokenId,
      contractAddress: '',
      chainId: 0,
      teamId,
      teamName,
      teamCity,
      owner,
      ownershipPercentage,
      ownershipTier: tier,
      votingRights: tierConfig.governance,
      yearsOwned: 0,
      governanceVotingPower: tierConfig.votingPower,
      revenueShare: privileges.revenueShare,
      matchTicketAllowance: privileges.matchTicketAllowance,
      merchandiseDiscount: privileges.merchandiseDiscount,
      boardSeatEligible: privileges.boardSeatEligible,
      teamTotalMatches: 0,
      teamWins: 0,
      teamDraws: 0,
      teamLosses: 0,
      teamWinPercentage: 0,
      previousOwners: [issuer],
      transferHistory: [],
      issuedDate: Date.now(),
      acquiredDate: Date.now(),
      issuer,
    };

    this.nfts.set(tokenId, nft);

    // Track team ownership
    if (!this.teamOwnershipMap.has(teamId)) {
      this.teamOwnershipMap.set(teamId, []);
    }
    this.teamOwnershipMap.get(teamId)!.push(tokenId);

    // Track owner's teams
    if (!this.ownerTeamMap.has(owner)) {
      this.ownerTeamMap.set(owner, new Map());
    }
    this.ownerTeamMap.get(owner)!.set(teamId, tokenId);

    this.saveToStorage();
    return nft;
  }

  /**
   * Transfer ownership
   */
  transferOwnership(
    tokenId: string,
    fromOwner: string,
    toOwner: string,
    txHash?: string
  ): TeamOwnershipNFT {
    const nft = this.nfts.get(tokenId);
    if (!nft) throw new Error(`NFT ${tokenId} not found`);
    if (nft.owner !== fromOwner) throw new Error('Not the current owner');

    // Update ownership
    nft.previousOwners.push(fromOwner);
    nft.owner = toOwner;
    nft.transferHistory.push({
      from: fromOwner,
      to: toOwner,
      timestamp: Date.now(),
      txHash,
    });

    // Update owner map
    this.ownerTeamMap.get(fromOwner)?.delete(nft.teamId);
    if (!this.ownerTeamMap.has(toOwner)) {
      this.ownerTeamMap.set(toOwner, new Map());
    }
    this.ownerTeamMap.get(toOwner)!.set(nft.teamId, tokenId);

    this.saveToStorage();
    return nft;
  }

  /**
   * Update team performance stats
   */
  updateTeamStats(
    teamId: string,
    stats: {
      totalMatches: number;
      wins: number;
      draws: number;
      losses: number;
    }
  ): void {
    const tokenIds = this.teamOwnershipMap.get(teamId) || [];
    const winPercentage = stats.totalMatches > 0 ? (stats.wins / stats.totalMatches) * 100 : 0;

    tokenIds.forEach((tokenId) => {
      const nft = this.nfts.get(tokenId);
      if (nft) {
        nft.teamTotalMatches = stats.totalMatches;
        nft.teamWins = stats.wins;
        nft.teamDraws = stats.draws;
        nft.teamLosses = stats.losses;
        nft.teamWinPercentage = winPercentage;
      }
    });

    this.saveToStorage();
  }

  /**
   * Update ownership years
   */
  updateOwnershipYears(tokenId: string, years: number): TeamOwnershipNFT {
    const nft = this.nfts.get(tokenId);
    if (!nft) throw new Error(`NFT ${tokenId} not found`);
    nft.yearsOwned = years;
    this.saveToStorage();
    return nft;
  }

  /**
   * Get NFT by token ID
   */
  getNFT(tokenId: string): TeamOwnershipNFT | undefined {
    return this.nfts.get(tokenId);
  }

  /**
   * Get all ownership NFTs for team
   */
  getTeamOwnershipNFTs(teamId: string): TeamOwnershipNFT[] {
    const tokenIds = this.teamOwnershipMap.get(teamId) || [];
    return tokenIds.map((tokenId) => this.nfts.get(tokenId)!);
  }

  /**
   * Get current owner's NFT for team
   */
  getTeamCurrentOwner(teamId: string): TeamOwnershipNFT | undefined {
    const nfts = this.getTeamOwnershipNFTs(teamId);
    return nfts[nfts.length - 1]; // Latest owner
  }

  /**
   * Get all teams owned by address
   */
  getOwnerTeams(owner: string): TeamOwnershipNFT[] {
    const teamMap = this.ownerTeamMap.get(owner);
    if (!teamMap) return [];
    return Array.from(teamMap.values()).map((tokenId) => this.nfts.get(tokenId)!);
  }

  /**
   * Get ownership by tier
   */
  getNFTsByTier(tier: string): TeamOwnershipNFT[] {
    return Array.from(this.nfts.values()).filter((nft) => nft.ownershipTier === tier);
  }

  /**
   * Get total ownership percentage for team
   */
  getTeamTotalOwnership(teamId: string): number {
    const nfts = this.getTeamOwnershipNFTs(teamId);
    return nfts.reduce((total, nft) => total + nft.ownershipPercentage, 0);
  }

  /**
   * Get voting power distribution for team
   */
  getTeamVotingPower(teamId: string): Array<{
    owner: string;
    votingPower: number;
    percentage: number;
  }> {
    const nfts = this.getTeamOwnershipNFTs(teamId);
    const totalPower = nfts.reduce((sum, nft) => sum + nft.governanceVotingPower, 0);

    return nfts.map((nft) => ({
      owner: nft.owner,
      votingPower: nft.governanceVotingPower,
      percentage: totalPower > 0 ? (nft.governanceVotingPower / totalPower) * 100 : 0,
    }));
  }

  /**
   * Generate metadata for blockchain
   */
  generateMetadata(nft: TeamOwnershipNFT) {
    return {
      name: `${nft.teamName} Ownership - ${nft.ownershipPercentage}%`,
      description: `${nft.ownershipPercentage}% ownership of ${nft.teamName} from ${nft.teamCity}. Team record: ${nft.teamWins}-${nft.teamDraws}-${nft.teamLosses} with ${nft.teamWinPercentage.toFixed(1)}% win rate.`,
      image:
        nft.customBadgeUrl ||
        nft.teamBadgeUrl ||
        `https://placeholder.nft/team/${nft.teamId}`,
      external_url: `https://bassball.example/team/${nft.teamId}/ownership`,
      attributes: [
        { trait_type: 'Team Name', value: nft.teamName },
        { trait_type: 'Ownership Percentage', value: `${nft.ownershipPercentage}%` },
        { trait_type: 'Ownership Tier', value: nft.ownershipTier },
        { trait_type: 'Voting Rights', value: nft.votingRights ? 'Yes' : 'No' },
        { trait_type: 'Revenue Share', value: `${nft.revenueShare}%` },
        { trait_type: 'Board Seat Eligible', value: nft.boardSeatEligible ? 'Yes' : 'No' },
        { trait_type: 'Team Win Percentage', value: `${nft.teamWinPercentage.toFixed(1)}%` },
        { trait_type: 'Team Record', value: `${nft.teamWins}-${nft.teamDraws}-${nft.teamLosses}` },
        { trait_type: 'Years Owned', value: nft.yearsOwned },
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
  getAllNFTs(): TeamOwnershipNFT[] {
    return Array.from(this.nfts.values());
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        nfts: Array.from(this.nfts.entries()),
        teamOwnershipMap: Array.from(this.teamOwnershipMap.entries()),
        ownerTeamMap: Array.from(this.ownerTeamMap.entries()).map(([owner, teamMap]) => [
          owner,
          Array.from(teamMap.entries()),
        ]),
      };
      localStorage.setItem('team_ownership_nfts', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save team ownership NFTs:', error);
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    try {
      const data = JSON.parse(localStorage.getItem('team_ownership_nfts') || '{}');
      if (data.nfts) {
        this.nfts = new Map(data.nfts);
      }
      if (data.teamOwnershipMap) {
        this.teamOwnershipMap = new Map(data.teamOwnershipMap);
      }
      if (data.ownerTeamMap) {
        this.ownerTeamMap = new Map(
          data.ownerTeamMap.map(([owner, teamMap]: any) => [owner, new Map(teamMap)])
        );
      }
    } catch (error) {
      console.error('Failed to load team ownership NFTs:', error);
    }
  }
}

/**
 * Issue team ownership NFT
 */
export function issueTeamOwnershipNFT(
  teamId: string,
  teamName: string,
  teamCity: string,
  ownershipPercentage: number,
  owner: string,
  issuer?: string
): TeamOwnershipNFT {
  const manager = TeamOwnershipNFTManager.getInstance();
  return manager.issueTeamOwnershipNFT(
    teamId,
    teamName,
    teamCity,
    ownershipPercentage,
    owner,
    issuer
  );
}
