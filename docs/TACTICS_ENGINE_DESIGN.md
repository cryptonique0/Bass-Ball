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

## 2. Tactical Abstraction Layers

The tactics engine is structured in **distinct layers**, each with different update frequencies and responsibilities. This prevents a monolithic "decide everything every frame" approach that would be both unpredictable and performance-intensive.

### 2.1 Layer 1: Team Tactical Profile (Pre-Frame, Event-Driven)

**Purpose**: Defines the team's stable tactical approach. Updated infrequently, applies to all decisions.

**Update Triggers** (only these events trigger Layer 1 updates):
- Match kickoff
- Tactical change command (player adjusts formation/pressing/build-up)
- Major events (red card, injury, goal)
- Substitution
- Halftime

**Update Frequency**: ~6-8 times per 90-minute match (vs 5,400 frames/match at 60fps)

**Data Structure**:

```typescript
interface TeamTactics {
  // Core formation identity
  formation: FormationID;  // e.g., "4-3-3", "4-2-3-1", "3-5-2"
  
  // Defensive shape parameters
  lineHeight: number;        // 0–100 (0=deep defensive shape, 100=high press)
  lineWidth: number;         // 0–100 (0=compact, 100=stretched wide)
  pressingIntensity: number; // 0–100 (0=no press, 100=aggressive man-to-man)
  pressingTrigger: enum;     // "immediate" | "delayed" | "ball_recovery"
  
  // Possession & tempo
  tempo: enum;               // "slow" | "controlled" | "fast"
  buildUpStyle: enum;        // "short" | "mixed" | "direct"
  
  // Defensive philosophy
  defensiveStyle: enum;      // "zonal" | "hybrid" | "man"
  
  // Advanced adjustments (optional)
  wingAttackMode: enum;      // "narrow" | "balanced" | "wide"
  setPlayMode: enum;         // "defensive" | "balanced" | "aggressive"
  injuryTime: boolean;       // True = defensive, time-wasting adjustments
}

// Team tactics never change mid-frame
// All per-frame decisions are derived from this stable layer
```

**Why This Matters**:
1. **Predictability**: Player knows what the team is trying to do
2. **Expressiveness**: Swapping 4-3-3 to 3-5-2 should feel obviously different, not just tweak parameters
3. **Determinism**: Same team tactics + same situation = deterministic decision outcomes
4. **Server Authority**: Server validates all tactical changes before applying

**Example Decision Cascade**:

```typescript
// Pre-match or in-match tactical change
let teamTactics: TeamTactics = {
  formation: "4-2-3-1",
  lineHeight: 45,        // Medium defensive line
  lineWidth: 70,         // Fairly stretched
  pressingIntensity: 35, // Moderate pressing
  tempo: "controlled",
  buildUpStyle: "short",
  defensiveStyle: "zonal",
};

// Every frame, decisions are derived from this stable tactical profile
function decidePlayerAction(
  player: Player,
  gameState: GameState,
  teamTactics: TeamTactics  // ← Layer 1 feeds into Layer 2
): PlayerAction {
  // Player role is defined by formation
  const role = getPlayerRole(player, teamTactics.formation);
  
  // Decision is constrained by team tactics
  if (gameState.possession === "us") {
    return decidePossessionAction(player, role, gameState, teamTactics);
  } else {
    return decideDefensiveAction(player, role, gameState, teamTactics);
  }
}
```

### 2.1.5 Formation System: Dynamic Spatial Blueprints

**Purpose**: Formations are not static dots—they're dynamic spatial anchors that shift with the ball, compress with tactics, but maintain shape integrity.

**Core Concept**: Each formation is defined as a set of **relative anchors** (positional offsets from a pivot point). These anchors:
1. Shift spatially based on ball location
2. Compress/expand based on tactical parameters
3. Allow individual player deviations (capped to avoid chaos)

**Formation Definition**:

```typescript
interface Formation {
  formationId: string;        // "4-2-3-1", "3-5-2", "4-3-3", etc.
  
  // Relative anchors (pitch coordinates, relative to pivot)
  // Pitch dimensions: width=100, depth=100 (normalized)
  // Origin: (0,0) at center of pitch
  positions: {
    GK: Vector2;              // Goalkeeper
    CB_L: Vector2;            // Center back left
    CB_R: Vector2;            // Center back right
    DM?: Vector2;             // Defensive midfielder (optional)
    CM_L: Vector2;            // Center midfielder left
    CM_R: Vector2;            // Center midfielder right
    CAM?: Vector2;            // Attacking midfielder (optional)
    LW?: Vector2;             // Left winger (optional)
    RW?: Vector2;             // Right winger (optional)
    ST: Vector2;              // Striker(s)
  };
  
  // Compactness anchor (unit reference point)
  pivotPosition: Vector2;     // Usually (0, 0) or varies by play style
  
  // Maximum allowed deviation from anchor per player
  maxDeviation: number;       // e.g., 3–5 (in pitch coordinates)
}

// Example: 4-2-3-1 formation
const formation_4231: Formation = {
  formationId: "4-2-3-1",
  positions: {
    GK:   {x:   0, y: -45},   // Deep goalkeeper line
    CB_L: {x: -10, y: -30},   // Center backs at 30m from goal
    CB_R: {x:  10, y: -30},
    DM:   {x:   0, y: -10},   // Defensive pivot in front of CBs
    CM_L: {x: -15, y:   5},   // Midfielders slightly advanced
    CM_R: {x:  15, y:   5},
    CAM:  {x:   0, y:  15},   // Attacking mid between midfield and striker
    ST:   {x:   0, y:  30},   // Striker advanced
  },
  pivotPosition: {x: 0, y: -25},  // Pivot around midfield line
  maxDeviation: 4,
};

// Example: 3-5-2 formation (more attacking)
const formation_352: Formation = {
  formationId: "3-5-2",
  positions: {
    GK:   {x:   0, y: -45},
    CB_L: {x: -15, y: -30},   // Wider center backs
    CB_R: {x:  15, y: -30},
    CM:   {x:   0, y:  -5},   // Single pivot
    LW:   {x: -25, y:  10},   // Wing-backs push high
    RW:   {x:  25, y:  10},
    CAM:  {x:  -8, y:  18},   // Two attacking mids
    ST_L: {x:  -5, y:  35},   // Two strikers
    ST_R: {x:   5, y:  35},
  },
  pivotPosition: {x: 0, y: -20},
  maxDeviation: 5,
};
```

**Anchor Shifting Based on Ball Location**:

```typescript
interface FormationState {
  formation: Formation;
  currentAnchors: Map<string, Vector3>;  // Player role → current anchor position
  activePivot: Vector3;                  // Current pivot point
}

// Ball location shifts formation anchors (defensive retreat, attacking press)
function updateFormationAnchors(
  gameState: GameState,
  formation: Formation,
  teamTactics: TeamTactics
): FormationState {
  
  // Base anchors from formation definition
  let newAnchors = new Map(formation.positions);
  
  // RULE 1: Defensive shift (ball in attacking half)
  if (gameState.ballPosition.y > 0) {
    // Ball is in opponent's half → formation shifts forward
    const advanceDistance = Math.min(20, gameState.ballPosition.y * 0.5);
    newAnchors.forEach((pos, role) => {
      newAnchors.set(role, {
        x: pos.x,
        y: pos.y + advanceDistance,  // Shift entire formation forward
      });
    });
  }
  
  // RULE 2: Defensive retreat (ball in defensive half)
  if (gameState.ballPosition.y < -20) {
    // Ball is in defensive half → compact formation
    const retreatDistance = Math.abs(gameState.ballPosition.y) * 0.3;
    newAnchors.forEach((pos, role) => {
      newAnchors.set(role, {
        x: pos.x,
        y: pos.y - retreatDistance,  // Shift formation back
      });
    });
  }
  
  // RULE 3: Width adjustment (ball on wing)
  const ballXDistance = Math.abs(gameState.ballPosition.x);
  if (ballXDistance > 30) {
    // Ball on wing → formation narrows toward ball
    const narrowFactor = 0.8 - (ballXDistance / 100) * 0.2;
    newAnchors.forEach((pos, role) => {
      const newX = pos.x * narrowFactor;  // Pull toward center
      newAnchors.set(role, {x: newX, y: pos.y});
    });
  }
  
  return {
    formation,
    currentAnchors: newAnchors,
    activePivot: gameState.ballPosition,  // Pivot around ball location
  };
}
```

**Compression/Expansion Based on Tactics**:

```typescript
// Tactical parameters (Layer 1) directly affect spatial compactness
function applyTacticalCompression(
  anchors: Map<string, Vector2>,
  teamTactics: TeamTactics,
  formation: Formation
): Map<string, Vector2> {
  
  const compressed = new Map(anchors);
  const pivot = formation.pivotPosition;
  
  // RULE 1: High pressing (pressingIntensity > 70) → compact and advanced
  if (teamTactics.pressingIntensity > 70) {
    compressed.forEach((pos, role) => {
      // Pull toward pivot and advance
      const towardPivot = {
        x: pos.x * 0.85,     // 15% narrower
        y: pos.y + 5,        // 5m more advanced
      };
      compressed.set(role, towardPivot);
    });
  }
  
  // RULE 2: Low defensive line (lineHeight < 40) → stretched shape
  if (teamTactics.lineHeight < 40) {
    compressed.forEach((pos, role) => {
      const stretched = {
        x: pos.x * 1.15,     // 15% wider
        y: pos.y - 10,       // Deeper
      };
      compressed.set(role, stretched);
    });
  }
  
  // RULE 3: Narrow formation (lineWidth < 40) → compact horizontally
  if (teamTactics.lineWidth < 40) {
    compressed.forEach((pos, role) => {
      compressed.set(role, {
        x: pos.x * 0.6,      // Significantly narrower
        y: pos.y,
      });
    });
  }
  
  // RULE 4: Wide formation (lineWidth > 75) → stretched horizontally
  if (teamTactics.lineWidth > 75) {
    compressed.forEach((pos, role) => {
      compressed.set(role, {
        x: pos.x * 1.3,      // Significantly wider
        y: pos.y,
      });
    });
  }
  
  // RULE 5: Fast tempo → slightly more advanced
  if (teamTactics.tempo === "fast") {
    compressed.forEach((pos, role) => {
      compressed.set(role, {
        x: pos.x,
        y: pos.y + 3,        // More aggressive positioning
      });
    });
  }
  
  return compressed;
}
```

**Individual Player Deviations (Capped)**:

