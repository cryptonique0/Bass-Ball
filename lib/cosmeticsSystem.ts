/**
 * Cosmetics & Upgrades System
 * 
 * Manage cosmetic items, unlocks, and player cosmetics
 * Includes skins, effects, accessories, and upgrades
 */

export type CosmeticType = 'skin' | 'effect' | 'accessory' | 'emote' | 'banner';
export type CosmeticRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type CurrencyType = 'soft' | 'hard';
export type UpgradeType = 'power' | 'speed' | 'defense' | 'special';

export interface Cosmetic {
  cosmeticId: string;
  name: string;
  description: string;
  type: CosmeticType;
  rarity: CosmeticRarity;
  imageUrl?: string;
  animationUrl?: string;
  cost: number;
  currencyType: CurrencyType;
  unlockRequirement?: {
    type: 'level' | 'achievement' | 'token' | 'none';
    value?: number;
    description?: string;
  };
  limitedTime?: boolean;
  expiresAt?: number;
  createdAt: number;
  enabled: boolean;
}

export interface Upgrade {
  upgradeId: string;
  name: string;
  description: string;
  type: UpgradeType;
  level: number;
  cost: number;
  costPercentage?: number; // % of current attribute
  currencyType: CurrencyType;
  effect: number; // amount increased per level
  maxLevel: number;
  enabled: boolean;
}

export interface PlayerCosmetic {
  cosmeticId: string;
  playerId: string;
  unlockedAt: number;
  equipped: boolean;
  equippedSlot?: number;
  equippedAt?: number;
}

export interface PlayerUpgrade {
  upgradeId: string;
  playerId: string;
  currentLevel: number;
  unlockedAt: number;
  totalCostPaid: number;
}

export interface CosmeticsConfig {
  maxEquippedPerType: number; // max skins, effects, etc.
  rarityMultiplier: Record<CosmeticRarity, number>; // cost multiplier
  seasonalRotation: boolean;
  seasonDuration: number; // milliseconds
}

/**
 * Cosmetics Manager - Handle cosmetics and upgrades
 * Singleton pattern
 */
export class CosmeticsManager {
  private static instance: CosmeticsManager;
  private cosmetics: Map<string, Cosmetic> = new Map();
  private upgrades: Map<string, Upgrade> = new Map();
  private playerCosmetics: Map<string, PlayerCosmetic[]> = new Map(); // playerId -> cosmetics
  private playerUpgrades: Map<string, PlayerUpgrade[]> = new Map(); // playerId -> upgrades
  private config: CosmeticsConfig = {
    maxEquippedPerType: 1,
    rarityMultiplier: {
      common: 1.0,
      uncommon: 1.5,
      rare: 2.5,
      epic: 5.0,
      legendary: 10.0,
    },
    seasonalRotation: false,
    seasonDuration: 30 * 24 * 60 * 60 * 1000, // 30 days
  };

  private constructor() {
    this.loadFromStorage();
    this.initializeDefaultCosmetics();
  }

  static getInstance(): CosmeticsManager {
    if (!CosmeticsManager.instance) {
      CosmeticsManager.instance = new CosmeticsManager();
    }
    return CosmeticsManager.instance;
  }

