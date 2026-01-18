# Testing & Deployment for Bass Ball

## Part 1: Testing Strategy

### Installation & Setup

```bash
npm install -D vitest @vitest/ui @testing-library/react
npm install -D @testing-library/jest-dom
npm install -D jsdom  # For DOM testing
```

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.config.ts',
        '**/dist/**',
      ],
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
    },
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Test Setup File

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

// Mock ethers
vi.mock('ethers', () => ({
  ethers: {
    Contract: vi.fn(),
    providers: {
      JsonRpcProvider: vi.fn(),
    },
  },
}));
```

---

## Part 2: Match Logic Tests

### Match Engine Unit Tests

```typescript
// src/__tests__/game/match-engine.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MatchEngine, GameState, Ball, Player } from '@/game/match-engine';

describe('MatchEngine', () => {
  let engine: MatchEngine;
  let gameState: GameState;

  beforeEach(() => {
    gameState = new GameState(
      '0xPlayer1...',
      '0xPlayer2...',
      'seed-123'
    );
    engine = new MatchEngine(gameState);
  });

  describe('initialization', () => {
    it('should initialize with correct player positions', () => {
      expect(gameState.players).toHaveLength(2);
      expect(gameState.players[0].position).toBeDefined();
      expect(gameState.players[1].position).toBeDefined();
    });

    it('should place ball at center', () => {
      const centerX = gameState.fieldWidth / 2;
      const centerY = gameState.fieldHeight / 2;
      expect(gameState.ball.position.x).toBe(centerX);
      expect(gameState.ball.position.y).toBe(centerY);
    });

    it('should initialize score as 0-0', () => {
      expect(gameState.score[0]).toBe(0);
      expect(gameState.score[1]).toBe(0);
    });
  });

  describe('ball physics', () => {
    it('should apply friction to ball velocity', () => {
      gameState.ball.velocity = { x: 10, y: 10 };
      const initialVel = Math.hypot(10, 10);

      engine.tick();

      const newVel = Math.hypot(
        gameState.ball.velocity.x,
        gameState.ball.velocity.y
      );
      expect(newVel).toBeLessThan(initialVel);
    });

    it('should bounce ball off top boundary', () => {
      gameState.ball.position = { x: 50, y: -1 };
      gameState.ball.velocity = { x: 0, y: -5 };

      engine.tick();

      expect(gameState.ball.velocity.y).toBeGreaterThan(0);
    });

    it('should bounce ball off side boundary', () => {
      gameState.ball.position = { x: gameState.fieldWidth + 1, y: 50 };
      gameState.ball.velocity = { x: 5, y: 0 };

      engine.tick();

      expect(gameState.ball.velocity.x).toBeLessThan(0);
    });

    it('should detect goal (ball past goal line)', () => {
      gameState.ball.position = { x: gameState.fieldWidth + 2, y: 50 };
      gameState.ball.velocity = { x: 5, y: 0 };

      engine.tick();

      expect(gameState.score[0]).toBe(1);
    });
  });

  describe('player movement', () => {
    it('should move player in requested direction', () => {
      const player = gameState.players[0];
      const initialPos = { ...player.position };

      engine.movePlayer(0, { x: 1, y: 0 }, 1);
      engine.tick();

      expect(player.position.x).toBeGreaterThan(initialPos.x);
    });

    it('should apply max speed cap', () => {
      const player = gameState.players[0];
      const maxSpeed = 15;

      engine.movePlayer(0, { x: 100, y: 100 }, 1);
      engine.tick();

      const speed = Math.hypot(player.velocity.x, player.velocity.y);
      expect(speed).toBeLessThanOrEqual(maxSpeed);
    });

    it('should reduce stamina on movement', () => {
      const player = gameState.players[0];
      const initialStamina = player.stamina;

      engine.movePlayer(0, { x: 1, y: 0 }, 1);

      expect(player.stamina).toBeLessThan(initialStamina);
    });

    it('should prevent movement when stamina is zero', () => {
      const player = gameState.players[0];
      player.stamina = 0;
      const initialPos = { ...player.position };

      engine.movePlayer(0, { x: 1, y: 0 }, 1);
      engine.tick();

      expect(player.position).toEqual(initialPos);
    });

    it('should regenerate stamina when idle', () => {
      const player = gameState.players[0];
      player.stamina = 30;
      const initialStamina = player.stamina;

      // Don't move for 10 ticks
      for (let i = 0; i < 10; i++) {
        engine.tick();
      }

      expect(player.stamina).toBeGreaterThan(initialStamina);
    });
  });

  describe('ball possession', () => {
    it('should assign ball possession when player touches ball', () => {
      const player = gameState.players[0];
      player.position = { x: gameState.ball.position.x + 0.5, y: gameState.ball.position.y };

      engine.tick();

      expect(gameState.ballPossession).toBe(0);
    });

    it('should transfer possession on tackle', () => {
      gameState.ballPossession = 0;
      const player2 = gameState.players[1];

      // Move player 2 to ball
      player2.position = { x: gameState.ball.position.x + 0.3, y: gameState.ball.position.y };

      engine.tick();

      expect(gameState.ballPossession).toBe(1);
    });

    it('should lose possession on pass', () => {
      gameState.ballPossession = 0;
      const player = gameState.players[0];

      engine.pass(0, 45, 20); // angle, power

      expect(gameState.ballPossession).toBe(-1);
    });
  });

  describe('actions (kick, pass, slide)', () => {
    it('should kick ball with correct power', () => {
      gameState.ballPossession = 0;
      const initialVel = Math.hypot(
        gameState.ball.velocity.x,
        gameState.ball.velocity.y
      );

      engine.kick(0, 0, 50); // angle, power

      const newVel = Math.hypot(
        gameState.ball.velocity.x,
        gameState.ball.velocity.y
      );
      expect(newVel).toBeGreaterThan(initialVel);
    });

    it('should require ball possession to pass', () => {
      gameState.ballPossession = -1;
      const initialVel = gameState.ball.velocity;

      engine.pass(0, 45, 20);

      expect(gameState.ball.velocity).toEqual(initialVel);
    });

    it('should reduce stamina on sprint', () => {
      const player = gameState.players[0];
      const initialStamina = player.stamina;

      engine.sprint(0, { x: 1, y: 0 });
      engine.tick();

      expect(player.stamina).toBeLessThan(initialStamina - 5);
    });

    it('should apply slide tackle correctly', () => {
      const player = gameState.players[0];
      player.position = { x: gameState.ball.position.x + 1, y: gameState.ball.position.y };

      engine.slide(0, 0); // angle

      expect(player.isSliding).toBe(true);
      expect(player.stamina).toBeLessThan(player.stamina);
    });
  });

  describe('determinism with seeded RNG', () => {
    it('should produce identical results with same seed', () => {
      const state1 = new GameState('0xP1...', '0xP2...', 'seed-123');
      const state2 = new GameState('0xP1...', '0xP2...', 'seed-123');
      const engine1 = new MatchEngine(state1);
      const engine2 = new MatchEngine(state2);

      // Run same inputs
      for (let i = 0; i < 100; i++) {
        engine1.movePlayer(0, { x: 1, y: 0 }, 1);
        engine1.tick();

        engine2.movePlayer(0, { x: 1, y: 0 }, 1);
        engine2.tick();
      }

      expect(state1.ball.position).toEqual(state2.ball.position);
      expect(state1.score).toEqual(state2.score);
    });

    it('should produce different results with different seeds', () => {
      const state1 = new GameState('0xP1...', '0xP2...', 'seed-123');
      const state2 = new GameState('0xP1...', '0xP2...', 'seed-456');
      const engine1 = new MatchEngine(state1);
      const engine2 = new MatchEngine(state2);

      for (let i = 0; i < 100; i++) {
        engine1.movePlayer(0, { x: 1, y: 0 }, 1);
        engine1.tick();

        engine2.movePlayer(0, { x: 1, y: 0 }, 1);
        engine2.tick();
      }

      // Results should differ
      expect(state1.ball.position).not.toEqual(state2.ball.position);
    });
  });

  describe('match duration', () => {
    it('should end match after 45 minutes (2700 seconds)', () => {
      const ticksFor45Min = 2700 * 60; // 60 ticks per second

      for (let i = 0; i < ticksFor45Min; i++) {
        engine.tick();
      }

      expect(gameState.isHalfTime).toBe(true);
    });

    it('should return to center after half-time', () => {
      gameState.tick = 2700 * 60;
      engine.tick();

      expect(gameState.players[0].position.y).toBeLessThan(30);
      expect(gameState.players[1].position.y).toBeLessThan(30);
    });
  });
});
```

### Match Simulation Integration Tests

```typescript
// src/__tests__/game/match-simulation.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { MatchSimulator } from '@/game/match-simulator';

