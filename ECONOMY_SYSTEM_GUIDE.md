# Economy System - Soft & Hard Currency with Entry Fees & Tournaments

## Overview

Complete economy system with:
- **Soft Currency (Off-chain)** - In-game currency for quick transactions
- **Hard Currency (On-chain)** - Blockchain tokens for serious value
- **Entry Fees** - Tournament entry with configurable amounts
- **Tournament Pools** - Prize pool management and distribution

---

## Core Concepts

### Soft Currency (Off-chain) 💰
- **Purpose**: In-game currency for quick, unlimited transactions
- **Storage**: Stored in player database (not on blockchain)
- **Speed**: Instant transactions
- **Limits**: Configurable daily/monthly limits
- **Use Cases**:
  - Tournament entry fees
  - Trading between players
  - Cosmetic purchases
  - Battle pass progression

### Hard Currency (On-chain) ⚡
- **Purpose**: Real blockchain tokens for serious competition
- **Storage**: On blockchain (Ethereum, Base, Polygon, etc.)
- **Speed**: 1-5 minutes (block time dependent)
- **Verification**: Requires transaction hash and block number
- **Use Cases**:
  - High-stakes tournaments
  - Valuable cosmetics
  - NFT purchases
  - Cash-out to real money

---

## Quick Start

### Setup

```typescript
import { EconomyManager } from '@/lib/economySystem';

const economyMgr = EconomyManager.getInstance();

// Get or create player balance
const balance = economyMgr.getBalance('player_1', 'player', 'Player A');
// { softBalance: 0, hardBalance: 0, lockedBalance: 0, ... }
```

### Add Currency

```typescript
// Add soft currency
economyMgr.addSoftCurrency(
  'player_1',
  1000,                    // Amount
  'Daily rewards'          // Description
);

// Add hard currency (with blockchain proof)
economyMgr.addHardCurrency(
  'player_1',
  10.5,                                // Amount
  'Deposit from wallet',
  '0x123abc...def',                    // tx hash
  15234567                             // block number
);
```

### Subtract Currency

```typescript
// Subtract soft currency
economyMgr.subtractSoftCurrency(
  'player_1',
  500,
  'Cosmetic purchase'
);

// Subtract hard currency
economyMgr.subtractHardCurrency(
  'player_1',
  5.0,
  'Tournament entry',
  '0x456def...abc',
  15234568
);
```

---

## Entry Fees System

### Create Entry Fee

```typescript
// Create tournament entry fee
const entryFee = economyMgr.createEntryFee(
  'tournament_1',          // Tournament ID
  'Weekly League',         // Tournament name
  'soft',                  // Currency type
  500,                     // Entry amount
  64,                      // Max participants
  true,                    // Refundable
  Date.now() + 24*60*60*1000  // Refund deadline (24h)
);

// Result:
// {
//   feeId: 'fee_tournament_1',
//   currencyType: 'soft',
//   amount: 500,
//   maxParticipants: 64,
//   currentParticipants: 0,
//   poolTotal: 0,
//   status: 'active'
// }
```

### Pay Entry Fee

```typescript
// Player pays entry fee
const result = economyMgr.payEntryFee('player_1', 'fee_tournament_1');

// Result on success:
// { success: true, tournament: 'Weekly League', remaining: 63 }

// Amount is deducted from balance
// Amount is locked (not spendable)
// Amount added to tournament pool
```

### Refund Entry Fee

```typescript
// Player requests refund (before deadline)
const refunded = economyMgr.refundEntryFee('player_1', 'fee_tournament_1');

if (refunded) {
  console.log('Entry fee refunded');
  // Money returned to balance
  // Locked balance decreased
  // Pool total decreased
}
```

---

## Tournament Pools

### Create Pool

```typescript
// Create prize pool for tournament
const pool = economyMgr.createTournamentPool(
  'tournament_1',          // Tournament ID
  'Weekly League',         // Tournament name
  'soft',                  // Currency type
  5                        // Platform fee (5%)
);

// Pool automatically links to entry fee
// Prize distribution defaults:
// - Rank 1: 50%
// - Rank 2: 30%
// - Rank 3: 20%
```

