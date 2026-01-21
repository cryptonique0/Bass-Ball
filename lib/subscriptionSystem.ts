// Subscription System - Premium tiers, features, pricing, and management
// Handles subscription lifecycle, upgrades/downgrades, billing, and entitlements

export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'elite' | 'premium';

export type BillingPeriod = 'monthly' | 'quarterly' | 'annual';

export interface SubscriptionFeature {
  name: string;
  description: string;
  included: boolean;
}

export interface SubscriptionTierConfig {
  id: SubscriptionTier;
  name: string;
  description: string;
  monthlyPrice: number;
  quarterlyPrice: number;
  annualPrice: number;
  features: SubscriptionFeature[];
  maxMatchesPerDay: number;
  maxReplayStorage: number; // GB
  cosmecticsSlots: number;
  battlePassIncluded: boolean;
  revenueSharePercentage: number; // % of referral revenue
  prioritySupport: boolean;
  adFree: boolean;
  earlyAccess: boolean;
  customTeamProfile: boolean;
  apiAccess: boolean;
  color: string;
  icon: string;
  badge: string;
}

export interface SubscriptionPurchase {
  id: string;
  tier: SubscriptionTier;
  billingPeriod: BillingPeriod;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  purchaseDate: Date;
  transactionId: string;
}

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  currentTier: SubscriptionTier;
  billingPeriod: BillingPeriod;
  startDate: Date;
  renewalDate: Date;
  cancelDate: Date | null;
  isActive: boolean;
  autoRenew: boolean;
  purchaseHistory: SubscriptionPurchase[];
  revenueShareEarnings: number;
  referralBonus: number;
}

export interface SubscriptionStats {
  activeSubscribers: number;
  totalRevenue: number;
  tierDistribution: Record<SubscriptionTier, number>;
  averageRevenuePerUser: number;
  churnRate: number;
  upgradedThisMonth: number;
  downgradedThisMonth: number;
}

export interface UpgradeDowngradeOption {
  from: SubscriptionTier;
  to: SubscriptionTier;
  proratedCost: number;
  creditAmount: number;
}

class SubscriptionSystem {
  private static instance: SubscriptionSystem;
  private tiers: Map<SubscriptionTier, SubscriptionTierConfig>;
  private subscriptions: Map<string, Subscription>;
  private stats: SubscriptionStats;

  private constructor() {
    this.tiers = new Map();
    this.subscriptions = new Map();
    this.initializeTiers();
    this.loadFromStorage();
    this.stats = {
      activeSubscribers: 0,
      totalRevenue: 0,
      tierDistribution: {
        free: 0,
        starter: 0,
        pro: 0,
        elite: 0,
        premium: 0,
      },
      averageRevenuePerUser: 0,
      churnRate: 0,
      upgradedThisMonth: 0,
      downgradedThisMonth: 0,
    };
  }

  static getInstance(): SubscriptionSystem {
    if (!SubscriptionSystem.instance) {
      SubscriptionSystem.instance = new SubscriptionSystem();
    }
    return SubscriptionSystem.instance;
  }

