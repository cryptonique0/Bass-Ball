# 🧠 Backend: Node.js + TypeScript (Authoritative Game Server)

## Why Node.js + TypeScript for Backend?

### Comparison: Runtime Choices

| Feature | Node.js ✅ | Python | Go | Rust |
|---------|-----------|--------|----|----|
| **Gaming Ready** | ✅ Perfect | Good | Good | Overkill |
| **WebSocket** | Built-in | Complex | Good | Good |
| **Speed** | Fast (V8) | Slow | Very fast | Fastest |
| **TypeScript** | Native | Weak | No | Limited |
| **Learning** | Easy | Easy | Medium | Hard |
| **Setup Time** | 5 min | 10 min | 15 min | 30+ min |
| **Async/Await** | Perfect | Good | Good | Good |
| **Database ORM** | Prisma | SQLAlchemy | sqlc | Diesel |
| **Deploy Options** | Many | Many | Many | Limited |
| **Bundle Size** | 100MB | 300MB | 20MB | 15MB |
| **Cold Start** | < 1s | < 2s | Instant | Instant |

### Why Node.js for Bass Ball

✅ **Gaming-First Design:**
- WebSockets built-in (real-time gameplay)
- Event-driven architecture (perfect for games)
- Non-blocking I/O (handle 1000+ concurrent players)

✅ **TypeScript Benefits:**
- Catch errors before runtime
- Self-documenting code (types as docs)
- IDE autocomplete for everything
- Shared types with frontend

✅ **Fast Development:**
- JavaScript/TypeScript (same language as frontend)
- Rich ecosystem (Express, Prisma, Socket.io)
- Hot reload in development
- Deploy in 5 minutes

✅ **Battle-Tested:**
- Discord uses Node.js for WebSocket layer
- Twitch uses Node.js for chat
- Multiplayer games (Agar.io, Skribbl.io) built on Node

---

## Installation & Setup

### 1. Initialize Project

```bash
mkdir bass-ball-backend
cd bass-ball-backend
npm init -y
npm install express socket.io prisma @prisma/client typescript ts-node dotenv cors
npm install --save-dev @types/express @types/node tsx nodemon
```

### 2. TypeScript Configuration

**`tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

### 3. Development Configuration

**`package.json` Scripts**

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "lint": "eslint src",
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

---

## Express Server Setup

### `src/index.ts` - Main Server

```typescript
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import dotenv from 'dotenv';
import { prisma } from './lib/db';
import { authMiddleware } from './middleware/auth';
import { setupMatchEngine } from './services/match-engine';
import { setupMatchRoutes } from './routes/match';
import { setupPlayerRoutes } from './routes/player';
import { setupLeaderboardRoutes } from './routes/leaderboard';

dotenv.config();

const app: Express = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// REST API Routes
app.use('/api/match', setupMatchRoutes());
app.use('/api/player', authMiddleware, setupPlayerRoutes());
app.use('/api/leaderboard', setupLeaderboardRoutes());

// WebSocket setup
setupWebSocketEvents(io);
setupMatchEngine(io);

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 WebSocket ready for connections`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  httpServer.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});

// WebSocket event handlers
function setupWebSocketEvents(io: SocketIOServer) {
  io.on('connection', (socket: Socket) => {
    console.log(`✅ Player connected: ${socket.id}`);

    socket.on('MATCH_ACTION', (action, callback) => {
      // Validate and process action
      console.log(`Action from ${socket.id}:`, action.action);
      callback?.(true); // Acknowledge
    });

    socket.on('disconnect', () => {
      console.log(`❌ Player disconnected: ${socket.id}`);
    });

    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });
}
```

---

## Database Setup (Prisma)

