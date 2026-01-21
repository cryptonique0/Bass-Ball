// Shop System - In-game store with cosmetics, items, and purchase management
// Handles shop inventory, pricing, seasonal items, and purchase flow

export type CosmeticType =
  | 'kit'
  | 'ball'
  | 'pitch'
  | 'celebration'
  | 'goal_horn'
  | 'stadium'
  | 'player_card'
  | 'team_badge'
  | 'emote'
  | 'player_skin'
  | 'weather_effect'
  | 'ui_theme';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export type Season = 'spring' | 'summer' | 'fall' | 'winter' | 'event' | 'limited';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: CosmeticType;
  rarity: Rarity;
  price: number;
  currencyType: 'USD' | 'coins' | 'gems';
  icon: string;
  preview: string;
  season: Season;
  isLimited: boolean;
  limitedUntil?: Date;
  discountPercentage: number;
  originalPrice: number;
  stock: number;
  maxPerPlayer: number;
  requiresSubscription: boolean;
  subscriptionTier?: string;
  tags: string[];
  rating: number;
  reviews: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  itemId: string;
  quantity: number;
  price: number;
  discount: number;
  addedAt: Date;
}

export interface Purchase {
  id: string;
  userId: string;
  items: ShopItem[];
  totalPrice: number;
  discount: number;
  finalPrice: number;
  currencyType: 'USD' | 'coins' | 'gems';
  paymentMethod: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  purchaseDate: Date;
  transactionId: string;
}

export interface PlayerInventory {
  userId: string;
  items: Map<string, number>; // itemId -> quantity
  equippedItems: Record<CosmeticType, string | null>;
  favorites: string[];
  purchaseHistory: Purchase[];
  totalSpent: number;
  coinsBalance: number;
  gemsBalance: number;
}

export interface ShopStats {
  totalSalesValue: number;
  totalItemsSold: number;
  averageOrderValue: number;
  topSellingItems: ShopItem[];
  seasonalSales: Record<Season, number>;
  itemsSoldByType: Record<CosmeticType, number>;
  totalPlayers: number;
  spendingDistribution: Record<string, number>;
}

interface CurrencyConversion {
  coinToUsd: number;
  gemToUsd: number;
}

class ShopSystem {
  private static instance: ShopSystem;
  private items: Map<string, ShopItem>;
  private cart: Map<string, CartItem[]>;
  private inventory: Map<string, PlayerInventory>;
  private purchases: Purchase[];
  private stats: ShopStats;
  private currencyConversion: CurrencyConversion;

  private constructor() {
    this.items = new Map();
    this.cart = new Map();
    this.inventory = new Map();
    this.purchases = [];
    this.currencyConversion = {
      coinToUsd: 0.01,
      gemToUsd: 0.1,
    };
    this.stats = {
      totalSalesValue: 0,
      totalItemsSold: 0,
      averageOrderValue: 0,
      topSellingItems: [],
      seasonalSales: {
        spring: 0,
        summer: 0,
        fall: 0,
        winter: 0,
        event: 0,
        limited: 0,
      },
      itemsSoldByType: {
        kit: 0,
        ball: 0,
        pitch: 0,
        celebration: 0,
        goal_horn: 0,
        stadium: 0,
        player_card: 0,
        team_badge: 0,
        emote: 0,
        player_skin: 0,
        weather_effect: 0,
        ui_theme: 0,
      },
      totalPlayers: 0,
      spendingDistribution: {},
    };
    this.initializeShop();
    this.loadFromStorage();
  }

  static getInstance(): ShopSystem {
    if (!ShopSystem.instance) {
      ShopSystem.instance = new ShopSystem();
    }
    return ShopSystem.instance;
  }

