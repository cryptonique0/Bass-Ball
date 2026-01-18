# ⚡ Cache & Match State: Redis

## Why Redis for Gaming?

### Comparison: Caching Solutions

| Feature | Redis ✅ | Memcached | Node Memory | PostgreSQL |
|---------|---------|-----------|------------|-----------|
| **Speed** | <1ms | <1ms | <1ms | 10-100ms |
| **Persistence** | ✅ Yes | No | No | Yes |
| **Data Structures** | Rich | Basic | N/A | Complex |
| **Scaling** | Cluster ✅ | Cluster | Manual | Built-in |
| **Real-time** | ✅ Perfect | Good | Risky | Slow |
| **Memory** | 200MB-GB | 200MB-GB | Limited | Disk-based |
| **Use Case** | Games ✅ | Simple cache | Dangerous | Long-term |

**Winner for games: Redis** ✅
- Sub-millisecond access
- Perfect for live match state
- Built-in pub/sub for real-time events
- Sorted sets for leaderboards
- Atomic operations for safety

---

## Installation

```bash
# Install Redis
npm install ioredis

# For local development
# macOS
brew install redis

# Ubuntu
sudo apt-get install redis-server

# Start Redis
redis-server

# Or with Docker
docker run -d -p 6379:6379 redis:7-alpine

# Verify
redis-cli ping  # Should respond "PONG"
```

---

## Redis Setup

### `src/lib/redis.ts`

```typescript
import Redis from 'ioredis';
import { logger } from './logger';

// Create Redis client
export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  
  // Connection settings
  connectTimeout: 10000,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true,
  
  // Reconnection
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  
  // Performance
  lazyConnect: false,
  keepAlive: 30000,
});

// Event handlers
redis.on('connect', () => {
  logger.info('✅ Redis connected');
});

redis.on('error', (err) => {
  logger.error('❌ Redis error', err);
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await redis.quit();
  logger.info('Redis disconnected');
});

export default redis;
```

---

## Live Match State

### Match State Cache

#### `src/services/cache/match-cache.ts`

