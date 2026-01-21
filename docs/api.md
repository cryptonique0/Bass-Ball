# Bass Ball API Documentation

## Overview

Bass Ball provides REST-like endpoints and real-time data synchronization for game state, player profiles, matchmaking, and blockchain interactions.

## Base URL

**Development:** `http://localhost:3000`  
**Production:** `https://bassball.game` (example)

## Authentication

Most endpoints require wallet signature authentication:

```
Authorization: Bearer <JWT_TOKEN>
```

Obtain token via wallet signature:
```typescript
POST /api/auth/challenge
POST /api/auth/verify
```

## OpenAPI Specification

### Player API

#### Get Player Profile
```yaml
GET /api/player/{playerId}

Parameters:
  - name: playerId
    in: path
    required: true
    schema:
      type: string
      
Responses:
  200:
    description: Player profile data
    content:
      application/json:
        schema:
          type: object
          properties:
            id:
              type: string
            username:
              type: string
            rating:
              type: number
            stats:
              type: object
              properties:
                wins: { type: number }
                losses: { type: number }
                winrate: { type: number }
            wallet:
              type: string
```

#### Update Player Profile
```yaml
PUT /api/player/{playerId}

RequestBody:
  content:
    application/json:
      schema:
        type: object
        properties:
          username: { type: string }
          avatar: { type: string }
          
Responses:
  200:
    description: Profile updated
  400:
    description: Invalid input
  401:
    description: Unauthorized
```

### Matchmaking API

#### Search for Match
```yaml
POST /api/matchmaking/search

RequestBody:
  content:
    application/json:
      schema:
        type: object
        properties:
          playerId: { type: string, required: true }
          region: { type: string }
          maxLatencyMs: { type: number }
          tolerance: { type: number }
          
Responses:
  200:
    description: Match candidates
    content:
      application/json:
        schema:
          type: object
          properties:
            candidates:
              type: array
              items:
                type: object
                properties:
                  playerId: { type: string }
                  score: { type: number }
                  rating: { type: number }
```

#### Get Match Status
```yaml
GET /api/matchmaking/status/{matchId}

Responses:
  200:
    description: Match status
    content:
      application/json:
        schema:
          type: object
          properties:
            matchId: { type: string }
            status: 
              type: string
              enum: [searching, found, in_progress, completed]
            players: { type: array }
            startTime: { type: string, format: date-time }
```

### Game API

#### Create Match
```yaml
POST /api/game/match

RequestBody:
  content:
    application/json:
      schema:
        type: object
        properties:
          players:
            type: array
            items: { type: string }
          mode: { type: string }
          seed: { type: number }
          
Responses:
  201:
    description: Match created
    content:
      application/json:
        schema:
          type: object
          properties:
            matchId: { type: string }
            gameState: { type: object }
```

#### Submit Match Result
```yaml
POST /api/game/match/{matchId}/result

RequestBody:
  content:
    application/json:
      schema:
        type: object
        properties:
          winner: { type: string }
          score: { type: object }
          replay: { type: string }
          signature: { type: string }
          
Responses:
  200:
    description: Result recorded
  400:
    description: Invalid result
  409:
    description: Result already submitted
```

### Blockchain API

#### Get Transaction Status
```yaml
GET /api/blockchain/tx/{txHash}

Responses:
  200:
    description: Transaction details
    content:
      application/json:
        schema:
          type: object
          properties:
            hash: { type: string }
            status: { type: string, enum: [pending, confirmed, failed] }
            blockNumber: { type: number }
            from: { type: string }
            to: { type: string }
```

#### Claim Rewards
```yaml
POST /api/blockchain/rewards/claim

RequestBody:
  content:
    application/json:
      schema:
        type: object
        properties:
          playerId: { type: string }
          amount: { type: number }
          matchId: { type: string }
          signature: { type: string }
          
Responses:
  200:
    description: Reward claim initiated
    content:
      application/json:
        schema:
          type: object
          properties:
            txHash: { type: string }
```

### Analytics API

#### Record Event
```yaml
POST /api/analytics/event

RequestBody:
  content:
    application/json:
      schema:
        type: object
        properties:
          type: { type: string }
          data: { type: object }
          timestamp: { type: number }
          
Responses:
  204:
    description: Event recorded
```

