# 🌐 Real-Time Communication & Optional 3D Graphics

## Part 1: Socket.IO Client (ESSENTIAL)

### Why Socket.IO for Gaming?

| Feature | Socket.IO | REST API | WebSocket Raw |
|---------|-----------|----------|---------------|
| **Latency** | 50-100ms | 200-500ms | 50-100ms |
| **Reconnection** | Automatic ✅ | Manual | Manual |
| **Fallback** | HTTP Long-Polling | N/A | N/A |
| **Setup** | Easy | Easy | Complex |
| **Battle-tested** | Yes (1M+ apps) | Yes | Risky |
| **Gaming Ready** | ✅ Perfect | ❌ Too slow | ⚠️ Complex |

### Installation

```bash
npm install socket.io-client
npm install --save-dev @types/socket.io-client
```

### Complete Configuration

**`lib/websocket/socket.ts`**

```typescript
import io, { Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initializeSocket = (userId: string, matchId?: string): Socket => {
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

  if (!socket) {
    socket = io(socketUrl, {
      auth: {
        userId,
        matchId,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'], // Fallback to polling if WebSocket fails
      upgrade: true,
      rememberUpgrade: true,
      path: '/socket.io/',
      
      // For production
      rejectUnauthorized: process.env.NODE_ENV === 'production',
      secure: process.env.NODE_ENV === 'production',
    });

    // Connection events
    socket.on('connect', () => {
      console.log('✅ Connected to server');
    });

    socket.on('disconnect', (reason) => {
      console.log(`❌ Disconnected: ${reason}`);
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    socket.on('reconnect_attempt', () => {
      console.log('🔄 Reconnecting...');
    });

    socket.on('reconnect', () => {
      console.log('✅ Reconnected to server');
    });
  }

  return socket;
};

export const getSocket = (): Socket => {
  if (!socket) {
    throw new Error('Socket not initialized. Call initializeSocket first.');
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
```

---

## Game-Specific Events

### Match Events

**`lib/websocket/match-events.ts`**

```typescript
import { Socket } from 'socket.io-client';

export interface GameAction {
  matchId: string;
  playerId: string;
  action: 'move' | 'kick' | 'pass' | 'shoot';
  x: number;
  y: number;
  power: number;
  direction: number;
  timestamp: number;
}

export interface GameState {
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
}

export interface MatchResult {
  matchId: string;
  winner: string;
  loser: string;
  score: [number, number];
  duration: number;
  ratingChange: { winner: number; loser: number };
}

// Setup game event listeners
export const setupMatchListeners = (socket: Socket, callbacks: {
  onGameStateUpdate: (state: GameState) => void;
  onMatchEnded: (result: MatchResult) => void;
  onPlayerDisconnected: (playerId: string) => void;
  onError: (error: string) => void;
}) => {
  // Server sends updated game state
  socket.on('GAME_STATE_UPDATE', (state: GameState) => {
    callbacks.onGameStateUpdate(state);
  });

  // Match ended
  socket.on('MATCH_RESULT', (result: MatchResult) => {
    callbacks.onMatchEnded(result);
  });

  // Opponent disconnected
  socket.on('PLAYER_DISCONNECTED', (playerId: string) => {
    callbacks.onPlayerDisconnected(playerId);
  });

  // Server error
  socket.on('ERROR', (error: string) => {
    callbacks.onError(error);
  });

  // Cleanup function
  return () => {
    socket.off('GAME_STATE_UPDATE');
    socket.off('MATCH_RESULT');
    socket.off('PLAYER_DISCONNECTED');
    socket.off('ERROR');
  };
};

// Send action to server
export const sendGameAction = (
  socket: Socket,
  action: GameAction
): Promise<boolean> => {
  return new Promise((resolve) => {
    socket.emit('MATCH_ACTION', action, (ack: boolean) => {
      resolve(ack);
    });
  });
};

// Acknowledge receipt
export const setupAckListener = (socket: Socket) => {
  socket.on('ACTION_RECEIVED', (actionId: string) => {
    console.log(`✅ Action ${actionId} received by server`);
  });
};
```