```typescript
import redis from '@/lib/redis';
import { GameState } from '@/services/match-engine/types';
import { logger } from '@/lib/logger';

const MATCH_TTL = 3600; // 1 hour
const MATCH_KEY = (matchId: string) => `match:${matchId}`;
const MATCH_LOCK_KEY = (matchId: string) => `match:lock:${matchId}`;

export class MatchCache {
  /**
   * Store game state in Redis
   */
  static async setGameState(matchId: string, state: GameState): Promise<void> {
    try {
      const key = MATCH_KEY(matchId);
      const serialized = JSON.stringify(state);

      // Set with expiry (1 hour for completed matches)
      await redis.setex(key, MATCH_TTL, serialized);

      logger.debug(`✅ Match state cached`, { matchId, tick: state.tick });
    } catch (error) {
      logger.error(`Failed to cache match state`, error);
      throw error;
    }
  }

  /**
   * Get game state from Redis
   */
  static async getGameState(matchId: string): Promise<GameState | null> {
    try {
      const key = MATCH_KEY(matchId);
      const serialized = await redis.get(key);

      if (!serialized) {
        return null;
      }

      const state: GameState = JSON.parse(serialized);
      return state;
    } catch (error) {
      logger.error(`Failed to retrieve match state`, error);
      return null;
    }
  }

  /**
   * Delete match state from cache
   */
  static async deleteGameState(matchId: string): Promise<void> {
    try {
      const key = MATCH_KEY(matchId);
      await redis.del(key);

      logger.debug(`✅ Match state deleted from cache`, { matchId });
    } catch (error) {
      logger.error(`Failed to delete match state`, error);
      throw error;
    }
  }

  /**
   * Acquire lock for match (prevent concurrent updates)
   */
  static async acquireLock(
    matchId: string,
    ttl: number = 5000
  ): Promise<boolean> {
    try {
      const lockKey = MATCH_LOCK_KEY(matchId);
      const timestamp = Date.now().toString();

      // SET NX = only set if not exists (atomic)
      const result = await redis.set(
        lockKey,
        timestamp,
        'PX', // Expire in milliseconds
        ttl,
        'NX'  // Only if not exists
      );

      return result === 'OK';
    } catch (error) {
      logger.error(`Failed to acquire match lock`, error);
      return false;
    }
  }

  /**
   * Release lock for match
   */
  static async releaseLock(matchId: string): Promise<void> {
    try {
      const lockKey = MATCH_LOCK_KEY(matchId);
      await redis.del(lockKey);

      logger.debug(`✅ Match lock released`, { matchId });
    } catch (error) {
      logger.error(`Failed to release match lock`, error);
    }
  }

  /**
   * Store match in "active matches" set
   */
  static async addActiveMatch(matchId: string): Promise<void> {
    try {
      const key = 'matches:active';
      const timestamp = Date.now();

      // Add to sorted set (score = timestamp)
      await redis.zadd(key, timestamp, matchId);

      // Expire the set after 1 hour
      await redis.expire(key, MATCH_TTL);

      logger.debug(`✅ Match added to active set`, { matchId });
    } catch (error) {
      logger.error(`Failed to add active match`, error);
    }
  }

  /**
   * Remove match from "active matches" set
   */
  static async removeActiveMatch(matchId: string): Promise<void> {
    try {
      const key = 'matches:active';
      await redis.zrem(key, matchId);

      logger.debug(`✅ Match removed from active set`, { matchId });
    } catch (error) {
      logger.error(`Failed to remove active match`, error);
    }
  }

  /**
   * Get all active matches
   */
  static async getActiveMatches(): Promise<string[]> {
    try {
      const key = 'matches:active';
      const matches = await redis.zrange(key, 0, -1);
      return matches;
    } catch (error) {
      logger.error(`Failed to get active matches`, error);
      return [];
    }
  }

  /**
   * Store action history for anti-cheat verification
   */
  static async storeAction(
    matchId: string,
    playerId: string,
    action: any
  ): Promise<void> {
    try {
      const key = `match:${matchId}:actions:${playerId}`;

      // Add to list (keep last 1000 actions)
      await redis.lpush(key, JSON.stringify(action));
      await redis.ltrim(key, 0, 999); // Keep only last 1000
      await redis.expire(key, MATCH_TTL);

      logger.debug(`✅ Action stored`, { matchId, playerId });
    } catch (error) {
      logger.error(`Failed to store action`, error);
    }
  }

  /**
   * Get action history for replay/verification
   */
  static async getActions(
    matchId: string,
    playerId: string,
    limit: number = 100
  ): Promise<any[]> {
    try {
      const key = `match:${matchId}:actions:${playerId}`;
      const serialized = await redis.lrange(key, 0, limit - 1);

      return serialized.map((s) => JSON.parse(s));
    } catch (error) {
      logger.error(`Failed to get actions`, error);
      return [];
    }
  }

  /**
   * Store match result hash for verification
   */
  static async storeResultHash(
    matchId: string,
    stateHash: string,
    tick: number
  ): Promise<void> {
    try {
      const key = `match:${matchId}:hashes`;

      // Store with tick number as score for sorting
      await redis.zadd(key, tick, stateHash);
      await redis.expire(key, MATCH_TTL);

      logger.debug(`✅ Result hash stored`, { matchId, tick });
    } catch (error) {
      logger.error(`Failed to store result hash`, error);
    }
  }

  /**
   * Verify match integrity (check hashes)
   */
  static async verifyMatchIntegrity(matchId: string): Promise<boolean> {
    try {
      const key = `match:${matchId}:hashes`;
      const count = await redis.zcard(key);

      return count > 0;
    } catch (error) {
      logger.error(`Failed to verify match integrity`, error);
      return false;
    }
  }
}
```

---

## Matchmaking Queue

### Matchmaking with Redis

#### `src/services/cache/matchmaking-cache.ts`

