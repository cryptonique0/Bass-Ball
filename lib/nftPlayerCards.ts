/**
 * NFT Player Cards System
 * Transferable & Upgradeable player cards with dynamic stats
 */

/**
 * Player card stats - Can be upgraded
 */
export interface PlayerCardStats {
  pace: number; // 0-99: Speed and acceleration
  shooting: number; // 0-99: Shooting accuracy and power
  defense: number; // 0-99: Defensive capability and positioning
}

/**
 * Upgrade history tracking
 */
export interface StatUpgrade {
  timestamp: number;
  stat: keyof PlayerCardStats;
  previousValue: number;
  newValue: number;
  cost: number; // In credits or tokens
  upgrader: string; // Wallet address or player ID
}

/**
 * Complete NFT Player Card
 */
export interface NFTPlayerCard {
  // NFT Identifiers
  tokenId: string; // Unique token ID
  contractAddress: string;
  chainId: number;

  // Player Information
  playerId: string;
  playerName: string;
  playerTeam: string;
  playerPosition: string; // e.g., "Striker", "Midfielder", "Defender"
  playerNumber?: number;

  // Stats (0-99 scale)
  stats: PlayerCardStats;

  // Card Metadata
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  issuedDate: number; // Timestamp
  issuer: string; // Team/Platform address

  // Transferability
  owner: string; // Current owner wallet
  previousOwners: string[]; // History of owners
  isTransferable: boolean;
  transferFee?: number; // Percentage fee on transfer (0-50)

  // Upgrade System
  upgradeable: boolean;
  maxUpgrades: number;
  upgradesUsed: number;
  upgradeHistory: StatUpgrade[];
  nextUpgradeCost?: number; // Cost to upgrade next stat

  // Metadata
  imageUrl?: string;
  metadata?: {
    [key: string]: any;
  };

  // On-Chain Record
  txHash?: string; // Blockchain transaction
  blockNumber?: number;
  verificationHash?: string;
}

/**
 * Card rarity configuration
 */
const RARITY_CONFIG: Record<string, { maxStats: number; maxUpgrades: number; color: string }> = {
  common: { maxStats: 65, maxUpgrades: 3, color: '#808080' },
  uncommon: { maxStats: 75, maxUpgrades: 5, color: '#4CBB17' },
  rare: { maxStats: 85, maxUpgrades: 8, color: '#0066FF' },
  epic: { maxStats: 92, maxUpgrades: 12, color: '#9933FF' },
  legendary: { maxStats: 99, maxUpgrades: 20, color: '#FFD700' },
};

/**
 * NFTPlayerCardManager - Manage NFT player cards
 * Handles minting, upgrades, transfers, and metadata
 */
