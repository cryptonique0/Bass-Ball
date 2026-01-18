/**
 * Burn & Sink System - Currency & NFT Removal Mechanics
 * 
 * Allows:
 * - Burning NFTs (permanent removal from circulation)
 * - Sinking currency (temporary or permanent removal)
 * - Burn rewards and incentives
 * - Balance adjustments
 */

export type BurnType = 'nft' | 'soft_currency' | 'hard_currency';
export type SinkType = 'temp_lock' | 'permanent_sink' | 'staking';

export interface BurnRecord {
  burnId: string;
  burnType: BurnType;
  entityId: string;
  entityName: string;
  nftId?: string;
  amount?: number;
  currencyType?: 'soft' | 'hard';
  reward?: number;
  rewardType?: 'soft' | 'hard';
  timestamp: number;
  reason?: string;
  verified: boolean;
}

export interface SinkRecord {
  sinkId: string;
  sinkType: SinkType;
  entityId: string;
  entityName: string;
  amount: number;
  currencyType: 'soft' | 'hard';
  sunkAt: number;
  releasedAt?: number;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface BurnStats {
  totalNFTsBurned: number;
  totalSoftBurned: number;
  totalHardBurned: number;
  totalRewardsGiven: number;
  totalSinked: number;
  burnRate: number; // percentage
}

export interface BurnMechanic {
  mechanicId: string;
  name: string;
  description: string;
  enabled: boolean;
  burnType: BurnType;
  reward?: number;
  rewardType?: 'soft' | 'hard';
  burnLimit?: number;
  dailyLimit?: number;
  cooldown?: number; // milliseconds
}

export interface SinkMechanic {
  mechanicId: string;
  name: string;
  description: string;
  enabled: boolean;
  sinkType: SinkType;
  lockDuration?: number; // milliseconds for temp lock
  purpose: string; // e.g., "tournament_escrow", "battle_fee", "cosmetic_unlock"
}

/**
 * Burn & Sink Manager - Handle NFT/Currency removal
 * Singleton pattern
 */
export class BurnSinkManager {
  private static instance: BurnSinkManager;
  private burns: Map<string, BurnRecord> = new Map();
  private sinks: Map<string, SinkRecord> = new Map();
  private userBurns: Map<string, string[]> = new Map(); // userId -> burnIds
  private userSinks: Map<string, string[]> = new Map(); // userId -> sinkIds
  private burnMechanics: Map<string, BurnMechanic> = new Map();
  private sinkMechanics: Map<string, SinkMechanic> = new Map();
  private userBurnCounts: Map<string, number> = new Map(); // daily tracking
  private lastBurnTime: Map<string, number> = new Map(); // cooldown tracking

  private stats: BurnStats = {
    totalNFTsBurned: 0,
    totalSoftBurned: 0,
    totalHardBurned: 0,
    totalRewardsGiven: 0,
    totalSinked: 0,
    burnRate: 0,
  };

  private constructor() {
    this.loadFromStorage();
    this.initDefaultMechanics();
  }

  static getInstance(): BurnSinkManager {
    if (!BurnSinkManager.instance) {
      BurnSinkManager.instance = new BurnSinkManager();
    }
    return BurnSinkManager.instance;
  }