  /**
   * Initialize default cosmetics
   */
  private initializeDefaultCosmetics(): void {
    // Skins
    this.addCosmetic({
      cosmeticId: 'skin_default',
      name: 'Default Uniform',
      description: 'Standard player uniform',
      type: 'skin',
      rarity: 'common',
      cost: 0,
      currencyType: 'soft',
      unlockRequirement: { type: 'none' },
      createdAt: Date.now(),
      enabled: true,
    });

    this.addCosmetic({
      cosmeticId: 'skin_gold',
      name: 'Gold Champion',
      description: 'Exclusive gold-trimmed uniform',
      type: 'skin',
      rarity: 'epic',
      cost: 5000,
      currencyType: 'soft',
      unlockRequirement: {
        type: 'level',
        value: 20,
        description: 'Reach level 20',
      },
      createdAt: Date.now(),
      enabled: true,
    });

    this.addCosmetic({
      cosmeticId: 'skin_neon',
      name: 'Neon Striker',
      description: 'Glowing neon design',
      type: 'skin',
      rarity: 'legendary',
      cost: 50,
      currencyType: 'hard',
      unlockRequirement: { type: 'none' },
      createdAt: Date.now(),
      enabled: true,
    });

    // Effects
    this.addCosmetic({
      cosmeticId: 'effect_spark',
      name: 'Spark Effect',
      description: 'Sparkling particle effect on actions',
      type: 'effect',
      rarity: 'uncommon',
      cost: 500,
      currencyType: 'soft',
      createdAt: Date.now(),
      enabled: true,
    });

    this.addCosmetic({
      cosmeticId: 'effect_fire',
      name: 'Fire Burst',
      description: 'Fiery explosion on hit',
      type: 'effect',
      rarity: 'epic',
      cost: 10000,
      currencyType: 'soft',
      createdAt: Date.now(),
      enabled: true,
    });

    // Accessories
    this.addCosmetic({
      cosmeticId: 'acc_crown',
      name: 'Victory Crown',
      description: 'Symbol of championship',
      type: 'accessory',
      rarity: 'legendary',
      cost: 25,
      currencyType: 'hard',
      createdAt: Date.now(),
      enabled: true,
    });

    // Default upgrades
    this.addUpgrade({
      upgradeId: 'upgrade_power_1',
      name: 'Power Boost I',
      description: 'Increase power by 10%',
      type: 'power',
      level: 1,
      cost: 500,
      currencyType: 'soft',
      effect: 0.1,
      maxLevel: 5,
      enabled: true,
    });

    this.addUpgrade({
      upgradeId: 'upgrade_speed_1',
      name: 'Speed Boost I',
      description: 'Increase speed by 5%',
      type: 'speed',
      level: 1,
      cost: 300,
      currencyType: 'soft',
      effect: 0.05,
      maxLevel: 5,
      enabled: true,
    });

    this.addUpgrade({
      upgradeId: 'upgrade_defense_1',
      name: 'Defense Boost I',
      description: 'Increase defense by 7%',
      type: 'defense',
      level: 1,
      cost: 400,
      currencyType: 'soft',
      effect: 0.07,
      maxLevel: 5,
      enabled: true,
    });
  }

  /**
   * Add a cosmetic
   */
  addCosmetic(cosmetic: Cosmetic): void {
    this.cosmetics.set(cosmetic.cosmeticId, cosmetic);
    this.saveToStorage();
  }

  /**
   * Add an upgrade
   */
  addUpgrade(upgrade: Upgrade): void {
    this.upgrades.set(upgrade.upgradeId, upgrade);
    this.saveToStorage();
  }

  /**
   * Get all available cosmetics
   */
  getCosmetics(type?: CosmeticType, rarity?: CosmeticRarity): Cosmetic[] {
    let results = Array.from(this.cosmetics.values()).filter(c => c.enabled);

    if (type) {
      results = results.filter(c => c.type === type);
    }

    if (rarity) {
      results = results.filter(c => c.rarity === rarity);
    }

    // Filter out expired limited-time cosmetics
    results = results.filter(c => !c.limitedTime || !c.expiresAt || Date.now() < c.expiresAt);

    return results.sort((a, b) => b.cost - a.cost);
  }

  /**
   * Get all available upgrades
   */
  getUpgrades(type?: UpgradeType): Upgrade[] {
    let results = Array.from(this.upgrades.values()).filter(u => u.enabled);

    if (type) {
      results = results.filter(u => u.type === type);
    }

    return results.sort((a, b) => a.cost - b.cost);
  }