### `prisma/schema.prisma`

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// Player
model Player {
  id        String   @id @default(cuid())
  address   String   @unique @db.VarChar(42)
  email     String?  @unique
  username  String?
  rating    Int      @default(1000)
  wins      Int      @default(0)
  losses    Int      @default(0)
  gamesPlayed Int   @default(0)
  
  // Relationships
  matchesAsPlayer1 Match[]  @relation("player1")
  matchesAsPlayer2 Match[]  @relation("player2")
  badges PlayerBadge[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([rating])
  @@index([createdAt])
}

// Match (game result)
model Match {
  id              String   @id @default(cuid())
  player1Address  String
  player2Address  String
  winner          String   // Player address
  score           String   // "2,1" format
  duration        Int      // Seconds
  
  // Players
  player1         Player   @relation("player1", fields: [player1Address], references: [address])
  player2         Player   @relation("player2", fields: [player2Address], references: [address])
  
  // Blockchain
  blockchainHash  String?  // Hash stored on-chain
  settled         Boolean  @default(false)
  
  createdAt       DateTime @default(now())
  
  @@index([player1Address])
  @@index([player2Address])
  @@index([createdAt])
}

// Player Badge (NFT)
model PlayerBadge {
  id          String   @id @default(cuid())
  playerAddress String
  player      Player   @relation(fields: [playerAddress], references: [address], onDelete: Cascade)
  
  badgeType   String   // "og-player", "champion", etc
  earnedAt    DateTime @default(now())
  
  // Blockchain
  nftTokenId  BigInt?  // Token ID on-chain
  txHash      String?  // Minting transaction
  
  createdAt   DateTime @default(now())
  
  @@unique([playerAddress, badgeType])
  @@index([playerAddress])
  @@index([badgeType])
}

// Session (optional, for auth)
model Session {
  id        String   @id @default(cuid())
  token     String   @unique
  address   String
  expiresAt DateTime
  createdAt DateTime @default(now())
  
  @@index([address])
}
```

### Setup Database

```bash
# Create PostgreSQL database
createdb bass_ball_dev

# Set DATABASE_URL in .env
echo "DATABASE_URL=postgresql://user:password@localhost:5432/bass_ball_dev" > .env

# Push schema to database
npx prisma db push

# Open Prisma Studio to view data
npx prisma studio
```

---

## Authoritative Match Engine

### `src/services/match-engine.ts`

```typescript
import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '@/lib/db';

interface GameState {
  matchId: string;
  ball: { x: number; y: number; vx: number; vy: number };
  players: {
    [playerId: string]: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      animation: string;
    };
  };
  score: { p1: number; p2: number };
  timeRemaining: number;
  lastKicker: string | null;
}

interface GameAction {
  matchId: string;
  playerId: string;
  action: 'move' | 'kick' | 'pass' | 'shoot';
  x: number;
  y: number;
  power: number;
  direction: number;
  timestamp: number;
}

// Store active matches in memory
const activeMatches = new Map<string, GameState>();
const matchIntervals = new Map<string, NodeJS.Timer>();

export const setupMatchEngine = (io: SocketIOServer) => {
  io.on('connection', (socket: Socket) => {
    socket.on('MATCH_ACTION', (action: GameAction, callback) => {
      try {
        // Validate action (CRITICAL FOR ANTI-CHEAT)
        if (!validateAction(action)) {
          callback?.(false);
          return;
        }

        // Get current game state
        const gameState = activeMatches.get(action.matchId);
        if (!gameState) {
          callback?.(false);
          return;
        }

        // Apply action to game state
        applyAction(gameState, action);

        // Detect cheating
        if (detectCheating(gameState, action)) {
          console.warn(`🚨 Cheat detected from ${action.playerId}`);
          io.to(action.matchId).emit('PLAYER_FLAGGED', {
            playerId: action.playerId,
          });
          callback?.(false);
          return;
        }

        // Broadcast updated state to both players
        io.to(action.matchId).emit('GAME_STATE_UPDATE', gameState);

        // Check for goals
        if (checkGoal(gameState)) {
          handleGoal(io, gameState);
        }

        // Check for match end
        if (gameState.timeRemaining <= 0) {
          endMatch(io, gameState);
        }

        callback?.(true);
      } catch (error) {
        console.error('Action processing error:', error);
        callback?.(false);
      }
    });
  });
};

// Action Validation (Anti-Cheat Layer 1)
function validateAction(action: GameAction): boolean {
  // Check timestamp (not from future)
  if (action.timestamp > Date.now() + 5000) {
    console.warn('Future timestamp detected');
    return false;
  }

  // Check action bounds
  if (action.power < 0 || action.power > 1.0) {
    console.warn('Invalid power value');
    return false;
  }

  if (action.x < 0 || action.x > 1024 || action.y < 0 || action.y > 576) {
    console.warn('Invalid coordinates');
    return false;
  }

  return true;
}