---

## React Integration

### Custom Hook for WebSocket

**`lib/hooks/useWebSocket.ts`**

```typescript
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import {
  initializeSocket,
  getSocket,
  disconnectSocket,
  GameAction,
  GameState,
  MatchResult,
  setupMatchListeners,
  sendGameAction,
} from '@/lib/websocket/match-events';

interface UseWebSocketProps {
  userId: string;
  matchId?: string;
  onStateUpdate: (state: GameState) => void;
  onMatchEnd: (result: MatchResult) => void;
  onOpponentDisconnect: () => void;
}

export const useWebSocket = ({
  userId,
  matchId,
  onStateUpdate,
  onMatchEnd,
  onOpponentDisconnect,
}: UseWebSocketProps) => {
  const socketRef = useRef<Socket | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Initialize socket
    socketRef.current = initializeSocket(userId, matchId);
    const socket = socketRef.current;

    // Setup event listeners
    cleanupRef.current = setupMatchListeners(socket, {
      onGameStateUpdate: onStateUpdate,
      onMatchEnded: onMatchEnd,
      onPlayerDisconnected: onOpponentDisconnect,
      onError: (error) => console.error('Socket error:', error),
    });

    // Cleanup on unmount
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
      disconnectSocket();
    };
  }, [userId, matchId, onStateUpdate, onMatchEnd, onOpponentDisconnect]);

  const sendAction = useCallback(
    async (
      action: 'move' | 'kick' | 'pass' | 'shoot',
      x: number,
      y: number,
      power: number,
      direction: number
    ) => {
      if (!socketRef.current) {
        console.error('Socket not initialized');
        return false;
      }

      const gameAction: GameAction = {
        matchId: matchId || '',
        playerId: userId,
        action,
        x,
        y,
        power,
        direction,
        timestamp: Date.now(),
      };

      return await sendGameAction(socketRef.current, gameAction);
    },
    [userId, matchId]
  );

  const getConnectionStatus = useCallback(() => {
    return socketRef.current?.connected ?? false;
  }, []);

  return {
    sendAction,
    isConnected: getConnectionStatus(),
  };
};
```

### Match Component with WebSocket

**`components/game/MatchWithWebSocket.tsx`**

```typescript
'use client';

import { useState, useCallback } from 'react';
import { PhaserGame } from './PhaserGame';
import { useWebSocket } from '@/lib/hooks/useWebSocket';
import { GameState, MatchResult } from '@/lib/websocket/match-events';

interface MatchWithWebSocketProps {
  matchId: string;
  userId: string;
}

export const MatchWithWebSocket: React.FC<MatchWithWebSocketProps> = ({
  matchId,
  userId,
}) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [isOpponentDisconnected, setIsOpponentDisconnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  const { sendAction, isConnected } = useWebSocket({
    userId,
    matchId,
    onStateUpdate: (state) => {
      setGameState(state);
    },
    onMatchEnd: (result) => {
      setMatchResult(result);
    },
    onOpponentDisconnect: () => {
      setIsOpponentDisconnected(true);
    },
  });

  // Update connection status
  const handleStateUpdate = useCallback(() => {
    setConnectionStatus(isConnected ? 'connected' : 'disconnected');
  }, [isConnected]);

  if (isOpponentDisconnected) {
    return (
      <div className="w-full h-screen bg-red-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Opponent Disconnected</h2>
          <p className="mb-4">Your opponent has left the match.</p>
          <a href="/leaderboard" className="text-blue-400 hover:underline">
            Return to Leaderboard
          </a>
        </div>
      </div>
    );
  }

  if (matchResult) {
    return (
      <div className="w-full h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-3xl font-bold mb-4">
            {matchResult.winner === userId ? '🎉 You Won!' : '😔 You Lost'}
          </h2>
          <p className="text-xl mb-2">
            {matchResult.score[0]} - {matchResult.score[1]}
          </p>
          <p className="text-lg mb-4">
            Rating: {matchResult.ratingChange.winner > 0 ? '+' : ''}
            {matchResult.ratingChange.winner}
          </p>
          <a href="/match" className="text-blue-400 hover:underline">
            Play Again
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-black flex flex-col">
      {/* Connection Status */}
      <div className="absolute top-4 left-4 flex items-center gap-2 text-white">
        <div
          className={`w-3 h-3 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span className="text-sm">{connectionStatus}</span>
      </div>

      {/* Score Display */}
      {gameState && (
        <div className="absolute top-4 right-4 text-white text-2xl font-bold">
          {gameState.score.p1} - {gameState.score.p2}
        </div>
      )}

      {/* Game Canvas */}
      <div className="flex-1 flex items-center justify-center">
        <PhaserGame
          matchId={matchId}
          gameState={gameState}
          onAction={sendAction}
          onMatchEnd={(result) => setMatchResult(result)}
        />
      </div>

      {/* Timer */}
      {gameState && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-xl font-bold">
          {Math.floor(gameState.timeRemaining / 60)}:
          {(gameState.timeRemaining % 60).toString().padStart(2, '0')}
        </div>
      )}
    </div>
  );
};
```

---

## Network Optimization

### Message Batching

```typescript
// Don't send every frame update
// Instead, batch updates every 100ms

