# Bass Ball Game Economy Quick Reference

## 1. Match Rewards System

### Key Functions
- `calculateMatchReward()` - Calculate reward for single match
- `distributeMatchRewards()` - Distribute to both players
- `getStreakBonus()` - Calculate win/loss streak bonuses
- `getPlayerRewardHistory()` - Get player's recent rewards
- `calculateTotalEarnings()` - Total USDC earned

### Quick Example
```typescript
const reward = calculateMatchReward(
  'match-001',
  'player-alice',
  '0x742d...',
  2200, // MMR
  'win'  // outcome
);
// Returns: { finalReward: 80, ... }
```

### Reward Brackets by MMR
- **Bronze** (0-1000): Win=5, Loss=1, Draw=2
- **Silver** (1000-1500): Win=10, Loss=2, Draw=4
- **Gold** (1500-2000): Win=20, Loss=5, Draw=8
- **Diamond** (2000-2500): Win=40, Loss=10, Draw=15
- **Legendary** (2500+): Win=100, Loss=25, Draw=40

---

## 2. Tournament Escrow System

### Key Functions
- `createTournamentEscrow()` - Lock funds in escrow
- `calculatePrizeDistribution()` - Calculate winners' payouts
- `releaseTournamentEscrow()` - Release funds to winners
- `getTournamentStats()` - Get tournament analytics

### Quick Example
```typescript
const escrow = createTournamentEscrow(tournament, participants);
// Locks: 64 players × 100 USDC = 6400 USDC

const distribution = calculatePrizeDistribution(
  escrow,
  tournament,
  ['champion', 'runner-up', 'third']
);
// Returns: { champion: 3200, runner-up: 1920, third: 1280 }
```

### Prize Distribution
- 1st Place: 50% of pool
- 2nd Place: 30% of pool
- 3rd Place: 20% of pool

---

## 3. Player Stats NFTs

### Key Functions
- `checkNFTMintEligibility()` - Check requirements
- `checkAndUnlockAchievements()` - Get unlocked achievements
- `createPlayerStatsNFT()` - Create NFT data

### Eligibility Requirements
- Minimum 10 matches played
- Minimum 800 MMR

### Available Achievements
- Welcome to Bass Ball (common)
- First Victory (common)
- Hat Trick Hero (rare)
- On Fire - 5 wins (uncommon)
- Gold Tier - 1500 MMR (epic)
- Legendary - 2500 MMR (legendary)
- Tournament Champion (epic)

---

## 4. Marketplace System

### Key Functions
- `getMarketplaceItems()` - Browse catalog
- `createMarketplaceOrder()` - List item for sale
- `fillMarketplaceOrder()` - Complete purchase
- `calculateMarketplaceFee()` - Calculate 2.5% fee
- `getMarketplaceMetrics()` - Get market analytics

### Quick Example
```typescript
// Sell item
const listing = createMarketplaceOrder(
  'formation_3-5-2',
  '0xSeller...',
  100 // price
);

// Buy item
const sale = fillMarketplaceOrder(listing, '0xBuyer...');
// Buyer pays: 102.50 (100 + 2.5% fee)
// Seller gets: 97.50
```

### Available Items

**Formations:**
- 4-3-3 Classic: $50
- 5-3-2 Defensive: $75
- 3-5-2 Attacking: $100

**Cosmetics:**
- Golden Jersey: $25 (Limited 100)
- Neon Stadium: $50 (Limited 50)

---

## 5. Analytics & Reporting

### Player Metrics
```typescript
const metrics = getPlayerEconomyMetrics(player, rewards, orders);
// {
//   totalEarned: 1500.50,
//   earnedThisWeek: 125.25,
//   averageRewardPerMatch: 42.5,
//   itemsPurchased: 8,
//   itemsSpent: 350,
//   netEconomy: 1150.50
// }
```

### Economy Stats
```typescript
const stats = getGameEconomyStats(
  matches, rewards, tournaments, nfts, orders, activePlayers
);
// {
//   totalMatches: 50000,
//   totalRewardsDistributed: 1250000,
//   totalTournamentVolume: 500000,
//   totalMarketplaceVolume: 125000,
//   activePlayerCount: 10000,
//   averageRewardPerMatch: 25
// }
```

---

## 6. React Components

### Display Components
1. **MatchRewardDisplay** - Show match rewards with breakdown
2. **RewardHistory** - Player's recent rewards
3. **TournamentEscrowManager** - Tournament info & escrow status
4. **PlayerStatsNFTDisplay** - NFT stats & achievements
5. **MarketplaceBrowser** - Browse & filter items
6. **MarketplaceOrderHistory** - Transaction history
7. **PlayerEconomyDashboard** - Personal economy metrics
8. **EconomyStatsDisplay** - Global economy overview

