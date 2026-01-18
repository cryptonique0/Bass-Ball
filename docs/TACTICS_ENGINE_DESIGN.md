# Tactics Engine Design: Server-Authoritative, Deterministic Football

## Overview

The tactics engine is the **decision-making system** that translates player input into football-authentic behavior. It's not about perfect simulation—it's about **making tactical choices feel meaningful**.

**Core Mission**: Every tactical decision a player makes should:
1. Be **reproducible** (same input = same output, always)
2. Be **expressive** (different choices feel obviously different)
3. Be **understandable** (players know why they won or lost)
4. Be **verified** (server is the source of truth, replays can be audited)

---

## 1. Core Principles (Non-Negotiable)

### 1.1 Deterministic

**Definition**: Given the same match state, same player inputs, and same seed, the engine always produces identical outcomes.

**Why This Matters**:
- Replays are verifiable without re-simulating
- Disputes can be settled by comparing seeds
- Physics is reproducible across platforms
- No "lucky bullshit" RNG that feels unfair

**Implementation**:

```typescript
interface MatchState {
  // All state needed to deterministically simulate next frame
  ballPosition: Vector3;
  ballVelocity: Vector3;
  playerPositions: Map<string, Vector3>;
  playerVelocities: Map<string, Vector3>;
  
  // Determinism anchor
  frameSeed: string;  // Hash of (matchId + frameNumber)
  
  // Tactical state
  possession: string;  // Which player has ball
  formationShape: FormationShape;
  pressureZone: PressureZone;
}

// Core function: given state + input + seed, produce next state
function simulateFrame(
  currentState: MatchState,
  playerInput: PlayerInput,
  seed: string
): NextMatchState {
  // 1. Apply physics deterministically
  const physicsResult = deterministicPhysicsEngine(
    currentState,
    playerInput,
    seed
  );
  
  // 2. Apply tactical rules deterministically
  const tacticResult = deterministicTacticsEngine(
    currentState,
    playerInput,
    seed
  );
  
  // 3. Combine results
  return {
    ballState: physicsResult.ballState,
    playerStates: tacticResult.playerStates,
    events: physicsResult.events.concat(tacticResult.events),
    nextSeed: hashSeed(seed, currentState),
  };
}

// Determinism verification
function verifyReplay(replay: Replay): VerificationResult {
  let currentState = replay.initialState;
  
  for (let i = 0; i < replay.inputLog.length; i++) {
    const input = replay.inputLog[i];
    const recordedState = replay.frameLog[i];
    
    // Re-simulate using same seed
    const simulatedState = simulateFrame(
      currentState,
      input,
      replay.seedLog[i]
    );
    
    // Compare recorded vs simulated
    if (!statesMatch(simulatedState, recordedState)) {
      return {
        valid: false,
        mismatch: {
          frame: i,
          expected: recordedState,
          actual: simulatedState,
        },
      };
    }
    
    currentState = simulatedState;
  }
  
  return { valid: true };
}
```

### 1.2 Expressive

**Definition**: Different tactical choices should feel meaningfully different, even within the same formation.

**Why This Matters**:
- Players immediately feel impact of decisions
- Playstyles are distinguishable
- Possession vs counter, high press vs deep defense feel fundamentally different
- Engagement: "my tactic worked" > "I got lucky"

**Implementation**:

```typescript
// Expressiveness through tactical parameters, not RNG
interface TacticalChoice {
  // Formation choice
  formation: "4-3-3" | "4-2-3-1" | "3-5-2" | "5-3-2" | "4-4-2";
  
  // In-formation adjustments
  defensiveDepth: 0-100;       // 0 = high line, 100 = deep defense
  pressIntensity: 0-100;       // 0 = no press, 100 = constant press
  buildUpStyle: "short" | "long" | "mixed";
  offensiveWidth: 0-100;       // 0 = narrow, 100 = spread wide
  
  // Player-specific tactical instructions
  playerInstructions: {
    [playerId: string]: {
      role: "aggressive" | "balanced" | "defensive";
      markedOpponent?: string;
      positionBias?: "left" | "center" | "right";
    }
  };
}

// These choices directly affect behavior
function applyTacticalChoice(
  state: MatchState,
  choice: TacticalChoice
): ModifiedState {
  // Defensive depth → changes offside line position
  const defensiveLineDepth = 60 - (choice.defensiveDepth / 100 * 30);
  // Result: high line (60m from goal) vs deep defense (30m from goal)
  
  // Press intensity → changes when players pressure the ball
  const pressTriggerDistance = choice.pressIntensity / 100 * 15;  // 0-15m
  // Result: if pressIntensity=0, only press when opponent is 0m away
  //         if pressIntensity=100, press as soon as they're 15m away
  
  // Build-up style → affects pass direction probabilities
  const buildUpMultipliers = {
    "short": { horizontalPass: 0.8, verticalPass: 0.2 },
    "long": { horizontalPass: 0.2, verticalPass: 0.8 },
    "mixed": { horizontalPass: 0.5, verticalPass: 0.5 },
  }[choice.buildUpStyle];
  // Result: short-pass teams dominate possession; long-ball teams get counters
  
  // Offensive width → affects available passing lanes
  const formationWidth = choice.offensiveWidth / 100 * 40;  // 0-40m spread
  // Result: narrow (parking bus) vs spread (difficult to defend)
  
  return {
    ...state,
    defensiveLineDepth,
    pressureTrigger: pressTriggerDistance,
    buildUpStyle: choice.buildUpStyle,
    formationWidth,
  };
}

// Expressiveness in outcomes
// Same opponent, different tactics = different match:

const possession = {
  formation: "4-3-3",
  defensiveDepth: 40,      // High line
  pressIntensity: 45,      // Medium press
  buildUpStyle: "short",
  offensiveWidth: 80,      // Spread wide
  // Result: Dominate possession, wear down opponent, vulnerable to counters
};

const counterAttack = {
  formation: "4-2-3-1",
  defensiveDepth: 70,      // Deep line
  pressIntensity: 20,      // Minimal press
  buildUpStyle: "long",
  offensiveWidth: 30,       // Narrow, compact
  // Result: Concede possession, deadly on transition, tire opponent pressing
};

// Play 100 matches: possession wins ~65%, counter ~35%
// But each match plays out tactically, not by RNG
```

