/**
 * Base Name Service (BNS)
 * 
 * Register and manage .base domain names for player profiles on Base network.
 * 
 * Features:
 * - Domain registration and renewal
 * - Profile metadata storage
 * - Domain trading and auctions
 * - NFT minting for domains
 * - Name resolution and reverse lookup
 * 
 * @example
 * ```ts
 * const bns = new BaseNameService();
 * await bns.registerDomain('player123.base', walletAddress, 'player@email.com');
 * const profile = await bns.resolveName('player123.base');
 * ```
 */

/** Domain tier levels */
type DomainTier = 'free' | 'premium' | 'elite';

/** Domain visibility settings */
type DomainVisibility = 'public' | 'private' | 'friends_only';

/**
 * Complete domain record with registration and profile data
 */
interface BaseDomainRecord {
  /** Unique record identifier */
  recordId: string;
  /** Domain name (e.g., "playername.base") */
  name: string;
  /** Owner's wallet address */
  owner: string;
  /** Resolved wallet address */
  walletAddress: string;
  /** Owner's email */
  email: string;
  
  /** Timestamp when domain was registered */
  registeredAt: number;
  /** Timestamp when domain expires */
  expiresAt: number;
  /** Whether domain auto-renews */
  autoRenew: boolean;
  /** Price for next renewal in ETH */
  renewalPrice: string;
  
  /** Profile data stored on domain */
  profile: {
    /** Display name */
    displayName: string;
    /** Avatar image URL or IPFS hash */
    avatar: string;
    /** User biography */
    bio: string;
    /** Account tier level */
    tier: DomainTier;
    /** Verification status */
    verified: boolean;
    /** Player statistics */
    stats: {
      level: number;
      rating: number;
      matchesPlayed: number;
      winRate: number;
    };
  };
  
  /** Whether this is the primary domain for the user */
  primaryDomain: boolean;
  /** Profile visibility setting */
  visibility: DomainVisibility;
  
  /** Whether domain has been minted as NFT */
  nftMinted: boolean;
  /** NFT token ID if minted */
  nftTokenId?: string;
  /** NFT contract address */
  nftContractAddress?: string;
  
  /** Social media links */
  socialLinks: Map<string, string>;
  
  /** Achievement badges */
  badges: string[];
  
  /** Record creation timestamp */
  timestamp: number;
}

interface DomainAuction {
  auctionId: string;
  name: string;
  seller: string; // original owner or registry
  highestBidder: string;
  highestBid: string; // in ETH
  
  startTime: number;
  endTime: number;
  status: 'active' | 'ended' | 'claimed' | 'cancelled';
  
  minBid: string;
  bidders: Array<{ address: string; amount: string; timestamp: number }>;
  
  timestamp: number;
}

interface NameReservation {
  reservationId: string;
  name: string;
  requester: string;
  reservedUntil: number; // 7 days to complete registration
  completed: boolean;
  completedAt?: number;
  
  timestamp: number;
}

interface DomainTransfer {
  transferId: string;
  name: string;
  from: string;
  to: string;
  
  initiatedAt: number;
  completedAt?: number;
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  
  approvalRequired: boolean;
  approvalExpiresAt?: number;
  
  timestamp: number;
}

interface NameResolver {
  resolverId: string;
  name: string; // full domain "playername.base"
  resolvedAddress: string;
  resolvedEmail: string;
  
  resolvedAt: number;
  lastUpdated: number;
  
  ttl: number; // time to live (cache duration)
  expiresAt: number;
}

interface DomainRenewal {
  renewalId: string;
  name: string;
  owner: string;
  
  currentExpiresAt: number;
  newExpiresAt: number;
  renewalCost: string; // in ETH
  
  initiatedAt: number;
  completedAt?: number;
  status: 'pending' | 'completed' | 'failed';
  
  autoRenewal: boolean;
  
  timestamp: number;
}

