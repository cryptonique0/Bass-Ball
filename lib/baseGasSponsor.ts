/**
 * Base Gas Sponsorship System
 * Manages gas-sponsored transactions on Base network
 * Uses ERC-4337 and Paymaster contracts for gas abstraction
 */

interface GasSponsorshipConfig {
  paymasterAddress: string;
  paymasterRPC: string;
  bundlerRPC: string;
  entryPointAddress: string;
  chainId: number; // Base: 8453
  sponsorshipBudget: bigint;
  maxGasLimit: bigint;
}

interface UserOperation {
  sender: string;
  nonce: bigint;
  initCode: string;
  callData: string;
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  paymasterAndData: string;
  signature: string;
}

interface SponsorshipRequest {
  requestId: string;
  userAddress: string;
  transactionType: 'match_entry' | 'player_purchase' | 'season_pass' | 'cosmetic';
  estimatedGasCost: bigint;
  actualGasCost?: bigint;
  paymasterAddress: string;
  approved: boolean;
  executedAt?: number;
  timestamp: number;
}

interface GasAnalytics {
  analyticsId: string;
  totalSponsored: bigint;
  totalUsers: number;
  averageGasCostPerTx: bigint;
  successRate: number; // percentage
  failedTxs: number;
  sponsoredMatches: number;
  sponsorshipBudgetRemaining: bigint;
  timestamp: number;
}

interface SponsorshipTier {
  tierId: string;
  name: string;
  monthlyGasLimit: bigint; // in wei
  maxTxPerDay: number;
  eligibility: {
    minTurnaroundRating: number; // 0-100
    minMatchesPlayed: number;
    requiresVerification: boolean;
  };
  benefits: string[];
}

interface PaymasterConfig {
  rpcUrl: string;
  privateKey?: string; // For testnet only
  maxVerificationGas: bigint;
  verificationGasLimit: bigint;
  paymasterDeposit: bigint;
}

interface TransactionReceipt {
  transactionHash: string;
  blockNumber: number;
  blockHash: string;
  from: string;
  to: string;
  gasUsed: bigint;
  gasPrice: bigint;
  status: 'success' | 'failed' | 'pending';
  timestamp: number;
}

export class BaseGasSponsor {
  private static instance: BaseGasSponsor;
  private config: GasSponsorshipConfig;
  private sponsorshipRequests: Map<string, SponsorshipRequest> = new Map();
  private sponsorshipTiers: Map<string, SponsorshipTier> = new Map();
  private analytics: Map<string, GasAnalytics> = new Map();
  private userSponsorshipUsage: Map<string, { daily: bigint; monthly: bigint; lastReset: number }> = new Map();
  private transactionHistory: Map<string, TransactionReceipt> = new Map();

  private constructor(config: GasSponsorshipConfig) {
    this.config = config;
    this.loadFromStorage();
    this.initializeTiers();
    this.initializeAnalytics();
  }

  static getInstance(config?: GasSponsorshipConfig): BaseGasSponsor {
    if (!BaseGasSponsor.instance && config) {
      BaseGasSponsor.instance = new BaseGasSponsor(config);
    }
    return BaseGasSponsor.instance;
  }

  /**
   * Sponsorship Tiers
   */
  private initializeTiers(): void {
    const tiers: SponsorshipTier[] = [
      {
        tierId: 'tier_free',
        name: 'Free Tier',
        monthlyGasLimit: BigInt('100000000000000000'), // 0.1 ETH
        maxTxPerDay: 3,
        eligibility: {
          minTurnaroundRating: 0,
          minMatchesPlayed: 0,
          requiresVerification: false,
        },
        benefits: [
          'Free match entry (3/day)',
          'Gas-free first transaction',
          'Priority queue for free matches',
        ],
      },
      {
        tierId: 'tier_active',
        name: 'Active Player',
        monthlyGasLimit: BigInt('500000000000000000'), // 0.5 ETH
        maxTxPerDay: 10,
        eligibility: {
          minTurnaroundRating: 40,
          minMatchesPlayed: 5,
          requiresVerification: false,
        },
        benefits: [
          'Free match entry (10/day)',
          'Gas-free cosmetic purchases',
          'Season pass discounts',
          'Priority gas sponsorship',
        ],
      },
      {
        tierId: 'tier_elite',
        name: 'Elite Player',
        monthlyGasLimit: BigInt('1000000000000000000'), // 1 ETH
        maxTxPerDay: 25,
        eligibility: {
          minTurnaroundRating: 75,
          minMatchesPlayed: 50,
          requiresVerification: true,
        },
        benefits: [
          'Unlimited match entries (daily cap)',
          'All cosmetics gas-free',
          'Exclusive season pass access',
          'VIP tournament access',
          'Gas rebate program',
        ],
      },
    ];

    tiers.forEach(tier => this.sponsorshipTiers.set(tier.tierId, tier));
  }

  getTier(tierId: string): SponsorshipTier | null {
    return this.sponsorshipTiers.get(tierId) || null;
  }

