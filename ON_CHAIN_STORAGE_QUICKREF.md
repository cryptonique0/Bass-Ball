# On-Chain Match Storage - Quick Reference

**30-Second Setup**

```typescript
import { initializeOnChainStorage, storeMatchOnChain } from './lib/onChainMatchStorage';

// 1. Initialize
initializeOnChainStorage({
  contractAddress: '0x...',
  rpcUrl: 'https://...',
  chainId: 1,
});

// 2. Store match
const tx = await storeMatchOnChain(completedMatch);

// 3. Use component
<OnChainMatchStatus match={completedMatch} compact={true} />
```

---

## What Gets Stored On-Chain?

✅ Final scores
✅ Team names  
✅ Match timestamp
✅ Top scorer info
✅ Verification hashes

❌ Event logs (stay local)
❌ All player stats (stay local)
❌ Play-by-play (stay local)

---

## Core Classes

### OnChainMatchStorage (Singleton)

```typescript
// Get instance
const storage = OnChainMatchStorage.getInstance();

// Initialize
storage.initialize(config);

// Store
const tx = await storage.storeMatchResult(match);

// Verify
const isValid = await storage.verifyMatchResult(match);

// Retrieve
const summary = storage.getSummary(matchId);
const transaction = storage.getTransaction(matchId);
const all = storage.getAllStoredMatches();

// Report
const report = storage.generateSummaryReport(summary);
```

---

## Helper Functions

```typescript
// Quick store
await storeMatchOnChain(match);

// Quick verify
const valid = await verifyMatchOnChain(match);

// Quick init
initializeOnChainStorage(config);
```

---

## React Components

### OnChainMatchStatus

```tsx
// Full version
<OnChainMatchStatus match={match} showDetails={true} />

// Compact version
<OnChainMatchStatus match={match} compact={true} />
```

**Features**
- Display on-chain status
- Store button
- Verify button
- Download report
- Show hashes

### OnChainStoragePanel

```tsx
<OnChainStoragePanel />
```

Lists all on-chain stored matches.

---

## Common Operations

### Initialize on App Start

```typescript
// app.tsx
import { initializeOnChainStorage } from '@/lib/onChainMatchStorage';

export default function App() {
  useEffect(() => {
    initializeOnChainStorage({
      contractAddress: process.env.REACT_APP_CONTRACT,
      rpcUrl: process.env.REACT_APP_RPC_URL,
      chainId: parseInt(process.env.REACT_APP_CHAIN_ID || '1'),
    });
  }, []);

  return <YourApp />;
}
```

### Store After Match Ends

```typescript
const handleMatchEnd = async (match) => {
  // Save locally
  MatchLogger.saveToStorage(match);
  
  // Store on-chain
  try {
    const tx = await storeMatchOnChain(match);
    console.log('Stored on-chain:', tx.txHash);
  } catch (error) {
    console.error('Failed to store on-chain:', error);
  }
};
```

### Display In Match History

```tsx
function MatchHistory({ player }) {
  return (
    <div>
      {player.matches.map(match => (
        <div key={match.id} className="border p-4">
          <MatchReplay match={match} compact={true} />
          <OnChainMatchStatus match={match} compact={true} />
        </div>
      ))}
    </div>
  );
}
```

### Verify Match Integrity

```typescript
const handleVerify = async (match) => {
  const storage = OnChainMatchStorage.getInstance();
  const isValid = await storage.verifyMatchResult(match);
  
  if (isValid) {
    alert('✓ Match verified - no tampering detected');
  } else {
    alert('⚠ Hash mismatch - data may have changed');
  }
};
```

### Export for Analysis

```typescript
const handleExport = (match) => {
  const storage = OnChainMatchStorage.getInstance();
  const summary = storage.getSummary(match.id);
  
  if (summary) {
    const report = storage.generateSummaryReport(summary);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `match-${match.id}.txt`;
    a.click();
  }
};
```

---

## Data Structures

### OnChainMatchSummary

```typescript
{
  matchId: string;          // match_123
  timestamp: number;        // 1705579200 (seconds)
  homeTeam: string;         // "Team A"
  awayTeam: string;         // "Team B"
  homeScore: number;        // 2
  awayScore: number;        // 1
  topScorer?: string;       // "John Doe"
  topScorerGoals?: number;  // 2
  resultHash: string;       // SHA-256 hash
  matchDataHash?: string;   // Optional full data hash
}
```

### OnChainTransaction

```typescript
{
  txHash: string;           // 0x...
  blockNumber: number;      // 19234567
  timestamp: number;        // 1705579200
  contractAddress: string;  // 0x...
  matchId: string;          // match_123
  status: 'confirmed' | 'pending' | 'failed';
}
```

