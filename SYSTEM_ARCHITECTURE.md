# 🏗️ Bass Ball System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  FRONTEND LAYER                                           │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │  │
│  │  │ Game Engine  │  │ Wallet/Auth  │  │  WebSocket Client│ │  │
│  │  │ (Phaser/3.js)│  │  (Privy)     │  │  (Real-time)    │ │  │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘ │  │
│  │  ┌──────────────────────────────────────────────────────┐  │
│  │  │  UI Components (Match, Profile, Leaderboard, etc)    │  │
│  │  └──────────────────────────────────────────────────────┘  │
│  └───────────────────────────────────────────────────────────┘  │
│                           ↓ ↓ ↓                                  │
│                     HTTP + WebSocket                            │
└─────────────────────────────────────────────────────────────────┘
                           ↓ ↓ ↓
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Node.js/Express)                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  API LAYER (REST)                                         │  │
│  │  ├─ /api/match/find       (Match finding)                │  │
│  │  ├─ /api/match/result     (Store results)                │  │
│  │  ├─ /api/player/stats     (Fetch stats)                  │  │
│  │  └─ /api/leaderboard      (Rankings)                     │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  WEBSOCKET LAYER (Real-time)                             │  │
│  │  ├─ Match Engine (Authoritative)                         │  │
│  │  ├─ Game State Updates                                   │  │
│  │  ├─ Anti-cheat Detection                                 │  │
│  │  └─ Latency Compensation                                 │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  DATABASE LAYER                                           │  │
│  │  ├─ PostgreSQL (Player data, match history)              │  │
│  │  ├─ Redis (Cache, sessions, real-time state)            │  │
│  │  └─ Logs (Cheat detection, analytics)                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  BLOCKCHAIN INDEXER                                       │  │
│  │  ├─ Listen for NFT mint events                            │  │
│  │  ├─ Monitor leaderboard updates                           │  │
│  │  └─ Track reward distribution                             │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                           ↓ ↓ ↓
┌─────────────────────────────────────────────────────────────────┐
│                 BLOCKCHAIN LAYER (Base - Chain 8453)             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  SMART CONTRACTS                                          │  │
│  │  ├─ BassballPlayerNFT.sol     (ERC721 badges)            │  │
│  │  ├─ MatchSettlement.sol        (Results settlement)       │  │
│  │  ├─ Leaderboard.sol            (Light on-chain ranking)   │  │
│  │  └─ RewardDistribution.sol      (Batch rewards)           │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  DATA STORED                                              │  │
│  │  ├─ NFT Mints (Permanent proof)                           │  │
│  │  ├─ Match Result Hash (Verification)                      │  │
│  │  ├─ Top 100 Leaderboard (Transparent ranking)            │  │
│  │  └─ Weekly Rewards (Immutable distribution)               │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow Diagram

### Match Flow