  /**
   * Initialize default burn/sink mechanics
   */
  private initDefaultMechanics(): void {
    // Default burn mechanics
    this.addBurnMechanic({
      mechanicId: 'cosmetic_upgrade',
      name: 'Cosmetic Upgrade',
      description: 'Burn soft currency to upgrade cosmetics',
      enabled: true,
      burnType: 'soft_currency',
      reward: 10,
      rewardType: 'soft',
      dailyLimit: 5000,
    });

    this.addBurnMechanic({
      mechanicId: 'nft_evolution',
      name: 'NFT Evolution',
      description: 'Burn duplicate NFTs to improve rarity',
      enabled: true,
      burnType: 'nft',
      reward: 100,
      rewardType: 'soft',
    });

    this.addBurnMechanic({
      mechanicId: 'hard_currency_sink',
      name: 'Hardcore Sink',
      description: 'Burn hard currency for exclusive rewards',
      enabled: true,
      burnType: 'hard_currency',
      reward: 500,
      rewardType: 'soft',
      dailyLimit: 10,
    });

    // Default sink mechanics
    this.addSinkMechanic({
      mechanicId: 'tournament_escrow',
      name: 'Tournament Escrow',
      description: 'Currency locked during tournament',
      enabled: true,
      sinkType: 'temp_lock',
      lockDuration: 24 * 60 * 60 * 1000, // 24 hours
      purpose: 'tournament_escrow',
    });

    this.addSinkMechanic({
      mechanicId: 'battle_fee_sink',
      name: 'Battle Fee Sink',
      description: 'Small percentage removed per battle',
      enabled: true,
      sinkType: 'permanent_sink',
      purpose: 'battle_fee',
    });

    this.addSinkMechanic({
      mechanicId: 'staking_lock',
      name: 'Staking Lock',
      description: 'Currency locked for staking rewards',
      enabled: true,
      sinkType: 'staking',
      lockDuration: 7 * 24 * 60 * 60 * 1000, // 7 days
      purpose: 'staking',
    });
  }

  /**
   * Burn an NFT
   */
  burnNFT(
    entityId: string,
    entityName: string,
    nftId: string,
    mechanicId?: string,
    reason?: string
  ): { success: boolean; burnId?: string; reward: number; rewardType: 'soft' | 'hard' } {
    const burnId = `burn_nft_${nftId}_${Date.now()}`;
    let reward = 0;
    let rewardType: 'soft' | 'hard' = 'soft';

    // Get reward from mechanic if provided
    if (mechanicId) {
      const mechanic = this.burnMechanics.get(mechanicId);
      if (mechanic && mechanic.enabled && mechanic.reward) {
        reward = mechanic.reward;
        rewardType = mechanic.rewardType || 'soft';
      }
    }

    // Create burn record
    const burn: BurnRecord = {
      burnId,
      burnType: 'nft',
      entityId,
      entityName,
      nftId,
      reward,
      rewardType,
      timestamp: Date.now(),
      reason: reason || mechanicId,
      verified: true,
    };

    this.burns.set(burnId, burn);
    if (!this.userBurns.has(entityId)) {
      this.userBurns.set(entityId, []);
    }
    this.userBurns.get(entityId)!.push(burnId);

    // Update stats
    this.stats.totalNFTsBurned++;
    this.stats.totalRewardsGiven += reward;

    this.saveToStorage();

    return { success: true, burnId, reward, rewardType };
  }

  /**
   * Burn soft currency
   */
  burnSoftCurrency(
    entityId: string,
    entityName: string,
    amount: number,
    mechanicId?: string,
    reason?: string
  ): { success: boolean; burnId?: string; reward: number; rewardType: 'soft' | 'hard' } {
    // Check limits
    if (mechanicId) {
      const mechanic = this.burnMechanics.get(mechanicId);
      if (!mechanic || !mechanic.enabled) {
        return { success: false, reward: 0, rewardType: 'soft' };
      }

      // Check daily limit
      if (mechanic.dailyLimit) {
        const today = new Date().toDateString();
        const key = `${entityId}_${today}_${mechanicId}`;
        const count = this.userBurnCounts.get(key) || 0;
        if (count + amount > mechanic.dailyLimit) {
          return { success: false, reward: 0, rewardType: 'soft' };
        }
        this.userBurnCounts.set(key, count + amount);
      }
    }

    const burnId = `burn_soft_${entityId}_${Date.now()}`;
    let reward = 0;
    let rewardType: 'soft' | 'hard' = 'soft';

    // Get reward from mechanic
    if (mechanicId) {
      const mechanic = this.burnMechanics.get(mechanicId);
      if (mechanic && mechanic.reward) {
        reward = mechanic.reward;
        rewardType = mechanic.rewardType || 'soft';
      }
    }

    const burn: BurnRecord = {
      burnId,
      burnType: 'soft_currency',
      entityId,
      entityName,
      amount,
      currencyType: 'soft',
      reward,
      rewardType,
      timestamp: Date.now(),
      reason: reason || mechanicId,
      verified: true,
    };

    this.burns.set(burnId, burn);
    if (!this.userBurns.has(entityId)) {
      this.userBurns.set(entityId, []);
    }
    this.userBurns.get(entityId)!.push(burnId);

    // Update stats
    this.stats.totalSoftBurned += amount;
    this.stats.totalRewardsGiven += reward;

    this.saveToStorage();

    return { success: true, burnId, reward, rewardType };
  }

