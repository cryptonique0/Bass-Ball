# 📑 Indexing: The Graph Subgraph

## Why The Graph?

### Comparison: Indexing Solutions

| Feature | The Graph ✅ | Etherscan API | Database Only | Custom Indexer |
|---------|------------|---------------|---------------|-----------------|
| **Real-Time** | ✅ Yes | Delayed | Manual | Possible |
| **Historical** | ✅ Yes | Limited | Manual | Complex |
| **Decentralized** | ✅ Yes | No | No | No |
| **Query Language** | GraphQL ✅ | REST | SQL | Custom |
| **Setup Time** | 1 hour | 0 | Hours | Days |
| **Maintenance** | ✅ None | None | High | High |
| **Cost** | Free tier ✅ | Paid | DB cost | Server cost |
| **Gaming Ready** | ✅ Perfect | Limited | Yes | Complex |

**Winner: The Graph** ✅
- Decentralized indexing (no single point of failure)
- GraphQL queries (flexible, efficient)
- Free tier for development
- Automatic updates from blockchain

---

## Installation

```bash
# Install Graph CLI globally
npm install -g @graphprotocol/graph-cli

# Verify installation
graph --version

# Create new subgraph
graph init --studio bass-ball-subgraph

# Or from existing project
graph init bass-ball-subgraph
```

---

## Subgraph Structure

```
bass-ball-subgraph/
├── abis/
│   ├── BassBallTeam.json
│   ├── BassBallPlayerCards.json
│   └── BassBallMatchResults.json
├── schema.graphql          # Entity definitions
├── subgraph.yaml          # Deployment config
├── src/
│   ├── team-mapping.ts     # Team events
│   ├── cards-mapping.ts    # Card events
│   └── results-mapping.ts  # Match result events
└── tests/
    └── *.test.ts
```

---

## Subgraph Configuration

### `subgraph.yaml`

```yaml
specVersion: 0.0.5
schema:
  file: ./schema.graphql

dataSources:
  # Teams (ERC721)
  - kind: ethereum
    name: BassBallTeam
    network: base-mainnet
    source:
      address: "0x..." # Deploy contract address
      abi: BassBallTeam
      startBlock: 0
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      file: ./src/team-mapping.ts
      entities:
        - Team
        - Player
      abis:
        - name: BassBallTeam
          file: ./abis/BassBallTeam.json
      eventHandlers:
        - event: TeamCreated(indexed uint256,indexed address,string,string)
          handler: handleTeamCreated
        - event: TeamUpdated(indexed uint256,uint32,uint32,uint256)
          handler: handleTeamUpdated
        - event: TeamTransferred(indexed uint256,indexed address,indexed address)
          handler: handleTeamTransferred

  # Player Cards (ERC1155)
  - kind: ethereum
    name: BassBallPlayerCards
    network: base-mainnet
    source:
      address: "0x..." # Deploy contract address
      abi: BassBallPlayerCards
      startBlock: 0
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      file: ./src/cards-mapping.ts
      entities:
        - PlayerCard
        - PlayerCardHolder
      abis:
        - name: BassBallPlayerCards
          file: ./abis/BassBallPlayerCards.json
      eventHandlers:
        - event: CardTypeCreated(indexed uint256,string,uint8,uint32)
          handler: handleCardTypeCreated
        - event: CardsMinted(indexed address,indexed uint256,uint256)
          handler: handleCardsMinted
        - event: CardsBurned(indexed address,indexed uint256,uint256)
          handler: handleCardsBurned

  # Match Results
  - kind: ethereum
    name: BassBallMatchResults
    network: base-mainnet
    source:
      address: "0x..." # Deploy contract address
      abi: BassBallMatchResults
      startBlock: 0
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      file: ./src/results-mapping.ts
      entities:
        - MatchResult
        - PlayerStats
        - PlayerRanking
      abis:
        - name: BassBallMatchResults
          file: ./abis/BassBallMatchResults.json
      eventHandlers:
        - event: MatchResultRecorded(indexed uint256,indexed uint256,indexed address,address,address,uint8,uint8,bytes32,uint256)
          handler: handleMatchResultRecorded
        - event: MatchResultSettled(indexed uint256,uint256)
          handler: handleMatchResultSettled
```