class MatchActionBatcher {
  private pendingActions: GameAction[] = [];
  private batchInterval = 100; // milliseconds

  constructor(private socket: Socket) {
    setInterval(() => this.flush(), this.batchInterval);
  }

  add(action: GameAction) {
    this.pendingActions.push(action);
  }

  private flush() {
    if (this.pendingActions.length > 0) {
      this.socket.emit('BATCH_ACTIONS', this.pendingActions);
      this.pendingActions = [];
    }
  }
}
```

### Interpolation for Smooth Movement

```typescript
// Smooth out opponent position between updates

interface PlayerPosition {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
}

const interpolatePosition = (
  player: PlayerPosition,
  deltaTime: number
): { x: number; y: number } => {
  const dx = player.targetX - player.x;
  const dy = player.targetY - player.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < 1) {
    return { x: player.targetX, y: player.targetY };
  }

  const moveDistance = player.speed * deltaTime;
  const ratio = moveDistance / distance;

  return {
    x: player.x + dx * ratio,
    y: player.y + dy * ratio,
  };
};
```

### Compression

```typescript
// Compress large state updates

const compressGameState = (state: GameState): object => {
  return {
    mid: state.matchId,  // Shorter keys
    b: [state.ball.x, state.ball.y, state.ball.vx, state.ball.vy],
    p: Object.entries(state.players).map(([id, p]) => ({
      id,
      x: Math.round(p.x),
      y: Math.round(p.y),
      v: [Math.round(p.vx), Math.round(p.vy)],
      a: p.animation.charCodeAt(0), // First char as number
    })),
    s: state.score,
    t: state.timeRemaining,
  };
};
```

---

## Error Handling & Resilience

### Reconnection Strategy

```typescript
// Exponential backoff
const reconnectionConfig = {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
};

// With exponential backoff
const delayBackoff = (attempt: number): number => {
  return Math.min(1000 * Math.pow(2, attempt), 5000);
};
```

### Timeout Handling

```typescript
// Emit action with timeout

const sendActionWithTimeout = (
  socket: Socket,
  action: GameAction,
  timeoutMs: number = 5000
): Promise<boolean> => {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      resolve(false); // Timeout - server didn't acknowledge
    }, timeoutMs);

    socket.emit('MATCH_ACTION', action, (ack: boolean) => {
      clearTimeout(timeoutId);
      resolve(ack);
    });
  });
};
```

### Duplicate Prevention

```typescript
// Track sent actions to prevent duplicates on reconnect

class ActionTracker {
  private sentActions = new Map<string, number>();
  private dedupeWindow = 1000; // 1 second

  markSent(actionId: string) {
    this.sentActions.set(actionId, Date.now());
  }