interface RegistrationStats {
  statsId: string;
  totalDomainsRegistered: number;
  totalActiveDomainsOverall: number;
  premiumDomainsCount: number;
  
  revenueCollected: string; // in ETH
  averagePrice: string; // in ETH
  medianPrice: string;
  
  mostPopularTier: DomainTier;
  
  snapshot: number; // timestamp
}

interface PricingTier {
  tier: 'economy' | 'standard' | 'premium' | 'elite';
  nameLength: number; // 3-9 chars = economy, 10-15 = standard, etc.
  yearlyPrice: string; // in ETH
  features: string[];
  maxDomains: number; // domains user can own
  
  createdAt: number;
}

export class BaseNameService {
  private static instance: BaseNameService;
  
  private domains: Map<string, BaseDomainRecord> = new Map(); // Key: "name.base"
  private ownerDomains: Map<string, string[]> = new Map(); // Key: walletAddress, Value: domain names
  private auctions: Map<string, DomainAuction> = new Map();
  private reservations: Map<string, NameReservation> = new Map(); // Key: reservation token
  private transfers: Map<string, DomainTransfer> = new Map();
  private resolvers: Map<string, NameResolver> = new Map(); // Key: "name.base"
  private renewals: Map<string, DomainRenewal> = new Map();
  private pricingTiers: Map<string, PricingTier> = new Map();
  private stats: RegistrationStats | null = null;

  // Configuration
  private readonly REGISTRY_ADDRESS = '0x0000000000000000000000000000000000000000'; // Placeholder
  private readonly BASE_CHAIN_ID = 8453;
  private readonly RESOLVER_TTL = 3600; // 1 hour cache
  private readonly REGISTRATION_DURATION = 365 * 24 * 60 * 60 * 1000; // 1 year in ms

  private constructor() {
    this.loadFromStorage();
    this.initializePricingTiers();
    this.initializeStats();
  }

  static getInstance(): BaseNameService {
    if (!BaseNameService.instance) {
      BaseNameService.instance = new BaseNameService();
    }
    return BaseNameService.instance;
  }

  /**
   * Domain Registration
   */
  private initializePricingTiers(): void {
    const tiers: PricingTier[] = [
      {
        tier: 'economy',
        nameLength: 3,
        yearlyPrice: '0.005', // 0.005 ETH (~$15)
        features: [
          'Basic profile',
          'Player stats display',
          '1 social link',
          'Standard avatar',
        ],
        maxDomains: 1,
        createdAt: Date.now(),
      },
      {
        tier: 'standard',
        nameLength: 4,
        yearlyPrice: '0.003', // 0.003 ETH (~$9)
        features: [
          'Enhanced profile',
          'Full stats display',
          '5 social links',
          'Custom avatar & banner',
          'Achievement badges',
        ],
        maxDomains: 2,
        createdAt: Date.now(),
      },
      {
        tier: 'premium',
        nameLength: 5,
        yearlyPrice: '0.002', // 0.002 ETH (~$6)
        features: [
          'Premium profile page',
          'Advanced stats & analytics',
          'Unlimited social links',
          'NFT domain badge',
          'Priority support',
          'Custom subdomain (1)',
        ],
        maxDomains: 5,
        createdAt: Date.now(),
      },
      {
        tier: 'elite',
        nameLength: 6,
        yearlyPrice: '0.001', // 0.001 ETH (~$3)
        features: [
          'VIP profile page',
          'Analytics dashboard',
          'Unlimited subdomains',
          'Exclusive NFT badge',
          'Priority support',
          'Custom branding',
          'Tier badge on profile',
        ],
        maxDomains: 10,
        createdAt: Date.now(),
      },
    ];

    tiers.forEach(tier => this.pricingTiers.set(tier.tier, tier));
  }

