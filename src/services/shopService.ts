/**
 * In-game shop and item system
 */

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type ItemType = 'boost' | 'cosmetic' | 'skill' | 'equipment' | 'consumable';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
  price: bigint;
  currency: string; // ETH, USDC, BASS token, etc.
  effect?: Record<string, any>;
  available: boolean;
  stock?: number; // null = infinite
}

export interface PlayerInventory {
  playerId: string;
  items: Map<string, { count: number; purchasedAt: number }>;
  balance: bigint;
}

export class ShopService {
  private shopItems: Map<string, ShopItem> = new Map();
  private inventories: Map<string, PlayerInventory> = new Map();
  private purchaseHistory: Map<string, Array<{
    itemId: string;
    quantity: number;
    cost: bigint;
    timestamp: number;
  }>> = new Map();

  /**
   * Add item to shop
   */
  addShopItem(item: ShopItem): void {
    this.shopItems.set(item.id, { ...item });
  }

  /**
   * Get shop item
   */
  getShopItem(itemId: string): ShopItem | undefined {
    return this.shopItems.get(itemId);
  }

  /**
   * Get all shop items
   */
  getAllShopItems(): ShopItem[] {
    return Array.from(this.shopItems.values()).filter((item) => item.available);
  }

  /**
   * Get items by type
   */
  getItemsByType(type: ItemType): ShopItem[] {
    return Array.from(this.shopItems.values()).filter(
      (item) => item.type === type && item.available
    );
  }

  /**
   * Get items by rarity
   */
  getItemsByRarity(rarity: ItemRarity): ShopItem[] {
    return Array.from(this.shopItems.values()).filter(
      (item) => item.rarity === rarity && item.available
    );
  }

  /**
   * Initialize player inventory
   */
  initializeInventory(playerId: string, initialBalance: bigint = BigInt(0)): PlayerInventory {
    const inventory: PlayerInventory = {
      playerId,
      items: new Map(),
      balance: initialBalance,
    };

    this.inventories.set(playerId, inventory);
    return inventory;
  }

  /**
   * Add balance to player
   */
  addBalance(playerId: string, amount: bigint): void {
    let inventory = this.inventories.get(playerId);
    if (!inventory) {
      inventory = this.initializeInventory(playerId);
    }

    inventory.balance += amount;
  }

  /**
   * Purchase item
   */
  purchaseItem(playerId: string, itemId: string, quantity: number = 1): boolean {
    const item = this.shopItems.get(itemId);
    if (!item || !item.available) return false;

    let inventory = this.inventories.get(playerId);
    if (!inventory) {
      inventory = this.initializeInventory(playerId);
    }

    const totalCost = item.price * BigInt(quantity);
    if (inventory.balance < totalCost) return false;

    if (item.stock !== undefined && item.stock !== null) {
      if (item.stock < quantity) return false;
      item.stock -= quantity;
    }

    inventory.balance -= totalCost;

    const existing = inventory.items.get(itemId);
    if (existing) {
      existing.count += quantity;
    } else {
      inventory.items.set(itemId, {
        count: quantity,
        purchasedAt: Date.now(),
      });
    }

    // Record purchase
    if (!this.purchaseHistory.has(playerId)) {
      this.purchaseHistory.set(playerId, []);
    }

    this.purchaseHistory.get(playerId)!.push({
      itemId,
      quantity,
      cost: totalCost,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Get player inventory
   */
  getInventory(playerId: string): PlayerInventory | undefined {
    return this.inventories.get(playerId);
  }

  /**
   * Get inventory item count
   */
  getItemCount(playerId: string, itemId: string): number {
    const inventory = this.inventories.get(playerId);
    return inventory?.items.get(itemId)?.count || 0;
  }

  /**
   * Use consumable item
   */
  useItem(playerId: string, itemId: string): boolean {
    const inventory = this.inventories.get(playerId);
    if (!inventory) return false;

    const item = inventory.items.get(itemId);
    if (!item || item.count === 0) return false;

    item.count--;
    if (item.count === 0) {
      inventory.items.delete(itemId);
    }

    return true;
  }

  /**
   * Get purchase history
   */
  getPurchaseHistory(playerId: string) {
    return this.purchaseHistory.get(playerId) || [];
  }

  /**
   * Get shop statistics
   */
  getStatistics() {
    let totalItems = 0;
    let totalAvailable = 0;

    this.shopItems.forEach((item) => {
      totalItems++;
      if (item.available) totalAvailable++;
    });

    return {
      totalItems,
      availableItems: totalAvailable,
      itemsByType: Array.from(
        new Set(Array.from(this.shopItems.values()).map((i) => i.type))
      ).length,
      players: this.inventories.size,
    };
  }
}