#### Get Performance Metrics
```yaml
GET /api/analytics/metrics

Parameters:
  - name: playerId
    in: query
    schema: { type: string }
  - name: startDate
    in: query
    schema: { type: string, format: date }
  - name: endDate
    in: query
    schema: { type: string, format: date }
    
Responses:
  200:
    description: Performance data
    content:
      application/json:
        schema:
          type: object
          properties:
            metrics:
              type: object
              properties:
                FCP: { type: number }
                LCP: { type: number }
                CLS: { type: number }
```

### Admin API

#### Get Economic Report
```yaml
GET /api/admin/economic/report

Headers:
  Authorization: Bearer <ADMIN_TOKEN>
  
Responses:
  200:
    description: Economic monitoring data
    content:
      application/json:
        schema:
          type: object
          properties:
            totalSupply: { type: number }
            inflationRate: { type: number }
            violations: { type: array }
```

#### Update Feature Flag
```yaml
PUT /api/admin/flags/{flagId}

RequestBody:
  content:
    application/json:
      schema:
        type: object
        properties:
          enabled: { type: boolean }
          rolloutPercentage: { type: number }
          
Responses:
  200:
    description: Flag updated
```

## WebSocket Events (Future)

### Connection
```javascript
const ws = new WebSocket('wss://bassball.game/ws');
ws.send(JSON.stringify({
  type: 'auth',
  token: '<JWT_TOKEN>'
}));
```

### Game State Updates
```javascript
// Server → Client
{
  type: 'gameState',
  matchId: 'match_123',
  state: {
    timestamp: 1234567890,
    players: [...],
    ball: { x, y, vx, vy }
  }
}
```

### Player Actions
```javascript
// Client → Server
{
  type: 'playerAction',
  matchId: 'match_123',
  action: 'shoot',
  params: { power: 0.8, angle: 45 }
}
```

### Match Events
```javascript
// Server → Client
{
  type: 'matchEvent',
  event: 'goal',
  playerId: 'player_456',
  score: { home: 2, away: 1 }
}
```

## Rate Limits

- **Anonymous:** 60 requests/minute
- **Authenticated:** 600 requests/minute
- **Admin:** 6000 requests/minute

Headers:
```
X-RateLimit-Limit: 600
X-RateLimit-Remaining: 598
X-RateLimit-Reset: 1234567890
```

## Error Responses

### Standard Error Format
```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Player ID is required",
    "details": {
      "field": "playerId",
      "reason": "missing"
    }
  }
}
```

### Common Error Codes
- `UNAUTHORIZED` - Invalid or missing authentication
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `INVALID_INPUT` - Request validation failed
- `RATE_LIMITED` - Too many requests
- `INTERNAL_ERROR` - Server error
- `BLOCKCHAIN_ERROR` - Smart contract interaction failed

## SDK Usage

### JavaScript/TypeScript

Install:
```bash
npm install @bassball/sdk
```

Basic usage:
```typescript
import { BassBallClient } from '@bassball/sdk';

const client = new BassBallClient({
  apiUrl: 'https://bassball.game',
  walletProvider: window.ethereum
});

// Authenticate
await client.auth.connect();

// Get player profile
const profile = await client.player.get('player_123');

// Search for match
const candidates = await client.matchmaking.search({
  region: 'us-east',
  maxLatencyMs: 100
});

// Subscribe to match updates (WebSocket)
client.on('matchFound', (match) => {
  console.log('Match found:', match);
});
```

### Python (Future)

```python
from bassball import Client

client = Client(api_url='https://bassball.game')

# Get leaderboard
leaderboard = client.leaderboard.get(limit=100)

# Analytics
metrics = client.analytics.get_metrics(
    player_id='player_123',
    start_date='2026-01-01'
)
```

## Webhooks (Future)

Register webhooks for server-to-server events:

```yaml
POST /api/webhooks

RequestBody:
  url: https://your-server.com/webhook
  events: ['match.completed', 'transaction.confirmed']
  secret: <WEBHOOK_SECRET>
```

Webhook payload example:
```json
{
  "event": "match.completed",
  "timestamp": 1234567890,
  "data": {
    "matchId": "match_123",
    "winner": "player_456",
    "score": { "home": 10, "away": 8 }
  },
  "signature": "<HMAC_SHA256>"
}
```

## Changelog

See [CHANGELOG.md](../CHANGELOG.md) for API version history and breaking changes.

## Support

- **API Issues:** [GitHub Issues](https://github.com/Bass-Ball/issues)
- **Developer Discord:** [Join here](https://discord.gg/bassball)
- **Email:** developers@bassball.game