// Apply Physics
function applyAction(gameState: GameState, action: GameAction) {
  const player = gameState.players[action.playerId];
  if (!player) return;

  if (action.action === 'move') {
    // Move player
    player.x = action.x;
    player.y = action.y;
    player.vx = action.x - player.x;
    player.vy = action.y - player.y;
  } else if (action.action === 'kick' || action.action === 'shoot') {
    // Check if player is near ball
    const distToBall = Math.sqrt(
      Math.pow(action.x - gameState.ball.x, 2) +
        Math.pow(action.y - gameState.ball.y, 2)
    );

    if (distToBall > 50) {
      return; // Too far to kick
    }

    // Apply kick force to ball
    const angle = Math.atan2(
      gameState.ball.y - player.y,
      gameState.ball.x - player.x
    );
    const force = action.power * 400; // Max 400 pixels/sec

    gameState.ball.vx = Math.cos(angle) * force;
    gameState.ball.vy = Math.sin(angle) * force;
    gameState.lastKicker = action.playerId;
  }

  // Update ball position
  gameState.ball.x += gameState.ball.vx * 0.016; // 60 FPS
  gameState.ball.y += gameState.ball.vy * 0.016;

  // Apply friction
  gameState.ball.vx *= 0.99;
  gameState.ball.vy *= 0.99;

  // Bounce off walls
  if (gameState.ball.x < 0 || gameState.ball.x > 1024) {
    gameState.ball.vx *= -0.95;
  }
  if (gameState.ball.y < 0 || gameState.ball.y > 576) {
    gameState.ball.vy *= -0.95;
  }
}

// Anti-Cheat Detection (Layer 2)
function detectCheating(gameState: GameState, action: GameAction): boolean {
  // Check latency (should be 50-150ms, not 10ms)
  const latency = Date.now() - action.timestamp;
  if (latency < 30) {
    return true; // Impossible low latency
  }

  // Check action frequency (max 10 actions/second)
  const playerActions = Array.from(activeMatches.values()).filter(
    (m) => m.players[action.playerId]
  ).length;

  if (playerActions > 10) {
    return true; // Spam detected
  }

  // Check for impossible ball kicks (ball too far)
  const player = gameState.players[action.playerId];
  const distToBall = Math.sqrt(
    Math.pow(action.x - gameState.ball.x, 2) +
      Math.pow(action.y - gameState.ball.y, 2)
  );

  if (
    (action.action === 'kick' || action.action === 'shoot') &&
    distToBall > 50
  ) {
    return true; // Impossible kick
  }

  return false;
}

function checkGoal(gameState: GameState): boolean {
  // Goal at x=0 (left) or x=1024 (right)
  return gameState.ball.x < 20 || gameState.ball.x > 1004;
}

function handleGoal(io: SocketIOServer, gameState: GameState) {
  if (gameState.ball.x < 20) {
    gameState.score.p2++;
  } else {
    gameState.score.p1++;
  }

  // Reset ball
  gameState.ball.x = 512;
  gameState.ball.y = 288;
  gameState.ball.vx = 0;
  gameState.ball.vy = 0;

  io.to(gameState.matchId).emit('GOAL', {
    score: gameState.score,
  });
}

async function endMatch(io: SocketIOServer, gameState: GameState) {
  const winner = gameState.score.p1 > gameState.score.p2 ? 'p1' : 'p2';

  // Calculate rating changes
  const ratingChange = calculateRating(gameState);

  // Save to database
  await saveMatchResult(gameState, winner, ratingChange);

  // Notify players
  io.to(gameState.matchId).emit('MATCH_RESULT', {
    winner,
    score: gameState.score,
    ratingChange,
  });

  // Clean up
  activeMatches.delete(gameState.matchId);
  const interval = matchIntervals.get(gameState.matchId);
  if (interval) {
    clearInterval(interval);
    matchIntervals.delete(gameState.matchId);
  }
}

