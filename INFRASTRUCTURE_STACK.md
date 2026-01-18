# Bass-Ball Infrastructure Stack Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                           │
│  Next.js (SSR/SSG) + Phaser/Three.js + Tailwind CSS         │
│  Privy/RainbowKit (Web3 Auth)                               │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    API GATEWAY LAYER                        │
│  Next.js API Routes + tRPC                                  │
│  Rate Limiting + Request Validation                         │
└────────────────────────┬────────────────────────────────────┘
                         │
      ┌──────────────────┼──────────────────┐
      │                  │                  │
┌─────▼────────┐  ┌─────▼────────┐  ┌─────▼────────┐
│   NODE.JS    │  │   WEBSOCKET  │  │   GRAPHQL    │
│   EXPRESS    │  │   SERVER     │  │   THE GRAPH  │
│   REST API   │  │   REAL-TIME  │  │   INDEXING   │
└─────┬────────┘  └─────┬────────┘  └─────┬────────┘
      │                  │                  │
      └──────────────────┼──────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼─────┐   ┌─────▼──────┐  ┌────▼─────┐
    │ DATABASE  │   │ BASE CHAIN │  │  STORAGE  │
    │ PostgreSQL│   │ (8453)     │  │IPFS/      │
    │ Redis     │   │ Smart      │  │Arweave    │
    │           │   │ Contracts  │  │           │
    └───────────┘   └────────────┘  └───────────┘
```

---

## 1. FRONTEND STACK

### Next.js Configuration

**package.json dependencies:**
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "phaser": "^3.55.0",
    "three": "^r151",
    "tailwindcss": "^3.3.0",
    "@privy-io/react-auth": "^1.65.0",
    "wagmi": "^1.4.0",
    "@rainbow-me/rainbowkit": "^1.0.0",
    "viem": "^1.19.0",
    "ethers": "^6.8.0",
    "zustand": "^4.4.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "typescript": "^5.2.0",
    "@types/node": "^20.4.0",
    "@types/react": "^18.2.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0"
  }
}
```

### next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Image optimization
  images: {
    domains: ['ipfs.io', 'gateway.pinata.cloud', 'arweave.net'],
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_BASE_CHAIN_ID: '8453',
    NEXT_PUBLIC_BASE_RPC: process.env.BASE_RPC_URL,
    NEXT_PUBLIC_PRIVY_APP_ID: process.env.PRIVY_APP_ID,
  },

  // WebSocket support
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/api/ws/:path*',
          destination: `http://localhost:3001/ws/:path*`,
        },
      ],
    };
  },

  // Phaser & Three.js optimization
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'canvas': false,
    };
    return config;
  },
};

module.exports = nextConfig;
```

### Authentication Setup (Privy + RainbowKit)

```typescript
// lib/auth-config.ts
import { PrivyProvider } from '@privy-io/react-auth';
import { getBaseChainConfig } from '@privy-io/react-auth';

export const PrivyConfig = {
  appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  config: {
    loginMethods: ['email', 'wallet'],
    appearance: {
      theme: 'dark',
      accentColor: '#0066FF',
    },
    embeddedWallets: {
      createOnLogin: 'users-without-wallets',
      requireUserPasswordOnCreate: false,
    },
    defaultChain: getBaseChainConfig(),
    supportedChains: [getBaseChainConfig()],
  },
};

// pages/_app.tsx
import { PrivyProvider } from '@privy-io/react-auth';
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit';

const { connectors, publicClient } = getDefaultWallets({
  appName: 'Bass Ball',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_ID!,
  chains: [baseChain],
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <PrivyProvider appId={PrivyConfig.appId} config={PrivyConfig.config}>
      <RainbowKitProvider chains={[baseChain]}>
        <Component {...pageProps} />
      </RainbowKitProvider>
    </PrivyProvider>
  );
}
```

### Phaser Game Integration

```typescript
// lib/phaser-config.ts
import Phaser from 'phaser';

