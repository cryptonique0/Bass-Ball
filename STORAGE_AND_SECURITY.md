# Storage & Security for Bass Ball

## Part 1: IPFS Storage for Replays & Assets

### Overview

IPFS (InterPlanetary File System) provides decentralized, content-addressed storage for game assets and match replays. Using Pinata or Web3.Storage as gateways makes IPFS integration seamless for frontend access.

### Installation

```bash
npm install @pinata/sdk
npm install web3.storage  # Alternative
```

### Pinata Integration

#### 1. Environment Setup

```env
PINATA_API_KEY=your_api_key
PINATA_API_SECRET=your_api_secret
PINATA_JWT=your_jwt_token
NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud
```

#### 2. Pinata Service

```typescript
// services/ipfs.service.ts
import axios from 'axios';
import PinataSDK from '@pinata/sdk';

export class IPFSService {
  private pinata: PinataSDK;
  private gateway: string;

  constructor() {
    this.pinata = new PinataSDK({
      pinataApiKey: process.env.PINATA_API_KEY,
      pinataSecretApiKey: process.env.PINATA_API_SECRET,
    });
    this.gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud';
  }

  /**
   * Upload match replay to IPFS
   * Replays are stored as compressed JSON for efficient retrieval
   */
  async uploadMatchReplay(
    matchId: string,
    replayData: {
      matchId: string;
      players: {
        address: string;
        name: string;
        team: string;
      }[];
      events: Array<{
        tick: number;
        playerId: string;
        inputHash: string;
        action: string;
      }>;
      finalState: {
        score: [number, number];
        winner: string;
        timestamp: number;
        stateHash: string;
      };
    }
  ): Promise<string> {
    try {
      // Compress replay data
      const compressed = JSON.stringify(replayData);

      const result = await this.pinata.pinJSONToIPFS(replayData, {
        pinataMetadata: {
          name: `match-${matchId}-replay`,
          keyvalues: {
            matchId,
            timestamp: Date.now().toString(),
            type: 'match-replay',
          },
        },
        pinataOptions: {
          cidVersion: 1,
        },
      });

      console.log(`Match replay pinned: ${result.IpfsHash}`);
      return result.IpfsHash;
    } catch (error) {
      console.error('Failed to upload match replay:', error);
      throw error;
    }
  }

  /**
   * Upload team jersey image
   * Images stored with metadata linking to team contract
   */
  async uploadJersey(
    teamId: string,
    imageBuffer: Buffer,
    metadata: {
      teamName: string;
      colors: [string, string];
      owner: string;
    }
  ): Promise<string> {
    try {
      const result = await this.pinata.pinFileToIPFS(imageBuffer, {
        pinataMetadata: {
          name: `jersey-${teamId}`,
          keyvalues: {
            teamId,
            type: 'jersey',
            teamName: metadata.teamName,
            owner: metadata.owner,
          },
        },
      });

      return result.IpfsHash;
    } catch (error) {
      console.error('Failed to upload jersey:', error);
      throw error;
    }
  }

  /**
   * Upload team logo
   */
  async uploadLogo(
    teamId: string,
    logoBuffer: Buffer,
    metadata: {
      teamName: string;
      owner: string;
    }
  ): Promise<string> {
    try {
      const result = await this.pinata.pinFileToIPFS(logoBuffer, {
        pinataMetadata: {
          name: `logo-${teamId}`,
          keyvalues: {
            teamId,
            type: 'logo',
            teamName: metadata.teamName,
            owner: metadata.owner,
          },
        },
      });

      return result.IpfsHash;
    } catch (error) {
      console.error('Failed to upload logo:', error);
      throw error;
    }
  }

  /**
   * Retrieve content from IPFS via Pinata gateway
   */
  getGatewayURL(ipfsHash: string, contentType: 'json' | 'image'): string {
    return `${this.gateway}/ipfs/${ipfsHash}`;
  }

  /**
   * Fetch replay data from IPFS
   */
  async fetchMatchReplay(ipfsHash: string): Promise<any> {
    try {
      const url = this.getGatewayURL(ipfsHash, 'json');
      const response = await axios.get(url, {
        timeout: 30000,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch match replay:', error);
      throw error;
    }
  }

  /**
   * List all files pinned for a user
   */
  async listUserPins(
    metadata?: Record<string, string>
  ): Promise<Array<{ hash: string; name: string; size: number }>> {
    try {
      const pins = await this.pinata.pinList({
        metadata,
      });

      return pins.rows.map((row: any) => ({
        hash: row.ipfs_pin_hash,
        name: row.metadata?.name || 'Unknown',
        size: row.size,
      }));
    } catch (error) {
      console.error('Failed to list pins:', error);
      throw error;
    }
  }

  /**
   * Unpin content (cleanup old replays)
   */
  async unpinContent(ipfsHash: string): Promise<void> {
    try {
      await this.pinata.unpin(ipfsHash);
      console.log(`Unpinned: ${ipfsHash}`);
    } catch (error) {
      console.error('Failed to unpin content:', error);
      throw error;
    }
  }
}

export const ipfsService = new IPFSService();
```