---

## Schema Definition

### `schema.graphql`

```graphql
# ==================
# PLAYER
# ==================

type Player @entity {
  id: ID! # Ethereum address
  username: String
  avatar: String
  email: String

  # Stats
  wins: Int!
  losses: Int!
  draws: Int!
  rating: Int!
  
  # On-chain
  teamId: Team
  badges: [Badge!]! @relationship(name: "player_badges")
  cards: [PlayerCardHolder!]! @relationship(name: "player_cards")
  matches: [MatchResult!]! @relationship(name: "player_matches")
  
  # Metadata
  createdAt: BigInt!
  updatedAt: BigInt!
}

# ==================
# TEAMS (ERC721)
# ==================

type Team @entity {
  id: ID! # tokenId
  owner: Player!
  name: String!
  logo: String
  
  # Stats
  wins: Int!
  losses: Int!
  rating: Int!
  totalGoals: Int!
  totalDefense: Int!
  
  # Timestamps
  createdAt: BigInt!
  updatedAt: BigInt!
}

# ==================
# BADGES & NFTs
# ==================

type Badge @entity {
  id: ID! # address-badgeType
  player: Player!
  badgeType: String!
  earnedAt: BigInt!
  nftTokenId: Int
  txHash: String
}

# ==================
# PLAYER CARDS (ERC1155)
# ==================

type PlayerCard @entity {
  id: ID! # cardId
  playerName: String!
  position: Int! # 0=GK, 1=DEF, 2=MID, 3=ST
  rarity: Int! # 0-4
  
  # Stats
  speed: Int!
  strength: Int!
  skill: Int!
  stamina: Int!
  totalStats: Int!
  
  # Metadata
  imageURI: String
  createdAt: BigInt!
  
  # Holders
  holders: [PlayerCardHolder!]! @relationship(name: "card_holders")
  
  # Supply
  totalMinted: Int!
}

type PlayerCardHolder @entity {
  id: ID! # address-cardId
  card: PlayerCard!
  player: Player!
  balance: Int!
  createdAt: BigInt!
  updatedAt: BigInt!
}

# ==================
# MATCH RESULTS
# ==================

type MatchResult @entity {
  id: ID! # resultId
  matchId: Int! # External match ID
  
  # Players
  player1: Player!
  player2: Player!
  winner: Player!
  
  # Scores
  scorePlayer1: Int!
  scorePlayer2: Int!
  
  # Metadata
  duration: Int!
  resultHash: Bytes!
  timestamp: BigInt!
  settled: Boolean!
  
  # Indexing
  createdAt: BigInt!
}

# ==================
# PLAYER STATS & RANKINGS
# ==================

type PlayerStats @entity {
  id: ID! # address
  player: Player!
  
  # Record
  totalMatches: Int!
  wins: Int!
  losses: Int!
  draws: Int!
  
  # Goals
  goalsFor: Int!
  goalsAgainst: Int!
  goalDifference: Int!
  
  # Performance
  winRate: BigDecimal!
  avgGoalsPerGame: BigDecimal!
  
  # Recent
  recentForm: String! # "WLWWL..."
  currentStreak: Int!
  longestStreak: Int!
  
  # Updated
  updatedAt: BigInt!
}

type PlayerRanking @entity {
  id: ID! # "ranking-address"
  player: Player!
  
  # Rank
  rank: Int!
  rating: Int!
  
  # Stats
  wins: Int!
  losses: Int!
  winRate: BigDecimal!
  
  # Period
  season: Int!
  updatedAt: BigInt!
}

# ==================
# TRANSACTIONS & EVENTS
# ==================

type Transaction @entity {
  id: ID! # txHash
  type: String! # "team_created", "match_recorded", "card_minted"
  hash: String!
  from: String!
  to: String
  
  blockNumber: Int!
  timestamp: BigInt!
}
```

---

## Event Handlers

### Teams Mapping

#### `src/team-mapping.ts`

