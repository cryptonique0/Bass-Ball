// Shop System - In-game store with cosmetics
export type CosmeticType = 'kit' | 'ball' | 'pitch' | 'celebration' | 'goal_horn' | 'stadium' | 'player_card' | 'team_badge' | 'emote' | 'player_skin' | 'weather_effect' | 'ui_theme';
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
  items: Map<string, number>;
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

class ShopSystem {
  private static instance: ShopSystem;
  private items: Map<string, ShopItem>;
  private cart: Map<string, CartItem[]>;
  private inventory: Map<string, PlayerInventory>;
  private purchases: Purchase[];
  private stats: ShopStats;

  private constructor() {
    this.items = new Map();
    this.cart = new Map();
    this.inventory = new Map();
    this.purchases = [];
    this.stats = { totalSalesValue: 0, totalItemsSold: 0, averageOrderValue: 0, topSellingItems: [], seasonalSales: { spring: 0, summer: 0, fall: 0, winter: 0, event: 0, limited: 0 }, itemsSoldByType: { kit: 0, ball: 0, pitch: 0, celebration: 0, goal_horn: 0, stadium: 0, player_card: 0, team_badge: 0, emote: 0, player_skin: 0, weather_effect: 0, ui_theme: 0 }, totalPlayers: 0, spendingDistribution: {} };
    this.initializeShop();
    this.loadFromStorage();
  }

  static getInstance(): ShopSystem {
    if (!ShopSystem.instance) { ShopSystem.instance = new ShopSystem(); }
    return ShopSystem.instance;
  }

  private initializeShop(): void {
    const items: ShopItem[] = [
      { id: 'kit_classic', name: 'Classic Kit', description: 'Traditional kit', type: 'kit', rarity: 'common', price: 4.99, currencyType: 'USD', icon: '👕', preview: 'kit.webp', season: 'spring', isLimited: false, discountPercentage: 0, originalPrice: 4.99, stock: 999, maxPerPlayer: 5, requiresSubscription: false, tags: ['classic'], rating: 4.5, reviews: 234, createdAt: new Date(), updatedAt: new Date() },
      { id: 'kit_neon', name: 'Neon Kit', description: 'Bright neon kit', type: 'kit', rarity: 'rare', price: 9.99, currencyType: 'USD', icon: '⚡', preview: 'neon.webp', season: 'summer', isLimited: true, limitedUntil: new Date('2026-08-31'), discountPercentage: 10, originalPrice: 11.99, stock: 500, maxPerPlayer: 3, requiresSubscription: false, tags: ['neon'], rating: 4.8, reviews: 156, createdAt: new Date(), updatedAt: new Date() },
      { id: 'kit_diamond', name: 'Diamond Kit', description: 'Premium diamond kit', type: 'kit', rarity: 'legendary', price: 29.99, currencyType: 'USD', icon: '💎', preview: 'diamond.webp', season: 'event', isLimited: true, limitedUntil: new Date('2026-02-28'), discountPercentage: 0, originalPrice: 29.99, stock: 100, maxPerPlayer: 1, requiresSubscription: true, subscriptionTier: 'elite', tags: ['legendary'], rating: 4.9, reviews: 89, createdAt: new Date(), updatedAt: new Date() },
      { id: 'ball_classic', name: 'Classic Ball', description: 'Traditional ball', type: 'ball', rarity: 'common', price: 2.99, currencyType: 'USD', icon: '⚽', preview: 'ball.webp', season: 'spring', isLimited: false, discountPercentage: 0, originalPrice: 2.99, stock: 999, maxPerPlayer: 10, requiresSubscription: false, tags: ['classic'], rating: 4.3, reviews: 500, createdAt: new Date(), updatedAt: new Date() },
      { id: 'ball_glow', name: 'Glow Ball', description: 'Glowing ball', type: 'ball', rarity: 'rare', price: 6.99, currencyType: 'USD', icon: '🔆', preview: 'glow.webp', season: 'summer', isLimited: false, discountPercentage: 15, originalPrice: 8.99, stock: 200, maxPerPlayer: 3, requiresSubscription: false, tags: ['glow'], rating: 4.7, reviews: 234, createdAt: new Date(), updatedAt: new Date() },
      { id: 'cele_dance', name: 'Dance', description: 'Dance celebration', type: 'celebration', rarity: 'common', price: 1.99, currencyType: 'USD', icon: '🕺', preview: 'dance.webp', season: 'spring', isLimited: false, discountPercentage: 0, originalPrice: 1.99, stock: 999, maxPerPlayer: 999, requiresSubscription: false, tags: ['fun'], rating: 4.4, reviews: 600, createdAt: new Date(), updatedAt: new Date() },
      { id: 'stadium_night', name: 'Night Lights', description: 'Stadium night lighting', type: 'stadium', rarity: 'uncommon', price: 5.99, currencyType: 'USD', icon: '💡', preview: 'night.webp', season: 'winter', isLimited: false, discountPercentage: 0, originalPrice: 5.99, stock: 400, maxPerPlayer: 1, requiresSubscription: false, tags: ['night'], rating: 4.5, reviews: 234, createdAt: new Date(), updatedAt: new Date() },
      { id: 'theme_dark', name: 'Dark Theme', description: 'Dark interface', type: 'ui_theme', rarity: 'uncommon', price: 3.99, currencyType: 'USD', icon: '🌙', preview: 'dark.webp', season: 'spring', isLimited: false, discountPercentage: 0, originalPrice: 3.99, stock: 999, maxPerPlayer: 1, requiresSubscription: false, tags: ['dark'], rating: 4.8, reviews: 1200, createdAt: new Date(), updatedAt: new Date() },
    ];
    items.forEach(item => this.items.set(item.id, item));
  }