  /**
   * Burn hard currency
   */
  burnHardCurrency(
    entityId: string,
    entityName: string,
    amount: number,
    mechanicId?: string,
    reason?: string
  ): { success: boolean; burnId?: string; reward: number; rewardType: 'soft' | 'hard' } {
    // Similar to soft currency burn
    if (mechanicId) {
      const mechanic = this.burnMechanics.get(mechanicId);
      if (!mechanic || !mechanic.enabled) {
        return { success: false, reward: 0, rewardType: 'soft' };
      }

      if (mechanic.dailyLimit) {
        const today = new Date().toDateString();
        const key = `${entityId}_${today}_${mechanicId}`;
        const count = this.userBurnCounts.get(key) || 0;
        if (count + amount > mechanic.dailyLimit) {
          return { success: false, reward: 0, rewardType: 'soft' };
        }
        this.userBurnCounts.set(key, count + amount);
      }
    }

    const burnId = `burn_hard_${entityId}_${Date.now()}`;
    let reward = 0;
    let rewardType: 'soft' | 'hard' = 'soft';

    if (mechanicId) {
      const mechanic = this.burnMechanics.get(mechanicId);
      if (mechanic && mechanic.reward) {
        reward = mechanic.reward;
        rewardType = mechanic.rewardType || 'soft';
      }
    }

    const burn: BurnRecord = {
      burnId,
      burnType: 'hard_currency',
      entityId,
      entityName,
      amount,
      currencyType: 'hard',
      reward,
      rewardType,
      timestamp: Date.now(),
      reason: reason || mechanicId,
      verified: true,
    };

    this.burns.set(burnId, burn);
    if (!this.userBurns.has(entityId)) {
      this.userBurns.set(entityId, []);
    }
    this.userBurns.get(entityId)!.push(burnId);

    // Update stats
    this.stats.totalHardBurned += amount;
    this.stats.totalRewardsGiven += reward;

    this.saveToStorage();

    return { success: true, burnId, reward, rewardType };
  }

  /**
   * Sink currency (temporary or permanent)
   */
  sinkCurrency(
    entityId: string,
    entityName: string,
    amount: number,
    currencyType: 'soft' | 'hard',
    mechanicId: string,
    metadata?: Record<string, any>
  ): { success: boolean; sinkId?: string } {
    const mechanic = this.sinkMechanics.get(mechanicId);
    if (!mechanic || !mechanic.enabled) {
      return { success: false };
    }

    const sinkId = `sink_${entityId}_${Date.now()}`;
    const sink: SinkRecord = {
      sinkId,
      sinkType: mechanic.sinkType,
      entityId,
      entityName,
      amount,
      currencyType,
      sunkAt: Date.now(),
      releasedAt: mechanic.lockDuration ? Date.now() + mechanic.lockDuration : undefined,
      reason: mechanicId,
      metadata,
    };

    this.sinks.set(sinkId, sink);
    if (!this.userSinks.has(entityId)) {
      this.userSinks.set(entityId, []);
    }
    this.userSinks.get(entityId)!.push(sinkId);

    this.stats.totalSinked += amount;

    this.saveToStorage();

    return { success: true, sinkId };
  }