export const phaserConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: process.env.NODE_ENV === 'development',
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1024,
    height: 768,
  },
  scene: [MatchScene, TournamentScene, MenuScene],
  audio: {
    disableWebAudio: false,
  },
};
```

### Three.js for 3D

```typescript
// components/ThreeJSScene.tsx
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const ThreeJSScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    containerRef.current.appendChild(renderer.domElement);

    // Player models, court visualization, etc.
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    camera.position.z = 5;

    const animate = () => {
      requestAnimationFrame(animate);
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
};
```

---

## 2. BACKEND STACK

### Express + Node.js Setup

**package.json:**
```json
{
  "dependencies": {
    "express": "^4.18.0",
    "ws": "^8.14.0",
    "dotenv": "^16.3.0",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "express-rate-limit": "^7.0.0",
    "joi": "^17.11.0",
    "pg": "^8.11.0",
    "redis": "^4.6.0",
    "ethers": "^6.8.0",
    "viem": "^1.19.0",
    "@graphql-client/core": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.2.0",
    "@types/express": "^4.17.0",
    "@types/ws": "^8.5.0",
    "ts-node": "^10.9.0"
  }
}
```

### Express Server Setup

```typescript
// server.ts
import express from 'express';
import WebSocket from 'ws';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';

const app = express();
const server = createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Routes
app.post('/api/match/start', async (req, res) => {
  try {
    const { playerId, opponentId, gameType } = req.body;
    
    // Validate match
    // Create match in database
    // Broadcast to opponent via WebSocket
    
    res.json({ matchId: 'match_123', status: 'active' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start match' });
  }
});

app.get('/api/player/:address/stats', async (req, res) => {
  // Fetch from database/cache
  const stats = await getPlayerStats(req.params.address);
  res.json(stats);
});

// WebSocket handling
wss.on('connection', (ws) => {
  ws.on('message', async (data) => {
    const action = JSON.parse(data.toString());
    
    switch (action.type) {
      case 'MATCH_ACTION':
        handleMatchAction(ws, action);
        break;
      case 'CHAT_MESSAGE':
        broadcastToRoom(action.roomId, action);
        break;
      case 'PLAYER_UPDATE':
        updatePlayerState(action);
        break;
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### WebSocket Real-Time Game State

```typescript
// websocket/GameManager.ts
import { WebSocket } from 'ws';

interface GameRoom {
  id: string;
  players: Map<string, PlayerState>;
  gameState: GameState;
  createdAt: number;
}

class GameManager {
  private rooms = new Map<string, GameRoom>();
  private playerConnections = new Map<string, WebSocket>();

  createRoom(gameId: string, players: string[]): GameRoom {
    const room: GameRoom = {
      id: gameId,
      players: new Map(),
      gameState: initializeGameState(),
      createdAt: Date.now(),
    };

    this.rooms.set(gameId, room);
    return room;
  }

  addPlayerToRoom(roomId: string, playerId: string, ws: WebSocket) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.players.set(playerId, { id: playerId, score: 0, status: 'active' });
      this.playerConnections.set(playerId, ws);

      this.broadcastToRoom(roomId, {
        type: 'PLAYER_JOINED',
        playerId,
        gameState: room.gameState,
      });
    }
  }

  handlePlayerAction(roomId: string, playerId: string, action: any) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // Update game state
    const updatedState = this.updateGameState(room.gameState, action);
    room.gameState = updatedState;

    // Broadcast to all players in room
    this.broadcastToRoom(roomId, {
      type: 'GAME_STATE_UPDATE',
      gameState: updatedState,
      action,
    });
  }

  broadcastToRoom(roomId: string, message: any) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const data = JSON.stringify(message);
    room.players.forEach((player) => {
      const ws = this.playerConnections.get(player.id);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });
  }

  private updateGameState(state: GameState, action: any): GameState {
    // Apply action to game state
    switch (action.type) {
      case 'PLAYER_MOVE':
        return { ...state, players: updatePlayerPosition(state.players, action) };
      case 'BALL_HIT':
        return { ...state, ball: updateBallPosition(state.ball, action) };
      case 'SCORE_GOAL':
        return { ...state, scores: updateScores(state.scores, action) };
      default:
        return state;
    }
  }
}

export default new GameManager();
```

### Database Layer (PostgreSQL + Redis)

```typescript
// db/postgres.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const queries = {
  // Player stats
  getPlayerStats: async (address: string) => {
    const result = await pool.query(
      'SELECT * FROM player_stats WHERE wallet_address = $1',
      [address.toLowerCase()]
    );
    return result.rows[0];
  },

  updatePlayerStats: async (address: string, stats: any) => {
    await pool.query(
      `UPDATE player_stats SET 
        wins = $2, losses = $3, rating = $4, last_updated = NOW()
        WHERE wallet_address = $1`,
      [address.toLowerCase(), stats.wins, stats.losses, stats.rating]
    );
  },

  // Match history
  saveMatch: async (matchData: any) => {
    const result = await pool.query(
      `INSERT INTO matches (player1, player2, winner, score, game_type, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [matchData.player1, matchData.player2, matchData.winner, matchData.score, matchData.gameType]
    );
    return result.rows[0];
  },
};

// db/redis.ts
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

export const cache = {
  set: (key: string, value: any, ttl: number = 3600) => {
    redisClient.setEx(key, ttl, JSON.stringify(value));
  },

  get: async (key: string) => {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  },

  del: (key: string) => {
    redisClient.del(key);
  },
};
```

---

## 3. BLOCKCHAIN INTEGRATION (BASE)

### Smart Contracts

```solidity
// contracts/BassToken.sol
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract BassToken is ERC20 {
  constructor() ERC20("Bass Ball", "BASS") {
    _mint(msg.sender, 1000000 * 10 ** decimals());
  }
}

// contracts/BadgesNFT.sol
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BadgesNFT is ERC721, Ownable {
  uint256 private _tokenIdCounter;

  constructor() ERC721("Bass Ball Badges", "BBDG") {}

  function mintBadge(address to, string memory uri) public onlyOwner {
    uint256 tokenId = _tokenIdCounter++;
    _safeMint(to, tokenId);
    _setTokenURI(tokenId, uri);
  }
}
```

### Contract Interaction

```typescript
// lib/contracts.ts
import { ethers } from 'ethers';
import { getPublicClient, getWalletClient } from 'wagmi';

const BADGE_CONTRACT = '0x...';
const BASS_TOKEN_CONTRACT = '0x...';

export const contractInteraction = {
  // Mint badge
  mintBadge: async (playerAddress: string, badgeMetadataURI: string) => {
    const walletClient = await getWalletClient();
    const hash = await walletClient.writeContract({
      account: walletClient.account!.address,
      address: BADGE_CONTRACT,
      abi: BADGE_ABI,
      functionName: 'mintBadge',
      args: [playerAddress, badgeMetadataURI],
    });
    return hash;
  },

  // Transfer tokens
  transferTokens: async (to: string, amount: bigint) => {
    const walletClient = await getWalletClient();
    const hash = await walletClient.writeContract({
      account: walletClient.account!.address,
      address: BASS_TOKEN_CONTRACT,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [to, amount],
    });
    return hash;
  },

  // Get player badges
  getPlayerBadges: async (playerAddress: string) => {
    const publicClient = getPublicClient();
    const balance = await publicClient.readContract({
      address: BADGE_CONTRACT,
      abi: BADGE_ABI,
      functionName: 'balanceOf',
      args: [playerAddress],
    });
    return balance;
  },
};
```

### Paymaster Integration (Gas Sponsorship)

```typescript
// lib/paymaster.ts
import { bundlerActions } from 'permissionless';
import { pimlicoBundlerActions } from 'permissionless/actions/pimlico';

const ENTRY_POINT = '0x0000000071727de22e5e9d8baf0edac6f37da032';
const PAYMASTER_RPC = 'https://api.pimlico.io/v2/8453/rpc';

export const sponsorUserOperation = async (userOp: UserOperation) => {
  const client = createPublicClient({
    transport: http(PAYMASTER_RPC),
  }).extend(bundlerActions(ENTRY_POINT)).extend(pimlicoBundlerActions());

  // Request gas sponsorship
  const sponsorshipResult = await client.sponsorUserOperation({
    userOperation: userOp,
    entryPoint: ENTRY_POINT,
  });

  return sponsorshipResult;
};
```

---

## 4. STORAGE LAYER (IPFS + Arweave)

### IPFS for Metadata

```typescript
// lib/ipfs.ts
import { NFTStorage } from 'nft.storage';

const nftStorage = new NFTStorage({ token: process.env.NFT_STORAGE_KEY! });

export const uploadToIPFS = async (data: {
  name: string;
  description: string;
  image: File;
  attributes: any[];
}) => {
  const metadata = await nftStorage.store({
    name: data.name,
    description: data.description,
    image: data.image,
    attributes: data.attributes,
  });

  return metadata.url; // ipfs://...
};

// Alternative: Pinata
import FormData from 'form-data';
import axios from 'axios';

export const uploadToPinata = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
    headers: {
      pinata_api_key: process.env.PINATA_API_KEY,
      pinata_secret_api_key: process.env.PINATA_SECRET_KEY,
    },
  });

  return `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
};
```

### Arweave for Permanent Storage

```typescript
// lib/arweave.ts
import Arweave from 'arweave';
import { readFileSync } from 'fs';

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
});

export const uploadToArweave = async (data: Buffer, contentType: string) => {
  const tx = await arweave.createTransaction({ data });
  tx.addTag('Content-Type', contentType);

  // Sign with wallet
  const jwk = JSON.parse(process.env.ARWEAVE_WALLET_KEY!);
  await arweave.transactions.sign(tx, jwk);

  // Submit
  const uploader = await arweave.transactions.getUploader(tx);
  while (!uploader.isComplete) {
    await uploader.uploadChunk();
    console.log(`${uploader.pctComplete}% complete`);
  }

  return `https://arweave.net/${tx.id}`;
};
```

---

## 5. INDEXING & QUERYING (The Graph)

### GraphQL Schema

```graphql
# schema.graphql
type Player @entity {
  id: ID!
  address: Bytes!
  name: String!
  rating: Int!
  gamesPlayed: Int!
  wins: Int!
  losses: Int!
  badges: [Badge!]! @derivedFrom(field: "owner")
  matches: [Match!]! @derivedFrom(field: "players")
  createdAt: BigInt!
  updatedAt: BigInt!
}

type Badge @entity {
  id: ID!
  owner: Player!
  tokenId: BigInt!
  badgeType: String!
  rarity: String!
  metadata: String!
  mintedAt: BigInt!
}

type Match @entity {
  id: ID!
  players: [Player!]!
  winner: Player
  score: [Int!]!
  gameType: String!
  duration: Int!
  createdAt: BigInt!
}

type GameStats @entity {
  id: ID!
  totalMatches: Int!
  totalPlayers: Int!
  totalVolumeETH: BigDecimal!
  timestamp: BigInt!
}
```

### Subgraph Configuration

```yaml
# subgraph.yaml
specVersion: 0.0.5
schema:
  file: ./schema.graphql
dataSources:
  - kind: ethereum
    name: BadgesNFT
    network: base
    source:
      address: "0x..."
      abi: ERC721
      startBlock: 1000000
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.9
      language: wasm/assemblyscript
      entities:
        - Badge
      abis:
        - name: ERC721
          file: ./abis/ERC721.json
      eventHandlers:
        - event: Transfer(indexed address,indexed address,indexed uint256)
          handler: handleTransfer
      file: ./src/mapping.ts
```

### GraphQL Queries

```typescript
// lib/graphql.ts
import { gql, request } from 'graphql-request';

const SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/your-org/bass-ball';

export const queries = {
  getPlayerProfile: gql`
    query GetPlayer($address: String!) {
      player(id: $address) {
        id
        name
        rating
        gamesPlayed
        wins
        badges {
          id
          badgeType
          rarity
        }
      }
    }
  `,

  getLeaderboard: gql`
    query GetLeaderboard {
      players(orderBy: rating, orderDirection: desc, first: 100) {
        id
        name
        rating
        wins
        badges {
          badgeType
        }
      }
    }
  `,
};

export const fetchGraphQL = async (query: string, variables: any) => {
  return request(SUBGRAPH_URL, query, variables);
};
```

---

## 6. AUTHENTICATION

### Privy Email → Wallet Flow

```typescript
// lib/privy-setup.ts
import { usePrivy, useLogin } from '@privy-io/react-auth';

export const usePlayerAuth = () => {
  const { user, isReady, logout } = usePrivy();
  const { login } = useLogin({
    onComplete: async (user) => {
      // User authenticated
      const walletAddress = user.wallet?.address;
      const email = user.email?.address;

      // Create or update player profile
      await fetch('/api/player/onboard', {
        method: 'POST',
        body: JSON.stringify({ walletAddress, email }),
      });
    },
  });

  return { user, isReady, logout, login };
};
```

### RainbowKit Wallet Integration

```typescript
// lib/rainbow-kit-setup.ts
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { base } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';

const { chains, publicClient } = configureChains([base], [publicProvider()]);

const { connectors } = getDefaultWallets({
  appName: 'Bass Ball',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_ID!,
  chains,
});

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});
```

---

## 7. DEPLOYMENT

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - '3000:3000'
    environment:
      NEXT_PUBLIC_BASE_RPC: ${BASE_RPC_URL}
      NEXT_PUBLIC_PRIVY_APP_ID: ${PRIVY_APP_ID}
    depends_on:
      - backend

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - '3001:3001'
    environment:
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
      BASE_RPC_URL: ${BASE_RPC_URL}
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    ports:
      - '6379:6379'

volumes:
  postgres_data:
```