```typescript
interface PlayerPosition {
  player: Player;
  anchorPosition: Vector2;     // Where formation says they should be
  currentPosition: Vector3;    // Where they actually are (can deviate)
  deviationAllowed: number;    // Max distance from anchor
}

// Each player can deviate from anchor, but capped
function calculatePlayerTargetPosition(
  player: Player,
  formation: Formation,
  tacticalAnchors: Map<string, Vector2>,
  playerDecision: PlayerAction
): Vector3 {
  
  // 1. Get formation anchor for this player's role
  const anchor = tacticalAnchors.get(player.position);
  if (!anchor) return player.currentPosition;  // Fallback
  
  // 2. Get max allowed deviation for this formation
  const maxDeviation = formation.maxDeviation;
  
  // 3. Calculate player's desired position based on action
  const desiredPos = calculateDesiredPosition(playerDecision, anchor);
  
  // 4. Cap deviation from anchor
  const deviation = distance(desiredPos, anchor);
  if (deviation > maxDeviation) {
    // Player wants to deviate too far → cap it
    const cappedPos = moveToward(anchor, desiredPos, maxDeviation);
    return cappedPos;
  }
  
  return desiredPos;
}

// Example: CM wants to "offerSupport" but can only deviate 4m from anchor
function calculateDesiredPosition(
  action: PlayerAction,
  anchor: Vector2
): Vector3 {
  switch (action.actionType) {
    case "offerSupport":
      // Move 3–4m forward from anchor
      return {x: anchor.x, y: anchor.y + 4, z: 0};
    
    case "carry_ball":
      // Move 5m forward, but will be capped at 4m deviation
      return {x: anchor.x, y: anchor.y + 5, z: 0};
    
    case "hold_zone":
      // Stay at anchor
      return {x: anchor.x, y: anchor.y, z: 0};
    
    case "press_defender":
      // Move toward defender, capped by deviation limit
      return {x: anchor.x + 2, y: anchor.y + 3, z: 0};
    
    default:
      return {x: anchor.x, y: anchor.y, z: 0};
  }
}
```

**Determinism Guarantee**:

```typescript
// Formation dynamics are fully deterministic
function evaluateFormationState(
  gameState: GameState,
  formation: Formation,
  teamTactics: TeamTactics,
  seed: string
): FormationState {
  
  // 1. Update anchors based on ball location (deterministic)
  const anchorsAfterBallShift = updateFormationAnchors(
    gameState,
    formation,
    teamTactics
  );
  
  // 2. Apply tactical compression (deterministic)
  const anchorsAfterCompression = applyTacticalCompression(
    anchorsAfterBallShift.currentAnchors,
    teamTactics,
    formation
  );
  
  // 3. All players are now positioned around these anchors
  // Individual deviations are capped and deterministic (no RNG)
  
  return {
    formation,
    currentAnchors: anchorsAfterCompression,
    activePivot: gameState.ballPosition,
  };
}

// VERIFICATION: Same gameState + formation + teamTactics = same anchors (always)
```

**Why This Works**:

1. ✅ **Fluidity**: Formation shifts with ball location, reacts to tactics
2. ✅ **Shape Integrity**: Anchors maintain formation structure despite movement
3. ✅ **Individual Autonomy**: Players can deviate, but within guardrails
4. ✅ **Deterministic**: No RNG, fully reproducible
5. ✅ **Legible**: Anchor positions are visually clear in replay viewer
6. ✅ **Performance**: Simple geometric calculations, O(n) per frame

### 2.1.6 Pressing System: Trigger-Based Response

**Purpose**: Pressing is not constant chasing—it's triggered response. Only the nearest valid players press, keeping behavior realistic and computationally efficient.

**Core Problem**: Naive pressing (every player chases opponent with the ball) causes:
- Unrealistic, chaotic movement
- Defensive collapse (too many pressers leaves defense exposed)
- Expensive computation (O(n²) distance checks every frame)

**Solution**: Trigger-based pressing with radius, duration, and priority.

**Pressing Triggers**:

```typescript
interface PressingTrigger {
  triggerId: string;
  triggerType: enum;         // "bad_touch" | "back_to_goal" | "sideline_trap" | "numerical_advantage"
  emittingPlayer: Player;    // Player observing the trigger
  triggerPosition: Vector3;  // Where the trigger occurred
  
  // Press signal properties
  radius: number;            // How far the press reaches (in meters)
  duration: number;          // How long the press lasts (in frames)
  priority: number;          // Higher = more important, overrides other actions
  
  // Constraints (from Layer 1)
  pressingIntensity: number; // Team's pressing intensity (0–100)
  maxPressers: number;       // How many players can press (based on formation)
}

// Trigger 1: Bad first touch
const badTouchTrigger = (
  opponent: Player,
  gameState: GameState,
  teamTactics: TeamTactics
): PressingTrigger | null => {
  
  // Detect bad first touch: ball speed after receiving pass is low/erratic
  const touchQuality = opponent.lastTouchQuality;  // 0–100
  
  if (touchQuality < 40) {
    return {
      triggerId: `bad_touch_${opponent.id}_${gameState.frameNumber}`,
      triggerType: "bad_touch",
      emittingPlayer: opponent,
      triggerPosition: opponent.position,
      radius: 15,                                  // 15m press radius
      duration: 30,                               // 30 frames (~500ms)
      priority: 80,
      pressingIntensity: teamTactics.pressingIntensity,
      maxPressers: Math.ceil(teamTactics.pressingIntensity / 25),  // 1–4 pressers
    };
  }
  return null;
};

// Trigger 2: Back to goal (vulnerable position)
const backToGoalTrigger = (
  opponent: Player,
  gameState: GameState,
  teamTactics: TeamTactics
): PressingTrigger | null => {
  
  // Opponent is facing away from goal (back to goal position)
  const facingAwayFromGoal = opponent.facingDirection.dot(
    gameState.ballPosition.subtract(opponent.position)
  ) < 0;
  
  if (facingAwayFromGoal && teamTactics.pressingIntensity > 50) {
    return {
      triggerId: `back_to_goal_${opponent.id}_${gameState.frameNumber}`,
      triggerType: "back_to_goal",
      emittingPlayer: opponent,
      triggerPosition: opponent.position,
      radius: 18,                                  // Larger radius for vulnerable position
      duration: 40,                               // Longer duration
      priority: 75,
      pressingIntensity: teamTactics.pressingIntensity,
      maxPressers: Math.ceil(teamTactics.pressingIntensity / 20),  // More pressers
    };
  }
  return null;
};

// Trigger 3: Sideline trap (positional advantage)
const sidelineTrapTrigger = (
  opponent: Player,
  gameState: GameState,
  teamTactics: TeamTactics
): PressingTrigger | null => {
  
  // Opponent near sideline (cornered, limited escape routes)
  const distanceToSideline = Math.abs(Math.abs(opponent.position.x) - 50);  // Field width = 100
  
  if (distanceToSideline < 8) {  // Within 8m of sideline
    return {
      triggerId: `sideline_trap_${opponent.id}_${gameState.frameNumber}`,
      triggerType: "sideline_trap",
      emittingPlayer: opponent,
      triggerPosition: opponent.position,
      radius: 12,                                  // Tight press radius
      duration: 50,                               // Extended duration (corner them)
      priority: 90,                               // High priority (positional advantage)
      pressingIntensity: teamTactics.pressingIntensity,
      maxPressers: 2,                             // Usually 2 players trap
    };
  }
  return null;
};

// Trigger 4: Numerical advantage (we have more nearby players)
const numericalAdvantageTrigger = (
  opponent: Player,
  gameState: GameState,
  teamTactics: TeamTactics
): PressingTrigger | null => {
  
  const ourPlayersNearby = countPlayersNearby("us", opponent.position, 20);  // Within 20m
  const theirPlayersNearby = countPlayersNearby("them", opponent.position, 20);
  
  if (ourPlayersNearby > theirPlayersNearby + 1) {  // We have 2+ more players
    return {
      triggerId: `numerical_adv_${opponent.id}_${gameState.frameNumber}`,
      triggerType: "numerical_advantage",
      emittingPlayer: opponent,
      triggerPosition: opponent.position,
      radius: 20,                                  // Large radius (we can afford to press)
      duration: 20,                               // Shorter duration (use advantage quickly)
      priority: 70,
      pressingIntensity: teamTactics.pressingIntensity,
      maxPressers: Math.min(ourPlayersNearby - 1, 3),  // Use excess players
    };
  }
  return null;
};
```

**Press Signal Evaluation (Every Frame)**:

```typescript
interface PressSignal {
  trigger: PressingTrigger;
  validPressers: Player[];  // Nearest players who can respond
  activePressers: Player[]; // Actually pressing (limited by maxPressers)
}

function evaluatePressingTriggers(
  gameState: GameState,
  teamTactics: TeamTactics,
  team: Team
): PressSignal[] {
  
  const signals: PressSignal[] = [];
  const opponents = gameState.getOpponentTeam(team);
  
  for (const opponent of opponents) {
    // Check all trigger types
    const triggers = [
      badTouchTrigger(opponent, gameState, teamTactics),
      backToGoalTrigger(opponent, gameState, teamTactics),
      sidelineTrapTrigger(opponent, gameState, teamTactics),
      numericalAdvantageTrigger(opponent, gameState, teamTactics),
    ].filter(t => t !== null);
    
    for (const trigger of triggers) {
      // Find valid pressers
      const validPressers = findValidPressers(
        team,
        trigger.emittingPlayer,
        trigger.radius,
        trigger.priority
      );
      
      // Select only nearest ones (limited by maxPressers)
      const activePressers = selectNearestPlayers(
        validPressers,
        trigger.emittingPlayer.position,
        trigger.maxPressers
      );
      
      signals.push({
        trigger,
        validPressers,
        activePressers,
      });
    }
  }
  
  // Merge conflicting signals (same player can't press 2 places)
  return resolvePressingConflicts(signals);
}

// Determine which players can respond to a press signal
function findValidPressers(
  team: Team,
  targetOpponent: Player,
  radius: number,
  priority: number
): Player[] {
  
  const valid: Player[] = [];
  
  for (const player of team.players) {
    // Skip if already committed to another action
    if (player.currentAction.priority > priority) {
      continue;
    }
    
    // Skip if out of range
    const distance = player.position.distance(targetOpponent.position);
    if (distance > radius) {
      continue;
    }
    
    // Skip if in attacking third (need to defend)
    if (targetOpponent.position.y > 30) {
      continue;
    }
    
    // Skip goalkeepers
    if (player.position === "GK") {
      continue;
    }
    
    valid.push(player);
  }
  
  return valid;
}

// Select the N nearest players
function selectNearestPlayers(
  candidates: Player[],
  targetPosition: Vector3,
  maxCount: number
): Player[] {
  
  return candidates
    .sort((a, b) => {
      const distA = a.position.distance(targetPosition);
      const distB = b.position.distance(targetPosition);
      return distA - distB;
    })
    .slice(0, maxCount);
}

// If same player is targeted for multiple presses, keep highest priority
function resolvePressingConflicts(signals: PressSignal[]): PressSignal[] {
  
  const playerPresses = new Map<string, PressSignal>();
  
  for (const signal of signals) {
    for (const presser of signal.activePressers) {
      const existing = playerPresses.get(presser.id);
      
      if (!existing || signal.trigger.priority > existing.trigger.priority) {
        playerPresses.set(presser.id, signal);
      }
    }
  }
  
  // Return deduplicated signals
  return Array.from(playerPresses.values());
}
```