  private initializeTiers(): void {
    const tierConfigs: SubscriptionTierConfig[] = [
      {
        id: 'free',
        name: 'Free',
        description: 'Perfect for casual players',
        monthlyPrice: 0,
        quarterlyPrice: 0,
        annualPrice: 0,
        features: [
          { name: 'Unlimited Matches', description: 'Play as many matches as you want', included: true },
          { name: 'Basic Cosmetics', description: 'Access 10 cosmetic items', included: true },
          { name: 'Match Replays (7 days)', description: 'Store replays for 7 days', included: true },
          { name: 'Standard Support', description: 'Email support with 24-48h response', included: true },
          { name: 'Battle Pass (Free Track)', description: 'Access free tier rewards only', included: true },
          { name: 'Ad-Supported', description: 'See ads during breaks', included: true },
          { name: 'Basic Team Profile', description: 'Standard team customization', included: true },
          { name: 'No Revenue Share', description: 'No earnings from referrals', included: false },
        ],
        maxMatchesPerDay: 999,
        maxReplayStorage: 50,
        cosmecticsSlots: 10,
        battlePassIncluded: false,
        revenueSharePercentage: 0,
        prioritySupport: false,
        adFree: false,
        earlyAccess: false,
        customTeamProfile: false,
        apiAccess: false,
        color: '#6b7280',
        icon: '⭐',
        badge: 'free',
      },
      {
        id: 'starter',
        name: 'Starter',
        description: 'For dedicated players',
        monthlyPrice: 4.99,
        quarterlyPrice: 12.99,
        annualPrice: 44.99,
        features: [
          { name: 'Unlimited Matches', description: 'Play as many matches as you want', included: true },
          { name: 'Premium Cosmetics', description: 'Access 50+ premium cosmetic items', included: true },
          { name: 'Match Replays (30 days)', description: 'Store replays for 30 days', included: true },
          { name: 'Priority Support', description: 'Email support with 12-24h response', included: true },
          { name: 'Battle Pass (Premium Track)', description: 'Access full seasonal rewards', included: true },
          { name: 'Ad-Free Experience', description: 'No ads during gameplay', included: true },
          { name: 'Basic Team Profile', description: 'Enhanced team customization', included: true },
          { name: '10% Revenue Share', description: 'Earn 10% from referrals', included: true },
        ],
        maxMatchesPerDay: 999,
        maxReplayStorage: 200,
        cosmecticsSlots: 50,
        battlePassIncluded: true,
        revenueSharePercentage: 10,
        prioritySupport: true,
        adFree: true,
        earlyAccess: false,
        customTeamProfile: true,
        apiAccess: false,
        color: '#3b82f6',
        icon: '🚀',
        badge: 'starter',
      },
      {
        id: 'pro',
        name: 'Pro',
        description: 'For competitive players',
        monthlyPrice: 9.99,
        quarterlyPrice: 24.99,
        annualPrice: 89.99,
        features: [
          { name: 'Unlimited Matches', description: 'Play as many matches as you want', included: true },
          { name: 'Exclusive Cosmetics', description: 'Access 100+ exclusive items', included: true },
          { name: 'Unlimited Replays', description: 'Store unlimited replays', included: true },
          { name: 'VIP Support', description: 'Priority chat support with instant response', included: true },
          { name: 'Premium Battle Pass', description: 'Double XP on all challenges', included: true },
          { name: 'Ad-Free Experience', description: 'Complete ad-free gameplay', included: true },
          { name: 'Advanced Team Profile', description: 'Full customization with premium themes', included: true },
          { name: '20% Revenue Share', description: 'Earn 20% from referrals + bonuses', included: true },
          { name: 'Early Access', description: 'New features 2 weeks early', included: true },
          { name: 'API Access (Limited)', description: 'Access to basic API endpoints', included: true },
        ],
        maxMatchesPerDay: 999,
        maxReplayStorage: 1000,
        cosmecticsSlots: 100,
        battlePassIncluded: true,
        revenueSharePercentage: 20,
        prioritySupport: true,
        adFree: true,
        earlyAccess: true,
        customTeamProfile: true,
        apiAccess: true,
        color: '#8b5cf6',
        icon: '👑',
        badge: 'pro',
      },
      {
        id: 'elite',
        name: 'Elite',
        description: 'For esports professionals',
        monthlyPrice: 19.99,
        quarterlyPrice: 49.99,
        annualPrice: 179.99,
        features: [
          { name: 'Unlimited Everything', description: 'All features without limits', included: true },
          { name: 'Exclusive Diamond Cosmetics', description: 'Rare diamond-tier cosmetics only', included: true },
          { name: 'Unlimited Replays (Cloud)', description: 'Unlimited cloud storage with 4K export', included: true },
          { name: '24/7 Concierge Support', description: 'Direct phone & chat support anytime', included: true },
          { name: 'Elite Battle Pass', description: 'Triple XP + exclusive elite rewards', included: true },
          { name: 'Premium Ad-Free', description: 'Absolutely no ads anywhere', included: true },
          { name: 'Custom Team Profile', description: 'Complete white-label team profile', included: true },
          { name: '30% Revenue Share', description: 'Earn 30% from referrals + performance bonuses', included: true },
          { name: 'Priority Early Access', description: 'First access to all new features', included: true },
          { name: 'Full API Access', description: 'Complete API access with premium limits', included: true },
          { name: 'Tournament Manager', description: 'Host and manage tournaments', included: true },
          { name: 'Analytics Dashboard', description: 'Advanced player & team analytics', included: true },
        ],
        maxMatchesPerDay: 999,
        maxReplayStorage: 10000,
        cosmecticsSlots: 500,
        battlePassIncluded: true,
        revenueSharePercentage: 30,
        prioritySupport: true,
        adFree: true,
        earlyAccess: true,
        customTeamProfile: true,
        apiAccess: true,
        color: '#f59e0b',
        icon: '💎',
        badge: 'elite',
      },
      {
        id: 'premium',
        name: 'Premium',
        description: 'For content creators',
        monthlyPrice: 29.99,
        quarterlyPrice: 74.99,
        annualPrice: 269.99,
        features: [
          { name: 'Everything in Elite', description: 'All Elite tier features included', included: true },
          { name: 'Creator Kit', description: 'Professional streaming overlays & assets', included: true },
          { name: 'Monetization Toolkit', description: 'Tools to monetize your content', included: true },
          { name: 'Revenue Analytics', description: 'Detailed earnings & referral tracking', included: true },
          { name: 'Stream Integration', description: 'One-click Twitch/YouTube integration', included: true },
          { name: 'Custom Branding', description: 'Add your brand to in-game elements', included: true },
          { name: 'Premium Creator Support', description: 'Dedicated account manager', included: true },
          { name: '40% Revenue Share', description: 'Earn 40% from referrals + creator bonuses', included: true },
          { name: 'Creator Events', description: 'Exclusive creator tournaments & events', included: true },
          { name: 'Advanced Analytics', description: 'Player behavior & engagement analytics', included: true },
          { name: 'Sponsorship Tools', description: 'Branded cosmetics & sponsorship assets', included: true },
          { name: 'Priority Monetization', description: 'First access to new monetization features', included: true },
        ],
        maxMatchesPerDay: 999,
        maxReplayStorage: 50000,
        cosmecticsSlots: 1000,
        battlePassIncluded: true,
        revenueSharePercentage: 40,
        prioritySupport: true,
        adFree: true,
        earlyAccess: true,
        customTeamProfile: true,
        apiAccess: true,
        color: '#ef4444',
        icon: '🌟',
        badge: 'premium',
      },
    ];

    tierConfigs.forEach((config) => {
      this.tiers.set(config.id, config);
    });
  }