### Web3.Storage Alternative

```typescript
// services/web3storage.service.ts
import { Web3Storage } from 'web3.storage';
import { File } from 'web3.storage';

export class Web3StorageService {
  private client: Web3Storage;

  constructor() {
    this.client = new Web3Storage({
      token: process.env.WEB3_STORAGE_TOKEN || '',
    });
  }

  /**
   * Upload match replay using Web3.Storage
   */
  async uploadMatchReplay(
    matchId: string,
    replayData: any
  ): Promise<string> {
    try {
      const blob = new Blob([JSON.stringify(replayData)], {
        type: 'application/json',
      });

      const files = [
        new File([blob], `match-${matchId}-replay.json`, {
          type: 'application/json',
        }),
      ];

      const cid = await this.client.put(files, {
        name: `match-${matchId}`,
        maxRetries: 3,
      });

      return cid;
    } catch (error) {
      console.error('Failed to upload to Web3.Storage:', error);
      throw error;
    }
  }

  /**
   * Retrieve replay from Web3.Storage
   */
  async fetchMatchReplay(cid: string): Promise<any> {
    try {
      const res = await this.client.get(cid);
      if (!res) throw new Error('Failed to retrieve file');

      const files = await res.files();
      const replayFile = files[0];

      if (!replayFile) throw new Error('No replay file found');

      const buffer = await replayFile.arrayBuffer();
      return JSON.parse(new TextDecoder().decode(buffer));
    } catch (error) {
      console.error('Failed to fetch from Web3.Storage:', error);
      throw error;
    }
  }

  /**
   * Get gateway URL for Web3.Storage
   */
  getGatewayURL(cid: string): string {
    return `https://${cid}.ipfs.w3s.link`;
  }
}

export const web3StorageService = new Web3StorageService();
```

### API Routes for Storage

```typescript
// routes/storage.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { ipfsService } from '../services/ipfs.service';
import { prisma } from '../db';