  /**
   * Unlock cosmetic for player
   */
  unlockCosmetic(
    playerId: string,
    cosmeticId: string
  ): { success: boolean; cosmetic?: Cosmetic; cost?: number } {
    const cosmetic = this.cosmetics.get(cosmeticId);

    if (!cosmetic || !cosmetic.enabled) {
      return { success: false };
    }

    // Check if already owned
    const playerCosms = this.playerCosmetics.get(playerId) || [];
    if (playerCosms.some(pc => pc.cosmeticId === cosmeticId)) {
      return { success: false };
    }

    // Add to player cosmetics
    const playerCosmetic: PlayerCosmetic = {
      cosmeticId,
      playerId,
      unlockedAt: Date.now(),
      equipped: false,
    };

    if (!this.playerCosmetics.has(playerId)) {
      this.playerCosmetics.set(playerId, []);
    }

    this.playerCosmetics.get(playerId)!.push(playerCosmetic);
    this.saveToStorage();

    return { success: true, cosmetic, cost: cosmetic.cost };
  }

  /**
   * Equip cosmetic
   */
  equipCosmetic(playerId: string, cosmeticId: string): boolean {
    const playerCosms = this.playerCosmetics.get(playerId) || [];
    const cosmetic = this.cosmetics.get(cosmeticId);

    if (!cosmetic) {
      return false;
    }

    const playerCosmetic = playerCosms.find(pc => pc.cosmeticId === cosmeticId);
    if (!playerCosmetic) {
      return false;
    }

    // Unequip other cosmetics of same type
    playerCosms.forEach(pc => {
      const cosm = this.cosmetics.get(pc.cosmeticId);
      if (cosm && cosm.type === cosmetic.type && pc.cosmeticId !== cosmeticId) {
        pc.equipped = false;
      }
    });

    // Equip this one
    playerCosmetic.equipped = true;
    playerCosmetic.equippedAt = Date.now();

    this.saveToStorage();
    return true;
  }

  /**
   * Unequip cosmetic
   */
  unequipCosmetic(playerId: string, cosmeticId: string): boolean {
    const playerCosms = this.playerCosmetics.get(playerId) || [];
    const playerCosmetic = playerCosms.find(pc => pc.cosmeticId === cosmeticId);

    if (!playerCosmetic) {
      return false;
    }

    playerCosmetic.equipped = false;

    this.saveToStorage();
    return true;
  }

  /**
   * Get player's cosmetics
   */
  getPlayerCosmetics(playerId: string, equipped?: boolean): PlayerCosmetic[] {
    let cosmetics = this.playerCosmetics.get(playerId) || [];

    if (equipped !== undefined) {
      cosmetics = cosmetics.filter(pc => pc.equipped === equipped);
    }

    return cosmetics.sort((a, b) => b.unlockedAt - a.unlockedAt);
  }

  /**
   * Unlock upgrade for player
   */
  unlockUpgrade(playerId: string, upgradeId: string): { success: boolean; upgrade?: Upgrade; cost?: number } {
    const upgrade = this.upgrades.get(upgradeId);

    if (!upgrade || !upgrade.enabled) {
      return { success: false };
    }

    // Check if already owned
    const playerUpgs = this.playerUpgrades.get(playerId) || [];
    if (playerUpgs.some(pu => pu.upgradeId === upgradeId)) {
      return { success: false };
    }

    // Add to player upgrades
    const playerUpgrade: PlayerUpgrade = {
      upgradeId,
      playerId,
      currentLevel: 1,
      unlockedAt: Date.now(),
      totalCostPaid: upgrade.cost,
    };

    if (!this.playerUpgrades.has(playerId)) {
      this.playerUpgrades.set(playerId, []);
    }

    this.playerUpgrades.get(playerId)!.push(playerUpgrade);
    this.saveToStorage();

    return { success: true, upgrade, cost: upgrade.cost };
  }