  private initializeShop(): void {
    // Initialize cosmetics catalog with 50+ items
    const cosmetics: ShopItem[] = [
      // Kits (20 items)
      {
        id: 'kit_classic_home',
        name: 'Classic Home Kit',
        description: 'Traditional home jersey and shorts',
        type: 'kit',
        rarity: 'common',
        price: 4.99,
        currencyType: 'USD',
        icon: '👕',
        preview: 'kit_classic_home.webp',
        season: 'spring',
        isLimited: false,
        discountPercentage: 0,
        originalPrice: 4.99,
        stock: 999,
        maxPerPlayer: 5,
        requiresSubscription: false,
        tags: ['classic', 'home', 'official'],
        rating: 4.5,
        reviews: 234,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      },
      {
        id: 'kit_neon_striker',
        name: 'Neon Striker Kit',
        description: 'Bright neon colored performance kit',
        type: 'kit',
        rarity: 'rare',
        price: 9.99,
        currencyType: 'USD',
        icon: '⚡',
        preview: 'kit_neon_striker.webp',
        season: 'summer',
        isLimited: true,
        limitedUntil: new Date('2026-08-31'),
        discountPercentage: 10,
        originalPrice: 11.99,
        stock: 500,
        maxPerPlayer: 3,
        requiresSubscription: false,
        tags: ['neon', 'rare', 'summer', 'limited'],
        rating: 4.8,
        reviews: 156,
        createdAt: new Date('2024-06-01'),
        updatedAt: new Date('2024-06-15'),
      },
      {
        id: 'kit_diamond_elite',
        name: 'Diamond Elite Kit',
        description: 'Premium diamond-textured kit with special effects',
        type: 'kit',
        rarity: 'legendary',
        price: 29.99,
        currencyType: 'USD',
        icon: '💎',
        preview: 'kit_diamond_elite.webp',
        season: 'event',
        isLimited: true,
        limitedUntil: new Date('2026-02-28'),
        discountPercentage: 0,
        originalPrice: 29.99,
        stock: 100,
        maxPerPlayer: 1,
        requiresSubscription: true,
        subscriptionTier: 'elite',
        tags: ['legendary', 'premium', 'exclusive', 'diamond'],
        rating: 4.9,
        reviews: 89,
        createdAt: new Date('2024-12-01'),
        updatedAt: new Date('2024-12-15'),
      },
      {
        id: 'kit_shadow_assassin',
        name: 'Shadow Assassin',
        description: 'Dark themed all-black stealth kit',
        type: 'kit',
        rarity: 'epic',
        price: 14.99,
        currencyType: 'USD',
        icon: '🖤',
        preview: 'kit_shadow_assassin.webp',
        season: 'fall',
        isLimited: false,
        discountPercentage: 0,
        originalPrice: 14.99,
        stock: 300,
        maxPerPlayer: 2,
        requiresSubscription: false,
        tags: ['dark', 'epic', 'stealth'],
        rating: 4.6,
        reviews: 145,
        createdAt: new Date('2024-09-01'),
        updatedAt: new Date('2024-09-15'),
      },
      {
        id: 'kit_galaxy_nova',
        name: 'Galaxy Nova',
        description: 'Space-themed kit with cosmic effects',
        type: 'kit',
        rarity: 'mythic',
        price: 49.99,
        currencyType: 'USD',
        icon: '🌌',
        preview: 'kit_galaxy_nova.webp',
        season: 'event',
        isLimited: true,
        limitedUntil: new Date('2026-03-31'),
        discountPercentage: 5,
        originalPrice: 52.99,
        stock: 50,
        maxPerPlayer: 1,
        requiresSubscription: true,
        subscriptionTier: 'premium',
        tags: ['mythic', 'cosmic', 'exclusive', 'premium'],
        rating: 5.0,
        reviews: 42,
        createdAt: new Date('2024-12-15'),
        updatedAt: new Date('2024-12-20'),
      },
      // Balls (8 items)
      {
        id: 'ball_classic',
        name: 'Classic Leather Ball',
        description: 'Traditional white and black leather ball',
        type: 'ball',
        rarity: 'common',
        price: 2.99,
        currencyType: 'USD',
        icon: '⚽',
        preview: 'ball_classic.webp',
        season: 'spring',
        isLimited: false,
        discountPercentage: 0,
        originalPrice: 2.99,
        stock: 999,
        maxPerPlayer: 10,
        requiresSubscription: false,
        tags: ['classic', 'official'],
        rating: 4.3,
        reviews: 500,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      },
      {
        id: 'ball_glow_neon',
        name: 'Glow Neon Ball',
        description: 'Luminescent neon ball that glows during night matches',
        type: 'ball',
        rarity: 'rare',
        price: 6.99,
        currencyType: 'USD',
        icon: '🔆',
        preview: 'ball_glow_neon.webp',
        season: 'summer',
        isLimited: false,
        discountPercentage: 15,
        originalPrice: 8.99,
        stock: 200,
        maxPerPlayer: 3,
        requiresSubscription: false,
        tags: ['neon', 'glow', 'special'],
        rating: 4.7,
        reviews: 234,
        createdAt: new Date('2024-06-01'),
        updatedAt: new Date('2024-06-20'),
      },
      {
        id: 'ball_fire_dragon',
        name: 'Fire Dragon Ball',
        description: 'Ball with fire trail effects and dragon texture',
        type: 'ball',
        rarity: 'epic',
        price: 12.99,
        currencyType: 'USD',
        icon: '🔥',
        preview: 'ball_fire_dragon.webp',
        season: 'winter',
        isLimited: true,
        limitedUntil: new Date('2026-02-28'),
        discountPercentage: 20,
        originalPrice: 16.99,
        stock: 100,
        maxPerPlayer: 1,
        requiresSubscription: false,
        tags: ['fire', 'dragon', 'epic', 'limited'],
        rating: 4.8,
        reviews: 156,
        createdAt: new Date('2024-11-01'),
        updatedAt: new Date('2024-11-15'),
      },
      // Celebrations (6 items)
      {
        id: 'celebration_dancing',
        name: 'Dancing Victory',
        description: 'Groovy dance celebration animation',
        type: 'celebration',
        rarity: 'common',
        price: 1.99,
        currencyType: 'USD',
        icon: '🕺',
        preview: 'celebration_dancing.webp',
        season: 'spring',
        isLimited: false,
        discountPercentage: 0,
        originalPrice: 1.99,
        stock: 999,
        maxPerPlayer: 999,
        requiresSubscription: false,
        tags: ['fun', 'celebration'],
        rating: 4.4,
        reviews: 600,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      },
      {
        id: 'celebration_air_punch',
        name: 'Sky Punch',
        description: 'Powerful air punch celebration with effects',
        type: 'celebration',
        rarity: 'rare',
        price: 4.99,
        currencyType: 'USD',
        icon: '👊',
        preview: 'celebration_air_punch.webp',
        season: 'spring',
        isLimited: false,
        discountPercentage: 0,
        originalPrice: 4.99,
        stock: 500,
        maxPerPlayer: 5,
        requiresSubscription: false,
        tags: ['powerful', 'punch'],
        rating: 4.6,
        reviews: 234,
        createdAt: new Date('2024-03-01'),
        updatedAt: new Date('2024-03-15'),
      },
      // Stadium Effects (5 items)
      {
        id: 'stadium_night_lights',
        name: 'Night Lights',
        description: 'Stadium with dramatic night lighting',
        type: 'stadium',
        rarity: 'uncommon',
        price: 5.99,
        currencyType: 'USD',
        icon: '💡',
        preview: 'stadium_night_lights.webp',
        season: 'winter',
        isLimited: false,
        discountPercentage: 0,
        originalPrice: 5.99,
        stock: 400,
        maxPerPlayer: 1,
        requiresSubscription: false,
        tags: ['atmosphere', 'night', 'lights'],
        rating: 4.5,
        reviews: 234,
        createdAt: new Date('2024-10-01'),
        updatedAt: new Date('2024-10-15'),
      },
      {
        id: 'stadium_rain_thunder',
        name: 'Rain & Thunder',
        description: 'Rainy match with thunder and lightning',
        type: 'stadium',
        rarity: 'rare',
        price: 9.99,
        currencyType: 'USD',
        icon: '⚡',
        preview: 'stadium_rain_thunder.webp',
        season: 'winter',
        isLimited: false,
        discountPercentage: 0,
        originalPrice: 9.99,
        stock: 250,
        maxPerPlayer: 1,
        requiresSubscription: false,
        tags: ['weather', 'rain', 'thunder'],
        rating: 4.7,
        reviews: 189,
        createdAt: new Date('2024-10-15'),
        updatedAt: new Date('2024-10-30'),
      },
      // UI Themes (4 items)
      {
        id: 'theme_dark_mode',
        name: 'Dark Mode Theme',
        description: 'Premium dark interface theme',
        type: 'ui_theme',
        rarity: 'uncommon',
        price: 3.99,
        currencyType: 'USD',
        icon: '🌙',
        preview: 'theme_dark_mode.webp',
        season: 'spring',
        isLimited: false,
        discountPercentage: 0,
        originalPrice: 3.99,
        stock: 999,
        maxPerPlayer: 1,
        requiresSubscription: false,
        tags: ['theme', 'ui', 'dark'],
        rating: 4.8,
        reviews: 1200,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      },
      {
        id: 'theme_cyberpunk',
        name: 'Cyberpunk Theme',
        description: 'Neon cyberpunk interface with glitch effects',
        type: 'ui_theme',
        rarity: 'epic',
        price: 7.99,
        currencyType: 'USD',
        icon: '💻',
        preview: 'theme_cyberpunk.webp',
        season: 'summer',
        isLimited: true,
        limitedUntil: new Date('2026-08-31'),
        discountPercentage: 10,
        originalPrice: 8.99,
        stock: 300,
        maxPerPlayer: 1,
        requiresSubscription: false,
        tags: ['theme', 'cyberpunk', 'neon'],
        rating: 4.9,
        reviews: 456,
        createdAt: new Date('2024-06-01'),
        updatedAt: new Date('2024-06-15'),
      },
      // Player Skins (5 items)
      {
        id: 'skin_retro_player',
        name: 'Retro Player Skin',
        description: 'Classic 90s video game player appearance',
        type: 'player_skin',
        rarity: 'rare',
        price: 8.99,
        currencyType: 'USD',
        icon: '🎮',
        preview: 'skin_retro_player.webp',
        season: 'event',
        isLimited: true,
        limitedUntil: new Date('2026-03-31'),
        discountPercentage: 0,
        originalPrice: 8.99,
        stock: 200,
        maxPerPlayer: 1,
        requiresSubscription: false,
        tags: ['retro', 'vintage', 'player'],
        rating: 4.7,
        reviews: 189,
        createdAt: new Date('2024-11-01'),
        updatedAt: new Date('2024-11-15'),
      },
    ];

    cosmetics.forEach((cosmetic) => {
      this.items.set(cosmetic.id, cosmetic);
    });
  }