```typescript
import redis from '@/lib/redis';
import { logger } from '@/lib/logger';

const QUEUE_KEY = 'matchmaking:queue';
const QUEUE_TTL = 300; // 5 minutes
const RATING_WINDOW = 200; // Rating range for matching

export class MatchmakingCache {
  /**
   * Add player to matchmaking queue
   */
  static async addToQueue(
    playerAddress: string,
    rating: number,
    socketId: string
  ): Promise<void> {
    try {
      // Store in sorted set by rating (score = rating)
      // This allows range queries for opponent search
      const data = JSON.stringify({ address: playerAddress, socketId });

      await redis.zadd(QUEUE_KEY, rating, `${playerAddress}:${socketId}`);
      await redis.expire(QUEUE_KEY, QUEUE_TTL);

      logger.info(`✅ Player added to matchmaking queue`, {
        playerAddress,
        rating,
      });
    } catch (error) {
      logger.error(`Failed to add player to queue`, error);
      throw error;
    }
  }

  /**
   * Remove player from queue (match found or timeout)
   */
  static async removeFromQueue(playerAddress: string): Promise<void> {
    try {
      // Get all entries for this player
      const members = await redis.zrange(QUEUE_KEY, 0, -1);
      const toRemove = members.filter((m) => m.startsWith(playerAddress));

      if (toRemove.length > 0) {
        await redis.zrem(QUEUE_KEY, ...toRemove);
        logger.info(`✅ Player removed from queue`, { playerAddress });
      }
    } catch (error) {
      logger.error(`Failed to remove player from queue`, error);
    }
  }

  /**
   * Find opponent with similar rating
   */
  static async findOpponent(
    playerAddress: string,
    playerRating: number,
    minWindow: number = 50,
    maxWindow: number = RATING_WINDOW
  ): Promise<{ address: string; socketId: string; rating: number } | null> {
    try {
      // Get players within rating window
      const minRating = Math.max(0, playerRating - maxWindow);
      const maxRating = playerRating + maxWindow;

      const candidates = await redis.zrangebyscore(
        QUEUE_KEY,
        minRating,
        maxRating
      );

      // Filter out self
      const opponents = candidates.filter(
        (c) => !c.startsWith(playerAddress)
      );

      if (opponents.length === 0) {
        logger.debug(`No opponent found in strict window`, { playerRating });

        // Expand window if no match found
        if (maxWindow < 500) {
          return this.findOpponent(
            playerAddress,
            playerRating,
            minWindow,
            maxWindow + 100
          );
        }

        return null;
      }

      // Find closest match (most balanced)
      const scores = await redis.zmscore(QUEUE_KEY, ...opponents);
      const closest = opponents.reduce((prev, curr, idx) => {
        const prevScore = parseInt(await redis.zscore(QUEUE_KEY, prev) || '0');
        const currScore = scores[idx] || 0;

        const prevDiff = Math.abs(prevScore - playerRating);
        const currDiff = Math.abs(currScore - playerRating);

        return currDiff < prevDiff ? curr : prev;
      });

      // Parse opponent data
      const [address, socketId] = closest.split(':');
      const opponentRating = scores[opponents.indexOf(closest)] || 0;

      return {
        address,
        socketId,
        rating: opponentRating,
      };
    } catch (error) {
      logger.error(`Failed to find opponent`, error);
      return null;
    }
  }

  /**
   * Get queue stats
   */
  static async getQueueStats(): Promise<{
    totalPlayers: number;
    byRating: { [key: string]: number };
  }> {
    try {
      const members = await redis.zrange(QUEUE_KEY, 0, -1, 'WITHSCORES');
      const total = members.length / 2;

      // Group by rating brackets
      const byRating: { [key: string]: number } = {};
      for (let i = 0; i < members.length; i += 2) {
        const rating = parseInt(members[i + 1] || '0');
        const bracket = Math.floor(rating / 100) * 100;
        const key = `${bracket}-${bracket + 100}`;

        byRating[key] = (byRating[key] || 0) + 1;
      }

      return {
        totalPlayers: Math.floor(total),
        byRating,
      };
    } catch (error) {
      logger.error(`Failed to get queue stats`, error);
      return { totalPlayers: 0, byRating: {} };
    }
  }

  /**
   * Clean up expired queue entries
   */
  static async cleanupExpiredEntries(): Promise<number> {
    try {
      // Get all entries
      const members = await redis.zrange(QUEUE_KEY, 0, -1);

      // Check each entry's TTL
      let removed = 0;
      for (const member of members) {
        const ttl = await redis.ttl(`queue:${member}`);
        if (ttl <= 0) {
          await redis.zrem(QUEUE_KEY, member);
          removed++;
        }
      }

      logger.info(`✅ Cleaned up ${removed} expired queue entries`);
      return removed;
    } catch (error) {
      logger.error(`Failed to cleanup queue`, error);
      return 0;
    }
  }
}
```