```typescript
import {
  TeamCreated,
  TeamUpdated,
  TeamTransferred,
} from "../generated/BassBallTeam/BassBallTeam";
import { Team, Player, PlayerStats } from "../generated/schema";
import { BigInt } from "@graphprotocol/graph-ts";

/**
 * Handle team creation
 */
export function handleTeamCreated(event: TeamCreated): void {
  const teamId = event.params.teamId.toString();
  const owner = event.params.owner.toHexString();

  // Create or get player
  let player = Player.load(owner);
  if (!player) {
    player = new Player(owner);
    player.username = "";
    player.wins = 0;
    player.losses = 0;
    player.draws = 0;
    player.rating = 1000;
    player.createdAt = event.block.timestamp;
  }
  player.updatedAt = event.block.timestamp;
  player.save();

  // Create team
  let team = new Team(teamId);
  team.owner = owner;
  team.name = event.params.name;
  team.logo = event.params.logo;
  team.wins = 0;
  team.losses = 0;
  team.rating = 1000;
  team.totalGoals = 0;
  team.totalDefense = 0;
  team.createdAt = event.block.timestamp;
  team.updatedAt = event.block.timestamp;
  team.save();
}

/**
 * Handle team stats update
 */
export function handleTeamUpdated(event: TeamUpdated): void {
  const teamId = event.params.teamId.toString();
  let team = Team.load(teamId);

  if (!team) return;

  team.wins = event.params.wins.toI32();
  team.losses = event.params.losses.toI32();
  team.rating = event.params.newRating.toI32();
  team.updatedAt = event.block.timestamp;
  team.save();

  // Update player stats
  updatePlayerStats(team.owner as string, event.block.timestamp);
}

/**
 * Handle team transfer
 */
export function handleTeamTransferred(event: TeamTransferred): void {
  const teamId = event.params.teamId.toString();
  let team = Team.load(teamId);

  if (!team) return;

  const newOwner = event.params.to.toHexString();

  // Create new player if needed
  let player = Player.load(newOwner);
  if (!player) {
    player = new Player(newOwner);
    player.username = "";
    player.wins = 0;
    player.losses = 0;
    player.draws = 0;
    player.rating = 1000;
    player.createdAt = event.block.timestamp;
  }
  player.updatedAt = event.block.timestamp;
  player.save();

  // Update team owner
  team.owner = newOwner;
  team.updatedAt = event.block.timestamp;
  team.save();
}

/**
 * Update player stats from team
 */
function updatePlayerStats(playerAddress: string, timestamp: BigInt): void {
  let stats = PlayerStats.load(playerAddress);
  if (!stats) {
    stats = new PlayerStats(playerAddress);
    stats.player = playerAddress;
    stats.totalMatches = 0;
    stats.wins = 0;
    stats.losses = 0;
    stats.draws = 0;
    stats.goalsFor = 0;
    stats.goalsAgainst = 0;
  }

  stats.updatedAt = timestamp;
  stats.save();
}
```

### Player Cards Mapping

#### `src/cards-mapping.ts`