  isDuplicate(actionId: string): boolean {
    const lastSent = this.sentActions.get(actionId);
    if (!lastSent) return false;
    return Date.now() - lastSent < this.dedupeWindow;
  }

  cleanup() {
    // Remove old entries
    const now = Date.now();
    for (const [actionId, timestamp] of this.sentActions.entries()) {
      if (now - timestamp > this.dedupeWindow) {
        this.sentActions.delete(actionId);
      }
    }
  }
}
```

---

## Performance Metrics

### Monitor Connection Quality

```typescript
const monitorConnection = (socket: Socket) => {
  let lastMessageTime = Date.now();
  let messageCount = 0;
  let errorCount = 0;

  // Track latency
  const pingInterval = setInterval(() => {
    const startTime = Date.now();
    socket.emit('ping', () => {
      const latency = Date.now() - startTime;
      console.log(`Latency: ${latency}ms`);

      // Flag if latency is too high
      if (latency > 200) {
        console.warn('⚠️ High latency detected');
      }
    });
  }, 5000);

  // Track message rate
  socket.on('GAME_STATE_UPDATE', () => {
    messageCount++;
    lastMessageTime = Date.now();
  });

  // Cleanup
  return () => clearInterval(pingInterval);
};
```

---

## Part 2: Three.js (Optional - For 3D Graphics Later)

### When to Use Three.js?

✅ **Use Three.js if:**
- You want 3D graphics (stadium, players, ball)
- Need particle effects (rain, stadium lighting)
- Want advanced visual effects
- Plan 3D tournaments

❌ **Skip Three.js if:**
- Want to launch quickly (Phaser is faster)
- Mobile is priority (3D is slower)
- Don't need 3D (2D is fine)

### Installation

```bash
npm install three
npm install --save-dev @types/three
```

### Basic 3D Scene Setup

**`lib/game/three-scene.ts`**

```typescript
import * as THREE from 'three';