---

## Leaderboard Caching

### Leaderboard with Redis

#### `src/services/cache/leaderboard-cache.ts`

```typescript
import redis from '@/lib/redis';
import { logger } from '@/lib/logger';

const LEADERBOARD_KEY = 'leaderboard:global';
const LEADERBOARD_SEASON_KEY = (season: number) => `leaderboard:season:${season}`;
const LEADERBOARD_TTL = 3600; // 1 hour cache
const LEADERBOARD_UPDATE_INTERVAL = 300000; // Update every 5 minutes

export class LeaderboardCache {
  /**
   * Update player rating in leaderboard (sorted set)
   */
  static async updatePlayerRating(
    playerAddress: string,
    newRating: number,
    season: number = 1
  ): Promise<void> {
    try {
      // Update in both global and season leaderboards
      await redis.zadd(LEADERBOARD_KEY, newRating, playerAddress);
      await redis.zadd(LEADERBOARD_SEASON_KEY(season), newRating, playerAddress);

      // Set expiry
      await redis.expire(LEADERBOARD_KEY, LEADERBOARD_TTL);
      await redis.expire(LEADERBOARD_SEASON_KEY(season), LEADERBOARD_TTL);

      logger.debug(`✅ Leaderboard updated`, { playerAddress, newRating });
    } catch (error) {
      logger.error(`Failed to update leaderboard`, error);
      throw error;
    }
  }

  /**
   * Get top N players
   */
  static async getTopPlayers(
    limit: number = 100,
    season: number = 1
  ): Promise<Array<{ address: string; rating: number; rank: number }>> {
    try {
      const key =
        season > 0 ? LEADERBOARD_SEASON_KEY(season) : LEADERBOARD_KEY;

      // Get top players (highest rating first)
      const members = await redis.zrevrange(key, 0, limit - 1, 'WITHSCORES');

      const result = [];
      for (let i = 0; i < members.length; i += 2) {
        result.push({
          address: members[i],
          rating: parseInt(members[i + 1] || '0'),
          rank: result.length + 1,
        });
      }

      return result;
    } catch (error) {
      logger.error(`Failed to get top players`, error);
      return [];
    }
  }

  /**
   * Get player rank and rating
   */
  static async getPlayerRank(
    playerAddress: string,
    season: number = 1
  ): Promise<{ rank: number; rating: number } | null> {
    try {
      const key =
        season > 0 ? LEADERBOARD_SEASON_KEY(season) : LEADERBOARD_KEY;

      // Get rank (ZREVRANK = rank from highest, 0-indexed)
      const rank = await redis.zrevrank(key, playerAddress);
      if (rank === null) {
        return null;
      }

      // Get rating
      const score = await redis.zscore(key, playerAddress);
      if (score === null) {
        return null;
      }

      return {
        rank: rank + 1, // Convert to 1-indexed
        rating: parseInt(score),
      };
    } catch (error) {
      logger.error(`Failed to get player rank`, error);
      return null;
    }
  }

  /**
   * Get leaderboard page
   */
  static async getLeaderboardPage(
    page: number = 1,
    pageSize: number = 20,
    season: number = 1
  ): Promise<{
    page: number;
    pageSize: number;
    total: number;
    players: Array<{ address: string; rating: number; rank: number }>;
  }> {
    try {
      const key =
        season > 0 ? LEADERBOARD_SEASON_KEY(season) : LEADERBOARD_KEY;

      // Get total count
      const total = await redis.zcard(key);

      // Calculate offset
      const offset = (page - 1) * pageSize;

      // Get players for this page
      const members = await redis.zrevrange(
        key,
        offset,
        offset + pageSize - 1,
        'WITHSCORES'
      );

      const players = [];
      for (let i = 0; i < members.length; i += 2) {
        players.push({
          address: members[i],
          rating: parseInt(members[i + 1] || '0'),
          rank: offset + (i / 2) + 1,
        });
      }

      return {
        page,
        pageSize,
        total,
        players,
      };
    } catch (error) {
      logger.error(`Failed to get leaderboard page`, error);
      return { page: 1, pageSize, total: 0, players: [] };
    }
  }

  /**
   * Get players around a given player (for context)
   */
  static async getPlayersAround(
    playerAddress: string,
    context: number = 5, // Show 5 players above and below
    season: number = 1
  ): Promise<Array<{ address: string; rating: number; rank: number; isTarget: boolean }>> {
    try {
      const key =
        season > 0 ? LEADERBOARD_SEASON_KEY(season) : LEADERBOARD_KEY;

      const rank = await redis.zrevrank(key, playerAddress);
      if (rank === null) {
        return [];
      }

      // Get range around player
      const start = Math.max(0, rank - context);
      const end = rank + context;

      const members = await redis.zrevrange(key, start, end, 'WITHSCORES');

      const result = [];
      for (let i = 0; i < members.length; i += 2) {
        const address = members[i];
        const rating = parseInt(members[i + 1] || '0');
        const playerRank = start + (i / 2) + 1;

        result.push({
          address,
          rating,
          rank: playerRank,
          isTarget: address === playerAddress,
        });
      }

      return result;
    } catch (error) {
      logger.error(`Failed to get players around`, error);
      return [];
    }
  }

  /**
   * Get players within rating range
   */
  static async getPlayersInRange(
    minRating: number,
    maxRating: number,
    season: number = 1
  ): Promise<Array<{ address: string; rating: number }>> {
    try {
      const key =
        season > 0 ? LEADERBOARD_SEASON_KEY(season) : LEADERBOARD_KEY;

      const members = await redis.zrangebyscore(
        key,
        minRating,
        maxRating,
        'WITHSCORES'
      );

      const result = [];
      for (let i = 0; i < members.length; i += 2) {
        result.push({
          address: members[i],
          rating: parseInt(members[i + 1] || '0'),
        });
      }

      return result;
    } catch (error) {
      logger.error(`Failed to get players in range`, error);
      return [];
    }
  }

  /**
   * Rebuild leaderboard from database
   * (Called periodically or when cache expires)
   */
  static async rebuildLeaderboard(season: number = 1): Promise<number> {
    try {
      const { prisma } = require('@/server');

      // Get all players sorted by rating
      const players = await prisma.player.findMany({
        select: { address: true, rating: true },
        orderBy: { rating: 'desc' },
        where: { isBanned: false },
      });

      // Clear old leaderboard
      const key =
        season > 0 ? LEADERBOARD_SEASON_KEY(season) : LEADERBOARD_KEY;
      await redis.del(key);

      // Rebuild from database
      for (const player of players) {
        await redis.zadd(key, player.rating, player.address);
      }

      await redis.expire(key, LEADERBOARD_TTL);

      logger.info(`✅ Leaderboard rebuilt`, {
        season,
        total: players.length,
      });

      return players.length;
    } catch (error) {
      logger.error(`Failed to rebuild leaderboard`, error);
      throw error;
    }
  }

  /**
   * Get leaderboard statistics
   */
  static async getLeaderboardStats(season: number = 1): Promise<{
    total: number;
    avgRating: number;
    minRating: number;
    maxRating: number;
  }> {
    try {
      const key =
        season > 0 ? LEADERBOARD_SEASON_KEY(season) : LEADERBOARD_KEY;

      const total = await redis.zcard(key);
      if (total === 0) {
        return { total: 0, avgRating: 0, minRating: 0, maxRating: 0 };
      }

      // Get min and max ratings
      const minMember = await redis.zrange(key, 0, 0, 'WITHSCORES');
      const maxMember = await redis.zrevrange(key, 0, 0, 'WITHSCORES');

      const minRating = minMember.length > 1 ? parseInt(minMember[1]) : 0;
      const maxRating = maxMember.length > 1 ? parseInt(maxMember[1]) : 0;

      // Calculate average
      const members = await redis.zrange(key, 0, -1, 'WITHSCORES');
      let sum = 0;
      for (let i = 1; i < members.length; i += 2) {
        sum += parseInt(members[i]);
      }
      const avgRating = Math.round(sum / total);

      return { total, avgRating, minRating, maxRating };
    } catch (error) {
      logger.error(`Failed to get leaderboard stats`, error);
      return { total: 0, avgRating: 0, minRating: 0, maxRating: 0 };
    }
  }
}
```