  private initializeStats(): void {
    this.stats = {
      statsId: `stats_${Date.now()}`,
      totalDomainsRegistered: 0,
      totalActiveDomainsOverall: 0,
      premiumDomainsCount: 0,
      revenueCollected: '0',
      averagePrice: '0.003',
      medianPrice: '0.002',
      mostPopularTier: 'free',
      snapshot: Date.now(),
    };
  }

  reserveDomain(
    name: string,
    requester: string,
    email: string
  ): NameReservation {
    // Validate domain name
    this.validateDomainName(name);

    // Check if already registered
    const fullName = `${name}.base`;
    if (this.domains.has(fullName)) {
      throw new Error(`Domain ${fullName} is already registered`);
    }

    // Check if already reserved
    const existingRes = Array.from(this.reservations.values()).find(
      r => r.name === fullName && r.completedAt === undefined
    );
    if (existingRes && existingRes.reservedUntil > Date.now()) {
      throw new Error(`Domain ${fullName} is already reserved`);
    }

    const reservation: NameReservation = {
      reservationId: `reserve_${name}_${Date.now()}`,
      name: fullName,
      requester,
      reservedUntil: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      completed: false,
      timestamp: Date.now(),
    };

    this.reservations.set(reservation.reservationId, reservation);
    this.saveToStorage();

    return reservation;
  }

  registerDomain(
    name: string,
    owner: string,
    email: string,
    profile: BaseDomainRecord['profile']
  ): BaseDomainRecord {
    // Validate
    this.validateDomainName(name);
    const fullName = `${name}.base`;

    if (this.domains.has(fullName)) {
      throw new Error(`Domain ${fullName} is already registered`);
    }

    // Get pricing
    const price = this.getDomainPrice(name);

    const domain: BaseDomainRecord = {
      recordId: `domain_${fullName}_${Date.now()}`,
      name: fullName,
      owner,
      walletAddress: owner,
      email,
      registeredAt: Date.now(),
      expiresAt: Date.now() + this.REGISTRATION_DURATION,
      autoRenew: true,
      renewalPrice: price,
      profile,
      primaryDomain: true,
      visibility: 'public',
      nftMinted: false,
      socialLinks: new Map(),
      badges: [],
      timestamp: Date.now(),
    };

    this.domains.set(fullName, domain);

    // Add to owner's domains
    if (!this.ownerDomains.has(owner)) {
      this.ownerDomains.set(owner, []);
    }
    this.ownerDomains.get(owner)!.push(fullName);

    // Create resolver
    this.createResolver(fullName, owner, email);

    // Update stats
    if (this.stats) {
      this.stats.totalDomainsRegistered++;
      this.stats.totalActiveDomainsOverall++;
    }

    this.saveToStorage();

    return domain;
  }

  getDomain(name: string): BaseDomainRecord | null {
    const fullName = name.endsWith('.base') ? name : `${name}.base`;
    return this.domains.get(fullName) || null;
  }

  getOwnerDomains(owner: string): BaseDomainRecord[] {
    const domainNames = this.ownerDomains.get(owner) || [];
    return domainNames
      .map(name => this.domains.get(name))
      .filter((d): d is BaseDomainRecord => d !== undefined);
  }

  updateDomainProfile(
    name: string,
    updates: Partial<BaseDomainRecord['profile']>
  ): BaseDomainRecord | null {
    const fullName = name.endsWith('.base') ? name : `${name}.base`;
    const domain = this.domains.get(fullName);

    if (!domain) return null;

    domain.profile = { ...domain.profile, ...updates };
    domain.timestamp = Date.now();

    // Update resolver
    this.updateResolver(fullName, domain.owner, domain.email);

    this.saveToStorage();
    return domain;
  }

