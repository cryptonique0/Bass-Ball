/**
 * Economic Monitoring System
 * Tracks token/reward economics, detects inflation, monitors anomalies
 * Prevents economic exploitation and maintains game balance
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface TokenTransaction {
  id: string;
  playerId: string;
  type: 'earn' | 'spend' | 'transfer' | 'burn' | 'mint';
  amount: number;
  source: string;
  reason: string;
  timestamp: number;
  verified: boolean;
}

export interface RewardMetrics {
  dailyRewardIssued: number;
  dailyRewardClaimed: number;
  dailyRewardBurned: number;
  averageRewardPerMatch: number;
  inflationRate: number; // % per day
  burnRate: number; // % per day
}

export interface TokenSupply {
  total: number;
  circulating: number;
  locked: number;
  burned: number;
  timestamp: number;
}

export interface InflationIndicator {
  type: 'reward' | 'token' | 'nft';
  direction: 'increasing' | 'stable' | 'decreasing';
  rate: number;
  threshold: number;
  severity: 'normal' | 'warning' | 'critical';
  timestamp: number;
}

export interface PlayerEconomicProfile {
  playerId: string;
  totalEarnings: number;
  totalSpending: number;
  rewardClaimRate: number; // % of earned rewards claimed
  lastActivityTime: number;
  suspiciousPatterns: SuspiciousPattern[];
  economicScore: number; // 0-100, higher = healthier
}

export interface SuspiciousPattern {
  id: string;
  type: 'rapid_accumulation' | 'reward_farming' | 'unusual_spending' | 'wash_trading' | 'price_manipulation';
  confidence: number; // 0-100
  evidence: string[];
  detectedAt: number;
  resolved: boolean;
}

export interface TransactionAnomaly {
  id: string;
  transactionId: string;
  anomalyType: 'unusual_amount' | 'rare_pattern' | 'suspicious_timing' | 'blacklisted_address';
  severity: 'low' | 'medium' | 'high';
  flaggedAt: number;
  reviewed: boolean;
  resolution?: string;
}

export interface EconomicReport {
  period: 'daily' | 'weekly' | 'monthly';
  startTime: number;
  endTime: number;
  metrics: RewardMetrics;
  supplySnapshot: TokenSupply;
  inflationIndicators: InflationIndicator[];
  suspiciousActivities: SuspiciousPattern[];
  anomalies: TransactionAnomaly[];
  healthScore: number;
}

export interface EconomicThresholds {
  dailyRewardLimit: number; // Max rewards per player per day
  rewardClaimThreshold: number; // % threshold to flag farming
  inflationThreshold: number; // % per day threshold
  transactionAnomalyLimit: number; // Multiples of average to flag
  rapidAccumulationThreshold: number; // Tokens earned in 24h to flag
  burnRateTarget: number; // % of issued tokens to burn daily
}

export interface RewardSource {
  id: string;
  name: string;
  baseAmount: number;
  conditions: string[];
  frequency: 'match' | 'daily' | 'weekly' | 'achievement';
  enabled: boolean;
  modifiers: RewardModifier[];
}

export interface RewardModifier {
  id: string;
  type: 'multiplier' | 'fixed_bonus' | 'performance_based';
  value: number;
  condition: string;
  active: boolean;
}

// ============================================================================
// ECONOMIC MONITORING SERVICE
// ============================================================================

class EconomicMonitoringService {
  private transactions: Map<string, TokenTransaction> = new Map();
  private playerProfiles: Map<string, PlayerEconomicProfile> = new Map();
  private anomalies: Map<string, TransactionAnomaly> = new Map();
  private supplyHistory: TokenSupply[] = [];
  private thresholds: EconomicThresholds;
  private rewardSources: Map<string, RewardSource> = new Map();

  constructor() {
    this.thresholds = this.getDefaultThresholds();
    this.loadFromStorage();
    this.initializeDefaultRewardSources();
  }

  // ========================================================================
  // INITIALIZATION & CONFIGURATION
  // ========================================================================

  private getDefaultThresholds(): EconomicThresholds {
    return {
      dailyRewardLimit: 1000,
      rewardClaimThreshold: 95, // Flag if >95% of earned rewards claimed
      inflationThreshold: 5, // % per day
      transactionAnomalyLimit: 3, // 3x average
      rapidAccumulationThreshold: 5000, // Tokens in 24h
      burnRateTarget: 2, // Burn 2% of issued daily
    };
  }

  private initializeDefaultRewardSources(): void {
    const sources: RewardSource[] = [
      {
        id: 'match_win',
        name: 'Match Victory',
        baseAmount: 100,
        conditions: ['match_won', 'minimum_playtime'],
        frequency: 'match',
        enabled: true,
        modifiers: [
          {
            id: 'mod_skill_multiplier',
            type: 'performance_based',
            value: 1.5,
            condition: 'player_rating_above_80',
            active: true,
          },
        ],
      },
      {
        id: 'match_participation',
        name: 'Match Participation',
        baseAmount: 25,
        conditions: ['match_completed'],
        frequency: 'match',
        enabled: true,
        modifiers: [],
      },
      {
        id: 'daily_login',
        name: 'Daily Login Bonus',
        baseAmount: 50,
        conditions: ['logged_in_today'],
        frequency: 'daily',
        enabled: true,
        modifiers: [
          {
            id: 'mod_streak_bonus',
            type: 'multiplier',
            value: 2,
            condition: 'login_streak_7_days',
            active: true,
          },
        ],
      },
      {
        id: 'achievement',
        name: 'Achievement Unlock',
        baseAmount: 200,
        conditions: ['achievement_completed'],
        frequency: 'achievement',
        enabled: true,
        modifiers: [],
      },
    ];

    sources.forEach((source) => {
      this.rewardSources.set(source.id, source);
    });
  }

  setThresholds(thresholds: Partial<EconomicThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
    this.saveToStorage();
  }

  // ========================================================================
  // TRANSACTION RECORDING & TRACKING
  // ========================================================================

  recordTransaction(
    playerId: string,
    type: 'earn' | 'spend' | 'transfer' | 'burn' | 'mint',
    amount: number,
    source: string,
    reason: string
  ): string {
    const transaction: TokenTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      playerId,
      type,
      amount,
      source,
      reason,
      timestamp: Date.now(),
      verified: type === 'earn' ? false : true, // Rewards need verification
    };

    this.transactions.set(transaction.id, transaction);

    // Auto-detect anomalies
    this.checkTransactionAnomaly(transaction);

    // Update player profile
    this.updatePlayerProfile(playerId, transaction);

    this.saveToStorage();
    return transaction.id;
  }

  verifyTransaction(transactionId: string, verified: boolean): void {
    const transaction = this.transactions.get(transactionId);
    if (transaction) {
      transaction.verified = verified;
      this.saveToStorage();
    }
  }

  getPlayerTransactionHistory(playerId: string, limit: number = 100): TokenTransaction[] {
    return Array.from(this.transactions.values())
      .filter((tx) => tx.playerId === playerId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  private updatePlayerProfile(playerId: string, transaction: TokenTransaction): void {
    let profile = this.playerProfiles.get(playerId);

    if (!profile) {
      profile = {
        playerId,
        totalEarnings: 0,
        totalSpending: 0,
        rewardClaimRate: 0,
        lastActivityTime: Date.now(),
        suspiciousPatterns: [],
        economicScore: 75,
      };
    }

    if (transaction.type === 'earn') {
      profile.totalEarnings += transaction.amount;
    } else if (transaction.type === 'spend') {
      profile.totalSpending += transaction.amount;
    }

    profile.lastActivityTime = transaction.timestamp;

    // Recalculate reward claim rate
    const earnTransactions = this.getPlayerTransactionHistory(playerId, 1000).filter(
      (tx) => tx.type === 'earn'
    );
    const claimedTransactions = earnTransactions.filter((tx) => tx.verified);
    profile.rewardClaimRate =
      earnTransactions.length > 0 ? (claimedTransactions.length / earnTransactions.length) * 100 : 0;

    // Update economic score
    profile.economicScore = this.calculateEconomicScore(profile);

    this.playerProfiles.set(playerId, profile);
  }

  private calculateEconomicScore(profile: PlayerEconomicProfile): number {
    let score = 75; // Base score

    // Reward claim rate - lower is better (less farming)
    if (profile.rewardClaimRate > this.thresholds.rewardClaimThreshold) {
      score -= 20;
    }

    // Suspicious patterns
    const activePatterns = profile.suspiciousPatterns.filter((p) => !p.resolved);
    score -= activePatterns.length * 5;

    // Spending behavior - positive factor
    if (profile.totalSpending > 0) {
      const spendingRatio = profile.totalSpending / Math.max(profile.totalEarnings, 1);
      if (spendingRatio > 0.3) {
        score += 10;
      }
    }

    // Inactivity - negative factor
    const daysSinceActive = (Date.now() - profile.lastActivityTime) / (1000 * 60 * 60 * 24);
    if (daysSinceActive > 30) {
      score -= 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  // ========================================================================
  // ANOMALY DETECTION
  // ========================================================================

  private checkTransactionAnomaly(transaction: TokenTransaction): void {
    // Skip if not an earn type
    if (transaction.type !== 'earn') return;

    const anomalies: TransactionAnomaly[] = [];

    // Check 1: Unusual amount (> 3x average for this player)
    const playerTransactions = this.getPlayerTransactionHistory(transaction.playerId, 100).filter(
      (tx) => tx.type === 'earn'
    );
    if (playerTransactions.length > 5) {
      const average = playerTransactions.reduce((sum, tx) => sum + tx.amount, 0) / playerTransactions.length;
      if (transaction.amount > average * this.thresholds.transactionAnomalyLimit) {
        anomalies.push({
          id: `anom_${Date.now()}_unusual_amount`,
          transactionId: transaction.id,
          anomalyType: 'unusual_amount',
          severity: 'medium',
          flaggedAt: Date.now(),
          reviewed: false,
        });
      }
    }

    // Check 2: Rapid accumulation
    const last24hTransactions = playerTransactions.filter(
      (tx) => tx.timestamp > Date.now() - 86400000
    );
    const last24hTotal = last24hTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    if (last24hTotal > this.thresholds.rapidAccumulationThreshold) {
      anomalies.push({
        id: `anom_${Date.now()}_rapid_accumulation`,
        transactionId: transaction.id,
        anomalyType: 'unusual_amount',
        severity: 'high',
        flaggedAt: Date.now(),
        reviewed: false,
      });
    }

    // Check 3: Rare pattern timing
    const hour = new Date().getHours();
    if (hour >= 2 && hour <= 5) {
      // Off-hours activity
      anomalies.push({
        id: `anom_${Date.now()}_suspicious_timing`,
        transactionId: transaction.id,
        anomalyType: 'suspicious_timing',
        severity: 'low',
        flaggedAt: Date.now(),
        reviewed: false,
      });
    }

    // Store anomalies
    anomalies.forEach((anomaly) => {
      this.anomalies.set(anomaly.id, anomaly);

      // Add suspicious pattern to player profile
      const profile = this.playerProfiles.get(transaction.playerId);
      if (profile && anomaly.severity === 'high') {
        profile.suspiciousPatterns.push({
          id: `pattern_${Date.now()}`,
          type: 'reward_farming',
          confidence: 75,
          evidence: [anomaly.id],
          detectedAt: Date.now(),
          resolved: false,
        });
      }
    });
  }

  getAnomalies(
    reviewed?: boolean,
    severity?: 'low' | 'medium' | 'high'
  ): TransactionAnomaly[] {
    return Array.from(this.anomalies.values())
      .filter((anom) => (reviewed !== undefined ? anom.reviewed === reviewed : true))
      .filter((anom) => (severity !== undefined ? anom.severity === severity : true))
      .sort((a, b) => b.flaggedAt - a.flaggedAt);
  }

  reviewAnomaly(anomalyId: string, resolution: string): void {
    const anomaly = this.anomalies.get(anomalyId);
    if (anomaly) {
      anomaly.reviewed = true;
      anomaly.resolution = resolution;
      this.saveToStorage();
    }
  }

  // ========================================================================
  // PLAYER PROFILES & INVESTIGATION
  // ========================================================================

  getPlayerProfile(playerId: string): PlayerEconomicProfile | undefined {
    return this.playerProfiles.get(playerId);
  }

  getAllPlayerProfiles(): PlayerEconomicProfile[] {
    return Array.from(this.playerProfiles.values()).sort(
      (a, b) => a.economicScore - b.economicScore
    );
  }

  getSuspiciousPlayers(threshold: number = 50): PlayerEconomicProfile[] {
    return this.getAllPlayerProfiles().filter((profile) => profile.economicScore < threshold);
  }

  markPatternResolved(playerId: string, patternId: string): void {
    const profile = this.playerProfiles.get(playerId);
    if (profile) {
      const pattern = profile.suspiciousPatterns.find((p) => p.id === patternId);
      if (pattern) {
        pattern.resolved = true;
        this.saveToStorage();
      }
    }
  }

  // ========================================================================
  // REWARDS & INFLATION MONITORING
  // ========================================================================

  calculateRewardMetrics(dayCount: number = 1): RewardMetrics {
    const startTime = Date.now() - dayCount * 24 * 60 * 60 * 1000;
    const periodTransactions = Array.from(this.transactions.values()).filter(
      (tx) => tx.timestamp >= startTime
    );

    const earnTransactions = periodTransactions.filter((tx) => tx.type === 'earn');
    const spendTransactions = periodTransactions.filter((tx) => tx.type === 'spend');
    const burnTransactions = periodTransactions.filter((tx) => tx.type === 'burn');
    const claimedRewards = earnTransactions.filter((tx) => tx.verified);

    const totalIssued = earnTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const totalClaimed = claimedRewards.reduce((sum, tx) => sum + tx.amount, 0);
    const totalBurned = burnTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const totalSpent = spendTransactions.reduce((sum, tx) => sum + tx.amount, 0);

    const circulation = totalIssued - totalBurned - totalSpent;
    const inflationRate = (totalIssued / Math.max(circulation, 1)) * 100;
    const burnRate = (totalBurned / Math.max(totalIssued, 1)) * 100;

    return {
      dailyRewardIssued: totalIssued,
      dailyRewardClaimed: totalClaimed,
      dailyRewardBurned: totalBurned,
      averageRewardPerMatch: earnTransactions.length > 0 ? totalIssued / earnTransactions.length : 0,
      inflationRate,
      burnRate,
    };
  }

  getInflationIndicators(): InflationIndicator[] {
    const indicators: InflationIndicator[] = [];
    const metrics = this.calculateRewardMetrics(7); // 7-day view

    // Check reward inflation
    if (metrics.inflationRate > this.thresholds.inflationThreshold) {
      indicators.push({
        type: 'reward',
        direction: 'increasing',
        rate: metrics.inflationRate,
        threshold: this.thresholds.inflationThreshold,
        severity: metrics.inflationRate > this.thresholds.inflationThreshold * 2 ? 'critical' : 'warning',
        timestamp: Date.now(),
      });
    } else if (metrics.burnRate >= this.thresholds.burnRateTarget) {
      indicators.push({
        type: 'reward',
        direction: 'stable',
        rate: metrics.burnRate,
        threshold: this.thresholds.burnRateTarget,
        severity: 'normal',
        timestamp: Date.now(),
      });
    }

    return indicators;
  }

  getTokenSupply(): TokenSupply {
    const allTransactions = Array.from(this.transactions.values());
    const mintTransactions = allTransactions.filter((tx) => tx.type === 'mint');
    const burnTransactions = allTransactions.filter((tx) => tx.type === 'burn');

    const total = mintTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const burned = burnTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const circulating = total - burned;

    const supply: TokenSupply = {
      total,
      circulating,
      locked: 0, // Can be set based on staking/vesting
      burned,
      timestamp: Date.now(),
    };

    this.supplyHistory.push(supply);
    return supply;
  }

  // ========================================================================
  // REWARD SOURCES & MODIFIERS
  // ========================================================================

  getRewardSources(): RewardSource[] {
    return Array.from(this.rewardSources.values()).filter((source) => source.enabled);
  }

  getRewardSource(sourceId: string): RewardSource | undefined {
    return this.rewardSources.get(sourceId);
  }

  updateRewardSource(sourceId: string, updates: Partial<RewardSource>): void {
    const source = this.rewardSources.get(sourceId);
    if (source) {
      Object.assign(source, updates);
      this.saveToStorage();
    }
  }

  addRewardModifier(sourceId: string, modifier: RewardModifier): void {
    const source = this.rewardSources.get(sourceId);
    if (source) {
      source.modifiers.push(modifier);
      this.saveToStorage();
    }
  }

  calculateRewardWithModifiers(baseAmount: number, sourceId: string, conditionsMet: string[]): number {
    const source = this.rewardSources.get(sourceId);
    if (!source) return baseAmount;

    let total = baseAmount;
    source.modifiers.forEach((modifier) => {
      if (modifier.active && conditionsMet.includes(modifier.condition)) {
        if (modifier.type === 'multiplier') {
          total *= modifier.value;
        } else if (modifier.type === 'fixed_bonus') {
          total += modifier.value;
        }
      }
    });

    return total;
  }

  // ========================================================================
  // ECONOMIC REPORTING
  // ========================================================================

  generateEconomicReport(period: 'daily' | 'weekly' | 'monthly'): EconomicReport {
    const dayCount = period === 'daily' ? 1 : period === 'weekly' ? 7 : 30;
    const startTime = Date.now() - dayCount * 24 * 60 * 60 * 1000;

    const metrics = this.calculateRewardMetrics(dayCount);
    const supplySnapshot = this.getTokenSupply();
    const inflationIndicators = this.getInflationIndicators();
    const suspiciousActivities = Array.from(this.playerProfiles.values())
      .flatMap((p) => p.suspiciousPatterns)
      .filter((p) => p.detectedAt >= startTime);
    const anomalies = this.getAnomalies(false);

    // Calculate health score
    let healthScore = 100;
    if (metrics.inflationRate > this.thresholds.inflationThreshold) {
      healthScore -= 20;
    }
    if (metrics.burnRate < this.thresholds.burnRateTarget * 0.5) {
      healthScore -= 15;
    }
    if (suspiciousActivities.length > 0) {
      healthScore -= Math.min(20, suspiciousActivities.length * 5);
    }

    return {
      period,
      startTime,
      endTime: Date.now(),
      metrics,
      supplySnapshot,
      inflationIndicators,
      suspiciousActivities,
      anomalies,
      healthScore: Math.max(0, Math.min(100, healthScore)),
    };
  }

  // ========================================================================
  // PERSISTENCE
  // ========================================================================

  private saveToStorage(): void {
    const data = {
      transactions: Array.from(this.transactions.entries()),
      playerProfiles: Array.from(this.playerProfiles.entries()),
      anomalies: Array.from(this.anomalies.entries()),
      supplyHistory: this.supplyHistory,
      thresholds: this.thresholds,
      rewardSources: Array.from(this.rewardSources.entries()),
    };
    localStorage.setItem('economicMonitoring:global', JSON.stringify(data));
  }

  private loadFromStorage(): void {
    try {
      const data = JSON.parse(localStorage.getItem('economicMonitoring:global') || '{}');
      if (data.transactions) {
        this.transactions = new Map(data.transactions);
      }
      if (data.playerProfiles) {
        this.playerProfiles = new Map(data.playerProfiles);
      }
      if (data.anomalies) {
        this.anomalies = new Map(data.anomalies);
      }
      if (data.supplyHistory) {
        this.supplyHistory = data.supplyHistory;
      }
      if (data.thresholds) {
        this.thresholds = data.thresholds;
      }
      if (data.rewardSources) {
        this.rewardSources = new Map(data.rewardSources);
      }
    } catch (error) {
      console.warn('Failed to load economic monitoring data:', error);
    }
  }

  exportData(): Record<string, unknown> {
    return {
      transactions: Array.from(this.transactions.values()),
      playerProfiles: Array.from(this.playerProfiles.values()),
      anomalies: Array.from(this.anomalies.values()),
      supplyHistory: this.supplyHistory,
      thresholds: this.thresholds,
    };
  }

  clearData(): void {
    this.transactions.clear();
    this.playerProfiles.clear();
    this.anomalies.clear();
    this.supplyHistory = [];
    this.saveToStorage();
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

const economicMonitoringService = new EconomicMonitoringService();
export { economicMonitoringService };