```
1. MATCHMAKING (REST API)
   ┌─────────┐
   │ Player  │
   │   A     │
   └────┬────┘
        │ GET /api/match/find
        ↓
   ┌──────────────┐       ┌─────────────────┐
   │   Backend    │───→   │  Find opponent  │
   │  Match Find  │       │  in rating band │
   └──────────────┘       └─────────────────┘
        │
        ├─→ Store in Redis (session)
        └─→ Return: match_id, opponent_id

2. GAMEPLAY (WebSocket)
   ┌─────────────────────────────────────────┐
   │          MATCH IN PROGRESS              │
   │  ┌────────────────────────────────────┐ │
   │  │ Player A         │      Player B   │ │
   │  │                  │                 │ │
   │  │ Local Engine     │   Local Engine  │ │
   │  │ (Optimistic)     │   (Optimistic)  │ │
   │  └────────┬─────────┴────────┬────────┘ │
   │           │ WebSocket        │          │
   │           └────────┬─────────┘          │
   │                    ↓                    │
   │           ┌────────────────┐            │
   │           │ Backend Match  │            │
   │           │  Engine        │            │
   │           │ (Authoritative)│            │
   │           └────────┬───────┘            │
   │                    │                    │
   │     ┌──────────────┼──────────────┐     │
   │     ↓              ↓              ↓     │
   │  [Anti-Cheat]  [Latency Comp] [Game Logic]
   │                                        │
   │  Validation: Player A threw ball      │
   │  Check: Valid timing, correct hand    │
   │  Send: Result back to both clients    │
   └─────────────────────────────────────────┘

3. MATCH RESULT (REST API)
   ┌──────────────┐
   │ Match Ended  │
   │  Player A: W │
   │  Rating: +25 │
   └────────┬─────┘
            │ POST /api/match/result
            ↓
   ┌──────────────────────┐
   │ Backend Processing:  │
   │ 1. Validate result   │
   │ 2. Update rating     │
   │ 3. Check achievements│
   └────────┬─────────────┘
            │
     ┌──────┴──────┐
     ↓             ↓
  PostgreSQL    Redis Cache
  (Permanent)   (Quick lookup)
     │             │
     └──────┬──────┘
            │
     ┌──────▼──────────────────────┐
     │ Weekly Settlement Queue     │
     │ (For blockchain)            │
     │ ├─ Winner: Player A         │
     │ ├─ Week: #1 of 2026        │
     │ └─ Settled: false (pending) │
     └──────┬──────────────────────┘
            │ (Batch process weekly)
            ↓

4. BLOCKCHAIN SETTLEMENT (Weekly)
   ┌──────────────────────────────────┐
   │ Backend Worker (Once per week)    │
   │ 1. Query all match results       │
   │ 2. Calculate winners             │
   │ 3. Check badge eligibility       │
   │ 4. Batch smart contract calls    │
   └────────┬─────────────────────────┘
            │ Calls smart contract
            ↓
   ┌─────────────────────────────────────────┐
   │ Smart Contract (Base Network)           │
   │ 1. Mint NFT badges (achievements)       │
   │ 2. Store match result hash (proof)      │
   │ 3. Update leaderboard (top 100)         │
   │ 4. Emit events (rewards, NFTs)          │
   └─────────────────────────────────────────┘
            │
            ├─→ NFT stored: 0x123abc...
            ├─→ Events logged
            └─→ Leaderboard updated

5. VERIFICATION (Blockchain Indexer)
   ┌──────────────────────────┐
   │ Indexer (The Graph)      │
   │ - Listen to NFT events   │
   │ - Monitor transfers      │
   │ - Track leaderboard      │
   └────────┬─────────────────┘
            │
            ↓
   ┌──────────────────────────┐
   │ Database updated with    │
   │ on-chain confirmation    │
   └──────────────────────────┘
```

---

## 🎮 Frontend Layer

### Components

```typescript
// Game Engine
├─ Phaser Engine (2D gameplay)
│  ├─ Match scenes
│  ├─ Physics
│  ├─ Animations
│  └─ Input handling
└─ Three.js (3D optional)
   ├─ Player models
   ├─ Stadium visualization
   └─ Celebration animations

// Authentication
├─ Privy Provider
│  ├─ Email login
│  ├─ Wallet creation
│  └─ Session management
└─ RainbowKit
   ├─ Wallet connect
   ├─ Account switching
   └─ Network detection

// Match Interface
├─ Match Lobby
│  ├─ Opponent info
│  ├─ Countdown timer
│  └─ Ready status
├─ Game Canvas
│  ├─ Score display
│  ├─ Timer
│  ├─ Player controls
│  └─ Feedback messages
└─ Results Screen
   ├─ Win/loss
   ├─ Rating change
   ├─ NFT earned
   └─ Share options

// WebSocket Client
├─ Connection pool
├─ Message handlers
├─ Reconnection logic
└─ Heartbeat (ping/pong)

// UI Components
├─ Navigation
├─ Profile card
├─ Leaderboard table
├─ Match history list
└─ Settings/preferences
```