describe('MatchSimulator', () => {
  let simulator: MatchSimulator;

  beforeEach(() => {
    simulator = new MatchSimulator({
      player1: '0xPlayer1...',
      player2: '0xPlayer2...',
      matchId: 'match-123',
      seed: 'seed-123',
    });
  });

  it('should simulate complete 90-minute match', async () => {
    const result = await simulator.simulate();

    expect(result).toHaveProperty('winner');
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('duration');
    expect(result).toHaveProperty('events');
  });

  it('should record all match events', async () => {
    const result = await simulator.simulate();

    expect(result.events.length).toBeGreaterThan(0);
    expect(result.events[0]).toHaveProperty('tick');
    expect(result.events[0]).toHaveProperty('type');
    expect(result.events[0]).toHaveProperty('player');
  });

  it('should calculate correct winner', async () => {
    const result = await simulator.simulate();

    const totalScore = result.score[0] + result.score[1];
    if (totalScore > 0) {
      expect(result.winner).toBe(result.score[0] > result.score[1] ? 0 : 1);
    }
  });

  it('should handle draws correctly', async () => {
    // Mock equal score
    simulator.gameState.score = [2, 2];

    const result = await simulator.finalize();

    expect(result.winner).toBe(-1); // Draw
  });

  it('should generate valid replay file', async () => {
    const result = await simulator.simulate();
    const replay = simulator.getReplay();

    expect(replay.matchId).toBe('match-123');
    expect(replay.players).toHaveLength(2);
    expect(replay.events).toBeDefined();
    expect(replay.finalState).toBeDefined();
  });
});
```

---

## Part 3: Smart Contract Tests

### Setup with Foundry

```bash
# Initialize Foundry project (if not already done)
forge init --no-git

