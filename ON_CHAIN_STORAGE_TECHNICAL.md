# On-Chain Match Storage - Technical Guide

**Status**: Production Ready  
**Version**: 1.0  
**Date**: January 18, 2026

---

## Overview

This system stores **match result summaries** on-chain for permanent verification and record-keeping. Unlike full event logging (which remains client-side), only the essential match result data is stored on blockchain:

- Teams and final scores
- Match timestamp
- Top scorer information
- Cryptographic verification hashes

---

## Why On-Chain Match Storage?

✅ **Permanent Record** - Match results cannot be modified or deleted  
✅ **Verification** - Cryptographic proof of match outcomes  
✅ **Transparency** - Public ledger of official results  
✅ **Minimal Data** - Only summary, not full event logs (gas-efficient)  
✅ **Integration** - Works with existing MatchLogger system  

---

## Architecture

### Data Structures

**OnChainMatchSummary** - What gets stored on-chain

```typescript
interface OnChainMatchSummary {
  matchId: string;              // Unique match identifier
  timestamp: number;            // Block timestamp (seconds)
  homeTeam: string;             // Home team name
  awayTeam: string;             // Away team name
  homeScore: number;            // Final home score
  awayScore: number;            // Final away score
  topScorer?: string;           // Player with most goals
  topScorerGoals?: number;      // Number of goals by top scorer
  resultHash: string;           // SHA-256 of result
  matchDataHash?: string;       // Optional: hash of full match
}
```

**OnChainTransaction** - Blockchain transaction record

```typescript
interface OnChainTransaction {
  txHash: string;               // Transaction hash
  blockNumber: number;          // Block number
  timestamp: number;            // Transaction timestamp
  contractAddress: string;      // Smart contract address
  matchId: string;              // Reference to match
  status: 'pending' | 'confirmed' | 'failed';
}
```

### Core Classes

**OnChainMatchStorage** - Main singleton

```typescript
class OnChainMatchStorage {
  // Initialize with blockchain config
  initialize(config: OnChainConfig): void

  // Create summary from full match
  createMatchSummary(match: MatchLog): OnChainMatchSummary

  // Store match to blockchain
  async storeMatchResult(match: MatchLog): Promise<OnChainTransaction>

  // Verify match hasn't changed
  async verifyMatchResult(match: MatchLog): Promise<boolean>

  // Retrieve stored data
  getTransaction(matchId: string): OnChainTransaction | undefined
  getSummary(matchId: string): OnChainMatchSummary | undefined
  getAllStoredMatches(): Array<{ matchId, summary, tx }>

  // Generate report
  generateSummaryReport(summary: OnChainMatchSummary): string
}
```

---

## Usage Guide

### 1. Initialize

```typescript
import { initializeOnChainStorage } from './lib/onChainMatchStorage';

// Setup blockchain configuration
initializeOnChainStorage({
  contractAddress: '0x...',
  rpcUrl: 'https://rpc.example.com',
  chainId: 1,        // Ethereum mainnet
  gasLimit: 200000,
  gasPrice: '20',
});
```

### 2. Store Match Result

```typescript
import { storeMatchOnChain } from './lib/onChainMatchStorage';

// After match completes
const transaction = await storeMatchOnChain(completedMatch);

console.log(`Stored on-chain: ${transaction.txHash}`);
console.log(`Block: ${transaction.blockNumber}`);
```

### 3. Verify Match

```typescript
import { verifyMatchOnChain } from './lib/onChainMatchStorage';

// Verify match hasn't been tampered with
const isValid = await verifyMatchOnChain(match);

if (isValid) {
  console.log('✓ Match verified - hashes match');
} else {
  console.log('⚠ Hash mismatch - data may have changed');
}
```

### 4. Use React Component

```tsx
import { OnChainMatchStatus } from './components/OnChainMatchStatus';

function MatchDetail({ match }) {
  return (
    <div>
      {/* Full component */}
      <OnChainMatchStatus match={match} showDetails={true} />

      {/* Compact version */}
      <OnChainMatchStatus match={match} compact={true} />
    </div>
  );
}
```

### 5. Display Admin Panel

```tsx
import { OnChainStoragePanel } from './components/OnChainMatchStatus';

function AdminPage() {
  return <OnChainStoragePanel />;
}
```

---

## Data Flow

```
Match Complete
    ↓
MatchLogger.endMatch()
    ↓
Extract Summary (teams, scores, top scorer)
    ↓
Calculate Verification Hashes
    ↓
Send to Blockchain (via smart contract)
    ↓
Store Transaction Hash & Block Number
    ↓
Cache locally (localStorage)
    ↓
Display On-Chain Status to User
```

---

## What Gets Stored vs. What Doesn't

### ✅ Stored On-Chain (Summary Only)
- Teams and final score
- Timestamp
- Top scorer name and goal count
- Verification hashes