**Behavior Tree Integration**:

```typescript
// In player behavior tree, pressing signals override normal decisions

function evaluatePlayerBehavior(
  player: Player,
  gameState: GameState,
  teamTactics: TeamTactics,
  pressingSignals: PressSignal[]
): PlayerAction {
  
  // Check if this player is in an active press signal
  const pressSignal = pressingSignals.find(s =>
    s.activePressers.some(p => p.id === player.id)
  );
  
  if (pressSignal) {
    // Pressing signal overrides normal behavior tree
    return {
      actionType: "press",
      targetPlayer: pressSignal.trigger.emittingPlayer,
      targetPosition: pressSignal.trigger.triggerPosition,
      priority: pressSignal.trigger.priority,  // High priority, not negotiable
      duration: pressSignal.trigger.duration,
    };
  }
  
  // Otherwise evaluate normal behavior tree
  return evaluateNormalBehaviorTree(player, gameState, teamTactics);
}
```

**Why This Works**:

1. ✅ **Realistic**: Pressing is situational, not constant
2. ✅ **Defensive Stability**: Limited pressers (1–4) prevent collapse
3. ✅ **Computationally Cheap**: Only check triggers when conditions are met
4. ✅ **Tactical Control**: pressingIntensity parameter scales maxPressers
5. ✅ **Deterministic**: Trigger conditions are boolean, nearest-player selection is deterministic
6. ✅ **Legible**: Each press signal can be logged and analyzed
7. ✅ **Priority-Based**: Conflicts resolved by priority, not RNG

### 2.1.7 Stamina and Fatigue System

**Purpose**: Stamina does not reduce stats directly (no "70% accuracy when tired"). Instead, it affects timing and eligibility, keeping the game fair while rewarding fitness management.