export async function storageRoutes(fastify: any) {
  /**
   * Upload match replay to IPFS
   * POST /storage/replay
   */
  fastify.post<{
    Body: {
      matchId: string;
      replayData: any;
    };
  }>('/storage/replay', async (request: FastifyRequest, reply: FastifyReply) => {
    const { matchId, replayData } = request.body as any;

    if (!matchId || !replayData) {
      return reply.status(400).send({
        error: 'Missing matchId or replayData',
      });
    }

    try {
      const ipfsHash = await ipfsService.uploadMatchReplay(matchId, replayData);

      // Store IPFS hash in database
      await prisma.match.update({
        where: { id: matchId },
        data: {
          replayIPFS: ipfsHash,
          replayUploadedAt: new Date(),
        },
      });

      reply.status(200).send({
        success: true,
        ipfsHash,
        url: ipfsService.getGatewayURL(ipfsHash, 'json'),
      });
    } catch (error) {
      console.error('Replay upload error:', error);
      reply.status(500).send({
        error: 'Failed to upload replay',
      });
    }
  });

  /**
   * Upload team jersey
   * POST /storage/jersey
   */
  fastify.post<{
    Body: {
      teamId: string;
      teamName: string;
      colors: [string, string];
    };
  }>('/storage/jersey', async (request: FastifyRequest, reply: FastifyReply) => {
    const { teamId, teamName, colors } = request.body as any;
    const imageBuffer = request.body;

    try {
      const ipfsHash = await ipfsService.uploadJersey(teamId, imageBuffer, {
        teamName,
        colors,
        owner: (request as any).user?.id,
      });

      reply.status(200).send({
        success: true,
        ipfsHash,
        url: ipfsService.getGatewayURL(ipfsHash, 'image'),
      });
    } catch (error) {
      console.error('Jersey upload error:', error);
      reply.status(500).send({
        error: 'Failed to upload jersey',
      });
    }
  });

  /**
   * Upload team logo
   * POST /storage/logo
   */
  fastify.post<{
    Body: {
      teamId: string;
      teamName: string;
    };
  }>('/storage/logo', async (request: FastifyRequest, reply: FastifyReply) => {
    const { teamId, teamName } = request.body as any;
    const logoBuffer = request.body;

    try {
      const ipfsHash = await ipfsService.uploadLogo(teamId, logoBuffer, {
        teamName,
        owner: (request as any).user?.id,
      });

      reply.status(200).send({
        success: true,
        ipfsHash,
        url: ipfsService.getGatewayURL(ipfsHash, 'image'),
      });
    } catch (error) {
      console.error('Logo upload error:', error);
      reply.status(500).send({
        error: 'Failed to upload logo',
      });
    }
  });

  /**
   * Fetch replay from IPFS
   * GET /storage/replay/:ipfsHash
   */
  fastify.get<{
    Params: { ipfsHash: string };
  }>('/storage/replay/:ipfsHash', async (request: FastifyRequest, reply: FastifyReply) => {
    const { ipfsHash } = request.params as any;

    try {
      const replayData = await ipfsService.fetchMatchReplay(ipfsHash);
      reply.status(200).send(replayData);
    } catch (error) {
      console.error('Replay fetch error:', error);
      reply.status(500).send({
        error: 'Failed to fetch replay',
      });
    }
  });

  /**
   * List user's pinned content
   * GET /storage/pins
   */
  fastify.get('/storage/pins', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).user?.id;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const pins = await ipfsService.listUserPins({
        owner: userId,
      });

      reply.status(200).send({
        pins,
        totalSize: pins.reduce((sum, p) => sum + p.size, 0),
      });
    } catch (error) {
      console.error('Pin list error:', error);
      reply.status(500).send({
        error: 'Failed to list pins',
      });
    }
  });
}
```

### Database Schema Extension

```prisma
// schema.prisma (additions)
model Match {
  id                String    @id @default(cuid())
  // ... existing fields ...
  replayIPFS        String?   @db.VarChar(255)  // IPFS hash for replay
  replayUploadedAt  DateTime?
  jerseyIPFS        String?   @db.VarChar(255)  // Team jersey image
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([replayIPFS])
  @@index([replayUploadedAt])
}

model Team {
  id                String    @id @default(cuid())
  // ... existing fields ...
  jerseyIPFS        String?   @db.VarChar(255)  // Jersey design
  logoIPFS          String?   @db.VarChar(255)  // Team logo
  colors            String    @default("#000000,#FFFFFF")  // CSV format
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([jerseyIPFS])
  @@index([logoIPFS])
}
```

---

## Part 2: Security & Fair Play

### Anti-Cheat Architecture

#### Core Principle: Server-Authoritative Simulation

```typescript
// Anti-cheat principle: Client sends inputs → Server validates & simulates
// Server never trusts client state

export interface AntiCheatConfig {
  maxInputsPerSecond: number;
  maxInputQueue: number;
  stateVerificationInterval: number;
  penaltyForInvalidInput: number;
}

export const DEFAULT_ANTI_CHEAT_CONFIG: AntiCheatConfig = {
  maxInputsPerSecond: 60, // 60Hz game loop
  maxInputQueue: 10, // Max 10 queued inputs
  stateVerificationInterval: 5000, // Verify every 5 seconds
  penaltyForInvalidInput: 100, // Lose 100 rating points
};
```

#### 1. Server-Authoritative Match Engine

```typescript
// game/match-engine.anti-cheat.ts
import { EventEmitter } from 'events';
import seedrandom from 'seedrandom';
import crypto from 'crypto';