  getAllTiers(): SponsorshipTier[] {
    return Array.from(this.sponsorshipTiers.values());
  }

  /**
   * Sponsorship Request Processing
   */
  async requestGasSponsorship(
    userAddress: string,
    transactionType: SponsorshipRequest['transactionType'],
    estimatedGasCost: bigint,
    userTier: string
  ): Promise<SponsorshipRequest | null> {
    // Check user sponsorship limit
    const tier = this.getTier(userTier);
    if (!tier) return null;

    // Check daily limit
    const usage = this.getUserUsage(userAddress);
    if (usage.daily >= BigInt(tier.maxTxPerDay)) {
      console.log(`User ${userAddress} exceeded daily limit`);
      return null;
    }

    // Check monthly limit
    const monthlyUsed = this.getMonthlyUsage(userAddress);
    if (monthlyUsed + estimatedGasCost > tier.monthlyGasLimit) {
      console.log(`User ${userAddress} would exceed monthly limit`);
      return null;
    }

    // Check sponsorship budget
    const analytics = this.getLatestAnalytics();
    if (analytics && analytics.sponsorshipBudgetRemaining < estimatedGasCost) {
      console.log('Sponsorship pool exhausted');
      return null;
    }

    // Create sponsorship request
    const request: SponsorshipRequest = {
      requestId: `sponsor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userAddress,
      transactionType,
      estimatedGasCost,
      paymasterAddress: this.config.paymasterAddress,
      approved: true,
      timestamp: Date.now(),
    };

    this.sponsorshipRequests.set(request.requestId, request);
    
    // Update usage
    usage.daily += BigInt(1);
    this.userSponsorshipUsage.set(userAddress, usage);
    
    this.saveToStorage();
    return request;
  }

  approveSponsorshipRequest(requestId: string): boolean {
    const request = this.sponsorshipRequests.get(requestId);
    if (!request) return false;

    request.approved = true;
    this.saveToStorage();
    return true;
  }

  rejectSponsorshipRequest(requestId: string): boolean {
    const request = this.sponsorshipRequests.get(requestId);
    if (!request) return false;

    request.approved = false;
    this.saveToStorage();
    return true;
  }

  getSponsorshipRequest(requestId: string): SponsorshipRequest | null {
    return this.sponsorshipRequests.get(requestId) || null;
  }

  /**
   * User Operation Handling (ERC-4337)
   */
  async createUserOperation(
    userAddress: string,
    callData: string,
    sponsorshipRequestId: string
  ): Promise<UserOperation | null> {
    const sponsorshipRequest = this.sponsorshipRequests.get(sponsorshipRequestId);
    if (!sponsorshipRequest || !sponsorshipRequest.approved) {
      return null;
    }

    // Simulate nonce retrieval (in production, query from chain)
    const nonce = BigInt(Math.floor(Math.random() * 10000));

    // Calculate gas limits
    const callGasLimit = BigInt(21000) + (sponsorshipRequest.estimatedGasCost / BigInt(2));
    const verificationGasLimit = BigInt(60000);
    const preVerificationGas = BigInt(21000);

    // Create user operation
    const userOp: UserOperation = {
      sender: userAddress,
      nonce,
      initCode: '0x',
      callData,
      callGasLimit,
      verificationGasLimit,
      preVerificationGas,
      maxFeePerGas: BigInt(2000000000), // 2 Gwei on Base
      maxPriorityFeePerGas: BigInt(100000000), // 0.1 Gwei
      paymasterAndData: this.encodePaymasterData(
        this.config.paymasterAddress,
        sponsorshipRequest.estimatedGasCost
      ),
      signature: '0x', // Will be signed by wallet
    };

    return userOp;
  }

  private encodePaymasterData(paymasterAddress: string, gasCost: bigint): string {
    // ABI encode paymaster address and gas cost
    // In production, use proper ABI encoding
    return (
      paymasterAddress +
      gasCost.toString(16).padStart(64, '0')
    );
  }

  /**
   * Transaction Tracking
   */
  recordTransaction(
    transactionHash: string,
    userAddress: string,
    gasUsed: bigint,
    status: 'success' | 'failed' | 'pending',
    sponsorshipRequestId?: string
  ): TransactionReceipt {
    const receipt: TransactionReceipt = {
      transactionHash,
      blockNumber: 0, // Will be updated
      blockHash: '0x',
      from: userAddress,
      to: this.config.paymasterAddress,
      gasUsed,
      gasPrice: BigInt(2000000000),
      status,
      timestamp: Date.now(),
    };

    this.transactionHistory.set(transactionHash, receipt);

    // Update sponsorship request
    if (sponsorshipRequestId) {
      const request = this.sponsorshipRequests.get(sponsorshipRequestId);
      if (request) {
        request.actualGasCost = gasUsed;
        request.executedAt = Date.now();
      }
    }

    // Update analytics
    this.updateAnalytics(gasUsed, status === 'success');

    this.saveToStorage();
    return receipt;
  }

  getTransactionHistory(userAddress: string): TransactionReceipt[] {
    return Array.from(this.transactionHistory.values()).filter(
      tx => tx.from === userAddress
    );
  }

  /**
   * Usage Tracking
   */
  private getUserUsage(userAddress: string): { daily: bigint; monthly: bigint; lastReset: number } {
    if (!this.userSponsorshipUsage.has(userAddress)) {
      this.userSponsorshipUsage.set(userAddress, {
        daily: BigInt(0),
        monthly: BigInt(0),
        lastReset: Date.now(),
      });
    }

    const usage = this.userSponsorshipUsage.get(userAddress)!;

    // Reset daily if needed
    const now = Date.now();
    const daysPassed = (now - usage.lastReset) / (1000 * 60 * 60 * 24);
    if (daysPassed >= 1) {
      usage.daily = BigInt(0);
      usage.lastReset = now;
    }

    return usage;
  }

  private getMonthlyUsage(userAddress: string): bigint {
    const usage = this.getUserUsage(userAddress);
    return usage.monthly;
  }

  getUserRemainingBudget(userAddress: string, tierId: string): bigint {
    const tier = this.getTier(tierId);
    if (!tier) return BigInt(0);

    const usage = this.getUserUsage(userAddress);
    const monthly = this.getMonthlyUsage(userAddress);
    
    return tier.monthlyGasLimit - monthly;
  }

  /**
   * Analytics
   */
  private initializeAnalytics(): void {
    const analytics: GasAnalytics = {
      analyticsId: `analytics_${Date.now()}`,
      totalSponsored: BigInt(0),
      totalUsers: 0,
      averageGasCostPerTx: BigInt(0),
      successRate: 100,
      failedTxs: 0,
      sponsoredMatches: 0,
      sponsorshipBudgetRemaining: this.config.sponsorshipBudget,
      timestamp: Date.now(),
    };

    this.analytics.set(analytics.analyticsId, analytics);
  }

  private updateAnalytics(gasCost: bigint, success: boolean): void {
    const latest = this.getLatestAnalytics();
    if (!latest) return;

    latest.totalSponsored += gasCost;
    latest.sponsorshipBudgetRemaining -= gasCost;
    
    if (success) {
      latest.sponsoredMatches++;
    } else {
      latest.failedTxs++;
    }

    // Update success rate
    const totalTxs = latest.sponsoredMatches + latest.failedTxs;
    latest.successRate = (latest.sponsoredMatches / totalTxs) * 100;

    latest.averageGasCostPerTx = latest.totalSponsored / BigInt(totalTxs);

    this.saveToStorage();
  }

  getLatestAnalytics(): GasAnalytics | null {
    const analyticsArray = Array.from(this.analytics.values());
    if (analyticsArray.length === 0) return null;
    
    return analyticsArray.sort((a, b) => b.timestamp - a.timestamp)[0];
  }

  getAllAnalytics(): GasAnalytics[] {
    return Array.from(this.analytics.values())
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Paymaster Management
   */
  async validatePaymaster(): Promise<boolean> {
    try {
      // In production, query paymaster status from Base RPC
      // For now, check if address is valid
      return this.config.paymasterAddress.startsWith('0x') && 
             this.config.paymasterAddress.length === 42;
    } catch (error) {
      console.error('Paymaster validation failed:', error);
      return false;
    }
  }

  async checkPaymasterDeposit(): Promise<bigint> {
    try {
      // In production, query balance from EntryPoint
      // For now, return mock value
      return BigInt('5000000000000000000'); // 5 ETH
    } catch (error) {
      console.error('Failed to check paymaster deposit:', error);
      return BigInt(0);
    }
  }

  /**
   * Storage
   */
  private saveToStorage(): void {
    try {
      const data = {
        sponsorshipRequests: Array.from(this.sponsorshipRequests.entries()),
        sponsorshipTiers: Array.from(this.sponsorshipTiers.entries()),
        analytics: Array.from(this.analytics.entries()),
        userSponsorshipUsage: Array.from(this.userSponsorshipUsage.entries()),
        transactionHistory: Array.from(this.transactionHistory.entries()),
      };
      localStorage['base_gas_sponsor'] = JSON.stringify(data);
    } catch (error) {
      console.error('Failed to save gas sponsor system:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = JSON.parse(localStorage['base_gas_sponsor'] || '{}');
      if (data.sponsorshipRequests) this.sponsorshipRequests = new Map(data.sponsorshipRequests);
      if (data.sponsorshipTiers) this.sponsorshipTiers = new Map(data.sponsorshipTiers);
      if (data.analytics) this.analytics = new Map(data.analytics);
      if (data.userSponsorshipUsage) this.userSponsorshipUsage = new Map(data.userSponsorshipUsage);
      if (data.transactionHistory) this.transactionHistory = new Map(data.transactionHistory);
    } catch (error) {
      console.error('Failed to load gas sponsor system:', error);
    }
  }
}

export type {
  GasSponsorshipConfig,
  UserOperation,
  SponsorshipRequest,
  GasAnalytics,
  SponsorshipTier,
  PaymasterConfig,
  TransactionReceipt,
};