  /**
   * Domain Auctions
   */
  initiateAuction(
    name: string,
    seller: string,
    minBid: string,
    durationDays: number = 7
  ): DomainAuction {
    const fullName = name.endsWith('.base') ? name : `${name}.base`;
    const domain = this.domains.get(fullName);

    if (!domain) {
      throw new Error(`Domain ${fullName} not found`);
    }

    if (domain.owner !== seller) {
      throw new Error('Only domain owner can auction');
    }

    const auction: DomainAuction = {
      auctionId: `auction_${fullName}_${Date.now()}`,
      name: fullName,
      seller,
      highestBidder: '',
      highestBid: '0',
      startTime: Date.now(),
      endTime: Date.now() + durationDays * 24 * 60 * 60 * 1000,
      status: 'active',
      minBid,
      bidders: [],
      timestamp: Date.now(),
    };

    this.auctions.set(auction.auctionId, auction);
    this.saveToStorage();

    return auction;
  }

  placeBid(auctionId: string, bidder: string, amount: string): DomainAuction | null {
    const auction = this.auctions.get(auctionId);
    if (!auction) return null;

    if (auction.status !== 'active') {
      throw new Error('Auction is not active');
    }

    if (Date.now() > auction.endTime) {
      auction.status = 'ended';
      this.saveToStorage();
      throw new Error('Auction has ended');
    }

    // Compare as BigInt
    const bidAmount = BigInt(amount);
    const minBidAmount = BigInt(auction.minBid);
    const highestBidAmount = BigInt(auction.highestBid);

    if (bidAmount < minBidAmount || (auction.highestBid !== '0' && bidAmount <= highestBidAmount)) {
      throw new Error('Bid is too low');
    }

    auction.bidders.push({
      address: bidder,
      amount,
      timestamp: Date.now(),
    });

    auction.highestBidder = bidder;
    auction.highestBid = amount;

    this.saveToStorage();
    return auction;
  }

  endAuction(auctionId: string): DomainAuction | null {
    const auction = this.auctions.get(auctionId);
    if (!auction) return null;

    if (auction.status === 'ended' || auction.status === 'claimed') {
      throw new Error('Auction already ended');
    }

    auction.status = 'ended';

    if (auction.highestBidder) {
      // Transfer domain to highest bidder
      const domain = this.domains.get(auction.name);
      if (domain) {
        const oldOwner = domain.owner;
        domain.owner = auction.highestBidder;
        domain.walletAddress = auction.highestBidder;

        // Update owner mappings
        const oldOwnerDomains = this.ownerDomains.get(oldOwner) || [];
        this.ownerDomains.set(
          oldOwner,
          oldOwnerDomains.filter(d => d !== auction.name)
        );

        if (!this.ownerDomains.has(auction.highestBidder)) {
          this.ownerDomains.set(auction.highestBidder, []);
        }
        this.ownerDomains.get(auction.highestBidder)!.push(auction.name);

        auction.status = 'claimed';
      }
    }

    this.saveToStorage();
    return auction;
  }

  getAuction(auctionId: string): DomainAuction | null {
    return this.auctions.get(auctionId) || null;
  }

  /**
   * Domain Resolution
   */
  private createResolver(name: string, address: string, email: string): NameResolver {
    const resolver: NameResolver = {
      resolverId: `resolver_${name}_${Date.now()}`,
      name,
      resolvedAddress: address,
      resolvedEmail: email,
      resolvedAt: Date.now(),
      lastUpdated: Date.now(),
      ttl: this.RESOLVER_TTL,
      expiresAt: Date.now() + this.RESOLVER_TTL * 1000,
    };

    this.resolvers.set(name, resolver);
    return resolver;
  }

  private updateResolver(name: string, address: string, email: string): NameResolver | null {
    const resolver = this.resolvers.get(name);
    if (!resolver) return null;

    resolver.resolvedAddress = address;
    resolver.resolvedEmail = email;
    resolver.lastUpdated = Date.now();
    resolver.expiresAt = Date.now() + this.RESOLVER_TTL * 1000;

    return resolver;
  }

  resolveName(name: string): NameResolver | null {
    const fullName = name.endsWith('.base') ? name : `${name}.base`;
    return this.resolvers.get(fullName) || null;
  }