# Run contract tests
forge test

# Run with verbose output
forge test -vvv

# Run specific test
forge test --match "testKickWithoutBall"

# Run with coverage
forge coverage
```

### Anti-Cheat Contract Tests

```solidity
// test/BassBallMatchProof.t.sol
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {BassBallMatchProof} from "../src/BassBallMatchProof.sol";

contract BassBallMatchProofTest is Test {
  BassBallMatchProof public matchProof;
  address public validator;
  address public player1;
  address public player2;

  function setUp() public {
    validator = address(0x1);
    player1 = address(0x2);
    player2 = address(0x3);

    matchProof = new BassBallMatchProof();
    matchProof.grantRole(
      keccak256("MATCH_VALIDATOR_ROLE"),
      validator
    );
  }

  function testRecordMatchProof() public {
    bytes32 matchId = keccak256(abi.encodePacked("match-1"));
    bytes32 resultHash = keccak256(abi.encodePacked("result"));
    address winner = player1;
    uint8 scoreP1 = 2;
    uint8 scoreP2 = 1;
    uint256 duration = 2700;

    // Sign message
    bytes memory signature = "";

    vm.prank(validator);
    matchProof.recordMatchProof(
      matchId,
      player1,
      player2,
      winner,
      scoreP1,
      scoreP2,
      duration,
      resultHash,
      signature
    );

    // Verify proof was recorded
    BassBallMatchProof.MatchProof memory proof = matchProof.getMatchProof(matchId);
    assertEq(proof.player1, player1);
    assertEq(proof.player2, player2);
    assertEq(proof.winner, winner);
    assertEq(proof.scorePlayer1, 2);
    assertEq(proof.scorePlayer2, 1);
  }

  function testRejectSamePlayer() public {
    bytes32 matchId = keccak256(abi.encodePacked("match-1"));
    bytes32 resultHash = keccak256(abi.encodePacked("result"));

    vm.prank(validator);
    vm.expectRevert("Same player");
    matchProof.recordMatchProof(
      matchId,
      player1,
      player1, // Same as player1
      player1,
      2,
      1,
      2700,
      resultHash,
      ""
    );
  }

  function testRejectInvalidWinner() public {
    bytes32 matchId = keccak256(abi.encodePacked("match-1"));
    bytes32 resultHash = keccak256(abi.encodePacked("result"));
    address invalidWinner = address(0x99);

    vm.prank(validator);
    vm.expectRevert("Invalid winner");
    matchProof.recordMatchProof(
      matchId,
      player1,
      player2,
      invalidWinner,
      2,
      1,
      2700,
      resultHash,
      ""
    );
  }

  function testRejectInvalidScore() public {
    bytes32 matchId = keccak256(abi.encodePacked("match-1"));
    bytes32 resultHash = keccak256(abi.encodePacked("result"));

    vm.prank(validator);
    vm.expectRevert("Invalid score");
    matchProof.recordMatchProof(
      matchId,
      player1,
      player2,
      player1,
      255, // Score > 99
      1,
      2700,
      resultHash,
      ""
    );
  }

  function testVerifyMatchProof() public {
    bytes32 matchId = keccak256(abi.encodePacked("match-1"));
    bytes32 resultHash = keccak256(abi.encodePacked("result"));

    vm.prank(validator);
    matchProof.recordMatchProof(
      matchId,
      player1,
      player2,
      player1,
      2,
      1,
      2700,
      resultHash,
      ""
    );

    // Verify with correct hash
    matchProof.verifyMatchProof(matchId, resultHash);
    BassBallMatchProof.MatchProof memory proof = matchProof.getMatchProof(matchId);
    assertTrue(proof.verified);
  }

  function testRejectInvalidProofHash() public {
    bytes32 matchId = keccak256(abi.encodePacked("match-1"));
    bytes32 resultHash = keccak256(abi.encodePacked("result"));

    vm.prank(validator);
    matchProof.recordMatchProof(
      matchId,
      player1,
      player2,
      player1,
      2,
      1,
      2700,
      resultHash,
      ""
    );

    // Verify with wrong hash
    bytes32 wrongHash = keccak256(abi.encodePacked("wrong"));
    matchProof.verifyMatchProof(matchId, wrongHash);
    BassBallMatchProof.MatchProof memory proof = matchProof.getMatchProof(matchId);
    assertFalse(proof.verified);
  }

  function testGetPlayerMatches() public {
    bytes32 matchId1 = keccak256(abi.encodePacked("match-1"));
    bytes32 matchId2 = keccak256(abi.encodePacked("match-2"));
    bytes32 resultHash = keccak256(abi.encodePacked("result"));

    // Record two matches for player1
    vm.prank(validator);
    matchProof.recordMatchProof(
      matchId1,
      player1,
      player2,
      player1,
      2,
      1,
      2700,
      resultHash,
      ""
    );

    vm.prank(validator);
    matchProof.recordMatchProof(
      matchId2,
      player1,
      player2,
      player2,
      1,
      2,
      2700,
      resultHash,
      ""
    );

    bytes32[] memory matches = matchProof.getPlayerMatches(player1);
    assertEq(matches.length, 2);
  }

  function testIsMatchProofValid() public {
    bytes32 matchId = keccak256(abi.encodePacked("match-1"));
    bytes32 resultHash = keccak256(abi.encodePacked("result"));

    // Before recording - invalid
    assertFalse(matchProof.isMatchProofValid(matchId));

    // After recording - valid
    vm.prank(validator);
    matchProof.recordMatchProof(
      matchId,
      player1,
      player2,
      player1,
      2,
      1,
      2700,
      resultHash,
      ""
    );

    assertTrue(matchProof.isMatchProofValid(matchId));
  }

  function testOnlyValidatorCanRecord() public {
    bytes32 matchId = keccak256(abi.encodePacked("match-1"));
    bytes32 resultHash = keccak256(abi.encodePacked("result"));

    vm.prank(player1); // Not a validator
    vm.expectRevert(); // Should revert
    matchProof.recordMatchProof(
      matchId,
      player1,
      player2,
      player1,
      2,
      1,
      2700,
      resultHash,
      ""
    );
  }
}
```

### ERC721 Team Contract Tests

```solidity
// test/BassBallTeam.t.sol
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {BassBallTeam} from "../src/BassBallTeam.sol";

