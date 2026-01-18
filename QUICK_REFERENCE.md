# Bass Ball - Quick Reference Guide

**Complete Web3 Football Game MVP on Base Chain**

## 🚀 Quick Start (5 Minutes)

```bash
# 1. Clone & install
git clone https://github.com/yourusername/bass-ball.git
cd bass-ball
npm install

# 2. Configure
cp .env.example .env.local
# Edit .env.local with Privy App ID from console.privy.io

# 3. Run
npm run dev

# 4. Open browser
# http://localhost:3000
```

## 📁 Key File Locations

| Purpose | File |
|---------|------|
| Game page (main) | `src/app/game/page.tsx` |
| Game canvas | `src/components/GameCanvas.tsx` |
| Game engine | `src/lib/phaser.ts` |
| Real-time comms | `src/lib/socket.ts` |
| Web3 client | `src/lib/web3.ts` |
| State management | `src/store/useMatchStore.ts` |
| Types | `src/types/match.ts` |
| Landing page | `src/app/page.tsx` |
| Profile page | `src/app/profile/page.tsx` |
| Landing design | `IMPLEMENTATION_GUIDE.md` |

## 🎮 Game Flow

```
Landing Page
    ↓
[Connect Wallet] [Play as Guest]
    ↓
Game Page (Match Start)
    ↓
Real-time 30-min Match
    ↓
Match Result Modal
    ↓
Verification (6 steps)
    ↓
NFT Reward (if won)
    ↓
Profile Update
```

## 🔌 Key Component Props & Usage

### GameCanvas
```typescript
<GameCanvas matchId="match-123" />
// Renders Phaser game in full screen
```

### MatchHUD
```typescript
<MatchHUD />
// Displays score, timer, controls overlay
// No props needed (uses Zustand store)
```

### MatchResultModal
```typescript
<MatchResultModal 
  isOpen={true}
  onClose={() => setOpen(false)}
/>
// Shows result + verification status
```

### WalletButton
```typescript
<WalletButton />
// Login/Logout button
// No props needed (uses Privy + Zustand)
```

## 🎯 Most Important Files

1. **src/app/game/page.tsx** - Entry point for gameplay
2. **src/lib/socket.ts** - Real-time match events
3. **src/lib/phaser.ts** - Game engine setup
4. **src/store/useMatchStore.ts** - Global state
5. **src/lib/web3.ts** - Blockchain interaction

## 💾 Zustand Store Usage

```typescript
import { useMatchStore } from '@/store/useMatchStore'

const { currentMatch, playerId, playerProfile, setMatchStarted } = useMatchStore()

// Use like React hooks
setMatchStarted(true)
```

## 🔌 Socket.IO Events

### Listen (from server)
```typescript
'match:start'    // Match begins
'match:state'    // Game state update (60Hz)
'match:end'      // Match finished
'match:error'    // Error occurred
'ping'           // Connection test
```

### Emit (to server)
```typescript
sendPlayerInput(input)   // Send action
joinMatch(matchId)       // Join match
leaveMatch()             // Leave match
```

## 🔐 Web3 Integration

```typescript
import { getPublicClient, getMatchOnChain } from '@/lib/web3'

// Read from contract
const match = await getMatchOnChain(matchId)

// Verify result
const verified = await verifyMatchResult(matchId, hash)
```

## 🎮 Game Input Handling

```typescript
// In GameCanvas or MatchHUD
const handleAction = (action: PlayerAction, params: object) => {
  const input: PlayerInput = {
    tick: currentMatch.tick,
    action,
    params,
    timestamp: Date.now()
  }
  sendPlayerInput(input)
}

// Actions: MOVE, PASS, SHOOT, TACKLE, SPRINT, SKILL
```

## 📊 Anti-Cheat Validation

```typescript
import { MatchValidator } from '@/lib/matchValidator'

const result = MatchValidator.validateMatch(matchResult)
// result.valid: boolean
// result.score: 0-100
// result.issues: ValidationIssue[]
// result.isSuspicious: boolean
```