export class NFTPlayerCardManager {
  private static instance: NFTPlayerCardManager;
  private cards: Map<string, NFTPlayerCard> = new Map();
  private playerCardMap: Map<string, string[]> = new Map(); // playerId -> tokenIds
  private ownerCardMap: Map<string, string[]> = new Map(); // owner -> tokenIds

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): NFTPlayerCardManager {
    if (!NFTPlayerCardManager.instance) {
      NFTPlayerCardManager.instance = new NFTPlayerCardManager();
      NFTPlayerCardManager.instance.loadFromStorage();
    }
    return NFTPlayerCardManager.instance;
  }

  /**
   * Mint a new player card NFT
   */
  mintPlayerCard(
    playerId: string,
    playerName: string,
    playerTeam: string,
    playerPosition: string,
    stats: Partial<PlayerCardStats>,
    rarity: string = 'common',
    issuer: string = 'platform',
    owner: string = ''
  ): NFTPlayerCard {
    const tokenId = this.generateTokenId();

    // Validate stats against rarity
    const config = RARITY_CONFIG[rarity as keyof typeof RARITY_CONFIG] || RARITY_CONFIG.common;
    const validatedStats: PlayerCardStats = {
      pace: Math.min(stats.pace || 60, config.maxStats),
      shooting: Math.min(stats.shooting || 60, config.maxStats),
      defense: Math.min(stats.defense || 60, config.maxStats),
    };

    const card: NFTPlayerCard = {
      tokenId,
      contractAddress: 'tbd', // Set during on-chain mint
      chainId: 0,
      playerId,
      playerName,
      playerTeam,
      playerPosition,
      stats: validatedStats,
      rarity: rarity as NFTPlayerCard['rarity'],
      issuedDate: Math.floor(Date.now() / 1000),
      issuer,
      owner: owner || issuer,
      previousOwners: [issuer],
      isTransferable: true,
      transferFee: 2.5, // 2.5% default
      upgradeable: true,
      maxUpgrades: config.maxUpgrades,
      upgradesUsed: 0,
      upgradeHistory: [],
      nextUpgradeCost: this.calculateUpgradeCost(0, rarity),
    };

    this.cards.set(tokenId, card);

    // Track player cards
    if (!this.playerCardMap.has(playerId)) {
      this.playerCardMap.set(playerId, []);
    }
    this.playerCardMap.get(playerId)!.push(tokenId);

    // Track owner cards
    if (!this.ownerCardMap.has(owner)) {
      this.ownerCardMap.set(owner, []);
    }
    this.ownerCardMap.get(owner)!.push(tokenId);

    this.saveToStorage();

    return card;
  }

  /**
   * Upgrade a player stat
   */
  upgradeStat(
    tokenId: string,
    stat: keyof PlayerCardStats,
    cost: number,
    upgrader: string
  ): NFTPlayerCard {
    const card = this.cards.get(tokenId);
    if (!card) {
      throw new Error(`Card ${tokenId} not found`);
    }

    if (!card.upgradeable) {
      throw new Error('Card is not upgradeable');
    }

    if (card.upgradesUsed >= card.maxUpgrades) {
      throw new Error(`Card has reached max upgrades (${card.maxUpgrades})`);
    }

    const config = RARITY_CONFIG[card.rarity];
    if (card.stats[stat] >= config.maxStats) {
      throw new Error(`${stat} is already at maximum for ${card.rarity} rarity`);
    }

    const previousValue = card.stats[stat];
    const newValue = Math.min(previousValue + 1, config.maxStats);

    // Record upgrade
    const upgrade: StatUpgrade = {
      timestamp: Math.floor(Date.now() / 1000),
      stat,
      previousValue,
      newValue,
      cost,
      upgrader,
    };

    card.stats[stat] = newValue;
    card.upgradesUsed += 1;
    card.upgradeHistory.push(upgrade);
    card.nextUpgradeCost = this.calculateUpgradeCost(
      card.upgradesUsed,
      card.rarity
    );

    this.saveToStorage();

    return card;
  }

  /**
   * Transfer card to new owner
   */
  transferCard(
    tokenId: string,
    fromOwner: string,
    toOwner: string,
    transferFee: number = 0
  ): NFTPlayerCard {
    const card = this.cards.get(tokenId);
    if (!card) {
      throw new Error(`Card ${tokenId} not found`);
    }

    if (!card.isTransferable) {
      throw new Error('Card is not transferable');
    }

    if (card.owner !== fromOwner) {
      throw new Error(`Card is not owned by ${fromOwner}`);
    }

    // Update ownership
    card.owner = toOwner;
    card.previousOwners.push(toOwner);

    // Remove from old owner's cards
    const oldOwnerCards = this.ownerCardMap.get(fromOwner);
    if (oldOwnerCards) {
      const idx = oldOwnerCards.indexOf(tokenId);
      if (idx !== -1) {
        oldOwnerCards.splice(idx, 1);
      }
    }

    // Add to new owner's cards
    if (!this.ownerCardMap.has(toOwner)) {
      this.ownerCardMap.set(toOwner, []);
    }
    this.ownerCardMap.get(toOwner)!.push(tokenId);

    this.saveToStorage();

    return card;
  }

  /**
   * Lock card (make non-transferable)
   */
  lockCard(tokenId: string): NFTPlayerCard {
    const card = this.cards.get(tokenId);
    if (!card) {
      throw new Error(`Card ${tokenId} not found`);
    }

    card.isTransferable = false;
    this.saveToStorage();
    return card;
  }

  /**
   * Unlock card (make transferable)
   */
  unlockCard(tokenId: string): NFTPlayerCard {
    const card = this.cards.get(tokenId);
    if (!card) {
      throw new Error(`Card ${tokenId} not found`);
    }

    card.isTransferable = true;
    this.saveToStorage();
    return card;
  }

  /**
   * Get card by token ID
   */
  getCard(tokenId: string): NFTPlayerCard | undefined {
    return this.cards.get(tokenId);
  }

  /**
   * Get all cards for a player
   */
  getPlayerCards(playerId: string): NFTPlayerCard[] {
    const tokenIds = this.playerCardMap.get(playerId) || [];
    return tokenIds.map((id) => this.cards.get(id)!).filter((c) => c);
  }

  /**
   * Get all cards owned by an address
   */
  getOwnersCards(owner: string): NFTPlayerCard[] {
    const tokenIds = this.ownerCardMap.get(owner) || [];
    return tokenIds.map((id) => this.cards.get(id)!).filter((c) => c);
  }

  /**
   * Get all cards by rarity
   */
  getCardsByRarity(rarity: string): NFTPlayerCard[] {
    return Array.from(this.cards.values()).filter((c) => c.rarity === rarity);
  }

  /**
   * Calculate overall card rating (0-99)
   */
  calculateCardRating(card: NFTPlayerCard): number {
    const { pace, shooting, defense } = card.stats;
    return Math.round((pace + shooting + defense) / 3);
  }

  /**
   * Compare two cards
   */
  compareCards(
    card1: NFTPlayerCard,
    card2: NFTPlayerCard
  ): { winner: NFTPlayerCard; rating1: number; rating2: number } {
    const rating1 = this.calculateCardRating(card1);
    const rating2 = this.calculateCardRating(card2);

    return {
      winner: rating1 >= rating2 ? card1 : card2,
      rating1,
      rating2,
    };
  }

  /**
   * Get rarity configuration
   */
  getRarityConfig(rarity: string) {
    return RARITY_CONFIG[rarity] || RARITY_CONFIG.common;
  }

  /**
   * Generate card metadata for blockchain
   */
  generateMetadata(card: NFTPlayerCard): {
    name: string;
    description: string;
    image: string;
    attributes: Array<{ trait_type: string; value: any }>;
  } {
    const rating = this.calculateCardRating(card);

    return {
      name: `${card.playerName} - ${card.rarity.toUpperCase()} Card`,
      description: `NFT Player Card for ${card.playerName} (${card.playerTeam}). Position: ${card.playerPosition}. Overall Rating: ${rating}`,
      image: card.imageUrl || `https://cards.example.com/${card.tokenId}.png`,
      attributes: [
        { trait_type: 'Player Name', value: card.playerName },
        { trait_type: 'Team', value: card.playerTeam },
        { trait_type: 'Position', value: card.playerPosition },
        { trait_type: 'Rarity', value: card.rarity },
        { trait_type: 'Pace', value: card.stats.pace },
        { trait_type: 'Shooting', value: card.stats.shooting },
        { trait_type: 'Defense', value: card.stats.defense },
        { trait_type: 'Overall Rating', value: rating },
        { trait_type: 'Upgrades Used', value: card.upgradesUsed },
        { trait_type: 'Max Upgrades', value: card.maxUpgrades },
        { trait_type: 'Transferable', value: card.isTransferable },
        { trait_type: 'Issued Date', value: new Date(card.issuedDate * 1000).toISOString() },
      ],
    };
  }

  /**
   * Get all cards
   */
  getAllCards(): NFTPlayerCard[] {
    return Array.from(this.cards.values());
  }

  /**
   * Export card to JSON
   */
  exportCard(tokenId: string): string {
    const card = this.cards.get(tokenId);
    if (!card) {
      throw new Error(`Card ${tokenId} not found`);
    }
    return JSON.stringify(card, null, 2);
  }

  /**
   * Calculate upgrade cost
   */
  private calculateUpgradeCost(upgradesUsed: number, rarity: string): number {
    const rarityMultiplier = Object.keys(RARITY_CONFIG).indexOf(rarity) + 1;
    return Math.round((upgradesUsed + 1) * 10 * rarityMultiplier);
  }

  /**
   * Generate unique token ID
   */
  private generateTokenId(): string {
    return 'card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    const data = {
      cards: Array.from(this.cards.entries()),
      playerCardMap: Array.from(this.playerCardMap.entries()),
      ownerCardMap: Array.from(this.ownerCardMap.entries()),
    };
    localStorage.setItem('nft_player_cards', JSON.stringify(data));
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    const data = localStorage.getItem('nft_player_cards');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        this.cards = new Map(parsed.cards);
        this.playerCardMap = new Map(parsed.playerCardMap);
        this.ownerCardMap = new Map(parsed.ownerCardMap);
      } catch (e) {
        console.error('Failed to load player cards from storage:', e);
      }
    }
  }
}

