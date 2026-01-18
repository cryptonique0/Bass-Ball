/**
 * Economy System
 * Soft currency (off-chain), hard currency (on-chain), entry fees, tournament pools
 */

/**
 * Currency types
 */
export type CurrencyType = 'soft' | 'hard';
export type TransactionType =
  | 'deposit'
  | 'withdrawal'
  | 'entry_fee'
  | 'reward'
  | 'refund'
  | 'tournament_pool'
  | 'prize_claim'
  | 'purchase'
  | 'sell'
  | 'transfer';

/**
 * Player balance
 */
export interface PlayerBalance {
  entityId: string;
  entityType: 'player' | 'team';
  entityName: string;
  softBalance: number; // Off-chain currency
  hardBalance: number; // On-chain currency (blockchain)
  lockedBalance: number; // Locked in tournaments
  lastUpdated: number;
  verified: boolean; // For hard currency
}

/**
 * Transaction record
 */
export interface Transaction {
  transactionId: string;
  entityId: string;
  entityType: 'player' | 'team';
  currencyType: CurrencyType;
  transactionType: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  timestamp: number;
  blockNumber?: number; // For on-chain transactions
  txHash?: string; // For on-chain transactions
  verified: boolean;
}

/**
 * Entry fee configuration
 */
export interface EntryFee {
  feeId: string;
  tournamentId: string;
  tournamentName: string;
  currencyType: CurrencyType;
  amount: number;
  maxParticipants: number;
  currentParticipants: number;
  poolTotal: number;
  status: 'active' | 'closed' | 'ended';
  startDate: number;
  endDate?: number;
  refundable: boolean;
  refundDeadline?: number;
}

/**
 * Tournament pool
 */
export interface TournamentPool {
  poolId: string;
  tournamentId: string;
  tournamentName: string;
  currencyType: CurrencyType;
  totalPool: number;
  playerContributions: Map<string, number>; // entityId -> amount
  prizeDistribution: {
    rank: number;
    percentage: number;
    amount: number;
  }[];
  status: 'active' | 'finalized' | 'distributed';
  distributedDate?: number;
  platformFee: number; // Percentage (0-10)
  platformFeeAmount: number;
}

/**
 * Soft currency (off-chain) - like game coins/tokens
 */
export interface SoftCurrencyConfig {
  dailyLimit?: number;
  monthlyLimit?: number;
  minTransaction: number;
  maxTransaction: number;
  conversionRateToHard?: number; // For reference only
}

/**
 * Hard currency (on-chain) - blockchain tokens
 */
export interface HardCurrencyConfig {
  tokenAddress: string;
  chainId: number;
  minTransaction: number;
  maxTransaction: number;
  gasEstimate: number;
  requiresVerification: boolean;
  verificationAge: number; // milliseconds
}

/**
 * Economy Manager
 * Singleton for managing player balances and transactions
 */
export class EconomyManager {
  private static instance: EconomyManager;
  private balances: Map<string, PlayerBalance> = new Map();
  private transactions: Map<string, Transaction[]> = new Map(); // entityId -> transactions
  private entryFees: Map<string, EntryFee> = new Map();
  private tournamentPools: Map<string, TournamentPool> = new Map();

  private softConfig: SoftCurrencyConfig = {
    minTransaction: 1,
    maxTransaction: 100000,
    dailyLimit: 1000000,
    monthlyLimit: 5000000,
  };

  private hardConfig: HardCurrencyConfig = {
    tokenAddress: '0x0000000000000000000000000000000000000000',
    chainId: 8453, // Base chain
    minTransaction: 0.01,
    maxTransaction: 1000,
    gasEstimate: 50000,
    requiresVerification: true,
    verificationAge: 24 * 60 * 60 * 1000, // 24 hours
  };

  private constructor() {
    this.loadFromStorage();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): EconomyManager {
    if (!EconomyManager.instance) {
      EconomyManager.instance = new EconomyManager();
    }
    return EconomyManager.instance;
  }

  /**
   * Get or create player balance
   */
  getBalance(
    entityId: string,
    entityType: 'player' | 'team',
    entityName: string
  ): PlayerBalance {
    if (!this.balances.has(entityId)) {
      const balance: PlayerBalance = {
        entityId,
        entityType,
        entityName,
        softBalance: 0,
        hardBalance: 0,
        lockedBalance: 0,
        lastUpdated: Date.now(),
        verified: false,
      };
      this.balances.set(entityId, balance);
      this.saveToStorage();
    }
    return this.balances.get(entityId)!;
  }