### Finalize & Distribute

```typescript
// When tournament ends, finalize pool
const rankings = [
  { entityId: 'player_1', rank: 1 },  // 1st place
  { entityId: 'player_2', rank: 2 },  // 2nd place
  { entityId: 'player_3', rank: 3 },  // 3rd place
];

const result = economyMgr.finalizeTournamentPool(
  'pool_tournament_1',
  rankings
);

// Returns:
// {
//   success: true,
//   distributions: Map {
//     'player_1' => 2500,  // 50% of 5000 pool
//     'player_2' => 1500,  // 30% of 5000 pool
//     'player_3' => 1000   // 20% of 5000 pool
//   }
// }

// Rewards automatically awarded to winners
// Locked balances unlocked
// Tournament marked as 'distributed'
```

---

## Transaction History

### View Transactions

```typescript
// Get last 50 transactions
const transactions = economyMgr.getTransactionHistory('player_1', 50);

// Each transaction includes:
// {
//   transactionId: 'tx_...',
//   currencyType: 'soft',
//   transactionType: 'deposit',
//   amount: 1000,
//   balanceBefore: 0,
//   balanceAfter: 1000,
//   description: 'Daily rewards',
//   timestamp: 1705520400000,
//   verified: true
// }
```

### Filter Transactions

```typescript
// By type
const deposits = transactions.filter(t => t.transactionType === 'deposit');
const rewards = transactions.filter(t => t.transactionType === 'reward');

// By currency
const softTxns = transactions.filter(t => t.currencyType === 'soft');
const hardTxns = transactions.filter(t => t.currencyType === 'hard');

// By date range
const recent = transactions.filter(t => 
  t.timestamp > Date.now() - 7*24*60*60*1000
);
```

---

## Configuration

### Soft Currency Config

```typescript
// Get current config
const softConfig = economyMgr.getSoftCurrencyConfig();
// {
//   minTransaction: 1,
//   maxTransaction: 100000,
//   dailyLimit: 1000000,
//   monthlyLimit: 5000000
// }

// Modify config
const hardConfig = economyMgr.getHardCurrencyConfig();
economyMgr.setHardCurrencyConfig({
  tokenAddress: '0x123...abc',  // Your token contract
  chainId: 8453,                  // Base chain
  minTransaction: 0.01,
  maxTransaction: 1000,
  requiresVerification: true
});
```

---

## Blockchain Integration

### Verify On-Chain Transaction

```typescript
// When user deposits hard currency
const txHash = '0x123abc...def';  // From blockchain
const blockNumber = 15234567;

// Add with blockchain proof
economyMgr.addHardCurrency(
  'player_1',
  10.5,
  'Deposit',
  txHash,
  blockNumber
);

// Later, verify the transaction
const verified = economyMgr.verifyTransaction(
  'tx_...',  // transaction ID
  'player_1'
);
```

### Platform Fee Tracking

```typescript
// Get total platform fees collected
const totalFees = economyMgr.getPlatformFeeTotal();

// Fees are automatically calculated on tournament finalization
// Example: 5000 pool * 5% platform fee = 250 tokens fee
```

---

## React Component Usage

### Basic Usage

```typescript
import { EconomyDashboard } from '@/components/EconomyDashboard';

export function WalletPage() {
  return (
    <EconomyDashboard
      entityId="player_1"
      entityType="player"
      entityName="Player A"
    />
  );
}
```

### Currency Badge

```typescript
import { CurrencyBadge } from '@/components/EconomyDashboard';

export function Header() {
  const balance = economyMgr.getBalance('player_1', 'player', 'Player A');
  
  return (
    <header>
      <CurrencyBadge balance={balance} />
    </header>
  );
}
```

---

## Real-World Examples

### Example 1: Entry-Free Weekly Tournament