### ❌ Not Stored On-Chain (Stays Local)
- Complete event log
- All player statistics
- Detailed play-by-play
- Player positions
- Possession data
- Pass accuracy

This keeps on-chain storage minimal and gas-efficient while maintaining a complete local record.

---

## Verification Hashing

### Result Hash
Hash of the final match result:
```javascript
resultHash = SHA256({
  homeTeam: 'Team A',
  awayTeam: 'Team B',
  homeScore: 2,
  awayScore: 1,
  timestamp: 1705579200,
})
```

### Full Data Hash
Optional hash of entire match (for later detailed verification):
```javascript
matchDataHash = SHA256(entireMatchObject)
```

If hashes match on re-verification, the match data is confirmed unmodified.

---

## Integration Points

### With MatchLogger

```typescript
import { MatchLogger } from './lib/matchLogger';
import { storeMatchOnChain } from './lib/onChainMatchStorage';

const logger = MatchLogger.getInstance();
logger.startMatch('Team A', 'Team B', 90);

// ... record events ...

const match = logger.endMatch({ home: 2, away: 1 });
MatchLogger.saveToStorage(match);

// Also store summary on-chain
const tx = await storeMatchOnChain(match);
```

### With PlayerProfile

```typescript
import { OnChainMatchStatus } from './components/OnChainMatchStatus';

function PlayerMatchHistory({ player }) {
  return (
    <div>
      {player.matches.map(match => (
        <div key={match.id}>
          <MatchReplay match={match} compact />
          <OnChainMatchStatus match={match} compact />
        </div>
      ))}
    </div>
  );
}
```

### With Leaderboards

```typescript
// On-chain stored matches can be used for official leaderboards
const onChainMatches = OnChainMatchStorage.getInstance().getAllStoredMatches();

const leaderboard = {};
onChainMatches.forEach(({ summary }) => {
  if (summary.topScorer) {
    leaderboard[summary.topScorer] = (leaderboard[summary.topScorer] || 0) + summary.topScorerGoals;
  }
});
```

---

## Configuration

### OnChainConfig

```typescript
interface OnChainConfig {
  contractAddress: string;      // Deployed contract address
  rpcUrl: string;              // Blockchain RPC endpoint
  chainId: number;             // Network ID (1 = mainnet, 5 = goerli)
  gasLimit?: number;           // Max gas for transaction
  gasPrice?: string;           // Gas price in gwei
}
```

### Example Configurations

**Ethereum Mainnet**
```typescript
{
  contractAddress: '0x...',
  rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/...',
  chainId: 1,
  gasLimit: 200000,
}
```

**Polygon Mumbai (Testnet)**
```typescript
{
  contractAddress: '0x...',
  rpcUrl: 'https://polygon-mumbai.g.alchemy.com/v2/...',
  chainId: 80001,
  gasLimit: 150000,
}
```

**Arbitrum One**
```typescript
{
  contractAddress: '0x...',
  rpcUrl: 'https://arb-mainnet.g.alchemy.com/v2/...',
  chainId: 42161,
  gasLimit: 100000,
}
```

---

## API Reference

### OnChainMatchStorage

#### `getInstance()`
Get singleton instance
```typescript
const storage = OnChainMatchStorage.getInstance();
```

#### `initialize(config)`
Initialize with blockchain config
```typescript
storage.initialize({
  contractAddress: '0x...',
  rpcUrl: 'https://...',
  chainId: 1,
});
```

#### `createMatchSummary(match)`
Create on-chain summary from full match
```typescript
const summary = storage.createMatchSummary(match);
```

#### `storeMatchResult(match)`
Store match to blockchain
```typescript
const tx = await storage.storeMatchResult(match);
// tx.txHash, tx.blockNumber, tx.status
```

#### `verifyMatchResult(match)`
Verify match hasn't been modified
```typescript
const isValid = await storage.verifyMatchResult(match);
// Returns: boolean
```

#### `getTransaction(matchId)`
Get transaction record
```typescript
const tx = storage.getTransaction('match_123');
// tx.txHash, tx.blockNumber, tx.status
```

#### `getSummary(matchId)`
Get stored summary
```typescript
const summary = storage.getSummary('match_123');
// summary.homeTeam, summary.homeScore, etc.
```

#### `getAllStoredMatches()`
Get all on-chain matches
```typescript
const stored = storage.getAllStoredMatches();
// Array of { matchId, summary, tx }
```

#### `generateSummaryReport(summary)`
Generate human-readable report
```typescript
const report = storage.generateSummaryReport(summary);
// Multi-line string report
```

### Helper Functions

#### `initializeOnChainStorage(config)`
```typescript
initializeOnChainStorage({
  contractAddress: '0x...',
  rpcUrl: '...',
  chainId: 1,
});
```