**Core Problem with Stat Reduction**:
- ❌ "Tired players have 70% passing accuracy" feels unfair (bad luck, not playstyle)
- ❌ Encourages rotation (just swap out tired players = no tension)
- ❌ Stat changes are invisible (player doesn't know why they failed)

**Solution**: Stamina affects three mechanics:
1. **Reaction Delay**: Tired players respond slower (takes more frames to execute)
2. **Max Acceleration**: Tired players can't reach top speed as quickly
3. **Pressing Eligibility**: Tired players can't respond to certain pressing triggers

**Stamina Model**:

```typescript
interface PlayerStamina {
  player: Player;
  
  // Stamina pool (0–100)
  current: number;
  max: number;                    // Can vary by player fitness stat
  
  // Stamina drain per activity
  drainPerFrame: number;          // Base drain (moving, existing)
  drainPerSprint: number;         // Accelerating hard
  drainPerPress: number;          // Engaging in pressing action
  
  // Recovery
  recoveryPerFrame: number;       // When jogging/holding zone
  recoveryPerRest: number;        // When stationary
  
  // Fatigue state (derived from stamina)
  fatigueLevel: enum;             // "fresh" | "normal" | "tired" | "exhausted"
}

// Stamina lifecycle (per frame)
function updatePlayerStamina(
  player: Player,
  currentAction: PlayerAction,
  gameState: GameState
): void {
  
  let staminaDrain = 0.2;  // Base drain per frame (existing)
  
  // Increase drain based on activity intensity
  if (currentAction.actionType === "press") {
    staminaDrain += 0.5;   // Pressing is intense
  } else if (currentAction.actionType === "carry_ball") {
    staminaDrain += 0.4;   // Sprinting/carrying drains more
  } else if (currentAction.actionType === "offerSupport") {
    staminaDrain += 0.3;   // Moving to support position
  }
  
  // Apply drain
  player.stamina.current = Math.max(0, player.stamina.current - staminaDrain);
  
  // Recovery (only when stamina is below 80% and not actively moving)
  if (player.stamina.current < 80 && 
      currentAction.actionType === "hold_zone") {
    player.stamina.current = Math.min(
      100,
      player.stamina.current + 0.1  // Slow recovery
    );
  }
  
  // Update fatigue level
  updateFatigueLevel(player);
}

// Fatigue level thresholds
function updateFatigueLevel(player: Player): void {
  const staminaPercent = (player.stamina.current / player.stamina.max) * 100;
  
  if (staminaPercent > 70) {
    player.stamina.fatigueLevel = "fresh";
  } else if (staminaPercent > 50) {
    player.stamina.fatigueLevel = "normal";
  } else if (staminaPercent > 30) {
    player.stamina.fatigueLevel = "tired";
  } else {
    player.stamina.fatigueLevel = "exhausted";
  }
}
```

**Effect 1: Reaction Delay**:

```typescript
// Tired players take longer to execute decisions

interface ReactionDelayEffect {
  fresh: number;       // 0 frames delay (instant)
  normal: number;      // 2 frames delay (~33ms)
  tired: number;       // 5 frames delay (~83ms)
  exhausted: number;   // 10 frames delay (~167ms)
}

const reactionDelays: ReactionDelayEffect = {
  fresh: 0,
  normal: 2,
  tired: 5,
  exhausted: 10,
};

// Apply delay to player action execution
function executePlayerAction(
  player: Player,
  action: PlayerAction,
  gameState: GameState
): void {
  
  const reactionDelay = reactionDelays[player.stamina.fatigueLevel];
  
  // Queue the action for execution after delay
  player.actionQueue.push({
    action: action,
    executeAtFrame: gameState.frameNumber + reactionDelay,
  });
}

// Example: Fresh CM passes immediately (frame 100)
//          Exhausted CM passes 10 frames later (frame 110)
//          → Opponent has 10 frames to intercept = ~167ms = realistic!
```

**Effect 2: Max Acceleration**:

```typescript
// Tired players can't reach top speed as quickly

interface MaxAccelerationEffect {
  fresh: number;       // 100% of max acceleration (5.0 m/s²)
  normal: number;      // 90% of max (4.5 m/s²)
  tired: number;       // 70% of max (3.5 m/s²)
  exhausted: number;   // 50% of max (2.5 m/s²)
}

const maxAccelerationMultipliers: MaxAccelerationEffect = {
  fresh: 1.0,
  normal: 0.9,
  tired: 0.7,
  exhausted: 0.5,
};

// Apply to physics simulation
function calculatePlayerAcceleration(
  player: Player,
  desiredDirection: Vector3,
  gameState: GameState
): Vector3 {
  
  const baseAcceleration = 5.0;  // m/s²
  const fatigueMultiplier = maxAccelerationMultipliers[player.stamina.fatigueLevel];
  
  const actualAcceleration = baseAcceleration * fatigueMultiplier;
  
  return desiredDirection.normalize().multiply(actualAcceleration);
}

// Example: Fresh striker accelerates 5 m/s² (reaches 10 m/s in 2s)
//          Exhausted striker accelerates 2.5 m/s² (reaches 10 m/s in 4s)
//          → Exhausted defender has time to react and intercept
```

**Effect 3: Pressing Eligibility**:

```typescript
// Tired players can't respond to all pressing triggers

interface PressingEligibility {
  fresh: string[];      // Can respond to all triggers
  normal: string[];     // Can respond to most triggers
  tired: string[];      // Limited triggers
  exhausted: string[];  // Minimal triggers
}

const pressingEligibility: PressingEligibility = {
  fresh: ["bad_touch", "back_to_goal", "sideline_trap", "numerical_advantage"],
  normal: ["bad_touch", "back_to_goal", "sideline_trap"],        // Skip numerical
  tired: ["sideline_trap"],                                        // Only trap
  exhausted: [],                                                   // Can't press
};

// Apply in pressing system
function findValidPressers(
  team: Team,
  targetOpponent: Player,
  radius: number,
  priority: number,
  triggerType: string  // ← Add trigger type parameter
): Player[] {
  
  const valid: Player[] = [];
  
  for (const player of team.players) {
    // Check stamina eligibility for this trigger
    const eligibleTriggers = pressingEligibility[player.stamina.fatigueLevel];
    if (!eligibleTriggers.includes(triggerType)) {
      continue;  // Player too tired to respond to this trigger
    }
    
    // ... rest of validity checks (distance, position, priority)
    
    valid.push(player);
  }
  
  return valid;
}

// Example: Exhausted player can respond to sideline trap (desperate situation)
//          but can't respond to "bad first touch" (requires active pressing)
//          → Rewards tactics: tire out opponents, then exploit with pressing triggers
```

**Integration with Behavior Trees**:

```typescript
// Stamina affects how player behavior tree is evaluated

function evaluatePlayerBehavior(
  player: Player,
  gameState: GameState,
  teamTactics: TeamTactics,
  pressingSignals: PressSignal[]
): PlayerAction {
  
  // If exhausted, simplify behavior tree (less aggressive options)
  if (player.stamina.fatigueLevel === "exhausted") {
    return evaluateSimplifiedBehaviorTree(player, gameState, teamTactics);
  }
  
  // If tired, reduce risky options (no long sprints)
  if (player.stamina.fatigueLevel === "tired") {
    return evaluateConservativeBehaviorTree(player, gameState, teamTactics);
  }
  
  // Normal/fresh: full behavior tree options
  return evaluateFullBehaviorTree(player, gameState, teamTactics);
}

// Simplified tree for exhausted players (recovery focus)
function evaluateSimplifiedBehaviorTree(
  player: Player,
  gameState: GameState,
  teamTactics: TeamTactics
): PlayerAction {
  
  if (gameState.possession === "us") {
    // Exhausted: pass to nearest player, don't carry
    return {
      actionType: "recycle_possession",  // Safe pass
      targetPlayer: findNearestTeammate(player),
      priority: 50,
    };
  } else {
    // Exhausted: hold zone, don't press
    return {
      actionType: "hold_zone",
      targetPosition: player.formationAnchor,
      priority: 30,
    };
  }
}

// Conservative tree for tired players (avoid risky options)
function evaluateConservativeBehaviorTree(
  player: Player,
  gameState: GameState,
  teamTactics: TeamTactics
): PlayerAction {
  
  if (gameState.possession === "us") {
    if (hasPassingLane(player, gameState)) {
      return {
        actionType: "offerSupport",  // Move, but don't sprint
        targetPosition: bestSupportPosition(player, gameState),
        priority: 80,
      };
    } else {
      return {
        actionType: "hold_ball",     // Keep the ball, don't risk
        targetPosition: player.position,
        priority: 50,
      };
    }
  } else {
    // Tired: mark space, don't chase
    return {
      actionType: "cover_gaps",
      targetPosition: calculateDefensivePosition(player),
      priority: 60,
    };
  }
}
```

**Stamina and Match Dynamics**:

```typescript
// Stamina creates natural match narrative:

// Example progression:
// 0-20 min: All players fresh, fast-paced game
// 20-50 min: Stamina spreads unevenly (depends on tactics used)
//   - High pressing team: midfield tired, pressing triggers less effective
//   - Defensive team: defenders still fresh, harder to break down
// 50-70 min: Stamina differential evident
//   - Tired players have reaction delay → risky passes get intercepted
//   - Acceleration drop → dribbles slower, easier to defend
//   - Pressing collapse → best time to attack
// 70-90 min: Endurance matters
//   - Super-subs with fresh stamina > tired starters
//   - Single defender with fresh stamina worth 2 tired defenders
//   - Set pieces become critical (no sprinting required)

// Post-match analysis shows stamina progression:
// "Why did we concede at 78 minutes?"
// → "Your midfield was exhausted (stamina 25%), couldn't press triggers"
// → "Spend 50k on better conditioning or use rotation"
```

**Why This Works**:

1. ✅ **Fair**: No stat reduction (no "unfair" luck-based failures)
2. ✅ **Visible**: Player sees reaction delay and slow acceleration (understands why they failed)
3. ✅ **Tactical**: Rotation, conditioning, pacing matter
4. ✅ **Matches Real Football**: Tired players CAN still tackle/pass, just slower
5. ✅ **Deterministic**: Delays and multipliers are fixed, not random
6. ✅ **Legible**: All stamina effects logged and analyzable

### 2.1.8 Design Philosophy: What Makes This Feel Like Konami

Before defining the per-frame layers, it's critical to articulate what separates **intentional football** from **chaos that looks footballish**. The Layer 1 systems (Formation, Pressing, Stamina) embody four core principles inspired by Konami's football design philosophy (PES/eFootball):

#### Shape Over Chaos

**Konami Principle**: Teams have a coherent spatial shape that's *visible* and *predictable*, not random clusters of players chasing the ball.

**Our Implementation**:
- Formation anchors create a **spatial blueprint** (Layer 1 → Formation System)
- Anchors shift smoothly (not teleport), maintaining shape integrity
- Unit shapes compress/expand based on **logical triggers**, not randomness
- Visual result: You can watch a team's formation and predict where defenders will be

**Example**: 
```
4-2-3-1 formation with moderate pressing:
- CB pair maintains ~30m depth (you can see the defensive line)
- DM pivot stays ~10m ahead of CBs (predictable covering area)
- Midfield stretches/compresses as a block, not individual players scattering

vs. Chaos:
- Every player independently chases the ball
- No formation visible → no tactical identity
- Player positions unpredictable → feels random
```

#### Zones Over Randomness

**Konami Principle**: Decisions are based on **discrete game state** (zones, positions, triggers), not probability rolls that sometimes succeed and sometimes fail.

**Our Implementation**:
- Pressing triggered by **concrete conditions** (bad touch, back to goal, sideline position)
- Formation adjustment based on **ball location** (which zone is it in?)
- Pressing eligibility based on **stamina state** (fresh/normal/tired/exhausted)
- No hidden "70% chance to intercept" → interceptions happen because of **positioning and timing**

**Example**:
```
Konami Way (Ours):
"Ball is in zone 14 AND winger is isolated → fullback overlaps"
"Opponent has bad first touch (quality < 40) → trigger press (radius 15m)"
Outcome: Overlap happens. Press responds. Visible, understandable.

Chaos Way:
"Random (0–100) < pressingChance → maybe press, maybe don't"
Outcome: Sometimes opponent is pressed, sometimes not. Feels unfair/lucky.
```

#### Intent Over Animation Spam

**Konami Principle**: Player **decisions drive animations**, not the other way around. One decision = one meaningful action, not a cascade of micro-animations with unclear purpose.

**Our Implementation**:
- Player behavior trees output **intent** (action type + target) not micro-movements
- Animations are selected to match intent, not interrupt/override intent
- Stamina affects **timing** (reaction delay), not animation quality
- Pressing players move toward a **position** (sideline trap), not just "press animation"

**Example**:
```
Konami Way (Ours):
1. CM decides "offer support" → move to anchor + 3m forward
2. Engine selects "support_run" animation
3. Player accelerates toward that position
One decision, one animation, one outcome.

Chaos Way:
1. CM triggers 3–4 small animations (turn, step, acceleration)
2. Camera cuts interrupt view
3. By the time animations finish, ball has moved (decisions are stale)
Purpose unclear, outcome looks scripted.
```

#### Football Logic Before Spectacle

**Konami Principle**: **Tactical cause-and-effect** is the core appeal, not spectacular dribbles or lucky bounces.

**Our Implementation**:
- High pressing costs stamina (tire out the team)
- Good positioning creates pressing opportunities
- Fatigue creates predictable weaknesses (slow reactions, low acceleration)
- Formation anchors mean "tight defense" is actually tight (no magic blocks)
- Ball physics match player action intensity (hard kick = risky long ball)

**Example**:
```
Konami Narrative:
"I pressed hard for 40 minutes. Their midfield is exhausted (stamina 30%).
At 65', I attacked down the wing. My winger was fresh, theirs was tired.
Their tired defender couldn't accelerate fast enough → I got past him.
Scored. Tactical victory."

vs. Spectacle Narrative:
"I pressed. RNG gave me a 70% interception chance. I got lucky.
Then I did a flashy dribble animation (that breaks physics).
Somehow scored despite 3 defenders nearby.
Lucky, not smart."
```

#### How Layer 1 Embodies These Principles

| Principle | Implementation | Result |
|-----------|----------------|--------|
| **Shape** | Formation anchors + unit compression | Coherent, visible team shape |
| **Zones** | Pressing triggers, stamina states, ball zones | Deterministic, understandable decisions |
| **Intent** | Behavior trees → actions, stamina → timing | Clear cause-effect, no animation spam |
| **Logic** | Fatigue, positioning, physics match tactics | Tactical skill > luck |

---

### 2.2 Layer 2: Unit Shape Logic (Dynamic Adjustments)

**Purpose**: Frame-by-frame decisions (pass/shoot/move) constrained by Layer 1.

**Update Frequency**: Every frame (60fps = 5,400 times/match)

**Responsibility**:
- Which player moves where
- Pressing trigger (do we press this pass?)
- Possession action (pass/dribble/shoot)
- Movement intensity (how urgent is the action?)

**Constraints from Layer 1**:
- lineHeight determines max defensive line position
- pressingIntensity determines how aggressively we challenge
- buildUpStyle determines available pass targets
- tempo determines decision urgency

**Data Structure**:

```typescript
// Game field divided into zones for trigger detection
interface PitchZone {
  zoneId: number;        // 1-14 (standard zones: 6 defensive, 8 middle, 14 attacking)
  center: Vector2;
  radius: number;
}

// Unit shape definition
interface UnitShape {
  unitName: enum;        // "back_line" | "midfield" | "front_line"
  
  // Player positions within unit (relative to team formation)
  players: Player[];
  
  // Compactness: horizontal spacing between players
  horizontalCompactness: number;  // 0–100 (0=spread wide, 100=tightly packed)
  
  // Vertical spacing: distance between units
  verticalSpacing: number;        // 0–100 (0=detached, 100=tight formation)
  
  // Pivot point for the unit's shape
  pivot: Vector3;
}

// Trigger rules: determine when unit shape changes
interface UnitShapeTrigger {
  triggerId: string;
  condition: TriggerCondition;    // Boolean expression
  targetUnit: UnitShape;
  adjustment: ShapeAdjustment;    // What changes
  transitionTime: number;         // Frames to apply change (smoothing)
}

// Conditions are deterministic and zone-based
type TriggerCondition = {
  ballInZone?: number[];          // "If ball in zone 14 or 13"
  playerIsolated?: string;        // "If winger has no passing option"
  formationMismatch?: boolean;    // "If opponent has more central players"
  pressureDetected?: boolean;     // "If pressed by 2+ players"
  scoreState?: "behind" | "equal" | "ahead";
  timeState?: "early" | "midgame" | "late";
};

// What changes when trigger fires
interface ShapeAdjustment {
  deltaHorizontalCompactness?: number;   // e.g., +15 (tighten)
  deltaVerticalSpacing?: number;         // e.g., -10 (compress)
  newPivot?: Vector3;                    // Optional: shift formation anchor
  affectPlayerSubset?: string[];         // Optional: only certain players move
}
```

**Layer 2 Trigger Logic Examples**:

```typescript
// Example 1: Ball enters attacking zone → midfield compresses
const midTightenTrigger: UnitShapeTrigger = {
  triggerId: "ball_zone14_midfield_compress",
  condition: {
    ballInZone: [13, 14],  // Attacking zones (rightmost 2 zones)
  },
  targetUnit: middlefieldUnit,
  adjustment: {
    deltaHorizontalCompactness: +20,  // Tighten horizontally
    deltaVerticalSpacing: -5,         // Compress vertically
    transitionTime: 8,                // 8 frames (~133ms at 60fps)
  },
};

// Example 2: Winger isolated → fullback overlaps
const wingOverlapTrigger: UnitShapeTrigger = {
  triggerId: "isolated_winger_fullback_overlap",
  condition: {
    playerIsolated: "right_winger",  // Winger has no passing option
  },
  targetUnit: backlineUnit,
  adjustment: {
    deltaHorizontalCompactness: -15,  // Spread horizontally
    newPivot: rightWingerPosition,    // Pivot shape toward isolated player
    affectPlayerSubset: ["right_fullback"],  // Only fullback moves
    transitionTime: 12,
  },
};

// Example 3: Losing match with 10 minutes left → defensive setup tightens
const injuryTimeDefensiveTrigger: UnitShapeTrigger = {
  triggerId: "losing_injurytime_defensive",
  condition: {
    scoreState: "behind",
    timeState: "late",
  },
  targetUnit: backlineUnit,
  adjustment: {
    deltaHorizontalCompactness: +30,  // Very tight
    deltaVerticalSpacing: +15,        // Spread out vertically (deep setup)
    transitionTime: 60,               // Gradual transition (1 second)
  },
};

// Example 4: Opponent has numerical advantage in midfield → compress
const numericalDisadvantageTrigger: UnitShapeTrigger = {
  triggerId: "opponent_midfield_dominance_compress",
  condition: {
    formationMismatch: true,          // Calculated from formations
  },
  targetUnit: middlefieldUnit,
  adjustment: {
    deltaHorizontalCompactness: +25,
    deltaVerticalSpacing: 0,
    transitionTime: 30,
  },
};
```

**Layer 2 Evaluation Loop (Every Frame)**:

```typescript
function updateUnitShapes(
  gameState: GameState,
  teamTactics: TeamTactics,  // ← Layer 1 constraint
  currentShapes: UnitShape[]
): UnitShape[] {
  
  const triggers = buildTriggerSet(teamTactics); // Derived from Layer 1
  const newShapes = [...currentShapes];          // Copy current shapes
  
  // Evaluate all triggers deterministically (boolean checks only)
  for (const trigger of triggers) {
    if (evaluateCondition(trigger.condition, gameState)) {
      // This trigger fires
      const targetUnitIndex = newShapes.findIndex(
        u => u.unitName === trigger.targetUnit.unitName
      );
      
      if (targetUnitIndex !== -1) {
        // Apply adjustment smoothly
        newShapes[targetUnitIndex] = applyShapeAdjustment(
          newShapes[targetUnitIndex],
          trigger.adjustment,
          trigger.transitionTime
        );
      }
    }
  }
  
  return newShapes;
}

// Deterministic condition evaluation
function evaluateCondition(
  condition: TriggerCondition,
  gameState: GameState
): boolean {
  
  // All checks are deterministic (no RNG)
  let result = true;
  
  if (condition.ballInZone !== undefined) {
    const ballZone = getPitchZone(gameState.ballPosition);
    result = result && condition.ballInZone.includes(ballZone);
  }
  
  if (condition.playerIsolated !== undefined) {
    const player = findPlayer(gameState, condition.playerIsolated);
    const hasPassOption = countPassOptions(player, gameState) > 0;
    result = result && !hasPassOption;  // Isolated = no options
  }
  
  if (condition.formationMismatch !== undefined) {
    const ourCentralDensity = countCentralPlayers(gameState, "us");
    const theirCentralDensity = countCentralPlayers(gameState, "them");
    result = result && (theirCentralDensity > ourCentralDensity);
  }
  
  if (condition.scoreState !== undefined) {
    const currentScore = gameState.score;
    const expected = condition.scoreState === "behind" ? currentScore.them > currentScore.us :
                     condition.scoreState === "equal"  ? currentScore.them === currentScore.us :
                     currentScore.them < currentScore.us;
    result = result && expected;
  }
  
  if (condition.timeState !== undefined) {
    const remainingTime = gameState.totalTime - gameState.elapsedTime;
    const isEarly = remainingTime > 2700;   // > 45 minutes
    const isLate = remainingTime < 900;     // < 15 minutes
    const expected = condition.timeState === "early" ? isEarly :
                     condition.timeState === "late"  ? isLate :
                     !isEarly && !isLate;
    result = result && expected;
  }
  
  return result;
}

// Smooth shape transitions
function applyShapeAdjustment(
  currentShape: UnitShape,
  adjustment: ShapeAdjustment,
  transitionFrames: number
): UnitShape {
  
  const deltaPerFrame = {
    compactness: (adjustment.deltaHorizontalCompactness ?? 0) / transitionFrames,
    spacing: (adjustment.deltaVerticalSpacing ?? 0) / transitionFrames,
  };
  
  return {
    ...currentShape,
    horizontalCompactness: Math.min(100, Math.max(0, 
      currentShape.horizontalCompactness + deltaPerFrame.compactness
    )),
    verticalSpacing: Math.min(100, Math.max(0,
      currentShape.verticalSpacing + deltaPerFrame.spacing
    )),
    pivot: adjustment.newPivot ?? currentShape.pivot,
  };
}
```

**How Layer 1 Constrains Layer 2**:

```typescript
function buildTriggerSet(teamTactics: TeamTactics): UnitShapeTrigger[] {
  // Layer 1 (TeamTactics) determines which triggers are active
  
  const triggers: UnitShapeTrigger[] = [];
  
  // High pressing teams get aggressive triggers
  if (teamTactics.pressingIntensity > 70) {
    triggers.push(ballZone14MidfieldCompressTrigger);
    triggers.push(wingOverlapTrigger);
    triggers.push(pressureDetectedTrigger);
  }
  
  // Deep defensive teams get defensive triggers
  if (teamTactics.lineHeight < 40) {
    triggers.push(injuryTimeDefensiveTrigger);
    triggers.push(numericalDisadvantageTrigger);
  }
  
  // Wide formations get wing support triggers
  if (teamTactics.lineWidth > 75) {
    triggers.push(wingOverlapTrigger);  // More responsive
  }
  
  return triggers;
}
```

**Why This Is Deterministic**:

1. **No RNG**: All conditions are boolean checks (ball in zone? player isolated?)
2. **Zone-Based**: Game state divided into discrete zones (no floating-point edge cases)
3. **Boolean Logic**: Conditions are true/false, deterministically evaluable
4. **Seed Independence**: Triggers depend only on game state, not random seeds
5. **Reproducible**: Same game state = same triggers fire = same shape adjustments

**Constraints**:

1. horizontalCompactness and verticalSpacing are clamped [0–100]
2. Transitions are smooth (gradual over N frames, not instant)
3. All triggers derived from Layer 1 (formation/pressing/tempo)
4. No conflicting triggers (trigger priority system if needed)

### 2.3 Layer 3: Player Role Behavior Trees (Decision Making)

**Purpose**: Each player position makes decisions based on a finite, deterministic behavior tree. No ML, no random branching—only priority ordering.

**Why Not ML?**
1. **Determinism**: ML outputs are probabilistic, can't guarantee same input = same output
2. **Legibility**: Player can't debug why an ML model chose something
3. **Replayability**: Behavior trees can be exactly replayed; ML models drift with hardware
4. **Audit-ability**: Server can verify every decision matches the tree

**Update Frequency**: Every frame, per player

**Behavior Tree Structure**:

```typescript
type BehaviorNode = DecisionNode | ActionNode | CompositeNode;

interface DecisionNode {
  type: "decision";
  condition: () => boolean;  // Pure function, no RNG, no state
  trueBranch: BehaviorNode;
  falseBranch: BehaviorNode;
}

interface ActionNode {
  type: "action";
  action: PlayerAction;  // Pass, shoot, move, tackle, etc.
  priority: number;      // For tie-breaking
}

interface CompositeNode {
  type: "composite";
  operator: "sequence" | "selector";  // Sequence: all must succeed; Selector: first success wins
  children: BehaviorNode[];
}

// Player action (output of behavior tree)
interface PlayerAction {
  actionType: enum;  // "offer_support" | "carry_ball" | "recycle_possession" | "step_up" | "hold_zone" | "press" | "cover" | etc.
  targetPosition?: Vector3;
  targetPlayer?: Player;
  priority: number;  // Used for tie-breaking deterministically
}
```

**Example: Central Midfielder (CM) Behavior Tree**:

```typescript
const cmBehaviorTree: BehaviorNode = {
  type: "composite",
  operator: "selector",  // First matching condition wins
  children: [
    {
      type: "decision",
      condition: () => gameState.possession === "us",  // Team in possession
      trueBranch: {
        type: "composite",
        operator: "selector",
        children: [
          // Priority 1: If passing lane open → offer support
          {
            type: "decision",
            condition: () => hasPassingLane(cmPlayer, gameState),
            trueBranch: {
              type: "action",
              action: {
                actionType: "offer_support",
                targetPosition: bestSupportPosition(cmPlayer, gameState),
                priority: 100,  // Highest priority
              },
            },
          },
          // Priority 2: If space ahead → carry ball
          {
            type: "decision",
            condition: () => hasSpaceAhead(cmPlayer, gameState),
            trueBranch: {
              type: "action",
              action: {
                actionType: "carry_ball",
                targetPosition: spaceAhead(cmPlayer, gameState),
                priority: 80,
              },
            },
          },
          // Priority 3: Else → recycle possession
          {
            type: "action",
            action: {
              actionType: "recycle_possession",
              targetPlayer: findBackwardPassTarget(cmPlayer, gameState),
              priority: 50,
            },
          },
        ],
      },
      falseBranch: {
        type: "composite",
        operator: "selector",
        children: [
          // Team out of possession
          // Priority 1: If pressing trigger → step up
          {
            type: "decision",
            condition: () => shouldPress(cmPlayer, gameState, teamTactics),
            trueBranch: {
              type: "action",
              action: {
                actionType: "step_up",
                targetPosition: pressedTarget(cmPlayer, gameState),
                priority: 90,
              },
            },
          },
          // Priority 2: Else → hold zone
          {
            type: "action",
            action: {
              actionType: "hold_zone",
              targetPosition: defZoneAnchor(cmPlayer, teamShape),
              priority: 40,
            },
          },
        ],
      },
    },
  ],
};
```

**Behavior Trees for All Positions**:

```typescript
interface PositionBehavior {
  position: enum;  // "CB" | "LB" | "RB" | "CDM" | "CM" | "CAM" | "LW" | "RW" | "ST" | etc.
  tree: BehaviorNode;
}

const positionBehaviors: PositionBehavior[] = [
  // Defensive positions
  {
    position: "CB",
    tree: {
      type: "composite",
      operator: "selector",
      children: [
        {
          type: "decision",
          condition: () => isBallNear(cb, gameState, 20),  // Within 20m
          trueBranch: { type: "action", action: { actionType: "cover_ball", priority: 100 } },
        },
        {
          type: "decision",
          condition: () => isOpponentRunning(cb, gameState),
          trueBranch: { type: "action", action: { actionType: "track_player", priority: 90 } },
        },
        { type: "action", action: { actionType: "hold_line", priority: 50 } },
      ],
    },
  },
  {
    position: "LB",
    tree: {
      type: "composite",
      operator: "selector",
      children: [
        {
          type: "decision",
          condition: () => gameState.possession === "us",
          trueBranch: {
            type: "composite",
            operator: "selector",
            children: [
              {
                type: "decision",
                condition: () => isWingerIsolated(leftWinger, gameState),
                trueBranch: { type: "action", action: { actionType: "overlap", priority: 95 } },
              },
              { type: "action", action: { actionType: "support_midfield", priority: 60 } },
            ],
          },
          falseBranch: {
            type: "composite",
            operator: "selector",
            children: [
              {
                type: "decision",
                condition: () => shouldPress(lb, gameState, teamTactics),
                trueBranch: { type: "action", action: { actionType: "press_winger", priority: 85 } },
              },
              { type: "action", action: { actionType: "hold_zone", priority: 45 } },
            ],
          },
        },
      ],
    },
  },
  // Midfield positions
  {
    position: "CDM",
    tree: {
      type: "composite",
      operator: "selector",
      children: [
        {
          type: "decision",
          condition: () => gameState.possession === "us",
          trueBranch: {
            type: "composite",
            operator: "selector",
            children: [
              {
                type: "decision",
                condition: () => hasPassingLane(cdm, gameState),
                trueBranch: { type: "action", action: { actionType: "distribute", priority: 100 } },
              },
              { type: "action", action: { actionType: "hold_ball", priority: 55 } },
            ],
          },
          falseBranch: {
            type: "composite",
            operator: "selector",
            children: [
              {
                type: "decision",
                condition: () => isBallNear(cdm, gameState, 15),
                trueBranch: { type: "action", action: { actionType: "tackle_press", priority: 100 } },
              },
              { type: "action", action: { actionType: "cover_gaps", priority: 70 } },
            ],
          },
        },
      ],
    },
  },
  // Attacking positions
  {
    position: "ST",
    tree: {
      type: "composite",
      operator: "selector",
      children: [
        {
          type: "decision",
          condition: () => gameState.possession === "us",
          trueBranch: {
            type: "composite",
            operator: "selector",
            children: [
              {
                type: "decision",
                condition: () => isClear(st, gameState),
                trueBranch: { type: "action", action: { actionType: "make_space", priority: 100 } },
              },
              {
                type: "decision",
                condition: () => canShoot(st, gameState),
                trueBranch: { type: "action", action: { actionType: "shoot", priority: 95 } },
              },
              { type: "action", action: { actionType: "hold_up_play", priority: 60 } },
            ],
          },
          falseBranch: {
            type: "composite",
            operator: "selector",
            children: [
              {
                type: "decision",
                condition: () => shouldPress(st, gameState, teamTactics),
                trueBranch: { type: "action", action: { actionType: "press_defender", priority: 90 } },
              },
              { type: "action", action: { actionType: "cover_striker_space", priority: 50 } },
            ],
          },
        },
      ],
    },
  },
];
```

**Evaluation (Every Frame, Per Player)**:

```typescript
function evaluatePlayerBehavior(
  player: Player,
  gameState: GameState,
  teamTactics: TeamTactics,
  teamShape: UnitShape[]
): PlayerAction {
  
  const behavior = positionBehaviors.find(b => b.position === player.position);
  if (!behavior) return defaultAction(player);
  
  // Traverse tree until action node found
  return evaluateNode(behavior.tree, player, gameState, teamTactics, teamShape);
}

function evaluateNode(
  node: BehaviorNode,
  player: Player,
  gameState: GameState,
  teamTactics: TeamTactics,
  teamShape: UnitShape[]
): PlayerAction {
  
  switch (node.type) {
    case "decision":
      const conditionMet = node.condition();
      const nextNode = conditionMet ? node.trueBranch : node.falseBranch;
      return evaluateNode(nextNode, player, gameState, teamTactics, teamShape);
    
    case "action":
      return node.action;
    
    case "composite":
      if (node.operator === "selector") {
        // First successful child wins (priority ordering)
        for (const child of node.children) {
          const action = evaluateNode(child, player, gameState, teamTactics, teamShape);
          if (action && action.priority > 0) {
            return action;
          }
        }
      } else if (node.operator === "sequence") {
        // All children must evaluate to actions
        let combinedAction: PlayerAction = { actionType: "noop", priority: 0 };
        for (const child of node.children) {
          const action = evaluateNode(child, player, gameState, teamTactics, teamShape);
          if (!action) return { actionType: "noop", priority: 0 };
          combinedAction = mergeActions(combinedAction, action);
        }
        return combinedAction;
      }
      break;
  }
  
  return { actionType: "noop", priority: 0 };
}
```

**Determinism Guarantee**:

```typescript
function evaluatePlayerDecisions(
  gameState: GameState,
  teamTactics: TeamTactics,
  seed: string
): Map<string, PlayerAction> {
  
  const decisions = new Map<string, PlayerAction>();
  
  for (const player of gameState.allPlayers) {
    // Determinism: same player + same game state → same action
    const action = evaluatePlayerBehavior(
      player,
      gameState,
      teamTactics,
      teamShape
    );
    
    // If tie-breaking needed (multiple actions same priority),
    // use seed-based selection (deterministic)
    decisions.set(player.id, resolveTiebreak(action, seed, player.id));
  }
  
  return decisions;
}

// Deterministic tie-break (not RNG)
function resolveTiebreak(
  action: PlayerAction,
  seed: string,
  playerId: string
): PlayerAction {
  // Use hash of (seed + playerId) to select consistently
  const hash = hashSeed(seed + playerId);
  action.priority = (action.priority * 1000) + (hash % 1000);
  return action;
}
```

**Key Rules** (Non-Negotiable):

1. ✅ **No Random Branching**: Only priority ordering
2. ✅ **Finite Trees**: Each position has 5–10 possible actions max
3. ✅ **Deterministic Conditions**: All checks are boolean (no probability)
4. ✅ **No State Leakage**: Conditions only use gameState, never random state
5. ✅ **Priority Ordering**: Ties broken deterministically by seed
6. ✅ **Debuggable**: Tree structure can be visualized and traced

### 2.4 Layer 4: Animation & Physical Application (Execution)

**Purpose**: Translate tactical decisions (player actions) into character animations, physics, and ball movement.

**Update Frequency**: Every frame (driven by Layer 3 outputs)

**Responsibility**:
- Animation selection (which run/pass/tackle animation matches the action?)
- Physics intensity (how hard do we kick the ball?)
- Movement timing (how quickly do we move to decision point?)

**Constraints from Layers 1-3**:
- Animation selection respects player role (from Layer 1)
- Physics respects decision outcome (from Layer 3)

**Placeholder**: Layer 4 will be specified separately.

### 2.5 Layer 5: Feedback & Event Generation (Verification)

**Purpose**: Log all decisions and outcomes for legibility, verification, and replay.

**Update Frequency**: Every frame (captures Layers 1-3 outputs)

**Responsibility**:
- Decision logging (why was this decision made?)
- Event generation (what happened as a result?)
- Server signature (sign the outcome)
- Determinism verification (can this be reproduced?)

**Placeholder**: Layer 4 will be specified separately.

### 2.6 Layer Update Flow Diagram (Complete)

```
Pre-Match or Event Triggers
  ↓
Layer 1: TeamTactics updated (formation, pressing, tempo, etc.)
  ↓
Formation System: Calculate formation anchors based on ball location & tactics
  ├─ Anchors shift (ball position → forward/back)
  ├─ Compression applied (lineHeight, pressingIntensity, lineWidth → compact/expand)
  └─ Current formation state: anchors + deviations capped
  ↓
Every Frame:
  ├─ Layer 2: Unit shapes updated (midfield compresses, fullback overlaps, etc.)
  ├─ Layer 3: Player behavior trees evaluated (each player decides action)
  ├─ Layer 4: Animations/physics applied (decision + anchor → movement)
  ├─ Layer 5: Events logged & signed (why it happened, server verification)
  └─ State advanced to next frame
  ↓
Replay Verification: Re-run Formation System + Layers 2-5 with same Layer 1 + seed
```

**Data Flow Example** (Ball enters zone 14, 4-2-3-1 formation):

```
Layer 1 (Static): formation=4-2-3-1, pressingIntensity=35
  ↓
Formation System:
  - Ball in attacking half → shift anchors forward +8m
  - pressingIntensity 35 (moderate) → compress formation slightly
  - Result: CM anchor moves from (−15, 5) to (−13, 10)
  ↓
Layer 2 (Trigger): ballInZone(14) → unit shapes adjust compactness
  ↓
Layer 3 (Decision): CM evaluates tree with new anchor position:
  IF possession → IF passingLane → offerSupport (priority 100)
  ↓
Layer 4 (Animation): CM action "offerSupport" → play "support_run" animation
  → Target position: anchor (−13, 10) + deviation (+2, 0) = (−11, 10)
  ↓
Layer 5 (Logging): logged: "CM pressed into zone 14, chose support, moved to (−11, 10)"
  ↓
Replay: Replay verifier runs Formation System + Layers 2-5 with seed, confirms identical outcome
```

---

## 3. Deterministic Football Physics

**Critical Foundation**: This is where most Web3 games fail—they ship with physics that can't be verified or replayed. We won't.

### 3.1 Determinism-First Physics Rules

**Physics must obey**:

```typescript
// Core requirements for deterministic physics

interface DeterministicPhysicsRequirements {
  // 1. Fixed timestep (no variable framerate)
  fixedTimestepMs: 16.67;  // 60 ticks/sec, exactly
  
  // 2. No floating point drift
  // - Always round to fixed precision (e.g., mm precision)
  // - Use integer math where possible
  // - Never accumulate floating point errors across frames
  
  // 3. Seeded pseudo-randomness only
  // - Physics "noise" comes from deterministic seeded RNG
  // - Same seed always produces same noise
  // - Example: ball friction varies ±5%, but deterministically
  
  // 4. NO dependencies on:
  // - Client framerate (60fps vs 120fps must produce same physics)
  // - Local physics solvers (Unity vs Unreal must produce same physics)
  // - Non-seeded randomness (Math.random() is forbidden)
  // - Floating point precision (x86 vs ARM CPU must produce same physics)
}
```

**The Right Way**:

```typescript
// Fixed timestep simulation (REQUIRED for determinism)
function simulatePhysicsFrame(
  gameState: GameState,
  input: PlayerInput,
  seed: string
): GameState {
  
  // 1. Use EXACTLY 16.67ms per frame (60 ticks/sec)
  // 2. No variable timesteps, no "catch-up" logic
  // 3. Physics solver always runs the same code path
  
  const deltaTime = 1.0 / 60.0;  // Always 16.67ms
  
  // Apply forces (gravity, friction, etc.)
  const newVelocity = applyForces(
    gameState.ballVelocity,
    deltaTime,
    seed  // ← Seeded variance, not random
  );
  
  // Update position
  const newPosition = gameState.ballPosition.add(
    newVelocity.multiply(deltaTime)
  );
  
  // Collision detection (deterministic)
  const postCollisionPos = handleCollisions(newPosition, gameState);
  
  return {
    ballPosition: postCollisionPos,
    ballVelocity: newVelocity,
    // ...
  };
}

// Forces with seeded variance (NOT randomness)
function applyForces(
  velocity: Vector3,
  deltaTime: number,
  seed: string
): Vector3 {
  
  // Base friction coefficient
  const baseFriction = 0.98;
  
  // Seeded variance (±5%, deterministic)
  const rng = new SeededRandom(seed);
  const frictionVariance = rng.nextFloat(-0.05, 0.05);
  const actualFriction = baseFriction + frictionVariance;
  
  // Apply friction
  const friction = velocity.multiply(actualFriction);
  
  // Apply gravity
  const gravity = new Vector3(0, -9.81 * deltaTime, 0);
  
  // Result: same seed = same forces
  return friction.add(gravity);
}
```

**The Wrong Way** (What NOT to do):

```typescript
// ❌ WRONG: Variable timestep (framerate-dependent)
function updatePhysics(deltaTime: number) {
  // If client runs at 60fps: deltaTime = 16.67ms
  // If client runs at 120fps: deltaTime = 8.33ms
  // DIFFERENT PHYSICS!
}

// ❌ WRONG: Using floating point without rounding
const ballPos = {x: 10.123456789, y: 20.987654321, z: 5.555555};
// After 100 frames, accumulates floating point errors
// Different CPU architectures produce different errors

// ❌ WRONG: Non-seeded randomness
if (Math.random() < 0.7) {
  // Ball bounces. But Math.random() is different every run.
  // Replay gets different bounce. UNREPLAYABLE.
}

// ❌ WRONG: Relying on local physics engine
// "Let Unity/Unreal's physics solver handle it"
// Different engines, different solvers = different results
```

### 3.2 Fixed-Point Math Implementation

**Avoid floating-point drift** by using fixed-point or integer math:

```typescript
// Ball position in millimeters (integer)
interface BallStateFixed {
  posX_mm: number;      // Integer, no floating point
  posY_mm: number;
  posZ_mm: number;
  
  velX_mm_per_frame: number;  // Velocity in mm/frame
  velY_mm_per_frame: number;
  velZ_mm_per_frame: number;
}

// Simulation with integer math
function simulatePhysicsFrameFixed(
  state: BallStateFixed,
  seed: string
): BallStateFixed {
  
  // All calculations in integers (no floating point)
  const rng = new SeededRandom(seed);
  
  // Friction: 0.98 in fixed-point = 980/1000
  const frictionVariance = rng.nextInt(-50, 50);  // ±0.05 in fixed-point
  const friction = (980 + frictionVariance) / 1000;
  
  // Apply friction to velocity
  const newVelX = Math.floor((state.velX_mm_per_frame * friction));
  const newVelY = Math.floor((state.velY_mm_per_frame * friction));
  const newVelZ = Math.floor((state.velZ_mm_per_frame * friction));
  
  // Gravity: 9.81 m/s² = 9810 mm/s² per frame squared
  const gravityAccel_mm_per_frame = 163;  // 9810 * (16.67ms)^2 / 1000
  const newVelY_gravity = newVelY - gravityAccel_mm_per_frame;
  
  // Update position
  const newPosX = state.posX_mm + newVelX;
  const newPosY = state.posY_mm + newVelY_gravity;
  const newPosZ = state.posZ_mm + newVelZ;
  
  // All integers, zero floating point errors
  return {
    posX_mm: newPosX,
    posY_mm: newPosY,
    posZ_mm: newPosZ,
    velX_mm_per_frame: newVelX,
    velY_mm_per_frame: newVelY_gravity,
    velZ_mm_per_frame: newVelZ,
  };
}

// Convert to floats for rendering (only, never for logic)
function convertToRenderPosition(state: BallStateFixed): Vector3 {
  return new Vector3(
    state.posX_mm / 1000,  // mm to meters
    state.posY_mm / 1000,
    state.posZ_mm / 1000
  );
}
```

### 3.3 Collision Detection (Deterministic)

**Player-ball collisions must be deterministic**:

```typescript
interface CollisionResult {
  occurred: boolean;
  collidingPlayer: Player;
  contactPoint: Vector3;
  impulse: Vector3;  // Deterministic from seed
}

function detectCollision(
  ballState: BallStateFixed,
  players: Player[],
  seed: string
): CollisionResult | null {
  
  const rng = new SeededRandom(seed);
  
  // Check each player (in fixed order for determinism)
  const sortedPlayers = players.sort((a, b) => a.id.localeCompare(b.id));
  
  for (const player of sortedPlayers) {
    const distance = calculateDistance(ballState, player);
    
    // Collision radius: player size ~1m
    if (distance < 1.0) {
      // Determine contact point (deterministic from positions)
      const contactPoint = determineContactPoint(ballState, player);
      
      // Calculate impulse based on:
      // - Player velocity direction
      // - Player "force" (based on action)
      // - Seed-based variance (±10%)
      
      const baseImpulse = calculateBaseImpulse(player, ballState);
      const impulseVariance = rng.nextFloat(-0.1, 0.1);
      const actualImpulse = baseImpulse.multiply(1 + impulseVariance);
      
      return {
        occurred: true,
        collidingPlayer: player,
        contactPoint,
        impulse: actualImpulse,
      };
    }
  }
  
  return null;
}

// Deterministic player ordering (CRITICAL)
function sortPlayersForCollision(players: Player[]): Player[] {
  // Always sort by ID (ensures same order every time)
  return players.sort((a, b) => a.id.localeCompare(b.id));
}
```

### 3.4 Verification: Physics Determinism Test

**How to verify physics are truly deterministic**:

```typescript
// Run same initial state + seed twice, verify results are identical

async function verifyPhysicsDeterminism(): Promise<boolean> {
  
  const initialState: BallStateFixed = {
    posX_mm: 5000,
    posY_mm: 5000,
    posZ_mm: 0,
    velX_mm_per_frame: 100,
    velY_mm_per_frame: 50,
    velZ_mm_per_frame: 0,
  };
  
  const seed = "test_seed_12345";
  const numFrames = 1000;
  
  // Simulation 1
  let state1 = initialState;
  for (let i = 0; i < numFrames; i++) {
    state1 = simulatePhysicsFrameFixed(state1, seed + i.toString());
  }
  
  // Simulation 2 (same initial conditions, same seed)
  let state2 = initialState;
  for (let i = 0; i < numFrames; i++) {
    state2 = simulatePhysicsFrameFixed(state2, seed + i.toString());
  }
  
  // Verify identical (bit-for-bit)
  const match = (
    state1.posX_mm === state2.posX_mm &&
    state1.posY_mm === state2.posY_mm &&
    state1.posZ_mm === state2.posZ_mm &&
    state1.velX_mm_per_frame === state2.velX_mm_per_frame &&
    state1.velY_mm_per_frame === state2.velY_mm_per_frame &&
    state1.velZ_mm_per_frame === state2.velZ_mm_per_frame
  );
  
  if (!match) {
    console.error("Physics are NOT deterministic!");
    console.log("Run 1:", state1);
    console.log("Run 2:", state2);
    return false;
  }
  
  console.log("✓ Physics are deterministic");
  return true;
}
```

### 3.5 Platform Independence

**Ensure physics are identical across all platforms** (PC, mobile, console):

```typescript
// All physics calculations use the exact same code
// No platform-specific physics engines

// ❌ WRONG:
// function updateBall() {
//   if (platform === "Unity") {
//     ballRigidbody.velocity = ...;  // Unity solver
//   } else if (platform === "Unreal") {
//     ballPhysics.applyForce(...);   // Unreal solver
//   }
// }
// Different solvers = different physics

// ✓ RIGHT:
// Single physics simulation code that runs everywhere
function updateBallUniversal(
  state: BallStateFixed,
  input: PlayerInput,
  seed: string
): BallStateFixed {
  
  // Same code on all platforms
  // All integer math
  // Single implementation
  
  return simulatePhysicsFrameFixed(state, seed);
}

// Platform code only handles rendering, not simulation
function renderBall(state: BallStateFixed): void {
  const renderPos = convertToRenderPosition(state);
  
  // Draw at renderPos (platform-specific renderer)
  if (platform === "Unity") {
    ballGameObject.transform.position = renderPos;
  } else if (platform === "Unreal") {
    ballActor->SetActorLocation(renderPos);
  }
}
```

### 3.6 Why This Matters for Web3

**Deterministic physics = verifiable replays = trustless gameplay**:

```
Traditional FIFA/PES:
Player A: "I kicked harder, should've scored"
Developer: "Our RNG determined the shot direction. Deal with it."
No way to verify.

Bass Ball (Web3):
Player A: "I kicked harder, should've scored"
Player B: "Run the replay with the same seed. The physics must match."
Replay verifier re-simulates → physics match exactly.
Cause-effect is provable.
```

**The Stack**:
```
Layer 1: Tactics (Formation, Pressing, Stamina) ← Deterministic triggers
  ↓
Layer 2–3: Player Decisions ← Deterministic behavior trees
  ↓
Layer 4: Animations ← Driven by decisions
  ↓
Physics Simulation ← Fixed-point math, seeded variance
  ↓
Collision Results ← Deterministic outcomes
  ↓
Replay Verification ← Re-run entire stack with same seed, verify match
```

### 3.7 Ball Model: Core Entity

**Purpose**: The ball is a distinct entity with its own physics state. It's not a simple visual effect—it's the core of the simulation.

**Ball Entity Definition**:

```typescript
interface Ball {
  // Position (3D, in millimeters for precision)
  posX_mm: number;
  posY_mm: number;  // Height above ground
  posZ_mm: number;
  
  // Velocity (mm/frame)
  velX_mm_per_frame: number;
  velY_mm_per_frame: number;
  velZ_mm_per_frame: number;
  
  // Spin (rotation around vertical axis)
  spinRadians: number;        // Rotation angle
  spinDecayPerFrame: number;  // How quickly spin fades
  
  // State tracking
  isGrounded: boolean;        // In contact with pitch?
  contactPlayer: Player | null;  // Who last touched the ball?
  lastContactFrame: number;   // When was it last touched?
}

// Initialize ball at center of pitch
function initializeBall(): Ball {
  return {
    posX_mm: 5000,       // Center of 100m-wide pitch
    posY_mm: 0,          // On ground
    posZ_mm: 5000,       // Center of 100m-long pitch
    velX_mm_per_frame: 0,
    velY_mm_per_frame: 0,
    velZ_mm_per_frame: 0,
    spinRadians: 0,
    spinDecayPerFrame: 0.98,  // Spin decays 2% per frame
    isGrounded: true,
    contactPlayer: null,
    lastContactFrame: -1,
  };
}
```

**Movement Update (Per Tick)**:

**CRITICAL**: All operations must be applied in this exact order. Changing order breaks determinism.

```typescript
// Order-locked physics update (MUST follow this sequence)
function updateBallPhysics(
  ball: Ball,
  frameNumber: number,
  seed: string
): Ball {
  
  // Order matters! Each step depends on previous state.
  
  // STEP 1: Apply velocity to position
  ball = applyVelocity(ball);
  
  // STEP 2: Apply gravity (affects Y velocity)
  ball = applyGravity(ball);
  
  // STEP 3: Apply friction (reduces velocity, depends on height)
  ball = applyFriction(ball, seed);
  
  // STEP 4: Apply spin decay (reduces spin)
  ball = applySpinDecay(ball);
  
  // STEP 5: Resolve collisions (changes velocity, position)
  ball = resolveCollisions(ball, frameNumber, seed);
  
  // STEP 6: Clamp values to valid ranges
  ball = clampBallValues(ball);
  
  return ball;
}

// STEP 1: Apply velocity to position
function applyVelocity(ball: Ball): Ball {
  return {
    ...ball,
    posX_mm: ball.posX_mm + ball.velX_mm_per_frame,
    posY_mm: ball.posY_mm + ball.velY_mm_per_frame,
    posZ_mm: ball.posZ_mm + ball.velZ_mm_per_frame,
  };
}

// STEP 2: Apply gravity (constant downward acceleration)
function applyGravity(ball: Ball): Ball {
  // Gravity: 9810 mm/s² = 163 mm/frame² (at 60fps)
  const gravityAccel = 163;
  
  return {
    ...ball,
    velY_mm_per_frame: ball.velY_mm_per_frame - gravityAccel,
  };
}

// STEP 3: Apply friction (ground friction when grounded, air resistance when airborne)
function applyFriction(ball: Ball, seed: string): Ball {
  const rng = new SeededRandom(seed);
  
  if (ball.isGrounded) {
    // Ground friction: ball slows down on pitch
    // Base friction: 0.96 (4% loss per frame)
    const frictionVariance = rng.nextInt(-10, 10);  // ±1% variance (seeded)
    const friction = (960 + frictionVariance) / 1000;
    
    return {
      ...ball,
      velX_mm_per_frame: Math.floor(ball.velX_mm_per_frame * friction),
      velZ_mm_per_frame: Math.floor(ball.velZ_mm_per_frame * friction),
      // Y velocity unaffected when grounded (will be set by ground contact)
    };
  } else {
    // Air resistance: ball slows in flight
    // Air friction: 0.985 (1.5% loss per frame)
    const airResistance = 0.985;
    
    return {
      ...ball,
      velX_mm_per_frame: Math.floor(ball.velX_mm_per_frame * airResistance),
      velY_mm_per_frame: Math.floor(ball.velY_mm_per_frame * airResistance),
      velZ_mm_per_frame: Math.floor(ball.velZ_mm_per_frame * airResistance),
    };
  }
}

// STEP 4: Apply spin decay (spin gradually reduces)
function applySpinDecay(ball: Ball): Ball {
  // Spin decays by 2% per frame
  const newSpin = ball.spinRadians * ball.spinDecayPerFrame;
  
  // Stop spinning if negligible
  if (Math.abs(newSpin) < 0.001) {
    return {
      ...ball,
      spinRadians: 0,
    };
  }
  
  return {
    ...ball,
    spinRadians: newSpin,
  };
}

// STEP 5: Resolve collisions (pitch boundaries, ground, players)
function resolveCollisions(
  ball: Ball,
  frameNumber: number,
  seed: string
): Ball {
  const rng = new SeededRandom(seed);
  
  // Collision 1: Pitch boundaries (sidelines at x=±5000mm, endlines at z=±5000mm)
  const pitchWidth = 5000;
  const pitchLength = 5000;
  
  if (Math.abs(ball.posX_mm) > pitchWidth) {
    // Ball out of bounds (left/right)
    ball = {
      ...ball,
      posX_mm: Math.sign(ball.posX_mm) * pitchWidth,  // Clamp to boundary
      velX_mm_per_frame: -ball.velX_mm_per_frame * 0.6,  // Bounce (60% restitution)
    };
  }
  
  if (Math.abs(ball.posZ_mm) > pitchLength) {
    // Ball out of bounds (goal line)
    ball = {
      ...ball,
      posZ_mm: Math.sign(ball.posZ_mm) * pitchLength,
      velZ_mm_per_frame: -ball.velZ_mm_per_frame * 0.6,
    };
  }
  
  // Collision 2: Ground (pitch surface at Y = 0)
  if (ball.posY_mm < 0) {
    const restitution = 0.6;  // Ball bounces to 60% of impact height
    const bounce = Math.abs(ball.velY_mm_per_frame) * restitution;
    
    ball = {
      ...ball,
      posY_mm: 0,  // Snap to ground
      velY_mm_per_frame: bounce,  // Bounce upward
      isGrounded: bounce < 50,  // Grounded if bounce is weak (0.3m/frame)
    };
  } else {
    ball = {
      ...ball,
      isGrounded: false,  // Airborne
    };
  }
  
  // Collision 3: Player contact (handled separately, just update lastContact)
  // (This is filled in by player collision detection)
  
  return ball;
}

// STEP 6: Clamp values to valid ranges (prevent extreme values)
function clampBallValues(ball: Ball): Ball {
  // Max ball velocity: 50 m/s = 50000 mm/s = ~833 mm/frame
  const maxVelocity = 833;
  
  // Max height: 100m (shouldn't happen, but safety)
  const maxHeight = 100000;
  
  return {
    ...ball,
    posY_mm: Math.min(ball.posY_mm, maxHeight),
    velX_mm_per_frame: Math.max(-maxVelocity, Math.min(ball.velX_mm_per_frame, maxVelocity)),
    velY_mm_per_frame: Math.max(-maxVelocity, Math.min(ball.velY_mm_per_frame, maxVelocity)),
    velZ_mm_per_frame: Math.max(-maxVelocity, Math.min(ball.velZ_mm_per_frame, maxVelocity)),
    spinRadians: ball.spinRadians % (Math.PI * 2),  // Wrap spin to 0–2π
  };
}
```

**Player-Ball Collision**:

```typescript
// Integrated into movement update (STEP 5)
function detectAndResolvePlayerCollision(
  ball: Ball,
  players: Player[],
  frameNumber: number,
  seed: string
): Ball {
  
  const rng = new SeededRandom(seed + "_collision");
  
  // Check each player (in deterministic order: sorted by ID)
  const sortedPlayers = players.sort((a, b) => a.id.localeCompare(b.id));
  
  for (const player of sortedPlayers) {
    const distance = calculateDistance(ball, player);
    
    // Contact distance: player radius ~0.5m = 500mm
    if (distance < 500) {
      
      // Calculate impact direction and impulse
      const contactNormal = calculateContactNormal(ball.pos, player.pos);
      const relativeVelocity = subtractVectors(ball.vel, player.vel);
      const impactVelocity = dotProduct(relativeVelocity, contactNormal);
      
      // Only collide if ball is moving toward player
      if (impactVelocity < 0) {
        
        // Base impulse from player action
        const baseImpulse = calculatePlayerActionForce(player);
        
        // Seeded variance (±15%)
        const varianceScale = 1 + rng.nextFloat(-0.15, 0.15);
        const actualImpulse = baseImpulse * varianceScale;
        
        // Apply impulse to ball
        ball = {
          ...ball,
          velX_mm_per_frame: ball.velX_mm_per_frame + contactNormal.x * actualImpulse,
          velY_mm_per_frame: ball.velY_mm_per_frame + contactNormal.y * actualImpulse,
          velZ_mm_per_frame: ball.velZ_mm_per_frame + contactNormal.z * actualImpulse,
          contactPlayer: player,
          lastContactFrame: frameNumber,
          // Spin is affected by contact point
          spinRadians: calculateSpinFromContact(player, contactNormal, baseImpulse),
        };
        
        // Move ball outside player collision radius
        const separationDistance = 550;
        const separation = contactNormal.multiply(separationDistance - distance);
        ball = {
          ...ball,
          posX_mm: ball.posX_mm + separation.x,
          posY_mm: ball.posY_mm + separation.y,
          posZ_mm: ball.posZ_mm + separation.z,
        };
        
        // Only first collision per frame
        return ball;
      }
    }
  }
  
  return ball;
}
```

**Why Order Matters**:

```
WRONG ORDER example:
1. Apply friction
2. Apply velocity
Result: Velocity is applied at reduced amount (friction already applied)

CORRECT ORDER:
1. Apply velocity (move ball)
2. Apply friction (slow it down for next frame)
Result: Velocity is applied fully, then reduced for next frame

Determinism requires EXACT order. Any deviation changes physics.
```

**Verification**:

```typescript
function verifyBallMovement(): void {
  const initialBall: Ball = {
    posX_mm: 0,
    posY_mm: 0,
    posZ_mm: 0,
    velX_mm_per_frame: 100,
    velY_mm_per_frame: 200,
    velZ_mm_per_frame: 50,
    spinRadians: 1.0,
    spinDecayPerFrame: 0.98,
    isGrounded: true,
    contactPlayer: null,
    lastContactFrame: -1,
  };
  
  const seed = "ball_test_seed";
  
  // Run 2 simulations
  let ball1 = initialBall;
  for (let i = 0; i < 1000; i++) {
    ball1 = updateBallPhysics(ball1, i, seed + i);
  }
  
  let ball2 = initialBall;
  for (let i = 0; i < 1000; i++) {
    ball2 = updateBallPhysics(ball2, i, seed + i);
  }
  
  // Must be identical (bit-for-bit)
  if (ballsMatch(ball1, ball2)) {
    console.log("✓ Ball physics are deterministic");
  } else {
    console.error("✗ Ball physics are NOT deterministic");
  }
}
```

---

## 4. Tactical Decision System

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

### 4.2 Deterministic Decision Engine

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

### 4.3 Expressiveness in Practice

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

## 5. Determinism Infrastructure

### 5.1 Seeding Strategy

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

### 5.2 Replay Storage & Verification

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

## 6. Expressiveness: How Choices Matter

### 5.1 Formation Effects

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

### 5.2 Parameter Effects

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

## 7. Server Authority Implementation

### 6.1 Client-Server Communication

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

### 6.2 Preventing Client Desync

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

## 8. Legibility: Understanding Why

### 7.1 Decision Logs

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

### 7.2 Tactical Visualization

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

## 9. Implementation Roadmap

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

## 10. Success Metrics

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