---

## Configuration Examples

### Ethereum Mainnet

```typescript
{
  contractAddress: '0x...',
  rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY',
  chainId: 1,
  gasLimit: 200000,
  gasPrice: '20',
}
```

### Polygon Mumbai (Testnet)

```typescript
{
  contractAddress: '0x...',
  rpcUrl: 'https://polygon-mumbai.g.alchemy.com/v2/YOUR_KEY',
  chainId: 80001,
  gasLimit: 150000,
  gasPrice: '2',
}
```

### Local Hardhat

```typescript
{
  contractAddress: '0x5FbDB2315678afccb333f8a9c546ead434c52789',
  rpcUrl: 'http://localhost:8545',
  chainId: 31337,
}
```

---

## Error Handling

```typescript
try {
  const tx = await storeMatchOnChain(match);
} catch (error) {
  if (error.message.includes('not initialized')) {
    // Call initializeOnChainStorage first
  } else if (error.message.includes('gas')) {
    // Transaction out of gas
  } else if (error.message.includes('network')) {
    // Network connection failed
  } else {
    // Other error
  }
}
```

---

## Environment Variables

```bash
REACT_APP_CONTRACT_ADDRESS=0x...
REACT_APP_RPC_URL=https://...
REACT_APP_CHAIN_ID=1
REACT_APP_GAS_LIMIT=200000
```

---

## TypeScript Types

```typescript
import type {
  OnChainMatchSummary,
  OnChainTransaction,
} from '@/lib/onChainMatchStorage';

import OnChainMatchStorage from '@/lib/onChainMatchStorage';

import {
  initializeOnChainStorage,
  storeMatchOnChain,
  verifyMatchOnChain,
} from '@/lib/onChainMatchStorage';

import {
  OnChainMatchStatus,
  OnChainStoragePanel,
} from '@/components/OnChainMatchStatus';
```

---

## Performance

| Operation | Time | Gas (Est.) |
|-----------|------|-----------|
| Create summary | <1ms | N/A |
| Store on-chain | 10-30s | 100-200k |
| Verify match | <1ms | N/A |
| Get summary | <1ms | N/A |
| Get all matches | <10ms | N/A |

---

## Checklist

- [ ] Environment variables configured
- [ ] Contract deployed and address set
- [ ] RPC endpoint valid and working
- [ ] Chain ID matches network
- [ ] initialize() called on app start
- [ ] Match storage called after match ends
- [ ] OnChainMatchStatus component displayed
- [ ] Error handling implemented
- [ ] Testing done on testnet first

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Not initialized" | Call `initializeOnChainStorage()` first |
| "Hash mismatch" | Match data changed - check backup |
| "RPC failed" | Check RPC URL and network connection |
| "Out of gas" | Increase gasLimit in config |
| "Contract error" | Verify contract address and ABI |
| "localStorage full" | Clear old matches |

---

## File Sizes & Gas

| Item | Size | Cost |
|------|------|------|
| Match summary | ~200 bytes | 6-8k gas |
| With hashes | ~500 bytes | 15-20k gas |
| Transaction overhead | ~150 bytes | 85-100k gas |
| **Total** | **~850 bytes** | **100-200k gas** |

---

## Security Tips

1. ✅ Use established networks (Ethereum, Polygon, Arbitrum)
2. ✅ Audit smart contract before mainnet
3. ✅ Validate all input data
4. ✅ Use HTTPS for RPC endpoints
5. ✅ Never store private keys in code
6. ✅ Implement rate limiting
7. ✅ Monitor for fraud

---

## Integration Timeline

1. **Setup** (15 min)
   - Environment variables
   - Contract deployment
   - Initialize function

2. **Integration** (30 min)
   - Add to match end handler
   - Add component to UI
   - Test on testnet

3. **Testing** (1 hour)
   - Store test matches
   - Verify integrity
   - Check error handling

4. **Mainnet** (1 day)
   - Audit contract
   - Deploy to mainnet
   - Monitor transactions

---

## Related Systems

- [Match Logging](./MATCH_LOGGING_TECHNICAL.md) — Full event logs
- [Anti-Cheat](./FAIRNESS_VALIDATION_COMPLETE.md) — Fraud detection
- [Smart Contracts](./docs/blockchain-contracts.md) — Contract code

---

**Quick Links**
- Full documentation: [ON_CHAIN_STORAGE_TECHNICAL.md](ON_CHAIN_STORAGE_TECHNICAL.md)
- Code: `lib/onChainMatchStorage.ts`
- Component: `components/OnChainMatchStatus.tsx`

---

**Version**: 1.0  
**Status**: Production Ready  
**Last Updated**: January 18, 2026