## 🔍 Match Verification

```typescript
import { verifyMatchReplay } from '@/lib/replay'

const verification = await verifyMatchReplay(matchId)
// verification.valid: boolean
// verification.computed: hash
// verification.onChain: hash
// verification.mismatchType?: string
```

## 🎁 NFT Minting

```typescript
import { mintFirstWinNFT } from '@/lib/contracts'

const txHash = await mintFirstWinNFT(playerId, matchId)
// Gasless via Paymaster
```

## 🧪 Common Development Tasks

### Add a new game action
1. Update `PlayerAction` type in `src/types/match.ts`
2. Add handler in `src/components/MatchHUD.tsx`
3. Add keyboard listener in `src/lib/phaser.ts`
4. Add validation in `src/lib/matchValidator.ts`

### Debug a match
1. Check browser console for Socket.IO events
2. Check Zustand store in React DevTools
3. Verify match data in Network tab
4. Check for TypeScript errors

### Test verification
```bash
# Start dev server
npm run dev

# Play match (or use mock data)
# Check verification step by step:
# 1. Fetch from IPFS
# 2. Compute hash locally
# 3. Get on-chain hash
# 4. Compare hashes
```

## 📱 Responsive Design

- **Desktop**: 1024x576 game canvas
- **Tablet**: Adjusted HUD buttons (grid-cols-2)
- **Mobile**: Full-width, stack controls vertically

## ⚙️ Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `NEXT_PUBLIC_PRIVY_APP_ID` | Auth | `clx...` |
| `NEXT_PUBLIC_BASE_RPC_URL` | Blockchain | `https://sepolia.base.org` |
| `NEXT_PUBLIC_SOCKET_URL` | Real-time | `http://localhost:3001` |
| `NEXT_PUBLIC_IPFS_GATEWAY` | Storage | `https://gateway.pinata.cloud` |
| `NEXT_PUBLIC_MATCH_REGISTRY_ADDRESS` | Contract | `0x...` |

## 🚨 Error Handling

```typescript
// Socket errors
socket.on('match:error', (error) => {
  console.error('Match error:', error)
  setVerificationStatus('failed')
})

// Contract errors
try {
  await verifyMatchResult(matchId, hash)
} catch (error) {
  console.error('Verification failed:', error)
}
```

## 📈 Performance Tips

- Disable Phaser debug mode: `debug: false`
- Use production build: `npm run build`
- Enable compression on Socket.IO
- Cache IPFS gateway responses
- Lazy-load images

## 🧹 Code Style

- TypeScript strict mode (no `any`)
- ESLint rules enforced
- Prettier auto-format
- Zustand for state (no Redux)
- Tailwind for styling (no CSS-in-JS)

## 🔗 Important Links

- **Privy Console**: https://console.privy.io/
- **Base Explorer**: https://basescan.org/
- **Base RPC**: https://mainnet.base.org
- **Phaser Docs**: https://phaser.io/docs/
- **Viem Docs**: https://viem.sh/
- **Socket.IO Docs**: https://socket.io/docs/

## 🐛 Debugging Commands

```bash
# Type check
npm run typecheck

# Lint
npm run lint

# Format
npm run format

# Test
npm run test

# Build
npm run build
```

## 📞 Getting Help

1. Check **DEVELOPMENT_GUIDE.md** for setup issues
2. Check **Troubleshooting** section for common problems
3. Read inline code comments
4. Check GitHub issues
5. Open Discord discussion

## ✅ Pre-Launch Checklist

- [ ] All environment variables set
- [ ] Contract addresses deployed
- [ ] Socket.IO server running
- [ ] Privy app configured
- [ ] IPFS gateway accessible
- [ ] Tests passing
- [ ] No TypeScript errors
- [ ] Mobile responsive
- [ ] Error logging configured

---

**Bass Ball MVP - Everything is ready to play!** ⚽🔗

Questions? Check DEVELOPMENT_GUIDE.md or open an issue on GitHub.