---

## Real-Time Pub/Sub

### Event Broadcasting

#### `src/services/cache/pubsub.ts`

```typescript
import Redis from 'ioredis';
import { logger } from '@/lib/logger';

// Separate connection for pub/sub (Redis limitation: can't do other ops in pub mode)
const publisherRedis = new Redis();
const subscriberRedis = new Redis();

export class PubSubService {
  /**
   * Publish event to channel
   */
  static async publish(channel: string, data: any): Promise<void> {
    try {
      const message = JSON.stringify(data);
      await publisherRedis.publish(channel, message);

      logger.debug(`📢 Event published`, { channel });
    } catch (error) {
      logger.error(`Failed to publish event`, error);
    }
  }

  /**
   * Subscribe to channel
   */
  static subscribe(
    channel: string,
    callback: (data: any) => void
  ): () => void {
    const messageHandler = (chan: string, message: string) => {
      if (chan === channel) {
        try {
          const data = JSON.parse(message);
          callback(data);
        } catch (error) {
          logger.error(`Failed to parse message`, error);
        }
      }
    };

    subscriberRedis.on('message', messageHandler);
    subscriberRedis.subscribe(channel);

    // Return unsubscribe function
    return () => {
      subscriberRedis.unsubscribe(channel);
      subscriberRedis.off('message', messageHandler);
    };
  }

  /**
   * Subscribe to pattern
   */
  static subscribePattern(
    pattern: string,
    callback: (channel: string, data: any) => void
  ): () => void {
    const messageHandler = (chan: string, message: string) => {
      try {
        const data = JSON.parse(message);
        callback(chan, data);
      } catch (error) {
        logger.error(`Failed to parse message`, error);
      }
    };

    subscriberRedis.on('pmessage', messageHandler);
    subscriberRedis.psubscribe(pattern);

    return () => {
      subscriberRedis.punsubscribe(pattern);
      subscriberRedis.off('pmessage', messageHandler);
    };
  }
}

// Common channels
export const Channels = {
  // Match events
  MATCH_STATE: (matchId: string) => `match:${matchId}:state`,
  MATCH_GOAL: (matchId: string) => `match:${matchId}:goal`,
  MATCH_RESULT: (matchId: string) => `match:${matchId}:result`,

  // Player events
  PLAYER_RATING: (address: string) => `player:${address}:rating`,
  PLAYER_MATCH: (address: string) => `player:${address}:match`,

  // Leaderboard updates
  LEADERBOARD_UPDATE: 'leaderboard:update',

  // Matchmaking
  MATCHMAKING_FOUND: 'matchmaking:found',

  // Notifications
  NOTIFICATION: (address: string) => `notify:${address}`,
};
```