### Example Usage
```typescript
import { MatchRewardDisplay, RewardHistory } from '@/GAME_ECONOMY_COMPONENTS';

// Show reward
<MatchRewardDisplay reward={reward} playerMMR={2200} />

// Show history
<RewardHistory rewards={allRewards} playerId="alice" limit={10} />
```

---

## 7. Integration Checklist

### Setup
- [ ] Deploy game-economy-adapters.ts to `/lib/web3/`
- [ ] Import components into your UI
- [ ] Configure Base Chain RPC
- [ ] Set up USDC contract connection
- [ ] Deploy NFT contract for achievements

### Match Rewards
- [ ] Listen to match completion events
- [ ] Calculate & distribute rewards
- [ ] Store in database
- [ ] Emit to UI components

### Tournaments
- [ ] Accept tournament entries
- [ ] Create escrow on-chain
- [ ] Run tournament
- [ ] Calculate winners
- [ ] Release escrow & distribute

### NFTs
- [ ] Check player eligibility
- [ ] Unlock achievements
- [ ] Generate metadata
- [ ] Mint NFT on-chain
- [ ] Update player benefits

### Marketplace
- [ ] Load item catalog
- [ ] Accept listings from players
- [ ] Execute purchases on-chain
- [ ] Transfer items & funds
- [ ] Update inventory

---

## 8. Key Data Types

```typescript
// Core types
Match, MatchReward, Tournament, TournamentEscrow
PlayerStatsNFT, Achievement
MarketplaceItem, MarketplaceOrder, PlayerInventory

// Stats types
RewardBracket, GameEconomyStats, PlayerEconomyMetrics

// All types exported from game-economy-adapters.ts
```

---

## 9. Utility Functions

```typescript
// Get bracket by MMR
getBracketNameByMMR(2200) // → "Diamond"

// Format amounts
formatReward(100) // → "$100.00"
formatReward(1500000) // → "$1.50M"

// Get rarity color
getRarityColor('legendary') // → "#f39c12"

// Export economy state
exportEconomyState(matches, rewards, tournaments, players)
```

---

## 10. Common Patterns

### Pattern 1: Complete Match Flow
```typescript
// 1. Match completes
// 2. Calculate rewards
const rewards = distributeMatchRewards(match, player1, player2);
// 3. Store rewards
// 4. Distribute USDC on-chain
// 5. Update UI
```

### Pattern 2: Tournament Entry
```typescript
// 1. Player pays entry fee
// 2. Create escrow
const escrow = createTournamentEscrow(tournament, participants);
// 3. Run tournament
// 4. Release escrow on completion
const { distributions } = releaseTournamentEscrow(...);
// 5. Distribute to winners
```

### Pattern 3: NFT Minting
```typescript
// 1. Check eligibility
const { eligible } = checkNFTMintEligibility(player);
// 2. Get achievements
const achievements = checkAndUnlockAchievements(player, []);
// 3. Create NFT
const nft = createPlayerStatsNFT(player, achievements);
// 4. Mint on-chain
// 5. Award benefits
```

### Pattern 4: Marketplace Purchase
```typescript
// 1. Browse items
const items = getMarketplaceItems({ type: 'formation' });
// 2. Create listing
const order = createMarketplaceOrder(itemId, seller, price);
// 3. Fill order
const filled = fillMarketplaceOrder(order, buyer);
// 4. Execute on-chain
// 5. Transfer item & funds
```

---

## Size & Performance

- **Core Module**: 1,100+ lines
- **Functions**: 25+ exported functions
- **Type Definitions**: Complete TypeScript coverage
- **Gas Optimization**: Batch reward distributions
- **Scalability**: Supports unlimited matches/tournaments/items

---

## On-Chain Contract Integration

### Required Contracts
1. **USDC** (0x...on Base) - Token transfers
2. **Escrow** - Tournament fund management
3. **NFT** - Player stats achievements
4. **Marketplace** - Item ownership & sales

### Key On-Chain Actions
- Transfer USDC rewards to players
- Lock/release tournament escrow
- Mint player achievement NFTs
- Transfer marketplace items
- Record transaction hashes

---

## Troubleshooting

**Q: Rewards not distributing?**
A: Check match status is 'completed' and player MMR is set correctly

**Q: NFT eligibility failing?**
A: Verify player has 10+ matches and 800+ MMR

**Q: Marketplace order expired?**
A: Default expiry is 24 hours, create new listing

**Q: High gas fees?**
A: Use batch distribution for multiple rewards

---

## Next Steps

1. ✅ Created game-economy-adapters.ts (1100+ lines, 25+ functions)
2. ✅ Created comprehensive guide with 60+ examples
3. ✅ Created 8 React components for all features
4. **Next**: Integrate with Base Chain smart contracts
5. **Next**: Connect to match engine for automatic reward distribution
6. **Next**: Build player dashboard UI
7. **Next**: Set up tournament ladder system

---

See [GAME_ECONOMY_ADAPTERS_GUIDE.md](GAME_ECONOMY_ADAPTERS_GUIDE.md) for detailed documentation.