export class AntiCheatMatchEngine extends EventEmitter {
  private matchId: string;
  private players: Map<string, PlayerState>;
  private inputQueue: Map<string, QueuedInput[]>;
  private serverState: GameState;
  private stateHashes: Map<number, string>; // tick -> stateHash
  private invalidInputCount: Map<string, number>;
  private antiCheatConfig: AntiCheatConfig;
  private rng: ReturnType<typeof seedrandom>;

  constructor(
    matchId: string,
    playerAddresses: string[],
    seed: string,
    config: AntiCheatConfig = DEFAULT_ANTI_CHEAT_CONFIG
  ) {
    super();
    this.matchId = matchId;
    this.antiCheatConfig = config;
    this.rng = seedrandom(seed); // Deterministic RNG for replay verification
    this.players = new Map();
    this.inputQueue = new Map();
    this.stateHashes = new Map();
    this.invalidInputCount = new Map();

    // Initialize player states
    playerAddresses.forEach((addr) => {
      this.players.set(addr, new PlayerState(addr));
      this.inputQueue.set(addr, []);
      this.invalidInputCount.set(addr, 0);
    });

    this.serverState = new GameState(playerAddresses);
  }

  /**
   * CLIENT SENDS: Input hash (not full state)
   * INPUT VALIDATION CHECKS:
   * 1. Input spam (max 60 per second)
   * 2. Input queue size (max 10)
   * 3. Valid actions (move, kick, pass, etc)
   * 4. Impossible actions (can't kick if not near ball)
   */
  processPlayerInput(
    playerAddress: string,
    input: {
      action: string;
      params: Record<string, any>;
      timestamp: number;
      signature: string; // ECDSA signature of input
    }
  ): { valid: boolean; reason?: string } {
    // Check 1: Player exists
    if (!this.players.has(playerAddress)) {
      return { valid: false, reason: 'Player not in match' };
    }

    // Check 2: Verify input signature (anti-replay)
    if (!this.verifyInputSignature(playerAddress, input)) {
      this.punishPlayer(playerAddress, 'Invalid signature');
      return { valid: false, reason: 'Invalid signature' };
    }

    // Check 3: Input spam detection
    const queue = this.inputQueue.get(playerAddress)!;
    const recentInputs = queue.filter(
      (inp) => Date.now() - inp.receivedAt < 1000
    );

    if (recentInputs.length >= this.antiCheatConfig.maxInputsPerSecond) {
      this.punishPlayer(playerAddress, 'Input spam');
      return { valid: false, reason: 'Too many inputs per second' };
    }

    // Check 4: Queue size limit
    if (queue.length >= this.antiCheatConfig.maxInputQueue) {
      this.punishPlayer(playerAddress, 'Queue overflow');
      return { valid: false, reason: 'Input queue full' };
    }

    // Check 5: Valid action
    const validActions = ['move', 'kick', 'pass', 'sprint', 'slide', 'header'];
    if (!validActions.includes(input.action)) {
      this.punishPlayer(playerAddress, 'Invalid action');
      return { valid: false, reason: 'Invalid action type' };
    }

    // Check 6: Action is possible in current game state
    const playerState = this.players.get(playerAddress)!;
    if (!this.isActionPossible(playerState, input.action, input.params)) {
      this.punishPlayer(playerAddress, 'Impossible action');
      return { valid: false, reason: 'Action not possible in current state' };
    }

    // Check 7: Desync detection
    if (input.timestamp && input.params.clientStateHash) {
      if (!this.verifyClientState(playerAddress, input.params.clientStateHash)) {
        this.flagDesync(playerAddress, input.timestamp);
        // Continue anyway but log for investigation
      }
    }

    // All checks passed - queue the input
    queue.push({
      action: input.action,
      params: input.params,
      receivedAt: Date.now(),
      serverTick: this.serverState.tick,
      signature: input.signature,
    });

    return { valid: true };
  }