---

## Integration with Match Engine

### `src/services/match-engine/match-service-cached.ts`

```typescript
import { MatchEngine } from './engine';
import { MatchCache } from '@/services/cache/match-cache';
import { LeaderboardCache } from '@/services/cache/leaderboard-cache';
import { PubSubService, Channels } from '@/services/cache/pubsub';
import { GameState } from './types';
import { logger } from '@/lib/logger';

export class CachedMatchService {
  /**
   * Start match with caching
   */
  static async startMatch(
    matchId: string,
    player1Address: string,
    player2Address: string
  ): Promise<GameState | null> {
    // Acquire lock
    const locked = await MatchCache.acquireLock(matchId);
    if (!locked) {
      logger.warn(`Failed to acquire lock for match`, { matchId });
      return null;
    }

    try {
      const engine = new MatchEngine(matchId);
      const gameState = engine.initMatch(player1Address, player2Address);

      // Cache the state
      await MatchCache.setGameState(matchId, gameState);
      await MatchCache.addActiveMatch(matchId);

      // Publish match started event
      await PubSubService.publish(Channels.MATCH_STATE(matchId), {
        event: 'MATCH_STARTED',
        state: gameState,
      });

      logger.info(`🎮 Match started with cache`, { matchId });
      return gameState;
    } finally {
      await MatchCache.releaseLock(matchId);
    }
  }

  /**
   * Update match state and broadcast
   */
  static async updateMatchState(
    matchId: string,
    gameState: GameState
  ): Promise<void> {
    try {
      // Cache state
      await MatchCache.setGameState(matchId, gameState);

      // Store action history
      for (const playerId of [gameState.player1, gameState.player2]) {
        // Actions would be stored separately
      }

      // Broadcast state update
      await PubSubService.publish(Channels.MATCH_STATE(matchId), {
        event: 'GAME_STATE_UPDATE',
        tick: gameState.tick,
        ball: gameState.ball,
        score: gameState.score,
        timeRemaining: gameState.timeRemaining,
      });
    } catch (error) {
      logger.error(`Failed to update match state`, error);
    }
  }

  /**
   * Handle goal and broadcast
   */
  static async handleGoal(
    matchId: string,
    gameState: GameState,
    scorerId: string
  ): Promise<void> {
    try {
      // Broadcast goal event
      await PubSubService.publish(Channels.MATCH_GOAL(matchId), {
        event: 'GOAL',
        scorer: scorerId,
        score: gameState.score,
      });

      logger.info(`⚽ Goal scored`, { matchId, scorerId });
    } catch (error) {
      logger.error(`Failed to handle goal`, error);
    }
  }

  /**
   * End match and update ratings
   */
  static async endMatch(
    matchId: string,
    gameState: GameState,
    player1Address: string,
    player2Address: string
  ): Promise<void> {
    try {
      const winner = gameState.score[0] > gameState.score[1]
        ? player1Address
        : player2Address;

      // Calculate rating changes (ELO)
      const K = 32;
      const expectedWins = 1 / (1 + Math.pow(10, 0)); // Assume equal skill
      const actualWins = winner === player1Address ? 1 : 0;
      const ratingChange = Math.round(K * (actualWins - expectedWins));

      // Update ratings in cache
      const { prisma } = require('@/server');
      const p1 = await prisma.player.findUnique({
        where: { address: player1Address },
      });
      const p2 = await prisma.player.findUnique({
        where: { address: player2Address },
      });

      const newP1Rating = p1.rating + (winner === player1Address ? ratingChange : -ratingChange);
      const newP2Rating = p2.rating + (winner === player2Address ? ratingChange : -ratingChange);

      // Update cache
      await LeaderboardCache.updatePlayerRating(player1Address, newP1Rating);
      await LeaderboardCache.updatePlayerRating(player2Address, newP2Rating);

      // Publish result
      await PubSubService.publish(Channels.MATCH_RESULT(matchId), {
        event: 'MATCH_RESULT',
        winner,
        score: gameState.score,
        ratingChanges: {
          [player1Address]: winner === player1Address ? ratingChange : -ratingChange,
          [player2Address]: winner === player2Address ? ratingChange : -ratingChange,
        },
      });

      // Clean up
      await MatchCache.removeActiveMatch(matchId);
      await MatchCache.deleteGameState(matchId);

      logger.info(`🏁 Match ended`, { matchId, winner });
    } catch (error) {
      logger.error(`Failed to end match`, error);
    }
  }
}
```