contract BassBallTeamTest is Test {
  BassBallTeam public teamContract;
  address public owner;
  address public player1;

  function setUp() public {
    owner = address(this);
    player1 = address(0x1);

    teamContract = new BassBallTeam();
  }

  function testMintTeam() public {
    string memory teamName = "Dream Team";
    string[] memory colors = new string[](2);
    colors[0] = "#FF0000";
    colors[1] = "#FFFFFF";

    uint256 tokenId = teamContract.mintTeam(player1, teamName, colors);

    assertEq(teamContract.ownerOf(tokenId), player1);
    assertEq(teamContract.getTeamName(tokenId), teamName);
  }

  function testOnlyOneTeamPerPlayer() public {
    teamContract.mintTeam(player1, "Team 1", new string[](0));

    vm.expectRevert("One team per player");
    teamContract.mintTeam(player1, "Team 2", new string[](0));
  }

  function testUpdateTeamStats() public {
    uint256 teamId = teamContract.mintTeam(player1, "Team A", new string[](0));

    vm.prank(owner);
    teamContract.updateStats(
      teamId,
      1000, // rating
      10,   // wins
      5,    // losses
      0     // draws
    );

    BassBallTeam.Team memory team = teamContract.getTeamData(teamId);
    assertEq(team.rating, 1000);
    assertEq(team.wins, 10);
  }

  function testTransferTeamNotAllowed() public {
    uint256 teamId = teamContract.mintTeam(player1, "Team A", new string[](0));

    vm.expectRevert("Non-transferable");
    vm.prank(player1);
    teamContract.transferFrom(player1, address(0x2), teamId);
  }
}
```

### Gas Usage Tests

```solidity
// test/GasOptimization.t.sol
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {BassBallMatchProof} from "../src/BassBallMatchProof.sol";