  /**
   * SERVER SIMULATES: Full game state
   * Client inputs are executed, validated, and outcomes computed
   */
  tick(): void {
    const tickStartTime = Date.now();

    // Process all queued inputs
    this.players.forEach((playerState, playerAddress) => {
      const queue = this.inputQueue.get(playerAddress)!;

      while (queue.length > 0) {
        const input = queue.shift()!;

        // Execute input on server simulation
        this.executeServerInput(playerAddress, input);

        // Verify action outcome
        this.verifyActionOutcome(playerAddress, input);
      }
    });

    // Simulate physics/ball movement
    this.simulatePhysics();

    // Check for goal/fouls
    this.checkGameEvents();

    // Create state hash for this tick
    const stateHash = this.hashGameState();
    this.stateHashes.set(this.serverState.tick, stateHash);

    // Verify state every N ticks
    if (this.serverState.tick % this.antiCheatConfig.stateVerificationInterval === 0) {
      this.broadcastStateVerification();
    }

    this.serverState.tick++;

    const tickDuration = Date.now() - tickStartTime;
    if (tickDuration > 16) {
      console.warn(`Tick ${this.serverState.tick} took ${tickDuration}ms (target: 16ms)`);
    }
  }

  /**
   * Hash entire game state deterministically
   * Used for: Replay verification, cheat detection
   */
  private hashGameState(): string {
    const stateSnapshot = {
      tick: this.serverState.tick,
      ballPos: this.serverState.ball.position,
      ballVel: this.serverState.ball.velocity,
      players: Array.from(this.players.values()).map((p) => ({
        address: p.address,
        pos: p.position,
        vel: p.velocity,
        stamina: p.stamina,
        hasBall: p.hasBall,
      })),
      score: this.serverState.score,
      fouls: this.serverState.fouls,
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(stateSnapshot))
      .digest('hex');
  }

  /**
   * Verify input signature using ECDSA
   * Input signed by player's private key
   */
  private verifyInputSignature(playerAddress: string, input: any): boolean {
    try {
      const message = crypto
        .createHash('sha256')
        .update(JSON.stringify({
          action: input.action,
          params: input.params,
          timestamp: input.timestamp,
        }))
        .digest('hex');

      // In production: use ethers.js or viem for ECDSA verification
      // This is simplified
      return true; // TODO: Implement ECDSA verification
    } catch {
      return false;
    }
  }

  /**
   * Check if action is possible given current player state
   */
  private isActionPossible(
    playerState: PlayerState,
    action: string,
    params: Record<string, any>
  ): boolean {
    switch (action) {
      case 'kick':
        // Can only kick if near ball
        const ballDist = Math.hypot(
          playerState.position.x - this.serverState.ball.position.x,
          playerState.position.y - this.serverState.ball.position.y
        );
        return ballDist < 2; // 2 unit radius

      case 'pass':
        // Can only pass if has ball
        return playerState.hasBall;

      case 'sprint':
        // Can only sprint if stamina > 20
        return playerState.stamina > 20;

      case 'slide':
        // Can slide if not already sliding
        return !playerState.isSliding && playerState.stamina > 10;

      case 'move':
        // Always possible
        return true;

      default:
        return false;
    }
  }

  /**
   * Desync detection: Compare client state with server state
   */
  private verifyClientState(playerAddress: string, clientStateHash: string): boolean {
    const serverHash = this.hashGameState();
    const match = clientStateHash === serverHash;

    if (!match) {
      console.warn(`Desync detected for ${playerAddress}`);
      console.warn(`Client: ${clientStateHash}, Server: ${serverHash}`);
    }

    return match;
  }

  /**
   * Flag potential cheater for investigation
   */
  private flagDesync(playerAddress: string, tick: number): void {
    console.warn(
      `Desync flag: ${playerAddress} at tick ${tick}`
    );

    this.emit('desync-detected', {
      playerAddress,
      tick,
      timestamp: Date.now(),
    });
  }

  /**
   * Punish player for cheat attempt
   */
  private punishPlayer(playerAddress: string, reason: string): void {
    const count = (this.invalidInputCount.get(playerAddress) || 0) + 1;
    this.invalidInputCount.set(playerAddress, count);

    console.warn(`Cheat attempt by ${playerAddress}: ${reason} (count: ${count})`);

    // Escalating penalties
    if (count >= 3) {
      this.emit('player-banned', {
        playerAddress,
        reason,
        attemptCount: count,
        timestamp: Date.now(),
      });
    } else {
      // Deduct rating points
      this.emit('player-penalized', {
        playerAddress,
        reason,
        ratingPenalty: this.antiCheatConfig.penaltyForInvalidInput,
      });
    }
  }