### GitHub Actions CI/CD

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install dependencies
        run: npm install

      - name: Run tests
        run: npm test

      - name: Build frontend
        run: npm run build

      - name: Deploy to Vercel
        uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

      - name: Deploy backend to Railway
        uses: railway-app/deploy-action@v1
        with:
          token: ${{ secrets.RAILWAY_TOKEN }}
```

---

## 8. ENVIRONMENT VARIABLES

```env
# Frontend
NEXT_PUBLIC_BASE_CHAIN_ID=8453
NEXT_PUBLIC_BASE_RPC=https://mainnet.base.org
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
NEXT_PUBLIC_WALLETCONNECT_ID=your-walletconnect-id
NEXT_PUBLIC_GRAPH_ENDPOINT=https://api.thegraph.com/subgraphs/name/your-org/bass-ball

# Backend
DATABASE_URL=postgresql://user:password@localhost:5432/bassball
REDIS_URL=redis://localhost:6379
BASE_RPC_URL=https://mainnet.base.org
PRIVATE_KEY=your-deployer-private-key

# Storage
NFT_STORAGE_KEY=your-nft-storage-key
PINATA_API_KEY=your-pinata-key
PINATA_SECRET_KEY=your-pinata-secret
ARWEAVE_WALLET_KEY=your-arweave-wallet-key