  /**
   * Release sinked currency
   */
  releaseSinkedCurrency(sinkId: string): { success: boolean; amount?: number } {
    const sink = this.sinks.get(sinkId);
    if (!sink || sink.releasedAt) {
      return { success: false };
    }

    // Check if lock duration has passed
    if (sink.releasedAt && Date.now() < sink.releasedAt) {
      return { success: false };
    }

    sink.releasedAt = Date.now();
    this.saveToStorage();

    return { success: true, amount: sink.amount };
  }

  /**
   * Get burn history for entity
   */
  getBurnHistory(entityId: string, limit: number = 50): BurnRecord[] {
    const burnIds = this.userBurns.get(entityId) || [];
    return burnIds
      .map(id => this.burns.get(id))
      .filter((b): b is BurnRecord => !!b)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get sink history for entity
   */
  getSinkHistory(entityId: string, limit: number = 50): SinkRecord[] {
    const sinkIds = this.userSinks.get(entityId) || [];
    return sinkIds
      .map(id => this.sinks.get(id))
      .filter((s): s is SinkRecord => !!s)
      .sort((a, b) => b.sunkAt - a.sunkAt)
      .slice(0, limit);
  }

  /**
   * Get active sinks (not yet released)
   */
  getActiveSinks(entityId: string): SinkRecord[] {
    const sinkIds = this.userSinks.get(entityId) || [];
    return sinkIds
      .map(id => this.sinks.get(id))
      .filter((s): s is SinkRecord => !!s && (!s.releasedAt || Date.now() < s.releasedAt));
  }

  /**
   * Add a burn mechanic
   */
  addBurnMechanic(mechanic: BurnMechanic): void {
    this.burnMechanics.set(mechanic.mechanicId, mechanic);
    this.saveToStorage();
  }

  /**
   * Add a sink mechanic
   */
  addSinkMechanic(mechanic: SinkMechanic): void {
    this.sinkMechanics.set(mechanic.mechanicId, mechanic);
    this.saveToStorage();
  }

  /**
   * Get burn mechanics
   */
  getBurnMechanics(): BurnMechanic[] {
    return Array.from(this.burnMechanics.values());
  }

  /**
   * Get sink mechanics
   */
  getSinkMechanics(): SinkMechanic[] {
    return Array.from(this.sinkMechanics.values());
  }

  /**
   * Get burn stats
   */
  getStats(): BurnStats {
    return { ...this.stats };
  }

  /**
   * Get total sinked amount
   */
  getTotalSinked(currencyType?: 'soft' | 'hard'): number {
    const sinks = Array.from(this.sinks.values());
    return sinks
      .filter(s => !s.releasedAt || Date.now() < s.releasedAt)
      .filter(s => !currencyType || s.currencyType === currencyType)
      .reduce((sum, s) => sum + s.amount, 0);
  }

  /**
   * Persist to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        burns: Array.from(this.burns.entries()),
        sinks: Array.from(this.sinks.entries()),
        userBurns: Array.from(this.userBurns.entries()),
        userSinks: Array.from(this.userSinks.entries()),
        burnMechanics: Array.from(this.burnMechanics.entries()),
        sinkMechanics: Array.from(this.sinkMechanics.entries()),
        stats: this.stats,
      };
      localStorage.setItem('burn_sink_system', JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save burn/sink data:', e);
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    try {
      const data = JSON.parse(localStorage.getItem('burn_sink_system') || '{}');
      if (data.burns) this.burns = new Map(data.burns);
      if (data.sinks) this.sinks = new Map(data.sinks);
      if (data.userBurns) this.userBurns = new Map(data.userBurns);
      if (data.userSinks) this.userSinks = new Map(data.userSinks);
      if (data.burnMechanics) this.burnMechanics = new Map(data.burnMechanics);
      if (data.sinkMechanics) this.sinkMechanics = new Map(data.sinkMechanics);
      if (data.stats) this.stats = data.stats;
    } catch (e) {
      console.warn('Failed to load burn/sink data:', e);
    }
  }

  /**
   * Clear all data (development only)
   */
  clearAll(): void {
    this.burns.clear();
    this.sinks.clear();
    this.userBurns.clear();
    this.userSinks.clear();
    this.saveToStorage();
  }
}