---

## Monitoring & Health

### `src/routes/admin/cache-stats.ts`

```typescript
import { FastifyInstance } from 'fastify';
import redis from '@/lib/redis';
import { MatchCache } from '@/services/cache/match-cache';
import { MatchmakingCache } from '@/services/cache/matchmaking-cache';
import { LeaderboardCache } from '@/services/cache/leaderboard-cache';

export default async function cacheStatsRoutes(fastify: FastifyInstance) {
  // Get Redis info
  fastify.get('/admin/cache/info', async (request, reply) => {
    try {
      const info = await redis.info('stats');
      const memory = await redis.info('memory');

      return {
        stats: info,
        memory: memory,
      };
    } catch (error) {
      reply.statusCode = 500;
      return { error: 'Failed to get cache info' };
    }
  });

  // Get match stats
  fastify.get('/admin/cache/matches', async (request, reply) => {
    try {
      const activeMatches = await MatchCache.getActiveMatches();

      return {
        totalActive: activeMatches.length,
        matches: activeMatches.slice(0, 10),
      };
    } catch (error) {
      reply.statusCode = 500;
      return { error: 'Failed to get match stats' };
    }
  });

  // Get matchmaking queue stats
  fastify.get('/admin/cache/queue', async (request, reply) => {
    try {
      const queueStats = await MatchmakingCache.getQueueStats();

      return queueStats;
    } catch (error) {
      reply.statusCode = 500;
      return { error: 'Failed to get queue stats' };
    }
  });

  // Get leaderboard stats
  fastify.get('/admin/cache/leaderboard', async (request, reply) => {
    try {
      const stats = await LeaderboardCache.getLeaderboardStats();

      return stats;
    } catch (error) {
      reply.statusCode = 500;
      return { error: 'Failed to get leaderboard stats' };
    }
  });

  // Rebuild leaderboard
  fastify.post('/admin/cache/leaderboard/rebuild', async (request, reply) => {
    try {
      const count = await LeaderboardCache.rebuildLeaderboard();

      return {
        message: 'Leaderboard rebuilt',
        total: count,
      };
    } catch (error) {
      reply.statusCode = 500;
      return { error: 'Failed to rebuild leaderboard' };
    }
  });

  // Clear cache
  fastify.post('/admin/cache/clear', async (request, reply) => {
    try {
      await redis.flushdb();

      return {
        message: 'Cache cleared',
      };
    } catch (error) {
      reply.statusCode = 500;
      return { error: 'Failed to clear cache' };
    }
  });
}
```