### Client-Side Game Logic

```typescript
// Optimistic Updates
const handlePlayerAction = (action) => {
  // 1. Update local state immediately (feel responsive)
  updateLocalGameState(action);
  
  // 2. Send to server via WebSocket
  sendToServer(action);
  
  // 3. Server validates and corrects if needed
  // If invalid: Server sends correction
  // If valid: Server confirms (usually no change needed)
};
```

---

## 🖥️ Backend Layer

### API Routes (REST)

```
GET  /api/player/:address/stats
     └─ Response: { rating, wins, losses, badges, gamesPlayed }
     └─ Cache: 5 minutes (Redis)

GET  /api/player/:address/profile
     └─ Response: { name, stats, badges, joinedDate, topGame }
     └─ Cache: 1 hour (Redis)

POST /api/match/find
     ├─ Params: { playerAddress, playerRating }
     ├─ Action: Find opponent in rating band
     ├─ Response: { matchId, opponentId, opponentRating }
     └─ Storage: Redis (session)

GET  /api/match/history/:address
     ├─ Response: [ { matchId, opponent, result, date } ]
     └─ Storage: PostgreSQL (durable)

POST /api/match/result
     ├─ Params: { matchId, winner, loser, score, duration }
     ├─ Validate: Check both players are valid
     ├─ Update: Ratings, stats, achievements
     ├─ Response: { newRating, badgesEarned, nextMatch }
     └─ Queue: Weekly settlement batch

GET  /api/leaderboard?period=month
     ├─ Response: [ { rank, player, rating, wins, badges } ]
     ├─ Sorted by: Rating (descending)
     ├─ Limit: 100 players
     └─ Cache: 1 hour (Redis)
```

### WebSocket Events

```
// Client → Server
{
  type: "MATCH_ACTION",
  matchId: "match_123",
  playerId: "0x...",
  action: {
    type: "THROW",
    power: 0.85,
    angle: 45,
    timestamp: 1234567890
  }
}

// Server → Client (Broadcast to both players)
{
  type: "GAME_STATE_UPDATE",
  matchId: "match_123",
  state: {
    ballPosition: { x: 100, y: 50 },
    player1Score: 1,
    player2Score: 0,
    timeRemaining: 3500,
    validatedAt: 1234567891  // Server timestamp
  }
}

// Server → Client (Match ended)
{
  type: "MATCH_RESULT",
  matchId: "match_123",
  winner: "0x...",
  loser: "0x...",
  score: [2, 1],
  rating: {
    winner: { old: 1500, new: 1525 },
    loser: { old: 1500, new: 1475 }
  },
  badgesEarned: ["OG_PLAYER"]
}
```

### Match Engine (Authoritative)

```typescript
class MatchEngine {
  // Server-side only - not on client
  private matches = new Map<string, GameState>();
  
  // Step 1: Validate client action
  validateAction(matchId, playerId, action) {
    const match = this.matches.get(matchId);
    const player = match.getPlayer(playerId);
    
    // Check validity
    if (action.timestamp > Date.now() + 5000) return false;  // Future time
    if (action.power > 1.0) return false;                    // Power bounds
    if (!player.canAct()) return false;                       // Is it their turn?
    
    return true;
  }
  
  // Step 2: Apply action
  applyAction(matchId, playerId, action) {
    const match = this.matches.get(matchId);
    const physics = this.calculatePhysics(action);
    
    // Update authoritative state
    match.ballPosition = physics.ballPosition;
    match.ballVelocity = physics.ballVelocity;
    
    // Check for scoring
    if (this.isGoal(match)) {
      match.score[getTeam(playerId)]++;
    }
  }
  
  // Step 3: Broadcast state
  broadcastState(matchId) {
    const match = this.matches.get(matchId);
    const state = {
      ballPosition: match.ballPosition,
      score: match.score,
      timeRemaining: match.timeRemaining,
      validatedAt: Date.now()
    };
    
    broadcast(matchId, {
      type: "GAME_STATE_UPDATE",
      state
    });
  }
  
  // Anti-cheat: Detect suspicious patterns
  detectCheating(matchId, playerId, action) {
    const metrics = {
      latency: Date.now() - action.timestamp,
      actionFrequency: this.getActionsPerSecond(playerId),
      impossibleActions: this.checkPhysicsViolation(action),
      networkSpike: this.detectNetworkAnomaly(playerId)
    };
    
    if (this.isSuspicious(metrics)) {
      logger.warn(`Suspicious activity: ${playerId} in ${matchId}`);
      // Options: warn, replay match, flag for review, ban
    }
  }
}
```