/**
 * Helper functions
 */
export function createPlayerCard(
  playerId: string,
  playerName: string,
  playerTeam: string,
  playerPosition: string,
  stats: Partial<PlayerCardStats>,
  rarity?: string,
  owner?: string
): NFTPlayerCard {
  const manager = NFTPlayerCardManager.getInstance();
  return manager.mintPlayerCard(
    playerId,
    playerName,
    playerTeam,
    playerPosition,
    stats,
    rarity,
    'platform',
    owner
  );
}

export function upgradePlayerCardStat(
  tokenId: string,
  stat: keyof PlayerCardStats,
  upgrader: string
): NFTPlayerCard {
  const manager = NFTPlayerCardManager.getInstance();
  const card = manager.getCard(tokenId);
  if (!card) throw new Error(`Card ${tokenId} not found`);

  const cost = card.nextUpgradeCost || 0;
  return manager.upgradeStat(tokenId, stat, cost, upgrader);
}

export function transferPlayerCard(
  tokenId: string,
  toOwner: string,
  fromOwner: string
): NFTPlayerCard {
  const manager = NFTPlayerCardManager.getInstance();
  const card = manager.getCard(tokenId);
  if (!card) throw new Error(`Card ${tokenId} not found`);

  const fee = card.transferFee || 0;
  return manager.transferCard(tokenId, fromOwner, toOwner, fee);
}

export default NFTPlayerCardManager;