### 1.3 Legible

**Definition**: Players understand why a tactic worked or failed, and can learn from it.

**Why This Matters**:
- Skill ceiling is higher (improvement is learnable)
- Disputes are resolvable (clear cause-effect)
- Coaching systems work (advice is actionable)
- Engagement: "I need to adjust X" > "That was BS"

**Implementation**:

```typescript
interface LegibleEvent {
  time: number;
  type: string;
  description: string;
  
  // Why did this happen?
  cause: {
    playerInput?: PlayerInput;
    tacticalDecision?: string;
    opponentFormation?: string;
    matchContext?: string;
  };
  
  // What was the tactical implication?
  tacticalImplication: string;
  
  // Could it have been prevented?
  preventableBy?: string[];
}

// Example: Goal conceded
const legibleGoalEvent: LegibleEvent = {
  time: 47.5,
  type: "goal_conceded",
  description: "Striker finished from 12 yards, low far corner",
  
  cause: {
    tacticalDecision: "High defensive line (70m from goal)",
    opponentFormation: "4-3-3 with attacking fullbacks",
    matchContext: "Losing 1-0, opponent playing on counter",
  },
  
  tacticalImplication: "Your high line was beaten by a long ball. " +
    "Opponent exploited your advanced positioning for a through-ball.",
  
  preventableBy: [
    "Use deeper defensive line (reduce to 50m from goal)",
    "Increase pressing intensity to force mistakes in build-up",
    "Man-mark the striker (issue individual marking instruction)",
    "Shift to 5-3-2 for extra defender",
  ],
};

// Post-match analysis shows these legible causes
function generateTacticalFeedback(match: Match): TacticalFeedback {
  const events = match.legibleEvents;
  
  const goalsConceeded = events.filter(e => e.type === "goal_conceded");
  
  const feedback = goalsConceeded.map(goal => ({
    time: goal.time,
    event: goal.description,
    cause: goal.cause,
    implication: goal.tacticalImplication,
    howToFix: goal.preventableBy,
  }));
  
  return {
    summary: "You conceded 2 goals on counter-attacks. " +
      "Your high defensive line left space in behind.",
    detailedFeedback: feedback,
    recommendation: "Try 5-3-2 or drop to a 50m defensive line.",
  };
}

// Replay viewer shows these causes visually
function renderLegibleReplay(replay: Replay) {
  return {
    // Timeline shows each legible event with explanation
    timelineMarkers: replay.events.map(e => ({
      time: e.time,
      description: e.description,
      icon: eventTypeToIcon(e.type),
      explanation: e.tacticalImplication,
    })),
    
    // Tactical diagram overlay
    formationOverlay: {
      show: true,
      interval: 1000,  // Update every second
      highlight: {
        defensive_line: true,  // Show where defense is set
        pressure_zone: true,   // Show press distance
        formation_shape: true, // Show formation width
      },
    },
    
    // Cause-effect highlighting
    highlightedPlays: replay.events.map(e => ({
      start: e.time - 2,
      end: e.time + 1,
      highlight: "tactical_elements_involved",
      explanation: e.tacticalImplication,
    })),
  };
}
```

### 1.4 Server-Authoritative

**Definition**: Client sends intent (what the player wants to do), server decides outcome (what actually happens).