export const createThreeScene = (containerId: string) => {
  // Scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a5f2a);

  // Camera (isometric view for stadium)
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(100, 150, 100);
  camera.lookAt(0, 0, 0);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowShadowMap;

  const container = document.getElementById(containerId);
  if (container) {
    container.appendChild(renderer.domElement);
  }

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(100, 200, 100);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  scene.add(directionalLight);

  // Field (pitch)
  const fieldGeometry = new THREE.PlaneGeometry(100, 60);
  const fieldMaterial = new THREE.MeshLambertMaterial({ color: 0x1a5f2a });
  const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
  field.receiveShadow = true;
  scene.add(field);

  // Ball
  const ballGeometry = new THREE.SphereGeometry(2, 32, 32);
  const ballMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    shininess: 100,
  });
  const ball = new THREE.Mesh(ballGeometry, ballMaterial);
  ball.position.z = 2;
  ball.castShadow = true;
  scene.add(ball);

  // Player models (simplified)
  const createPlayer = (x: number, z: number, color: number) => {
    const group = new THREE.Group();

    // Body
    const bodyGeometry = new THREE.BoxGeometry(3, 8, 3);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 4;
    body.castShadow = true;
    group.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(2, 32, 32);
    const headMaterial = new THREE.MeshPhongMaterial({ color: 0xffcc99 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 10;
    head.castShadow = true;
    group.add(head);

    group.position.set(x, 0, z);
    return group;
  };

  const player1 = createPlayer(-30, 0, 0xffff00);
  const player2 = createPlayer(30, 0, 0x0066ff);
  scene.add(player1);
  scene.add(player2);

  // Handle window resize
  const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', onWindowResize);

  // Animation loop
  const animate = () => {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  };
  animate();

  // Cleanup function
  const cleanup = () => {
    window.removeEventListener('resize', onWindowResize);
    renderer.dispose();
    if (container && renderer.domElement.parentElement === container) {
      container.removeChild(renderer.domElement);
    }
  };

  return {
    scene,
    camera,
    renderer,
    ball,
    player1,
    player2,
    cleanup,
  };
};
```

### Phaser + Three.js Hybrid

```typescript
// Use Phaser for game logic
// Use Three.js for rendering (advanced use case)

export const createHybridGame = (containerId: string) => {
  // Phaser handles physics and input
  const phaserGame = new Phaser.Game(phaserConfig);

  // Three.js renders the scene
  const three = createThreeScene(containerId);

  // Sync game state from Phaser to Three.js
  const syncState = (phaserState: any) => {
    // Update Three.js ball position from Phaser
    three.ball.position.set(
      phaserState.ball.x - 512,
      0,
      phaserState.ball.y - 288
    );

    // Update Three.js players
    three.player1.position.set(
      phaserState.players.p1.x - 512,
      0,
      phaserState.players.p1.y - 288
    );
    three.player2.position.set(
      phaserState.players.p2.x - 512,
      0,
      phaserState.players.p2.y - 288
    );
  };

  return { phaserGame, three, syncState };
};
```

---

## Comparison: Phaser vs. Three.js

### Time to Launch

```
Phaser: 1 week to playable game
Three.js: 3-4 weeks with custom physics
Hybrid: 2 weeks (Phaser logic + Three.js render)
```

### Performance

```
Phaser 2D:      60 FPS on mobile ✅
Three.js 3D:    30-45 FPS on mobile ⚠️
Hybrid:         40-50 FPS on mobile ✅
```

### Code Complexity

```typescript
// Phaser - Simple ball physics
this.physics.add.collider(player, ball, this.kickBall);

// Three.js - Custom cannon-es physics
const sphere = new CANNON.Body({ mass: 1 });
world.addBody(sphere);
// More setup required
```

### Recommendation for Bass Ball

**🏆 Use Phaser for MVP** (Faster to market)
- 2D is fun and proven
- Launch in 1-2 weeks
- Get player feedback
- Add 3D later if needed

**📈 Add Three.js for 2.0** (After traction)
- Stadium visuals
- Advanced effects
- Tournaments
- Higher production value

---

## Configuration Summary

### `.env.example`

```env
# Socket.IO
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_PATH=/socket.io/

# Three.js (optional)
NEXT_PUBLIC_USE_3D=false
```

### `package.json` Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "socket:dev": "npm run dev & cd ../backend && npm run dev"
  }
}
```

---

## Testing Real-Time Communication

### Local Testing

```bash
# Terminal 1: Backend server
cd backend
npm run dev

# Terminal 2: Frontend
npm run dev

# Terminal 3: Monitor WebSocket
# Open http://localhost:3000/match
# Open DevTools → Network → WS
```

### Latency Testing

```typescript
// Simulate network latency
const addLatency = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Simulate packet loss
const shouldDropPacket = (dropRate: number) => {
  return Math.random() < dropRate;
};
```

---

## Resources

### Socket.IO
- Docs: https://socket.io/docs/v4/client-api/
- Examples: https://github.com/socketio/socket.io/tree/main/examples
- Real-time Games: https://socket.io/blog/tutorial-building-a-multiplayer-game-with-socket-io-and-babylon-js/

### Three.js
- Docs: https://threejs.org/docs/
- Examples: https://threejs.org/examples/
- Games: https://threejs.org/examples/#webgl_interactive_cubes

### Performance
- WebSocket Best Practices: https://stackoverflow.com/questions/18803969/websocket-protocol-how-to-specify-path
- Real-time Game Architecture: https://gafferongames.com/

---

## Summary Table

| Aspect | Phaser | Socket.IO | Three.js |
|--------|--------|-----------|----------|
| **Bundle** | 570KB | 65KB | 650KB |
| **Learning** | Easy | Easy | Moderate |
| **Latency** | N/A | 50-100ms | N/A |
| **Mobile** | ✅ 60 FPS | ✅ Good | ⚠️ 30-45 FPS |
| **Launch** | ASAP | ASAP | Later |
| **Use Now** | ✅ YES | ✅ YES | ❌ Optional |

---

**Production-ready real-time gaming infrastructure** 🚀
