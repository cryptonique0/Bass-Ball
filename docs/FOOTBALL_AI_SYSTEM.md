# ⚽ Bass Ball Football AI System

**Player Roles, Tactical Intelligence, and Behavioral Decision Trees**

A comprehensive guide to how Bass Ball implements Konami-level football intelligence through player roles, AI decision-making, and dynamic positioning.

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Player Roles & Archetypes](#player-roles--archetypes)
3. [Decision Tree Framework](#decision-tree-framework)
4. [Role-Specific AI Behaviors](#role-specific-ai-behaviors)
5. [Positioning System](#positioning-system)
6. [Off-Ball Movement](#off-ball-movement)
7. [Behavioral Weighting](#behavioral-weighting)
8. [Implementation Architecture](#implementation-architecture)
9. [Integration with Match Engine](#integration-with-match-engine)

---

## Design Philosophy

### Core Principles

**1. Role-Based AI (Not Individual)**
- Players follow role behaviors, not individual stat-based randomness
- Consistency in AI makes it feel human
- Stat variance happens within role framework, not outside it

**2. Deterministic & Verifiable**
- All AI decisions seeded and logged (blockchain verifiable)
- Same blockhash + inputs = same AI behavior (replay verification)
- No RNG inside decision trees (RNG only for initial seed)

**3. Tactical > Individual**
- Team tactics override individual preferences
- Formation shapes constrain positioning
- Tactical presets modify decision weights

**4. Performance Scaling**
- Difficulty levels adjust AI decision accuracy, not ability
- Easy: AI makes worse positioning choices
- Hard: AI reads plays, adjusts coverage, predicts passes

**5. Skill Expression for Human Players**
- AI should be exploitable once learned
- Predictable patterns allow skilled players to beat it
- Variety in tactics keeps games fresh

---

## Player Roles & Archetypes

Bass Ball uses 7 core position archetypes, each with distinct responsibilities:

### Role Overview

| Role | Count | Core Job | Decision Priority |
|------|-------|----------|-------------------|
| **CB** (Center Back) | 2 | Defend central | Zone coverage, ball watching, clearance |
| **FB** (Full Back) | 2 | Flank defense + wings | Mark winger, cover space, cross block |
| **DM** (Defensive Mid) | 1 | Shield defense | Intercept, block lanes, pass blocking |
| **CM** (Central Mid) | 2 | Transition hub | Press ball, receive, distribute, cover gaps |
| **AM** (Attacking Mid) | 1 | Create chances | Key pass, dribble support, shooting |
| **Winger** (LW/RW) | 2 | Flank attack | Cross, cut inside, 1v1 dribble |
| **Striker** (CF) | 1 | Finish | Finish, positioning, hold play |

**Total: 11 players (formation dependent)**

---

## Decision Tree Framework

### General Decision Tree Structure

Every player follows this hierarchy each frame:

```
1. BALL AWARENESS
   ├─ Do I have the ball? (possession)
   ├─ Am I receiving the ball? (receive prediction)
   ├─ Is the ball in my zone? (pressure trigger)
   └─ Where is the ball? (distance, speed)

2. ROLE-SPECIFIC BEHAVIOR
   ├─ What's my primary job right now?
   ├─ What's the tactical instruction?
   ├─ Is there an immediate threat?
   └─ Execute role decision

3. POSITIONING
   ├─ Where should I stand?
   ├─ Am I in shape for my role?
   ├─ Do I need to cover for a teammate?
   └─ Move to ideal position

4. MICRO-DECISIONS
   ├─ Pass target (if receiving)
   ├─ Defensive action (if defending)
   ├─ Support movement (if attacking)
   └─ Positioning adjustment
```

### Decision Weighting System

Each decision gets a score based on:

```
Final Score = (Role Weight × 0.5) + (Tactical Weight × 0.3) + (Situation Weight × 0.2)

Where:
- Role Weight = How suited this player is for the action
- Tactical Weight = How much the team tactic encourages this
- Situation Weight = How urgent/important the situation is
```

---

## Role-Specific AI Behaviors

### 1. CENTER BACK (CB) - The Anchor

**Primary Job**: Prevent shots, clear balls, read play

**Decision Tree**:

```
┌─ Ball is in opponent's half
│  └─ POSITIONING: Hold defensive line, stay compact with partner
│     ├─ If partner under pressure → Slide across to cover
│     └─ If space behind → Drop deeper
│
├─ Ball approaches (within 35m)
│  ├─ Is it a striker I should mark? → MARK mode (follow closely)
│  ├─ Is it a loose ball? → PRESSURE mode (close quickly)
│  └─ Is it in midfield? → SHAPE mode (maintain line)
│
├─ Ball is at feet (opponent)
│  ├─ Can I intercept? (in passing lane) → INTERCEPT
│  ├─ Should I slide? (danger < 2sec) → SLIDE tackle
│  └─ Should I jockey? (maintain distance) → JOCKEY
│
└─ Ball is cleared/lost
   ├─ Reset positioning
   ├─ Check defensive line alignment
   └─ Re-scan for threats
```

**Key Stats**:
- Heading: Winning aerial duels
- Marking: Following strikers tightly
- Position Sense: Knowing where to be defensively
- Ball Reading: Anticipating passes

**Tactical Modifiers**:
- High Press: Step up, reduce gap to opponent
- Low Block: Drop deeper, pack penalty area
- Possession: More aggressive positioning
- Counter: Stay compact, quick transition ready

---

### 2. FULL BACK (FB) - The Versatile Defender

**Primary Job**: Stop wingers, deliver width, cover flanks

**Decision Tree**:

```
┌─ Winger is near me (my flank)
│  ├─ Is winger receiving? → CLOSE DOWN (aggressive press)
│  ├─ Is winger dribbling? → JOCKEY (stay close, don't commit)
│  └─ Is winger idle? → SHAPE (maintain loose mark)
│
├─ Ball is in opponent's half (my flank)
│  ├─ Can I attack? (defensive line safe) → OVERLAP (run down wing)
│  └─ Should I hold? (gap appears) → RETREAT (protect space)
│
├─ Central attack building
│  ├─ Is CB in trouble? → SLIDE across to cover
│  ├─ Is DM under pressure? → Drop to support
│  └─ Maintain flank coverage
│
└─ Ball cleared to my flank
   ├─ Can I transition? → PUSH forward with ball
   └─ Otherwise → RESET positioning
```

**Key Stats**:
- Pace: Catching wingers in transitions
- Stamina: Covering flank all match
- Crossing: Delivery from wings
- Marking: 1v1 vs winger

**Tactical Modifiers**:
- High Press: Push forward aggressively, overlap on attack
- Low Block: Stay deep, protect flank, no attacking runs
- Wing Play: More frequent overlaps, attacking emphasis
- Counter: Quick transition, explosive pace bursts

---

### 3. DEFENSIVE MIDFIELDER (DM) - The Anchor

**Primary Job**: Shield defense, break up attacks, protect CBs

**Decision Tree**:

```
┌─ Ball is in midfield (opponent possession)
│  ├─ Is there a passing lane? → INTERCEPT (step into lane)
│  ├─ Is there a runner? → BLOCK (body in way)
│  └─ Is it tight? → PRESSURE (close immediately)
│
├─ Opponent has ball (near goal)
│  ├─ Can I tackle? (good angle) → SLIDE/TACKLE
│  ├─ Am I beaten? → RECOVER (track runner)
│  └─ Otherwise → JOCKEY (win ball back)
│
├─ My team has ball
│  ├─ Can I receive? → OFFER PASS OPTION (move into space)
│  ├─ Should I cover? → HOLD POSITION (shield defense)
│  └─ Otherwise → SUPPORT (side pass option)
│
└─ Transition moments
   ├─ Team loses ball → PRESS immediately
   └─ Team gains ball → DISTRIBUTE/SHIELD
```

**Key Stats**:
- Positioning: Reading play, intercepting passes
- Tackling: Winning 50/50s, clean tackles
- Work Rate: Constant movement, stamina
- Passing: Simple distribution under pressure

**Tactical Modifiers**:
- High Press: Very aggressive, press immediately on loss
- Low Block: Deep, screen defense, break counterattacks
- Possession: Creative passing, push forward to midfield
- Counter: Hold shape, quick transition passes

---

### 4. CENTRAL MIDFIELDER (CM) - The Heartbeat

**Primary Job**: Transition, link defense to attack, control tempo

**Decision Tree**:

```
┌─ Ball is in opponent's half
│  ├─ Can I press? → PRESS (aggressive)
│  ├─ Should I cut lane? → POSITION (block passing lane)
│  └─ Otherwise → SHAPE (maintain formation)
│
├─ My team has possession
│  ├─ Should I receive? → OFFER (move into space)
│  ├─ Can I push forward? → ADVANCE (support attack)
│  ├─ Should I hold? → HOLD POSITION (balance)
│  └─ Otherwise → RECYCLING PASS (move for easy return)
│
├─ Ball is contested
│  ├─ Can I win it? → PRESS/CHALLENGE
│  ├─ Am I closest? → COVER (second defender)
│  └─ Otherwise → POSITION (block space)
│
├─ Transition (loss of possession)
│  ├─ Quick reactions → PRESS immediately
│  └─ Then REPOSITION for defense
│
└─ Counter-attack opportunity
   ├─ Can I advance? → RUN forward for pass
   └─ Otherwise → SUPPORT with movement
```

**Key Stats**:
- Passing: Key passes, range, accuracy
- Dribbling: Progress through midfield
- Positioning: Reading play
- Stamina: Constant movement both directions

**Tactical Modifiers**:
- High Press: Very aggressive, chase ball
- Low Block: Passive, hold line, defensive shield
- Possession: More creative, dribbling, forward passes
- Counter: Quick transitions, direct passes forward

---

### 5. ATTACKING MIDFIELDER (AM) - The Creator

**Primary Job**: Create chances, key passes, support striker

**Decision Tree**:

```
┌─ Ball is in opponent's half
│  ├─ Can I shoot? → SHOOT (direct finishing attempt)
│  ├─ Can I pass striker? → KEY PASS (through ball/chip)
│  ├─ Is winger free? → SWITCH PLAY (cross-field pass)
│  └─ Otherwise → DRIBBLE/PROGRESS (carry ball forward)
│
├─ Ball arrives at feet
│  ├─ Is striker in space? → THROUGH BALL
│  ├─ Are wingers free? → CROSS-FIELD PASS
│  ├─ Is space to run? → DRIBBLE (beat press)
│  └─ Otherwise → SAFE PASS (back to CM)
│
├─ Pressing situation (no ball)
│  ├─ Is ball near striker? → SUPPORT (open passing lane)
│  └─ Otherwise → POSITIONING (space for striker)
│
└─ Counter-attack
   ├─ Quick pass forward → DIRECT TO STRIKER
   └─ If space → RUN forward for return pass
```

**Key Stats**:
- Dribbling: Beat press, create space
- Passing: Key passes, through balls
- Shooting: Finishing from distance
- Creativity: Unpredictability in decision-making

**Tactical Modifiers**:
- High Press: Support striker's press, aggressive
- Low Block: Hold position, few creative chances
- Possession: More dribbling, creative freedom
- Counter: Direct passes to striker, fast breaks

---

### 6. WINGER (LW/RW) - The Executor

**Primary Job**: 1v1 vs FB, cross, cut inside for shot

**Decision Tree**:

```
┌─ Ball arrives at feet on wing
│  ├─ Is FB closing down? 
│  │  ├─ Can I dribble past? → DRIBBLE 1v1
│  │  ├─ Should I cut inside? → CUT INSIDE (shot opportunity)
│  │  └─ Otherwise → PASS BACK
│  ├─ Is space open?
│  │  ├─ Can I cross? → CROSS (for striker/AM)
│  │  └─ Can I shoot? → SHOOT (if in range)
│  └─ Otherwise → RETAIN/DRIBBLE
│
├─ Ball is in central areas
│  ├─ Is there space to run? → RUN forward (receive forward pass)
│  ├─ Can I support? → MOVE INTO SPACE (passing option)
│  └─ Otherwise → HOLD POSITION
│
├─ Without possession
│  ├─ Can I mark FB? → MARK (loose/tight depending on ball)
│  ├─ Otherwise → RECEIVE POSITION (stay available)
│  └─ Support striker via movement
│
└─ Counter-attack
   ├─ Sprint for space → RUN to goal
   └─ Accept pass and finish/cross
```

**Key Stats**:
- Pace: 1v1 speed, explosive runs
- Dribbling: Beat FB in space, skill moves
- Crossing: Quality service from wings
- Shooting: Cutting inside to shoot

**Tactical Modifiers**:
- High Press: Support striker's press, track FB
- Low Block: Narrow, defensive positioning, less attacking
- Wing Play: More attacking freedom, earlier crosses
- Counter: Explosive pace, quick transitions forward

---

### 7. STRIKER (CF/ST) - The Finisher

**Primary Job**: Score, hold play, finish chances

**Decision Tree**:

```
┌─ Ball is in opponent's box
│  ├─ Can I shoot? → SHOOT immediately (first touch, direct)
│  ├─ Can I head? (cross coming) → POSITION for header
│  ├─ Is defender tight? → SHIELD (hold ball, wait support)
│  └─ Otherwise → MOVE to open space
│
├─ Ball is outside box
│  ├─ Can I receive in space? → MOVE forward for pass
│  ├─ Should I hold up? → CHECK BACK (receive to feet)
│  └─ Otherwise → RUN to goal (in behind play)
│
├─ Team is defending (loss of possession)
│  ├─ Is ball near? → PRESS (aggressive)
│  ├─ Otherwise → POSITION near ball (transitional)
│  └─ Ready for quick counter
│
├─ Chances are rare
│  ├─ Smart positioning → Anticipate loose balls
│  └─ Quick reactions → Clinical finishes
│
└─ Counter-attack
   ├─ Sprint forward → RUN to goal
   └─ Finish on first/second touch
```

**Key Stats**:
- Finishing: Convert chances into goals
- Positioning: Anticipate loose balls, find space
- Pace: Explosive runs in behind
- Strength: Hold up play, shield ball

**Tactical Modifiers**:
- High Press: Very aggressive, press CBs immediately
- Low Block: Deep position, few chances, long-ball threat
- Possession: More hold-up play, link midfield
- Counter: Direct runs, explosive pace, clinical finishing

---

## Positioning System

### Defensive Shape

Each formation has a base shape that players maintain:

```
Formation: 4-2-3-1

┌─────────────────────────┐
│           ST            │ Striker
│    AM              AM   │ Attacking Mids
│  W     CM     CM      W │ Wingers + Central Mids
│  FB   DM   DM    FB    │ Full Backs + Defensive Mids
│     CB        CB       │ Center Backs
│    ────────────────    │
└─────────────────────────┘

Each player has:
- Ideal position (x, y)
- Defensive line (y depth)
- Formation role
```

### Shape Compression

When defending:
- **Narrow spaces**: Players compress toward ball
- **Wide attacks**: FBs push out, CBs slide
- **Central attacks**: DMs cover space, CMs press

Example (ball on right wing):
```
Before: NORMAL SHAPE
After: COMPRESSED RIGHT
- RW pulls back to defend
- RFB pushes to touch line
- RCM covers for RFB
- LCB shifts right
```

### Defensive Line Management

```
Deep Block (Low Defensive Line)
- All defenders positioned deep (35-40 yard line)
- Giveaway = long distance to goal
- Risk: Through balls

Medium Line
- Defenders at 50 yard line
- Balance between pressure and safety
- Standard positioning

High Line (Off-side Trap)
- Defenders advanced (60+ yard line)
- Risky: Through balls beat line
- Benefit: Catch strikers off-side
```

---

## Off-Ball Movement

### Movement Triggers

Players move when:

```
1. BALL MOVEMENT
   - Ball passes by them → Move to track it
   - Ball goes to teammate → Support movement

2. SPACE CREATION
   - Teammate receives ball → Move to open space
   - Teammate under pressure → Create passing option
   - Overlap opportunity → Run down wing

3. TACTICAL MOVEMENTS
   - Formation adjustment → Slide to position
   - Overload one flank → Cluster attackers
   - Defensive transition → Drop deep quickly

4. ANTICIPATION
   - Read opponent's play → Move to intercept
   - Predict pass → Move to ball's path
   - Read through ball → Sprint in behind
```

### Movement Patterns by Role

**Striker**:
- Runs in behind CB (15% chance per touch)
- Checks back to receive (30%)
- Moves to open space (40%)
- Holds position (15%)

**Winger**:
- 1v1 on FB (35%)
- Cut inside (25%)
- Overlap movement (20%)
- Receive position (20%)

**CM**:
- Forward run (20%)
- Box-to-box coverage (35%)
- Receive position (30%)
- Defensive cover (15%)

**CB**:
- Slide across (10%)
- Push forward (5%)
- Hold line (80%)
- Other (5%)

---

## Behavioral Weighting

### Weighting System

Each player has weights for different behaviors:

```
Player Behavior Weights = {
  "Aggression": 0.6,          // How much they press/challenge
  "Positioning": 0.8,         // How aware of space they are
  "Technique": 0.7,           // How good at dribbling/passing
  "Work Rate": 0.75,          // How much they move
  "Defensive Awareness": 0.85, // How aware of threats
  "Creativity": 0.5,          // How often they dribble/try risky passes
  "Risk Taking": 0.4,         // How much they gamble
}
```

### Difficulty Scaling

Same player behaves differently by difficulty:

```
EASY:
- Reduced positioning awareness (-20%)
- Slower reactions (-30%)
- More mistakes on passes/touches
- Worse decision-making (sometimes choose wrong option)

MEDIUM:
- Normal behavior weights
- Standard reaction time
- Good positioning but human errors

HARD:
- Enhanced positioning awareness (+20%)
- Faster reactions (+30%)
- Excellent decision-making
- Reads plays before they happen
- Perfect execution of decisions
```

### Example: CB Positioning Weight by Difficulty

```
EASY:
- Sometimes out of position
- Slow to react to strikers
- Can miss coverage

MEDIUM:
- Usually in position
- Standard reaction time
- Generally covers space

HARD:
- Always in position
- Quick reactions to danger
- Anticipates plays
- Perfect marking
```

---

## Implementation Architecture

### Player AI Class Structure

```typescript
class PlayerAI {
  // Identity
  playerId: string;
  role: PlayerRole; // CB, FB, DM, CM, AM, Winger, Striker
  team: Team;
  difficulty: Difficulty;

  // Current state
  position: Vector2;
  velocity: Vector2;
  hasPossession: boolean;

  // Behavior weights
  behaviorWeights: BehaviorWeights;
  roleWeights: RoleWeights;
  tacticalModifiers: TacticalModifiers;

  // Decision system
  update(gameState: GameState, dt: number) {
    // 1. Assess situation
    const situation = this.assessSituation(gameState);
    
    // 2. Make decision
    const decision = this.makeDecision(situation);
    
    // 3. Execute decision
    this.executeDecision(decision, dt);
  }

  private assessSituation(gameState: GameState): Situation {
    return {
      ballPosition: gameState.ball.position,
      ballOwner: gameState.possession.team,
      myPosition: this.position,
      nearbyPlayers: gameState.getNearbyPlayers(this.position, 30),
      formation: this.team.formation,
      tactic: this.team.currentTactic,
    };
  }

  private makeDecision(situation: Situation): Decision {
    // Role-specific decision making
    const decision = this[`decide_${this.role}`](situation);
    
    // Apply tactical modifiers
    this.applyTacticalModifiers(decision);
    
    // Apply difficulty scaling
    this.applyDifficultyScaling(decision);
    
    return decision;
  }

  private executeDecision(decision: Decision, dt: number) {
    // Position adjustment
    // Movement command
    // Action command (shoot, pass, tackle, etc.)
  }
}
```

### Role-Specific Decision Methods

Each role has its own decision method:

```typescript
private decide_CB(situation: Situation): Decision {
  if (situation.ballOwner === this.team) {
    return this.defendingDecision(situation);
  } else {
    return this.attackingDecision(situation);
  }
}

private decide_Striker(situation: Situation): Decision {
  if (situation.ballOwner === this.team) {
    return this.attackingDecision(situation);
  } else {
    return this.pressingDecision(situation);
  }
}

// ... more role-specific methods
```

---

## Integration with Match Engine

### Decision Frequency

- **Position updates**: Every frame (60Hz)
- **Tactical decisions**: Every 200ms (5Hz)
- **Major decisions** (press/fall back): Every 500ms (2Hz)

### Ball-Aware AI

```
Every frame:
1. Update ball position in AI's "vision"
2. Check if ball moved to new zone
3. Trigger appropriate decision
4. Execute movement

Same seed = Same decisions
(deterministic replay verification)
```

### Verification Integration

```
For each match tick:
1. Record all player positions
2. Record all player decisions
3. Hash match state + decisions
4. Store on-chain for verification

Anyone can:
- Re-simulate with same blockhash
- Verify AI decisions were consistent
- Check for cheating/modification
```

---

## Example: A Real Match Scenario

### Scenario: Possession in Midfield (4-2-3-1 vs 5-3-2)

**Current State**:
```
Possession: Home team
Ball: With CM (central midfield)
Opposition: Counter-pressing

Home formation: 4-2-3-1
Away formation: 5-3-2 (defensive)
```

**AI Decision-Making Cascade**:

**Home CM** (has ball):
```
1. Assess: I have ball, AM is open, striker running
2. Decision: Pass to AM (high-risk, high-reward)
3. Execute: Pass forward

Weights: 
- Pass to AM: 0.85 (role suited, tactical allows)
- Pass back to DM: 0.40 (safe but passive)
- Dribble forward: 0.60 (medium risk)
```

**Home AM** (receives):
```
1. Assess: I have ball, FB closing, striker in box
2. Decision: Through ball to striker (key pass)
3. Execute: Thread ball in behind

Weights:
- Through ball: 0.90 (striker moving, space behind)
- Shoot: 0.50 (not in range yet)
- Dribble: 0.70 (can beat press)
```

**Away CB** (defending):
```
1. Assess: Striker running in behind, gap forming
2. Decision: Step up to catch offside
3. Execute: Push forward slightly

But... Away DM is covering!
- AM is open for through ball
- CB steps up, catches striker offside ✓
```

**Away DM** (defensive cover):
```
1. Assess: AM has ball, striker running
2. Decision: Cover space (anticipate through ball)
3. Execute: Move to cover gap

Weighs gap coverage (0.85) vs pressing AM (0.40)
Chooses gap coverage → Prevents through ball threat
```

**Result**: Complex, realistic defensive adjustment by Away team

---

## Konami-Level Football Intelligence

This system achieves Konami-level gameplay through:

✅ **Role Identity**
- Each player has distinct decision-making
- Not stat-based, behavior-based
- Consistent with formation

✅ **Tactical Awareness**
- Formation shapes the behavior
- Tactics modify decisions
- Team cohesion emerges

✅ **Dynamic Positioning**
- Off-ball movement creates passing options
- Defensive shape compresses intelligently
- Overloads and imbalances happen naturally

✅ **Verifiable Intelligence**
- All decisions logged and hashed
- Replay verification works with AI
- No cheating possible (all deterministic)

✅ **Skill Expression**
- Exploitable patterns (once learned)
- Variety via different tactics
- Predictable AI makes skilled play rewarding

---

## Roadmap & Future Enhancements

### Phase 2 (Next Quarter)
- [ ] Machine learning from human matches
- [ ] Adaptive AI (learns from player)
- [ ] Injury/fatigue affecting AI decisions
- [ ] Individual player personalities

### Phase 3 (Future)
- [ ] Coach roles (tactical instructions mid-match)
- [ ] Set piece AI (corners, free kicks)
- [ ] Dead ball specialist behaviors
- [ ] Advanced formations (5-3-2, 3-5-2, etc.)

### Phase 4 (Long-term)
- [ ] Neural network-based positioning
- [ ] Real-time formation adaptation
- [ ] Crowd/momentum affecting AI
- [ ] Weather affecting decision-making

---

## Files & Code References

- **Implementation**: [`src/game/ai/player-ai.ts`](../src/game/ai/player-ai.ts)
- **Tactics System**: [`src/game/tactics/tactics-engine.ts`](../src/game/tactics/tactics-engine.ts)
- **Role Definitions**: [`src/game/ai/roles/`](../src/game/ai/roles/)
- **Match Engine Integration**: [`MATCH_ENGINE_SERVER.md`](./MATCH_ENGINE_SERVER.md#ai-integration)

---

**Last Updated**: January 18, 2026  
**Version**: 1.0  
**Status**: Design Complete, Implementation Phase  
**Football Intelligence Level**: Konami-Class ⚽