```typescript
import {
  CardTypeCreated,
  CardsMinted,
  CardsBurned,
} from "../generated/BassBallPlayerCards/BassBallPlayerCards";
import {
  PlayerCard,
  PlayerCardHolder,
  Player,
} from "../generated/schema";
import { BigInt } from "@graphprotocol/graph-ts";

/**
 * Handle new card type creation
 */
export function handleCardTypeCreated(event: CardTypeCreated): void {
  const cardId = event.params.cardId.toString();

  let card = new PlayerCard(cardId);
  card.playerName = event.params.playerName;
  card.position = event.params.rarity.toI32(); // Note: adjust based on actual event
  card.rarity = event.params.rarity.toI32();
  card.speed = 0;
  card.strength = 0;
  card.skill = 0;
  card.stamina = 0;
  card.totalStats = event.params.totalStats.toI32();
  card.createdAt = event.block.timestamp;
  card.totalMinted = 0;
  card.save();
}

/**
 * Handle card minting
 */
export function handleCardsMinted(event: CardsMinted): void {
  const cardId = event.params.cardId.toString();
  const playerAddress = event.params.to.toHexString();
  const quantity = event.params.quantity.toI32();

  // Get or create player
  let player = Player.load(playerAddress);
  if (!player) {
    player = new Player(playerAddress);
    player.username = "";
    player.wins = 0;
    player.losses = 0;
    player.draws = 0;
    player.rating = 1000;
    player.createdAt = event.block.timestamp;
  }
  player.updatedAt = event.block.timestamp;
  player.save();

  // Get card
  let card = PlayerCard.load(cardId);
  if (!card) return;

  // Update card holder
  const holderId = playerAddress + "-" + cardId;
  let holder = PlayerCardHolder.load(holderId);
  if (!holder) {
    holder = new PlayerCardHolder(holderId);
    holder.card = cardId;
    holder.player = playerAddress;
    holder.balance = 0;
    holder.createdAt = event.block.timestamp;
  }

  holder.balance += quantity;
  holder.updatedAt = event.block.timestamp;
  holder.save();

  // Update card supply
  card.totalMinted += quantity;
  card.save();
}

/**
 * Handle card burning
 */
export function handleCardsBurned(event: CardsBurned): void {
  const cardId = event.params.cardId.toString();
  const playerAddress = event.params.from.toHexString();
  const quantity = event.params.quantity.toI32();

  // Update holder
  const holderId = playerAddress + "-" + cardId;
  let holder = PlayerCardHolder.load(holderId);
  if (!holder) return;

  holder.balance -= quantity;
  holder.updatedAt = event.block.timestamp;

  if (holder.balance <= 0) {
    holder.balance = 0;
  }
  holder.save();

  // Update card supply
  let card = PlayerCard.load(cardId);
  if (card) {
    card.totalMinted -= quantity;
    card.save();
  }
}
```

### Match Results Mapping

#### `src/results-mapping.ts`