  /**
   * Domain Transfers
   */
  initiateTransfer(
    name: string,
    from: string,
    to: string
  ): DomainTransfer {
    const fullName = name.endsWith('.base') ? name : `${name}.base`;
    const domain = this.domains.get(fullName);

    if (!domain) {
      throw new Error(`Domain ${fullName} not found`);
    }

    if (domain.owner !== from) {
      throw new Error('Only domain owner can transfer');
    }

    const transfer: DomainTransfer = {
      transferId: `transfer_${fullName}_${Date.now()}`,
      name: fullName,
      from,
      to,
      initiatedAt: Date.now(),
      status: 'pending',
      approvalRequired: true,
      approvalExpiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      timestamp: Date.now(),
    };

    this.transfers.set(transfer.transferId, transfer);
    this.saveToStorage();

    return transfer;
  }

  approveTransfer(transferId: string): DomainTransfer | null {
    const transfer = this.transfers.get(transferId);
    if (!transfer) return null;

    if (transfer.status !== 'pending') {
      throw new Error('Transfer is not pending');
    }

    if (transfer.approvalExpiresAt && Date.now() > transfer.approvalExpiresAt) {
      transfer.status = 'cancelled';
      this.saveToStorage();
      throw new Error('Transfer approval expired');
    }

    // Complete transfer
    const domain = this.domains.get(transfer.name);
    if (domain) {
      const oldOwner = domain.owner;
      domain.owner = transfer.to;
      domain.walletAddress = transfer.to;

      // Update owner mappings
      const oldOwnerDomains = this.ownerDomains.get(oldOwner) || [];
      this.ownerDomains.set(
        oldOwner,
        oldOwnerDomains.filter(d => d !== transfer.name)
      );

      if (!this.ownerDomains.has(transfer.to)) {
        this.ownerDomains.set(transfer.to, []);
      }
      this.ownerDomains.get(transfer.to)!.push(transfer.name);

      // Update resolver
      this.updateResolver(transfer.name, transfer.to, domain.email);
    }

    transfer.status = 'completed';
    transfer.completedAt = Date.now();

    this.saveToStorage();
    return transfer;
  }

  /**
   * Domain Renewal
   */
  renewDomain(
    name: string,
    owner: string,
    years: number = 1
  ): DomainRenewal {
    const fullName = name.endsWith('.base') ? name : `${name}.base`;
    const domain = this.domains.get(fullName);

    if (!domain) {
      throw new Error(`Domain ${fullName} not found`);
    }

    if (domain.owner !== owner) {
      throw new Error('Only domain owner can renew');
    }

    const price = this.getDomainPrice(name);
    const renewalCost = (parseFloat(price) * years).toString();

    const currentExpiry = domain.expiresAt;
    const newExpiry = currentExpiry + years * this.REGISTRATION_DURATION;

    const renewal: DomainRenewal = {
      renewalId: `renewal_${fullName}_${Date.now()}`,
      name: fullName,
      owner,
      currentExpiresAt: currentExpiry,
      newExpiresAt: newExpiry,
      renewalCost,
      initiatedAt: Date.now(),
      status: 'pending',
      autoRenewal: domain.autoRenew,
      timestamp: Date.now(),
    };

    this.renewals.set(renewal.renewalId, renewal);
    this.saveToStorage();

    return renewal;
  }

  completeRenewal(renewalId: string): DomainRenewal | null {
    const renewal = this.renewals.get(renewalId);
    if (!renewal) return null;

    const domain = this.domains.get(renewal.name);
    if (domain) {
      domain.expiresAt = renewal.newExpiresAt;
      domain.timestamp = Date.now();
    }

    renewal.status = 'completed';
    renewal.completedAt = Date.now();

    this.saveToStorage();
    return renewal;
  }

