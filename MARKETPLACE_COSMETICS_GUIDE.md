# Marketplace, Cosmetics & Burn System Guide

Complete system for NFT trading, cosmetics management, and currency sinks.

---

## 📊 System Overview

### Three Core Managers

1. **MarketplaceManager** - Buy/sell NFTs
2. **CosmeticsManager** - Cosmetics and upgrades  
3. **BurnSinkManager** - Currency removal mechanics

---

## 🛒 Marketplace System

### Quick Start

```typescript
import { MarketplaceManager, PlayerNFT } from '@/lib/marketplaceSystem';

const marketplace = MarketplaceManager.getInstance();

// Create a listing
const nft: PlayerNFT = {
  nftId: 'nft_001',
  playerId: 'player_1',
  playerName: 'Elite Striker',
  rarity: 'epic',
  attributes: { power: 85, speed: 90, defense: 70, special: 80 },
  verified: true,
};

const listing = marketplace.createListing(
  nft,
  'player_1',
  'Player Name',
  5000,        // Price
  'soft',      // Currency type
  30           // Duration in days
);
```

### Create Listing

```typescript
marketplace.createListing(
  nft: PlayerNFT,
  seller: string,
  sellerName: string,
  price: number,
  currencyType: 'soft' | 'hard',
  durationDays: number = 30
): Listing
```

**Returns**: Listing object with listingId, status, timestamps, etc.

**Constraints**:
- Price: Between minPrice and maxPrice (default 1-1,000,000)
- Duration: 1-30 days
- Status: Always starts as 'active'

### Purchase Listing

```typescript
const result = marketplace.purchaseListing(
  'listing_001',
  'player_2',
  'Buyer Name',
  5000         // Actual price paid
);

// Result: { success: true, listing, fee, total }
// fee: Platform fee (2.5% default)
// total: Amount seller receives
```

**Rules**:
- Listing must be active and not expired
- Platform fee deducted automatically
- Seller receives fee-deducted amount
- Transaction recorded in price history

### Cancel Listing

```typescript
const cancelled = marketplace.cancelListing(
  'listing_001',
  'player_1',
  'Changing price'
);
```

**Rules**:
- Only seller can cancel
- Must be active status
- Cancellation reason logged

### Query Listings

```typescript
// Get all active listings
marketplace.getActiveListings(100);

// Filter listings
marketplace.filterListings(
  currencyType: 'soft' | 'hard',
  minPrice: 100,
  maxPrice: 10000,
  rarity: 'epic',
  limit: 50
);

// Search listings
marketplace.searchListings('Elite Striker');

// Get trending
marketplace.getTrendingListings(10);

// Get seller's listings
marketplace.getSellerListings('player_1');
```

### Price History

```typescript
// Get price history for NFT
const history = marketplace.getPriceHistory('nft_001');

// History includes:
// - All previous sales
// - Floor price (lowest)
// - Average price
// - Last sale price & date
```

### Statistics

```typescript
const stats = marketplace.getMarketplaceStats();

// Returns:
// {
//   totalVolume: 500000,        // All time sales
//   totalTransactions: 150,     // Number of sales
//   activeListing: 42,          // Currently for sale
//   uniquePlayers: 28,          // Unique sellers
//   avgPrice: 3333,             // Average listing price
//   floorPrice: 1500            // Minimum current price
// }
```

### Configuration

```typescript
// Get config
const config = marketplace.getConfig();

// Set config
marketplace.setConfig({
  listingFeePercentage: 3.0,      // 3% platform fee
  maxListingDuration: 60 * 24 * 60 * 60 * 1000,  // 60 days
  minPrice: 10,
  maxPrice: 100000,
  requiresVerification: true
});
```

---

## 💅 Cosmetics & Upgrades System

### Cosmetic Types

- **skin** - Player appearance
- **effect** - Visual effects
- **accessory** - Equipment/items
- **emote** - Expressions
- **banner** - Profile decorations

### Cosmetic Rarities

| Rarity | Multiplier | Cost |
|--------|-----------|------|
| Common | 1.0x | Budget |
| Uncommon | 1.5x | Affordable |
| Rare | 2.5x | Moderate |
| Epic | 5.0x | Expensive |
| Legendary | 10.0x | Premium |