  /**
   * Add soft currency (off-chain)
   */
  addSoftCurrency(
    entityId: string,
    amount: number,
    description: string,
    source: TransactionType = 'deposit'
  ): Transaction | null {
    const balance = this.balances.get(entityId);
    if (!balance) return null;

    if (amount <= 0 || amount > this.softConfig.maxTransaction!) {
      console.error('Invalid soft currency amount');
      return null;
    }

    const balanceBefore = balance.softBalance;
    balance.softBalance += amount;
    balance.lastUpdated = Date.now();

    const transaction: Transaction = {
      transactionId: `tx_${Date.now()}_${entityId}`,
      entityId,
      entityType: balance.entityType,
      currencyType: 'soft',
      transactionType: source,
      amount,
      balanceBefore,
      balanceAfter: balance.softBalance,
      description,
      timestamp: Date.now(),
      verified: true,
    };

    if (!this.transactions.has(entityId)) {
      this.transactions.set(entityId, []);
    }
    this.transactions.get(entityId)!.push(transaction);

    this.saveToStorage();
    return transaction;
  }

  /**
   * Subtract soft currency
   */
  subtractSoftCurrency(
    entityId: string,
    amount: number,
    description: string,
    source: TransactionType = 'withdrawal'
  ): Transaction | null {
    const balance = this.balances.get(entityId);
    if (!balance || balance.softBalance < amount) {
      console.error('Insufficient soft currency balance');
      return null;
    }

    if (amount <= 0 || amount > this.softConfig.maxTransaction!) {
      console.error('Invalid soft currency amount');
      return null;
    }

    const balanceBefore = balance.softBalance;
    balance.softBalance -= amount;
    balance.lastUpdated = Date.now();

    const transaction: Transaction = {
      transactionId: `tx_${Date.now()}_${entityId}`,
      entityId,
      entityType: balance.entityType,
      currencyType: 'soft',
      transactionType: source,
      amount: -amount,
      balanceBefore,
      balanceAfter: balance.softBalance,
      description,
      timestamp: Date.now(),
      verified: true,
    };

    if (!this.transactions.has(entityId)) {
      this.transactions.set(entityId, []);
    }
    this.transactions.get(entityId)!.push(transaction);

    this.saveToStorage();
    return transaction;
  }

  /**
   * Add hard currency (on-chain) - requires verification
   */
  addHardCurrency(
    entityId: string,
    amount: number,
    description: string,
    txHash?: string,
    blockNumber?: number
  ): Transaction | null {
    const balance = this.balances.get(entityId);
    if (!balance) return null;

    if (amount <= 0 || amount > this.hardConfig.maxTransaction) {
      console.error('Invalid hard currency amount');
      return null;
    }

    const balanceBefore = balance.hardBalance;
    balance.hardBalance += amount;
    balance.lastUpdated = Date.now();

    const transaction: Transaction = {
      transactionId: `tx_${Date.now()}_${entityId}`,
      entityId,
      entityType: balance.entityType,
      currencyType: 'hard',
      transactionType: 'deposit',
      amount,
      balanceBefore,
      balanceAfter: balance.hardBalance,
      description,
      timestamp: Date.now(),
      txHash,
      blockNumber,
      verified: txHash && blockNumber ? true : false,
    };

    if (!this.transactions.has(entityId)) {
      this.transactions.set(entityId, []);
    }
    this.transactions.get(entityId)!.push(transaction);

    this.saveToStorage();
    return transaction;
  }

  /**
   * Subtract hard currency
   */
  subtractHardCurrency(
    entityId: string,
    amount: number,
    description: string,
    txHash?: string,
    blockNumber?: number
  ): Transaction | null {
    const balance = this.balances.get(entityId);
    if (!balance || balance.hardBalance < amount) {
      console.error('Insufficient hard currency balance');
      return null;
    }

    if (amount <= 0 || amount > this.hardConfig.maxTransaction) {
      console.error('Invalid hard currency amount');
      return null;
    }

    const balanceBefore = balance.hardBalance;
    balance.hardBalance -= amount;
    balance.lastUpdated = Date.now();

    const transaction: Transaction = {
      transactionId: `tx_${Date.now()}_${entityId}`,
      entityId,
      entityType: balance.entityType,
      currencyType: 'hard',
      transactionType: 'withdrawal',
      amount: -amount,
      balanceBefore,
      balanceAfter: balance.hardBalance,
      description,
      timestamp: Date.now(),
      txHash,
      blockNumber,
      verified: txHash && blockNumber ? true : false,
    };

    if (!this.transactions.has(entityId)) {
      this.transactions.set(entityId, []);
    }
    this.transactions.get(entityId)!.push(transaction);

    this.saveToStorage();
    return transaction;
  }