  // Subscription management
  createSubscription(
    userId: string,
    tier: SubscriptionTier,
    billingPeriod: BillingPeriod
  ): Subscription {
    const now = new Date();
    const renewalDate = new Date(now);

    if (billingPeriod === 'monthly') {
      renewalDate.setMonth(renewalDate.getMonth() + 1);
    } else if (billingPeriod === 'quarterly') {
      renewalDate.setMonth(renewalDate.getMonth() + 3);
    } else {
      renewalDate.setFullYear(renewalDate.getFullYear() + 1);
    }

    const tierConfig = this.tiers.get(tier)!;
    const amount =
      billingPeriod === 'monthly'
        ? tierConfig.monthlyPrice
        : billingPeriod === 'quarterly'
          ? tierConfig.quarterlyPrice
          : tierConfig.annualPrice;

    const subscription: Subscription = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      tier,
      currentTier: tier,
      billingPeriod,
      startDate: now,
      renewalDate,
      cancelDate: null,
      isActive: true,
      autoRenew: true,
      purchaseHistory: [
        {
          id: `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          tier,
          billingPeriod,
          amount,
          currency: 'USD',
          paymentMethod: 'card',
          status: 'completed',
          purchaseDate: now,
          transactionId: `txn_${Date.now()}`,
        },
      ],
      revenueShareEarnings: 0,
      referralBonus: 0,
    };

    this.subscriptions.set(userId, subscription);
    this.stats.activeSubscribers++;
    this.stats.tierDistribution[tier]++;
    this.stats.totalRevenue += amount;
    this.saveToStorage();

    return subscription;
  }

  getSubscription(userId: string): Subscription | null {
    return this.subscriptions.get(userId) || null;
  }

  upgradeTier(userId: string, newTier: SubscriptionTier): UpgradeDowngradeOption | null {
    const subscription = this.subscriptions.get(userId);
    if (!subscription) return null;

    const currentTierConfig = this.tiers.get(subscription.tier)!;
    const newTierConfig = this.tiers.get(newTier)!;

    if (newTier === subscription.tier) return null;

    const tierRank = { free: 0, starter: 1, pro: 2, elite: 3, premium: 4 };
    const currentRank = tierRank[subscription.tier];
    const newRank = tierRank[newTier];

    let proratedCost = 0;
    let creditAmount = 0;

    if (newRank > currentRank) {
      // Upgrade: pro-rata cost
      const daysRemaining = Math.ceil(
        (subscription.renewalDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      const currentMonthlyPrice =
        subscription.billingPeriod === 'monthly'
          ? currentTierConfig.monthlyPrice
          : subscription.billingPeriod === 'quarterly'
            ? currentTierConfig.quarterlyPrice / 3
            : currentTierConfig.annualPrice / 12;

      const newMonthlyPrice =
        subscription.billingPeriod === 'monthly'
          ? newTierConfig.monthlyPrice
          : subscription.billingPeriod === 'quarterly'
            ? newTierConfig.quarterlyPrice / 3
            : newTierConfig.annualPrice / 12;

      proratedCost = Math.max(0, ((newMonthlyPrice - currentMonthlyPrice) / 30) * daysRemaining);
    } else {
      // Downgrade: credit back to account
      const daysRemaining = Math.ceil(
        (subscription.renewalDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      const currentMonthlyPrice =
        subscription.billingPeriod === 'monthly'
          ? currentTierConfig.monthlyPrice
          : subscription.billingPeriod === 'quarterly'
            ? currentTierConfig.quarterlyPrice / 3
            : currentTierConfig.annualPrice / 12;

      const newMonthlyPrice =
        subscription.billingPeriod === 'monthly'
          ? newTierConfig.monthlyPrice
          : subscription.billingPeriod === 'quarterly'
            ? newTierConfig.quarterlyPrice / 3
            : newTierConfig.annualPrice / 12;

      creditAmount = Math.max(0, ((currentMonthlyPrice - newMonthlyPrice) / 30) * daysRemaining);
    }

    return {
      from: subscription.tier,
      to: newTier,
      proratedCost,
      creditAmount,
    };
  }

  confirmUpgrade(userId: string, newTier: SubscriptionTier): boolean {
    const subscription = this.subscriptions.get(userId);
    if (!subscription) return false;

    const option = this.upgradeTier(userId, newTier);
    if (!option) return false;

    const tierConfig = this.tiers.get(newTier)!;
    const currentRank = { free: 0, starter: 1, pro: 2, elite: 3, premium: 4 };
    const isUpgrade = currentRank[newTier] > currentRank[subscription.tier];

    if (isUpgrade) {
      this.stats.upgradedThisMonth++;
    } else {
      this.stats.downgradedThisMonth++;
    }

    subscription.tier = newTier;
    subscription.currentTier = newTier;

    const purchase: SubscriptionPurchase = {
      id: `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tier: newTier,
      billingPeriod: subscription.billingPeriod,
      amount: option.proratedCost > 0 ? option.proratedCost : option.creditAmount * -1,
      currency: 'USD',
      paymentMethod: 'card',
      status: 'completed',
      purchaseDate: new Date(),
      transactionId: `txn_${Date.now()}`,
    };

    subscription.purchaseHistory.push(purchase);
    this.stats.totalRevenue += purchase.amount;

    this.saveToStorage();
    return true;
  }

  cancelSubscription(userId: string): boolean {
    const subscription = this.subscriptions.get(userId);
    if (!subscription) return false;

    subscription.isActive = false;
    subscription.autoRenew = false;
    subscription.cancelDate = new Date();
    this.stats.activeSubscribers = Math.max(0, this.stats.activeSubscribers - 1);

    this.saveToStorage();
    return true;
  }

  reactivateSubscription(userId: string): boolean {
    const subscription = this.subscriptions.get(userId);
    if (!subscription || subscription.isActive) return false;

    subscription.isActive = true;
    subscription.autoRenew = true;
    subscription.cancelDate = null;
    const renewalDate = new Date();
    if (subscription.billingPeriod === 'monthly') {
      renewalDate.setMonth(renewalDate.getMonth() + 1);
    } else if (subscription.billingPeriod === 'quarterly') {
      renewalDate.setMonth(renewalDate.getMonth() + 3);
    } else {
      renewalDate.setFullYear(renewalDate.getFullYear() + 1);
    }
    subscription.renewalDate = renewalDate;

    this.stats.activeSubscribers++;
    this.saveToStorage();
    return true;
  }

  // Tier information
  getTierConfig(tier: SubscriptionTier): SubscriptionTierConfig | null {
    return this.tiers.get(tier) || null;
  }

  getAllTiers(): SubscriptionTierConfig[] {
    return Array.from(this.tiers.values());
  }

  getPrice(tier: SubscriptionTier, billingPeriod: BillingPeriod): number {
    const config = this.tiers.get(tier);
    if (!config) return 0;

    if (billingPeriod === 'monthly') {
      return config.monthlyPrice;
    } else if (billingPeriod === 'quarterly') {
      return config.quarterlyPrice;
    }
    return config.annualPrice;
  }

  // Revenue and analytics
  addRevenueShare(userId: string, amount: number): boolean {
    const subscription = this.subscriptions.get(userId);
    if (!subscription) return false;

    subscription.revenueShareEarnings += amount;
    this.saveToStorage();
    return true;
  }

  addReferralBonus(userId: string, bonus: number): boolean {
    const subscription = this.subscriptions.get(userId);
    if (!subscription) return false;

    subscription.referralBonus += bonus;
    this.saveToStorage();
    return true;
  }

  getPurchaseHistory(userId: string): SubscriptionPurchase[] {
    const subscription = this.subscriptions.get(userId);
    return subscription?.purchaseHistory || [];
  }

  getStats(): SubscriptionStats {
    this.stats.averageRevenuePerUser =
      this.stats.activeSubscribers > 0
        ? this.stats.totalRevenue / this.stats.activeSubscribers
        : 0;

    return { ...this.stats };
  }

  getTierStats(tier: SubscriptionTier): number {
    return this.stats.tierDistribution[tier] || 0;
  }

  // Storage
  private saveToStorage(): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const data = {
        subscriptions: Array.from(this.subscriptions.entries()),
        stats: this.stats,
      };
      localStorage.setItem('subscriptionSystem', JSON.stringify(data));
    }
  }

  private loadFromStorage(): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const data = localStorage.getItem('subscriptionSystem');
      if (data) {
        try {
          const parsed = JSON.parse(data);
          this.subscriptions = new Map(parsed.subscriptions);
          this.stats = parsed.stats;
        } catch (error) {
          console.error('Failed to load subscription data:', error);
        }
      }
    }
  }

  reset(): void {
    this.subscriptions.clear();
    this.stats = {
      activeSubscribers: 0,
      totalRevenue: 0,
      tierDistribution: {
        free: 0,
        starter: 0,
        pro: 0,
        elite: 0,
        premium: 0,
      },
      averageRevenuePerUser: 0,
      churnRate: 0,
      upgradedThisMonth: 0,
      downgradedThisMonth: 0,
    };
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('subscriptionSystem');
    }
  }
}

export default SubscriptionSystem.getInstance();
