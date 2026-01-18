# Bass Ball - Web3 Football Game MVP

A competitive, skill-based football game on Base chain with trustless match verification, gasless NFT rewards, and an 11-layer anti-cheat system.

## 🎮 Game Overview

Bass Ball is a real-time PvP football game built entirely on Web3 principles:

- **Server-Authoritative 60Hz Matches**: Real-time gameplay with server authority (client sends inputs only)
- **Trustless Verification**: Match results recorded on-chain via Keccak256 hashing + IPFS
- **No Pay-to-Win**: Pure skill competition. Wallet size doesn't determine power
- **Gasless NFT Rewards**: Win your first match, mint an NFT for free using Paymaster
- **ELO Rating System**: Fair rating algorithm that rewards wins against stronger opponents
- **11-Layer Anti-Cheat**: Sophisticated fraud detection system

## 🔧 Tech Stack

### Frontend
- **Next.js 14** - App Router, Server Components, TypeScript strict mode
- **Phaser.js 3** - 2D game engine (60Hz, physics simulation)
- **TailwindCSS** - Responsive UI styling
- **Zustand** - State management (match state, player profile, UI)
- **Socket.IO Client** - Real-time communication (60Hz tick rate)

### Web3 & Authentication
- **Viem** - Type-safe blockchain interaction (Base chain)
- **Wagmi** - React hooks for Web3
- **RainbowKit** - Wallet connection UI
- **Privy** - Email + wallet authentication
- **Base Chain** - L2 Ethereum chain (chainId 8453)

### Smart Contracts
- **ERC-721** - Team NFTs (soul-bound, non-transferable)
- **ERC-1155** - Player Cards (5 rarity tiers, cosmetics)
- **Match Registry** - On-chain match storage + verification
- **Paymaster** - Gasless transaction sponsorship

### Data & Verification
- **Keccak256** - Deterministic match hashing
- **IPFS** - Decentralized replay storage (Pinata Gateway)
- **The Graph** - Indexing (leaderboards, stats)

## 📁 Project Structure

