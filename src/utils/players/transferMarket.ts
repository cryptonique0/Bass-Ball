/**
 * Transfer Market System - Buy/sell players, negotiate contracts
 */

export interface TransferOffer {
  offerId: string;
  fromTeam: string;
  toTeam: string;
  playerId: string;
  offerAmount: number;
  offerDate: number;
  expiryDate: number;
  playerWages: number; // annual salary
  contractLength: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
}

export interface TransferWindow {
  name: string;
  startDate: number;
  endDate: number;
  closed: boolean;
}

export class TransferMarketSystem {
  private activeOffers: Map<string, TransferOffer> = new Map();
  private transferHistory: TransferOffer[] = [];
  private transferWindows: TransferWindow[] = [
    {
      name: 'summer',
      startDate: Date.UTC(2026, 5, 1),
      endDate: Date.UTC(2026, 8, 30),
      closed: false,
    },
    {
      name: 'winter',
      startDate: Date.UTC(2026, 0, 1),
      endDate: Date.UTC(2026, 1, 31),
      closed: false,
    },
  ];

  private marketPrices: Map<string, number> = new Map();

  isTransferWindowOpen(): boolean {
    const now = Date.now();
    const isOpen = this.transferWindows.some((w) => now >= w.startDate && now <= w.endDate && !w.closed);
    return isOpen;
  }

  calculatePlayerValue(
    playerRating: number,
    age: number,
    contractYearsRemaining: number,
    marketDemand: number = 1
  ): number {
    const ageMultiplier = age < 25 ? 1.2 : age > 32 ? 0.5 : 1.0;
    const contractMultiplier = contractYearsRemaining > 3 ? 1.3 : contractYearsRemaining < 1 ? 0.5 : 1.0;

    const baseValue = playerRating * playerRating * 5000;
    return Math.floor(baseValue * ageMultiplier * contractMultiplier * marketDemand);
  }

  makeOffer(
    fromTeam: string,
    toTeam: string,
    playerId: string,
    offerAmount: number,
    playerWages: number,
    contractLength: number
  ): TransferOffer | null {
    if (!this.isTransferWindowOpen()) {
      return null;
    }

    const offer: TransferOffer = {
      offerId: `offer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fromTeam,
      toTeam,
      playerId,
      offerAmount,
      offerDate: Date.now(),
      expiryDate: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      playerWages,
      contractLength,
      status: 'pending',
    };

    this.activeOffers.set(offer.offerId, offer);
    return offer;
  }

  respondToOffer(offerId: string, accepted: boolean): boolean {
    const offer = this.activeOffers.get(offerId);
    if (!offer) return false;

    if (accepted) {
      offer.status = 'accepted';
      this.transferHistory.push(offer);
    } else {
      offer.status = 'rejected';
    }

    return true;
  }

  getOfferForPlayer(playerId: string): TransferOffer[] {
    return Array.from(this.activeOffers.values()).filter((o) => o.playerId === playerId && o.status === 'pending');
  }

  getTeamOffers(teamId: string, direction: 'incoming' | 'outgoing'): TransferOffer[] {
    const key = direction === 'incoming' ? 'toTeam' : 'fromTeam';
    return Array.from(this.activeOffers.values()).filter((o) => o[key] === teamId && o.status === 'pending');
  }

  getTransferHistory(playerId: string): TransferOffer[] {
    return this.transferHistory.filter((o) => o.playerId === playerId && o.status === 'accepted');
  }

  estimatePlayerMarketPrice(playerId: string): number {
    return this.marketPrices.get(playerId) || 0;
  }

  updateMarketPrice(playerId: string, newPrice: number): void {
    this.marketPrices.set(playerId, newPrice);
  }

  cleanupExpiredOffers(): void {
    const now = Date.now();
    for (const [id, offer] of this.activeOffers.entries()) {
      if (offer.expiryDate < now && offer.status === 'pending') {
        offer.status = 'expired';
      }
    }
  }

  getMarketTrends(): {
    avgPlayerValue: number;
    mostExpensive: TransferOffer | undefined;
    totalTransfers: number;
  } {
    const completed = this.transferHistory.filter((o) => o.status === 'accepted');
    const avgValue = completed.length > 0 ? completed.reduce((sum, o) => sum + o.offerAmount, 0) / completed.length : 0;
    const mostExpensive = completed.length > 0 ? completed.reduce((max, o) => (o.offerAmount > max.offerAmount ? o : max)) : undefined;

    return {
      avgPlayerValue: avgValue,
      mostExpensive,
      totalTransfers: completed.length,
    };
  }
}
