/**
 * Marketplace System - NFT Trading & Listings
 * 
 * Allows players to:
 * - List NFTs for sale
 * - Browse marketplace
 * - Purchase NFTs
 * - Cancel listings
 * - Track price history
 */

export type ListingStatus = 'active' | 'sold' | 'cancelled';
export type CurrencyType = 'soft' | 'hard';

export interface PlayerNFT {
  nftId: string;
  playerId: string;
  playerName: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  attributes: {
    power: number;
    speed: number;
    defense: number;
    special: number;
  };
  imageUrl?: string;
  seriesId?: string;
  mintedAt: number;
  verified: boolean;
  contractAddress?: string;
  tokenId?: string;
}

export interface Listing {
  listingId: string;
  nftId: string;
  nft: PlayerNFT;
  seller: string;
  sellerName: string;
  price: number;
  currencyType: CurrencyType;
  status: ListingStatus;
  createdAt: number;
  expiresAt?: number;
  soldTo?: string;
  soldAt?: number;
  soldPrice?: number;
  cancelled?: boolean;
  cancelledAt?: number;
  cancelReason?: string;
}

export interface PriceHistory {
  nftId: string;
  prices: Array<{
    price: number;
    currencyType: CurrencyType;
    soldAt: number;
    seller: string;
    buyer: string;
  }>;
  floorPrice: number;
  averagePrice: number;
  lastSalePrice: number;
  lastSaleAt: number;
}

export interface MarketplaceStats {
  totalVolume: number;
  totalTransactions: number;
  activeListing: number;
  uniquePlayers: number;
  avgPrice: number;
  floorPrice: number;
}

export interface MarketplaceConfig {
  listingFeePercentage: number; // 2-5% platform fee
  maxListingDuration: number; // milliseconds
  minPrice: number;
  maxPrice: number;
  requiresVerification: boolean;
}

/**
 * Marketplace Manager - Handle all NFT trading
 * Singleton pattern for consistency
 */