# Deployment
VERCEL_TOKEN=your-vercel-token
RAILWAY_TOKEN=your-railway-token
```

---

## 9. PERFORMANCE OPTIMIZATION

### Caching Strategy

```typescript
// Cache layers:
1. Browser Cache (Next.js Static Generation)
   - Badge metadata: 24h
   - Leaderboards: 1h

2. Redis Cache (Backend)
   - Player stats: 5m
   - Active matches: 30s
   - Leaderboards: 1h

3. CDN Cache (Images/Assets)
   - IPFS/Arweave gateways
   - Cloudflare for optimization
```

### Code Splitting

```typescript
// pages/match.tsx
import dynamic from 'next/dynamic';

const PhaserGame = dynamic(() => import('@/components/PhaserGame'), {
  ssr: false,
  loading: () => <div>Loading game...</div>,
});

export default function MatchPage() {
  return <PhaserGame />;
}
```

---

## 10. SECURITY CONSIDERATIONS

### Smart Contract Security

```typescript
// Security checklist:
- [ ] Audited by reputable firm (Trail of Bits, OpenZeppelin)
- [ ] Protected against reentrancy
- [ ] Input validation on all functions
- [ ] Access control (onlyOwner, role-based)
- [ ] Gas optimization
```

### Backend Security

```typescript
// security/middleware.ts
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