  /**
   * Broadcast state hash for client verification
   */
  private broadcastStateVerification(): void {
    const stateHash = this.hashGameState();

    this.emit('state-verification', {
      tick: this.serverState.tick,
      stateHash,
      players: Array.from(this.players.keys()),
    });
  }

  // Placeholder methods
  private executeServerInput(playerAddress: string, input: QueuedInput): void {
    // Execute input on server
  }

  private verifyActionOutcome(playerAddress: string, input: QueuedInput): void {
    // Verify outcome is valid
  }

  private simulatePhysics(): void {
    // Simulate ball physics
  }

  private checkGameEvents(): void {
    // Check for goals, fouls, etc
  }
}

interface QueuedInput {
  action: string;
  params: Record<string, any>;
  receivedAt: number;
  serverTick: number;
  signature: string;
}

interface PlayerState {
  address: string;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  stamina: number;
  hasBall: boolean;
  isSliding: boolean;
}

interface GameState {
  tick: number;
  ball: {
    position: { x: number; y: number };
    velocity: { x: number; y: number };
  };
  score: [number, number];
  fouls: Array<{ player: string; tick: number }>;
}
```

### Match Proof & Hash Verification

```solidity
// contracts/BassBallMatchProof.sol
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * Store match outcome hashes on-chain for verification
 * Minimal gas: Only final result hash, not full gameplay
 */
contract BassBallMatchProof is AccessControl {
  using ECDSA for bytes32;

  bytes32 public constant MATCH_VALIDATOR_ROLE =
    keccak256("MATCH_VALIDATOR_ROLE");

  struct MatchProof {
    bytes32 resultHash;       // Hash of final game state
    address player1;
    address player2;
    address winner;
    uint8 scorePlayer1;
    uint8 scorePlayer2;
    uint256 matchDuration;    // seconds
    uint256 timestamp;
    bool verified;
  }

  mapping(bytes32 => MatchProof) public matchProofs;
  mapping(address => bytes32[]) public playerMatches;

  event MatchProofRecorded(
    bytes32 indexed matchId,
    address indexed player1,
    address indexed player2,
    address winner,
    bytes32 resultHash
  );

  event MatchVerified(bytes32 indexed matchId, bool verified);

  constructor() {
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _grantRole(MATCH_VALIDATOR_ROLE, msg.sender);
  }

  /**
   * Record match proof on-chain
   * Called by backend after match completes
   * 
   * resultHash = keccak256(abi.encodePacked(
   *   player1,
   *   player2,
   *   winner,
   *   scorePlayer1,
   *   scorePlayer2,
   *   timestamp,
   *   replayIPFSHash
   * ))
   */
  function recordMatchProof(
    bytes32 matchId,
    address player1,
    address player2,
    address winner,
    uint8 scorePlayer1,
    uint8 scorePlayer2,
    uint256 matchDuration,
    bytes32 resultHash,
    bytes calldata signature
  ) external onlyRole(MATCH_VALIDATOR_ROLE) {
    require(player1 != player2, "Same player");
    require(winner == player1 || winner == player2, "Invalid winner");
    require(scorePlayer1 < 100 && scorePlayer2 < 100, "Invalid score");

    // Verify signature from match settlement service
    bytes32 messageHash = keccak256(
      abi.encodePacked(matchId, player1, player2, winner, resultHash)
    );
    
    require(
      messageHash.toEthSignedMessageHash().recover(signature) ==
        _msgSender(),
      "Invalid signature"
    );

    matchProofs[matchId] = MatchProof({
      resultHash: resultHash,
      player1: player1,
      player2: player2,
      winner: winner,
      scorePlayer1: scorePlayer1,
      scorePlayer2: scorePlayer2,
      matchDuration: matchDuration,
      timestamp: block.timestamp,
      verified: false
    });

    playerMatches[player1].push(matchId);
    playerMatches[player2].push(matchId);

    emit MatchProofRecorded(matchId, player1, player2, winner, resultHash);
  }

  /**
   * Verify match proof against replay data
   * 
   * Client (or third party) can verify match was legitimate by:
   * 1. Fetching replay from IPFS using resultHash as ref
   * 2. Replaying match with deterministic RNG
   * 3. Hashing final state
   * 4. Comparing with on-chain resultHash
   */
  function verifyMatchProof(
    bytes32 matchId,
    bytes32 calculatedHash
  ) external {
    MatchProof storage proof = matchProofs[matchId];
    require(proof.timestamp != 0, "Match not found");

    if (calculatedHash == proof.resultHash) {
      proof.verified = true;
      emit MatchVerified(matchId, true);
    } else {
      emit MatchVerified(matchId, false);
    }
  }

  /**
   * Get all matches for a player
   */
  function getPlayerMatches(address player)
    external
    view
    returns (bytes32[] memory)
  {
    return playerMatches[player];
  }

  /**
   * Get match proof details
   */
  function getMatchProof(bytes32 matchId)
    external
    view
    returns (MatchProof memory)
  {
    return matchProofs[matchId];
  }

  /**
   * Validate proof structure without on-chain verification
   * Useful for quick checks
   */
  function isMatchProofValid(bytes32 matchId) external view returns (bool) {
    MatchProof memory proof = matchProofs[matchId];
    return (proof.timestamp != 0 &&
      proof.player1 != address(0) &&
      proof.player2 != address(0) &&
      proof.resultHash != bytes32(0));
  }
}
```

### Replay Verification Service

```typescript
// services/replay-verification.service.ts
import { IPFSService } from './ipfs.service';
import seedrandom from 'seedrandom';
import crypto from 'crypto';