  /**
   * Upgrade to next level
   */
  levelUpUpgrade(playerId: string, upgradeId: string): { success: boolean; newLevel?: number; cost?: number } {
    const upgrade = this.upgrades.get(upgradeId);
    if (!upgrade) {
      return { success: false };
    }

    const playerUpgs = this.playerUpgrades.get(playerId) || [];
    const playerUpgrade = playerUpgs.find(pu => pu.upgradeId === upgradeId);

    if (!playerUpgrade || playerUpgrade.currentLevel >= upgrade.maxLevel) {
      return { success: false };
    }

    // Calculate cost (increase per level)
    const baseCost = upgrade.cost;
    const nextLevel = playerUpgrade.currentLevel + 1;
    const cost = Math.floor(baseCost * Math.pow(1.1, nextLevel - 1)); // 10% increase per level

    // Increase level
    playerUpgrade.currentLevel = nextLevel;
    playerUpgrade.totalCostPaid += cost;

    this.saveToStorage();

    return { success: true, newLevel: nextLevel, cost };
  }

  /**
   * Get player's upgrades
   */
  getPlayerUpgrades(playerId: string): PlayerUpgrade[] {
    return (this.playerUpgrades.get(playerId) || []).sort((a, b) => b.unlockedAt - a.unlockedAt);
  }

  /**
   * Get cosmetics by rarity
   */
  getCosmeticsByRarity(): Record<CosmeticRarity, Cosmetic[]> {
    const result: Record<CosmeticRarity, Cosmetic[]> = {
      common: [],
      uncommon: [],
      rare: [],
      epic: [],
      legendary: [],
    };

    this.getCosmetics().forEach(c => {
      result[c.rarity].push(c);
    });

    return result;
  }

  /**
   * Calculate cosmetic cost with rarity multiplier
   */
  calculateCost(baseCost: number, rarity: CosmeticRarity): number {
    const multiplier = this.config.rarityMultiplier[rarity] || 1.0;
    return Math.floor(baseCost * multiplier);
  }

  /**
   * Get configuration
   */
  getConfig(): CosmeticsConfig {
    return { ...this.config };
  }

  /**
   * Set configuration
   */
  setConfig(config: Partial<CosmeticsConfig>): void {
    this.config = { ...this.config, ...config };
    this.saveToStorage();
  }

  /**
   * Get cosmetics statistics
   */
  getStats(): {
    totalCosmetics: number;
    totalUpgrades: number;
    cosmeticsPerRarity: Record<CosmeticRarity, number>;
  } {
    return {
      totalCosmetics: this.cosmetics.size,
      totalUpgrades: this.upgrades.size,
      cosmeticsPerRarity: {
        common: this.getCosmetics('skin', 'common').length,
        uncommon: this.getCosmetics('skin', 'uncommon').length,
        rare: this.getCosmetics('skin', 'rare').length,
        epic: this.getCosmetics('skin', 'epic').length,
        legendary: this.getCosmetics('skin', 'legendary').length,
      },
    };
  }

  /**
   * Persist to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        cosmetics: Array.from(this.cosmetics.entries()),
        upgrades: Array.from(this.upgrades.entries()),
        playerCosmetics: Array.from(this.playerCosmetics.entries()),
        playerUpgrades: Array.from(this.playerUpgrades.entries()),
        config: this.config,
      };
      localStorage.setItem('cosmetics_system', JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save cosmetics data:', e);
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    try {
      const data = JSON.parse(localStorage.getItem('cosmetics_system') || '{}');
      if (data.cosmetics) this.cosmetics = new Map(data.cosmetics);
      if (data.upgrades) this.upgrades = new Map(data.upgrades);
      if (data.playerCosmetics) this.playerCosmetics = new Map(data.playerCosmetics);
      if (data.playerUpgrades) this.playerUpgrades = new Map(data.playerUpgrades);
      if (data.config) this.config = data.config;
    } catch (e) {
      console.warn('Failed to load cosmetics data:', e);
    }
  }

  /**
   * Clear all data (development only)
   */
  clearAll(): void {
    this.cosmetics.clear();
    this.upgrades.clear();
    this.playerCosmetics.clear();
    this.playerUpgrades.clear();
    this.saveToStorage();
  }
}