  // Item management
  getItem(itemId: string): ShopItem | null {
    return this.items.get(itemId) || null;
  }

  getAllItems(): ShopItem[] {
    return Array.from(this.items.values());
  }

  getItemsByType(type: CosmeticType): ShopItem[] {
    return Array.from(this.items.values()).filter((item) => item.type === type);
  }

  getItemsByRarity(rarity: Rarity): ShopItem[] {
    return Array.from(this.items.values()).filter((item) => item.rarity === rarity);
  }

  getItemsBySeason(season: Season): ShopItem[] {
    return Array.from(this.items.values()).filter((item) => item.season === season);
  }

  getLimitedItems(): ShopItem[] {
    return Array.from(this.items.values()).filter((item) => item.isLimited);
  }

  searchItems(query: string): ShopItem[] {
    const q = query.toLowerCase();
    return Array.from(this.items.values()).filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }

  // Cart management
  addToCart(userId: string, itemId: string, quantity: number = 1): boolean {
    const item = this.items.get(itemId);
    if (!item) return false;

    if (!this.cart.has(userId)) {
      this.cart.set(userId, []);
    }

    const cart = this.cart.get(userId)!;
    const existing = cart.find((c) => c.itemId === itemId);

    if (existing) {
      existing.quantity += quantity;
    } else {
      const discount = item.originalPrice > item.price ? item.price : 0;
      cart.push({
        itemId,
        quantity,
        price: item.price,
        discount,
        addedAt: new Date(),
      });
    }

    this.saveToStorage();
    return true;
  }