```typescript
import {
  MatchResultRecorded,
  MatchResultSettled,
} from "../generated/BassBallMatchResults/BassBallMatchResults";
import {
  MatchResult,
  Player,
  PlayerStats,
  PlayerRanking,
} from "../generated/schema";
import { BigInt, log } from "@graphprotocol/graph-ts";

/**
 * Handle match result recording
 */
export function handleMatchResultRecorded(event: MatchResultRecorded): void {
  const resultId = event.params.resultId.toString();
  const player1 = event.params.player1.toHexString();
  const player2 = event.params.player2.toHexString();
  const winner = event.params.winner.toHexString();

  // Create result entity
  let result = new MatchResult(resultId);
  result.matchId = event.params.matchId.toI32();
  result.player1 = player1;
  result.player2 = player2;
  result.winner = winner;
  result.scorePlayer1 = event.params.score1.toI32();
  result.scorePlayer2 = event.params.score2.toI32();
  result.duration = 300; // Default, would need to fetch from event
  result.resultHash = event.params.resultHash;
  result.timestamp = event.block.timestamp;
  result.settled = false;
  result.createdAt = event.block.timestamp;
  result.save();

  // Ensure both players exist
  ensurePlayerExists(player1, event.block.timestamp);
  ensurePlayerExists(player2, event.block.timestamp);

  // Update player stats
  updateStatsAfterMatch(
    player1,
    player2,
    winner,
    event.params.score1.toI32(),
    event.params.score2.toI32(),
    event.block.timestamp
  );
}

/**
 * Handle match settlement
 */
export function handleMatchResultSettled(event: MatchResultSettled): void {
  const resultId = event.params.resultId.toString();
  let result = MatchResult.load(resultId);

  if (!result) return;

  result.settled = true;
  result.save();

  // Update rankings after settlement
  updatePlayerRankings(result.player1 as string, event.block.timestamp);
  updatePlayerRankings(result.player2 as string, event.block.timestamp);
}

/**
 * Ensure player entity exists
 */
function ensurePlayerExists(playerAddress: string, timestamp: BigInt): void {
  let player = Player.load(playerAddress);
  if (!player) {
    player = new Player(playerAddress);
    player.username = "";
    player.wins = 0;
    player.losses = 0;
    player.draws = 0;
    player.rating = 1000;
    player.createdAt = timestamp;
  }
  player.updatedAt = timestamp;
  player.save();
}

/**
 * Update stats after match
 */
function updateStatsAfterMatch(
  player1: string,
  player2: string,
  winner: string,
  score1: i32,
  score2: i32,
  timestamp: BigInt
): void {
  // Get or create stats for player 1
  let stats1 = PlayerStats.load(player1);
  if (!stats1) {
    stats1 = new PlayerStats(player1);
    stats1.player = player1;
    stats1.totalMatches = 0;
    stats1.wins = 0;
    stats1.losses = 0;
    stats1.draws = 0;
    stats1.goalsFor = 0;
    stats1.goalsAgainst = 0;
  }

  stats1.totalMatches++;
  stats1.goalsFor += score1;
  stats1.goalsAgainst += score2;

  if (winner == player1) {
    stats1.wins++;
  } else if (score1 == score2) {
    stats1.draws++;
  } else {
    stats1.losses++;
  }

  // Calculate derived stats
  let totalGames = stats1.wins + stats1.losses + stats1.draws;
  if (totalGames > 0) {
    stats1.winRate = BigInt.fromI32(stats1.wins)
      .times(BigInt.fromI32(100))
      .toBigDecimal()
      .div(BigInt.fromI32(totalGames).toBigDecimal());
    stats1.avgGoalsPerGame = BigInt.fromI32(stats1.goalsFor)
      .toBigDecimal()
      .div(BigInt.fromI32(totalGames).toBigDecimal());
  }

  stats1.updatedAt = timestamp;
  stats1.save();

  // Do the same for player 2
  let stats2 = PlayerStats.load(player2);
  if (!stats2) {
    stats2 = new PlayerStats(player2);
    stats2.player = player2;
    stats2.totalMatches = 0;
    stats2.wins = 0;
    stats2.losses = 0;
    stats2.draws = 0;
    stats2.goalsFor = 0;
    stats2.goalsAgainst = 0;
  }

  stats2.totalMatches++;
  stats2.goalsFor += score2;
  stats2.goalsAgainst += score1;

  if (winner == player2) {
    stats2.wins++;
  } else if (score1 == score2) {
    stats2.draws++;
  } else {
    stats2.losses++;
  }

  stats2.updatedAt = timestamp;
  stats2.save();
}

/**
 * Update player ranking
 */
function updatePlayerRankings(playerAddress: string, timestamp: BigInt): void {
  let ranking = PlayerRanking.load(playerAddress);
  if (!ranking) {
    ranking = new PlayerRanking("ranking-" + playerAddress);
    ranking.player = playerAddress;
    ranking.rank = 1;
    ranking.rating = 1000;
    ranking.season = 1;
  }

  let stats = PlayerStats.load(playerAddress);
  if (stats) {
    ranking.wins = stats.wins;
    ranking.losses = stats.losses;
    ranking.winRate = stats.winRate;
  }

  ranking.updatedAt = timestamp;
  ranking.save();
}
```

---

## Deployment

### Build and Deploy to Subgraph Studio

```bash
# 1. Create subgraph on studio
graph create --studio bass-ball-subgraph

# 2. Authenticate with deploy key
graph auth --studio <DEPLOY_KEY>

# 3. Build locally
graph build

# 4. Deploy to studio
graph deploy --studio bass-ball-subgraph

# 5. Deploy to mainnet (production)
graph deploy --studio bass-ball-subgraph v1.0.0
```

### Environment Setup

**.env**

```bash
SUBGRAPH_NAME=bass-ball-subgraph
STUDIO_DEPLOY_KEY=xxxxxxxxxxxxx
GRAPH_NODE_URL=https://api.studio.thegraph.com/query/{id}
```

---

## GraphQL Queries

### Query Player Stats

```graphql
{
  playerStats(id: "0x1234...") {
    id
    totalMatches
    wins
    losses
    draws
    goalsFor
    goalsAgainst
    winRate
    avgGoalsPerGame
    recentForm
  }
}
```

### Query Rankings

```graphql
{
  playerRankings(
    first: 100
    orderBy: rating
    orderDirection: desc
  ) {
    id
    player {
      id
      username
    }
    rank
    rating
    wins
    losses
    winRate
  }
}
```

### Query Match History

```graphql
{
  matchResults(
    where: {
      player1: "0x1234..."
    }
    orderBy: timestamp
    orderDirection: desc
    first: 10
  ) {
    id
    matchId
    player1 {
      id
      username
    }
    player2 {
      id
      username
    }
    winner {
      id
    }
    scorePlayer1
    scorePlayer2
    timestamp
  }
}
```