**Why This Matters**:
- Cheating is impossible (client can't claim false results)
- Authority is centralized (no dispute about what "really" happened)
- Replay verification is trustworthy (server signed the result)
- Fairness is guaranteed (both players same conditions, same server)

**Implementation**:

```typescript
// CLIENT: Player sends intent only
interface PlayerInput {
  // What the player is trying to do
  intent: {
    formation: Formation;
    pressing: number;  // 0-100 intensity
    buildUpStyle: string;
  };
  
  // Player control (raw input)
  control: {
    dpadPress?: "up" | "down" | "left" | "right";
    buttonPress?: "X" | "Y" | "A" | "B" | "L1" | "R1";
    stickInput?: Vector2;
  };
  
  // Timestamp and challenge response (anti-cheat)
  timestamp: number;
  clientSignature: string;
}

// SERVER: Server simulates and decides outcome
interface ServerDecision {
  // What actually happened (server-side simulation)
  outcome: {
    possession: Player;
    ballPosition: Vector3;
    events: MatchEvent[];
  };
  
  // Proof that this is server-authoritative
  serverTimestamp: number;
  serverSignature: string;
  blockchainAnchor: string;  // Hash on-chain for dispute
  
  // For replay verification
  seed: string;
  frameHash: string;
}

// COMMUNICATION FLOW
async function handlePlayerInput(input: PlayerInput) {
  // 1. Validate input (is it real? is it in time?)
  const isValid = validateInput(input);
  if (!isValid) {
    return { outcome: "INVALID_INPUT", reason: "Input signature mismatch" };
  }
  
  // 2. Server simulates next frame (deterministically)
  const nextState = simulateFrame(
    currentMatchState,
    input,
    currentSeed
  );
  
  // 3. Server decides what player sees
  const serverDecision: ServerDecision = {
    outcome: nextState,
    serverTimestamp: Date.now(),
    serverSignature: signWithPrivateKey(nextState),
    blockchainAnchor: await submitToBlockchain(nextState),
    seed: currentSeed,
    frameHash: hashState(nextState),
  };
  
  // 4. Send to ALL players (client sees same result as opponent)
  broadcastToMatch({
    player1: serverDecision,
    player2: serverDecision,
  });
  
  return serverDecision;
}

// ANTI-CHEAT: Client can't lie about outcome
function preventClientCheating() {
  return {
    // Client can't claim possession if server says opponent has it
    rule1: "Client receives server decision, uses it",
    
    // Client can't claim goal if server didn't score
    rule2: "Goal events only issued by server",
    
    // Client can't desync by claiming different state
    rule3: "Both clients receive identical state from server",
    
    // Client can't rewind time
    rule4: "Server only accepts inputs forward in time",
    
    // Disputes are resolved by seed replay
    rule5: "Replay verifies server simulation was deterministic",
  };
}

// REPLAY VERIFICATION
// If player disputes: "That wasn't a goal / I didn't commit that foul"
// Guardian runs:
function verifyDisputedMatch(replay: Replay) {
  let state = replay.initialState;
  
  for (let frame = 0; frame < replay.inputLog.length; frame++) {
    const input = replay.inputLog[frame];
    const serverSignedOutcome = replay.serverDecisions[frame];
    
    // Re-simulate using server seed
    const verifyOutcome = simulateFrame(
      state,
      input,
      serverSignedOutcome.seed
    );
    
    // Compare: did server do deterministic simulation?
    if (!statesMatch(verifyOutcome, serverSignedOutcome.outcome)) {
      return {
        valid: false,
        reason: "Server decision doesn't match deterministic simulation",
        frame,
        discrepancy: {
          expected: verifyOutcome,
          serverClaimed: serverSignedOutcome.outcome,
        },
      };
    }
    
    state = verifyOutcome;
  }
  
  return { valid: true, message: "All server decisions verified" };
}
```

---

## 2. Tactical Decision System

### 2.1 Player Choices (What Players Control)

```typescript
interface PlayerTacticalChoices {
  // 1. Formation selection
  formation: Formation;
  
  // 2. Adjusted parameters within formation
  adjustments: {
    // Defensive setup
    defensiveLineHeight: 0-100;      // 0=offside trap, 100=packed defense
    pressingDistance: 0-100;         // How far out to press
    pressingTrigger: "immediate" | "2passes" | "3passes" | "transition";
    
    // Build-up approach
    buildUpDirection: "short" | "long" | "mixed";
    buildUpTempo: "slow" | "controlled" | "fast";
    
    // Attacking approach
    attackingWidth: 0-100;           // 0=narrow/4-4-2, 100=spread/4-3-3
    offensivePress: "aggressive" | "balanced" | "cautious";
    
    // Individual instructions
    playerMarkingAssignments: {
      [defensivePlayerId]: {
        markOpponent: opponentPlayerId;
        markingType: "tight" | "loose";
      }
    };
  };
  
  // 3. In-match instructions
  substitution?: {
    outPlayer: string;
    inPlayer: string;
  };
  
  // 4. Set-piece tactic
  setpieceTactic?: {
    cornerKickRoutine: "near-post" | "far-post" | "short";
    freeKickTactic: "direct" | "cross" | "short";
  };
}
```

### 2.2 Deterministic Decision Engine

```typescript
class TacticalDecisionEngine {
  // Given tactical state, make deterministic decision for next action
  
  decidePossessionAction(
    possessingPlayer: Player,
    tacticalContext: TacticalContext,
    seed: string
  ): ActionDecision {
    // Decision tree is DETERMINISTIC (seeded random at leaves only)
    
    // 1. What options are available?
    const availableActions = this.getAvailableActions(possessingPlayer);
    // Options: pass (short/long/diagonal), dribble, shoot, cross, backpass
    
    // 2. Score each option based on tactics + game state
    const scores = availableActions.map(action => {
      let score = 50;  // baseline
      
      // Tactical multipliers (deterministic)
      if (action === "pass_short" && tacticalContext.buildUpStyle === "short") {
        score += 20;  // Preferred by tactic
      }
      if (action === "pass_long" && tacticalContext.buildUpStyle === "long") {
        score += 20;
      }
      if (action === "dribble" && tacticalContext.playingTime < 20) {
        score -= 10;  // Risky when losing
      }
      
      // Game state multipliers (deterministic)
      if (possessingPlayer.isNearGoal && action === "shoot") {
        score += 30;  // Obvious choice when in box
      }
      
      // Probability of success (deterministic formula)
      const successRate = this.calculateSuccessRate(action, possessingPlayer);
      score *= successRate;
      
      return { action, score };
    });
    
    // 3. Choose highest-score action (deterministic, no tiebreaking RNG)
    const bestAction = scores.reduce((best, current) =>
      current.score > best.score ? current : best
    );
    
    // 4. Execute with precision (seeded randomness only affects outcome, not decision)
    return {
      action: bestAction.action,
      targetPlayer: this.selectTargetPlayer(bestAction.action),
      executionQuality: this.calculateExecutionQuality(
        possessingPlayer,
        bestAction.action,
        seed  // Only used here for execution precision, not decision-making
      ),
    };
  }

  decidePressDecision(
    defensivePlayer: Player,
    tacticalContext: TacticalContext,
    seed: string
  ): PressingDecision {
    // Pressing is deterministic based on tactical parameters
    
    const ballCarrier = this.match.getPossession();
    const distance = ballCarrier.position.distanceTo(defensivePlayer.position);
    
    // Pressing trigger (deterministic threshold)
    const pressTriggerDistance = tacticalContext.pressingDistance / 100 * 20;  // 0-20m
    
    const shouldPress = distance < pressTriggerDistance;
    
    if (shouldPress) {
      // How aggressively to press?
      const pressAggression = tacticalContext.pressIntensity / 100;  // 0-1
      
      return {
        decision: "press",
        targetPlayer: ballCarrier,
        intensity: pressAggression,
        // Deterministic: pressing success is based on:
        // - Relative speed
        // - Positioning angle
        // - Opposing player's decision quality
        // NOT random
      };
    } else {
      // Fall back and cover space
      return {
        decision: "cover_space",
        coverArea: this.identifyCriticalSpace(),
        intensity: 0.3,
      };
    }
  }

  decideMovement(
    player: Player,
    tacticalContext: TacticalContext,
    seed: string
  ): MovementDecision {
    // Movement is deterministic based on formation + ball position
    
    // Off-ball positioning is calculated, not random
    const formationPosition = this.getFormationPosition(
      player.role,
      tacticalContext.formation,
      tacticalContext.formations
    );
    
    const ballPosition = this.match.ball.position;
    
    // Move towards formation position, with bias towards ball
    const targetPosition = this.calculateTargetPosition(
      formationPosition,
      ballPosition,
      tacticalContext.adjustments
    );
    
    return {
      targetPosition,
      speed: player.speed * (tacticalContext.fatigue / 100),
      // Movement is smooth and predictable
    };
  }
}
```

### 2.3 Expressiveness in Practice

Same formation, different parameters = different match:

```typescript
// Example: 4-3-3 formation with different adjustments

const possessionStyle = {
  formation: "4-3-3",
  defensiveLineHeight: 35,       // High
  pressingDistance: 80,          // Aggressive press far from goal
  buildUpDirection: "short",     // Keep possession in build-up
  buildUpTempo: "slow",
  attackingWidth: 80,            // Spread full width
};
// Result: Ball-dominant, press high, stretched defense, control midfield

const defensiveStyle = {
  formation: "4-3-3",
  defensiveLineHeight: 70,       // Deep
  pressingDistance: 20,          // Only press in own half
  buildUpDirection: "long",      // Quick transition
  buildUpTempo: "fast",
  attackingWidth: 30,            // Narrow, compact midfield
};
// Result: Compact shape, play on counter, cede possession, lethal transitions

// Same formation, completely different matches:
// Possession: 65% possession, 12 shots, 5 goals (expected)
// Defensive: 35% possession, 4 shots, 4 goals (efficient counters)

// Determinism verified: run same match 100 times = same outcome (0% variance)
```

---

## 3. Determinism Infrastructure

### 3.1 Seeding Strategy

```typescript
interface DeterminismSeed {
  // Seeds are hierarchical
  
  // 1. Match seed (created at match start)
  matchId: string;
  matchSeed: string;  // Hash(matchId + timestamp + both player addresses)
  
  // 2. Frame seed (deterministic from match seed)
  frameSeed: string;  // Hash(matchSeed + frameNumber)
  
  // 3. Subsystem seeds (derived from frame seed)
  physicsSeed: string;    // Hash(frameSeed + "physics")
  tacticalSeed: string;   // Hash(frameSeed + "tactical")
  randomSeed: string;     // Hash(frameSeed + "random")
}

// Seeding is DETERMINISTIC (no true randomness)
function generateSeeds(matchId: string, frameNumber: number): DeterminismSeed {
  const matchSeed = hashSHA256(
    matchId + 
    matchStartTime + 
    player1Address + 
    player2Address
  );
  
  const frameSeed = hashSHA256(matchSeed + frameNumber.toString());
  
  return {
    matchId,
    matchSeed,
    frameSeed,
    physicsSeed: hashSHA256(frameSeed + "physics"),
    tacticalSeed: hashSHA256(frameSeed + "tactical"),
    randomSeed: hashSHA256(frameSeed + "random"),
  };
}

// Usage in simulation
function simulatePhysics(state: MatchState, seed: string) {
  // All "randomness" uses deterministic pseudorandom from seed
  const rng = new SeededRandom(seed);
  
  // Example: ball friction varies slightly, but deterministically
  const frictionVariance = rng.nextFloat() * 0.1 - 0.05;  // ±5% variance
  const actualFriction = BALL_FRICTION + frictionVariance;
  
  // Result: physics is "noisy" and realistic, but verifiable
  // Replay verification runs same seed, gets same physics
}
```

### 3.2 Replay Storage & Verification

```typescript
interface VerifiableReplay {
  // Minimal replay data (can be compressed to ~100KB for 90-min match)
  
  matchMetadata: {
    matchId: string;
    player1: string;
    player2: string;
    startTime: number;
    duration: number;
  };
  
  // Seeds for each frame
  seedLog: {
    frameNumber: number;
    matchSeed: string;
    frameSeed: string;
    physicsSeed: string;
    tacticalSeed: string;
  }[];
  
  // All player inputs (compressed)
  inputLog: {
    frameNumber: number;
    player1Input: PlayerInput;
    player2Input: PlayerInput;
  }[];
  
  // Server decisions at key moments
  keyFrames: {
    frameNumber: number;
    ballPosition: Vector3;
    serverTimestamp: number;
    serverSignature: string;
  }[];
  
  // Final result hash (anchor on blockchain)
  resultHash: string;
  blockchainTxHash: string;
}

// Verification process
async function verifyReplay(replay: VerifiableReplay): Promise<VerificationResult> {
  // 1. Reconstruct initial state
  const initialState = reconstructInitialState(replay.matchMetadata);
  
  // 2. Simulate frame-by-frame
  let currentState = initialState;
  
  for (const frameLog of replay.seedLog) {
    const inputs = findInputsForFrame(replay.inputLog, frameLog.frameNumber);
    
    // Simulate using same seed
    const nextState = simulateFrame(
      currentState,
      inputs,
      frameLog.frameSeed
    );
    
    // Verify against key frame if available
    const keyFrame = findKeyFrame(replay.keyFrames, frameLog.frameNumber);
    if (keyFrame) {
      if (!ballPositionMatches(nextState.ballPosition, keyFrame.ballPosition)) {
        return {
          valid: false,
          error: `Physics mismatch at frame ${frameLog.frameNumber}`,
        };
      }
    }
    
    currentState = nextState;
  }
  
  // 3. Verify final result
  const computedHash = hashFinalState(currentState);
  if (computedHash !== replay.resultHash) {
    return { valid: false, error: "Final state doesn't match" };
  }
  
  // 4. Verify blockchain anchor
  const blockchainResult = await blockchain.verifyTxHash(replay.blockchainTxHash);
  if (!blockchainResult.matchesHash(replay.resultHash)) {
    return { valid: false, error: "Blockchain anchor tampered" };
  }
  
  return { valid: true, message: "Replay verified" };
}
```

---

## 4. Expressiveness: How Choices Matter

### 4.1 Formation Effects

```typescript
// Each formation has inherent tactical profile (deterministic)

const formations = {
  "4-3-3": {
    defensiveShape: "compact",
    midfield: "balanced",
    attackingWidth: "wide",
    
    effectiveness: {
      vsNarrow: 0.85,      // Good against 4-2-3-1
      vsWide: 1.1,         // Excellent against 3-5-2
      vsDirect: 0.95,      // Decent vs long balls
    },
    
    characterization: "Balanced, versatile, rewards possession",
    matchPlayEffect: (tactics) => ({
      possession: 0.5 + (tactics.buildUpStyle === "short" ? 0.15 : -0.1),
      pressureExerted: tactics.pressingDistance / 100 * 0.8,
      defensiveVulnerability: Math.abs(100 - tactics.defensiveLineHeight) / 100 * 0.3,
    }),
  },
  
  "4-2-3-1": {
    defensiveShape: "double-pivot",
    midfield: "defensive",
    attackingWidth: "narrow",
    
    effectiveness: {
      vsNarrow: 1.15,      // Excellent vs 4-3-3
      vsWide: 0.8,         // Struggles vs width
      vsDirect: 1.2,       // Strong vs long balls
    },
    
    characterization: "Defensive, structured, controls midfield",
    matchPlayEffect: (tactics) => ({
      possession: 0.35 + (tactics.buildUpStyle === "short" ? 0.1 : 0),
      pressureExerted: tactics.pressingDistance / 100 * 0.4,  // Lower pressing by default
      defensiveVulnerability: 0.2,  // Very safe
    }),
  },
  
  "3-5-2": {
    defensiveShape: "wing-play",
    midfield: "attacking",
    attackingWidth: "very-wide",
    
    effectiveness: {
      vsNarrow: 1.25,      // Deadly vs double pivot
      vsWide: 1.0,         // Fair vs 4-3-3
      vsDirect: 0.75,      // Weak vs direct play
    },
    
    characterization: "Attacking, width-dominant, vulnerable to direct",
    matchPlayEffect: (tactics) => ({
      possession: 0.6 + (tactics.buildUpStyle === "short" ? 0.1 : 0),
      pressureExerted: tactics.pressingDistance / 100 * 0.9,  // Aggressive
      defensiveVulnerability: 0.5,  // Exposed, but rewarding
    }),
  },
};

// Simulation shows formation effects deterministically
const match = new TacticsEngine();
match.setFormations("4-3-3", "4-2-3-1");

// Run 100 matches (deterministically identical)
for (let i = 0; i < 100; i++) {
  const result = match.simulate();
}
// Results: 4-3-3 wins ~45%, 4-2-3-1 wins ~55%
// (because double-pivot is strong against balanced 4-3-3)

// But each match is tactically interesting (not predetermined 55% win)
```

### 4.2 Parameter Effects

```typescript
// Defensive line height affects goal vulnerability (deterministic)

const defensiveLineExperiment = {
  opponent: "4-3-3 possession team",
  ourFormation: "4-3-3",
  parameter: "defensiveLineHeight",
  
  results: [
    { defensiveLineHeight: 25, goalsAgainstPer90: 0.8, goalsForPer90: 2.1 },
    // Very high line: leave space behind, get caught on transition
    
    { defensiveLineHeight: 50, goalsAgainstPer90: 1.2, goalsForPer90: 2.5 },
    // Balanced: reasonable trade-off
    
    { defensiveLineHeight: 75, goalsAgainstPer90: 1.6, goalsForPer90: 1.8 },
    // Deep line: hard to break down, but less effective offensively
  ],
};

// Pressing intensity affects ball recovery (deterministic)

const pressingIntensityExperiment = {
  opponent: "4-2-3-1 defensive team",
  ourFormation: "3-5-2 aggressive",
  parameter: "pressingDistance",
  
  results: [
    { pressingDistance: 10, ballRecoveriesPerMatch: 8, fatiqueRisk: 0.3 },
    // Low pressing: rarely win the ball back, fresh late-game
    
    { pressingDistance: 50, ballRecoveriesPerMatch: 15, fatigueRisk: 0.6 },
    // Medium pressing: balanced recovery and tiredness
    
    { pressingDistance: 90, ballRecoveriesPerMatch: 22, fatigueRisk: 0.95 },
    // High pressing: win ball frequently, exhausted players, risky
  ],
};

// Every parameter change is expressive and deterministic
```

---

## 5. Server Authority Implementation

### 5.1 Client-Server Communication

```typescript
// CLIENT: Player sends INTENT only

app.socket.on("playerInput", (input: PlayerInput) => {
  // Client sends what they want to do
  const intent = {
    formation: "4-3-3",
    defensiveLineHeight: 45,
    pressingDistance: 60,
    // ... other intent data
  };
  
  // Client does NOT send:
  // - "I scored a goal" (only server decides)
  // - "I won possession" (only server decides)
  // - "My player is at position X" (only server decides)
  
  emit("playerIntent", intent);
});

// SERVER: Server simulates and broadcasts result

io.on("connection", (socket) => {
  socket.on("playerIntent", (intent: PlayerIntent) => {
    // 1. Validate input
    const isValid = validateIntent(intent, socket.playerId);
    if (!isValid) {
      socket.emit("invalidInput", { reason: "Invalid intent" });
      return;
    }
    
    // 2. Simulate outcome (deterministically)
    const outcome = this.tacticsEngine.simulateNextFrame(
      currentMatchState,
      intent,
      currentSeed
    );
    
    // 3. Broadcast to BOTH players (they see same thing)
    io.to(matchId).emit("matchState", {
      ballPosition: outcome.ballPosition,
      playerPositions: outcome.playerPositions,
      possession: outcome.possession,
      events: outcome.events,
      
      // Proof of server authority
      serverTimestamp: Date.now(),
      serverSignature: signOutcome(outcome),
      frameNumber: currentFrame,
    });
    
    // 4. Anchor significant frames on blockchain
    if (isSignificantFrame(outcome)) {
      blockchain.submitFrame({
        matchId,
        frameNumber: currentFrame,
        frameHash: hashOutcome(outcome),
        blockNumber: await provider.getBlockNumber(),
      });
    }
  });
});
```

### 5.2 Preventing Client Desync

```typescript
// Clients might try to claim different match states
// Solution: Server broadcasts "source of truth"

class DesyncPrevention {
  // Every frame, server sends canonical state
  canonicalState = {
    ballPosition: Vector3,
    playerPositions: Map<string, Vector3>,
    possession: string,
    score: { team1: 0, team2: 0 },
    
    // Server signature (tamper-proof)
    serverSignature: string,
    blockchainAnchor: string,
  };
  
  // If client state differs, client is corrected
  onClientStateRequest(socket: Socket) {
    const clientClaim = socket.lastReceivedState;
    
    if (!statesMatch(clientClaim, this.canonicalState)) {
      // Client is desync'd
      socket.emit("stateCorrection", {
        correctState: this.canonicalState,
        yourClaimedState: clientClaim,
        reason: "Server broadcast was authoritative",
      });
      
      // Log for anti-cheat
      antiCheatLog.recordDesync({
        playerId: socket.playerId,
        frame: currentFrame,
        claimed: clientClaim,
        actual: this.canonicalState,
      });
    }
  }
  
  // Client can't "undo" decisions
  onInputRequest(socket: Socket, input: PlayerInput) {
    // Server only accepts inputs going forward
    if (input.timestamp < currentMatchTimestamp) {
      socket.emit("rejectedInput", {
        reason: "Input is in the past",
        currentTime: currentMatchTimestamp,
        inputTime: input.timestamp,
      });
    }
  }
}
```

---

## 6. Legibility: Understanding Why

### 6.1 Decision Logs

```typescript
interface DecisionLog {
  frame: number;
  playerWithBall: string;
  
  // What decision was made?
  decision: {
    action: string;  // "pass_short", "shoot", "dribble", etc
    targetPlayer?: string;
    executionQuality: number;  // 0-100
  };
  
  // Why was this decision made?
  decisionReasoning: {
    availableOptions: {
      option: string;
      score: number;
      reasoning: string;
    }[];
    
    chosenOption: string;
    whyChosen: string;
  };
  
  // What was the outcome?
  outcome: {
    success: boolean;
    result: string;  // "Pass completed", "Ball lost", "Goal", etc
  };
  
  // What could have been better?
  improvementSuggestion?: string;
}

// Example decision log
const exampleLog: DecisionLog = {
  frame: 500,
  playerWithBall: "player_123_CM",
  
  decision: {
    action: "pass_short",
    targetPlayer: "player_123_CB",
    executionQuality: 92,
  },
  
  decisionReasoning: {
    availableOptions: [
      {
        option: "pass_short",
        score: 75,
        reasoning: "Our tactic is 'short passing', CB is 5m away, high success rate",
      },
      {
        option: "pass_long",
        score: 45,
        reasoning: "Risky, goes against our build-up style, but might create chance",
      },
      {
        option: "dribble",
        score: 40,
        reasoning: "Pressure incoming (opponent 8m away), risky",
      },
      {
        option: "shoot",
        score: 0,
        reasoning: "30m from goal, no attempt",
      },
    ],
    
    chosenOption: "pass_short",
    whyChosen: "Highest score (75). Aligns with 'short passing' tactic.",
  },
  
  outcome: {
    success: true,
    result: "Pass completed to CB, possession maintained",
  },
  
  improvementSuggestion: "All good. Decision was tactically sound.",
};

// Post-match, player can review every decision
function generateDecisionReview(match: Match) {
  const decisionLogs = match.getAllDecisionLogs();
  
  const review = {
    totalDecisions: decisionLogs.length,
    successRate: decisionLogs.filter(d => d.outcome.success).length / decisionLogs.length,
    
    bestDecisions: decisionLogs
      .sort((a, b) => b.decisionReasoning.chosenOption.score - a.decisionReasoning.chosenOption.score)
      .slice(0, 5),
    
    worstDecisions: decisionLogs
      .sort((a, b) => a.decision.executionQuality - b.decision.executionQuality)
      .slice(0, 5),
    
    tacticalPatterns: {
      favoredFormations: [/* formations player used */],
      effectiveVsOpponentStyle: [/* what worked against opponent */],
      failedDecisions: [/* patterns in mistakes */],
    },
  };
  
  return review;
}
```

### 6.2 Tactical Visualization

```typescript
interface TacticalVisualization {
  // Replay viewer shows why every event happened
  
  formationOverlay: {
    // Show formation shapes every second
    formations: {
      time: number,
      team1: FormationShape,
      team2: FormationShape,
    }[],
  };
  
  decisionHighlights: {
    // Highlight tactical decisions
    time: number,
    description: string,
    type: "press" | "pass" | "shoot" | "movement",
    explanation: string,  // Why did this happen?
  }[];
  
  keyMoments: {
    // Annotate important moments with tactics
    time: number,
    event: string,
    tacticalContext: string,
    decisionChain: string,  // How did we get here?
  }[];
}

// Example: Goal visualization
const goalVisualization: TacticalVisualization = {
  formationOverlay: {
    formations: [
      { time: 47, team1: {...}, team2: {...} },
      { time: 47.5, team1: {...}, team2: {...} },
    ],
  },
  
  decisionHighlights: [
    {
      time: 46.8,
      description: "CB passes to CM",
      type: "pass",
      explanation: "Short passing tactic, CM has space",
    },
    {
      time: 47.2,
      description: "CM presses forward",
      type: "movement",
      explanation: "Box-to-box CM moving into attacking space per tactic",
    },
    {
      time: 47.5,
      description: "ST receives, shoots",
      type: "shoot",
      explanation: "6-yard box, high-quality chance, clear shot decision",
    },
  ],
  
  keyMoments: [
    {
      time: 46.0,
      event: "Goal scored",
      tacticalContext: "3-1 down, attacking with 3-5-2",
      decisionChain: "CB → CM → AM → ST (width exploitation killed defensive line)",
    },
  ],
};
```

---

## 7. Implementation Roadmap

### Phase 1: Core Engine (Weeks 1-4)
- [ ] Seeding system (deterministic hash chains)
- [ ] Formation positioning engine
- [ ] Basic decision tree (pass/dribble/shoot)
- [ ] Server authority architecture

### Phase 2: Expressiveness (Weeks 5-8)
- [ ] Parameter effects (defensive line, pressing, build-up)
- [ ] Formation-specific behaviors
- [ ] Tactical multipliers (short-pass teams vs long-ball teams)
- [ ] In-match tactical adjustments

### Phase 3: Legibility (Weeks 9-12)
- [ ] Decision logging system
- [ ] Post-match analysis
- [ ] Tactical feedback generation
- [ ] Replay viewer with annotations

### Phase 4: Verification (Weeks 13-16)
- [ ] Seed-based replay verification
- [ ] Blockchain anchoring of key frames
- [ ] Dispute resolution integration
- [ ] Anti-cheat validation

---

## 8. Success Metrics

A successful tactics engine meets these criteria:

```typescript
interface TacticsEngineQualityMetrics {
  // Determinism: 100% of replays verify
  replayVerificationRate: 1.0,
  deterministicSimulationRate: 1.0,
  
  // Expressiveness: tactical choices are measurable
  formationEffectSize: 0.3,  // 30% variance between formations
  parameterEffectSize: 0.25, // 25% variance from parameter changes
  playersFeel: "meaningful choices matter immediately",
  
  // Legibility: players understand why
  decisionLogsCompletion: 1.0,  // Every decision logged
  postMatchTacticalFeedback: true,
  playerUnderstanding: 0.8,  // 80% of players say "I understand what happened"
  
  // Authority: server is trusted
  clientDesyncCases: 0,
  cheatAttempts: 0,  // Or caught and slashed
  playerTrustScore: 0.95,  // Trust in fairness
}
```

---

## Conclusion

The tactics engine is the **heart of Bass Ball**'s gameplay. It must:

1. **Be Deterministic**: Same inputs, same outcome, always
2. **Be Expressive**: Tactical choices immediately visible in playstyle
3. **Be Legible**: Players understand cause-effect
4. **Be Authoritative**: Server decides, client trusts

When these four principles align, Bass Ball becomes a **skill-expressive, trustworthy, tactical football game**—not because of Web3, but because the design is right.

Web3 adds verification and permanence. But the tactics engine is where the game lives.