```typescript
// Tournament organizer creates entry fee
const entryFee = economyMgr.createEntryFee(
  'weekly_001',
  'Weekly Pro League',
  'soft',
  1000,        // 1000 soft currency
  32,          // 32 players max
  true,        // Refundable
  Date.now() + 6*24*60*60*1000  // 6 day refund deadline
);

// 32 players sign up and pay 1000 each
// Pool total: 32,000 soft currency

// Tournament ends with rankings
const rankings = [
  { entityId: 'winner_1', rank: 1 },
  { entityId: 'winner_2', rank: 2 },
  { entityId: 'winner_3', rank: 3 },
];

// Finalize with 5% platform fee
economyMgr.finalizeTournamentPool('pool_weekly_001', rankings);

// Prizes (5% goes to platform):
// 1st: 32000 * 50% * 95% = 15,200
// 2nd: 32000 * 30% * 95% = 9,120
// 3rd: 32000 * 20% * 95% = 6,080
// Platform: 32000 * 5% = 1,600
```

### Example 2: High-Stakes Hard Currency Tournament

```typescript
// Create high-stakes tournament with blockchain tokens
const entryFee = economyMgr.createEntryFee(
  'championship_2026',
  'Championship 2026',
  'hard',      // Hard currency
  1.0,         // 1 token per entry
  16,          // 16 players
  false,       // NOT refundable (serious money)
  undefined    // No refund deadline
);

// 16 players pay 1 token each = 16 tokens in pool

// Tournament ends
const rankings = [
  { entityId: 'pro_player_1', rank: 1 },
  { entityId: 'pro_player_2', rank: 2 },
  { entityId: 'pro_player_3', rank: 3 },
];

economyMgr.finalizeTournamentPool('pool_championship_2026', rankings);

// Hard currency prizes:
// 1st: 16 * 50% * 95% = 7.6 tokens
// 2nd: 16 * 30% * 95% = 4.56 tokens
// 3rd: 16 * 20% * 95% = 3.04 tokens
// Platform: 16 * 5% = 0.8 tokens
```

### Example 3: Mixed Currency Tournament

```typescript
// Allow both soft and hard currency entry

// Soft currency track
const softFee = economyMgr.createEntryFee(
  'mixed_tournament_1',
  'Mixed Tournament - Soft Track',
  'soft',
  500,
  50,
  true
);

// Hard currency track (higher stakes)
const hardFee = economyMgr.createEntryFee(
  'mixed_tournament_1_hard',
  'Mixed Tournament - Hard Track',
  'hard',
  0.5,
  20,
  false
);

// Each track has separate pools
const softPool = economyMgr.createTournamentPool(
  'mixed_tournament_1',
  'Mixed Tournament - Soft Track',
  'soft',
  3
);

const hardPool = economyMgr.createTournamentPool(
  'mixed_tournament_1_hard',
  'Mixed Tournament - Hard Track',
  'hard',
  5
);
```

---

## Data Persistence

All economy data is auto-saved to localStorage:

```
localStorage['economy_system']
├─ balances (Map<entityId, PlayerBalance>)
├─ transactions (Map<entityId, Transaction[]>)
├─ entryFees (Map<feeId, EntryFee>)
├─ tournamentPools (Map<poolId, TournamentPool>)
├─ softConfig (SoftCurrencyConfig)
└─ hardConfig (HardCurrencyConfig)
```

---

## Security Considerations

### Soft Currency (Off-chain)
- ✅ Stored in app database
- ✅ No blockchain overhead
- ✅ Fast transactions
- ⚠️ Requires trust in game server

### Hard Currency (On-chain)
- ✅ Blockchain-verified
- ✅ Cryptographically secure
- ✅ Transaction immutable
- ✅ Requires tx hash and block number
- ✅ All transactions logged

### Best Practices
1. **Verify hard currency deposits** with blockchain proof
2. **Lock funds during tournaments** (can't be spent)
3. **Implement rate limits** on transactions
4. **Track all transactions** for audit trail
5. **Use escrow** for high-value tournaments

---

## Performance Tips

- Cache balances for frequent reads
- Batch transaction updates
- Limit history queries (50 most recent)
- Use pagination for leaderboards
- Archive old transactions monthly

---

## Future Enhancements

- [ ] Staking system
- [ ] Currency conversion between soft/hard
- [ ] Dynamic pricing for cosmetics
- [ ] Betting system
- [ ] Sponsorship rewards
- [ ] Season-based balance reset
- [ ] Player-to-player transfers
- [ ] Currency marketplace