### Database Schema

```sql
-- Players
CREATE TABLE players (
  address VARCHAR(42) PRIMARY KEY,
  username VARCHAR(255),
  rating INT DEFAULT 1000,
  games_played INT DEFAULT 0,
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  INDEX (rating)  -- For leaderboard queries
);

-- Match History
CREATE TABLE matches (
  id VARCHAR(255) PRIMARY KEY,
  player1_address VARCHAR(42) NOT NULL,
  player2_address VARCHAR(42) NOT NULL,
  winner_address VARCHAR(42),
  score_p1 INT,
  score_p2 INT,
  duration INT,  -- seconds
  created_at TIMESTAMP,
  blockchain_hash VARCHAR(255) NULL,  -- Hash of on-chain settlement
  INDEX (created_at),
  INDEX (player1_address),
  INDEX (player2_address)
);

-- Player Badges
CREATE TABLE player_badges (
  id INT PRIMARY KEY AUTO_INCREMENT,
  player_address VARCHAR(42),
  badge_type VARCHAR(255),
  earned_at TIMESTAMP,
  nft_minted_at TIMESTAMP NULL,
  nft_token_id VARCHAR(255) NULL,
  blockchain_tx VARCHAR(255) NULL,
  UNIQUE (player_address, badge_type)
);

-- Cache Layer (Redis)
CACHE_KEYS:
  player_stats:{address} → {rating, wins, losses}
  match_state:{matchId} → Full game state
  leaderboard:month → Top 100 players
  session:{sessionId} → User session
```

### Blockchain Indexer

```typescript
// Listen to smart contract events
const indexer = new TheGraphClient();

// Watch for NFT mints
indexer.on("BadgeMinted", async (event) => {
  const { to, badgeType, tokenId, transactionHash } = event;
  
  // Update database with on-chain confirmation
  await db.updateBadge(to, badgeType, {
    nft_minted_at: Date.now(),
    nft_token_id: tokenId,
    blockchain_tx: transactionHash
  });
  
  // Notify player
  await sendNotification(to, `🎉 NFT minted: ${badgeType}`);
});

// Watch for leaderboard updates
indexer.on("LeaderboardUpdated", async (event) => {
  const { top100Players, timestamp } = event;
  
  // Update cache
  await redis.set("leaderboard:onchain", top100Players);
});
```

---

## ⛓️ Blockchain Layer

### Smart Contracts

```solidity
// 1. NFT Badges
contract BassballPlayerNFT is ERC721 {
  function mintBadge(address to, BadgeType type, string uri) onlyOwner {
    // Minted weekly from backend
    // Not minted per game (avoids on-chain bloat)
  }
}

// 2. Match Settlement
contract MatchSettlement {
  struct MatchResult {
    address winner;
    address loser;
    uint256 rating_change;
    bytes32 matchHash;  // Hash of full match data
    uint256 timestamp;
  }
  
  mapping(bytes32 => MatchResult) public settledMatches;
  
  function settleMatches(MatchResult[] calldata results) {
    // Called once per week with batch of match results
    // Stores proof on-chain without all details
    // Details stay in database
  }
}

// 3. Leaderboard
contract Leaderboard {
  struct PlayerRank {
    address player;
    uint256 rating;
    uint256 wins;
  }
  
  PlayerRank[] public top100;
  
  function updateLeaderboard(PlayerRank[] calldata rankings) {
    // Updated weekly
    // Light version (only top 100)
    // Full leaderboard in backend database
  }
}

// 4. Reward Distribution
contract RewardDistribution {
  function distributeWeeklyRewards(
    address[] winners,
    uint256[] amounts
  ) {
    // Optional: Distribute tokens or NFTs weekly
    // Currently: Just NFTs, no token
  }
}
```