export class MarketplaceManager {
  private static instance: MarketplaceManager;
  private listings: Map<string, Listing> = new Map();
  private userListings: Map<string, string[]> = new Map(); // userId -> [listingIds]
  private priceHistory: Map<string, PriceHistory> = new Map();
  private config: MarketplaceConfig = {
    listingFeePercentage: 2.5,
    maxListingDuration: 30 * 24 * 60 * 60 * 1000, // 30 days
    minPrice: 1,
    maxPrice: 1000000,
    requiresVerification: false,
  };

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): MarketplaceManager {
    if (!MarketplaceManager.instance) {
      MarketplaceManager.instance = new MarketplaceManager();
    }
    return MarketplaceManager.instance;
  }

  /**
   * Create a new listing
   */
  createListing(
    nft: PlayerNFT,
    seller: string,
    sellerName: string,
    price: number,
    currencyType: CurrencyType,
    durationDays: number = 30
  ): Listing {
    // Validate
    if (price < this.config.minPrice || price > this.config.maxPrice) {
      throw new Error(`Price must be between ${this.config.minPrice} and ${this.config.maxPrice}`);
    }

    if (durationDays <= 0 || durationDays * 24 * 60 * 60 * 1000 > this.config.maxListingDuration) {
      throw new Error(`Duration must be between 1 and ${this.config.maxListingDuration / (24 * 60 * 60 * 1000)} days`);
    }

    // Create listing
    const listingId = `listing_${nft.nftId}_${Date.now()}`;
    const listing: Listing = {
      listingId,
      nftId: nft.nftId,
      nft,
      seller,
      sellerName,
      price,
      currencyType,
      status: 'active',
      createdAt: Date.now(),
      expiresAt: Date.now() + durationDays * 24 * 60 * 60 * 1000,
    };

    // Store
    this.listings.set(listingId, listing);
    if (!this.userListings.has(seller)) {
      this.userListings.set(seller, []);
    }
    this.userListings.get(seller)!.push(listingId);

    this.saveToStorage();
    return listing;
  }

  /**
   * Purchase a listing
   */
  purchaseListing(
    listingId: string,
    buyer: string,
    buyerName: string,
    actualPrice: number
  ): { success: boolean; listing?: Listing; fee: number; total: number } {
    const listing = this.listings.get(listingId);

    if (!listing) {
      return { success: false, fee: 0, total: 0 };
    }

    if (listing.status !== 'active') {
      return { success: false, fee: 0, total: 0 };
    }

    if (listing.expiresAt && Date.now() > listing.expiresAt) {
      listing.status = 'cancelled';
      listing.cancelled = true;
      listing.cancelledAt = Date.now();
      listing.cancelReason = 'Listing expired';
      return { success: false, fee: 0, total: 0 };
    }

    // Calculate fee
    const fee = (actualPrice * this.config.listingFeePercentage) / 100;
    const sellerAmount = actualPrice - fee;

    // Update listing
    listing.status = 'sold';
    listing.soldTo = buyer;
    listing.soldAt = Date.now();
    listing.soldPrice = actualPrice;

    // Update price history
    this.updatePriceHistory(listing.nftId, {
      price: actualPrice,
      currencyType: listing.currencyType,
      soldAt: Date.now(),
      seller: listing.seller,
      buyer,
    });

    this.saveToStorage();

    return {
      success: true,
      listing,
      fee,
      total: sellerAmount,
    };
  }

  /**
   * Cancel a listing
   */
  cancelListing(listingId: string, seller: string, reason?: string): boolean {
    const listing = this.listings.get(listingId);

    if (!listing || listing.seller !== seller) {
      return false;
    }

    if (listing.status !== 'active') {
      return false;
    }

    listing.status = 'cancelled';
    listing.cancelled = true;
    listing.cancelledAt = Date.now();
    listing.cancelReason = reason;

    this.saveToStorage();
    return true;
  }

  /**
   * Get all active listings
   */
  getActiveListings(limit: number = 100, offset: number = 0): Listing[] {
    const active = Array.from(this.listings.values())
      .filter(l => l.status === 'active' && (!l.expiresAt || Date.now() <= l.expiresAt))
      .sort((a, b) => b.createdAt - a.createdAt);

    return active.slice(offset, offset + limit);
  }

  /**
   * Filter listings
   */
  filterListings(
    currencyType?: CurrencyType,
    minPrice?: number,
    maxPrice?: number,
    rarity?: string,
    limit: number = 100
  ): Listing[] {
    let results = Array.from(this.listings.values())
      .filter(l => l.status === 'active' && (!l.expiresAt || Date.now() <= l.expiresAt));

    if (currencyType) {
      results = results.filter(l => l.currencyType === currencyType);
    }

    if (minPrice !== undefined) {
      results = results.filter(l => l.price >= minPrice);
    }

    if (maxPrice !== undefined) {
      results = results.filter(l => l.price <= maxPrice);
    }

    if (rarity) {
      results = results.filter(l => l.nft.rarity === rarity);
    }

    return results.slice(0, limit);
  }

  /**
   * Get listings by seller
   */
  getSellerListings(seller: string): Listing[] {
    const listingIds = this.userListings.get(seller) || [];
    return listingIds
      .map(id => this.listings.get(id))
      .filter((l): l is Listing => !!l && l.status === 'active');
  }

  /**
   * Get price history for NFT
   */
  getPriceHistory(nftId: string): PriceHistory | undefined {
    return this.priceHistory.get(nftId);
  }

  /**
   * Update price history
   */
  private updatePriceHistory(
    nftId: string,
    sale: { price: number; currencyType: CurrencyType; soldAt: number; seller: string; buyer: string }
  ): void {
    if (!this.priceHistory.has(nftId)) {
      this.priceHistory.set(nftId, {
        nftId,
        prices: [],
        floorPrice: sale.price,
        averagePrice: sale.price,
        lastSalePrice: sale.price,
        lastSaleAt: sale.soldAt,
      });
    }

    const history = this.priceHistory.get(nftId)!;
    history.prices.push(sale);

    // Update stats
    history.lastSalePrice = sale.price;
    history.lastSaleAt = sale.soldAt;
    history.floorPrice = Math.min(history.floorPrice, sale.price);
    history.averagePrice =
      history.prices.reduce((sum, p) => sum + p.price, 0) / history.prices.length;
  }

  /**
   * Get marketplace statistics
   */
  getMarketplaceStats(): MarketplaceStats {
    const active = this.getActiveListings(1000);
    const sold = Array.from(this.listings.values()).filter(l => l.status === 'sold');

    const totalVolume = sold.reduce((sum, l) => sum + (l.soldPrice || 0), 0);
    const uniqueSellers = new Set(active.map(l => l.seller)).size;

    return {
      totalVolume,
      totalTransactions: sold.length,
      activeListing: active.length,
      uniquePlayers: uniqueSellers,
      avgPrice: active.length > 0 ? active.reduce((sum, l) => sum + l.price, 0) / active.length : 0,
      floorPrice: active.length > 0 ? Math.min(...active.map(l => l.price)) : 0,
    };
  }

  /**
   * Set marketplace configuration
   */
  setConfig(config: Partial<MarketplaceConfig>): void {
    this.config = { ...this.config, ...config };
    this.saveToStorage();
  }

  /**
   * Get marketplace configuration
   */
  getConfig(): MarketplaceConfig {
    return { ...this.config };
  }

  /**
   * Search listings
   */
  searchListings(query: string): Listing[] {
    const lowerQuery = query.toLowerCase();
    return this.getActiveListings(100).filter(
      l =>
        l.nft.playerName.toLowerCase().includes(lowerQuery) ||
        l.nft.rarity.toLowerCase().includes(lowerQuery) ||
        l.nftId.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get trending listings (by view count / recent sales)
   */
  getTrendingListings(limit: number = 10): Listing[] {
    const sold = Array.from(this.listings.values())
      .filter(l => l.status === 'sold')
      .sort((a, b) => (b.soldAt || 0) - (a.soldAt || 0));

    return sold.slice(0, limit);
  }

  /**
   * Persist to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        listings: Array.from(this.listings.entries()),
        userListings: Array.from(this.userListings.entries()),
        priceHistory: Array.from(this.priceHistory.entries()),
        config: this.config,
      };
      localStorage.setItem('marketplace_system', JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save marketplace data:', e);
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    try {
      const data = JSON.parse(localStorage.getItem('marketplace_system') || '{}');
      if (data.listings) {
        this.listings = new Map(data.listings);
      }
      if (data.userListings) {
        this.userListings = new Map(data.userListings);
      }
      if (data.priceHistory) {
        this.priceHistory = new Map(data.priceHistory);
      }
      if (data.config) {
        this.config = data.config;
      }
    } catch (e) {
      console.warn('Failed to load marketplace data:', e);
    }
  }

  /**
   * Clear all data (development only)
   */
  clearAll(): void {
    this.listings.clear();
    this.userListings.clear();
    this.priceHistory.clear();
    this.saveToStorage();
  }
}