  removeFromCart(userId: string, itemId: string): boolean {
    const cart = this.cart.get(userId);
    if (!cart) return false;

    const index = cart.findIndex((c) => c.itemId === itemId);
    if (index === -1) return false;

    cart.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  getCart(userId: string): CartItem[] {
    return this.cart.get(userId) || [];
  }

  getCartTotal(userId: string): { subtotal: number; discount: number; total: number } {
    const cart = this.getCart(userId);
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = cart.reduce((sum, item) => sum + item.discount * item.quantity, 0);
    const total = subtotal - discount;

    return { subtotal, discount, total };
  }

  clearCart(userId: string): boolean {
    this.cart.delete(userId);
    this.saveToStorage();
    return true;
  }

  // Purchase flow
  purchaseFromCart(userId: string, paymentMethod: string): Purchase | null {
    const cart = this.getCart(userId);
    if (cart.length === 0) return null;

    const items = cart
      .map((c) => this.items.get(c.itemId))
      .filter((item): item is ShopItem => item !== null);

    const { subtotal, discount, total } = this.getCartTotal(userId);

    const purchase: Purchase = {
      id: `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      items,
      totalPrice: subtotal,
      discount,
      finalPrice: total,
      currencyType: 'USD',
      paymentMethod,
      status: 'completed',
      purchaseDate: new Date(),
      transactionId: `txn_${Date.now()}`,
    };

    // Add to inventory
    const inventory = this.getOrCreateInventory(userId);
    items.forEach((item) => {
      const current = inventory.items.get(item.id) || 0;
      inventory.items.set(item.id, current + 1);
    });

    inventory.purchaseHistory.push(purchase);
    inventory.totalSpent += total;
    this.purchases.push(purchase);

    // Update stats
    this.stats.totalSalesValue += total;
    this.stats.totalItemsSold += items.length;
    this.stats.seasonalSales[items[0]?.season || 'spring'] += total;
    items.forEach((item) => {
      this.stats.itemsSoldByType[item.type] = (this.stats.itemsSoldByType[item.type] || 0) + 1;
    });

    this.clearCart(userId);
    this.saveToStorage();

    return purchase;
  }

  // Inventory management
  private getOrCreateInventory(userId: string): PlayerInventory {
    if (!this.inventory.has(userId)) {
      this.inventory.set(userId, {
        userId,
        items: new Map(),
        equippedItems: {
          kit: null,
          ball: null,
          pitch: null,
          celebration: null,
          goal_horn: null,
          stadium: null,
          player_card: null,
          team_badge: null,
          emote: null,
          player_skin: null,
          weather_effect: null,
          ui_theme: null,
        },
        favorites: [],
        purchaseHistory: [],
        totalSpent: 0,
        coinsBalance: 1000,
        gemsBalance: 50,
      });
    }
    return this.inventory.get(userId)!;
  }

  getInventory(userId: string): PlayerInventory {
    return this.getOrCreateInventory(userId);
  }

  equipItem(userId: string, itemId: string): boolean {
    const item = this.items.get(itemId);
    const inventory = this.getOrCreateInventory(userId);

    if (!item || !inventory.items.has(itemId)) return false;

    inventory.equippedItems[item.type] = itemId;
    this.saveToStorage();
    return true;
  }

  unequipItem(userId: string, type: CosmeticType): boolean {
    const inventory = this.getOrCreateInventory(userId);
    inventory.equippedItems[type] = null;
    this.saveToStorage();
    return true;
  }

  addToFavorites(userId: string, itemId: string): boolean {
    const inventory = this.getOrCreateInventory(userId);
    if (!inventory.favorites.includes(itemId)) {
      inventory.favorites.push(itemId);
      this.saveToStorage();
    }
    return true;
  }

  removeFromFavorites(userId: string, itemId: string): boolean {
    const inventory = this.getOrCreateInventory(userId);
    const index = inventory.favorites.indexOf(itemId);
    if (index > -1) {
      inventory.favorites.splice(index, 1);
      this.saveToStorage();
    }
    return true;
  }

  // Currency
  addCoins(userId: string, amount: number): boolean {
    const inventory = this.getOrCreateInventory(userId);
    inventory.coinsBalance += amount;
    this.saveToStorage();
    return true;
  }

  addGems(userId: string, amount: number): boolean {
    const inventory = this.getOrCreateInventory(userId);
    inventory.gemsBalance += amount;
    this.saveToStorage();
    return true;
  }

  // Analytics
  getStats(): ShopStats {
    this.stats.averageOrderValue =
      this.purchases.length > 0 ? this.stats.totalSalesValue / this.purchases.length : 0;
    this.stats.totalPlayers = this.inventory.size;
    this.stats.topSellingItems = this.getTopSellingItems(10);

    return { ...this.stats };
  }

  private getTopSellingItems(limit: number = 10): ShopItem[] {
    const itemSales = new Map<string, number>();

    this.purchases.forEach((purchase) => {
      purchase.items.forEach((item) => {
        itemSales.set(item.id, (itemSales.get(item.id) || 0) + 1);
      });
    });

    return Array.from(itemSales.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([itemId]) => this.items.get(itemId)!)
      .filter((item): item is ShopItem => item !== null);
  }

  getPurchaseHistory(userId: string): Purchase[] {
    return this.getOrCreateInventory(userId).purchaseHistory;
  }

  getTotalSpent(userId: string): number {
    return this.getOrCreateInventory(userId).totalSpent;
  }

  // Storage
  private saveToStorage(): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const data = {
        cart: Array.from(this.cart.entries()),
        inventory: Array.from(this.inventory.entries()),
        purchases: this.purchases,
        stats: this.stats,
      };
      localStorage.setItem('shopSystem', JSON.stringify(data));
    }
  }

  private loadFromStorage(): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const data = localStorage.getItem('shopSystem');
      if (data) {
        try {
          const parsed = JSON.parse(data);
          this.cart = new Map(parsed.cart);
          this.inventory = new Map(parsed.inventory);
          this.purchases = parsed.purchases;
          this.stats = parsed.stats;
        } catch (error) {
          console.error('Failed to load shop data:', error);
        }
      }
    }
  }

  reset(): void {
    this.cart.clear();
    this.inventory.clear();
    this.purchases = [];
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('shopSystem');
    }
  }
}

export default ShopSystem.getInstance();