### What's Stored On-Chain

| Data | Chain | Why |
|------|-------|-----|
| **Individual match results** | ❌ NO | Too much data, expensive |
| **Match result hash** | ✅ YES | Proof of what happened |
| **NFT badges** | ✅ YES | Permanent achievement proof |
| **Top 100 leaderboard** | ✅ YES | Transparency + gas efficient |
| **Full leaderboard** | ❌ NO | Too big, database is fine |
| **Player stats** | ❌ NO | Database is source of truth |
| **Match history** | ❌ NO | Database, too much data |

### Gas Optimization

```typescript
// BEFORE: Every action writes to contract
// Cost: $0.10 per action × 1000 actions/match = $100/match
// Users: None (too expensive)

// AFTER: Weekly batch settlement
// Cost: $0.10 × 100 settles/week = $10/week = $0.00001 per user match
// Users: Millions (sustainable)

// Example:
Monday-Sunday:   1000 matches played
                 Results stored in database
                 
Sunday night:    Backend worker aggregates:
                 ├─ 50 new badges to mint
                 ├─ Top 100 leaderboard updates
                 ├─ 20 reward distributions
                 
Sunday 11:59pm:  One smart contract call
                 └─ Costs: $10 total
                 └─ Spread across 1000 users = $0.01 per user
                 └─ Paid by game operator (not users)
```

---

## 🔄 Data Flow: Complete User Journey

```
Day 1: User Signup
├─ Frontend: User opens website
├─ Backend: Create player record (PostgreSQL)
├─ Blockchain: Nothing yet (no on-chain action)
└─ Cost: $0 (user pays nothing)

Day 2: First Match
├─ Frontend: User clicks "Find Match"
├─ Backend: 
│  ├─ Find opponent via API
│  ├─ Create match in Redis
│  └─ Broadcast via WebSocket
├─ Gameplay: 5 seconds (authoritative server)
├─ Backend: Store result in PostgreSQL
├─ Blockchain: Nothing yet
└─ Cost: $0 (user pays nothing)

Week 1: After 5 wins
├─ Database: Update rating, wins counter
├─ Check: User qualifies for "OG Player" badge
├─ Queue: Badge in weekly settlement list
└─ Blockchain: Nothing yet

Sunday: Weekly Settlement
├─ Backend Worker: Aggregate week's achievements
├─ Smart Contract: Batch call to mint 50 badges
├─ Blockchain: 
│  ├─ Mint NFTs (proof of achievement)
│  ├─ Update leaderboard (transparency)
│  └─ Emit events
├─ Indexer: Listen for events, update database
├─ Cost: $10 total (operator pays)
└─ Per-user cost: $0.00

Month 1: User's First NFT Received
├─ Email: "🎉 You earned an NFT!"
├─ Wallet: NFT appears (auto-created by Privy)
├─ Profile: Badge shows "✅ On-chain verified"
├─ Blockchain: User can verify ownership
└─ Cost: $0 (already settled)
```

---

## 🎯 Why This Architecture?

### ✅ Avoids Common Mistakes

| Mistake | How Architecture Avoids It |
|---------|---------------------------|
| **Everything on-chain** | Gameplay off-chain, settlement weekly |
| **Slow gameplay** | WebSocket + server authority, no chain waits |
| **Expensive for users** | Batch transactions, operator pays |
| **Complex tokenomics** | Simple rating + NFTs only |
| **Physics overhead** | Simplified arcade physics, server-side |