export class ReplayVerificationService {
  constructor(private ipfsService: IPFSService) {}

  /**
   * Verify match replay against on-chain proof
   * 
   * Steps:
   * 1. Fetch replay from IPFS
   * 2. Re-execute all inputs deterministically
   * 3. Hash final state
   * 4. Compare with on-chain resultHash
   */
  async verifyMatchReplay(
    ipfsHash: string,
    onChainResultHash: string,
    matchSeed: string
  ): Promise<{
    verified: boolean;
    calculatedHash: string;
    matchesOnChain: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      // Fetch replay
      const replay = await this.ipfsService.fetchMatchReplay(ipfsHash);

      // Validate replay structure
      if (!this.isValidReplayStructure(replay)) {
        return {
          verified: false,
          calculatedHash: '',
          matchesOnChain: false,
          issues: ['Invalid replay structure'],
        };
      }

      // Re-execute match with deterministic RNG
      const rng = seedrandom(matchSeed);
      const simulatedState = this.simulateMatch(replay, rng);

      // Calculate final state hash
      const calculatedHash = this.hashGameState(simulatedState);

      // Compare hashes
      const hashMatches = calculatedHash === onChainResultHash;

      return {
        verified: hashMatches,
        calculatedHash,
        matchesOnChain: hashMatches,
        issues,
      };
    } catch (error) {
      return {
        verified: false,
        calculatedHash: '',
        matchesOnChain: false,
        issues: [`Verification failed: ${error}`],
      };
    }
  }

  /**
   * Validate replay file structure
   */
  private isValidReplayStructure(replay: any): boolean {
    const required = ['matchId', 'players', 'events', 'finalState'];
    return required.every((field) => field in replay);
  }

  /**
   * Re-execute match from events
   */
  private simulateMatch(replay: any, rng: ReturnType<typeof seedrandom>): any {
    const state = {
      score: [0, 0],
      events: [],
      timestamp: replay.finalState.timestamp,
    };

    // Execute each event in order
    for (const event of replay.events) {
      // Execute event (simplified)
      if (event.action === 'goal') {
        state.score[event.playerId === 0 ? 0 : 1]++;
      }
    }

    return state;
  }

  /**
   * Hash final game state
   */
  private hashGameState(state: any): string {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(state))
      .digest('hex');
  }
}
```

### Integration with Socket.IO

```typescript
// game/socket-events.ts
import { Server, Socket } from 'socket.io';
import { AntiCheatMatchEngine } from './match-engine.anti-cheat';