---

## Performance Tips

### Connection Pooling

```typescript
// Use single Redis instance (it's already pooled)
// DON'T create new connections per request
import redis from '@/lib/redis';

// ✅ Good
app.get('/data', async (req) => {
  const data = await redis.get('key');
  return data;
});

// ❌ Bad
app.get('/data', async (req) => {
  const newRedis = new Redis(); // Creates unnecessary connection
  const data = await newRedis.get('key');
});
```

### Batch Operations

```typescript
// Use pipeline for multiple commands
const pipeline = redis.pipeline();

pipeline.zadd('leaderboard', 1000, 'player1');
pipeline.zadd('leaderboard', 1050, 'player2');
pipeline.zadd('leaderboard', 950, 'player3');

await pipeline.exec();
```

### Key Expiry Strategy

```typescript
// Always set expiry on temporary data
await redis.setex(
  'session:' + sessionId,
  3600,  // 1 hour
  JSON.stringify(sessionData)
);

// Automatic cleanup
await redis.expire('match:' + matchId, 3600);
```

---

## Environment Variables

**.env**

```bash
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Or use URL
REDIS_URL=redis://localhost:6379/0

# Production
REDIS_HOST=redis-prod.example.com
REDIS_PASSWORD=strong-password
```

---

## Summary

| Component | Purpose | TTL |
|-----------|---------|-----|
| **Match State** | Live game data | 1 hour |
| **Matchmaking Queue** | Player search | 5 minutes |
| **Leaderboard** | Rankings cache | 1 hour |
| **Action History** | Anti-cheat verification | 1 hour |
| **Result Hashes** | Integrity checks | 1 hour |
| **Pub/Sub Events** | Real-time broadcasts | N/A |

---

**Production-ready caching layer** 🚀
