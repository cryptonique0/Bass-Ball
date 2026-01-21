# @bassball/sdk

Official TypeScript/JavaScript SDK for Bass Ball game API.

## Installation

```bash
npm install @bassball/sdk
```

## Quick Start

```typescript
import { BassBallClient } from '@bassball/sdk';

// Initialize client
const client = new BassBallClient({
  apiUrl: 'https://bassball.game',
  walletProvider: window.ethereum
});

// Authenticate with wallet
await client.auth_connect();

// Get player profile
const profile = await client.player_get('player_123');
console.log(profile.username, profile.rating);

// Search for match
const candidates = await client.matchmaking_search({
  playerId: 'player_123',
  region: 'us-east',
  maxLatencyMs: 100
});

// Listen for events
client.on('matchFound', (match) => {
  console.log('Match found:', match);
});
```

## API Reference

### Constructor

```typescript
new BassBallClient(config: SDKConfig)
```

**Config:**
- `apiUrl` (string, required) - API base URL
- `walletProvider` (any, optional) - Web3 wallet provider
- `authToken` (string, optional) - Pre-existing auth token

### Authentication

#### `auth_connect()`
Authenticate via wallet signature. Returns JWT token.

```typescript
const token = await client.auth_connect();
```

### Player API

#### `player_get(playerId: string)`
Get player profile by ID.

```typescript
const profile = await client.player_get('player_123');
```

#### `player_update(playerId: string, data: Partial<PlayerProfile>)`
Update player profile.

```typescript
await client.player_update('player_123', {
  username: 'NewUsername'
});
```

### Matchmaking API

#### `matchmaking_search(options: MatchSearchOptions)`
Search for match candidates.

```typescript
const candidates = await client.matchmaking_search({
  playerId: 'player_123',
  region: 'us-east',
  maxLatencyMs: 100,
  tolerance: 200
});
```

#### `matchmaking_status(matchId: string)`
Get match status.

```typescript
const status = await client.matchmaking_status('match_456');
```

### Events

#### `on(event: string, handler: Function)`
Subscribe to events. Returns unsubscribe function.

```typescript
const unsubscribe = client.on('matchFound', (match) => {
  console.log(match);
});

// Later...
unsubscribe();
```

#### `emit(event: string, data?: any)`
Emit custom event.

```typescript
client.emit('customEvent', { foo: 'bar' });
```

## Types

```typescript
interface PlayerProfile {
  id: string;
  username: string;
  rating: number;
  stats: {
    wins: number;
    losses: number;
    winrate: number;
  };
  wallet?: string;
}

interface MatchSearchOptions {
  playerId: string;
  region?: string;
  maxLatencyMs?: number;
  tolerance?: number;
}

interface MatchCandidate {
  playerId: string;
  score: number;
  rating: number;
}
```

## Error Handling

```typescript
try {
  const profile = await client.player_get('invalid_id');
} catch (error) {
  console.error('API Error:', error.message);
}
```

## License

MIT