  getItem(itemId: string): ShopItem | null { return this.items.get(itemId) || null; }
  getAllItems(): ShopItem[] { return Array.from(this.items.values()); }
  getItemsByType(type: CosmeticType): ShopItem[] { return Array.from(this.items.values()).filter(item => item.type === type); }
  getItemsByRarity(rarity: Rarity): ShopItem[] { return Array.from(this.items.values()).filter(item => item.rarity === rarity); }
  getItemsBySeason(season: Season): ShopItem[] { return Array.from(this.items.values()).filter(item => item.season === season); }
  getLimitedItems(): ShopItem[] { return Array.from(this.items.values()).filter(item => item.isLimited); }

  searchItems(query: string): ShopItem[] {
    const q = query.toLowerCase();
    return Array.from(this.items.values()).filter(item => item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q) || item.tags.some(tag => tag.toLowerCase().includes(q)));
  }

  addToCart(userId: string, itemId: string, quantity: number = 1): boolean {
    const item = this.items.get(itemId);
    if (!item) return false;
    if (!this.cart.has(userId)) this.cart.set(userId, []);
    const cart = this.cart.get(userId)!;
    const existing = cart.find(c => c.itemId === itemId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      const discount = item.originalPrice > item.price ? item.price : 0;
      cart.push({ itemId, quantity, price: item.price, discount, addedAt: new Date() });
    }
    this.saveToStorage();
    return true;
  }

  removeFromCart(userId: string, itemId: string): boolean {
    const cart = this.cart.get(userId);
    if (!cart) return false;
    const index = cart.findIndex(c => c.itemId === itemId);
    if (index === -1) return false;
    cart.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  getCart(userId: string): CartItem[] { return this.cart.get(userId) || []; }

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

  purchaseFromCart(userId: string, paymentMethod: string): Purchase | null {
    const cart = this.getCart(userId);
    if (cart.length === 0) return null;
    const items = cart.map(c => this.items.get(c.itemId)).filter((item): item is ShopItem => item !== null);
    const { subtotal, discount, total } = this.getCartTotal(userId);
    const purchase: Purchase = { id: `purchase_${Date.now()}`, userId, items, totalPrice: subtotal, discount, finalPrice: total, currencyType: 'USD', paymentMethod, status: 'completed', purchaseDate: new Date(), transactionId: `txn_${Date.now()}` };
    const inventory = this.getOrCreateInventory(userId);
    items.forEach(item => { const current = inventory.items.get(item.id) || 0; inventory.items.set(item.id, current + 1); });
    inventory.purchaseHistory.push(purchase);
    inventory.totalSpent += total;
    this.purchases.push(purchase);
    this.stats.totalSalesValue += total;
    this.stats.totalItemsSold += items.length;
    this.clearCart(userId);
    this.saveToStorage();
    return purchase;
  }

  private getOrCreateInventory(userId: string): PlayerInventory {
    if (!this.inventory.has(userId)) {
      this.inventory.set(userId, { userId, items: new Map(), equippedItems: { kit: null, ball: null, pitch: null, celebration: null, goal_horn: null, stadium: null, player_card: null, team_badge: null, emote: null, player_skin: null, weather_effect: null, ui_theme: null }, favorites: [], purchaseHistory: [], totalSpent: 0, coinsBalance: 1000, gemsBalance: 50 });
    }
    return this.inventory.get(userId)!;
  }

  getInventory(userId: string): PlayerInventory { return this.getOrCreateInventory(userId); }

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

  getStats(): ShopStats {
    this.stats.averageOrderValue = this.purchases.length > 0 ? this.stats.totalSalesValue / this.purchases.length : 0;
    this.stats.totalPlayers = this.inventory.size;
    this.stats.topSellingItems = this.getTopSellingItems(10);
    return { ...this.stats };
  }

  private getTopSellingItems(limit: number = 10): ShopItem[] {
    const itemSales = new Map<string, number>();
    this.purchases.forEach(purchase => { purchase.items.forEach(item => { itemSales.set(item.id, (itemSales.get(item.id) || 0) + 1); }); });
    return Array.from(itemSales.entries()).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([itemId]) => this.items.get(itemId)!).filter((item): item is ShopItem => item !== null);
  }

  getPurchaseHistory(userId: string): Purchase[] { return this.getOrCreateInventory(userId).purchaseHistory; }
  getTotalSpent(userId: string): number { return this.getOrCreateInventory(userId).totalSpent; }

  private saveToStorage(): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const data = { cart: Array.from(this.cart.entries()), inventory: Array.from(this.inventory.entries()), purchases: this.purchases, stats: this.stats };
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
