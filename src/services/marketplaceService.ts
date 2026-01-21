/**
 * Trade and marketplace service for player cards
 */

export interface NFTListing {
  listingId: string;
  tokenId: string;
  seller: string;
  price: bigint;
  currency: string;
  listedAt: number;
  expiresAt?: number;
  active: boolean;
}

export interface Offer {
  offerId: string;
  tokenId: string;
  buyer: string;
  seller: string;
  price: bigint;
  currency: string;
  createdAt: number;
  expiresAt?: number;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
}

export class MarketplaceService {
  private listings: Map<string, NFTListing> = new Map();
  private offers: Map<string, Offer> = new Map();
  private tradeHistory: Array<{
    tokenId: string;
    from: string;
    to: string;
    price: bigint;
    timestamp: number;
  }> = [];

  /**
   * List NFT for sale
   */
  listNFT(
    tokenId: string,
    seller: string,
    price: bigint,
    currency: string = 'ETH',
    expiresAt?: number
  ): NFTListing {
    const listingId = `${tokenId}-${seller}-${Date.now()}`;

    const listing: NFTListing = {
      listingId,
      tokenId,
      seller,
      price,
      currency,
      listedAt: Date.now(),
      expiresAt,
      active: true,
    };

    this.listings.set(listingId, listing);
    return listing;
  }

  /**
   * Get active listings for token
   */
  getListings(tokenId: string): NFTListing[] {
    return Array.from(this.listings.values()).filter(
      (l) => l.tokenId === tokenId && l.active
    );
  }

  /**
   * Get listings by seller
   */
  getSellerListings(seller: string): NFTListing[] {
    return Array.from(this.listings.values()).filter(
      (l) => l.seller === seller && l.active
    );
  }

  /**
   * Cancel listing
   */
  cancelListing(listingId: string): boolean {
    const listing = this.listings.get(listingId);
    if (!listing) return false;

    listing.active = false;
    return true;
  }

  /**
   * Make offer
   */
  makeOffer(
    tokenId: string,
    buyer: string,
    seller: string,
    price: bigint,
    currency: string = 'ETH',
    expiresAt?: number
  ): Offer {
    const offerId = `offer-${tokenId}-${buyer}-${Date.now()}`;

    const offer: Offer = {
      offerId,
      tokenId,
      buyer,
      seller,
      price,
      currency,
      createdAt: Date.now(),
      expiresAt,
      status: 'pending',
    };

    this.offers.set(offerId, offer);
    return offer;
  }

  /**
   * Accept offer
   */
  acceptOffer(offerId: string): boolean {
    const offer = this.offers.get(offerId);
    if (!offer || offer.status !== 'pending') return false;

    offer.status = 'accepted';

    this.tradeHistory.push({
      tokenId: offer.tokenId,
      from: offer.seller,
      to: offer.buyer,
      price: offer.price,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Reject offer
   */
  rejectOffer(offerId: string): boolean {
    const offer = this.offers.get(offerId);
    if (!offer) return false;

    offer.status = 'rejected';
    return true;
  }

  /**
   * Get offers for token
   */
  getOffers(tokenId: string): Offer[] {
    return Array.from(this.offers.values()).filter(
      (o) => o.tokenId === tokenId && o.status === 'pending'
    );
  }

  /**
   * Get buyer's offers
   */
  getBuyerOffers(buyer: string): Offer[] {
    return Array.from(this.offers.values()).filter((o) => o.buyer === buyer);
  }

  /**
   * Get trade history for token
   */
  getTradeHistory(tokenId: string) {
    return this.tradeHistory.filter((t) => t.tokenId === tokenId);
  }

  /**
   * Get floor price for token
   */
  getFloorPrice(tokenId: string): bigint {
    const listings = this.getListings(tokenId);
    if (listings.length === 0) return BigInt(0);

    return listings.reduce((min, l) => (l.price < min ? l.price : min), listings[0].price);
  }

  /**
   * Get marketplace statistics
   */
  getStatistics() {
    return {
      totalListings: Array.from(this.listings.values()).filter((l) => l.active).length,
      totalOffers: Array.from(this.offers.values()).filter((o) => o.status === 'pending').length,
      trades: this.tradeHistory.length,
      totalVolumeEth: this.tradeHistory.reduce(
        (sum, t) => sum + t.price,
        BigInt(0)
      ),
    };
  }
}