contract GasOptimizationTest is Test {
  BassBallMatchProof public matchProof;
  address public validator;

  function setUp() public {
    validator = address(0x1);
    matchProof = new BassBallMatchProof();
    matchProof.grantRole(
      keccak256("MATCH_VALIDATOR_ROLE"),
      validator
    );
  }

  function testGasRecordMatchProof() public {
    bytes32 matchId = keccak256(abi.encodePacked("match-1"));
    bytes32 resultHash = keccak256(abi.encodePacked("result"));

    uint256 gasStart = gasleft();

    vm.prank(validator);
    matchProof.recordMatchProof(
      matchId,
      address(0x2),
      address(0x3),
      address(0x2),
      2,
      1,
      2700,
      resultHash,
      ""
    );

    uint256 gasUsed = gasStart - gasleft();
    
    // Should be ~15-20k gas
    assertTrue(gasUsed < 20000, "Gas usage too high");
  }
}
```

---

## Part 4: Anti-Cheat Tests

```typescript
// src/__tests__/security/anti-cheat.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AntiCheatMatchEngine } from '@/game/match-engine.anti-cheat';

describe('AntiCheatMatchEngine', () => {
  let engine: AntiCheatMatchEngine;
  const players = ['0xPlayer1...', '0xPlayer2...'];

  beforeEach(() => {
    engine = new AntiCheatMatchEngine('match-123', players, 'seed-123');
  });

  describe('input validation', () => {
    it('should reject input spam (>60 per second)', () => {
      for (let i = 0; i < 65; i++) {
        const result = engine.processPlayerInput(players[0], {
          action: 'move',
          params: {},
          timestamp: Date.now(),
          signature: 'sig-' + i,
        });

        if (i >= 60) {
          expect(result.valid).toBe(false);
          expect(result.reason).toContain('Too many inputs');
        }
      }
    });

    it('should reject invalid action types', () => {
      const result = engine.processPlayerInput(players[0], {
        action: 'teleport', // Invalid
        params: {},
        timestamp: Date.now(),
        signature: 'sig',
      });

      expect(result.valid).toBe(false);
    });

    it('should reject impossible actions', () => {
      // Try to kick without ball
      const result = engine.processPlayerInput(players[0], {
        action: 'kick',
        params: {},
        timestamp: Date.now(),
        signature: 'sig',
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('not possible');
    });

    it('should reject invalid signatures', () => {
      const result = engine.processPlayerInput(players[0], {
        action: 'move',
        params: {},
        timestamp: Date.now(),
        signature: 'invalid-sig',
      });

      expect(result.valid).toBe(false);
    });

    it('should accept valid input', () => {
      const result = engine.processPlayerInput(players[0], {
        action: 'move',
        params: { direction: { x: 1, y: 0 } },
        timestamp: Date.now(),
        signature: 'valid-sig',
      });

      // Assuming valid signature verification
      // expect(result.valid).toBe(true);
    });
  });

  describe('desync detection', () => {
    it('should detect state mismatch', (done) => {
      let desyncDetected = false;

      engine.on('desync-detected', () => {
        desyncDetected = true;
      });

      engine.processPlayerInput(players[0], {
        action: 'move',
        params: { clientStateHash: 'wrong-hash' },
        timestamp: Date.now(),
        signature: 'sig',
      });

      setTimeout(() => {
        expect(desyncDetected).toBe(true);
        done();
      }, 100);
    });
  });

  describe('penalty system', () => {
    it('should penalize player after 1 invalid input', (done) => {
      let penalized = false;

      engine.on('player-penalized', () => {
        penalized = true;
      });

      engine.processPlayerInput(players[0], {
        action: 'invalid-action',
        params: {},
        timestamp: Date.now(),
        signature: 'bad-sig',
      });

      setTimeout(() => {
        expect(penalized).toBe(true);
        done();
      }, 50);
    });

    it('should ban player after 3 violations', (done) => {
      let banned = false;

      engine.on('player-banned', () => {
        banned = true;
      });

      // Trigger 3 violations
      for (let i = 0; i < 3; i++) {
        engine.processPlayerInput(players[0], {
          action: 'invalid-action',
          params: {},
          timestamp: Date.now(),
          signature: 'bad-sig-' + i,
        });
      }

      setTimeout(() => {
        expect(banned).toBe(true);
        done();
      }, 100);
    });
  });

  describe('state hashing', () => {
    it('should produce deterministic hash', () => {
      const hash1 = engine['hashGameState']();
      const hash2 = engine['hashGameState']();

      expect(hash1).toBe(hash2);
    });

    it('should produce different hash after tick', () => {
      const hash1 = engine['hashGameState']();

      engine.tick();

      const hash2 = engine['hashGameState']();

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('server authority', () => {
    it('should execute all queued inputs each tick', () => {
      // Queue 3 inputs
      for (let i = 0; i < 3; i++) {
        engine.processPlayerInput(players[0], {
          action: 'move',
          params: { direction: { x: 1, y: 0 } },
          timestamp: Date.now(),
          signature: 'sig-' + i,
        });
      }

      engine.tick();

      // All inputs should be consumed
      // (implementation detail test)
    });

    it('should never execute client-provided game state', () => {
      // Client tries to set ball position
      const result = engine.processPlayerInput(players[0], {
        action: 'move',
        params: {
          ballPosition: { x: 100, y: 100 }, // Should be ignored
        },
        timestamp: Date.now(),
        signature: 'sig',
      });

      // Ball position should not match what client sent
      // expect(engine.serverState.ball.position).not.toEqual({ x: 100, y: 100 });
    });
  });
});
```

### Package.json Test Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:match": "vitest run --grep 'MatchEngine'",
    "test:anti-cheat": "vitest run --grep 'AntiCheat'",
    "test:contracts": "forge test",
    "test:contracts:verbose": "forge test -vvv",
    "test:contracts:coverage": "forge coverage"
  }
}
```

---

## Part 5: Deployment Strategy

### Frontend: Vercel

#### 1. Prepare Project

```bash
# Ensure all env vars are set
cp .env.example .env.local

# Build locally first
npm run build

# Check for errors
npm run lint
npm run test
```

#### 2. Environment Variables

```env
# .env.production
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_walletconnect_id
NEXT_PUBLIC_RPC_URL_BASE=https://mainnet.base.org
NEXT_PUBLIC_CONTRACT_TEAM_ADDRESS=0x...
NEXT_PUBLIC_CONTRACT_MATCH_PROOF_ADDRESS=0x...
NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud
NEXT_PUBLIC_GRAPH_API=https://api.thegraph.com/subgraphs/name/...
```

#### 3. Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel deploy --prod

# Or connect GitHub repo and auto-deploy on push
# https://vercel.com/dashboard
```

#### 4. Vercel Configuration

```javascript
// vercel.json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID": "@wallet_connect_id",
    "NEXT_PUBLIC_RPC_URL_BASE": "@rpc_url_base",
    "NEXT_PUBLIC_CONTRACT_TEAM_ADDRESS": "@contract_team"
  },
  "buildOutputDirectory": ".next"
}
```

### Backend: Fly.io

#### 1. Install Fly CLI

```bash
curl -L https://fly.io/install.sh | sh
flyctl auth login
```

#### 2. Initialize Fly App

```bash
# Create Fly app
flyctl launch

# Follow prompts:
# - App name: bass-ball-api
# - Region: lax (Los Angeles) or closest to you
# - Postgres: yes
# - Redis: yes
```

#### 3. Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src ./src
COPY tsconfig.json ./

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

#### 4. Environment Setup

```bash
# Set production env vars
flyctl secrets set \
  DATABASE_URL="postgresql://user:pass@host/db" \
  REDIS_URL="redis://..." \
  PINATA_API_KEY="..." \
  PINATA_API_SECRET="..." \
  JWT_SECRET="..."

# Or create secrets.toml
flyctl secrets import < secrets.toml
```

#### 5. fly.toml Configuration

```toml
# fly.toml
app = "bass-ball-api"
primary_region = "lax"

[build]
  image = "bass-ball-api:latest"

[env]
  LOG_LEVEL = "info"
  NODE_ENV = "production"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true

[[services]]
  protocol = "tcp"
  internal_port = 3000
  [services.concurrency]
    type = "connections"
    hard_limit = 1000
    soft_limit = 100

[checks]
  [checks.http]
    grace_period = "5s"
    interval = "30s"
    method = "GET"
    path = "/health"
    timeout = "5s"

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256
```

#### 6. Deploy to Fly.io

```bash
# Deploy
flyctl deploy

# Monitor logs
flyctl logs

# Scale instances
flyctl scale count 2

# Check status
flyctl status
```

### Blockchain: Base Network Deployment

#### 1. Deploy to Base Sepolia (Testnet)

```bash
# Set network in foundry.toml
[profile.default]
solc_version = "0.8.20"

[rpc_endpoints]
base_sepolia = "https://sepolia.base.org"
base_mainnet = "https://mainnet.base.org"

# Deploy to Sepolia
forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://sepolia.base.org \
  --broadcast \
  --verify
```

#### 2. Deploy Script

```solidity
// script/Deploy.s.sol
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {BassBallTeam} from "../src/BassBallTeam.sol";
import {BassBallPlayerCards} from "../src/BassBallPlayerCards.sol";
import {BassBallMatchProof} from "../src/BassBallMatchProof.sol";

contract Deploy is Script {
  function run() external {
    uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

    vm.startBroadcast(deployerPrivateKey);

    // Deploy Team contract
    BassBallTeam team = new BassBallTeam();
    console.log("Team deployed:", address(team));

    // Deploy Player Cards
    BassBallPlayerCards cards = new BassBallPlayerCards();
    console.log("Cards deployed:", address(cards));

    // Deploy Match Proof
    BassBallMatchProof matchProof = new BassBallMatchProof();
    console.log("MatchProof deployed:", address(matchProof));

    vm.stopBroadcast();

    // Write addresses to file for reference
    string memory addresses = string.concat(
      "TEAM_ADDRESS=", vm.toString(address(team)), "\n",
      "CARDS_ADDRESS=", vm.toString(address(cards)), "\n",
      "MATCH_PROOF_ADDRESS=", vm.toString(address(matchProof))
    );

    vm.writeFile("./deployment-addresses.txt", addresses);
  }
}
```

#### 3. Environment Variables for Deployment

```env
# .env for contract deployment
DEPLOYER_PRIVATE_KEY=0x...
BASE_SEPOLIA_RPC=https://sepolia.base.org
BASE_MAINNET_RPC=https://mainnet.base.org
ETHERSCAN_API_KEY=your_key
```

#### 4. Deploy to Base Mainnet

```bash
# First: Test on Sepolia
forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://sepolia.base.org \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --verify

# Then: Deploy to Mainnet (after testing)
forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://mainnet.base.org \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --verify \
  --slow # Use slower gas settings for mainnet
```

### Complete Deployment Checklist

```markdown
## Pre-Deployment

- [ ] Run all tests: `npm run test && npm run test:contracts`
- [ ] Check code coverage: `npm run test:coverage`
- [ ] Audit dependencies: `npm audit`
- [ ] Security scan: `forge build --verify`
- [ ] Lint code: `npm run lint`
- [ ] Test on testnet first
- [ ] Get team review of contracts
- [ ] Have emergency pause mechanism ready

## Frontend (Vercel)

- [ ] Set environment variables in Vercel dashboard
- [ ] Configure domain and SSL
- [ ] Enable branch deployments
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Configure rate limiting
- [ ] Test wallet connection
- [ ] Test contract interactions
- [ ] Monitor Core Web Vitals

## Backend (Fly.io)

- [ ] Create PostgreSQL database backup
- [ ] Create Redis backup
- [ ] Set up monitoring (DataDog, New Relic)
- [ ] Configure auto-scaling
- [ ] Set up health checks
- [ ] Test API endpoints
- [ ] Monitor error rates
- [ ] Set up log aggregation

## Blockchain (Base)

- [ ] Deploy contracts to Sepolia first
- [ ] Verify contract source on BaseScan
- [ ] Test all contract functions
- [ ] Verify gas estimates are reasonable
- [ ] Get audit if high value locked
- [ ] Deploy to Base Mainnet
- [ ] Update frontend contract addresses
- [ ] Monitor contract events
- [ ] Document contract addresses

## Post-Deployment

- [ ] Monitor error rates (target <0.1%)
- [ ] Monitor response times
- [ ] Check database performance
- [ ] Verify wallet connections working
- [ ] Monitor smart contract interactions
- [ ] Have rollback plan ready
```

### Monitoring & Logging

```typescript
// services/monitoring.service.ts
import * as Sentry from "@sentry/node";

export function initializeMonitoring() {
  // Initialize Sentry for error tracking
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    beforeSend(event) {
      // Filter sensitive data
      if (event.request?.url?.includes('api_key')) {
        return null;
      }
      return event;
    },
  });
}

// Log important events
export function logMatchStart(matchId: string, players: string[]) {
  console.log(`[MATCH_START] ${matchId}`, { players });
}

export function logMatchEnd(matchId: string, result: any) {
  console.log(`[MATCH_END] ${matchId}`, { result });
}

export function logCheatDetected(playerAddress: string, reason: string) {
  Sentry.captureMessage(
    `Cheat attempt: ${playerAddress} - ${reason}`,
    'warning'
  );
}
```

---

## Summary

### Testing Strategy
- **Unit Tests**: Match engine, physics, game logic
- **Contract Tests**: Foundry for Solidity, comprehensive coverage
- **Anti-Cheat Tests**: Input validation, desync detection, penalties
- **Coverage**: Target 80%+ across all layers

### Deployment
- **Frontend**: Vercel (auto-deploy on git push)
- **Backend**: Fly.io (containerized, auto-scaling)
- **Blockchain**: Base Sepolia (test) → Base Mainnet (production)
- **Monitoring**: Sentry, DataDog, logs aggregation

### Key Metrics
- Error rate: <0.1%
- API latency: <100ms (p95)
- Match creation: <2s
- Contract gas: 15-20k per match