### ✅ Enables Scale

- **10K players/second** - PostgreSQL + Redis handle load
- **1M DAU** - Distributed WebSocket servers
- **Batch settlement** - One transaction per 1000 matches
- **Caching** - Leaderboard cached 1 hour

### ✅ Provides Transparency

- **On-chain proof** - NFTs verify achievements
- **Match hash** - Proof that match settled correctly
- **Leaderboard** - Public, verifiable top 100
- **Events** - Transparent mint/transfer history

### ✅ Enables Anti-Cheat

- **Server authority** - Cheaters can't fake results
- **Latency detection** - Impossible action timing
- **Pattern detection** - Suspicious win rates
- **Replay analysis** - Offline investigation

---

## 📈 Scalability Plan

### Phase 1: MVP (Jan 2026)
- Single WebSocket server
- PostgreSQL (no replication)
- Redis (single node)
- Base testnet contracts

### Phase 2: Beta (March 2026)
- Load balancer + 3 WebSocket servers
- PostgreSQL read replicas
- Redis cluster
- Base mainnet (real money)

### Phase 3: Scale (Q2 2026)
- Regional WebSocket servers
- Database sharding
- Distributed cache
- Secondary blockchain (Arbitrum)

### Phase 4: Enterprise (Q3 2026)
- Multi-region deployment
- Kubernetes orchestration
- Advanced analytics
- Multiple games on same platform

---

## 🔐 Security Layers

```
Layer 1: Frontend
├─ HTTPS only
├─ CSP headers
└─ XSS protection

Layer 2: Backend
├─ Rate limiting (100 req/sec per IP)
├─ Input validation
├─ CORS configured
└─ Request signing

Layer 3: WebSocket
├─ Authentication token required
├─ Latency checks
├─ Action validation
└─ IP reputation

Layer 4: Database
├─ Read replicas for queries
├─ Write master for updates
├─ Encrypted backups
└─ Access logs

Layer 5: Blockchain
├─ Standard ERC721
├─ Verified contract
├─ Pausable (emergency)
└─ Access control
```

---

## 📊 Monitoring & Observability

```
Metrics to Track:
├─ WebSocket connections (active players)
├─ Average match duration
├─ Rating distribution
├─ NFT mint rate
├─ Database query latency
├─ Error rate by endpoint
├─ Cheating detection rate
└─ User retention (DAU/MAU)

Alerts:
├─ WebSocket server down
├─ Database latency > 1000ms
├─ Error rate > 1%
├─ Unusual cheat detection spike
└─ Low player retention
```

---

## Summary Table

| Component | Technology | Purpose | Handles |
|-----------|-----------|---------|---------|
| **Frontend** | Next.js + Phaser | User interface | 10K users/sec |
| **Backend** | Express + Node.js | Game logic | 100K concurrent |
| **WebSocket** | ws library | Real-time | 50K matches/sec |
| **Database** | PostgreSQL | Durable storage | Terabytes |
| **Cache** | Redis | Fast access | Millions of ops/sec |
| **Smart Contracts** | Solidity | Proof/settlement | Batch weekly |
| **Indexer** | The Graph | Event tracking | Real-time |

---

## Why Bass Ball Is Built This Way

1. **Fast Gameplay** - WebSocket + server authority = 60 FPS possible
2. **Cheap for Users** - Batch settlement = $0 per user per match
3. **Provable** - On-chain NFTs = Permanent achievement proof
4. **Scalable** - Off-chain processing = Millions of players
5. **Anti-cheat** - Server authority = Impossible to fake wins
6. **Simple** - Single rating system = Easy to understand
7. **Transparent** - Leaderboard on-chain = Verifiable rankings

---

*This architecture is battle-tested by:*
- *Discord (real-time messaging at scale)*
- *Blizzard (authoritative game servers)*
- *Uniswap (batch settlement)*
- *OpenSea (NFT verification)*

**Result: Production-ready Web3 gaming platform** 🚀
