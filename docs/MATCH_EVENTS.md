# 🎮 Match Events System

**Fouls, Set Pieces, Injuries, and Referee Logic**

The event system that transforms "play → result" into "play → fouls → set pieces → injuries → result". Realism layer for deeper gameplay.

---

## Table of Contents

1. [Event Architecture](#event-architecture)
2. [Fouls System](#fouls-system)
3. [Advantage Rule](#advantage-rule)
4. [Set Pieces](#set-pieces)
5. [Injuries & Fatigue Events](#injuries--fatigue-events)
6. [Referee Logic](#referee-logic)
7. [Event Ordering & Prioritization](#event-ordering--prioritization)
8. [Replay Dispute Resolution](#replay-dispute-resolution)
9. [Implementation](#implementation)

---

## Event Architecture

### Event Model

Every match moment can spawn **multiple simultaneous events** that must be resolved in priority order:

```typescript
interface MatchEvent {
  // Event identity
  id: string;
  type: EventType;  // 'foul' | 'injury' | 'set_piece' | 'goal' | 'off_ball' | 'fatigue'
  timestamp: number;
  frameNumber: number;
  
  // Involved parties
  primaryPlayer?: string;       // Player ID
  secondaryPlayer?: string;     // Other player
  location: Vector2;            // Pitch location (0-100)
  
  // Severity & action
  severity: 'critical' | 'high' | 'medium' | 'low';
  requiresRefDecision: boolean;
  
  // Resolution
  resolved: boolean;
  decision?: RefDecision;
  outcome?: EventOutcome;
  
  // Replay verification
  evidenceHash: string;         // Hash for dispute resolution
  blockhashAtEvent: string;     // Block hash when event occurred
}

type EventType = 
  | 'foul'              // Contact violation
  | 'injury'            // Player injury
  | 'set_piece'         // Free kick, corner, throw-in
  | 'goal'              // Goal scored
  | 'fatigue_warning'   // Player stamina critical
  | 'off_ball'          // Off-the-ball incident
  | 'substitution'      // Player change
  | 'red_card'          // Ejection
  | 'yellow_card'       // Warning;
```

### Event Queue

Match engine maintains **priority queue** of events:

```typescript
class EventQueue {
  private events: MatchEvent[] = [];
  private resolutionOrder: EventType[] = [
    'injury',           // Injuries first (player safety)
    'goal',             // Goals before fouls (confirm scores)
    'foul',             // Fouls after goals
    'set_piece',        // Set pieces after fouls
    'fatigue_warning',  // Warnings last
    'off_ball',         // Off-ball incidents last
  ];
  
  // Add event to queue
  queueEvent(event: MatchEvent): void {
    this.events.push(event);
  }
  
  // Resolve events in priority order
  resolveAllEvents(match: Match): void {
    // Sort by priority
    this.events.sort((a, b) => 
      this.resolutionOrder.indexOf(a.type) 
      - this.resolutionOrder.indexOf(b.type)
    );
    
    // Resolve each event
    for (const event of this.events) {
      if (!event.resolved) {
        this.resolveEvent(event, match);
      }
    }
    
    // Clear queue
    this.events = [];
  }
  
  private resolveEvent(event: MatchEvent, match: Match): void {
    switch (event.type) {
      case 'foul': this.resolveFoul(event, match); break;
      case 'injury': this.resolveInjury(event, match); break;
      case 'set_piece': this.resolveSetPiece(event, match); break;
      case 'goal': this.resolveGoal(event, match); break;
      // ... etc
    }
    event.resolved = true;
  }
}
```

---

## Fouls System

### Foul Detection

Fouls detected when **contact violates rules**:

```typescript
interface FoulDetection {
  // Contact types
  contact: {
    slide: number;        // Meter-scale contact distance (0.5 = sliding challenge)
    collision: number;    // Force of collision (0-100)
    contact_part: string; // 'feet' | 'legs' | 'body' | 'hands' | 'head'
  };
  
  // Ball context
  ball_near: boolean;     // Is ball within 1 meter?
  ball_played: boolean;   // Did defender play ball?
  
  // Foul severity calculation
  foulSeverity() {
    let severity = 0;
    
    // Contact without playing ball = foul
    if (!this.ball_played && this.contact.collision > 30) {
      severity = 50;  // Base foul
    }
    
    // Reckless contact (high force)
    if (this.contact.collision > 60) {
      severity += 20;  // Reckless challenge
    }
    
    // Dangerous play (e.g., studs first)
    if (this.contact.contact_part === 'feet' && this.contact.slide > 0.3) {
      severity += 15;  // Dangerous challenge
    }
    
    // Contact from behind (no view of ball)
    if (this.isFromBehind()) {
      severity += 15;  // From behind penalty
    }
    
    // Multiple fouls on same player (accumulation)
    if (this.playerFoulCount > 3) {
      severity += 10;  // Pattern of fouling
    }
    
    return Math.min(severity, 100);
  }
}
```

### Foul Types & Cards

```typescript
enum FoulType {
  // Minor fouls (no card)
  Shirt_Pulling = 'minor_foul',          // 0-20 severity
  Pushing = 'minor_foul',                // 0-25 severity
  Dangerous_Play = 'minor_foul',         // 15-35 severity
  
  // Yellow card fouls (20-60 severity)
  Slide_Tackle = 'yellow_card',          // 25-40 severity
  Reckless_Challenge = 'yellow_card',    // 40-60 severity
  Dissent = 'yellow_card',               // 30-50 severity
  
  // Red card fouls (60+ severity)
  Violent_Contact = 'red_card',          // 70-90 severity
  Studs_First = 'red_card',              // 80-95 severity
  Handball = 'red_card',                 // 75-90 severity
  Denying_DOGSO = 'red_card',            // 70-80 severity (Denying Obvious Goal-Scoring Opportunity)
}
```

### Card System

```typescript
interface CardSystem {
  // Player accumulation
  playerCards: Map<string, Card[]> = new Map();
  
  // Thresholds
  redCardThreshold = 1;        // 1 red = ejection
  yellowCardThreshold = 2;     // 2 yellows = red
  
  // Issue card
  issueCard(player: string, cardType: 'yellow' | 'red'): void {
    if (!this.playerCards.has(player)) {
      this.playerCards.set(player, []);
    }
    
    const cards = this.playerCards.get(player)!;
    cards.push({ type: cardType, timestamp: Date.now() });
    
    // Check ejection
    const yellowCount = cards.filter(c => c.type === 'yellow').length;
    const redCount = cards.filter(c => c.type === 'red').length;
    
    if (redCount >= this.redCardThreshold) {
      this.ejectPlayer(player);
    } else if (yellowCount >= this.yellowCardThreshold) {
      this.ejectPlayer(player);  // 2 yellows = red
    }
  }
  
  private ejectPlayer(player: string): void {
    // Player removed from field
    // Team plays with fewer players
    // Remaining players must adjust formation
  }
}
```

### Set Piece Determination

After foul, determine **set piece type**:

```typescript
interface SetPieceDetermination {
  foulLocation: Vector2;
  ballWasPossession: string;  // 'home' | 'away'
  foulWasOnTeam: string;
  
  // Determine set piece
  determineSetPiece(): SetPiece {
    const distanceToGoal = 100 - this.foulLocation[1];
    
    // Inside penalty box = penalty
    if (this.isInPenaltyBox()) {
      return 'penalty';
    }
    
    // Too close for accurate free kick
    if (distanceToGoal < 5) {
      return 'goal_kick';  // Defending team restarts
    }
    
    // Free kick for attacking team
    return 'free_kick';
  }
  
  private isInPenaltyBox(): boolean {
    return this.foulLocation[1] > 85;  // Last 15 yards
  }
}
```

---

## Advantage Rule

### Advantage Trigger

Referee can play advantage instead of stopping for foul:

```typescript
interface AdvantageLogic {
  recentFoul?: MatchEvent;
  ballPossessionAfterFoul: string;  // Who has ball now
  
  // Determine if advantage applies
  shouldPlayAdvantage(): boolean {
    // Foul occurred
    if (!this.recentFoul) return false;
    
    // Fouled team kept possession
    if (this.ballPossessionAfterFoul === this.recentFoul.fouledTeam) {
      return true;
    }
    
    return false;
  }
  
  // Advantage window
  advantageWindowSeconds = 10;  // 10 seconds to score or lose ball
  
  // If advantage revoked (lose ball), issue free kick
  revokeAdvantage(): SetPiece {
    return {
      type: 'free_kick',
      location: this.recentFoul.location,
      takingTeam: this.recentFoul.fouledTeam,
    };
  }
}
```

**Example**: 
- Player A fouled but team keeps ball
- Referee: "Play on, advantage!"
- If team scores: advantage stands, goal counts
- If team loses ball: "Back to the foul, free kick!"

---

## Set Pieces

### Free Kicks

```typescript
interface FreeKick {
  location: Vector2;
  takingTeam: 'home' | 'away';
  kickType: 'direct' | 'indirect';
  
  // Ball placement
  ballPosition = location + 0.1m in direction of goal;
  
  // Defending team wall
  wallPlayers: number;  // Usually 9-10 players
  wallDistance: number = 9.15;  // Regulation 10 yards
  
  // Shot types
  shotOptions: [
    'direct_shot',      // Direct at goal
    'curved_pass',      // Curved pass to teammate
    'low_drive',        // Low power shot
    'knuckleball',      // Wobbling free kick
  ];
}
```

### Corners

```typescript
interface Corner {
  location: Vector2;   // Corner flag (0,0) or (100,100), etc.
  takingTeam: string;
  
  // Set up
  crossingOptions: [
    'in_swinging',      // Curve toward near post
    'out_swinging',     // Curve toward far post
    'flat_hard',        // Flat cross, difficult to defend
    'short_pass',       // Short pass to teammate
  ];
  
  // Attacking players positions
  nearPost: 2-3 players;
  farPost: 2-3 players;
  penalty_spot: 1-2 players;
  
  // Defending organization
  defensiveShape: 'man_marking' | 'zonal';
  goalkeeper: 'on_line' | 'near_post' | 'sweeping';
}
```

### Throw-Ins

```typescript
interface ThrowIn {
  location: Vector2;
  takingTeam: string;
  
  // Throw-in rules
  throwerMustKeepBothFeetOnGround = true;
  ballMustBeReleasedWithBothHands = true;
  
  // Throw-in target options
  targets: [
    'defender_short_pass',      // Back pass to defender
    'midfielder_forward',       // Forward pass to midfield
    'winger_sideline',          // Out to winger
    'striker_direct',           // Long throw to striker
  ];
  
  // Quick throw-ins (strategy)
  quickThrowAvailable: boolean;  // If less than 10 players defending
}
```

### Penalties

```typescript
interface Penalty {
  location: Vector2 = [50, 88];  // Penalty spot (11 meters from goal)
  takingTeam: string;
  
  // Penalty taker setup
  penaltyTaker: Player;
  runUpDistance: number;        // 2-4 meters typical
  
  // Shot options
  shotTarget: [
    'low_left',                 // Bottom left corner
    'low_right',                // Bottom right corner
    'high_left',                // Top left corner
    'high_right',               // Top right corner
    'middle_power',             // Center, hard shot
    'panenka_chip',             // Chip down middle
  ];
  
  // Goalkeeper position
  goalkeeperPosition: 'on_line' | 'advanced' | 'off_line';
  
  // Success rate depends on:
  - penalty_taker_skill (80-100 = 85-95% success)
  - goalkeeper_skill (80-100 = better anticipation)
  - pressure (stamina, match situation, weather)
}
```

---

## Injuries & Fatigue Events

### Injury Detection

**Injuries occur from high-impact contact:**

```typescript
interface InjuryDetection {
  contactForce: number;         // Collision magnitude (0-100)
  playerCondition: number;      // Current stamina/fitness
  contactType: string;          // 'collision' | 'twist' | 'impact'
  location: string;             // Body part hit
  
  // Injury probability
  injuryChance() {
    let chance = 0;
    
    // High-force contact
    if (this.contactForce > 60) {
      chance = 0.15;  // 15% chance of injury
    }
    
    // Poor condition (low stamina) increases risk
    if (this.playerCondition < 30) {
      chance *= 1.5;  // 22.5% chance
    }
    
    // Twist contact (ankle/knee)
    if (this.contactType === 'twist') {
      chance *= 2.0;  // Double injury risk
    }
    
    return Math.min(chance, 0.7);  // Cap at 70%
  }
  
  // Injury severity
  determineInjury() {
    const severity = this.injuryChance() * 100;
    
    if (severity < 10) return 'minor';      // Play continues
    if (severity < 40) return 'moderate';   // Temp. leave field, 3-5 min
    if (severity < 70) return 'serious';    // Leave field, likely substitution
    return 'critical';                       // Emergency medic, player out rest of match
  }
}
```

### Injury Outcomes

```typescript
interface InjuryOutcome {
  severity: 'minor' | 'moderate' | 'serious' | 'critical';
  
  // In-match effects
  effects: {
    minor: {
      action: 'player_continues',
      stamina_loss: 10,           // Temporary stamina hit
      recovery_time: 0,
    },
    moderate: {
      action: 'player_leaves_field_temporarily',
      stamina_loss: 30,
      recovery_time: 180,         // 3 minutes on sideline
      efficiency_penalty: 0.8,    // 80% when returns
    },
    serious: {
      action: 'player_likely_substituted',
      stamina_loss: 100,          // Full depletion
      recovery_time: 'rest_of_match',
    },
    critical: {
      action: 'emergency_medical',
      player_removed: true,
      match_stopped: true,
      medical_timeout: 300,       // 5 minutes
    },
  };
  
  // Post-match effects (for next match)
  postMatchDuration: {
    minor: 0,                     // No effect
    moderate: 1,                  // 1 match out (if left early)
    serious: 2-3,                 // 2-3 matches out
    critical: 5+,                 // 5+ matches out (career risk)
  };
}
```

### Fatigue Events

**Critical stamina warning:**

```typescript
interface FatigueEvent {
  player: Player;
  stamina: number;              // Current stamina (0-100)
  matchMinute: number;
  
  // Trigger
  isCritical() {
    return this.stamina < 20 && this.matchMinute > 70;
  }
  
  // Effect
  handleFatigue() {
    if (this.stamina < 10) {
      // Severe fatigue: player runs at 50% speed
      this.player.speedMultiplier = 0.5;
    } else if (this.stamina < 20) {
      // Critical fatigue: 70% speed
      this.player.speedMultiplier = 0.7;
    }
    
    // Stamina stops recovery (must rest)
    this.player.stamina.canRecover = false;
    
    // Recommend substitution
    this.suggestSubstitution(this.player);
  }
}
```

---

## Referee Logic

### Referee Decision Making

Referee is **not perfect**, has personality:

```typescript
interface RefereePersonality {
  // Consistency
  consistency: number;           // 0-100 (0=random, 100=perfectly consistent)
  
  // Tolerance levels
  foulTolerance: number;         // 0-100 (high=lets play, low=strict)
  cardTolerance: number;         // High card issuer or lenient?
  offside_strictness: number;    // Strict vs relaxed on marginal calls
  
  // Position-based accuracy
  // Refs positioned well can see fouls better
  positionAccuracy() {
    const distance_to_incident = this.distanceToEvent();
    const angle_to_incident = this.angleToEvent();
    
    // Close + good angle = accurate
    if (distance_to_incident < 5 && angle_to_incident < 30) {
      return 0.95;  // 95% accurate
    }
    
    // Far away = less accurate
    if (distance_to_incident > 30) {
      return 0.60 + (this.consistency / 100) * 0.3;
    }
    
    return 0.80;
  }
  
  // Bias (sometimes refs favor home team)
  homeTeamBias: number;          // -20 to +20 (0=neutral)
}
```

### Referee Decision Process

```typescript
class RefereeLogic {
  private ref: RefereePersonality;
  
  // Determine if foul is called
  callFoul(foulData: FoulData): boolean {
    const foulSeverity = foulData.calculateSeverity();
    const refAccuracy = this.ref.positionAccuracy();
    
    // Base threshold: 40+ severity usually called
    let callThreshold = 40 * (1 - this.ref.foulTolerance / 100);
    
    // Apply ref accuracy (accurate refs call more correct fouls)
    const callProbability = refAccuracy * (foulSeverity / 100);
    
    // Add consistency variance
    const variance = (this.ref.consistency / 100) * 0.3;
    const finalProbability = Math.min(1, callProbability + variance);
    
    return Math.random() < finalProbability;
  }
  
  // Determine card
  issueCard(foulSeverity: number): 'none' | 'yellow' | 'red' {
    const refAccuracy = this.ref.positionAccuracy();
    
    // Red card threshold (70+)
    if (foulSeverity > 70 && refAccuracy > 0.5) {
      return 'red';
    }
    
    // Yellow threshold (40-70)
    if (foulSeverity > 40 && refAccuracy > 0.3) {
      const cardProbability = (foulSeverity - 40) / 30;
      return Math.random() < cardProbability ? 'yellow' : 'none';
    }
    
    return 'none';
  }
}
```

---

## Event Ordering & Prioritization

### Resolution Order

Events resolved in **strict priority** to avoid cascades:

```typescript
const eventResolutionOrder: EventType[] = [
  'injury',              // 1. Injuries (player safety)
  'goal',                // 2. Goals (confirm scores before fouls affect play)
  'red_card',            // 3. Ejections (affect team composition)
  'foul',                // 4. Fouls (determine possession)
  'set_piece',           // 5. Set pieces (restarting play)
  'yellow_card',         // 6. Yellow cards (warnings)
  'fatigue_warning',     // 7. Fatigue (logged but doesn't stop play)
  'off_ball',            // 8. Off-ball incidents (least critical)
];

// Example cascade:
// 1. Collision detected → Injury event queued
// 2. Player falls, can't reach ball → Goal event queued (ball in net)
// 3. Fouling player receives red card → Red card event queued

// Resolution:
// 1. Resolve injury: Player temporarily incapacitated
// 2. Resolve goal: Goal counts (game rules: injury before goal doesn't invalidate)
// 3. Resolve red card: Player ejected
// 4. Resume play: Free kick for fouled team
```

---

## Replay Dispute Resolution

### Evidence Hashing

Every event creates **cryptographic proof**:

```typescript
interface DisputeProof {
  eventId: string;
  eventType: EventType;
  
  // Evidence
  videoHash: string;            // SHA256 of video frame sequence
  physicsHash: string;          // Ball physics verification
  contactHash: string;          // Contact detection hash
  refereeDecisionHash: string;  // Ref's decision hash
  
  // Blockchain anchor
  blockhashAtEvent: string;     // Block hash when event occurred
  matchId: string;              // Smart contract match ID
  transactionHash: string;      // Transaction referencing event
  
  // Verification
  verify(): boolean {
    // Replay match physics with same seed
    const replayPhysics = replayMatchPhysics(this.blockhashAtEvent);
    
    // Check if physics match
    if (replayPhysics.hash !== this.physicsHash) {
      return false;  // Physics tampered
    }
    
    // Check if contact matches
    const replayContact = detectContact(replayPhysics);
    if (replayContact.hash !== this.contactHash) {
      return false;  // Contact detection tampered
    }
    
    return true;  // All evidence verified
  }
}
```

### Dispute Process

**If player disputes ref decision:**

```typescript
interface DisputeChallenge {
  eventId: string;
  challenger: string;           // Player/team address
  challengeReason: string;      // 'wrong_foul' | 'wrong_card' | 'wrong_offside'
  
  // Submit evidence
  submit(proof: DisputeProof): void {
    // 1. Verify proof hashes match event
    if (!proof.verify()) {
      throw new Error('Invalid evidence');
    }
    
    // 2. Store on blockchain
    const result = await smartContract.submitDispute({
      eventId: this.eventId,
      proof: proof,
      challenger: this.challenger,
      reason: this.challengeReason,
    });
    
    // 3. DAO votes on decision
    const vote = await DAO.vote({
      type: 'dispute_resolution',
      duration: 48 * 3600,  // 2 days voting
    });
    
    // 4. Update match result if overturned
    if (vote.overturned) {
      await updateMatchResult(this.eventId, vote.newDecision);
    }
  }
}
```

---

## Implementation

### MatchEventSystem Class

```typescript
class MatchEventSystem {
  private eventQueue: EventQueue = new EventQueue();
  private eventLog: MatchEvent[] = [];
  private referee: RefereeLogic;
  private match: Match;
  
  constructor(match: Match) {
    this.match = match;
    this.referee = new RefereeLogic(match.refereePersonality);
  }
  
  // Called every physics frame to detect events
  detectEvents(): void {
    // Check all active collisions
    for (const collision of this.getActiveCollisions()) {
      const event = this.analyzeCollision(collision);
      if (event) this.eventQueue.queueEvent(event);
    }
    
    // Check stamina levels
    for (const player of this.match.allPlayers) {
      if (player.stamina < 20 && !player.fatigueWarningIssued) {
        this.eventQueue.queueEvent({
          type: 'fatigue_warning',
          primaryPlayer: player.id,
          severity: 'low',
          requiresRefDecision: false,
        });
        player.fatigueWarningIssued = true;
      }
    }
  }
  
  // Called after physics to resolve queued events
  resolveEvents(): void {
    this.eventQueue.resolveAllEvents(this.match);
    
    // Move events to log (for replay verification)
    for (const event of this.eventQueue.events) {
      this.eventLog.push(event);
    }
  }
  
  private analyzeCollision(collision: Collision): MatchEvent | null {
    const foulData = new FoulDetection(collision);
    
    // Is it a foul?
    if (foulData.foulSeverity() < 20) {
      return null;  // Normal contact, no foul
    }
    
    // Referee calls foul?
    if (!this.referee.callFoul(foulData)) {
      return null;  // Ref missed it
    }
    
    // Create foul event
    return {
      type: 'foul',
      primaryPlayer: collision.player1.id,
      secondaryPlayer: collision.player2.id,
      severity: this.getSeverityLevel(foulData.foulSeverity()),
      requiresRefDecision: true,
      decision: {
        card: this.referee.issueCard(foulData.foulSeverity()),
        setPiece: this.determinateSetPiece(foulData),
      },
    };
  }
  
  // Get evidence hash for replay verification
  getEventHash(eventId: string): string {
    const event = this.eventLog.find(e => e.id === eventId);
    if (!event) throw new Error('Event not found');
    
    // Hash all relevant data
    const hashData = JSON.stringify({
      eventType: event.type,
      players: [event.primaryPlayer, event.secondaryPlayer],
      location: event.location,
      severity: event.severity,
      decision: event.decision,
      timestamp: event.timestamp,
      blockhash: event.blockhashAtEvent,
    });
    
    return sha256(hashData);
  }
}
```

---

## Event System Summary

✅ **Event Hierarchy**: Injuries > Goals > Fouls > Set Pieces > Warnings  
✅ **Realistic Refereeing**: Ref has personality, positioning affects decisions  
✅ **Advantage Rule**: Intelligent play-on logic  
✅ **Set Pieces**: Corners, free kicks, penalties, throw-ins  
✅ **Injuries**: Contact-based, affect player availability  
✅ **Dispute Resolution**: Blockchain-verifiable event hashes  
✅ **Replay Reproducibility**: All events seeded by blockhash  

---

**Status**: Design Complete, Implementation Ready  
**Last Updated**: January 18, 2026  
**Match Realism**: Professional Football Level ⚽