  /**
   * Create entry fee for tournament
   */
  createEntryFee(
    tournamentId: string,
    tournamentName: string,
    currencyType: CurrencyType,
    amount: number,
    maxParticipants: number,
    refundable: boolean = true,
    refundDeadline?: number
  ): EntryFee {
    const feeId = `fee_${tournamentId}`;

    const entryFee: EntryFee = {
      feeId,
      tournamentId,
      tournamentName,
      currencyType,
      amount,
      maxParticipants,
      currentParticipants: 0,
      poolTotal: 0,
      status: 'active',
      startDate: Date.now(),
      refundable,
      refundDeadline,
    };

    this.entryFees.set(feeId, entryFee);
    this.saveToStorage();

    return entryFee;
  }

  /**
   * Pay entry fee
   */
  payEntryFee(
    entityId: string,
    feeId: string
  ): { success: boolean; tournament?: string; remaining?: number } {
    const entryFee = this.entryFees.get(feeId);
    const balance = this.balances.get(entityId);

    if (!entryFee || !balance) {
      return { success: false };
    }

    if (entryFee.currentParticipants >= entryFee.maxParticipants) {
      return { success: false };
    }

    if (entryFee.currencyType === 'soft' && balance.softBalance < entryFee.amount) {
      return { success: false };
    }

    if (entryFee.currencyType === 'hard' && balance.hardBalance < entryFee.amount) {
      return { success: false };
    }

    // Deduct fee and lock it
    if (entryFee.currencyType === 'soft') {
      this.subtractSoftCurrency(entityId, entryFee.amount, `Entry fee: ${entryFee.tournamentName}`, 'entry_fee');
    } else {
      this.subtractHardCurrency(entityId, entryFee.amount, `Entry fee: ${entryFee.tournamentName}`, undefined, undefined);
    }

    // Add to locked balance
    balance.lockedBalance += entryFee.amount;

    // Add to pool
    entryFee.currentParticipants++;
    entryFee.poolTotal += entryFee.amount;

    this.saveToStorage();

    return {
      success: true,
      tournament: entryFee.tournamentName,
      remaining: entryFee.maxParticipants - entryFee.currentParticipants,
    };
  }

  /**
   * Refund entry fee
   */
  refundEntryFee(entityId: string, feeId: string): boolean {
    const entryFee = this.entryFees.get(feeId);
    const balance = this.balances.get(entityId);

    if (!entryFee || !balance) {
      return false;
    }

    // Check if refund deadline hasn't passed
    if (entryFee.refundDeadline && Date.now() > entryFee.refundDeadline) {
      return false;
    }

    // Return locked balance
    balance.lockedBalance -= entryFee.amount;

    // Return fee
    if (entryFee.currencyType === 'soft') {
      this.addSoftCurrency(entityId, entryFee.amount, `Refund: ${entryFee.tournamentName}`, 'refund');
    } else {
      this.addHardCurrency(entityId, entryFee.amount, `Refund: ${entryFee.tournamentName}`);
    }

    entryFee.currentParticipants--;
    entryFee.poolTotal -= entryFee.amount;

    this.saveToStorage();
    return true;
  }

  /**
   * Create tournament pool
   */
  createTournamentPool(
    tournamentId: string,
    tournamentName: string,
    currencyType: CurrencyType,
    platformFeePercentage: number = 5
  ): TournamentPool {
    const poolId = `pool_${tournamentId}`;

    const pool: TournamentPool = {
      poolId,
      tournamentId,
      tournamentName,
      currencyType,
      totalPool: 0,
      playerContributions: new Map(),
      prizeDistribution: [
        { rank: 1, percentage: 50, amount: 0 },
        { rank: 2, percentage: 30, amount: 0 },
        { rank: 3, percentage: 20, amount: 0 },
      ],
      status: 'active',
      platformFee: platformFeePercentage,
      platformFeeAmount: 0,
    };

    this.tournamentPools.set(poolId, pool);
    this.saveToStorage();

    return pool;
  }