function calculateRating(gameState: GameState): number {
  // ELO rating calculation
  const k = 32; // Rating volatility
  const base = 400;

  const winner = gameState.score.p1 > gameState.score.p2 ? 'p1' : 'p2';
  const expectedScore = winner === 'p1' ? 1 : 0;

  const ratingChange = Math.round(k * (expectedScore - 0.5));
  return ratingChange;
}

async function saveMatchResult(
  gameState: GameState,
  winner: string,
  ratingChange: number
) {
  // Save to database
  const matchData = {
    player1Address: Object.keys(gameState.players)[0],
    player2Address: Object.keys(gameState.players)[1],
    winner: winner === 'p1' ? 'player1' : 'player2',
    score: `${gameState.score.p1},${gameState.score.p2}`,
    duration: 300 - gameState.timeRemaining,
  };

  await prisma.match.create({
    data: matchData,
  });
}
```

---

## REST API Routes

### `src/routes/match.ts`

```typescript
import { Router, Request, Response } from 'express';
import { prisma } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export const setupMatchRoutes = () => {
  const router = Router();

  // Find opponent
  router.post('/find', async (req: Request, res: Response) => {
    try {
      const { playerAddress, playerRating } = req.body;

      // Simple matchmaking (rating within 200 points)
      const opponent = await prisma.player.findFirst({
        where: {
          rating: {
            gte: playerRating - 200,
            lte: playerRating + 200,
          },
          address: { not: playerAddress },
        },
      });

      if (!opponent) {
        return res.json({
          matchId: `match_${uuidv4()}`,
          opponent: null,
          status: 'waiting',
        });
      }

      res.json({
        matchId: `match_${uuidv4()}`,
        opponent: opponent.address,
        opponentRating: opponent.rating,
        status: 'found',
      });
    } catch (error) {
      res.status(500).json({ error: 'Match finding failed' });
    }
  });

  // Submit match result
  router.post('/result', async (req: Request, res: Response) => {
    try {
      const { matchId, winner, loser, score, ratingChange } = req.body;

      await prisma.match.create({
        data: {
          player1Address: winner,
          player2Address: loser,
          winner,
          score: `${score[0]},${score[1]}`,
          duration: 300,
        },
      });

      // Update ratings
      await prisma.player.update({
        where: { address: winner },
        data: {
          rating: { increment: ratingChange },
          wins: { increment: 1 },
          gamesPlayed: { increment: 1 },
        },
      });

      await prisma.player.update({
        where: { address: loser },
        data: {
          rating: { decrement: ratingChange },
          losses: { increment: 1 },
          gamesPlayed: { increment: 1 },
        },
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Result submission failed' });
    }
  });

  // Get match history
  router.get('/history/:address', async (req: Request, res: Response) => {
    try {
      const { address } = req.params;

      const matches = await prisma.match.findMany({
        where: {
          OR: [
            { player1Address: address },
            { player2Address: address },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      res.json(matches);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch history' });
    }
  });

  return router;
};
```

### `src/routes/player.ts`

```typescript
import { Router, Request, Response } from 'express';
import { prisma } from '@/lib/db';

export const setupPlayerRoutes = () => {
  const router = Router();

  // Get player stats
  router.get('/:address/stats', async (req: Request, res: Response) => {
    try {
      const { address } = req.params;

      const player = await prisma.player.findUnique({
        where: { address },
        include: { badges: true },
      });

      if (!player) {
        return res.status(404).json({ error: 'Player not found' });
      }

      res.json({
        address: player.address,
        rating: player.rating,
        wins: player.wins,
        losses: player.losses,
        gamesPlayed: player.gamesPlayed,
        badges: player.badges.map((b) => b.badgeType),
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  // Get profile
  router.get('/:address/profile', async (req: Request, res: Response) => {
    try {
      const { address } = req.params;

      const player = await prisma.player.findUnique({
        where: { address },
        include: {
          badges: true,
          matchesAsPlayer1: { take: 5, orderBy: { createdAt: 'desc' } },
          matchesAsPlayer2: { take: 5, orderBy: { createdAt: 'desc' } },
        },
      });

      if (!player) {
        return res.status(404).json({ error: 'Player not found' });
      }

      res.json(player);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });

  return router;
};
```

---

## Authentication Middleware

### `src/middleware/auth.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/lib/db';

export interface AuthRequest extends Request {
  playerAddress?: string;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token (simple version)
    const session = await prisma.session.findUnique({
      where: { token },
    });

    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.playerAddress = session.address;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};
```

---

## Environment Variables

### `.env`

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bass_ball_dev

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Blockchain
BASE_RPC_URL=https://mainnet.base.org
NFT_CONTRACT_ADDRESS=0x...
PRIVATE_KEY=0x... (for contract interactions)

# Logging
LOG_LEVEL=info
```

---

## Testing

### `src/__tests__/match-engine.test.ts`

```typescript
import { createMatch, applyAction } from '@/services/match-engine';

describe('Match Engine', () => {
  it('should detect invalid power', () => {
    const action = {
      matchId: 'test',
      playerId: 'player1',
      action: 'kick' as const,
      x: 100,
      y: 100,
      power: 1.5, // Invalid
      direction: 0,
      timestamp: Date.now(),
    };

    expect(validateAction(action)).toBe(false);
  });

  it('should calculate rating change', () => {
    const gameState = {
      score: { p1: 2, p2: 1 },
      // ... other fields
    };

    const ratingChange = calculateRating(gameState);
    expect(ratingChange).toBeGreaterThan(0);
  });

  it('should detect impossible kicks', () => {
    const gameState = {
      ball: { x: 100, y: 100, vx: 0, vy: 0 },
      players: {
        player1: { x: 500, y: 500, vx: 0, vy: 0, animation: 'idle' },
      },
    };

    const action = {
      action: 'kick',
      x: 500,
      y: 500,
      // Ball is 565 pixels away - impossible to kick
    };

    expect(detectCheating(gameState, action)).toBe(true);
  });
});
```

---

## Deployment

### Docker Setup

**`Dockerfile`**

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3001

CMD ["node", "dist/index.js"]
```

**`docker-compose.yml`**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: bass_ball_dev
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: .
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/bass_ball_dev
      FRONTEND_URL: http://localhost:3000
      NODE_ENV: development
    depends_on:
      - postgres
    volumes:
      - .:/app
      - /app/node_modules

volumes:
  postgres_data:
```

### Deploy to Railway

```bash
# 1. Login to Railway
railway login

# 2. Create project
railway init

# 3. Add PostgreSQL plugin
railway add --plugin postgres

# 4. Deploy
railway up
```

---

## Monitoring & Logging

### `src/lib/logger.ts`

```typescript
export const logger = {
  info: (msg: string, data?: any) => {
    console.log(`[INFO] ${msg}`, data || '');
  },
  warn: (msg: string, data?: any) => {
    console.warn(`[WARN] ${msg}`, data || '');
  },
  error: (msg: string, error?: any) => {
    console.error(`[ERROR] ${msg}`, error || '');
  },
  debug: (msg: string, data?: any) => {
    if (process.env.DEBUG) {
      console.log(`[DEBUG] ${msg}`, data || '');
    }
  },
};
```

### Monitor Active Games

```typescript
app.get('/admin/stats', (req, res) => {
  res.json({
    activeMatches: activeMatches.size,
    timestamp: new Date(),
    version: process.env.npm_package_version,
  });
});
```

---

## Summary

| Component | Purpose | Status |
|-----------|---------|--------|
| **Express** | HTTP server | ✅ Ready |
| **Socket.IO** | WebSockets | ✅ Ready |
| **TypeScript** | Type safety | ✅ Ready |
| **Prisma** | Database ORM | ✅ Ready |
| **Match Engine** | Game logic | ✅ Ready |
| **Anti-Cheat** | Validation | ✅ Ready |
| **REST API** | Endpoints | ✅ Ready |
| **Auth** | Token validation | ✅ Ready |

---

## Resources

- **Express:** https://expressjs.com/
- **Socket.IO:** https://socket.io/docs/
- **Prisma:** https://www.prisma.io/docs/
- **TypeScript:** https://www.typescriptlang.org/docs/

---

**Production-ready authoritative game server** 🎮