  /**
   * Pricing & Stats
   */
  getDomainPrice(name: string): string {
    const length = name.length;

    if (length <= 3) return this.pricingTiers.get('economy')?.yearlyPrice || '0.005';
    if (length <= 4) return this.pricingTiers.get('standard')?.yearlyPrice || '0.003';
    if (length <= 5) return this.pricingTiers.get('premium')?.yearlyPrice || '0.002';
    return this.pricingTiers.get('elite')?.yearlyPrice || '0.001';
  }

  getPricingTier(tier: string): PricingTier | null {
    return this.pricingTiers.get(tier) || null;
  }

  getStats(): RegistrationStats | null {
    return this.stats;
  }

  updateStats(updates: Partial<RegistrationStats>): void {
    if (this.stats) {
      Object.assign(this.stats, updates);
      this.stats.snapshot = Date.now();
    }
  }

  /**
   * Validation
   */
  private validateDomainName(name: string): void {
    if (!name || name.length < 3 || name.length > 15) {
      throw new Error('Domain name must be 3-15 characters');
    }

    if (!/^[a-z0-9-]+$/.test(name)) {
      throw new Error('Domain name can only contain lowercase letters, numbers, and hyphens');
    }

    if (name.startsWith('-') || name.endsWith('-')) {
      throw new Error('Domain name cannot start or end with a hyphen');
    }

    // Reserved names
    const reserved = ['admin', 'support', 'registry', 'dns', 'www', 'mail', 'ftp'];
    if (reserved.includes(name.toLowerCase())) {
      throw new Error(`Domain name "${name}" is reserved`);
    }
  }

  /**
   * Bulk Operations
   */
  searchDomains(query: string): BaseDomainRecord[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.domains.values()).filter(
      d =>
        d.name.includes(lowerQuery) ||
        d.profile.displayName.toLowerCase().includes(lowerQuery)
    );
  }

  getDomainsByTier(tier: 'free' | 'premium' | 'elite'): BaseDomainRecord[] {
    return Array.from(this.domains.values()).filter(d => d.profile.tier === tier);
  }

  getExpiringSoon(daysUntilExpiry: number = 30): BaseDomainRecord[] {
    const threshold = Date.now() + daysUntilExpiry * 24 * 60 * 60 * 1000;
    return Array.from(this.domains.values()).filter(
      d => d.expiresAt <= threshold && d.expiresAt > Date.now()
    );
  }

  /**
   * Storage
   */
  private saveToStorage(): void {
    try {
      const data = {
        domains: Array.from(this.domains.entries()),
        ownerDomains: Array.from(this.ownerDomains.entries()),
        auctions: Array.from(this.auctions.entries()),
        reservations: Array.from(this.reservations.entries()),
        transfers: Array.from(this.transfers.entries()),
        resolvers: Array.from(this.resolvers.entries()),
        renewals: Array.from(this.renewals.entries()),
        pricingTiers: Array.from(this.pricingTiers.entries()),
        stats: this.stats,
      };
      localStorage['base_name_service'] = JSON.stringify(data);
    } catch (error) {
      console.error('Failed to save base name service:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = JSON.parse(localStorage['base_name_service'] || '{}');
      if (data.domains) this.domains = new Map(data.domains);
      if (data.ownerDomains) this.ownerDomains = new Map(data.ownerDomains);
      if (data.auctions) this.auctions = new Map(data.auctions);
      if (data.reservations) this.reservations = new Map(data.reservations);
      if (data.transfers) this.transfers = new Map(data.transfers);
      if (data.resolvers) this.resolvers = new Map(data.resolvers);
      if (data.renewals) this.renewals = new Map(data.renewals);
      if (data.pricingTiers) this.pricingTiers = new Map(data.pricingTiers);
      if (data.stats) this.stats = data.stats;
    } catch (error) {
      console.error('Failed to load base name service:', error);
    }
  }
}

export type {
  BaseDomainRecord,
  DomainAuction,
  NameReservation,
  DomainTransfer,
  NameResolver,
  DomainRenewal,
  RegistrationStats,
  PricingTier,
};