app.use(helmet()); // Secure headers
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(express.json({ limit: '10kb' })); // Prevent large payloads
app.use(cors({ origin: process.env.FRONTEND_URL }));

// Input validation
import Joi from 'joi';
const matchSchema = Joi.object({
  playerId: Joi.string().required(),
  opponentId: Joi.string().required(),
  gameType: Joi.string().valid('quick_tap', 'rhythm_match', 'deck_duel').required(),
});
```

### Frontend Security

```typescript
// lib/security.ts
// CSP (Content Security Policy)
const CSP_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval'; img-src 'self' https:",
};

// XSS Protection
const sanitizeInput = (input: string) => {
  return input.replace(/[<>]/g, '');
};

// CORS
const ALLOWED_ORIGINS = [process.env.FRONTEND_URL];
```

---

## Summary Table

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js | SSR/SSG web framework |
| **Gaming** | Phaser 3 | 2D game engine |
| **3D Graphics** | Three.js | 3D rendering |
| **Styling** | Tailwind CSS | Utility CSS |
| **Auth** | Privy/RainbowKit | Web3 authentication |
| **Backend** | Node.js + Express | REST API server |
| **Real-time** | WebSockets | Live game updates |
| **Database** | PostgreSQL | Persistent data |
| **Cache** | Redis | Session/performance cache |
| **Blockchain** | Base (EVM) | Transaction settlement |
| **Contracts** | Solidity | Smart contracts |
| **Storage** | IPFS/Arweave | Decentralized files |
| **Indexing** | The Graph | Blockchain data queries |
| **Deployment** | Vercel/Railway | App hosting |

This stack provides **scalability**, **security**, **decentralization**, and **superior UX** for a Web3 gaming platform! 🚀