### Query Player Cards

```graphql
{
  playerCardHolders(where: { player: "0x1234..." }) {
    id
    card {
      id
      playerName
      position
      rarity
      totalStats
    }
    balance
  }
}
```

### Query Teams

```graphql
{
  teams(
    orderBy: rating
    orderDirection: desc
    first: 10
  ) {
    id
    owner {
      id
      username
    }
    name
    logo
    wins
    losses
    rating
    totalGoals
  }
}
```

### Complex Query: Player Profile

```graphql
{
  player(id: "0x1234...") {
    id
    username
    avatar
    rating
    
    # Teams
    teamId {
      name
      logo
      wins
      losses
      rating
    }
    
    # Stats
    stats: playerStats(id: "0x1234...") {
      totalMatches
      wins
      losses
      winRate
      recentForm
    }
    
    # Recent matches
    matches: matchResults(
      where: { player1_or_player2: "0x1234..." }
      first: 5
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      opponent: player2 {
        username
      }
      result: winner
      score: scorePlayer1
    }
    
    # Cards
    cards: playerCardHolders {
      card {
        playerName
        rarity
      }
      balance
    }
  }
}
```

---

## Backend Integration

### `src/services/subgraph/query.ts`

```typescript
import { request, gql } from 'graphql-request';

const SUBGRAPH_URL = process.env.SUBGRAPH_URL!;

export const subgraphQueries = {
  /**
   * Get player stats
   */
  async getPlayerStats(playerAddress: string) {
    const query = gql`
      {
        playerStats(id: "${playerAddress.toLowerCase()}") {
          totalMatches
          wins
          losses
          draws
          goalsFor
          goalsAgainst
          winRate
          avgGoalsPerGame
          recentForm
          currentStreak
        }
      }
    `;

    return request(SUBGRAPH_URL, query);
  },

  /**
   * Get player ranking
   */
  async getPlayerRanking(playerAddress: string) {
    const query = gql`
      {
        playerRanking(id: "ranking-${playerAddress.toLowerCase()}") {
          rank
          rating
          wins
          losses
          winRate
        }
      }
    `;

    return request(SUBGRAPH_URL, query);
  },

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit: number = 100) {
    const query = gql`
      {
        playerRankings(
          first: ${limit}
          orderBy: rating
          orderDirection: desc
        ) {
          id
          player {
            id
            username
          }
          rank
          rating
          wins
          losses
          winRate
        }
      }
    `;

    return request(SUBGRAPH_URL, query);
  },

  /**
   * Get match history
   */
  async getPlayerMatches(playerAddress: string, limit: number = 10) {
    const query = gql`
      {
        matchResults(
          where: { player1: "${playerAddress.toLowerCase()}" }
          orderBy: timestamp
          orderDirection: desc
          first: ${limit}
        ) {
          id
          matchId
          player1 {
            id
            username
          }
          player2 {
            id
            username
          }
          winner {
            id
          }
          scorePlayer1
          scorePlayer2
          timestamp
        }
      }
    `;

    return request(SUBGRAPH_URL, query);
  },

  /**
   * Get head-to-head
   */
  async getHeadToHead(player1: string, player2: string) {
    const query = gql`
      {
        matchResults(
          where: {
            or: [
              { player1: "${player1.toLowerCase()}", player2: "${player2.toLowerCase()}" }
              { player1: "${player2.toLowerCase()}", player2: "${player1.toLowerCase()}" }
            ]
          }
        ) {
          winner {
            id
          }
          scorePlayer1
          scorePlayer2
        }
      }
    `;

    return request(SUBGRAPH_URL, query);
  },

  /**
   * Get player cards
   */
  async getPlayerCards(playerAddress: string) {
    const query = gql`
      {
        playerCardHolders(where: { player: "${playerAddress.toLowerCase()}" }) {
          id
          card {
            id
            playerName
            position
            rarity
            totalStats
            imageURI
          }
          balance
        }
      }
    `;

    return request(SUBGRAPH_URL, query);
  },

  /**
   * Get complete player profile
   */
  async getPlayerProfile(playerAddress: string) {
    const query = gql`
      {
        player(id: "${playerAddress.toLowerCase()}") {
          id
          username
          avatar
          rating
          
          stats {
            totalMatches
            wins
            losses
            winRate
            recentForm
          }
          
          team: teamId {
            name
            logo
            wins
            losses
            rating
          }
          
          recentMatches: matches(
            first: 5
            orderBy: timestamp
            orderDirection: desc
          ) {
            id
            matchId
            player2 {
              username
            }
            winner {
              id
            }
            scorePlayer1
            scorePlayer2
            timestamp
          }
          
          cards: playerCardHolders {
            card {
              playerName
              rarity
            }
            balance
          }
        }
      }
    `;

    return request(SUBGRAPH_URL, query);
  },
};
```