### Add Cosmetic

```typescript
import { CosmeticsManager } from '@/lib/cosmeticsSystem';

const cosmetics = CosmeticsManager.getInstance();

cosmetics.addCosmetic({
  cosmeticId: 'skin_gold',
  name: 'Gold Champion',
  description: 'Exclusive gold-trimmed uniform',
  type: 'skin',
  rarity: 'epic',
  cost: 5000,
  currencyType: 'soft',
  unlockRequirement: {
    type: 'level',
    value: 20,
    description: 'Reach level 20'
  },
  enabled: true
});
```

### Unlock Cosmetic

```typescript
const result = cosmetics.unlockCosmetic(
  'player_1',
  'skin_gold'
);

// Result: { success: true, cosmetic, cost }
```

**Rules**:
- Can't unlock twice
- Cost deducted from player
- Timestamp recorded

### Equip Cosmetic

```typescript
// Equip cosmetic
cosmetics.equipCosmetic('player_1', 'skin_gold');

// Only one cosmetic per type can be equipped
// Automatically unequips other skins

// Unequip
cosmetics.unequipCosmetic('player_1', 'skin_gold');
```

### Get Cosmetics

```typescript
// All available cosmetics
cosmetics.getCosmetics();

// Filter by type
cosmetics.getCosmetics('skin');
cosmetics.getCosmetics('effect', 'epic');

// Get player's cosmetics
cosmetics.getPlayerCosmetics('player_1');

// Only equipped
cosmetics.getPlayerCosmetics('player_1', true);
```

### Upgrades System

Upgrades improve player attributes permanently.

```typescript
cosmetics.addUpgrade({
  upgradeId: 'upgrade_power_1',
  name: 'Power Boost I',
  description: 'Increase power by 10%',
  type: 'power',
  level: 1,
  cost: 500,
  currencyType: 'soft',
  effect: 0.1,           // 10% boost
  maxLevel: 5,           // Can level up to 5
  enabled: true
});

// Unlock upgrade
cosmetics.unlockUpgrade('player_1', 'upgrade_power_1');

// Level up upgrade
const result = cosmetics.levelUpUpgrade('player_1', 'upgrade_power_1');
// Cost scales with level (10% increase per level)
```

### Upgrade Types

- **power** - Attack/damage
- **speed** - Movement speed
- **defense** - Durability
- **special** - Special ability

---

## 🔥 Burn & Sink System

### Burn Mechanics

Remove NFTs or currency from the game for rewards.

#### Burn NFT

```typescript
import { BurnSinkManager } from '@/lib/burnSystem';

const burnMgr = BurnSinkManager.getInstance();

const result = burnMgr.burnNFT(
  'player_1',
  'Player Name',
  'nft_duplicate_123',
  'nft_evolution',  // mechanic ID
  'Duplicate NFT'
);

// Result: { success: true, burnId, reward: 100, rewardType: 'soft' }
```

#### Burn Soft Currency

```typescript
const result = burnMgr.burnSoftCurrency(
  'player_1',
  'Player Name',
  500,              // Amount
  'cosmetic_upgrade',  // mechanic ID
  'Cosmetic upgrade'
);

// Reward given automatically
// Daily limits enforced
```

#### Burn Hard Currency

```typescript
const result = burnMgr.burnHardCurrency(
  'player_1',
  'Player Name',
  1.5,              // Amount (hard currency)
  'hard_currency_sink',
  'Premium burn'
);
```

### Sink Mechanics

Lock currency temporarily or permanently.

#### Create Sink

```typescript
const sink = burnMgr.sinkCurrency(
  'player_1',
  'Player Name',
  1000,
  'soft',
  'tournament_escrow',  // mechanic
  { tournamentId: 'tournament_1' }
);

// Locks funds until released
// Can't be spent during lock
```

**Sink Types**:
- **temp_lock** - Released after duration
- **permanent_sink** - Gone forever
- **staking** - Locked for rewards

#### Release Sink

```typescript
const released = burnMgr.releaseSinkedCurrency('sink_...');

// Can only release if lock duration passed
// Returns amount that was sinked
```

