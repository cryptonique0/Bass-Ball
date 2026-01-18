# Bass Ball Development Guide

Complete guide for developing, testing, and deploying the Bass Ball Web3 football game.

## Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Project Structure Deep Dive](#project-structure-deep-dive)
3. [Feature Implementation Guide](#feature-implementation-guide)
4. [Testing Strategy](#testing-strategy)
5. [Deployment Checklist](#deployment-checklist)
6. [Troubleshooting](#troubleshooting)

## Local Development Setup

### Step 1: Prerequisites

Install required software:
- **Node.js** 18.17+ (with npm 9+)
- **Git** 2.40+
- **Docker** (optional, for Socket.IO server)
- **Wallet**: MetaMask or similar browser extension

### Step 2: Clone & Install

```bash
# Clone repository
git clone https://github.com/yourusername/bass-ball.git
cd bass-ball

# Install dependencies
npm install

# Install Phaser separately (peer dependency)
npm install phaser@3.56.0

# Verify installation
npm list phaser viem wagmi privy

# Expected output:
# phaser@3.56.0
# viem@2.x.x
# wagmi@2.x.x
# @privy-io/react-auth@1.x.x
```

### Step 3: Environment Setup

```bash
# Copy example environment file
cp .env.example .env.local

# Edit configuration
nano .env.local

# Required configuration:
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id          # https://console.privy.io/
NEXT_PUBLIC_BASE_RPC_URL=https://sepolia.base.org   # Base testnet
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001        # Socket.IO server

# Optional (for production):
NEXT_PUBLIC_MATCH_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_PLAYER_CARD_ADDRESS=0x...
```

### Step 4: Get Privy App ID

1. Go to https://console.privy.io/
2. Create new project (or use existing)
3. Copy App ID to `.env.local`
4. Configure allowed origins: `http://localhost:3000`
5. Enable email + wallet login methods

### Step 5: Start Development Servers

```bash
# Terminal 1: Next.js app
npm run dev

# Terminal 2: Socket.IO server (mock)
npm run dev:socket

# Terminal 3: (Optional) Backend API
npm run dev:api

# Open browser to http://localhost:3000
```

## Project Structure Deep Dive

### `/src/app` - Pages & Layouts

```
app/
├── layout.tsx              # Root layout + Privy provider
├── page.tsx                # Landing page (home, login, features)
├── globals.css             # Global Tailwind styles
├── game/
│   └── page.tsx            # Game page (match screen)
└── profile/
    └── page.tsx            # Player profile & stats
```

**Key Files Explained:**

- **layout.tsx**: Sets up Privy authentication context for entire app
- **page.tsx**: Landing page with login, feature showcase, how-to guide
- **game/page.tsx**: Main game screen - initializes Socket.IO, loads Phaser
- **profile/page.tsx**: Player stats, match history, NFT gallery

### `/src/components` - React Components

```
components/
├── GameCanvas.tsx              # Phaser game container
├── MatchHUD.tsx               # Score, timer, controls overlay
├── WalletButton.tsx           # Privy authentication button
├── MatchResultModal.tsx       # Match result + verification display
└── FairnessValidator.tsx      # Anti-cheat validation modal
```

**Component Responsibilities:**

- **GameCanvas**: Manages Phaser instance lifecycle
- **MatchHUD**: Displays match state + player controls
- **WalletButton**: Handles authentication flow
- **MatchResultModal**: Shows result + triggers verification
- **FairnessValidator**: Displays validation report

### `/src/lib` - Utility Libraries

```
lib/
├── phaser.ts               # Phaser scene setup + game logic
├── socket.ts               # Socket.IO client + event handlers
├── web3.ts                 # Viem client + contract ABIs
├── replay.ts               # Match verification logic (6-step)
├── contracts.ts            # Contract helper functions
└── matchValidator.ts       # Anti-cheat system (4 layers)
```

**Module Purposes:**

- **phaser.ts**: Game engine setup, scene management, physics
- **socket.ts**: Real-time communication, event listeners/emitters
- **web3.ts**: Blockchain interaction, contract reading
- **replay.ts**: Verification process, fraud detection
- **contracts.ts**: NFT minting, contract write operations
- **matchValidator.ts**: 4-layer validation with scoring

### `/src/store` - State Management

```
store/
└── useMatchStore.ts        # Zustand store (11 state properties)
```

**Store Structure:**

```typescript
// 11 state properties:
- currentMatch: MatchState       // Active match data
- matchResult: MatchResult       // Completed match
- isConnected: boolean           // Socket.IO connection
- playerId: string               // Current player ID
- playerProfile: PlayerProfile   // Player stats + NFTs
- isGuest: boolean              // Guest mode flag
- walletAddress: string         // Connected wallet
- isMatchStarted: boolean       // Match lifecycle
- isMatchEnded: boolean         // Match lifecycle
- showVerification: boolean     // Modal visibility
- verificationStatus: enum      // Verification state

// 13 actions:
- setCurrentMatch, updateMatchState, setMatchResult
- setConnected, setPlayerId, setPlayerProfile
- setIsGuest, setWalletAddress, setMatchStarted
- setMatchEnded, setShowVerification, setVerificationStatus
- reset (clears all)
```

### `/src/types` - TypeScript Interfaces

```
types/
└── match.ts                # 8 core interfaces
```

**Interfaces:**

1. **PlayerInput** - Single action from player
   ```typescript
   tick: number          // Frame count
   action: 6-union       // MOVE, PASS, SHOOT, TACKLE, SPRINT, SKILL
   params: object        // Action-specific data
   timestamp: number     // Milliseconds
   ```

2. **MatchState** - Full game snapshot
   ```typescript
   matchId, status, tick
   homeTeam, awayTeam    // Team data + player positions
   ball: { x, y, vx, vy }
   possession: 'home' | 'away'
   duration: number      // Match time in ms
   seed: number          // For deterministic RNG
   ```

3. **PlayerState** - Individual player data
   ```typescript
   id, position: { x, y }, stamina
   stats: { wins, losses, goals, assists }
   ```

4. **MatchResult** - Complete match record
   ```typescript
   matchId, homeTeam, awayTeam
   result: { home: number, away: number }
   inputs: PlayerInput[]  // All actions from match
   resultHash: string     // Keccak256 hash
   timestamp: number
   ```

5. **VerificationResult** - Hash comparison
   ```typescript
   valid: boolean
   computed: string       // Local hash
   onChain: string       // Blockchain hash
   mismatchType?: string
   details: object
   ```

6. **PlayerProfile** - User data
   ```typescript
   id, username
   stats: { wins, losses, goalsScored, assists }
   ranking: { rating, position }
   nfts: NFTToken[]
   matchHistory: MatchHistoryEntry[]
   ```

7. **GameConfig** - Match settings
   ```typescript
   fieldWidth: 1024, fieldHeight: 576
   tickRate: 60 (Hz)
   matchDuration: 1800000 (30 min)
   ```

8. **GuestSession** - Guest player tracking
   ```typescript
   sessionId, username
   createdAt, lastActivity
   ```

## Feature Implementation Guide

### Adding a New Game Action

**Example: Implementing "HEADER" Action**

1. **Update Types** (`src/types/match.ts`)
   ```typescript
   type PlayerAction = 'MOVE' | 'PASS' | 'SHOOT' | 'TACKLE' | 'SPRINT' | 'SKILL' | 'HEADER'
   
   // In validateActionParams (matchValidator.ts):
   case 'HEADER':
     return typeof params.power === 'number' && params.power >= 0 && params.power <= 100
   ```

2. **Add to HUD** (`src/components/MatchHUD.tsx`)
   ```typescript
   <div onClick={() => handleAction('HEADER', { power: 75 })}>
     Header (H)
   </div>
   ```

3. **Update Phaser Scene** (`src/lib/phaser.ts`)
   ```typescript
   this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
     if (event.key.toLowerCase() === 'h') {
       this.emitPlayerInput('HEADER', { power: 75 })
     }
   })
   ```

4. **Test in Game**
   - Start dev server
   - Play match
   - Verify input sent to server

### Implementing Anti-Cheat for New Feature

1. **Add Check to matchValidator.ts**
   ```typescript
   checkNewFeature(): ValidationIssue[] {
     // Validate the new action
     return []
   }
   ```

2. **Add Scoring Rules**
   ```typescript
   // In calculateScore():
   if (newFeatureIssues.length > 0) {
     score -= 8 * newFeatureIssues.length
   }
   ```

3. **Add Fraud Detection**
   ```typescript
   // In detectFraud():
   if (impossibleNewFeatureUsage) {
     indicators.push('Impossible feature usage')
   }
   ```

### Adding Tournament Support

1. **Create Tournament Store** (optional separate store)
2. **Add Tournament Page** (`src/app/tournament/page.tsx`)
3. **Update Contract Interaction** (`src/lib/contracts.ts`)
4. **Add Entry Fee Check** in `checkTournamentEligibility()`

## Testing Strategy

### Unit Tests

```bash
# Run all tests
npm run test

# Run specific test file
npm run test -- src/lib/socket.ts

# Watch mode (auto-rerun on changes)
npm run test -- --watch
```

**Test Files to Create:**

- `src/lib/__tests__/replay.test.ts` - Verification logic
- `src/lib/__tests__/matchValidator.test.ts` - Anti-cheat
- `src/lib/__tests__/web3.test.ts` - Blockchain interaction
- `src/store/__tests__/useMatchStore.test.ts` - State management

### E2E Tests

```bash
# Run Playwright E2E tests
npm run test:e2e

# Run single spec
npm run test:e2e -- game.spec.ts

# Debug mode
npm run test:e2e -- --debug
```

**Test Scenarios:**

1. **Authentication Flow**
   - Connect wallet via Privy
   - Play as guest
   - Disconnect and reconnect

2. **Match Flow**
   - Start match
   - Send inputs (move, pass, shoot)
   - Finish match
   - Verify results

3. **Anti-Cheat**
   - Normal gameplay (should pass)
   - Spam actions (should flag)
   - Impossible stats (should reject)

4. **Verification**
   - Verify legitimate match
   - Detect hash mismatch
   - Detect fraud patterns

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (`npm run test`)
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] No ESLint warnings (`npm run lint`)
- [ ] All environment variables set
- [ ] Contract addresses updated (mainnet)
- [ ] Socket.IO server deployed
- [ ] Privy app ID configured for production domain
- [ ] Smart contracts deployed and verified on Base
- [ ] IPFS gateway configured (Pinata or alternative)
- [ ] The Graph subgraph deployed (optional, for indexing)

### Environment Configuration

**Development (.env.local)**
```
NEXT_PUBLIC_PRIVY_APP_ID=<dev-app-id>
NEXT_PUBLIC_BASE_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

**Production (.env.production)**
```
NEXT_PUBLIC_PRIVY_APP_ID=<prod-app-id>
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_SOCKET_URL=https://api.bassball.game/socket
NEXT_PUBLIC_MATCH_REGISTRY_ADDRESS=<mainnet-address>
NEXT_PUBLIC_PLAYER_CARD_ADDRESS=<mainnet-address>
```

### Deploy to Vercel

```bash
# Authenticate with Vercel
npm i -g vercel
vercel login

# Deploy to production
vercel --prod

# Set environment variables in dashboard
# Settings → Environment Variables
```

### Deploy to AWS / GCP / Heroku

```bash
# Build for production
npm run build

# Start production server
npm run start

# Or use Docker
docker build -t bass-ball .
docker run -p 3000:3000 bass-ball
```

### Post-Deployment

- [ ] Test all pages load
- [ ] Verify Privy login works
- [ ] Test match flow end-to-end
- [ ] Verify contract interactions
- [ ] Monitor error logs (Sentry, etc)
- [ ] Check performance (Vercel Analytics)
- [ ] Verify mobile responsiveness

## Troubleshooting

### Common Issues & Solutions

#### Issue: "Cannot find module '@privy-io/react-auth'"
```bash
# Solution: Install Privy
npm install @privy-io/react-auth
```

#### Issue: "Socket.IO connection refused"
```bash
# Cause: Socket.IO server not running
# Solution: Start server in separate terminal
npm run dev:socket

# Or configure correct URL in .env.local
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

#### Issue: "Contract address is not defined"
```bash
# Cause: Environment variables not set
# Solution: Edit .env.local with contract addresses
NEXT_PUBLIC_MATCH_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_PLAYER_CARD_ADDRESS=0x...
```

#### Issue: "Phaser game not rendering"
```bash
# Cause: DOM element not found
# Solution: Verify GameCanvas component is mounted
# Check browser console for errors
# Verify parent div exists with id="phaser-container"
```

#### Issue: "Cannot read property 'wallet' of null"
```bash
// Cause: user not loaded yet (Privy loading)
// Solution: Add ready check in components
if (!ready) return <Loading />
if (!user) return <NotConnected />
```

#### Issue: "Verification always fails"
```bash
// Cause: Incorrect hash computation
// Solution: Verify hash algorithm matches
// - Check Keccak256 implementation
// - Verify input serialization
// - Compare with on-chain hash
```

### Performance Optimization

**If game is lagging:**

1. **Reduce physics calculations**
   ```typescript
   // In phaser.ts
   arcade: { debug: false }  // Disable debug rendering
   ```

2. **Optimize Socket.IO updates**
   ```typescript
   // Send updates at 30Hz instead of 60Hz if needed
   const shouldUpdate = tick % 2 === 0
   ```

3. **Enable compression**
   ```typescript
   // socket.ts
   socket = io(url, { 
     transportOptions: {
       polling: { extraHeaders: { compression: 'gzip' } }
     }
   })
   ```

4. **Use production build**
   ```bash
   npm run build
   npm run start
   ```

### Debugging

**Enable debug mode:**

```bash
# Add to .env.local
NEXT_PUBLIC_DEBUG_REQUESTS=true
NEXT_PUBLIC_LOG_LEVEL=debug
```

**Browser DevTools:**

- Open DevTools (F12)
- Check Console tab for errors
- Monitor Network tab for API calls
- Check Application → Local Storage for game state
- Use React DevTools to inspect component props

**Server Logging:**

```typescript
// In socket.ts
if (process.env.NEXT_PUBLIC_DEBUG_REQUESTS === 'true') {
  console.log('[Socket.IO]', event, data)
}
```

---

**Happy Developing! ⚽🔗**

For questions, open an issue on GitHub or join our Discord community.