#### `storeMatchOnChain(match)`
```typescript
const tx = await storeMatchOnChain(match);
```

#### `verifyMatchOnChain(match)`
```typescript
const isValid = await verifyMatchOnChain(match);
```

---

## React Components

### OnChainMatchStatus

Display on-chain status for a single match.

**Props**
```typescript
interface OnChainMatchStatusProps {
  match: MatchLog;           // The match to display
  compact?: boolean;         // Compact or full view (default: false)
  showDetails?: boolean;     // Show hashes and details (default: true)
}
```

**Usage**
```tsx
<OnChainMatchStatus 
  match={completedMatch} 
  compact={true}
  showDetails={false}
/>
```

**Features**
- Display current on-chain status
- Store match if not already stored
- Verify match integrity
- Download summary report
- Display transaction and block info
- Show verification hashes

### OnChainStoragePanel

Admin panel showing all on-chain stored matches.

**Usage**
```tsx
<OnChainStoragePanel />
```

**Features**
- List all on-chain matches
- Show match results
- Display transaction hashes
- Show storage timestamps
- Click to expand details

---

## Performance Considerations

### Storage Size
- Per-match on-chain data: ~200-500 bytes
- With hashes and metadata: ~1KB
- Gas cost: ~100,000-200,000 gas (varies by chain)

### Caching Strategy
- In-memory cache for fast access
- localStorage persistence
- Automatic cleanup of old records
- Efficient hash calculations

### Optimization Tips
1. **Batch storage** - Store multiple matches in single transaction
2. **Selective hashing** - Only hash critical data
3. **Lazy loading** - Load summaries only when needed
4. **Compress data** - Use packed formats for blockchain

---

## Security Considerations

### Hash Verification
- Uses SHA-256 for result hashing
- Validates against tampering
- Immutable blockchain record

### Data Privacy
- No sensitive player data on-chain
- Only public match results
- No personally identifiable information
- GDPR compliant

### Smart Contract Security
- Validate input data on contract
- Implement access controls
- Use established patterns
- Audit before mainnet deployment

---

## Error Handling

```typescript
try {
  const tx = await storeMatchOnChain(match);
} catch (error) {
  if (error.message.includes('not initialized')) {
    console.error('Call initializeOnChainStorage first');
  } else if (error.message.includes('gas')) {
    console.error('Insufficient gas for transaction');
  } else {
    console.error('Unknown error:', error);
  }
}
```

---

## Testing

### Test Storage
```typescript
const match = {
  id: 'test_123',
  homeTeam: 'Team A',
  awayTeam: 'Team B',
  finalScore: { home: 2, away: 1 },
  timestamp: Date.now(),
  playerStats: { 'John': { goals: 2 } },
  // ... other fields
};

const tx = await storeMatchOnChain(match);
console.log(`Stored: ${tx.txHash}`);
```

### Test Verification
```typescript
const isValid = await verifyMatchOnChain(match);
console.log(`Valid: ${isValid}`);
```

### Test All Matches
```typescript
const all = OnChainMatchStorage.getInstance().getAllStoredMatches();
console.log(`${all.length} matches on-chain`);
```

---

## Migration from Local Storage

If you have existing match data in localStorage:

```typescript
import { MatchLogger } from './lib/matchLogger';
import { storeMatchOnChain } from './lib/onChainMatchStorage';

// Get all stored matches
const allMatches = MatchLogger.getInstance().getAllLogsFromStorage();

// Store each on-chain
for (const match of allMatches) {
  try {
    await storeMatchOnChain(match);
    console.log(`Migrated: ${match.id}`);
  } catch (error) {
    console.error(`Failed: ${match.id}`, error);
  }
}
```

---

## Troubleshooting

**"OnChainMatchStorage not initialized"**
→ Call `initializeOnChainStorage(config)` before storing

**"Hash mismatch" during verification**
→ Match data was modified. Check `generateSummaryReport()` for details

**Transaction stuck in pending**
→ Check blockchain status, may need to increase gas price

**localStorage full**
→ Clear old matches with `localStorage.removeItem('on_chain_match_...')`

---

## Future Enhancements

- [ ] Multi-chain deployment
- [ ] Batch storage (multiple matches per tx)
- [ ] Event-based hooks for on-chain events
- [ ] Automated storage on match completion
- [ ] Server-side blockchain interaction
- [ ] NFT mint for official matches
- [ ] Cross-chain verification

---

## Related Documentation

- [Match Logging System](./MATCH_LOGGING_TECHNICAL.md)
- [Anti-Cheat & Fairness](./FAIRNESS_VALIDATION_COMPLETE.md)
- [Smart Contract Integration](./docs/blockchain-contracts.md)

---

**Version**: 1.0  
**Status**: Production Ready  
**Last Updated**: January 18, 2026  
**Support**: See integration examples throughout this guide