### Default Mechanics

**Burn Mechanics**:
- `cosmetic_upgrade` - Burn soft for cosmetics
- `nft_evolution` - Burn NFTs for power
- `hard_currency_sink` - Burn hard for exclusives

**Sink Mechanics**:
- `tournament_escrow` - Lock during tournaments
- `battle_fee_sink` - Small % removed per battle
- `staking_lock` - Lock for staking rewards

### Custom Mechanics

```typescript
// Add burn mechanic
burnMgr.addBurnMechanic({
  mechanicId: 'special_event',
  name: 'Event Bonus Burn',
  description: 'Burn for event rewards',
  enabled: true,
  burnType: 'soft_currency',
  reward: 200,
  rewardType: 'hard',
  dailyLimit: 10000
});

// Add sink mechanic
burnMgr.addSinkMechanic({
  mechanicId: 'event_lock',
  name: 'Event Lock',
  description: 'Lock for event',
  enabled: true,
  sinkType: 'temp_lock',
  lockDuration: 7 * 24 * 60 * 60 * 1000,  // 7 days
  purpose: 'special_event'
});
```

### Query Burn/Sink

```typescript
// Get burn history
burnMgr.getBurnHistory('player_1', 50);

// Get sink history
burnMgr.getSinkHistory('player_1', 50);

// Get active (unreleased) sinks
burnMgr.getActiveSinks('player_1');

// Get statistics
const stats = burnMgr.getStats();
// {
//   totalNFTsBurned: 50,
//   totalSoftBurned: 10000,
//   totalHardBurned: 25.5,
//   totalRewardsGiven: 5000,
//   totalSinked: 100000,
//   burnRate: 15.2
// }

// Get total sinked amount
burnMgr.getTotalSinked('soft');  // Only soft
burnMgr.getTotalSinked();         // All currency
```

---

## 🎮 React Components

### Marketplace UI

```typescript
import { MarketplaceUI } from '@/components/MarketplaceUI';

export default function Page() {
  return <MarketplaceUI />;
}
```

**Features**:
- Browse marketplace with filters
- View active listings
- Purchase NFTs
- View your listings
- Marketplace statistics
- Real-time updates
- Search and filtering

**Tabs**:
1. **Browse** - All listings with search/filter
2. **My Listings** - Your active listings
3. **Statistics** - Volume, transactions, etc.

### Cosmetics Shop

```typescript
import { CosmeticsShop } from '@/components/CosmeticsShop';

export default function Page() {
  return <CosmeticsShop />;
}
```

**Features**:
- Browse cosmetics by type/rarity
- Purchase cosmetics and upgrades
- Equip cosmetics
- View your collection
- Real-time balance updates

**Tabs**:
1. **Cosmetics Shop** - Buy cosmetics
2. **Upgrades** - Buy player upgrades
3. **My Collection** - Manage your items

---

## 📊 Data Models

### Listing

```typescript
interface Listing {
  listingId: string;
  nftId: string;
  nft: PlayerNFT;
  seller: string;
  sellerName: string;
  price: number;
  currencyType: 'soft' | 'hard';
  status: 'active' | 'sold' | 'cancelled';
  createdAt: number;
  expiresAt?: number;
  soldTo?: string;
  soldAt?: number;
  soldPrice?: number;
  cancelled?: boolean;
}
```

### PriceHistory

```typescript
interface PriceHistory {
  nftId: string;
  prices: Array<{
    price: number;
    currencyType: 'soft' | 'hard';
    soldAt: number;
    seller: string;
    buyer: string;
  }>;
  floorPrice: number;
  averagePrice: number;
  lastSalePrice: number;
  lastSaleAt: number;
}
```

### Cosmetic

```typescript
interface Cosmetic {
  cosmeticId: string;
  name: string;
  description: string;
  type: 'skin' | 'effect' | 'accessory' | 'emote' | 'banner';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  cost: number;
  currencyType: 'soft' | 'hard';
  unlockRequirement?: {
    type: 'level' | 'achievement' | 'token' | 'none';
    value?: number;
  };
}
```

### BurnRecord