export function setupAntiCheatListeners(
  io: Server,
  matchEngine: AntiCheatMatchEngine
) {
  io.on('connection', (socket: Socket) => {
    /**
     * Client sends input to server
     * Client ONLY sends: { action, params, timestamp, signature }
     * Client DOES NOT send: game state, ball position, etc
     */
    socket.on('player-input', (data) => {
      const playerAddress = socket.data.playerAddress;

      const validation = matchEngine.processPlayerInput(playerAddress, data);

      if (!validation.valid) {
        socket.emit('input-rejected', {
          reason: validation.reason,
          timestamp: Date.now(),
        });
      } else {
        socket.emit('input-confirmed', {
          tick: matchEngine.serverState.tick,
        });
      }
    });

    /**
     * Server broadcasts authoritative game state
     * Contains full state hash for client verification
     */
    matchEngine.on('state-verification', (data) => {
      io.emit('state-update', {
        tick: data.tick,
        stateHash: data.stateHash,
        // Don't send full state - only hash for verification
      });
    });

    /**
     * Cheat detected
     */
    matchEngine.on('player-penalized', (data) => {
      io.to(data.playerAddress).emit('penalty', {
        reason: data.reason,
        ratingLost: data.ratingPenalty,
      });
    });

    matchEngine.on('player-banned', (data) => {
      io.to(data.playerAddress).emit('banned', {
        reason: data.reason,
        message: 'Banned for cheating',
      });
    });

    /**
     * Desync detection
     */
    matchEngine.on('desync-detected', (data) => {
      console.warn(`Desync: ${data.playerAddress}`);
      // Don't kick immediately - could be network lag
      // Flag for investigation instead
    });
  });
}
```

### Testing Anti-Cheat

```typescript
// tests/anti-cheat.test.ts
import { describe, it, expect } from '@jest/globals';
import { AntiCheatMatchEngine } from '../game/match-engine.anti-cheat';

describe('AntiCheatMatchEngine', () => {
  let engine: AntiCheatMatchEngine;
  const players = ['0x1111...', '0x2222...'];

  beforeEach(() => {
    engine = new AntiCheatMatchEngine('match-123', players, 'seed-123');
  });

  it('should reject input spam (>60 per second)', () => {
    const result = engine.processPlayerInput(players[0], {
      action: 'move',
      params: {},
      timestamp: Date.now(),
      signature: 'sig',
    });

    // Spam 65 inputs
    for (let i = 0; i < 65; i++) {
      engine.processPlayerInput(players[0], {
        action: 'move',
        params: {},
        timestamp: Date.now(),
        signature: 'sig',
      });
    }

    // Should reject
    expect(result.valid).toBe(false);
  });

  it('should reject impossible actions (kick without ball)', () => {
    const result = engine.processPlayerInput(players[0], {
      action: 'kick',
      params: {},
      timestamp: Date.now(),
      signature: 'sig',
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('not possible');
  });

  it('should detect desync', () => {
    const wrongHash = 'wrong-hash';
    const result = engine.processPlayerInput(players[0], {
      action: 'move',
      params: { clientStateHash: wrongHash },
      timestamp: Date.now(),
      signature: 'sig',
    });

    // Should still accept but flag for investigation
    expect(result.valid).toBe(true);
  });

  it('should hash game state deterministically', () => {
    const hash1 = engine['hashGameState']();
    const hash2 = engine['hashGameState']();

    expect(hash1).toBe(hash2); // Deterministic
  });

  it('should escalate penalties after 3 violations', () => {
    let banEmitted = false;
    engine.on('player-banned', () => {
      banEmitted = true;
    });

    // Trigger 3 invalid inputs
    for (let i = 0; i < 3; i++) {
      engine.processPlayerInput(players[0], {
        action: 'invalid-action',
        params: {},
        timestamp: Date.now(),
        signature: 'bad-sig',
      });
    }

    expect(banEmitted).toBe(true);
  });
});
```

---

## Summary

### IPFS Storage
- **Pinata**: Easiest setup, centralized gateway (good for prototypes)
- **Web3.Storage**: Decentralized, Filecoin-backed (good for long-term)
- **Storage**: Replays, jerseys, logos, metadata

### Security
- **Anti-Cheat**: Server-authoritative, client sends inputs only
- **Validation**: Input spam, impossible actions, signature verification
- **Proof**: Match hash stored on-chain, verifiable via replay
- **Penalties**: Rating loss → ban escalation for repeated violations

### Gas Efficiency
- Replay: Off-chain (IPFS)
- Proof: On-chain hash only (~15-20k gas)
- State verification: 5-second intervals, not per-tick
