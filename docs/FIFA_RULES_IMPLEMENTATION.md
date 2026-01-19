# ⚽ FIFA Rules Implementation Guide

**Comprehensive Rules System for Bass Ball: Disciplinary Cards, Transfers, Suspensions, Match Rules, and Real-World Football Mechanics**

This document specifies how Bass Ball implements official FIFA rules, ensuring competitive integrity, realistic football mechanics, and blockchain-verifiable rule enforcement.

---

## Table of Contents

1. [Overview & Philosophy](#overview--philosophy)
2. [Disciplinary System](#disciplinary-system)
   - [Yellow Cards](#yellow-cards)
   - [Red Cards](#red-cards)
   - [Suspension System](#suspension-system)
3. [Transfer Window System](#transfer-window-system)
4. [Match Rules & Enforcement](#match-rules--enforcement)
5. [Player Management & Squad Restrictions](#player-management--squad-restrictions)
6. [Competition Rules](#competition-rules)
7. [Data Structures & Implementation](#data-structures--implementation)
8. [Smart Contract Integration](#smart-contract-integration)
9. [Verification & Replay Integration](#verification--replay-integration)

---

## Overview & Philosophy

### Why FIFA Rules Matter in Web3 Football

```
TRADITIONAL SPORTS PROBLEM:
├─ Referees are centralized authorities
├─ No transparency in disciplinary decisions
├─ Players can't prove their innocence
└─ League rules vary by region, language barrier

BASS BALL SOLUTION:
├─ Rules encoded as deterministic, verifiable smart contracts
├─ All disciplinary actions logged immutably on-chain
├─ Players can dispute with cryptographic replay evidence
├─ Global rules: Same FIFA ruleset everywhere, no variants
└─ Transparent appeals process backed by blockchain
```

### Design Principles

```
PRINCIPLE 1: DETERMINISTIC ENFORCEMENT
├─ Cards are issued by server (not blockchain)
├─ Server follows deterministic rules engine
├─ Replay proof allows verification of fairness
└─ No room for subjective referee bias

PRINCIPLE 2: PERMANENCE & CONSEQUENCE
├─ Cards create real competitive consequences
├─ Suspensions affect team selection (can't play)
├─ Transfer restrictions apply during windows
└─ History matters: Repeat offenders tracked

PRINCIPLE 3: BLOCKCHAIN IMMUTABILITY
├─ Every card recorded on-chain
├─ Smart contracts enforce suspension eligibility
├─ Transfers locked until window + verification
└─ Dispute resolution through cryptographic proof

PRINCIPLE 4: ESPORTS FAIRNESS
├─ Rules same for all players (no pay-to-avoid-cards)
├─ No cosmetic affects disciplinary logic
├─ Web3 doesn't override real football rules
└─ Community can vote on ruleset variants
```

---

## Disciplinary System

### Yellow Cards

#### When Yellow Cards Are Issued

```
FIFA OFFENSES RESULTING IN YELLOW CARD:

1. UNSPORTING BEHAVIOR:
   ├─ Excessive celebration (>3 seconds) → Yellow
   ├─ Taking off shirt after goal → Yellow
   ├─ Climbing on barriers → Yellow
   ├─ Mocking opponent → Yellow
   ├─ Disrespectful gestures → Yellow
   └─ Spitting simulation (diving without contact) → Yellow

2. EXCESSIVE FORCE / RECKLESS PLAY:
   ├─ Tackle with excessive speed → Yellow
   ├─ Two-footed sliding tackle → Yellow
   ├─ Studs-up challenge → Yellow
   ├─ Dangerous play (elbows, knees raised) → Yellow
   └─ Late challenge (0.5+ seconds after) → Yellow

3. FOUL PLAY DURING PLAY:
   ├─ Dangerous pass (deliberately to opponent foot) → Yellow
   ├─ Throwing ball at opponent → Yellow
   ├─ Holding back jersey → Yellow
   ├─ Pushing away from ball → Yellow
   └─ Persistent infringement (3rd offense in same phase) → Yellow

4. GOALKEEPER VIOLATIONS:
   ├─ Handling backpass (>6.2m penalty area) → Yellow (Indirect FK)
   ├─ Throwing outside area then handling → Yellow
   ├─ Time wasting (>6 seconds hold) → Yellow
   └─ Deliberate delay of restart → Yellow

5. DISSENT / PROTEST:
   ├─ Verbal dissent to referee → Yellow
   ├─ Physical protest (throwing armband) → Yellow
   ├─ Refusing to leave field when subbed → Yellow
   └─ Refusing to follow instructions → Yellow

6. TECHNICAL VIOLATIONS:
   ├─ Unauthorized kit change → Yellow
   ├─ Removing helmet/gear recklessly → Yellow
   ├─ Persistent tactical fouling → Yellow
   └─ Unlawful entry/re-entry → Yellow
```

#### Yellow Card Mechanics

```typescript
interface YellowCardEvent {
  matchId: string;
  timestamp: number;           // Frame when issued
  playerName: string;
  playerTeam: 'home' | 'away';
  playerNumber: number;
  offense: YellowCardOffense;
  description: string;         // Free text explanation
  refereeDecision: boolean;    // Always true (server-authoritative)
  isDisputable: boolean;       // Can appeal with replay
  
  // Consequences
  yellowCardCount: number;     // 1 or 2 (2 = red)
  nextSuspensionFrame: number; // When suspension starts
  
  // Blockchain
  txHash?: string;             // On-chain record
  blockNumber?: number;
}

type YellowCardOffense = 
  | 'unsporting_behavior'
  | 'excessive_force'
  | 'reckless_play'
  | 'dangerous_play'
  | 'foul_play'
  | 'handball'
  | 'dissent'
  | 'persistent_infringement'
  | 'technical_violation'
  | 'diving';
```

#### Accumulation Rules

```
TWO YELLOW = RED CARD:
├─ First yellow: Issued, player continues playing
├─ Second yellow (same match): Automatic red
│  └─ Match ends with 10 players on field
├─ Yellows reset after each match
├─ No carry-over between matches
└─ BUT: Consecutive reds in 2 matches = ban

PERSISTENT INFRINGEMENT:
├─ 1st foul of type: Verbal warning (no card)
├─ 2nd foul of type: Yellow card
├─ 3rd foul of type: Second yellow (automatic red)
├─ Resets after 30 minutes without foul
└─ Visible to players: Foul counter displayed

TACTICAL FOULING:
├─ Definition: >2 fouls per 10 minutes in defensive third
├─ Automatic yellow if pattern detected
├─ Counter resets after 2 minutes without foul
└─ Server checks every 10 second block
```

### Red Cards

#### When Red Cards Are Issued

```
FIFA OFFENSES RESULTING IN DIRECT RED CARD:

1. VIOLENT CONDUCT:
   ├─ Punching opponent → Red
   ├─ Headbutt → Red
   ├─ Knee strike → Red
   ├─ Elbow strike (with full force) → Red
   └─ Kicking opponent (not ball) → Red

2. SERIOUS FOUL PLAY:
   ├─ Tackle from behind (no ball contact) → Red
   ├─ Two-footed studs-up challenge → Red
   ├─ High challenge endangering safety → Red
   ├─ Reckless charge (>1.5x normal force) → Red
   └─ Deliberate intent to injure → Red

3. SPITTING / BITING:
   ├─ Spitting at opponent → Red
   ├─ Spitting toward referee → Red
   ├─ Biting opponent → Red
   └─ Mouth contact assault → Red

4. DENIAL OF GOAL-SCORING OPPORTUNITY:
   ├─ Handball on goal line (not goalkeeper) → Red
   ├─ Professional foul (tactical denial) → Red
   ├─ Last defender foul → Red
   └─ Definition: Clear path to goal blocked by foul

5. ABUSIVE LANGUAGE / GESTURES:
   ├─ Racial abuse → Red
   ├─ Religious abuse → Red
   ├─ Homophobic slurs → Red
   ├─ Sexist language → Red
   ├─ Extreme profanity at referee → Red
   └─ Threatening gestures → Red

6. SECOND YELLOW IN SAME MATCH:
   ├─ Yellow + Yellow = Red
   ├─ Automatic expulsion
   └─ No further penalties in that match
```

#### Red Card Mechanics

```typescript
interface RedCardEvent {
  matchId: string;
  timestamp: number;           // Frame when issued
  playerName: string;
  playerTeam: 'home' | 'away';
  playerNumber: number;
  offense: RedCardOffense;
  description: string;
  refereeDecision: boolean;    // Always true (server-authoritative)
  isDisputable: boolean;       // Can appeal with replay
  
  // Immediate Consequence
  isEjected: boolean;          // true (player leaves field immediately)
  replacementPlayer?: string;  // Who replaces (if team has subs)
  
  // Suspension
  matchesAutoSuspended: number;// Typically 1-3 matches
  startSuspensionFrame: number;
  
  // Blockchain
  txHash?: string;
  blockNumber?: number;
  
  // Appeal
  appealDeadlineFrame: number; // 24 hours from match end
  appealStatus: 'none' | 'pending' | 'upheld' | 'overturned';
}

type RedCardOffense =
  | 'violent_conduct'
  | 'serious_foul_play'
  | 'spitting'
  | 'biting'
  | 'denial_of_goal_opportunity'
  | 'handball_deliberate'
  | 'abusive_language'
  | 'second_yellow'
  | 'assault';
```

#### Immediate Consequences

```
RED CARD EXPULSION:
├─ Player removed immediately (10 frames after issuance)
├─ Team plays with 10 players for remainder
├─ No substitution if already used all subs
├─ Opposition gets throw-in/free kick from location
│
├─ MATCH CONTINUATION:
│  ├─ Team can continue with 9 minimum (rule: 7 players minimum)
│  ├─ If team falls below 7 → Match abandoned (0-3 loss)
│  └─ Abandoned match: Both players penalized ELO
│
└─ PSYCHOLOGICAL EFFECT:
   ├─ Player can't re-enter (unlike yellow card)
   ├─ Affects team morale/tactics
   ├─ Formation may shift (if 10v11)
   └─ Smart AI will adjust press/defense
```

### Suspension System

#### Suspension Timeline

```
RED CARD SUSPENSION SCHEDULE:

STANDARD RED:
├─ First red in season: 1 match automatic
├─ Second red in season: 2 matches automatic
├─ Third+ red in season: 3 matches + disciplinary committee review
└─ Off-season reset: Suspensions don't carry to next season

SERIOUS MISCONDUCT RED:
├─ Violent conduct (punch, headbutt): 3 matches minimum
├─ Spitting/biting: 4 matches minimum
├─ Racial/religious abuse: 5-10 matches (+ potential ban)
├─ Assault outside play: 5 matches minimum
└─ Committee can extend for repeat offenses

CUMULATIVE YELLOW CARD BANS:
├─ 5 yellows in season: 1 match ban
├─ 10 yellows in season: 2 match ban
├─ 15 yellows in season: 3 match ban + committee review
├─ Resets at mid-season reset or season end
└─ Ban applies to next competitive match
```

#### Suspension Enforcement

```typescript
interface PlayerSuspension {
  playerId: string;
  playerName: string;
  teamId: string;
  
  suspensionType: 'red_card' | 'yellow_accumulation' | 'disciplinary' | 'interim';
  reason: string;
  
  // Timeline
  issuedMatchId: string;
  issuedFrame: number;
  issuedBlockNumber: number;
  
  suspensionStartMatch: string;
  suspensionEndMatch: string;
  
  matchesRemaining: number;
  
  // Status
  isActive: boolean;
  isAppealable: boolean;
  
  // Appeal Process
  appealSubmittedFrame?: number;
  appealEvidence?: string;        // IPFS hash of replay clip
  appealStatus: 'not_appealed' | 'pending' | 'upheld' | 'overturned';
  appealResolutionFrame?: number;
  
  // Blockchain
  onChainId: string;              // Smart contract suspension ID
  txHash: string;
  blockNumber: number;
}

// During match selection:
function canPlayerParticipate(
  playerName: string,
  upcomingMatchId: string
): { allowed: boolean; reason?: string } {
  const suspension = getSuspensionStatus(playerName);
  
  if (!suspension.isActive) {
    return { allowed: true };
  }
  
  if (suspension.matchesRemaining > 0) {
    return {
      allowed: false,
      reason: `Serving suspension. Matches remaining: ${suspension.matchesRemaining}`
    };
  }
  
  return { allowed: true };
}
```

#### Appeal Process (Web3-Backed)

```
SUSPENSION APPEAL WORKFLOW:

APPEAL ELIGIBILITY:
├─ Red card incidents (Yellow accumulation not appealable)
├─ Must submit within 24 hours of match end
├─ Requires replay clip proving different version
├─ Player pays 0.1 ETH filing fee (returned if upheld)
└─ Max 1 appeal per suspension

APPEAL SUBMISSION:
├─ Player uploads replay clip to IPFS
├─ Submits transaction with clip hash + 0.1 ETH
├─ Smart contract records appeal on-chain
├─ Community voting period starts (48 hours)
└─ 5 randomly selected judges vote (must be verified players)

VOTING CRITERIA:
├─ Was there clear contact/infringement?
├─ Did player exhibit intent to harm?
├─ Would professional referee issue card?
├─ Is decision consistent with prior cases?
└─ Majority vote determines outcome

RESOLUTION:
├─ If upheld (≥3/5 votes): Card stands, fee forfeit
├─ If overturned (≤2/5 votes): Suspension removed, fee refunded + 0.05 ETH reward
├─ Result recorded on-chain
├─ Appeal history visible on player profile
└─ Patterns tracked (if >3 appeals overturned = ref review)
```

---

## Transfer Window System

### Transfer Windows (Real-World Aligned)

```
OFFICIAL TRANSFER WINDOWS (Global):

SUMMER TRANSFER WINDOW:
├─ Dates: June 1 - August 31
├─ Peak activity period
├─ Allows 1 full squad refresh
├─ Player purchase/sale/loan enabled
└─ Contract updates finalized

WINTER TRANSFER WINDOW:
├─ Dates: January 1 - January 31
├─ Shorter window, fewer moves typical
├─ Limited squad adjustments allowed
├─ Loan deals common
└─ Emergency signings possible

MID-SEASON EMERGENCY WINDOW:
├─ Dates: February 1 - March 15 (Championship window)
├─ Only injury-replacement signings
├─ Strict league approval required
├─ Max 1 player per team
└─ Only for positions with 0 backup players

CLOSED SEASON:
├─ All other times: Transfers NOT allowed
├─ Player swaps require GM consent (rare)
├─ Contract renewals continue
├─ Loan deals can end anytime
└─ Violations: Player locked, team fined
```

### Transfer Mechanics & Blockchain Integration

```typescript
interface TransferWindow {
  windowId: string;
  seasonId: string;
  windowName: 'summer' | 'winter' | 'emergency';
  
  // Timeline
  startDate: string;          // ISO 8601
  endDate: string;
  isActive: boolean;
  
  // Blockchain
  txHash: string;             // Window opened on-chain
  blockNumber: number;
  
  // Rules
  maxTransfersPerTeam: number;
  budgetPerTeam: Map<string, number>; // Max spending
  allowedPositions?: string[]; // If emergency
}

interface TransferListing {
  listingId: string;
  playerTokenId: string;      // NFT ID
  playerName: string;
  playerTeam: string;
  playerPosition: string;
  
  // Listing Details
  askedPrice: number;         // In USDC
  minimumBid?: number;
  auctionEndBlock: number;
  saleType: 'fixed' | 'auction' | 'negotiation';
  
  // Restrictions
  transferWindow: TransferWindow;
  canOnlyTransferDuring: 'summer' | 'winter' | 'any';
  minimumSeasonPlayed: number; // e.g., must play 1 season before transfer
  
  // Status
  isListed: boolean;
  isSold: boolean;
  soldToTeam?: string;
  soldToPlayerName?: string;
  
  // Blockchain
  smartContractAddress: string;
  listingTxHash: string;
  listingBlockNumber: number;
}

interface PlayerTransfer {
  transferId: string;
  playerTokenId: string;
  playerName: string;
  
  // Transfer Details
  fromTeam: string;
  toTeam: string;
  transferDate: string;
  transferWindow: TransferWindow;
  
  // Financial
  transferFee: number;        // In USDC
  sellerWallet: string;       // Receives majority
  creatorRoyalty: number;     // Platform takes %
  
  // Contract
  newContractLength: number;  // Matches (26 = 1 season)
  newContractSalary: number;  // Per match in tokens
  newContractBenefits: string[]; // Cosmetics, rewards
  
  // New Role
  newPlayerRole?: string;     // Can change position
  newSquadNumber?: number;    // Can get new number
  newTeamTacticalRole?: string; // CM vs CAM, etc.
  
  // Immediate Effects
  eligibleFromMatch: string;  // First match playable
  requiresTeamRegistration: boolean; // Transfer cleared?
  
  // Blockchain
  txHash: string;
  blockNumber: number;
  status: 'pending' | 'cleared' | 'completed';
}
```

### Transfer Rules & Restrictions

```
TRANSFER RULES:

SQUAD RESTRICTIONS:
├─ Max 1 player per position per transfer window
├─ Max 3 outgoing players per window
├─ Max 4 incoming players per window
├─ Must maintain minimum 11 players eligible
├─ Can't sell starting 11 entire formation
│
├─ POSITION-SPECIFIC:
│  ├─ Goalkeepers: Must have 1 backup (2 total)
│  ├─ Defenders: Must have 4+ eligible players
│  ├─ Midfielders: Must have 4+ eligible players
│  └─ Strikers: Must have 2+ eligible players
│
└─ AGE RESTRICTION:
   ├─ Players <18: Transfer requires club consent + league approval
   ├─ Players 18-23: Free agent, can request transfer
   ├─ Players 23+: Can force move if relegated/outside top 50%
   └─ Players 35+: Can only join lower divisions

FINANCIAL RULES:
├─ Transfer fee: 0 - unlimited USDC
├─ Platform fee: 3% of transfer fee
├─ Creator royalty: 2% (remains with original creator)
├─ Salary: Negotiable, min 10 tokens/match
├─ Contract length: 1-5 seasons (26-130 matches)
└─ Budget cap: Teams max 500K USDC spent per summer window

ELIGIBILITY:
├─ Player must complete 1 full season before transfer (or free agent)
├─ Red card suspensions = can't transfer until served
├─ Contract buyout applies if mid-contract
├─ Player can't play until transfer cleared on-chain
└─ Transfer clears within 1 block (~12 seconds)

LOAN DEALS:
├─ Allowed year-round (outside transfer windows too)
├─ Max 1 season (26 matches) per loan
├─ Parent club retains NFT ownership
├─ Salary paid by borrowing club
├─ Loan clubs can't sell loaned player
└─ Automatic return after loan expires
```

### Emergency Transfer Rules (Injury Crisis)

```
INJURY EXEMPTION TRANSFER:

TRIGGERS:
├─ Team has 0 eligible players for position
├─ Caused by: Red card suspension + injury stacking
├─ Example: All 3 strikers suspended/injured = emergency window
├─ Must file formal request with league
└─ Approved within 24 hours if valid

PROCESS:
├─ Team files injury report (medical proof required)
├─ League verifies: 0 eligible players for position
├─ 24-hour emergency window opens for that position
├─ Team can sign 1 free agent OR buy 1 from market
├─ Cost capped at 50K USDC (emergency rate, not market)
├─ Player eligible immediately (next match)
└─ Window closes automatically after 24 hours

RESTRICTIONS:
├─ Can only sign players from lower divisions
├─ Can't sign from direct competitors (top 10 teams)
├─ Max 1 emergency transfer per season per team
├─ Doesn't reset contract length limits
└─ Player must be unattached (free agent status)
```

---

## Match Rules & Enforcement

### Basic Match Rules (FIFA Law of the Game)

```
MATCH DURATION:

Standard Match:
├─ 2 halves of 45 minutes each
├─ Halftime break: 15 minutes
├─ Total match time: 105 minutes
├─ Total in-game frames: 168,300 (at 60 FPS)
├─ Stoppage time added after 45' and 90'
└─ Match can end early: Aggression > threshold

Extra Time (Knockout Competitions):
├─ 2 periods of 15 minutes each
├─ 5 minute break between periods
├─ Golden goal rule (first goal wins) - League specific
├─ If tied after extra: Go to penalties

Penalties:
├─ 5 kicks per team (alternating)
├─ Best of 5 wins
├─ If still tied: "Sudden death" (first to 1 after equal rounds)
├─ Designated taker visible to both teams
└─ Taker can't shoot twice in row (within 5 kicks)
```

```typescript
interface MatchDuration {
  matchType: 'league' | 'cup' | 'friendly' | 'tournament';
  
  // Timing
  standardHalfMinutes: number;      // 45 for league, custom for friendly
  extraTimeMinutes: number;         // 15 per half if needed
  stoppageTimeMinutes: number;      // Added by server
  
  currentFrame: number;             // 0 - matchMaxFrames
  currentHalf: 1 | 2 | 3 | 4;      // 3-4 = extra time
  elapsedSeconds: number;
  remainingSeconds: number;
  
  // Status
  isMatchEnded: boolean;
  finalWhistleFrame: number;
  
  // Stoppage
  stoppageTimeAdded: number;
  reasonsForStoppage: string[];     // Injuries, cards, etc.
}
```

### Offside Rule

```
OFFSIDE MECHANIC:

OFFSIDE DEFINITION:
├─ Player is in offside if:
│  ├─ Nearer to opponent goal than both ball and last defender
│  ├─ At moment of pass (not at receiving moment)
│  └─ Actively involved in play OR gaining advantage
│
├─ NOT offside if:
│  ├─ In own half of field
│  ├─ Receiving from throw-in
│  ├─ Receiving from goal kick
│  ├─ Receiving from corner kick
│  ├─ At same distance as last defender (level is onside)
│  └─ Behind the ball at time of pass

OFFSIDE DETECTION (Deterministic):
├─ Server checks every frame where:
│  ├─ Player in possession
│  ├─ 2+ teammates in attacking third
│  └─ Pass made to teammate >1 meter away
│
├─ Calculation:
│  ├─ PassedFromX = passer position
│  ├─ ReceiverX = receiver position at moment of pass
│  ├─ LastDefenderX = defender closest to goal (same team receiving)
│  └─ If ReceiverX > min(LastDefenderX, BallX) → OFFSIDE
│
└─ Penalties:
   ├─ Indirect free kick to defending team
   ├─ Taken from offside player position
   └─ No card issued (not a foul, technical violation)

IMPLEMENTATION:
```typescript
interface OffsideCheck {
  frame: number;
  passerPosition: Vector3;
  receiverPosition: Vector3;
  defendingTeam: 'home' | 'away';
  
  lastDefenderPositions: Vector3[];
  ballPosition: Vector3;
  
  isOffsideCalled: boolean;
  offsideMargin: number;        // Positive = offside, negative = onside
  
  eventType: 'offside' | 'onside_valid';
}

function detectOffside(
  passer: Player,
  receiver: Player,
  defendingPlayers: Player[],
  ball: Ball
): boolean {
  const receiverX = receiver.position.x;
  const passerX = passer.position.x;
  const goalX = (receiver.team === 'away') ? 120000 : 0; // Goal at end
  
  // Must be moving toward goal
  const isMovingForward = 
    (receiver.team === 'away' && receiverX > passerX) ||
    (receiver.team === 'home' && receiverX < passerX);
  
  if (!isMovingForward) return false;
  
  // Find last defender
  const defendersTowardGoal = defendingPlayers
    .sort((a, b) => {
      const aToGoal = Math.abs(a.position.x - goalX);
      const bToGoal = Math.abs(b.position.x - goalX);
      return aToGoal - bToGoal;
    });
  
  if (defendersTowardGoal.length === 0) return true;
  
  const lastDefenderX = defendersTowardGoal[0].position.x;
  const ballX = ball.posX_mm;
  
  // Offside if ahead of both last defender and ball
  return receiverX > Math.max(lastDefenderX, ballX);
}
```

### Handball Rule

```
HANDBALL MECHANIC:

WHEN HANDBALL IS CALLED:

Deliberate Handball:
├─ Player touches ball with hand/arm
├─ Makes arm larger (unnatural position)
├─ Hand/arm blocks ball path clearly
├─ Ball headed toward goal
├─ In penalty area → PENALTY
├─ Outside penalty area → FREE KICK
├─ Card issued if deliberate: YELLOW or RED

Accidental Handball:
├─ Arm at side naturally
├─ Ball deflects off arm unintentionally
├─ No advantage gained
├─ Free kick awarded, no card
├─ Consideration: Proximity (closer = more likely accidental)

Goalkeeper Exception:
├─ Goalkeeper can handle with hands ONLY:
│  ├─ In penalty area
│  ├─ When field players pass ball to them
│  ├─ NOT if pass was deliberate backpass (indirect FK awarded)
│  └─ NOT from throw-in direct pass
│
├─ If goalkeeper handles outside area → YELLOW + Indirect FK
├─ If goalkeeper handles field pass outside area → Same
└─ Exception: Goalkeeper can punt/throw to field players

IMPLEMENTATION:
```typescript
interface HandballEvent {
  frame: number;
  playerInfringement: string;
  playerTeam: 'home' | 'away';
  ballPosition: Vector3;
  playerArmPosition: Vector3;
  
  isDeliberate: boolean;
  determinationFactors: {
    armDistance: number;        // mm from body
    ballVelocity: number;       // How fast coming
    intentionallyBlocked: boolean;
    gainedAdvantage: boolean;
  };
  
  penaltyAwarded: boolean;      // In penalty area?
  cardIssued?: 'yellow' | 'red';
  foulPosition: Vector3;        // Where FK taken from
}

function detectHandball(
  player: Player,
  ball: Ball,
  frameContext: FrameData
): { isHandball: boolean; isDeliberate: boolean } {
  // Check if hand/arm contacted ball
  const handDistance = calculateNearestHandDistance(player, ball);
  
  if (handDistance > 200) return { isHandball: false, isDeliberate: false };
  
  // Check if deliberate (arm extended unnaturally)
  const armExtension = calculateArmExtensionAngle(player);
  const isUnnatural = armExtension > 30; // degrees from body
  
  // Check if blocking goal-bound ball
  const ballTrajectory = calculateBallTrajectory(ball);
  const isBlockingGoal = ballTrajectory.targetedGoal === player.team;
  
  const isDeliberate = isUnnatural || isBlockingGoal;
  
  return { isHandball: true, isDeliberate };
}
```

### Penalty Kicks

```
PENALTY KICK RULES:

WHEN PENALTY AWARDED:
├─ Handball in penalty area
├─ Foul in penalty area
├─ Violent conduct in penalty area
├─ Denial of goal-scoring opportunity
└─ Dangerous play in penalty area

PENALTY EXECUTION:
├─ Taken from penalty spot (11 meters)
├─ All outfield players outside penalty area
├─ Goalkeeper on goal line (can't advance)
├─ Ball stationary before shot
├─ Taker can only use foot (not hands)
├─ Taker gets 3 seconds to shoot
├─ Other players must wait outside area
└─ Ball in play after shot (if goal or rebound)

PENALTY OUTCOMES:
├─ Goal scored: 3 points to taker
├─ Saved: Ball in play if rebound playable
├─ Miss: Ball in play (goalkeeper distribution)
├─ Post/crossbar: Ball in play
├─ Ball outside area: Thrown back, retake
└─ Taker moves before contact: Retake

IMPLEMENTATION:
```typescript
interface PenaltyKick {
  matchId: string;
  frame: number;
  teamAssigned: 'home' | 'away';
  playerTaking: string;
  
  // Setup
  isTakerReady: boolean;
  isGoalkeeperReady: boolean;
  shotReadyFrame: number;
  
  // Shot Parameters
  kickForce: number;          // 0-100
  kickDirection: Vector2;     // Normalized direction
  kickHeight: number;         // 0-100 (height of shot)
  
  // Outcome
  isGoal: boolean;
  wasSaved: boolean;
  hitPost: boolean;
  
  // Referee Checks
  playerMovedEarly: boolean;
  goalkeeperAdvanced: boolean;
  playerViolation: boolean;   // Player inside area during shot
  
  outcomeFrame: number;
}

class PenaltyShootoutSystem {
  executeShootout(team1: Team, team2: Team, match: Match): {
    winner: Team;
    shootoutResult: PenaltyKick[];
  } {
    const shootout: PenaltyKick[] = [];
    let team1Goals = 0;
    let team2Goals = 0;
    let kicksTaken = 0;
    const maxKicks = 5;
    
    while (kicksTaken < maxKicks && team1Goals === team2Goals) {
      // Team 1 takes shot
      const team1Shot = this.takePenalty(team1, match);
      shootout.push(team1Shot);
      if (team1Shot.isGoal) team1Goals++;
      kicksTaken++;
      
      // Team 2 takes shot
      const team2Shot = this.takePenalty(team2, match);
      shootout.push(team2Shot);
      if (team2Shot.isGoal) team2Goals++;
      kicksTaken++;
    }
    
    // If still tied after 5 rounds, sudden death
    while (team1Goals === team2Goals) {
      const team1Shot = this.takePenalty(team1, match);
      shootout.push(team1Shot);
      if (team1Shot.isGoal) team1Goals++;
      
      const team2Shot = this.takePenalty(team2, match);
      shootout.push(team2Shot);
      if (team2Shot.isGoal) team2Goals++;
    }
    
    const winner = team1Goals > team2Goals ? team1 : team2;
    return { winner, shootoutResult: shootout };
  }
}
```

---

## Player Management & Squad Restrictions

### Squad Composition Rules

```
SQUAD COMPOSITION (Per Match):

FORMATION SELECTION:
├─ Valid formations: 4-4-2, 4-3-3, 3-5-2, 5-3-2, 5-4-1, 3-4-3
├─ Must select exactly 11 players
├─ Must meet positional requirements
│  ├─ Minimum 1 goalkeeper (max 1 can play)
│  ├─ Minimum 3 defenders (various types)
│  ├─ Minimum 3 midfielders
│  └─ Minimum 1 forward
│
└─ DEFENDER POSITIONS:
   ├─ CB (Center Back) - 2 typically
   ├─ LB (Left Back) - 1 typically
   ├─ RB (Right Back) - 1 typically
   ├─ LWB (Left Wing Back) - 1 in 5-back
   └─ RWB (Right Wing Back) - 1 in 5-back

INELIGIBLE PLAYERS (Can't field):
├─ Serving red card suspension
├─ Serving yellow card accumulation ban
├─ Injured (injury status: out for X matches)
├─ Not transferred to club during transfer window
├─ Loaned players (parent club can't field)
├─ Contract expired (must be renewed in off-season)
└─ Age-restricted youth players
```

```typescript
interface SquadSheet {
  matchId: string;
  team: Team;
  submittedFrame: number;
  
  // Formation
  formationId: string;        // e.g., "4-3-3"
  
  // Playing XI (11 players)
  playingXI: SquadPlayer[];
  
  // Bench (up to 7 subs)
  substitutes: SquadPlayer[];
  
  // Designations
  captainPlayerName: string;
  captainArmband: 'official' | 'cosmetic' | 'legacy';
  
  // Captain affects:
  // - Penalty taker priority
  // - Free kick taker priority
  // - Morale boost (+5% to team cohesion)
  
  // Validation
  isValidated: boolean;
  validationErrors: string[];
}

interface SquadPlayer {
  playerTokenId: string;
  playerName: string;
  playerNumber: number;
  position: PlayerPosition;
  
  // Eligibility Check
  suspensionStatus: {
    isSuspended: boolean;
    matchesRemaining: number;
  };
  
  injuryStatus: {
    isInjured: boolean;
    matchesOut: number;
  };
  
  contractStatus: {
    isUnderContract: boolean;
    expiresMatchId: string;
  };
  
  transferStatus: {
    isEligible: boolean;
    reason?: string;  // e.g., "transferred during winter window"
  };
  
  // Role Customization
  tacticRole: string;         // CB, LB, CM, CAM, CF, etc.
  defaultPenaltyTaker: boolean;
  defaultFreeKickTaker: boolean;
  defaultCornerTaker: boolean;
  
  isFieldable(): boolean {
    return !this.suspensionStatus.isSuspended &&
           !this.injuryStatus.isInjured &&
           this.contractStatus.isUnderContract &&
           this.transferStatus.isEligible;
  }
}
```

### Injury System

```
INJURY MECHANICS:

INJURY CAUSES:
├─ Tackle collision (high impact)
├─ Fall on pitch
├─ Contact with post/barrier
├─ Overexertion (stamina depleted + hard run)
├─ Ball collision (rare, to head)
└─ Foul play (tackle without ball)

INJURY SEVERITY:

Minor Injury (3-5 matches):
├─ Muscle strain, minor sprain
├─ Player out: 3-5 matches (randomized per injury)
├─ Recovery: Gradual improvement
├─ Example: Hamstring strain (4 matches)

Moderate Injury (7-14 matches):
├─ Ligament damage, significant strain
├─ Player out: 7-14 matches
├─ Recovery: Slower, can aggravate if played early
├─ Example: Ankle sprain (10 matches)

Serious Injury (Season-ending):
├─ ACL tear, compound fracture
├─ Player out: Remainder of season
├─ Recovery: Next season (auto-restored)
├─ Psychological: Affects player morale

INJURY PROBABILITY:
├─ Base chance: 2-5% per hard tackle
├─ Fatigue modifier: +10% if stamina <30%
├─ Foul modifier: +25% if hard foul involved
├─ Position modifier: Strikers +5%, GK -50%
└─ Seeded for determinism (same seed = same injuries)

RECOVERY:
├─ Injuries decrease by 1 match per match simulation
├─ Player can't participate while injured
├─ Medical staff can't speed recovery (no P2W)
├─ Return-to-play requires 0 matches remaining
└─ Recurrence chance: If played before recovered
```

```typescript
interface PlayerInjury {
  playerName: string;
  playerTeam: string;
  injuryType: 'strain' | 'sprain' | 'fracture' | 'tear' | 'concussion';
  severityLevel: 'minor' | 'moderate' | 'serious' | 'season_ending';
  
  // Timeline
  injuryFrameOccurred: number;
  injuryMatchId: string;
  causedBy?: {
    opponentPlayer: string;
    tackleForce: number;
    wasFoul: boolean;
  };
  
  // Recovery
  matchesOut: number;
  currentMatchesRemaining: number;
  
  // Medical
  recoveryStartsFrame?: number;
  expectedReturnMatch?: string;
  
  // Risk
  recurrenceChance: number;   // 0-100%
  canAggravate: boolean;
  
  // Blockchain
  txHash: string;
  blockNumber: number;
}
```

---

## Competition Rules

### League Rules (Ranked Match Rules)

```
LEAGUE MATCH RULES:

SCORING:
├─ Win: 3 points
├─ Draw: 1 point each
├─ Loss: 0 points
├─ Abandoned (red card expulsion): 0-3 loss (0 pts)
└─ Walkover (missing players): 0-3 loss (0 pts)

TIEBREAKER (Final Standings):
├─ 1. Goal difference (+/- goals)
├─ 2. Goals scored (higher is better)
├─ 3. Head-to-head record
├─ 4. Goal difference in H2H
├─ 5. Coin flip (deterministic seed-based)
└─ No draws (unless playoff required)

MATCH SCHEDULING:
├─ 2 matches per week (12-14 teams → 22 matches each)
├─ Alternating home/away
├─ Minimum 3 days between matches
├─ Fixture congestion: Can't have >2 matches in 3 days
└─ Weather delays: Rescheduled to next available slot

TOURNAMENT RULES:
├─ Group stage: 4 groups of 4 teams
├─ Knockout: Top 2 per group advance
├─ Tiebreaker: Same as league
├─ Extra time: 2 x 15 minutes if tied in knockout
├─ Penalties: If still tied after extra time
└─ Final: Winner gets trophy + 500,000 tokens
```

### Cup Competition Rules

```
CUP TOURNAMENT FORMAT (Mid-Season Cup):

STRUCTURE:
├─ Round 1: Top 32 teams seeded by rank
├─ Knock-out format (single elimination)
├─ Winners advance, losers eliminated
├─ Best of 1 match (no aggregate)
├─ Extra time + penalties if needed

PRIZE POOL:
├─ Winner: 250,000 tokens
├─ Runner-up: 100,000 tokens
├─ Semi-finalists: 50,000 tokens each
├─ Quarter-finalists: 25,000 tokens each
└─ First round bonus: 5,000 tokens for winning

MATCH RULES:
├─ Standard 90 minutes + stoppage
├─ Extra time: 2 x 15 minutes (if tied)
├─ Penalties: Best of 5, sudden death if tied
├─ Home/away: Alternating by seed
└─ Red card expulsion: Team plays with 10 (can't replace)

ELIGIBILITY:
├─ Must not be in bottom 4 (auto-relegated)
├─ Must have played >3 league matches
├─ Can field different squad each round
├─ No suspension carryover (resets per tournament)
└─ Loaned players CAN participate
```

---

## Data Structures & Implementation

### Core Rules Engine

```typescript
class RulesEngine {
  private match: Match;
  private cardHistory: Map<string, CardEvent[]>;
  private suspensionRegistry: Map<string, PlayerSuspension[]>;
  private transferRegistry: Map<string, PlayerTransfer[]>;
  
  // Initialize rules for match
  initialize(match: Match): void {
    this.match = match;
    this.validateSquadEligibility(match);
    this.checkTransferCompliance(match);
    this.loadPlayerSuspensions(match);
    this.validateFormation(match);
  }
  
  // Evaluate fouls and card offenses
  evaluateFoul(
    fouler: Player,
    fouled: Player,
    foulType: string,
    context: FoulContext
  ): { cardIssued?: CardEvent; foulType: string } {
    
    // Determine offense severity
    const severity = this.calculateFoulSeverity(foulType, context);
    
    if (severity === 'violent_conduct') {
      return { cardIssued: this.issueRedCard(fouler, 'violent_conduct') };
    }
    
    if (severity === 'serious_foul_play') {
      return { cardIssued: this.issueRedCard(fouler, 'serious_foul_play') };
    }
    
    if (severity === 'excessive_force') {
      return this.handleYellowCardOffense(fouler, 'excessive_force', context);
    }
    
    // Regular foul (no card)
    return { foulType: 'regular' };
  }
  
  // Issue yellow card with accumulation check
  issueYellowCard(
    player: Player,
    offense: YellowCardOffense
  ): YellowCardEvent {
    const existingYellows = this.getYellowCardsInMatch(player);
    
    const event: YellowCardEvent = {
      matchId: this.match.matchId,
      timestamp: this.match.currentFrame,
      playerName: player.name,
      playerTeam: player.team,
      playerNumber: player.number,
      offense: offense,
      description: `${offense} - ${player.name}`,
      refereeDecision: true,
      isDisputable: true,
      yellowCardCount: existingYellows.length + 1,
      
      // If second yellow → red card
      nextSuspensionFrame: existingYellows.length === 1 ? 
        this.match.currentFrame + 1 : -1
    };
    
    // Record on-chain
    this.recordCardEvent(event);
    
    if (existingYellows.length === 1) {
      // Second yellow = red card
      this.issueRedCard(player, 'second_yellow');
      player.isEjected = true;
    }
    
    return event;
  }
  
  // Issue red card (immediate ejection)
  issueRedCard(
    player: Player,
    offense: RedCardOffense
  ): RedCardEvent {
    const event: RedCardEvent = {
      matchId: this.match.matchId,
      timestamp: this.match.currentFrame,
      playerName: player.name,
      playerTeam: player.team,
      playerNumber: player.number,
      offense: offense,
      description: `${offense} - ${player.name}`,
      refereeDecision: true,
      isDisputable: true,
      isEjected: true,
      
      // Suspension schedule
      matchesAutoSuspended: this.getSuspensionLength(offense),
      startSuspensionFrame: this.match.currentFrame,
    };
    
    // Eject player
    player.isEjected = true;
    player.isActive = false;
    this.match.teamPlayers[player.team] = 
      this.match.teamPlayers[player.team].filter(p => p.name !== player.name);
    
    // Record suspension on-chain
    this.recordSuspension(event);
    
    return event;
  }
  
  // Check suspension status before squad submission
  validateSquadEligibility(match: Match): {
    valid: boolean;
    ineligiblePlayers: string[];
  } {
    const ineligible: string[] = [];
    
    for (const player of match.allPlayers) {
      const suspension = this.suspensionRegistry.get(player.name);
      
      if (suspension && suspension.length > 0) {
        const activeSuspension = suspension.find(s => s.isActive);
        if (activeSuspension && activeSuspension.matchesRemaining > 0) {
          ineligible.push(player.name);
        }
      }
    }
    
    return {
      valid: ineligible.length === 0,
      ineligiblePlayers: ineligible
    };
  }
  
  // Enforce offside rule
  detectOffside(
    passer: Player,
    receiver: Player
  ): { isOffside: boolean; reason?: string } {
    const defendingTeam = passer.team === 'home' ? 'away' : 'home';
    const lastDefender = this.findLastDefender(defendingTeam);
    
    if (!lastDefender) return { isOffside: true };
    
    const receiverBeyond = this.isBeyondPosition(
      receiver.position,
      lastDefender.position,
      passer.team
    );
    
    if (receiverBeyond) {
      return {
        isOffside: true,
        reason: `${receiver.name} is in offside position`
      };
    }
    
    return { isOffside: false };
  }
  
  // Enforce transfer windows
  validateTransfer(
    player: Player,
    fromTeam: Team,
    toTeam: Team
  ): { allowed: boolean; reason?: string } {
    
    // Check if transfer window active
    if (!this.isTransferWindowActive()) {
      return {
        allowed: false,
        reason: 'Transfer window is closed'
      };
    }
    
    // Check player eligibility
    if (player.matchesPlayed < 26) { // 1 season
      return {
        allowed: false,
        reason: 'Player must complete 1 season before transfer'
      };
    }
    
    // Check squad restrictions
    const positionPlayers = toTeam.players.filter(
      p => p.position === player.position && p.isActive
    );
    
    if (positionPlayers.length >= 3) {
      return {
        allowed: false,
        reason: 'Maximum players for this position in squad'
      };
    }
    
    // Check suspension
    const suspension = this.suspensionRegistry.get(player.name);
    if (suspension && suspension.some(s => s.isActive)) {
      return {
        allowed: false,
        reason: 'Cannot transfer while serving suspension'
      };
    }
    
    return { allowed: true };
  }
  
  // Record events on blockchain
  private async recordCardEvent(event: CardEvent): Promise<void> {
    // Call smart contract to record card
    // Smart contract updates player disciplinary record
    // Emits event for replay verification
  }
  
  private async recordSuspension(event: RedCardEvent): Promise<void> {
    // Calculate automatic suspension dates
    // Register in smart contract
    // Player becomes ineligible for matches
    // Appeals process becomes available
  }
  
  private async recordTransfer(transfer: PlayerTransfer): Promise<void> {
    // Update NFT ownership
    // Register new team assignment
    // Lock player until transfer cleared
  }
}
```

---

## Smart Contract Integration

### Disciplinary Smart Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DisciplinaryRegistry {
  
  // Player disciplinary records
  mapping(address => CardRecord[]) public playerCards;
  mapping(address => Suspension[]) public playerSuspensions;
  
  struct CardRecord {
    uint256 matchId;
    uint256 timestamp;
    string offenseType; // 'yellow' or 'red'
    string description;
    bool isDisputed;
    bytes32 replayHash;  // IPFS hash for verification
  }
  
  struct Suspension {
    uint256 startMatch;
    uint256 endMatch;
    uint256 reason; // Offense enum
    uint256 matchesRemaining;
    bool isActive;
    bool canAppeal;
  }
  
  // Events for replay verification
  event CardIssued(
    address indexed player,
    uint256 indexed matchId,
    string cardColor,
    uint256 frame,
    bytes32 replayHash
  );
  
  event SuspensionActivated(
    address indexed player,
    uint256 startMatch,
    uint256 matchesCount,
    string reason
  );
  
  event AppealSubmitted(
    address indexed player,
    uint256 suspensionId,
    bytes32 replayClipHash,
    uint256 deadline
  );
  
  event AppealResolved(
    address indexed player,
    uint256 suspensionId,
    bool upheld
  );
  
  // Issue card (called by match engine)
  function issueCard(
    address player,
    uint256 matchId,
    string memory offense,
    bytes32 replayHash
  ) public onlyMatchEngine {
    playerCards[player].push(
      CardRecord({
        matchId: matchId,
        timestamp: block.timestamp,
        offenseType: offense,
        description: offense,
        isDisputed: false,
        replayHash: replayHash
      })
    );
    
    // Check if second yellow
    uint256 yellowCount = countYellowCards(player, matchId);
    if (yellowCount >= 2) {
      // Trigger red card suspension
      createSuspension(player, matchId, 1);
    }
    
    emit CardIssued(player, matchId, offense, 0, replayHash);
  }
  
  // Create suspension (automatic or appeal outcome)
  function createSuspension(
    address player,
    uint256 startMatch,
    uint256 length
  ) public onlyMatchEngine {
    playerSuspensions[player].push(
      Suspension({
        startMatch: startMatch,
        endMatch: startMatch + length,
        reason: 0,
        matchesRemaining: length,
        isActive: true,
        canAppeal: true
      })
    );
    
    emit SuspensionActivated(player, startMatch, length, "disciplinary");
  }
  
  // Can player participate in match?
  function canParticipateInMatch(
    address player,
    uint256 matchId
  ) public view returns (bool) {
    Suspension[] storage suspensions = playerSuspensions[player];
    
    for (uint i = 0; i < suspensions.length; i++) {
      if (suspensions[i].isActive && matchId <= suspensions[i].endMatch) {
        return false;
      }
    }
    
    return true;
  }
  
  // Appeal suspension
  function submitAppeal(
    address player,
    uint256 suspensionIndex,
    bytes32 replayClipHash
  ) public payable {
    require(msg.value == 0.1 ether, "Appeal filing fee: 0.1 ETH");
    require(playerSuspensions[player][suspensionIndex].canAppeal);
    
    // Create voting period
    // Emit appeal event with replay hash
    emit AppealSubmitted(
      player,
      suspensionIndex,
      replayClipHash,
      block.timestamp + 2 days
    );
  }
}
```

### Transfer Smart Contract

```solidity
contract TransferRegistry {
  
  mapping(bytes32 => TransferListing) public listings;
  mapping(bytes32 => PlayerTransfer) public completedTransfers;
  mapping(address => uint256) public teamBudgets;
  
  struct TransferListing {
    address playerNFTId;
    address currentTeam;
    uint256 askedPrice;
    uint256 listingTime;
    bool isActive;
    bytes32 transferWindowId;
  }
  
  struct PlayerTransfer {
    address player;
    address fromTeam;
    address toTeam;
    uint256 transferFee;
    uint256 timestamp;
    bool isCleared;
  }
  
  // Event for transfer completion
  event PlayerTransferred(
    address indexed player,
    address indexed fromTeam,
    address indexed toTeam,
    uint256 fee
  );
  
  // Execute transfer
  function executeTransfer(
    address playerNFT,
    address buyerTeam,
    uint256 fee
  ) public onlyAuthorized {
    
    // Verify transfer window active
    require(isTransferWindowActive(), "Transfer window closed");
    
    // Check budget
    require(teamBudgets[buyerTeam] >= fee, "Insufficient budget");
    
    // Transfer NFT ownership
    // Update team registration
    // Mark transfer as pending (not cleared until next block)
    
    completedTransfers[keccak256(abi.encode(playerNFT))] = PlayerTransfer({
      player: playerNFT,
      fromTeam: msg.sender,
      toTeam: buyerTeam,
      transferFee: fee,
      timestamp: block.timestamp,
      isCleared: false
    });
    
    emit PlayerTransferred(playerNFT, msg.sender, buyerTeam, fee);
  }
  
  // Clear transfer (make it official)
  function clearTransfer(bytes32 transferId) public onlyMatchEngine {
    completedTransfers[transferId].isCleared = true;
  }
}
```

---

## Verification & Replay Integration

### Replay Verification for Disciplinary Incidents

```typescript
interface DisciplinaryReplayClip {
  clipId: string;
  matchId: string;
  incidentFrame: number;
  startFrame: number;         // 3 seconds before
  endFrame: number;           // 5 seconds after
  
  // Player involved
  offendingPlayer: string;
  offendingTeam: 'home' | 'away';
  affectedPlayer?: string;
  
  // Card issued
  cardType: 'yellow' | 'red';
  offense: string;
  
  // Replay hash
  ipfsHash: string;           // IPFS storage for replay
  deterministicHash: string;  // Deterministic hash of frames
  
  // Verification
  canVerify: boolean;
  isVerified: boolean;
  
  // Appeal
  appealed: boolean;
  appealDeadline: number;
  appealVotes?: {
    voterIds: string[];
    votes: boolean[];         // true = overturn, false = uphold
    verdict?: boolean;
  };
}

async function verifyDisciplinaryReplay(
  match: Match,
  incident: DisciplinaryReplayClip
): Promise<{
  verified: boolean;
  decision: string;
}> {
  
  // Fetch replay clip from IPFS
  const replayData = await fetchFromIPFS(incident.ipfsHash);
  
  // Reconstruct frames around incident
  const reconstructedFrames = reconstructFramesFromState(
    match,
    incident.startFrame,
    incident.endFrame
  );
  
  // Compare with stored replay
  const frameMatch = compareReplayFrames(
    replayData.frames,
    reconstructedFrames
  );
  
  if (!frameMatch) {
    return {
      verified: false,
      decision: 'Replay reconstruction failed'
    };
  }
  
  // Verify card was issued correctly
  const cardCorrect = validateCardOffense(
    match,
    incident.offendingPlayer,
    incident.startFrame,
    incident.offense
  );
  
  return {
    verified: cardCorrect,
    decision: cardCorrect ? 
      'Card decision verified as correct' :
      'Card decision could not be verified'
  };
}
```

### Deterministic Seed For Disciplinary Logic

```typescript
class DeterministicDisciplinaryLogic {
  // All disciplinary decisions use seeded randomness
  // Ensures: Same match state + same seed = same cards
  
  evaluateFoulDeterministically(
    fouler: Player,
    fouled: Player,
    foulType: string,
    matchSeed: string
  ): { cardIssued: boolean; cardType?: 'yellow' | 'red' } {
    
    // Create deterministic RNG from match seed + player IDs
    const rng = new SeededRandom(
      `${matchSeed}_foul_${fouler.id}_${fouled.id}`
    );
    
    // Evaluate severity with seeded randomness
    // Same seed always produces same evaluation
    const severity = this.calculateSeverity(foulType, rng);
    
    if (severity > 0.85) {
      return { cardIssued: true, cardType: 'red' };
    }
    
    if (severity > 0.65) {
      return { cardIssued: true, cardType: 'yellow' };
    }
    
    return { cardIssued: false };
  }
  
  private calculateSeverity(
    foulType: string,
    rng: SeededRandom
  ): number {
    const baseSeverity = this.baselineSeverity[foulType] || 0.5;
    const variance = rng.nextFloat() * 0.3; // ±15% variance
    return Math.min(1.0, baseSeverity + variance - 0.15);
  }
}
```

---

## Summary: FIFA Rules in Bass Ball

| Rule Category | Implementation | Web3 Integration |
|---|---|---|
| **Yellow Cards** | Server-issued, 2x → Red | On-chain record, disputable |
| **Red Cards** | Immediate ejection, 1-10 match ban | Suspension locked in smart contract |
| **Transfers** | Seasonal windows, squad limits | NFT ownership transfer, budget tracking |
| **Suspensions** | Automatic or appeal-based | Smart contract enforcement, voting |
| **Offside** | Deterministic frame-based detection | Logged in match replay |
| **Handball** | Deliberate vs accidental | Video verification via replay |
| **Penalties** | Standard 11m execution | Shootout recorded on-chain |
| **Injuries** | Seeded random occurrence | Calendar tracking, squad impact |
| **Squad Rules** | 11 starting + 7 subs, positional limits | Smart contract eligibility check |
| **League Format** | 3 pts win, tiebreaker rules | On-chain standings update |

All systems are **deterministic**, **verifiable**, and **blockchain-auditable** while maintaining the integrity of real football rules.