```typescript
interface BurnRecord {
  burnId: string;
  burnType: 'nft' | 'soft_currency' | 'hard_currency';
  entityId: string;
  entityName: string;
  nftId?: string;
  amount?: number;
  reward?: number;
  rewardType?: 'soft' | 'hard';
  timestamp: number;
  verified: boolean;
}
```

### SinkRecord

```typescript
interface SinkRecord {
  sinkId: string;
  sinkType: 'temp_lock' | 'permanent_sink' | 'staking';
  entityId: string;
  amount: number;
  currencyType: 'soft' | 'hard';
  sunkAt: number;
  releasedAt?: number;
  reason?: string;
}
```

---

## 💡 Real-World Examples

### Example 1: Basic NFT Sale

```typescript
const marketplace = MarketplaceManager.getInstance();

// Player 1 lists NFT
const listing = marketplace.createListing(
  nft,
  'player_1',
  'Alice',
  5000,
  'soft',
  30
);

// Player 2 buys it
const result = marketplace.purchaseListing(
  listing.listingId,
  'player_2',
  'Bob',
  5000
);

// Alice gets: 5000 - (5000 * 2.5%) = 4875 soft
// Bob gets: The NFT
// Platform gets: 125 soft
```

### Example 2: Cosmetic Progression

```typescript
const cosmetics = CosmeticsManager.getInstance();
const economy = EconomyManager.getInstance();

// Player buys cosmetic
cosmetics.unlockCosmetic('player_1', 'skin_gold');
economy.subtractSoftCurrency('player_1', 5000, 'Cosmetic purchase');

// Player equips it
cosmetics.equipCosmetic('player_1', 'skin_gold');

// Player buys upgrade
cosmetics.unlockUpgrade('player_1', 'upgrade_power_1');
economy.subtractSoftCurrency('player_1', 500, 'Upgrade purchase');

// Later, upgrade to level 2
const levelUp = cosmetics.levelUpUpgrade('player_1', 'upgrade_power_1');
// Cost: 500 * 1.1 = 550 soft
```

### Example 3: Tournament Sink Mechanics

```typescript
const burnMgr = BurnSinkManager.getInstance();
const economy = EconomyManager.getInstance();

// Tournament entry locks currency
const sink = burnMgr.sinkCurrency(
  'player_1',
  'Player Name',
  1000,
  'soft',
  'tournament_escrow',
  { tournamentId: 'tournament_1' }
);

// Player can't spend this 1000 soft during tournament

// After tournament ends (24h lock)
burnMgr.releaseSinkedCurrency(sink.sinkId);

// Funds returned to available balance
```

### Example 4: NFT Evolution Burn

```typescript
const burnMgr = BurnSinkManager.getInstance();
const economy = EconomyManager.getInstance();

// Player burns duplicate NFT
const burn = burnMgr.burnNFT(
  'player_1',
  'Player Name',
  'nft_duplicate',
  'nft_evolution',  // Get rewards from evolution mechanic
  'Duplicate NFT'
);

// Result: NFT removed, player gets 100 soft reward
economy.addSoftCurrency('player_1', burn.reward, 'NFT evolution reward');
```

---

## 🔐 Security Considerations

### Marketplace
- ✅ Verify seller owns NFT
- ✅ Check price is reasonable
- ✅ Lock NFT during transaction
- ✅ Atomic purchase (all or nothing)

### Cosmetics
- ✅ Verify player can afford
- ✅ Check unlock requirements
- ✅ Track all purchases
- ✅ Prevent duplicate unlocks

### Burn & Sink
- ✅ Verify burn eligibility
- ✅ Record all burns
- ✅ Enforce sink lock periods
- ✅ Prevent double-spending

---

## 🚀 Performance Tips

- Cache listings for quick filtering
- Limit searches to 100 results
- Use pagination for large datasets
- Archive old transactions
- Batch marketplace updates

---

## 🔮 Future Enhancements

- [ ] Auctions (bid system)
- [ ] Bulk listings
- [ ] Cosmetic combos (bonus effects)
- [ ] Trading system (P2P)
- [ ] Custom cosmetic creation
- [ ] Rental system
- [ ] Cosmetic skins market
- [ ] Leaderboards by cosmetic rarity