  /**
   * Finalize and distribute tournament pool
   */
  finalizeTournamentPool(
    poolId: string,
    rankings: Array<{ entityId: string; rank: number }>
  ): { success: boolean; distributions?: Map<string, number> } {
    const pool = this.tournamentPools.get(poolId);
    if (!pool) {
      return { success: false };
    }

    // Calculate prize distribution
    const distributions = new Map<string, number>();

    for (const ranking of rankings) {
      const prizeType = pool.prizeDistribution.find((p) => p.rank === ranking.rank);
      if (!prizeType) continue;

      const prize = (pool.totalPool * prizeType.percentage) / 100;

      distributions.set(ranking.entityId, prize);

      // Award prize
      if (pool.currencyType === 'soft') {
        this.addSoftCurrency(
          ranking.entityId,
          prize,
          `Prize: ${pool.tournamentName} (Rank ${ranking.rank})`,
          'prize_claim'
        );
      } else {
        this.addHardCurrency(
          ranking.entityId,
          prize,
          `Prize: ${pool.tournamentName} (Rank ${ranking.rank})`
        );
      }

      // Unlock balance
      const balance = this.balances.get(ranking.entityId);
      if (balance) {
        balance.lockedBalance -= (pool.playerContributions.get(ranking.entityId) || 0);
      }
    }

    pool.status = 'distributed';
    pool.distributedDate = Date.now();

    this.saveToStorage();

    return { success: true, distributions };
  }

  /**
   * Get transaction history
   */
  getTransactionHistory(
    entityId: string,
    limit: number = 50
  ): Transaction[] {
    const transactions = this.transactions.get(entityId) || [];
    return transactions.slice(-limit);
  }

  /**
   * Get all balances
   */
  getAllBalances(): PlayerBalance[] {
    return Array.from(this.balances.values());
  }

  /**
   * Get entry fee
   */
  getEntryFee(feeId: string): EntryFee | undefined {
    return this.entryFees.get(feeId);
  }

  /**
   * Get all active entry fees
   */
  getActiveEntryFees(): EntryFee[] {
    return Array.from(this.entryFees.values()).filter((f) => f.status === 'active');
  }

  /**
   * Get tournament pool
   */
  getTournamentPool(poolId: string): TournamentPool | undefined {
    return this.tournamentPools.get(poolId);
  }

  /**
   * Get platform fee total
   */
  getPlatformFeeTotal(): number {
    let total = 0;
    for (const pool of this.tournamentPools.values()) {
      total += pool.platformFeeAmount;
    }
    return total;
  }

  /**
   * Set hard currency config (for blockchain integration)
   */
  setHardCurrencyConfig(config: Partial<HardCurrencyConfig>): void {
    this.hardConfig = { ...this.hardConfig, ...config };
    this.saveToStorage();
  }

  /**
   * Get hard currency config
   */
  getHardCurrencyConfig(): HardCurrencyConfig {
    return this.hardConfig;
  }

  /**
   * Get soft currency config
   */
  getSoftCurrencyConfig(): SoftCurrencyConfig {
    return this.softConfig;
  }

  /**
   * Verify transaction on blockchain
   */
  verifyTransaction(transactionId: string, entityId: string): boolean {
    const transactions = this.transactions.get(entityId) || [];
    const transaction = transactions.find((t) => t.transactionId === transactionId);

    if (!transaction || !transaction.txHash) {
      return false;
    }

    transaction.verified = true;
    this.saveToStorage();
    return true;
  }

  /**
   * Private helper: Save to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        balances: Array.from(this.balances.entries()),
        transactions: Array.from(this.transactions.entries()),
        entryFees: Array.from(this.entryFees.entries()),
        tournamentPools: Array.from(this.tournamentPools.entries()),
        softConfig: this.softConfig,
        hardConfig: this.hardConfig,
      };
      localStorage.setItem('economy_system', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving economy data:', error);
    }
  }

  /**
   * Private helper: Load from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('economy_system');
      if (stored) {
        const data = JSON.parse(stored);

        if (Array.isArray(data.balances)) {
          for (const [key, value] of data.balances) {
            this.balances.set(key, value);
          }
        }

        if (Array.isArray(data.transactions)) {
          for (const [key, value] of data.transactions) {
            this.transactions.set(key, value);
          }
        }

        if (Array.isArray(data.entryFees)) {
          for (const [key, value] of data.entryFees) {
            this.entryFees.set(key, value);
          }
        }

        if (Array.isArray(data.tournamentPools)) {
          for (const [key, value] of data.tournamentPools) {
            this.tournamentPools.set(key, value);
          }
        }

        if (data.softConfig) {
          this.softConfig = data.softConfig;
        }

        if (data.hardConfig) {
          this.hardConfig = data.hardConfig;
        }
      }
    } catch (error) {
      console.error('Error loading economy data:', error);
    }
  }
}