### Use in API Routes

```typescript
// src/routes/stats.ts
import { subgraphQueries } from '@/services/subgraph/query';

export default async function statsRoutes(fastify: FastifyInstance) {
  // Get player stats from subgraph
  fastify.get<{ Params: { address: string } }>(
    '/player/:address/stats',
    async (request, reply) => {
      const { address } = request.params;

      try {
        const response = await subgraphQueries.getPlayerStats(address);
        return response.playerStats || { error: 'Not found' };
      } catch (error) {
        return { error: 'Subgraph query failed' };
      }
    }
  );

  // Get leaderboard from subgraph
  fastify.get<{ Querystring: { limit?: string } }>(
    '/leaderboard',
    async (request, reply) => {
      const limit = Math.min(parseInt(request.query.limit || '100'), 500);

      try {
        const response = await subgraphQueries.getLeaderboard(limit);
        return response.playerRankings || [];
      } catch (error) {
        return { error: 'Subgraph query failed' };
      }
    }
  );

  // Get complete player profile
  fastify.get<{ Params: { address: string } }>(
    '/player/:address/profile',
    async (request, reply) => {
      const { address } = request.params;

      try {
        const response = await subgraphQueries.getPlayerProfile(address);
        return response.player || { error: 'Not found' };
      } catch (error) {
        return { error: 'Subgraph query failed' };
      }
    }
  );
}
```

---

## Monitoring & Debugging

### Check Subgraph Status

```bash
# View indexing status
curl https://api.studio.thegraph.com/index-node/graphql \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ indexingStatuses { subgraph synced entity } }"
  }'

# Check pending transactions
curl https://api.studio.thegraph.com/index-node/graphql \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ indexingStatuses(subgraphs: [\"bass-ball-subgraph\"]) { chainHead blockNumber synced } }"
  }'
```

---

## Performance Optimization

### Query Best Practices

```graphql
# ✅ Good: Select only needed fields
{
  playerRankings(first: 10) {
    rank
    rating
  }
}

# ❌ Bad: Select unnecessary fields
{
  playerRankings(first: 10) {
    id
    player {
      id
      username
      avatar
      email
    }
    rank
    rating
    wins
    losses
    draws
  }
}

# ✅ Good: Use proper pagination
{
  playerRankings(
    first: 100
    skip: 100
  ) {
    rank
  }
}

# ✅ Good: Use filters
{
  playerRankings(
    where: { rating_gte: 1500 }
    first: 10
  ) {
    rank
    rating
  }
}
```

### Caching Strategies

```typescript
// Cache subgraph results in Redis for 5 minutes
import { redis } from '@/lib/redis';

async function getLeaderboardCached(limit: number) {
  const cacheKey = `leaderboard:${limit}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const data = await subgraphQueries.getLeaderboard(limit);
  await redis.setex(cacheKey, 300, JSON.stringify(data)); // 5 min cache

  return data;
}
```

---

## Summary

| Component | Purpose |
|-----------|---------|
| **Schema** | Entity definitions (Player, Team, MatchResult, etc) |
| **Mappings** | Event handlers (Team, Cards, Results) |
| **Queries** | GraphQL endpoints for data retrieval |
| **Indexing** | Real-time blockchain event processing |
| **Storage** | Decentralized graph nodes |
| **Cost** | Free for development, paid for production |

---

**Production-ready blockchain indexing** 📑