```
bass-ball/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with Privy provider
│   │   ├── page.tsx            # Landing page (home)
│   │   ├── game/
│   │   │   └── page.tsx        # Game page (match screen)
│   │   ├── profile/
│   │   │   └── page.tsx        # Player profile page
│   │   └── globals.css         # Tailwind styles
│   │
│   ├── components/
│   │   ├── GameCanvas.tsx      # Phaser game container
│   │   ├── MatchHUD.tsx        # Score, timer, controls overlay
│   │   ├── WalletButton.tsx    # Privy auth button
│   │   ├── MatchResultModal.tsx# Result display + verification
│   │   └── FairnessValidator.tsx # Validation report modal
│   │
│   ├── lib/
│   │   ├── phaser.ts           # Phaser game setup + MatchScene
│   │   ├── socket.ts           # Socket.IO client + events
│   │   ├── web3.ts             # Viem client + contract ABIs
│   │   ├── replay.ts           # Match replay verification (6-step)
│   │   ├── contracts.ts        # Contract interaction helpers
│   │   ├── matchValidator.ts   # Anti-cheat validation (4 layers)
│   │   └── FairnessValidator.tsx# Validation UI component
│   │
│   ├── store/
│   │   └── useMatchStore.ts    # Zustand store (11 state properties)
│   │
│   └── types/
│       └── match.ts            # Core TypeScript interfaces
│
├── public/
│   ├── assets/                 # Phaser sprites + images
│   ├── nft/                    # NFT card images
│   └── teams/                  # Team logos
│
├── .env.example                # Environment variables template
├── next.config.ts              # Next.js configuration
├── tailwind.config.ts          # Tailwind customization
├── tsconfig.json               # TypeScript strict mode
├── package.json                # Dependencies
└── README.md                   # This file

```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Privy account (https://console.privy.io/)
- Base chain wallet (any EVM wallet works)
- Socket.IO server running (default: localhost:3001)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/bass-ball.git
cd bass-ball

# Install dependencies
npm install

# Create .env.local from .env.example
cp .env.example .env.local

# Edit .env.local with your configuration
# - Add NEXT_PUBLIC_PRIVY_APP_ID from Privy console
# - Add contract addresses (or use mock addresses for demo)
# - Set Socket.IO server URL

# Run development server
npm run dev

# Open browser to http://localhost:3000
```

### Environment Variables

Key variables to configure:

```env
# Authentication (Required)
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id

# Blockchain (Base Mainnet)
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_MATCH_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_PLAYER_CARD_ADDRESS=0x...

# Real-Time (Socket.IO)
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# Storage (IPFS)
NEXT_PUBLIC_IPFS_GATEWAY=https://gateway.pinata.cloud
```

## 🎮 Game Flow

### 1. Authentication (Landing Page)
- User connects wallet via Privy OR plays as guest
- Player profile created with initial stats
- ELO rating starts at 1000

### 2. Matchmaking (Game Page)
- Player queue enters waiting pool
- Server matches players of similar skill
- Both players accept match in 10-second countdown

### 3. Match (60Hz Real-Time)
- **Duration**: 30 minutes
- **Tick Rate**: 60Hz (16.67ms per tick)
- **Authority**: Server-authoritative (prevents cheating)
- **Input**: Client sends actions (move, pass, shoot, tackle, sprint)
- **Feedback**: Server sends match state updates
- **Playable Modes**: 5v5 football

### 4. Match End
- Match finishes or time expires
- Results stored locally + on-chain
- Anti-cheat system analyzes inputs
- Verification status displayed

### 5. Verification (Result Modal)
- 6-step trustless verification process
- Compare computed hash vs on-chain hash
- Display fraud indicators if detected
- Show verification time + input count

### 6. NFT Rewards
- First win unlocks "First Victory" NFT
- Gasless mint via Paymaster (0 gas)
- NFT stored in player's wallet
- Can be traded or equipped as cosmetic

### 7. Leaderboard & Rating
- ELO rating updates based on opponent rating
- Win vs higher-rated = +25 points
- Loss vs lower-rated = -15 points
- Climb global leaderboards via The Graph

## 🔒 Security & Verification

### Trustless Match Verification (6-Step)

1. **Fetch Replay** - Download match inputs from IPFS
2. **Compute Hash** - Keccak256(inputs) locally
3. **Compare Hash** - Check against on-chain record
4. **Validate Inputs** - Verify timestamp monotonicity, action validity
5. **Detect Fraud** - Check for impossible goals, input clustering, stats spikes
6. **Generate Report** - Display verification result to player

### Anti-Cheat System (11 Layers)

1. **Reasonableness** - Goal counts, duration, assists plausibility
2. **Consistency** - Stats vs duration, scoring pace, contribution ratios
3. **Anomaly Detection** - Z-score analysis vs player history (±3σ)
4. **Comparison** - Trend analysis, win streaks, performance spikes
5. **Fraud Detection** - Impossible actions, replay manipulation
6. **Rate Limiting** - Max wins/hour, minimum match duration
7. **Input Validation** - Timestamp ordering, action parameters
8. **State Comparison** - Client state vs server state divergence
9. **Timing Analysis** - Input clustering, reaction time patterns
10. **Statistical Anomalies** - Unusual stat distributions
11. **Reputation System** - Track repeat offenders, escalate penalties

### Smart Contract Security

- **Match Registry**: Records match hash + metadata immutably
- **Verification**: On-chain hash comparison (impossible to falsify)
- **Soul-Bound NFTs**: Team NFTs cannot be transferred (prevent account takeover)
- **Paymaster**: Uses OpenGSN for gasless sponsorship (trusted relay)

## 💰 Economics (Fair-Play Verified)

### Revenue Model (No Pay-to-Win)

| Source | Monthly | Notes |
|--------|---------|-------|
| **Cosmetic NFTs** | $80,000 | Jersey, animations, effects |
| **Tournament Entry Fees** | $35,000 | 1-25 USDC, skill-gated |
| **Battle Pass** | $12,000 | Seasonal progression |
| **Sponsorships** | $3,000 | In-game ad integrations |
| **TOTAL** | **$130,000** | **100% from cosmetics/fees, 0% from power** |

### Player Economics

- **First Win NFT**: Gasless mint (Paymaster sponsored)
- **Tournament Entry**: 1-25 USDC based on rating
- **Cosmetic Prices**: 5-50 USDC per item
- **Rewards**: Cosmetics earned via cosmetic crafting (no tokens/money)

## 🎯 Core Systems

### 1. Match State Management (Zustand)

```typescript
// 11 state properties
currentMatch: MatchState
matchResult: MatchResult
isConnected: boolean
playerId: string
playerProfile: PlayerProfile
isGuest: boolean
walletAddress: string
isMatchStarted: boolean
isMatchEnded: boolean
showVerification: boolean
verificationStatus: 'idle' | 'verifying' | 'verified' | 'failed'
```

### 2. Real-Time Communication (Socket.IO)

```typescript
// 9 events from server
Events: match:start, match:state, match:end, match:error, ping

// 3 events to server
Emitters: match:join, match:input, match:leave, pong
```

### 3. Game Scene (Phaser)

```typescript
// Field: 105x68 (FIFA standard)
// Players: 5v5 (10 total)
// Ball physics: Arcade physics with gravity
// Input: WASD + mouse or gamepad
// Update: 60Hz via Phaser update loop
```

### 4. Blockchain Integration (Viem)

```typescript
// Read: Get match from registry
getMatchOnChain(matchId): MatchResult

// Write: Record match (backend only)
recordMatch(matchId, result, hash)

// Verify: Compare hashes
verifyMatchResult(matchId, computedHash)
```

## 📊 Type System (TypeScript Strict)

Core interfaces in `src/types/match.ts`:

- **PlayerInput** - Single action (tick, action, params, timestamp)
- **MatchState** - Full game snapshot (teams, ball, score, seed)
- **MatchResult** - Complete match record (for verification)
- **VerificationResult** - Hash comparison + fraud details
- **PlayerProfile** - User data (stats, rating, NFTs, history)
- **GameConfig** - Match settings (field size, duration, tick rate)

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage

# Type checking
npm run typecheck

# Linting
npm run lint

# Format code
npm run format
```

## 📚 Documentation Files

Full documentation available in dedicated files:

| File | Purpose | Sections |
|------|---------|----------|
| `MATCH_REPLAY_VERIFICATION.md` | Trustless verification | 6-step process, hash computation, IPFS storage, fraud detection |
| `REWARD_PHILOSOPHY.md` | Fair-play framework | Tournament gating, cosmetic system, governance, revenue model |
| `INTEGRATION_EXAMPLES.ts` | Anti-cheat usage | 7-step integration guide with code examples |

## 🚢 Deployment

### Development
```bash
npm run dev  # Start on http://localhost:3000
```

### Production
```bash
npm run build
npm run start
```

### Deploy to Vercel
```bash
vercel deploy
```

Configure environment variables in Vercel dashboard:
- `NEXT_PUBLIC_PRIVY_APP_ID`
- `NEXT_PUBLIC_BASE_RPC_URL`
- `NEXT_PUBLIC_SOCKET_URL` (production Socket.IO server)
- Contract addresses (mainnet)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Code Standards
- TypeScript strict mode (no `any`)
- ESLint + Prettier configured
- 100% test coverage for critical paths
- Document complex logic with comments

## 📄 License

MIT License - See LICENSE file for details

## 🔗 Links

- **Website**: https://bassball.game
- **GitHub**: https://github.com/yourusername/bass-ball
- **Docs**: https://docs.bassball.game
- **Discord**: https://discord.gg/bassball
- **Twitter**: https://twitter.com/bass_ball_game

## 📞 Support

- **Documentation**: https://docs.bassball.game
- **Discord**: https://discord.gg/bassball
- **Email**: support@bassball.game
- **GitHub Issues**: https://github.com/yourusername/bass-ball/issues

## 🙏 Acknowledgments

- Built on **Base** (Coinbase's Layer 2)
- Uses **Viem** for Web3 integration
- Match engine powered by **Phaser.js**
- Authentication via **Privy**
- Real-time via **Socket.IO**

---

**Bass Ball MVP** - The future of Web3 gaming is trustless, fair, and competitive. ⚽🔗
